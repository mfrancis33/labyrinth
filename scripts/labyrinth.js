/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("gameplay");
const ctx = canvas.getContext("2d");

const elemOptions = document.getElementById("options");
const elemHelp = document.getElementById("help");
const elemGame = document.getElementById("game");

const elemConsole = document.getElementById("console");
const elemPlayers = document.getElementById("players");
const elemStatus = document.getElementById("status");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const WALL_TYPES = Object.freeze({
	NONE: 0,
	NORMAL: 1,
	MONOLITH: 2,
	EXIT: 3
});
const DIRECTIONS = Object.freeze({
	TOP: 0,
	RIGHT: 1,
	BOTTOM: 2,
	LEFT: 3
});
const PLAYER_COLORS = Object.freeze([
	"#fff", // We shouldn't need this color, it's a placeholder for code simplification
	"#5463ff",
	"#f52e2e",
	"#1f9e40",
	"#ffc717",
	"#d41ce5",
	"#ff6619",
	"#24d4c4",
	"#4a4559"
]);

/** @type {Cell[][]} */
var maze;
var players = 4;
var playerList = [];
var showPlayers = true;
var treasure;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

elemOptions.onsubmit = function(e){
	e.preventDefault();

	const form = document.forms.options;

	players = Number(form["players"].value);

	let sizeVal = form["size"].value;
	let size;
	switch(sizeVal){
		default:
		case "d":
			size = 10;
			break;
		case "s":
			size = randomInt(4, 7);
			break;
		case "m":
			size = randomInt(8, 10);
			break;
		case "l":
			size = randomInt(11, 14);
			break;
		case "g":
			size = randomInt(15, 18);
			break;
	}

	let features = {
		wormholes: form["wormholes"],
		rivers: form["rivers"],
		traps: form["traps"],
		fakeTreasure: form["fake-treasure"]
	};

	generateMaze(size);
	generateFeatures(features);
	generatePlayers();
	drawMaze();

	elemConsole.innerHTML = "";
	printConsole("<b>Begin labrynth</b>");

	elemOptions.classList.remove("active");
	elemGame.classList.add("active");
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Draws stuff on the gameplay canvas
 */
function drawMaze(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.lineCap = "square";

	// Draw maze
	const size = maze.length;
	for(let x = 0; x < size; x++){
		for(let y = 0; y < size; y++){
			let cell = maze[x][y];

			// Draw grid lines
			ctx.strokeStyle = "#666";
			ctx.lineWidth = 2;
			if(x !== size - 1){
				ctx.beginPath();
				ctx.moveTo(...canvasCoord(canvas, (x + 1) / size, y / size, 8));
				ctx.lineTo(...canvasCoord(canvas, (x + 1) / size, (y + 1) / size, 8));
				ctx.stroke();
			}
			if(y !== size - 1){
				ctx.beginPath();
				ctx.moveTo(...canvasCoord(canvas, x / size, (y + 1) / size, 8));
				ctx.lineTo(...canvasCoord(canvas, (x + 1) / size, (y + 1) / size, 8));
				ctx.stroke();
			}

			// Draw normal walls
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 8;
			if(cell.getWall(DIRECTIONS.RIGHT) === WALL_TYPES.NORMAL){
				ctx.beginPath();
				ctx.moveTo(...canvasCoord(canvas, (x + 1) / size, y / size, 8));
				ctx.lineTo(...canvasCoord(canvas, (x + 1) / size, (y + 1) / size, 8));
				ctx.stroke();
			}
			if(cell.getWall(DIRECTIONS.BOTTOM) === WALL_TYPES.NORMAL){
				ctx.beginPath();
				ctx.moveTo(...canvasCoord(canvas, x / size, (y + 1) / size, 8));
				ctx.lineTo(...canvasCoord(canvas, (x + 1) / size, (y + 1) / size, 8));
				ctx.stroke();
			}
			
			// Draw monoliths
			ctx.strokeStyle = "#ccc";
			ctx.lineWidth = 8;
			if(cell.getWall(DIRECTIONS.TOP) === WALL_TYPES.MONOLITH){
				ctx.beginPath();
				ctx.moveTo(...canvasCoord(canvas, x / size, y / size, 8));
				ctx.lineTo(...canvasCoord(canvas, (x + 1) / size, y / size, 8));
				ctx.stroke();
			}
			if(cell.getWall(DIRECTIONS.RIGHT) === WALL_TYPES.MONOLITH){
				ctx.beginPath();
				ctx.moveTo(...canvasCoord(canvas, (x + 1) / size, y / size, 8));
				ctx.lineTo(...canvasCoord(canvas, (x + 1) / size, (y + 1) / size, 8));
				ctx.stroke();
			}
			if(cell.getWall(DIRECTIONS.BOTTOM) === WALL_TYPES.MONOLITH){
				ctx.beginPath();
				ctx.moveTo(...canvasCoord(canvas, x / size, (y + 1) / size, 8));
				ctx.lineTo(...canvasCoord(canvas, (x + 1) / size, (y + 1) / size, 8));
				ctx.stroke();
			}
			if(cell.getWall(DIRECTIONS.LEFT) === WALL_TYPES.MONOLITH){
				ctx.beginPath();
				ctx.moveTo(...canvasCoord(canvas, x / size, y / size, 8));
				ctx.lineTo(...canvasCoord(canvas, x / size, (y + 1) / size, 8));
				ctx.stroke();
			}

			// Draw features
			ctx.font = (Math.floor(canvas.width / size / 2) - 8) +  "px sans-serif";
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";
			for(let i = 0; i < maze[x][y].features.length; i++){
				let feature = maze[x][y].features[i];
				switch(feature.name){
					case "treasure":
						ctx.fillStyle = "#fc3";
						ctx.fillText("T", ...canvasCoord(canvas, (x + 0.5) / size, (y + 0.5) / size, 8));
						break;
					case "wormhole":
						ctx.fillStyle = "#999";
						ctx.fillText("W" + feature.id, ...canvasCoord(canvas, (x + 0.5) / size, (y + 0.5) / size, 8));
						break;
					case "river":
						ctx.fillStyle = "#009";
						ctx.strokeStyle = "#009";
						coords = canvasCoord(canvas, (x + 0.5) / size, (y + 0.5) / size, 8);

						ctx.beginPath();
						ctx.arc(coords[0], coords[1], 20 - size, 0, Math.PI * 2, false);
						ctx.fill();

						// TODO: finish me
						// ctx.beginPath();
						// ctx.stroke();
						break;
					case "pitfall trap":
						ctx.fillStyle = "#333";
						ctx.fillText("PT", ...canvasCoord(canvas, (x + 0.5) / size, (y + 0.5) / size, 8));
						break;
					case "crossbow trap":
						ctx.fillStyle = "#630";
						ctx.fillText("CT", ...canvasCoord(canvas, (x + 0.5) / size, (y + 0.5) / size, 8));
						break;
				}
			}

			// Draw players
			let numPlayers = maze[x][y].players.length;
			for(let i = 0; i < numPlayers; i++){
				let player = maze[x][y].players[i];

				ctx.fillStyle = PLAYER_COLORS[player.id];
				
				// Put shapes to represent players
				// TODO: individual shapes for players
				let coords;
				if(numPlayers === 1){
					coords = canvasCoord(canvas, (x + 0.5) / size, (y + 0.5) / size, 8);
				} else if(numPlayers === 2){
					if(i === 0){
						coords = canvasCoord(canvas, (x + 1/3) / size, (y + 1/3) / size, 8);
					} else {
						coords = canvasCoord(canvas, (x + 2/3) / size, (y + 2/3) / size, 8);
					}
				} else {
					coords = canvasCoord(
						canvas,
						(x + 0.5 + Math.sin(i / numPlayers * Math.PI * 2) / 3) / size,
						(y + 0.5 - Math.cos(i / numPlayers * Math.PI * 2) / 3) / size, 8
					);
				}
				ctx.beginPath();
				ctx.arc(coords[0], coords[1], 24 - size, 0, Math.PI * 2, false);
				ctx.fill();
			}
		}
	}
}
