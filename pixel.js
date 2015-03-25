var canvas = document.getElementById("canvas"),
	ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var wCx = canvas.width/2,
	wCy = canvas.height/2;

//////////

var pixelMin = canvas.width * 0.002,
	pixelMax = canvas.width * 0.004;
var velMax = 10,
	velMin = 1;

//////////

function pixel (r) {
	this.x = 0;
	this.y = 0;
	this.cx = 0;
	this.cy = 0;
	this.R = canvas.width * 0.15;
	this.cR = 0;
	this.vx = Math.random() * (velMax - velMin) + velMin;
	this.deg = Math.random() * 360;
	this.r = r;
	this.cr = 0;
	//this.c = "rgba("+Math.round(Math.random()*200+50)+","+Math.round(Math.random()*200+50)+","+Math.round(Math.random()*200+50)+",0.6)";
	this.c = "rgba(255,255,255,0.6)";
	this.animate = false;
}

var pixels = [];
var np = 500;

function init () {
	if(np > 0) {
		pixels.push( new pixel (Math.random() * (pixelMax - pixelMin) + pixelMin) );
		np--;
	}
	for(var i=0;i<pixels.length;i++) {
		if(pixels[i].animate == false) {
			if(pixels[i].cR < pixels[i].R) {
				pixels[i].cR+=2;
			} else {
				pixels[i].cR = pixels[i].R;
				pixels[i].animate = true;
			}
			pixels[i].cx = wCx + pixels[i].cR * Math.cos(pixels[i].deg * Math.PI/180);
			pixels[i].cy = wCy + pixels[i].cR * Math.sin(pixels[i].deg * Math.PI/180);
		} else {
			pixels[i].x = (pixels[i].x + 2)%360; pixels[i].deg = (pixels[i].deg+0.7)%360;
			pixels[i].y = 25 * Math.sin(pixels[i].x * Math.PI/180);
			pixels[i].cx = wCx + (pixels[i].cR + pixels[i].y) * Math.cos(pixels[i].deg * Math.PI/180);
			pixels[i].cy = wCy + (pixels[i].cR + pixels[i].y) * Math.sin(pixels[i].deg * Math.PI/180);
		}		

		if(pixels[i].cr < pixels[i].r) pixels[i].cr++;
		else pixels[i].cr = pixels[i].r;
	}
	render();
}

function render () {
	ctx.fillStyle = "rgba(0,0,0,0.2)";
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
