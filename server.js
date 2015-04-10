var express = require("express");
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
var nickfail = "Looks like another mom had that idea :P<br>Try Again!";

/////////////////

app.get("/",function(req,res) {
	//console.log(req.query.key);
	if(typeof req.query.checksum == "undefined") {
		res.render("index");
	} else {
		if(req.query.checksum in hashs) {
			var session;
			do {
				session = Math.floor(Math.random() * 9000 + 1000);
			} while(sessions[session]);
			sessions[session] = [];
			sessions[session].push(hashs[req.query.checksum]);
			nicks[hashs[req.query.checksum]].join(session);
			nicks[hashs[req.query.checksum]].session = session;
			delete hashs[req.query.checksum];
			res.render("key",{key: session});
		} else {
			res.send("<h3>Bad session or key already given...</h3>");
		}
	}
});

io.on("connection", function(socket) {
	console.log("connected");
	
	socket.on("disconnect",function() {
		console.log("disconnected");
	});

	socket.on("message group_pressed",function(msg) {
		console.log(socket.nickname+": "+msg);
		io.to(socket.session).emit("message receive",{sender:socket.nickname,message:msg,keyreleased:false});
		//io.emit("message receive",{sender:socket.nickname,message:msg,keyreleased:false})
	});

	socket.on("message group_released",function() {
		io.to(socket.session).emit("message receive",{sender:socket.nickname,keyreleased:true});
	});

	socket.on("nickAuth",function(data,callback) {
		console.log(data);
		if(data in nicks) {
			callback({isValid: false, msg: nickfail});
		} else {
			socket.nickname = data;
			nicks[data] = socket;
			var current_date = (new Date()).valueOf().toString();
			var random = Math.random().toString();
			var hash = crypto.createHash('md5').update(current_date + random).digest('hex');
			hashs[hash] = data;
			callback({isValid: true, qrgenkey: "http://10.1.73.104:8000/?checksum="+hash});
		}
	});
	
	socket.on("new session",function(sessionkey) {
		nicks[sessions[sessionkey]].emit("session auth done");
		nicks[sessions[sessionkey]].emit("member change",sessions[sessionkey]);
	});

	socket.on("join group",function(data,callback) {
		if(typeof data != "undefined") {
			if(sessions[data]) {
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

});

server.listen(8000);
console.log("Listening on port 8000...");
