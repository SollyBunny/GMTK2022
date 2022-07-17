
const atan2 = Math.atan2;
const cos = Math.cos;
const sin = Math.sin;
const pi  = Math.PI;

let trippin = 0;
let tutorial = 1;
let lowend = 0;
let dicespawnid = undefined;
let hurttimeout = 0;
let score = 0, cscore = 0;

let state = 0;
let can, ctx;
let keys = {};
let keytime = 0;
let keylast = undefined;

let e_title, e_dice, e_objs, e_boost, e_hurt, e_text, e_settingsmenu, e_tutorialcheckbox, e_settingscheckbox, e_pause;

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
	if (state == 0) {
		if (event.keyCode === 27) {
			e_settingscheckbox.click();
		} else if (event.keyCode !== keylast) {
			e_title.click();
			keys[event.keyCode] = true;
		}
		keylast = event.keyCode;
		return;
	};
	if (event.keyCode === 27 || event.keyCode === 80) {
		if (state === 1) {
			state = 2;
			e_pause.style.marginTop = 0;
			e_text.style.marginTop = "130vh";
		} else {
			state = 1;
			e_pause.style.marginTop = "-100vh";
			e_text.style.marginTop = "85vh";
		}
		keylast = event.keyCode;
		return;
	}
	keys[event.keyCode] = true;
	keytime = undefined;
	keylast = event.keyCode;
};
window.onkeyup = () => {
	keys[event.keyCode] = false;
};

window.onresize = () => {
	can.width = window.innerWidth;
	can.height = window.innerHeight;
};

font = new FontFace("PixeloidMono", "url(./font/PixeloidMono.ttf)")
font.load().then((font) => {
	document.fonts.add(font);
	if (ctx) ctx.font = "15px PixeloidMono";
});

window.onload = async () => {
	// warn on itch.io
	if (document.location.host === "sollybunny.itch.io") document.getElementById("warn").style.display = "block";
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
		} else if (event.target.id === "settings" || event.srcElement.parentElement.parentElement.id === "githubcorner" || e_settingsmenu.style.marginLeft === "0vw") return;
		e_title.style.marginTop = "-120vh";
		e_text.style.marginTop = "85vh";
		state = 1;
		camera.y = 0;
		e_hurt.style.opacity = "0";
		e_text.innerHTML = "0";
		cscore = score = 0;
		if (music.paused)  music.play();
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
	e_boost = document.getElementById("boost");
	e_hurt = document.getElementById("hurt");

	can = document.getElementById("canvas");
	ctx = can.getContext("2d");
	ctx.imageSmoothingEnabled = false;
	window.onresize();
	window.requestAnimationFrame(frame);	
};

function die() {
	state = 0;
	player = new Obj(0, 0, 0, "player", 100);
	e_title.style.marginTop = 0;
	e_text.style.marginTop = 0;
	e_pause.style.marginTop = "-100vh";
	e_hurt.style.opacity = "0";
	window.clearTimeout(dicespawnid);
	objs = [];
	inventory = [];
	camera.x = 0;
}

function hurt(amount) {
	player.data -= amount || 1;
	if (player.data < 0) die();
	e_hurt.style.opacity = "0.6";
	hurttimeout = 20;
}

let spawneddie = 0;
let c1, c2, r;
function spawndie() {
	let y = undefined;
	for (let i = objs.length - 1; i > 0; --i) {
		if (y === undefined && objs[i].type === "dice") {
			y = objs[i].y;
			break;
		}
	}
	if (y === undefined) y = player.y;
	if (spawneddie < 5) { // this code is written after me destroying my left hand soz for bad quality
		c1 = 0;
		c2 = 1;
	} else if (spawneddie < 10) {
		c1 = 0.5;
		c2 = 0;
	} else if (spawneddie < 20) {
		c1 = 1;
		c2 = 0.5;
	} else {
		c1 = 1;
		c2 = 0.7;
	}

	r = Math.random();
	if (r > c1) {
		objs.push(new Obj(0, y - 1500, 0, "dice", [0]));
	} else if (r > c2) {
		objs.push(new Obj(0, y - 1500, 0, "dice", [0, 0]));
	} else {
		objs.push(new Obj(0, y - 1500, 0, "dice", [0, 0, 0]));		
	}
	spawneddie++;
}

