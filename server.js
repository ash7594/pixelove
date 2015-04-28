var express = require("express");
var mysql = require("mysql");
var mysqlCred = require("mysqlCred");
var app = express();

app.use(express.static(__dirname + "/public"));
app.set("view engine","ejs");
app.set("views", __dirname + "/views");
app.set("view options", {layout: false});

var server = require("http").Server(app);
var io = require("socket.io")(server);
var crypto = require("crypto");
/////////////////
var nicks = {};
var hashs = {};
var sessions = [];
var roombids = [];
var nickfail = "Looks like another mom had that idea :P<br>Try Again!";
var chatTime = 30;

/////////////////

var pool = mysql.createPool({
    connectionLimit: 100,
    host: "localhost",
    user: mysqlCred.user(),
    password: mysqlCred.password(),
    database: "pixelove",
    debug: false
});

app.get("/",function(req,res) {
	//console.log(req.query.key);
	if(typeof req.query.checksum == "undefined") {
		res.render("index");
	} else {
		if(req.query.checksum in hashs) {

			if(typeof nicks[hashs[req.query.checksum]].session != "undefined") {
				res.render("key",{key: nicks[hashs[req.query.checksum]].session});
			} else {
			var session;
			do {
				session = Math.floor(Math.random() * 9000 + 1000);
			} while(sessions[session]);
			console.log(session);
			createRecordRoomID(req.query.checksum, session);
			sessions[session] = [];
			sessions[session].push(hashs[req.query.checksum]);
			nicks[hashs[req.query.checksum]].join(session);
			nicks[hashs[req.query.checksum]].session = session;
			roombids[session] = [];
			roombids[session].push({token:hashs[req.query.checksum],start:false,bid:0,msg:""});
			roombids[session].push({token:"",start:false,bid:0,msg:""});
			//delete hashs[req.query.checksum];
			res.render("key",{key: session});
			}
		} else {
			res.send("<h3>Bad session or key already given...</h3>");
		}
	}
});

io.on("connection", function(socket) {
	console.log("connected");
	
	socket.on("disconnect",function() {
		console.log("disconnected");
		if(typeof socket.nickname != "undefined" && typeof socket.session != "undefined") {
			var index = sessions[socket.session].indexOf(socket.nickname);
			sessions[socket.session].splice(index,1);
			socket.leave(socket.session);
			if(sessions[socket.session].length == 0) {
				sessions[socket.session] = null;
			}
			io.to(socket.session).emit("member change",sessions[socket.session]);
		}
	});

	socket.on("message group_pressed",function(msg) {
		//console.log(socket.nickname+": "+msg);
		if(!roombids[socket.session][0].start) {
			roombids[socket.session][0].start = true;
			io.to(socket.session).emit("new token possession",{token:socket.nickname,time:chatTime,bid:0});
			setTimeout(function() {nextSpeaker(socket.session);},chatTime * 1000);
		}
		roombids[socket.session][0].msg += String.fromCharCode(msg);
		//console.log(roombids[socket.session][0].msg);
		io.to(socket.session).emit("message receive",{sender:socket.nickname,message:msg,keyreleased:false});
		//io.emit("message receive",{sender:socket.nickname,message:msg,keyreleased:false})
	});

	socket.on("message group_released",function() {
		io.to(socket.session).emit("message receive",{sender:socket.nickname,keyreleased:true});
	});

	socket.on("nickAuth",function(data,callback) {
		//console.log(data);
		if(data in nicks) {
			callback({isValid: false, msg: nickfail});
		} else {
			socket.nickname = data;
			nicks[data] = socket;
			var current_date = (new Date()).valueOf().toString();
			var random = Math.random().toString();
			var hash = crypto.createHash('md5').update(current_date + random).digest('hex');
			hashs[hash] = data;
			callback({isValid: true, qrgenkey: "http://aadb535d.ngrok.io/?checksum="+hash});
		}
	});
	
	socket.on("new session",function(sessionkey) {
		createRecordUsers(sessionkey, sessions[sessionkey][0]);
		nicks[sessions[sessionkey]].emit("session auth done");
		nicks[sessions[sessionkey]].emit("member change",sessions[sessionkey]);
	});

	socket.on("join group",function(data,callback) {
		if(typeof data != "undefined") {
			if(sessions[data]) {
				createRecordUsers(data, socket.nickname);
				socket.session = data;
				sessions[data].push(socket.nickname);
				socket.join(data);
				io.to(socket.session).emit("member change",sessions[data]);
				callback({ isValid: true });
			} else {
				callback({ isValid: false });
			}
		} else {
           	callback({ isValid: false });
       	}
	});

	socket.on("bidSet",function(data) {
		pool.getConnection(function(err,connection) {
        	if(err) {
            	connection.release();
            	return;
        	}
        	connection.query("select userId from roomUsers where roomId = ? and nick = ?",[socket.session,socket.nickname],function(err,rows) {
            	if(err) {
                	connection.release();
                	return;
            	}
            	var values = { userId: rows[0].userId, bidAmt: data };
            	connection.query("insert into bids set ?",values,function (err,result) {
                	connection.release();
                	if(err) throw err;
                	//else console.log(result);
					if(data >= roombids[socket.session][1].bid) {
            			roombids[socket.session][1].bid = data;
            			roombids[socket.session][1].token = socket.nickname;
        			}
            	});
        	});
    	});

		/*
		if(data >= roombids[socket.session][1].bid) {
			roombids[socket.session][1].bid = data;
			roombids[socket.session][1].token = socket.nickname;
		}*/
	});

});

