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
	drawMain();

	elemConsole.innerHTML = "";
	printConsole("<b>Begin labrynth</b>");

	elemOptions.classList.remove("active");
	elemGame.classList.add("active");
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Player {
	health = 2;
	id;
	x; y;
	container;
	canMove = true;
	treasure;
	
	constructor(id, x, y){
		this.id = id;
		this.x = x || 0;
		this.y = y || 0;
		this.container = document.querySelector("[data-player='" + id + "']");

		maze[this.x][this.y].players.push(this);
	}
	
	damage(){
		this.health--;
		
		// Set text
		let healthText = this.container.querySelector("[data-id='health']");
		switch(this.health){
			case 2:
				healthText.innerText = "full";
				break;
			case 1:
				healthText.innerText = "wounded";
				break;
			case 0:
				healthText.innerText = "dead";
				break;
			default:
				healthText.innerText = "error";
				break;
		}
	}
	
	heal(){
		this.health = 2;
		
		// Set text
		this.container.querySelector("[data-id='health']").innerText = "full";
	}
}

class UserPlayer extends Player {
	constructor(x, y){
		super(1, x, y);
		this.container = elemStatus;
	}
}

class Feature {
	x; y;
	name;

	constructor(x, y){
		this.x = x;
		this.y = y;
	}

	round(){}

	activate(player){}

	deactivate(){}
}

class Treasure extends Feature {
	name = "treasure";
	/** @type {Player} */
	player;

	constructor(x, y){
		super(x, y);
	}

	/**
	 * Adds self to player's treasure
	 * @param {Player} player
	 */
	activate(player){
		if(this.player) return;
		if(player.health !== 2) return;

		this.player = player;
		player.treasure = this;
	}

	deactivate(){
		maze[this.player.x][this.player.y].features.push(this);
		this.x = this.player.x;
		this.y = this.player.y;
		this.player.treasure = undefined;
		this.player = undefined;
	}
}

class Wormhole extends Feature {
	id;
	next;
	name = "wormhole";

	/**
	 * Creates a `Wormhole` object
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} id The id of the wormhole
	 */
	constructor(x, y, id){
		super(x, y);
		this.id = id;
	}

	/**
	 * Moves player to next wormhole
	 * @param {Player} player The player to move
	 */
	activate(player){
		// Error-proofing
		if(next === undefined) return;

		// Move player
		maze[this.x][this.y].players.splice(maze[this.x][this.y].players.indexOf(player), 1);
		maze[this.next.x, this.next.y].players.push(player);
		printConsole("Player " + player.id + " went through a wormhole!");
	}
}

class PitfallTrap extends Feature {
	name = "pitfall trap";
	trapped = [];

	constructor(x, y){
		super(x, y);
	}

	round(){
		let length = this.trapped.length;
		for(let i = 0; i < length; i++){
			let fallen = this.trapped[i];
			fallen.tick--;
			if(fallen.tick === 0){
				fallen.player.canMove = true;
			}
		}
	}

	/**
	 * Damages a player and traps them for 3 turns
	 * @param {Player} player 
	 */
	activate(player){
		player.damage();
	}
}

class CrossbowTrap extends Feature {
	name = "crossbow trap";
	used = false;

	constructor(x, y){
		super(x, y);
	}

	/**
	 * Damages the player.
	 * @param {Player} player 
	 */
	activate(player){
		if(used) return;

		player.damage();
		used = true;
	}
}

class Cell {
	x; y;
	/** @type {Feature[]} */
	features;
	/** @type {Player[]} */
	players;
	walls;
	visited;

	/**
	 * @param {number} x The x position of the cell within the maze
	 * @param {number} y The y position of the cell within the maze
	 */
	constructor(x, y){
		this.x = x;
		this.y = y;
		this.features = new Array();
		this.players = new Array();
		this.walls = new Array(WALL_TYPES.NONE, WALL_TYPES.NONE, WALL_TYPES.NONE, WALL_TYPES.NONE);
		this.visited = false;
	}

