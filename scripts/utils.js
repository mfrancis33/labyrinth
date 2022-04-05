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

/**
 * Finds the distance between two coordinates
 * @param {number} x1 The x-position of the first coordinate
 * @param {number} y1 The y-position of the first coordinate
 * @param {number} x2 The x-position of the second coordinate
 * @param {number} y2 The y-position of the second coordinate
 * @returns A distance
 */
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

/**
 * Prints something out to the in-game console
 * @param {string} html The HTML to print
 */
function printConsole(html){
	elemConsole.appendChild(document.createElement("p")).innerHTML = html;
	elemConsole.scrollTop = elemConsole.scrollHeight;
}

function directionToString(direction){
	switch(direction){
		case DIRECTIONS.TOP:
			return "up";
		case DIRECTIONS.RIGHT:
			return "right";
		case DIRECTIONS.BOTTOM:
			return "down";
		case DIRECTIONS.LEFT:
			return "left";
		default:
			return "nowhere";
	}
}