function nextSpeaker(session) {
	pool.getConnection(function(err,connection) {
		if(err) {
			connection.release();
			return;
		}
		connection.query("select userId from roomUsers where roomId = ? and nick = ?",[session,roombids[session][0].token],function(err,rows) {
			if(err) {
				connection.release();
				return;
			}
			var values = { userId: rows[0].userId, message: roombids[session][0].msg };
        	console.log(values);
			connection.query("insert into chatdata set ?",values,function (err,result) {
            	connection.release();
            	if(err) throw err;
				if(roombids[session][1].bid == 0) {
        //roombids[session][1].token = sessions[session][parseInt(Math.random()*sessions[session].length)];
        			roombids[session][1].token = sessions[session][0];
    			}

    			roombids[session][0].token = roombids[session][1].token;
    			roombids[session][0].bid = roombids[session][1].bid;
    			roombids[session][0].msg = "";
    			roombids[session][1].bid = 0;
    			io.to(session).emit("new token possession",{token:roombids[session][0].token,time:chatTime,bid:roombids[session][0].bid});
    			setTimeout(function() {nextSpeaker(session);},chatTime * 1000);
            	//else console.log(result);
        	});
		});
	});
	/*
	if(roombids[session][1].bid == 0) {
		//roombids[session][1].token = sessions[session][parseInt(Math.random()*sessions[session].length)];
		roombids[session][1].token = sessions[session][0];
	}

    roombids[session][0].token = roombids[session][1].token;
    roombids[session][0].bid = roombids[session][1].bid;
    roombids[session][0].msg = "";
	roombids[session][1].bid = 0;
    io.to(session).emit("new token possession",{token:roombids[session][0].token,time:chatTime,bid:roombids[session][0].bid});
	setTimeout(function() {nextSpeaker(session);},chatTime * 1000);
	*/
}

function createRecordRoomID(session, roomid) {
	pool.getConnection(function(err,connection) {
		if(err) {
			connection.release();
			return;
		}
		var values = { sessionHash: session, roomId: roomid };
		connection.query("insert into roomAuth set ?",values,function (err,result) {
			connection.release();
			if(err) throw err;
			//else console.log(result);
		});
	});
}

function createRecordUsers(roomid, nickname) {
	pool.getConnection(function(err,connection) {
		if(err) {
			connection.release();
			return;
		}
		var values = { roomId: roomid, nick: nickname };
		connection.query("insert into roomUsers set ?",values,function (err,result) {
			connection.release();
			if(err) throw err;
			//else console.log(result);
		});
	});
}

server.listen(8080);
console.log("Listening on port 8080...");
