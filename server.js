var express = require("express");
var app = express();

app.use(express.static(__dirname + "/public"));
app.set("view engine","ejs");
app.set("views", __dirname + "/views");
app.set("view options", {layout: false});

var server = require("http").Server(app);
var io = require("socket.io")(server);
/////////////////
var nicks = {};
var nickfail = "Looks like another mom had that idea :P<br>Try Again!";

/////////////////

app.get("/",function(req,res) {
	res.render("index");
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
			callback({isValid: true});
		}
	});
});

server.listen(8080);
console.log("Listening on port 8080...");
