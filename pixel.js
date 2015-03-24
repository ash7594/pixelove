var canvas = document.getElementById("canvas"),
	ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var wCx = canvas.width/2,
	wCy = canvas.height/2;

//////////

var pixelMin = canvas.width * 0.002,
	pixelMax = canvas.width * 0.004;

//////////

function pixel (r) {
	this.x = (Math.random() * 0.8 * canvas.width) + (0.1 * canvas.width);
	this.y = (Math.random() * 0.8 * canvas.height) + (0.1 * canvas.height);
	this.cx = wCx;
	this.cy = wCy;
	this.vx = Math.random() * (pixelMax - pixelMin) + pixelMin;
	this.vy = Math.random() * (pixelMax - pixelMin) + pixelMin;
	this.r = r;
	this.cr = 0;
	this.c = "rgba(255,255,255,0.6)";
}

var pixels = [];
var np = 200;

function init () {
	if(np > 0) {
		pixels.push( new pixel (Math.random() * (pixelMax - pixelMin) + pixelMin) );
		np--;
	}
	for(var i=0;i<pixels.length;i++) {
		if(pixels[i].x != pixels[i].cx) {
			pixels[i].cx += (pixels[i].x > pixels[i].cx)?pixels[i].vx:-1*pixels[i].vx;
		}
		if(pixels[i].y != pixels[i].cy) {
            pixels[i].cy += (pixels[i].y > pixels[i].cy)?pixels[i].vy:-1*pixels[i].vy;
        }
		if(pixels[i].cr < pixels[i].r) pixels[i].cr++;
		else pixels[i].cr = pixels[i].r;
	}
	render();
}

function render () {
	ctx.fillStyle = "rgba(0,0,0,0.5)";
	ctx.fillRect(0,0,canvas.width,canvas.height);
	for(var i=0;i<pixels.length;i++) {
		ctx.beginPath();
		ctx.fillStyle = pixels[i].c;
		ctx.arc(pixels[i].cx,pixels[i].cy,pixels[i].cr,0,2*Math.PI);
		ctx.closePath();
		ctx.fill();
	}
}

setInterval(init,17);
