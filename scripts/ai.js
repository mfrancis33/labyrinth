/**
 * Base AI class.
 * 
 * There are several types of AI that are chosen randomly for the other NPCs.
 * Each type of AI is designed to play the game slightly differently,
 * prioritizing different actions. One type of AI is just a placeholder for
 * the player-controlled AI.
 */
class AI {
	/** @type {Player} */
	player;
	knowledge;

	constructor(){
		this.knowledge = {
			maze: new Array(maze.size),
			players: []
		};
		for(let i = 0; i < this.knowledge.length; i++){
			this.knowledge.maze[i] = new Array(maze.size);
		}
	}

	/**
	 * Figures out what to do in a turn
	 * @returns A promise which resolves to a {@link Turn}
	 */
	turn(){
		return new Promise(resolve => resolve(new Turn(null, null)));
	}
}

/**
 * A version of the AI controlled by the player
 */
class UserAI extends AI {
	turn(){
		return new Promise(resolve => {
			// Wait for submit
			elemControls.onsubmit = function(e){
				e.preventDefault();
				let dir = null;
				let use = null;
				const form = document.forms.controls;

				// Figure out where we want to go
				if(form["move"].checked){
					switch(form["move-direction"].value){
						case "up":
							dir = DIRECTIONS.TOP;
							break;
						case "right":
							dir = DIRECTIONS.RIGHT;
							break;
						case "down":
							dir = DIRECTIONS.BOTTOM;
							break;
						case "left":
							dir = DIRECTIONS.LEFT;
							break;
						default:
							dir = null;
							break;
					}
				}

				// Figure out if we want to use somehting
				if(form["use"].checked){
					let weapon = form["weapon"].value;
					let weaponDir;
					switch(form["use-direction"].value){
						case "up":
							weaponDir = DIRECTIONS.TOP;
							break;
						case "right":
							weaponDir = DIRECTIONS.RIGHT;
							break;
						case "down":
							weaponDir = DIRECTIONS.BOTTOM;
							break;
						case "left":
							weaponDir = DIRECTIONS.LEFT;
							break;
						default:
							weaponDir = null;
							break;
					}
					use = new Use(weapon, weaponDir);
				}

				// Return our turn
				resolve(new Turn(dir, use));
			}
		});
	}
}

class RandomAI extends AI {
	turn(){
		return new Promise(resolve => {
			let rand = randomInt(1, 10);
			let use = null;
			if(rand === 1){
				let weapon = (function(rand){
					switch(rand){
						case 1:
							return "gun";
						case 2:
							return "knife";
						case 3:
							return "grenade";
					}
				})(randomInt(1, 3));
				let dir = (function(rand){
					switch(rand){
						case 1:
							return DIRECTIONS.TOP;
						case 2:
							return DIRECTIONS.RIGHT;
						case 3:
							return DIRECTIONS.BOTTOM;
						case 4:
							return DIRECTIONS.LEFT;
					}
				})(randomInt(1, 5));
				use = new Use(weapon, dir);
			}
			let dir = (function(rand){
				switch(rand){
					case 1:
						return DIRECTIONS.TOP;
					case 2:
						return DIRECTIONS.RIGHT;
					case 3:
						return DIRECTIONS.BOTTOM;
					case 4:
						return DIRECTIONS.LEFT;
				}
			})(randomInt(1, 4));
			resolve(new Turn(dir, use));
		});
	}
}

class SimpleAI extends AI {
	target;
}
