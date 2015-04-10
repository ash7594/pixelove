var sprite = document.getElementById('sprite');
var canvas = document.getElementById("canvas"),
	ctx = canvas.getContext('2d');
var canvas2 = document.getElementById("canvas2"),
	ctx2 = canvas2.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight * 0.71;
//canvas.height = canvas.style.height;

var initing = true;
var initValue = 0;
var wCx = canvas.width/2,
	wCy = canvas.height/2;
var initRad = canvas.width * 0.15;

//////////
var imgSize = parseInt(16*parseInt(Math.sqrt(2)*initRad));
var img;

canvas2.width = canvas2.height = imgSize;

function prel() {
	ctx2.drawImage(sprite,0,0,imgSize,imgSize);
}

var vectors = [];
var movesToAlphabet = 10;
var finalPixelSize = 1;
var drawAlphabet = false;
var trackMoves = 0;
var key = -1;
var keyCatered = 0;
var middlecase = 0;
//////////

var initSpeed = 5;
var pixelMin = canvas.width * 0.002,
	pixelMax = canvas.width * 0.004;
var velMax = 10,
	velMin = 1;
var offsetDist = initRad/10;
var selfmsg = false;
var spaceStruck = false;
//////////

document.addEventListener('keypress',function (event) {
    //if(event.charCode>
	if(event.charCode>33 && event.charCode<127) {
		key = event.charCode;
		selfmsg = true;
	} else if(event.charCode == 32) {
		spaceStruck = true;
		socket.emit("message group_pressed",32);
	}
});
document.addEventListener('keyup',function (event) {
	key = -1;
	selfmsg = false;
	spaceStruck = false;
	socket.emit("message group_released");
});

function vector(x,y,mx,my,r,ix,iy,imx,imy) {
	this.x = x;
	this.y = y;
	this.mx = mx;
	this.my = my;
	this.r = r;
	this.ix = ix;
	this.iy = iy;
	this.imx = imx;
	this.imy = imy;
}

function pixel (r) {
	this.x = 0;
	this.y = 0;
	this.cx = 0;
	this.cy = 0;
	this.R = initRad;
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
var np = 400;
var tempnp = 0;

function init () {
	if(tempnp < np) {
		pixels.push( new pixel (Math.random() * (pixelMax - pixelMin) + pixelMin) );
		tempnp++;
	}
	for(var i=0;i<pixels.length;i++) {
		if(pixels[i].animate == false) {
			if(pixels[i].cR < pixels[i].R) {
				pixels[i].cR+=initSpeed;
			} else {
				pixels[i].cR = pixels[i].R;
				pixels[i].animate = true;
				initValue++;
			}
			//pixels[i].deg = (pixels[i].deg+0.7)%360;
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
	if(initValue == np) initing=false;
}

function checkKeyPressed() {
	if((key!=-1 && keyCatered!=key) || (key!=-1 && middlecase==1)) {
		if(trackMoves != movesToAlphabet) {
			keyCatered = key;
			if(selfmsg) socket.emit("message group_pressed",key);
			alphabet(key);
		}
	}
}

function alphabet(key) {
	
	var num = 0;
	img = ctx2.getImageData((key%16)*(imgSize/16),(parseInt(key/16)*(imgSize/16)),(imgSize/16),(imgSize/16));
	for(var i=0;i<img.data.length;i+=4) {
		if(img.data[i] > 0 && img.data[i] < 100) {
			num++;
		}
	}

	//console.log(num);
	var temp = parseInt(num/np);
	//console.log(num + " " + temp);

	for(var i=0,j=0,k=0;j<np;i+=4) {
		if(img.data[i] > 0 && img.data[i] < 100) {
			if(k==0) {
				var tx = wCx - (imgSize/16)/2 + (i/4)%parseInt(imgSize/16);
				var ty = wCy - (imgSize/16)/2 + (i/4)/parseInt(imgSize/16);
				var mx = (tx-pixels[j].cx)/(movesToAlphabet-trackMoves);
				var my = (ty-pixels[j].cy)/(movesToAlphabet-trackMoves);
				var r = (pixels[j].cr-finalPixelSize)/(movesToAlphabet-trackMoves);
				var ix = pixels[j].cx;
				var iy = pixels[j].cy;
				if(vectors.length != np) {
					vectors.push(new vector(tx,ty,mx,my,r,ix,iy,mx,my));
				} else {
					vectors[j].x = tx;
					vectors[j].y = ty;
					vectors[j].mx = mx;
					vectors[j].my = my;
					vectors[j].r = r;
					vectors[j].imx = (tx-vectors[j].ix)/(movesToAlphabet);
					vectors[j].imy = (ty-vectors[j].iy)/(movesToAlphabet);
				}
				j++;
			}
			k = (k+1)%temp;
		}
	}
	drawAlphabet = true;
}

function updateAlphabet() {
	if(key==-1) {
		if(vectors[0].mx!=vectors[0].imx || vectors[0].my!=vectors[0].imy) {
			middlecase = 1;
		}
		for(var i=0;i<pixels.length;i++) {
            pixels[i].cx -= vectors[i].imx;
            pixels[i].cy -= vectors[i].imy;
            pixels[i].cr += vectors[i].r;
        }
        trackMoves--;
		if(trackMoves==0) {
			middlecase = 0;
			drawAlphabet = false;
			vectors = [];
			keyCatered = 0;
		}
	}
	else if(trackMoves<movesToAlphabet) {
		middlecase = 0;
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
			vectors[i].mx = vectors[i].imx;
			vectors[i].my = vectors[i].imy;
        }
	}
}

function render () {
	//////
	if(!initing) checkKeyPressed();

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

//setInterval(render,17);
window.onload = prel;
