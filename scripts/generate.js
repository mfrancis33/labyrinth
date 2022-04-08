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
	let toRemove = Math.round(size * 2.5);
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
	const treasureX = randomInt(0, size - 1);
	const treasureY = randomInt(0, size - 1);
	treasure = new Treasure(treasureX, treasureY);
	maze[treasureX][treasureY].features.push(treasure);

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
			} while((x === treasureX && y === treasureY) || maze[x][y].features.findIndex(feature => feature.name == "wormhole") > -1);
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
		let numCrossbowTraps = randomInt(0, Math.round(size / 5));
		let numPitfallTraps = randomInt(0, Math.round(size / 5));
		// Generate traps
		for(let i = 0; i < numCrossbowTraps; i++){
			let x, y;
			do {
				x = randomInt(0, size - 1);
				y = randomInt(0, size - 1);
			} while((x === treasureX && y === treasureY) || maze[x][y].features.findIndex(feature => feature.name.indexOf("trap")) > -1);
			let trap = new CrossbowTrap(x, y);
			maze[x][y].features.push(trap);
		}
		for(let i = 0; i < numPitfallTraps; i++){
			let x, y;
			do {
				x = randomInt(0, size - 1);
				y = randomInt(0, size - 1);
			} while((x === treasureX && y === treasureY) || maze[x][y].features.findIndex(feature => feature.name.indexOf("trap")) > -1);
			let trap = new PitfallTrap(x, y);
			maze[x][y].features.push(trap);
		}
	}
}

/**
 * Places players within the maze
 */
function generatePlayers(){
	let x, y;
	let placed = false;
	do {
		x = randomInt(0, maze.length - 1);
		y = randomInt(0, maze.length - 1);
		if(maze[x][y].features.length === 0 && distance(x, y, treasure.x, treasure.y) > maze.length / 3){
			placed = true;
		}
	} while(!placed);

	playerList = [
		// Start out empty except first player
		new UserPlayer(x, y)
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

		do {
			x = randomInt(0, maze.length - 1);
			y = randomInt(0, maze.length - 1);
			if(maze[x][y].features.length === 0 && distance(x, y, treasure.x, treasure.y) > maze.length / 3){
				placed = true;
			}
		} while(!placed);
		playerList.push(new Player(i, x, y, new RandomAI()));
	}
}
