class Turn {
	move;
	use;

	/**
	 * Creates a "turn", a wrapper object for which direction to move and what
	 * weapon to use, if any.
	 * @param {number | null} move Either a direction to move or null (for none)
	 * @param {Use | null} use Either an object specifying which weapon and
	 * which direction (optional) or null (for none)
	 */
	constructor(move=null, use=null){
		this.move = move;
		this.use = use;
	}
}

class Use {
	weapon;
	direction;

	/**
	 * Creates a "Use" for a turn. A wrapper object.
	 * @param {string | null} weapon Either "gun", "knife", or "grenade" to use a weapon, or null to not use one.
	 * @param {number | null} direction A direction from the {@link DIRECTIONS} enum or null. Optional.
	 */
	constructor(weapon=null, direction=null){
		if(weapon === "gun" || weapon === "knife" || weapon === "grenade" || weapon === null){
			this.weapon = weapon;
			if((weapon !== "knife" && weapon !== null) && (direction === null || typeof direction !== "number")){
				// Pick a random direction if none was specified
				direction = Object.values(DIRECTIONS)[randomInt(0, 3)];
				printConsole("No direction was specified; picking random");
				// throw "Direction required! Please use 'DIRECTIONS' enum";
			}
			this.direction = direction;
		} else {
			throw "Appropriate weapon required!";
		}
	}
}

class Player {
	health = 2;
	id;
	x; y;
	container;
	canMove = true;
	treasure;
	/** @type {AI} */
	ai;
	
	/**
	 * Creates a "player" object
	 * @param {number} id The player id
	 * @param {number} x The starting x position
	 * @param {number} y The starting y position
	 * @param {AI} ai The AI to use in controlling the player
	 */
	constructor(id, x, y, ai=new AI(this)){
		this.id = id;
		this.x = x || 0;
		this.y = y || 0;
		this.container = document.querySelector("[data-player='" + id + "']");
		this.ai = ai;
		ai.player = this;

		maze[this.x][this.y].players.push(this);
	}

