var sprite = document.getElementById('sprite');
var canvas = document.getElementById("canvas"),
	ctx = canvas.getContext('2d');
var canvas2 = document.getElementById("canvas2"),
	ctx2 = canvas2.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas2.width = window.innerWidth*3;
canvas2.height = window.innerHeight*3;

var wCx = canvas.width/2,
	wCy = canvas.height/2;

//////////
var imgSize = Math.round(canvas.width*2);
var img;

function prel() {
	ctx2.drawImage(sprite,0,0,imgSize,imgSize);
}

var vectors = [];
var movesToAlphabet = 10;
var finalPixelSize = 1;
var drawAlphabet = false;
var trackMoves = 0;
var key = -1;
//////////

var pixelMin = canvas.width * 0.002,
	pixelMax = canvas.width * 0.004;
var velMax = 10,
	velMin = 1;
var offsetDist = canvas.width * 0.03;

//////////

document.addEventListener('keydown',function (event) {
    key = event.keyCode;
}); 

function vector(x,y,mx,my,r) {
	this.x = x;
	this.y = y;
	this.mx = mx;
	this.my = my;
	this.r = r;
}

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
var np = 100;
var tempnp = 0;

function init () {
	if(tempnp < np) {
		pixels.push( new pixel (Math.random() * (pixelMax - pixelMin) + pixelMin) );
		tempnp++;
	}
	for(var i=0;i<pixels.length;i++) {
		if(pixels[i].animate == false) {
			if(pixels[i].cR < pixels[i].R) {
				pixels[i].cR+=3;
			} else {
				pixels[i].cR = pixels[i].R;
				pixels[i].animate = true;
			}
			pixels[i].deg = (pixels[i].deg+0.7)%360;
			pixels[i].cx = wCx + pixels[i].cR * Math.cos(pixels[i].deg * Math.PI/180);
			pixels[i].cy = wCy + pixels[i].cR * Math.sin(pixels[i].deg * Math.PI/180);
		} else {
			pixels[i].x = (pixels[i].x + 2)%360; pixels[i].deg = (pixels[i].deg+0.7)%360;
			pixels[i].y = offsetDist * Math.sin(pixels[i].x * Math.PI/180);
			pixels[i].cx = wCx + (pixels[i].cR + pixels[i].y) * Math.cos(pixels[i].deg * Math.PI/180);
			pixels[i].cy = wCy + (pixels[i].cR + pixels[i].y) * Math.sin(pixels[i].deg * Math.PI/180);
		}		

		if(pixels[i].cr < pixels[i].r) pixels[i].cr++;
		else pixels[i].cr = pixels[i].r;
	}
}

function checkKeyPressed() {
	if(key!=-1) {
		alphabet(key);
	}
	key = -1;
}

function alphabet(key) {
	var num = 0;
	img = ctx2.getImageData((key%16)*parseInt(imgSize/16),parseInt(key/16)*parseInt(imgSize/16),parseInt(imgSize/16),parseInt(imgSize/16));
	for(var i=0;i<img.data.length;i+=4) {
		if(img.data[i] > 0 && img.data[i] < 100) {
			num++;
		}
	}

	//console.log(num);
	var temp = parseInt(num/np);
	console.log(num + " " + temp);

	for(var i=0,j=0,k=0;j<np;i+=4) {
		if(img.data[i] > 0 && img.data[i] < 100) {
			if(k==0) {
				var tx = wCx - parseInt(imgSize/16)/2 + (i/4)%parseInt(imgSize/16);
				var ty = wCy - parseInt(imgSize/16)/2 + (i/4)/parseInt(imgSize/16);
				var mx = (tx-pixels[j].cx)/movesToAlphabet;
				var my = (ty-pixels[j].cy)/movesToAlphabet;
				var r = (pixels[j].cr-finalPixelSize)/movesToAlphabet;
				vectors.push(new vector(tx,ty,mx,my,r));
				j++;
			}
			k = (k+1)%temp;
		}
	}
	drawAlphabet = true;
}

function updateAlphabet() {
	if(trackMoves<movesToAlphabet) {
		for(var i=0;i<pixels.length;i++) {
			pixels[i].cx += vectors[i].mx;
            pixels[i].cy += vectors[i].my;
			pixels[i].cr -= vectors[i].r; 
		}
		trackMoves++;
	} else {
		for(var i=0;i<vectors.length;i++) {
            pixels[i].cx = vectors[i].x;
            pixels[i].cy = vectors[i].y;
			pixels[i].cr = finalPixelSize;
        }
	}
}

function render () {
	//////
	checkKeyPressed();

	if(!drawAlphabet) {
		init();
	} else {
		updateAlphabet();
	}
	//////
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

setInterval(render,17);
window.onload = prel;