let lastt = 0, dt = 0;
let totalt = 0, totalactualt = 0;
function frame(t) {
	if (ctx.font !== "15px PixeloidMono") ctx.font = "15px PixeloidMono";
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";
	dt = t - lastt;
	lastt = t;
	if (state === 1) totalt += dt;
	totalactualt += dt;
	if (keytime === undefined) keytime = t;

	if (hurttimeout > 0) {
		if (lowend === 0) {
			e_hurt.style.opacity = "1";
			--hurttimeout;
		}
	} else if (player.data < 70) { // never fully recover
		player.data += dt / 8; 
		if (lowend === 0) e_hurt.style.opacity = `${1 - Math.floor(player.data / 10) / 10}`;
	} else if (player.data < 75) {
		player.data = 75;
		if (lowend === 0) e_hurt.style.opacity = "0.25";
	}
	
	if (totalt > 100 && state === 1) {
		totalt = 0;
		score += 1;
		cscore += 1;
		if (lowend === 0) {
			if (Math.abs(cscore - score) < 10) {
				cscore = score;
			} else {
				cscore = ((cscore * 4) + score) / 5;
			}
			e_text.innerHTML = Math.floor(cscore);
		} else if (cscore !== score) {
			cscore = score;
			e_text.innerHTML = cscore;
		}
	}

	ctx.globalAlpha = trippin ? 0.1 : 0.8;
	ctx.fillStyle = "#221d52";
	ctx.fillRect(0, 0, can.width, can.height);

	if (lowend === 0) {
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
	}

	ctx.translate(
		Math.floor(can.width  / 2 - camera.x),
		Math.floor(can.height / 2 - camera.y)
	);
	
	ctx.closePath();
	ctx.stroke();

	// Player
	ctx.globalAlpha = 0.7;
	if (lowend === 0) {
		ctx.lineWidth = 3;
		ctx.strokeStyle = "#e63695";
		ctx.beginPath();
		ctx.moveTo(player.x - sin(player.dir) * 25, player.y - cos(player.dir) * 25);
		ctx.lineTo(player.x + sin(player.dir) * 25 - cos(player.dir) * 20, player.y + cos(player.dir) * 25 - sin(player.dir) * 20);
		ctx.lineTo(player.x + sin(player.dir) * 25 + cos(player.dir) * 20, player.y + cos(player.dir) * 25 + sin(player.dir) * 20);
		ctx.lineTo(player.x - sin(player.dir) * 25, player.y - cos(player.dir) * 25);
		ctx.closePath();
		ctx.stroke();
	}
	ctx.lineWidth = 1;
	ctx.strokeStyle = "#fef7fa";
	ctx.beginPath();
	ctx.moveTo(player.x - sin(player.dir) * 25, player.y - cos(player.dir) * 25);
	ctx.lineTo(player.x + sin(player.dir) * 25 - cos(player.dir) * 20, player.y + cos(player.dir) * 25 - sin(player.dir) * 20);
	ctx.lineTo(player.x + sin(player.dir) * 25 + cos(player.dir) * 20, player.y + cos(player.dir) * 25 + sin(player.dir) * 20);
	ctx.lineTo(player.x - sin(player.dir) * 25, player.y - cos(player.dir) * 25);
	ctx.closePath();
	if (player.data > 100) {
		ctx.fillStyle = "yellow";
		player.data -= dt / 10;
	} else {
		ctx.fillStyle = "#2d2f78";
	}
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
	
		player.dir += 0.005; // a
				
	} else if (state === 1) {
		objs.forEach((i) => {
			ctx.globalAlpha = 0.7;
			switch (i.name) {
				case "text":
					ctx.fillStyle = "#f490a9";
					ctx.fillText(i.data, i.x, i.y);
					break;
				case "coin":
					if (camera.y - i.y - (i.data / 2) < -can.height / 2) {
						i.name = undefined;
						break;
					}
					if (Math.abs(i.y - player.y) + Math.abs(i.x - player.x) < 30) {
						inventory.push(i.data);
						score += (i.data + 1) * 100;
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
					break;
				case "wall":
					ctx.globalAlpha = 0.2;
					ctx.fillStyle = "#6d3493";
					ctx.fillRect(i.x - 5, i.y - 1000, 10, 1000);
					if (i.data === undefined) {
						if (player.y > i.y) break;
						if (player.x > i.x) i.data = 0;
						else                i.data = 1;
					} else if (player.y < i.y - 1000) {
						i.data = undefined;
					} else if (i.data === 0) {
						if (player.x < i.x) {
							player.x += (i.x - player.x) * 0.1;
						}
					} else { // i.data === 1
						if (player.x > i.x) {
							player.x += (i.x - player.x) * 0.1;
						}
					}
					break;
				case "boost":
					if (camera.y - i.y - (i.data / 2) < -can.height / 2) {
						i.name = undefined;
						break;
					}
					if (i.x === undefined) {
						i.x = i.id % 2 == 0 ? -200 : 200;
					}
					ctx.drawImage(
						e_boost,
						0,
						Math.floor(totalactualt / 30) % 48,
						48,
						48,
						i.x,
						i.y,
						48,
						48
					);
					if (i.data === 1) {
						ctx.fillStyle = "yellow";
						ctx.globalAlpha = 0.7;
						ctx.fillRect(i.x, i.y, 48, 48);
					}
					if (Math.abs(i.y - player.y) + Math.abs(i.x - player.x) < 50) {
						if (i.data === 1) {
							player.vel += 25;
							player.data = 500;
							e_hurt.style.opacity = "0";
						} else {
							player.vel += 3;
						}
					}
					break;
				case "saw":
					if (camera.y - i.y - (i.data / 2) < -can.height / 2 - 15) {
						i.name = undefined;
						break;
					}
					if (Math.sqrt(((i.y - player.y) ** 2) + ((i.x - player.x) ** 2)) < i.data) {
						if (player.data > 100) {
							i.name = undefined;
							return;
						}
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
						if (player.data <= 100) hurt(5);
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
						if (player.data <= 100) hurt(10);
						i.name = undefined;
						break;
					}
					ctx.strokeStyle = "#e63695";
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
					ctx.translate(i.x, i.y - 24);
					if (i.x > 0) ctx.scale(-1, 1);
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
				case "portal":
					if (camera.y - i.y - (i.data / 2) < -can.height / 2 - 15) {
						i.name = undefined;
						break;
					}
					if (player.y > i.y && player.y < i.y + 48 && (i.x < 0 ? player.x < -380 : player.x > 380)) {
						let opts = objs.filter((m) => {
							return m.name === "portal" && i.x + m.x === 0 && i.y > player.y - (can.height / 2);
						});
						console.log(opts)
						player.x *= -1;
						if (opts.length !== 0) player.y = opts[Math.floor(opts.length * Math.random())].y;
					}
					ctx.drawImage(
						e_objs,
						i.x < 0 ? 144 : 192,
						0,
						48,
						48,
						i.x + (i.x > 0 ? -26 : -20),
						i.y,
						48,
						48
					);
					break;
				case "dicedecay":
					i.y += 0.5;
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
						return;
					}; // skip if not on screen
					if (camera.y - i.y < 10) { // player collide
						score += 1000;
						let hit = undefined;
						switch (i.data.length) {
							case 2:
								if (player.x > -140 && player.x < -60) hit = 0;
								else if (player.x > 60 && player.x < 180) hit = 1;
								break;
							case 3:
								if (player.x > -240 && player.x < -160) hit = 0;
								else if (player.x > -40 && player.x < 40) hit = 1;
								else if (player.x > 160 && player.x < 240) hit = 2;
								break;
						}
						if (hit !== undefined) {
							let t = inventory.indexOf(i.data[i])
							if (t !== -1) {
								inventory.slice(t, t + 1);
								i.data[hit] = -1;
							}
						}
						i.data.forEach((m) => {
							switch (m) {
								case -1: break;
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
									for (let _ = 0; _ < Math.floor(Math.random() * 2) * 2 + 8; ++_) {
										objs.push(new Obj(Math.random() > 0.5 ? 400 : -400, i.y - 200 - (Math.random() * 2000), Math.random(), "portal", 24 * Math.floor(Math.random() * 5)));
									}
									break;
								case 3:
									for (let _ = 0; _ < Math.random() * 7 + 30; ++_) {
										objs.push(new Obj(_ % 2 == 0 ? 400 : -400, i.y - 200 - (Math.random() * 2000), Math.random(), "gun", 24 * Math.floor(Math.random() * 5)));
									}
									break;
								case 4:
									for (let _ = 0; _ < Math.random() * 7 + 30; ++_) {
										objs.push(new Obj(Math.random() > 0.5 ? 400 : -400, i.y - 200 - (Math.random() * 2000), Math.random(), "misile", 24 * Math.floor(Math.random() * 5)));
									}
									break;
								case 6:
									for (let _ = 0; _ < Math.random() * 7 + 30; ++_) {
										objs.push(new Obj(Math.random() > 0.5 ? 400 : -400, i.y - 200 - (Math.random() * 2000), Math.random(), "gun", 24 * Math.floor(Math.random() * 5)));
										objs.push(new Obj(Math.random() > 0.5 ? 400 : -400, i.y - 200 - (Math.random() * 2000), Math.random(), "misile", 24 * Math.floor(Math.random() * 5)));
									}
									break;
							}
						});
						for (let _ = 0; _ < Math.random() * 4; ++_) {
							objs.push(new Obj(Math.random() * 1000 - 500, i.y - 200 - (Math.random() * 2000), Math.random(), "saw", 24 * Math.floor(Math.random() * 5)));
						}
						for (let _ = 0; _ < Math.random() * 2; ++_) {
							objs.push(new Obj(undefined, i.y - 500 - (Math.random() * 500), undefined, "boost", Math.random() > 0.8 ? 1 : 0));
						}
						if (Math.random() > 0.5) {
							objs.push(new Obj(0, i.y - 100 - (Math.random() * 500), undefined, "wall"));
						}
						i.name = "dicedecay";
						i.data = 0;
						dicespawnid = window.setTimeout(spawndie, 1000);
						break;
					}
					ctx.save();
					if (i.dir < 2 * pi) {
						if (i.dir % 0.3 === 0) {
							if (i.data[0] !== undefined) i.data[0] = Math.floor(Math.random() * 6);
							if (i.data[1] !== undefined) i.data[1] = Math.floor(Math.random() * 6);
							if (i.data[2] !== undefined) i.data[2] = Math.floor(Math.random() * 6);
						}
						i.dir = Math.ceil((i.dir + 0.1) * 10) / 10;
						if (i.dir > 2 * pi) {
							i.dir = 2 * pi;
							if (i.data.length > 1 && Math.random() > 0) {
								i.data[Math.floor(Math.random() * i.data.length)] += 10;
							}
						}
					}
					ctx.globalAlpha = 0.2;
					ctx.fillStyle = "#6d3493";
					ctx.fillRect(-390, i.y - 5, 780, 10);
					ctx.globalAlpha = 0.9;
					ctx.fillStyle = "yellow"
					let v;
					switch (i.data.length) {
						case 1:
							ctx.translate(i.x, i.y);
							ctx.rotate(i.dir);
							ctx.drawImage(
								e_dice,
								48 * i.data[0],
								0,
								48,
								48,
								-24,
								-24,
								48,
								48
							);
							if (i.id === 2 && tutorial !== 2) {
								ctx.restore();
								ctx.fillStyle = "#f490a9";
								ctx.fillText("THE DICE DETERMINE THE OBSTACLES AHEAD", 0, i.y + 50);
							}
							break;
						case 2:
							ctx.translate(i.x - 100, i.y);
							ctx.rotate(i.dir);
							v = i.data[0];
							if (v >= 10) {
								v -= 10;
								if (inventory.indexOf(v) !== -1) {
									ctx.globalAlpha = 1;
									ctx.fillRect(-24, -24, 48, 48);
									ctx.globalAlpha = 0.7;
								}
							}
							ctx.drawImage(
								e_dice,
								48 * v,
								0,
								48,
								48,
								-24,
								-24,
								48,
								48
							);
							ctx.rotate(-i.dir);
							ctx.translate(200, 0);
							ctx.rotate(i.dir);
							v = i.data[0];
							if (v >= 10) {
								v -= 10;
								if (inventory.indexOf(v) !== -1) {
									ctx.globalAlpha = 1;
									ctx.fillRect(-24, -24, 48, 48);
									ctx.globalAlpha = 0.7;
								}
							}
							ctx.drawImage(
								e_dice,
								48 * v,
								0,
								48,
								48,
								-24,
								-24,
								48,
								48
							);
							break;
						case 3:
							ctx.translate(i.x - 200, i.y);
							ctx.rotate(i.dir);
							v = i.data[0];
							if (v >= 10) {
								v -= 10;
								if (inventory.indexOf(v) !== -1) {
									ctx.globalAlpha = 1;
									ctx.fillRect(-24, -24, 48, 48);
									ctx.globalAlpha = 0.7;
								}
							}
							ctx.drawImage(
								e_dice,
								48 * v,
								0,
								48,
								48,
								-24,
								-24,
								48,
								48
							);
							ctx.rotate(-i.dir);
							ctx.translate(200, 0);
							ctx.rotate(i.dir);
							v = i.data[1];
							if (v >= 10) {
								v -= 10;
								if (inventory.indexOf(v) !== -1) {
									ctx.globalAlpha = 1;
									ctx.fillRect(-24, -24, 48, 48);
									ctx.globalAlpha = 0.7;
								}
							}
							ctx.drawImage(
								e_dice,
								48 * v,
								0,
								48,
								48,
								-24,
								-24,
								48,
								48
							);
							ctx.rotate(-i.dir);
							ctx.translate(200, 0);
							ctx.rotate(i.dir);
							v = i.data[2];
							if (v >= 10) {
								v -= 10;
								if (inventory.indexOf(v) !== -1) {
									ctx.globalAlpha = 1;
									ctx.fillRect(-24, -24, 48, 48);
									ctx.globalAlpha = 0.7;
								}
							}
							ctx.drawImage(
								e_dice,
								48 * v,
								0,
								48,
								48,
								-24,
								-24,
								48,
								48
							);
							break;
					}
					ctx.restore();
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
		if (player.data > 100) {
			camera.y -= player.vel;
		}

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
