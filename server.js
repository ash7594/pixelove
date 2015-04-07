var express = require("express");
var app = express();

app.use(express.static(__dirname + "/public"));
app.set("view engine","ejs");
app.set("views", __dirname + "/views");
app.set("view options", {layout: false});

var http = require("http").Server(app);
var io = require("socket.io")(http);

app.get("/",function(req,res) {
	res.render("index");
});

app.listen(8080);
console.log("Listening on port 8080...");
