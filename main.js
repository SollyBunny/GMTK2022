(new FontFace("PixeloidMono", "url(font/PixeloidMono.ttf)")).load().then((font) => {
	document.fonts.add(font);
	if (ctx) ctx.font = "20px PixeloidMono";
});

const cos = Math.cos;
const sin = Math.sin;
const pi  = Math.PI;

let tutorial = 1;
let dicespawnid = undefined;

let state = 0;
let can, ctx;
let keys = {};
let keytime = 0;

let e_title, e_dice;

class Pos {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

class Obj {
	constructor(x, y, dir, name, data) {
		this.name = name
		this.x = x;
		this.y = y;
		this.dir = dir;
		this.vel = 0;
		this.dvel = 0;
		this.data = data
	}
}

let objs = [];
let player = new Obj(0, 0, 0, "player");
let camera = new Pos(0, 0);

window.onkeydown = () => {
	if (state == 0) return;
	keys[event.keyCode] = true;
	keytime = undefined;
};
window.onkeyup = () => {
	keys[event.keyCode] = false;
};

window.onresize = () => {
	can.width = window.innerWidth;
	can.height = window.innerHeight;
};

window.onload = () => {
	e_title = document.getElementById("title");
	e_title.onclick = () => {
		e_title.style.marginTop = "-120vh";
		state = 1;
		music.play();
		if (tutorial === 1) {
			objs.push(new Obj(
				150, 20, undefined, "text", "use WASD to move!"
			));
		} else {
			dicespawnid = window.setInterval(spawndie, 5000);
			spawndie();
		}
	};
	e_dice = document.getElementById("dice");

	can = document.getElementById("canvas");
	ctx = can.getContext("2d");
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";
	ctx.font = "20px PixeloidMono";
	ctx.imageSmoothingEnabled = false;
	window.onresize();
	window.requestAnimationFrame(frame);	
};

function die() {
	state = 0;
	player = new Obj(0, 0, 0, "player");
	e_title.style.marginTop = 0;
	objs = [];
	window.cancelInterval(dicespawnid);
}

function spawndie() {
	objs.push(new Obj(0, player.y - 1500, 0, "dice"));
}

let lastt = 0, dt = 0;
function frame(t) {
	dt = t - lastt;
	lastt = t;
	if (keytime === undefined) keytime = t;

	ctx.resetTransform();

	ctx.globalAlpha = 0.5;
	ctx.fillStyle = "#221d52";
	ctx.fillRect(0, 0, can.width, can.height);

	// Grid lines;
	// ctx.lineWidth = 1;
	ctx.strokeStyle = "#6d3493";
	ctx.beginPath();
	let off = (camera.y % 50) + (t / 20 % 50);
	for (let i = -2; i < can.height / 50 + 2; ++i) { // y lines
		ctx.moveTo(0, i * 50 - off);
		ctx.lineTo(can.width, i * 50 - off);
	}
	off = (camera.x % 50) + (t / 20 % 50);
	for (let i = -2; i < can.width / 50 + 2; ++i) { // x lines
		ctx.moveTo(i * 50 - off, 0);
		ctx.lineTo(i * 50 - off, can.height);
	}

	ctx.translate(
		Math.floor(can.width  / 2 - camera.x),
		Math.floor(can.height / 2 - camera.y)
	);
	
	ctx.closePath();
	ctx.stroke();

	// Player
	ctx.globalAlpha = 0.7;
	ctx.lineWidth = 3;
	ctx.strokeStyle = "#e63695";
	ctx.beginPath();
	ctx.moveTo(player.x - sin(player.dir) * 25, player.y - cos(player.dir) * 25);
	ctx.lineTo(player.x + sin(player.dir) * 25 - cos(player.dir) * 20, player.y + cos(player.dir) * 25 - sin(player.dir) * 20);
	ctx.lineTo(player.x + sin(player.dir) * 25 + cos(player.dir) * 20, player.y + cos(player.dir) * 25 + sin(player.dir) * 20);
	ctx.lineTo(player.x - sin(player.dir) * 25, player.y - cos(player.dir) * 25);
	ctx.closePath();
	ctx.stroke();
	ctx.lineWidth = 1;
	ctx.strokeStyle = "#fef7fa";
	ctx.beginPath();
	ctx.moveTo(player.x - sin(player.dir) * 25, player.y - cos(player.dir) * 25);
	ctx.lineTo(player.x + sin(player.dir) * 25 - cos(player.dir) * 20, player.y + cos(player.dir) * 25 - sin(player.dir) * 20);
	ctx.lineTo(player.x + sin(player.dir) * 25 + cos(player.dir) * 20, player.y + cos(player.dir) * 25 + sin(player.dir) * 20);
	ctx.lineTo(player.x - sin(player.dir) * 25, player.y - cos(player.dir) * 25);
	ctx.closePath();
	ctx.fillStyle = "#2d2f78";
	ctx.fill();
	ctx.stroke();

	// Walls
	ctx.globalAlpha = 0.2;
	ctx.fillStyle = "#6d3493";
	if (tutorial && -camera.y < can.height) {
		ctx.fillRect(-400, 300, 800, 10);
		ctx.fillRect(-400, 300, 10, camera.y - 300 - can.height / 2);
		ctx.fillRect(390, 300, 10, camera.y - 300 - can.height / 2);
	} else {
		if (tutorial === 1) { // turn of tutorial once reached threshold
			tutorial = 0;
			objs = objs.filter((i) => { // remove tutorial text
				return i.data !== "use WASD to move!";
			});
			// start spawning!
			dicespawnid = window.setInterval(spawndie, 5000);
			spawndie();
		}
		ctx.fillRect(-400, camera.y - can.height / 2, 10, can.height);
		ctx.fillRect(390, camera.y - can.height / 2, 10, can.height);
	}

	if (state !== 0) {

		objs.forEach((i) => {
			switch (i.name) {
				case "text":
					ctx.fillStyle = "#f490a9"
					ctx.fillText(i.data, i.x, i.y);
					break;
				case "dicedecay":
					ctx.globalAlpha = 0.2;
					ctx.fillStyle = "#6d3493";
					ctx.fillRect(-390, i.y - 5, 390 - i.data, 10);
					ctx.fillRect(i.data, i.y - 5, 390 - i.data, 10);
					i.data += 5;
					if (i.data > 390) i.name = undefined;
					break;
				case "dice":
					i.y += 0.5;
					if (camera.y - i.y - 24 > can.height / 2) break; // skip if not on screen
					if (camera.y - i.y < 10) { // player collide
						console.log(i.data);
						i.name = "dicedecay";
						i.data = 0;
						break;
					}
					ctx.save();
					if (i.dir < 2 * pi) {
						if (i.dir % 0.3 === 0) i.data = Math.floor(Math.random() * 6);
						i.dir = Math.ceil((i.dir + 0.1) * 10) / 10;
						if (i.dir > 2 * pi) i.dir = 2 * pi;
					}
					ctx.globalAlpha = 0.9;
					ctx.translate(i.x, i.y);
					ctx.rotate(i.dir);
					ctx.drawImage(
						e_dice,
						48 * i.data,
						0,
						48,
						48,
						-24,
						-24,
						48,
						48
					);
					ctx.restore();
					ctx.globalAlpha = 0.2;
					ctx.fillStyle = "#6d3493";
					ctx.fillRect(-390, i.y - 5, 366, 10);
					ctx.fillRect(24, i.y - 5, 366, 10);
					break;
			}
		});
		objs = objs.filter((i) => { return i !== undefined; });

		if (t - keytime > 10000) { // idle after 10s

			player.dvel += 0.005; // a
			
		} else {

			if      (keys[65]) player.dvel += 0.01; // a
			else if (keys[68]) player.dvel -= 0.01; // d

			if      (keys[87]) player.vel  += 0.08; // w
			else if (keys[83]) player.vel  -= 0.01; // s

		}

		player.x   -= player.vel * sin(player.dir);
		player.y   -= player.vel * cos(player.dir);
		player.dir += player.dvel;

		if (player.x < -380) {
			player.x += (-380 - player.x) * 0.3;
		} else if (player.x > 380) {
			player.x += (380 - player.x) * 0.3;
		}
		if (tutorial && player.y > 280) {
			player.y += (280 - player.y) * 0.3
		}

		player.vel *= 0.99;
		player.dvel *= 0.9;

		camera.x = ((camera.x * dt) + player.x) / (1 + dt);
		camera.y = ((camera.y * dt) + player.y) / (1 + dt) - (player.vel * cos(player.dir) * 0.5);

	}
	
	window.requestAnimationFrame(frame);	
}

let music = new Audio("music/music.mp3");
music.onEnded = () => {
    this.currentTime = 0;
    this.play();
};
