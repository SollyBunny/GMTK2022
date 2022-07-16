(new FontFace("PixeloidMono", "url(font/PixeloidMono.ttf)")).load().then((font) => {
	document.fonts.add(font);
	if (ctx) ctx.font = "20px PixeloidMono";
});

const atan2 = Math.atan2;
const cos = Math.cos;
const sin = Math.sin;
const pi  = Math.PI;

let trippin = 0;
let tutorial = 1;
let dicespawnid = undefined;

let state = 0;
let can, ctx;
let keys = {};
let keytime = 0;

let e_title, e_dice, e_objs, e_hurt, e_text, e_settingsmenu, e_tutorialcheckbox, e_settingscheckbox, e_pause;

const HURTANIM = [
	{ "opacity": "0.7" },
	{ "opacity": "1" },
	{ "opacity": "0.1" },
	{ "opacity": "0.0" }
];
const HURTOPT = {
	duration: 1000,
	iterations: 1
};

class Pos {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}

let idcount = 0;
class Obj {
	constructor(x, y, dir, name, data) {
		this.name = name
		this.x = x;
		this.y = y;
		this.dir = dir;
		this.vel = 0;
		this.dvel = 0;
		this.data = data;
		this.id = idcount;
		++idcount;
	}
}

let inventory = [];
let objs = [];
let player = new Obj(0, 0, 0, "player", 100);
let camera = new Pos(0, 0);

window.onkeydown = () => {
	console.log(event.keyCode)
	if (state == 0) {
		if (event.keyCode === 27) e_settingscheckbox.click();
		return;
	};
	if (event.keyCode === 27 || event.keyCode === 80) {
		if (state === 1) {
			state = 2;
			e_pause.style.marginTop = 0;
		} else {
			state = 1;
			e_pause.style.marginTop = "-100vh";
		}
		return;
	}
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
		if (event.target.id === "settingscheckbox") {
			if (event.target.checked) {
				e_settingsmenu.style.marginLeft = "0vw";
				e_text.style.marginLeft = "100vw";
			} else {
				e_settingsmenu.style.marginLeft = "-100vw";
				e_text.style.marginLeft = "0";
			}
			return;
		} else if (event.target.id === "settings" || e_settingsmenu.style.marginLeft === "0vw") return;
		e_title.style.marginTop = "-120vh";
		state = 1;
		music.play();
		if (tutorial > 0) {
			objs.push(new Obj(
				150, 20, undefined, "text", "use WASD to move!"
			));
		} else {
			spawndie();
		}
	};
	e_tutorialcheckbox = document.getElementById("tutorialcheckbox");
	e_tutorialcheckbox.checked = true;
	e_tutorialcheckbox.onchange({"target": e_tutorialcheckbox}); // simulate press
	e_settingscheckbox = document.getElementById("settingscheckbox");
	e_settingsmenu = document.getElementById("settingsmenu");
	e_pause = document.getElementById("pause");
	e_text = document.getElementById("text");
	e_dice = document.getElementById("dice");
	e_objs = document.getElementById("objs");
	e_hurt = document.getElementById("hurt");

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
	player = new Obj(0, 0, 0, "player", 100);
	e_title.style.marginTop = 0;
	e_pause.style.marginTop = "-100vh";
	window.clearTimeout(dicespawnid);
	objs = [];
	inventory = [];
	camera.x = 0;
}

function hurt(hp) {
	player.data -= hp || 1;
	if (player.data < 0) die();
	e_hurt.animate(HURTANIM, HURTOPT);
}

function spawndie() {
	let y = undefined;
	for (let i = objs.length - 1; i > 0; --i) {
		if (y === undefined && objs[i].type === "dice") {
			y = objs[i].y;
			break;
		}
	}
	if (y === undefined) y = player.y;
	objs.push(new Obj(0, y - 1500, 0, "dice"));
}