	/**
	 * Takes a turn as a player.
	 * 
	 * **IMPORTANT NOTE:** For classes extending the default Player class, DO NOT OVERRIDE
	 * THIS METHOD IF YOU DO NOT KNOW WHAT YOU ARE DOING!!!
	 * 
	 * @returns A promise that must be awaited to ensure things are done.
	 */
	turn(){
		return new Promise(async resolve => {
			// If we are dead or can't move, don't do anything
			if(this.health === 0 || !this.canMove){
				resolve();
				return;
			}

			// Let the AI think
			/** @type {Turn} */
			const turn = await this.ai.turn();
			
			// If we didn't do anything, say so.
			if(turn.move === null && turn.use === null){
				printConsole("Player " + this.id + " did nothing.");
				resolve();
				return;
			}

			let couldMove = true;

			// Deal with moving
			if(turn.move !== null){
				// Is there a wall?
				let wall = maze[this.x][this.y].getWall(turn.move);
				if(wall === WALL_TYPES.NONE){
					// Can move
					maze[this.x][this.y].players.splice(maze[this.x][this.y].players.indexOf(this), 1);
					switch(turn.move){
						case DIRECTIONS.TOP:
							this.y--;
							break;
						case DIRECTIONS.RIGHT:
							this.x++;
							break;
						case DIRECTIONS.BOTTOM:
							this.y++;
							break;
						case DIRECTIONS.LEFT:
							this.x--;
							break;
						default:
							alert("Something went wrong");
							console.error("Illegal direction: ", turn.move);
					}
					maze[this.x][this.y].players.push(this);
				} else {
					// Cannot move
					couldMove = false;
				}
			}

			// Deal with using weapons
			let weaponUse = "";
			if(turn.use !== null){
				if(turn.use.weapon === "gun"){
					// Gun
					weaponUse = "used a gun, shooting ";
					if(typeof turn.use.direction !== "number"){
						weaponUse = "wanted to use a gun, but didn't know where to shoot";
					} else if(maze[this.x][this.y].getWall(turn.use.direction) !== WALL_TYPES.NONE){
						// Wall in cell preventing gunshot
						weaponUse += "a wall";
					} else {
						// Simulate bullet
						let i = 1;
						let bulletHit = false;
						let hitCell;
						do {
							switch(turn.use.direction){
								case DIRECTIONS.TOP:
									hitCell = maze[this.x][this.y-i];
									break;
								case DIRECTIONS.RIGHT:
									hitCell = maze[this.x+i][this.y];
									break;
								case DIRECTIONS.BOTTOM:
									hitCell = maze[this.x][this.y+i];
									break;
								case DIRECTIONS.LEFT:
									hitCell = maze[this.x-i][this.y];
									break;
							}
							bulletHit = hitCell.players.length > 0 || hitCell.getWall(turn.use.direction) !== WALL_TYPES.NONE;
							i++;
						} while(!bulletHit);

						// Check what bullet hit
						if(hitCell.players.length > 0){
							let players = [...hitCell.players]; //clone array
							let target = players[randomInt(0, players.length-1)];
							target.damage();
							weaponUse += "player " + target.id + ", " + (target.health === 0 ? "killing" : "wounding") + " them";
						} else {
							weaponUse += "a wall";
						}
					}
				} else if(turn.use.weapon === "grenade"){
					// Grenade
					if(typeof turn.use.direction !== "number"){
						weaponUse = "wanted to use a grenade, but didn't know where to throw it";
					} else if(maze[this.x][this.y].getWall(turn.use.direction) !== WALL_TYPES.NONE){
						// Wall in cell preventing gunshot
						weaponUse = "threw a grenade " + directionToString(turn.use.direction) + ", ";
						if(maze[this.x][this.y].getWall(turn.use.direction) !== WALL_TYPES.NORMAL){
							weaponUse += "but the wall didn't blow up";
						} else {
							weaponUse += "blowing up the wall";
							maze[this.x][this.y].walls[turn.use.direction] = WALL_TYPES.NONE;
							switch(turn.use.direction){
								case DIRECTIONS.TOP:
									maze[this.x][this.y-1].walls[DIRECTIONS.BOTTOM] = WALL_TYPES.NONE;
									break;
								case DIRECTIONS.RIGHT:
									maze[this.x+1][this.y].walls[DIRECTIONS.LEFT] = WALL_TYPES.NONE;
									break;
								case DIRECTIONS.BOTTOM:
									maze[this.x][this.y+1].walls[DIRECTIONS.TOP] = WALL_TYPES.NONE;
									break;
								case DIRECTIONS.LEFT:
									maze[this.x-1][this.y].walls[DIRECTIONS.RIGHT] = WALL_TYPES.NONE;
									break;
								default:
									alert("Something went wrong");
									console.error("Illegal direction: ", turn.move);
							}
						}
					} else {
						weaponUse = "threw a grenade " + directionToString(turn.use.direction) + ", but they didn't hit a wall";
					}
				} else {
					// Knife
					weaponUse = "stabbed into the darkness and hit ";
					let players = [...maze[this.x][this.y].players]; //clone array
					players.splice(players.indexOf(this), 1);
					if(players.length > 0){
						// Hit someone
						let target = players[randomInt(0, players.length-1)];
						target.damage();
						weaponUse += "player " + target.id + ", " + (target.health === 0 ? "killing" : "wounding") + " them";
					} else {
						// Hit nothing
						weaponUse += "nothing";
					}
				}
			}

			// Print message
			if(turn.move !== null && turn.use !== null){
				// Moving and weapons
				if(couldMove){
					printConsole(`Player ${this.id} moved ${directionToString(turn.move)} and ${weaponUse}.`);
				} else {
					printConsole(`Player ${this.id} tried moving ${directionToString(turn.move)} but ran into ${wallToString(maze[this.x][this.y].getWall(turn.move), true)}. They also ${weaponUse}.`);
				}
			} else if(turn.move !== null){
				// Moving only
				if(couldMove){
					printConsole(`Player ${this.id} moved ${directionToString(turn.move)}.`);
				} else {
					printConsole(`Player ${this.id} tried moving ${directionToString(turn.move)} but ran into ${wallToString(maze[this.x][this.y].getWall(turn.move), true)}.`);
				}
			} else if(turn.use !== null){
				// Weapons only
				printConsole(`Player ${this.id} ${weaponUse}.`);
			}

			resolve();
		});
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
		this.ai = new UserAI(this);
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
