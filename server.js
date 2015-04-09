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
	if(typeof req.query.key == "undefined") {
		res.render("index");
	} else {
		if(req.query.key in hashs) {
			var session;
			do {
				session = Math.floor(Math.random() * 1000 + 1000);
			} while(sessions[session]);
			sessions[session] = hashs[req.query.key];
			nicks[hashs[req.query.key]].session = session;
			delete hashs[req.query.key];
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

	socket.on("message",function(msg) {
		console.log("msg: "+msg);
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
			callback({isValid: true, qrgenkey: "http://10.1.73.104:8080/?key="+hash});
		}
	});
	
	socket.on("new session",function(sessionkey) {
		nicks[sessions[sessionkey]].emit("session auth done");
	});

});

server.listen(8080);
console.log("Listening on port 8080...");