let lastt = 0, dt = 0;
function frame(t) {
	dt = t - lastt;
	lastt = t;
	if (keytime === undefined) keytime = t;

	if (player.hp < 100) player.hp += dt / 20;

	ctx.globalAlpha = trippin ? 0.1 : 0.8;
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
	if (tutorial > 0 && -camera.y < can.height) {
		ctx.fillRect(-400, 300, 800, 10);
		ctx.fillRect(-400, 300, 10, camera.y - 300 - can.height / 2);
		ctx.fillRect(390, 300, 10, camera.y - 300 - can.height / 2);
	} else {
		if (tutorial === 1) { // turn of tutorial once reached threshold (only if set at start of game not settings)
			tutorial = 0;
			objs = objs.filter((i) => { // remove tutorial text
				return i.data !== "use WASD to move!";
			});
			// start spawning!
			spawndie();
		}
		ctx.fillRect(-400, camera.y - can.height / 2, 10, can.height);
		ctx.fillRect(390, camera.y - can.height / 2, 10, can.height);
	}

	if (t - keytime > 10000 || state === 2) { // idle after 10s or pause
	
		player.dir += 0.05; // a
				
	} else if (state === 1) {

		ctx.globalAlpha = 0.7;
		objs.forEach((i) => {
			switch (i.name) {
				case "text":
					ctx.fillStyle = "#f490a9"
					ctx.fillText(i.data, i.x, i.y);
					break;
				case "coin":
					if (camera.y - i.y - (i.data / 2) < -can.height / 2) {
						i.name = undefined;
						break;
					}
					if (Math.abs(i.y - player.y) + Math.abs(i.x - player.x) < 30) {
						inventory.push(i.data);
						i.name = undefined;
						break;
					}
					ctx.globalAlpha = 0.9;
					ctx.drawImage(
						e_dice,
						i.data * 48,
						0,
						48,
						48,
						i.x - 12,
						i.y - 12,
						24,
						24
					);
					ctx.globalAlpha = 0.7;
					break;
				case "saw":
					if (camera.y - i.y - (i.data / 2) < -can.height / 2 - 15) {
						i.name = undefined;
						break;
					}
					if (Math.sqrt(((i.y - player.y) ** 2) + ((i.x - player.x) ** 2)) < i.data) {
						i.dir *= 0.7;
						hurt();
					}
					i.dir += i.id % 2 == 0 ? 0.1 : -0.1;
					ctx.save();
					ctx.globalAlpha = i.id % 3 == 0 ? 0.2 : 0.7;
					ctx.translate(i.x, i.y);
					ctx.rotate(i.dir);
					ctx.drawImage(
						e_objs,
						0,
						0,
						48,
						48,
						i.data * -0.5,
						i.data * -0.5,
						i.data,
						i.data
					);
					ctx.restore();
					break;
				case "bullet":
					i.dir += 0.1;
					i.x += i.data == 1 ? -1 : 1;
					if (i.x > 410 || i.x < -410) {
						i.name = undefined;
						break;
					}
					if (Math.sqrt(((i.y - player.y) ** 2) + ((i.x - player.x) ** 2)) < 10) {
						i.dir *= 0.7;
						hurt(5);
						i.name = undefined;
						break;
					}
					ctx.strokeStyle = "#e63695";
					ctx.beginPath();
					ctx.moveTo(i.x - sin(i.dir) * 10, i.y - cos(i.dir) * 10);
					ctx.lineTo(i.x + sin(i.dir) * 10, i.y + cos(i.dir) * 10);
					ctx.closePath();
					ctx.stroke();
					break;
				case "gun":
					if (camera.y - i.y - (i.data / 2) < -can.height / 2 - 15) {
						i.name = undefined;
						break;
					}
					if (Math.random() > 0.995) { // shoot
						objs.push(new Obj(i.x, i.y + (Math.random() * 20 - 10), 0, "bullet", i.x > 0 ? 1 : -1));
					}
					ctx.save();
					ctx.translate(i.x, i.y - 24);
					if (i.x > 0) ctx.scale(-1, 1);
					ctx.globalAlpha = 0.7;
					ctx.drawImage(
						e_objs,
						48,
						0,
						48,
						48,
						0,
						0,
						48,
						48
					);
					ctx.restore();
					break;
				case "rocket":
					i.dir = (i.dir * 4 + atan2(i.y - player.y, i.x - player.x)) / 5;
					i.x -= cos(i.dir) * 2;
					i.y -= sin(i.dir) * 2;
					--i.data;
					if (i.x > 410 || i.x < -410 || i.data === 0 || camera.y - i.y - (i.data / 2) < -can.height / 2) {
						i.name = undefined;
						break;
					}
					if (Math.sqrt(((i.y - player.y) ** 2) + ((i.x - player.x) ** 2)) < 10) {
						i.dir *= 0.7;
						hurt(10);
						i.name = undefined;
						break;
					}
					ctx.strokeStyle = "#e63695";
					ctx.beginPath();
					ctx.beginPath();
					ctx.moveTo(i.x - cos(i.dir) * 10, i.y - sin(i.dir) * 10);
					ctx.lineTo(i.x + cos(i.dir) * 10 - sin(i.dir) * 5, i.y + sin(i.dir) * 10 - cos(i.dir) * 5);
					ctx.lineTo(i.x + cos(i.dir) * 10 + sin(i.dir) * 5, i.y + sin(i.dir) * 10 + cos(i.dir) * 5);
					ctx.lineTo(i.x - cos(i.dir) * 10, i.y - sin(i.dir) * 10);
					ctx.closePath();
					ctx.stroke();
					break;
				case "misile":
					if (camera.y - i.y - (i.data / 2) < -can.height / 2 - 15) {
						i.name = undefined;
						break;
					}
					if (Math.random() > 0.99) { // shoot
						objs.push(new Obj(i.x, i.y + (Math.random() * 20 - 10), i.x > 0 ? pi : 0, "rocket", 500));
					}
					ctx.save();
					ctx.globalAlpha = 0.9;
					ctx.translate(i.x, i.y - 24);
					if (i.x > 0) ctx.scale(-1, 1);
					ctx.globalAlpha = 0.7;
					ctx.drawImage(
						e_objs,
						96,
						0,
						48,
						48,
						0,
						0,
						48,
						48
					);
					ctx.restore();
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
					if (camera.y - i.y - 24 > can.height / 2) {
						i.y += 5;
						return
					}; // skip if not on screen
					if (camera.y - i.y < 10) { // player collide
						switch (i.data) {
							case 0:
								for (let _ = 0; _ < Math.random() * 5; ++_) {
									objs.push(new Obj(Math.random() * 750 - 325, i.y - 200 - (Math.random() * 2000), Math.random(), "coin", Math.floor(Math.random() * 6)));
								}
								break;
							case 1:
								for (let _ = 0; _ < Math.random() * 7 + 30; ++_) {
									objs.push(new Obj(Math.random() * 1000 - 500, i.y - 200 - (Math.random() * 2000), Math.random(), "saw", 24 * Math.floor(Math.random() * 5)));
								}
								break;
							case 2:
								for (let _ = 0; _ < Math.random() * 7 + 30; ++_) {
									objs.push(new Obj(Math.random() > 0.5 ? 400 : -400, i.y - 200 - (Math.random() * 2000), Math.random(), "gun", 24 * Math.floor(Math.random() * 5)));
								}
								break;
							case 3:
							default:
								for (let _ = 0; _ < Math.random() * 7 + 30; ++_) {
									objs.push(new Obj(Math.random() > 0.5 ? 400 : -400, i.y - 200 - (Math.random() * 2000), Math.random(), "misile", 24 * Math.floor(Math.random() * 5)));
								}
								break;
							case 69:
								for (let _ = 0; _ < Math.random() * 7 + 30; ++_) {
									objs.push(new Obj(Math.random() > 0.5 ? 400 : -400, i.y - 200 - (Math.random() * 2000), Math.random(), "gun", 24 * Math.floor(Math.random() * 5)));
								}
								break;
						}
						i.name = "dicedecay";
						i.data = 0;
						dicespawnid = window.setTimeout(spawndie, 1000);
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
		objs = objs.filter((i) => { return i.name !== undefined; });

		if      (keys[65]) player.dvel += 0.01; // a
		else if (keys[68]) player.dvel -= 0.01; // d

		if      (keys[87]) player.vel  += 0.08; // w
		else if (keys[83]) player.vel  -= 0.01; // s

		player.x   -= player.vel * sin(player.dir);
		player.y   -= player.vel * cos(player.dir);
		player.dir += player.dvel;

		if (player.x < -380) {
			player.x += (-380 - player.x) * 0.1;
		} else if (player.x > 380) {
			player.x += (380 - player.x) * 0.1;
		}
		if (tutorial > 0 && player.y > 280) {
			player.y += (280 - player.y) * 0.1
		}

		player.vel *= 0.99;
		player.dvel *= 0.9;

		camera.x = ((camera.x * dt) + player.x) / (1 + dt);
		camera.y = ((camera.y * dt) + player.y) / (1 + dt) - (player.vel * cos(player.dir) * 0.5);

	}

	ctx.resetTransform();
	ctx.globalAlpha = 0.9;
	for (let i = 0; i < inventory.length; ++i) {
		ctx.drawImage(
			e_dice,
			48 * inventory[i],
			0,
			48,
			48,
			i * 58 + 10,
			can.height - 218,
			48,
			48
		);
	}
	
	window.requestAnimationFrame(frame);	
}

let music = new Audio("music/music.mp3");
music.onended = () => {
    music.currentTime = 0;
    music.play();
};
