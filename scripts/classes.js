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