	/**
	 * @param {number} direction Use the `DIRECTIONS` "enum"
	 * @returns {number} The wall in that direction
	 */
	getWall(direction){
		return this.walls[direction];
	}
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Generates the maze walls.
 * @param {number} size Maze size. Should be greater than 0.
 */
function generateMaze(size){
	// Generate new arrays for maze
	maze = new Array(size);
	let cells = [];
	
	for(let x = 0; x < size; x++){
		maze[x] = new Array(size);
		for(let y = 0; y < size; y++){
			// Fill them with cells
			maze[x][y] = new Cell(x, y);
			cells.push(maze[x][y]);

			// Fill cells with normal walls
			maze[x][y].walls[DIRECTIONS.TOP] = WALL_TYPES.NORMAL;
			maze[x][y].walls[DIRECTIONS.RIGHT] = WALL_TYPES.NORMAL;
			maze[x][y].walls[DIRECTIONS.BOTTOM] = WALL_TYPES.NORMAL;
			maze[x][y].walls[DIRECTIONS.LEFT] = WALL_TYPES.NORMAL;

			// Add monoliths if needed
			if(y === 0) maze[x][y].walls[DIRECTIONS.TOP] = WALL_TYPES.MONOLITH;
			if(x === size-1) maze[x][y].walls[DIRECTIONS.RIGHT] = WALL_TYPES.MONOLITH;
			if(y === size-1) maze[x][y].walls[DIRECTIONS.BOTTOM] = WALL_TYPES.MONOLITH;
			if(x === 0) maze[x][y].walls[DIRECTIONS.LEFT] = WALL_TYPES.MONOLITH;
		}
	}
	
	// Populate cell walls; custom algorithm based on Aldous-Broder algorithm
	let length = cells.length;
	let cell = cells[Math.floor(Math.random() * length)];
	for(let i = 0; i < length; i++){
		// If we don't pick an unvisited cell to visit (if no unvisited adjacent cells):
		if(cell.visited){
			// Look for a new cell; needs to be visited and have at least one 
			let foundCell = false;
			do {
				// Pick a random cell
				cell = maze[Math.floor(Math.random() * size)][Math.floor(Math.random() * size)];
				if(!cell.visited) continue;
				
				// Get adjacent cells and look for an unvisited cell
				let adjacentCells = [];
				if(cell.y !== 0      && !maze[cell.x][cell.y-1].visited) adjacentCells.push(DIRECTIONS.TOP);
				if(cell.x !== size-1 && !maze[cell.x+1][cell.y].visited) adjacentCells.push(DIRECTIONS.RIGHT);
				if(cell.y !== size-1 && !maze[cell.x][cell.y+1].visited) adjacentCells.push(DIRECTIONS.BOTTOM);
				if(cell.x !== 0      && !maze[cell.x-1][cell.y].visited) adjacentCells.push(DIRECTIONS.LEFT);
				
				// Pick one of these cells if it exists to be the current cell and remove wall between
				if(adjacentCells.length > 0){
					let dir = adjacentCells[Math.floor(Math.random() * adjacentCells.length)];
					let newCell;
					switch(dir){
						case DIRECTIONS.TOP:
							newCell = maze[cell.x][cell.y-1];
							cell.walls[DIRECTIONS.TOP] = WALL_TYPES.NONE;
							newCell.walls[DIRECTIONS.BOTTOM] = WALL_TYPES.NONE;
							break;
						case DIRECTIONS.RIGHT:
							newCell = maze[cell.x+1][cell.y];
							cell.walls[DIRECTIONS.RIGHT] = WALL_TYPES.NONE;
							newCell.walls[DIRECTIONS.LEFT] = WALL_TYPES.NONE;
							break;
						case DIRECTIONS.BOTTOM:
							newCell = maze[cell.x][cell.y+1];
							cell.walls[DIRECTIONS.BOTTOM] = WALL_TYPES.NONE;
							newCell.walls[DIRECTIONS.TOP] = WALL_TYPES.NONE;
							break;
						case DIRECTIONS.LEFT:
							newCell = maze[cell.x-1][cell.y];
							cell.walls[DIRECTIONS.LEFT] = WALL_TYPES.NONE;
							newCell.walls[DIRECTIONS.RIGHT] = WALL_TYPES.NONE;
							break;
					}
					// Then set that cell as the current cell
					cell = newCell;
					foundCell = true;
				}
			} while(!foundCell)
		}
		
		// We have visited the cell; remove it from queue
		cell.visited = true;
		cells.splice(cells.indexOf(cell), 1);
		
		// Find unvisited adjacent cells
		let adjacentCells = [];
		if(cell.y !== 0      && !maze[cell.x][cell.y-1].visited) adjacentCells.push(DIRECTIONS.TOP);
		if(cell.x !== size-1 && !maze[cell.x+1][cell.y].visited) adjacentCells.push(DIRECTIONS.RIGHT);
		if(cell.y !== size-1 && !maze[cell.x][cell.y+1].visited) adjacentCells.push(DIRECTIONS.BOTTOM);
		if(cell.x !== 0      && !maze[cell.x-1][cell.y].visited) adjacentCells.push(DIRECTIONS.LEFT);
		
		if(adjacentCells.length === 0){
			// If there are no unvisited adjacent cells, create a link between cells
			if(cell.y !== 0) adjacentCells.push(DIRECTIONS.TOP);
			if(cell.x !== size-1) adjacentCells.push(DIRECTIONS.RIGHT);
			if(cell.y !== size-1) adjacentCells.push(DIRECTIONS.BOTTOM);
			if(cell.x !== 0) adjacentCells.push(DIRECTIONS.LEFT);
			
			// Pick a random adjacent cell and remove the wall
			let dir = adjacentCells[Math.floor(Math.random() * adjacentCells.length)];
			switch(dir){
				case DIRECTIONS.TOP:
					cell.walls[DIRECTIONS.TOP] = WALL_TYPES.NONE;
					maze[cell.x][cell.y-1].walls[DIRECTIONS.BOTTOM] = WALL_TYPES.NONE;
					break;
				case DIRECTIONS.RIGHT:
					cell.walls[DIRECTIONS.RIGHT] = WALL_TYPES.NONE;
					maze[cell.x+1][cell.y].walls[DIRECTIONS.LEFT] = WALL_TYPES.NONE;
					break;
				case DIRECTIONS.BOTTOM:
					cell.walls[DIRECTIONS.BOTTOM] = WALL_TYPES.NONE;
					maze[cell.x][cell.y+1].walls[DIRECTIONS.TOP] = WALL_TYPES.NONE;
					break;
				case DIRECTIONS.LEFT:
					cell.walls[DIRECTIONS.LEFT] = WALL_TYPES.NONE;
					maze[cell.x-1][cell.y].walls[DIRECTIONS.RIGHT] = WALL_TYPES.NONE;
					break;
			}
			// Don't set a new cell to force the algorithm to pick a new unvisited one
		} else {
			// If we have unvisited neighbors, pick one and remove the wall between the two
			let dir = adjacentCells[Math.floor(Math.random() * adjacentCells.length)];
			let newCell;
			switch(dir){
				case DIRECTIONS.TOP:
					newCell = maze[cell.x][cell.y-1];
					cell.walls[DIRECTIONS.TOP] = WALL_TYPES.NONE;
					newCell.walls[DIRECTIONS.BOTTOM] = WALL_TYPES.NONE;
					break;
				case DIRECTIONS.RIGHT:
					newCell = maze[cell.x+1][cell.y];
					cell.walls[DIRECTIONS.RIGHT] = WALL_TYPES.NONE;
					newCell.walls[DIRECTIONS.LEFT] = WALL_TYPES.NONE;
					break;
				case DIRECTIONS.BOTTOM:
					newCell = maze[cell.x][cell.y+1];
					cell.walls[DIRECTIONS.BOTTOM] = WALL_TYPES.NONE;
					newCell.walls[DIRECTIONS.TOP] = WALL_TYPES.NONE;
					break;
				case DIRECTIONS.LEFT:
					newCell = maze[cell.x-1][cell.y];
					cell.walls[DIRECTIONS.LEFT] = WALL_TYPES.NONE;
					newCell.walls[DIRECTIONS.RIGHT] = WALL_TYPES.NONE;
					break;
			}
			// Then set that cell as the current cell
			cell = newCell;
		}
	}
	
	// Remove some cell walls
	let toRemove = Math.round(size * 1.5);
	while(toRemove > 0){
		let cell = maze[Math.floor(Math.random() * size)][Math.floor(Math.random() * size)];
		let availableWalls = [];
		if(cell.y !== 0      && maze[cell.x][cell.y-1].walls[DIRECTIONS.TOP] === WALL_TYPES.NORMAL) availableWalls.push(DIRECTIONS.TOP);
		if(cell.x !== size-1 && maze[cell.x+1][cell.y].walls[DIRECTIONS.RIGHT] === WALL_TYPES.NORMAL) availableWalls.push(DIRECTIONS.RIGHT);
		if(cell.y !== size-1 && maze[cell.x][cell.y+1].walls[DIRECTIONS.BOTTOM] === WALL_TYPES.NORMAL) availableWalls.push(DIRECTIONS.BOTTOM);
		if(cell.x !== 0      && maze[cell.x-1][cell.y].walls[DIRECTIONS.LEFT] === WALL_TYPES.NORMAL) availableWalls.push(DIRECTIONS.LEFT);
		
		if(availableWalls.length > 0){
			let dir = availableWalls[Math.floor(Math.random() * availableWalls.length)];
			let adjacent;
			switch(dir){
				case DIRECTIONS.TOP:
					adjacent = maze[cell.x][cell.y-1];
					cell.walls[DIRECTIONS.TOP] = WALL_TYPES.NONE;
					adjacent.walls[DIRECTIONS.BOTTOM] = WALL_TYPES.NONE;
					break;
				case DIRECTIONS.RIGHT:
					adjacent = maze[cell.x+1][cell.y];
					cell.walls[DIRECTIONS.RIGHT] = WALL_TYPES.NONE;
					adjacent.walls[DIRECTIONS.LEFT] = WALL_TYPES.NONE;
					break;
				case DIRECTIONS.BOTTOM:
					adjacent = maze[cell.x][cell.y+1];
					cell.walls[DIRECTIONS.BOTTOM] = WALL_TYPES.NONE;
					adjacent.walls[DIRECTIONS.TOP] = WALL_TYPES.NONE;
					break;
				case DIRECTIONS.LEFT:
					adjacent = maze[cell.x-1][cell.y];
					cell.walls[DIRECTIONS.LEFT] = WALL_TYPES.NONE;
					adjacent.walls[DIRECTIONS.RIGHT] = WALL_TYPES.NONE;
					break;
			}
			toRemove--;
		}
	}
}

/**
 * Generates features in the maze
 * @param {object} features An object with boolean properties for certain features
 */
function generateFeatures(features){
	const size = maze.length;

	// Generate treasure
	((x, y) => {
		// for local variables
		treasure = new Treasure(x, y);
		maze[x][y].features.push(treasure);
	})(randomInt(0, size - 1), randomInt(0, size - 1));

	// Generate wormholes
	if(features.wormholes){
		// Figure out how many wormholes we want
		let numWormholes = randomInt(2, 2 + Math.round(size / 5));
		let wormholeStore = [];
		// Generate wormholes
		for(let i = 0; i < numWormholes; i++){
			let x, y;
			do {
				x = randomInt(0, size - 1);
				y = randomInt(0, size - 1);
			} while(maze[x][y].features.findIndex(feature => feature.name == "wormhole") > -1);
			let wormhole = new Wormhole(x, y, i+1);
			maze[x][y].features.push(wormhole);
			wormholeStore.push(wormhole);
		}
		// Create a circular link between wormholes
		for(let i = 0; i < numWormholes; i++){
			wormholeStore[i].next = wormholeStore[i % numWormholes];
		}
	}

	// Generate rivers
	if(features.rivers){
		// TODO:
	}

	// Generate traps
	if(features.traps){
		// Figure out how many traps we want of each type
	}
}

/**
 * Places players within the maze
 */
function generatePlayers(){
	playerList = [
		// Start out empty except first player
		new UserPlayer(randomInt(0, maze.length - 1), randomInt(0, maze.length - 1))
	];
	
	elemPlayers.innerHTML = "";
	for(let i = 2; i <= players; i++){
		// Create outer container
		let container = document.createElement("details");
		container.open = true;
		container.dataset.player = i;
		
		// Create inner contents
		let summary = document.createElement("summary");
		summary.innerText = "Player " + i;
		container.appendChild(summary);
		
		let healthText = document.createElement("p");
		healthText.appendChild(document.createTextNode("Health: "));
		let healthSpan = document.createElement("span");
		healthSpan.innerText = "full";
		healthSpan.dataset.id = "health";
		healthText.appendChild(healthSpan);
		container.appendChild(healthText);
		
		let canvasElem = document.createElement("canvas");
		canvasElem.dataset.id = "path";
		canvasElem.width = 200;
		canvasElem.height = 200;
		container.appendChild(canvasElem);
		
		elemPlayers.appendChild(container);

		let placed = false;
		let x, y;
		do {
			x = randomInt(0, maze.length - 1);
			y = randomInt(0, maze.length - 1);
			if(maze[x][y].features.length === 0 && Math.ceil(distance(x, y, treasure.x, treasure.y)) > maze.length / 2){
				placed = true;
			}
		} while(!placed);
		playerList.push(new Player(i, x, y));
	}
}

/**
 * Draws stuff on the gameplay canvas
 */
function drawMain(){
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Generates a random int between a min and max, inclusive
 * @param {number} min 
 * @param {number} max 
 * @returns {number} A random number
 */
function randomInt(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Converts decimal coordinates to pixels
 * @param {HTMLCanvasElement} canv The canvas to use as a reference for width and height
 * @param {number} x A decimal between 0.0 and 1.0
 * @param {number} y A decimal between 0.0 and 1.0
 * @param {number} pad How much (in pixels) to pad around the edges
 * @returns {[number, number]} The x and y coordinates. Useful for moveTo and lineTo since you can use spread operator `...`
 */
function canvasCoord(canv, x, y, pad){
	return [
		Math.round(x * (canv.width - pad*2)) + pad,
		Math.round(y * (canv.height - pad*2)) + pad
	];
}

function distance(x1, y1, x2, y2){
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Changes from one "screen" to another. Uses document ids.
 * @param {string} to Must be one of the following: "options", "help", "game" or an error will be thrown
 * @throws Throws an error if the string is not an accepted string. Check parameter description for details.
 */
function goTo(to){
	document.querySelector("body > .active").classList.remove("active");
	switch(to){
		case "options":
			elemOptions.classList.add("active");
			return;
		case "help":
			elemHelp.classList.add("active");
			return;
		case "game":
			elemGame.classList.add("active");
			return;
		default:
			throw "\"" + to + "\" is not an accepted argument!";
	}
}

function printConsole(html){
	elemConsole.appendChild(document.createElement("p")).innerHTML = html;
}
