/*
gameScript.js
by Jacob Fisher
Javascript file that controls the canvas game
*/

/* all variable defaults
lives = 3;
level = 1;
paused = false;
resizeRequired = false;
justStarted = true;
requiredHeight = 600;
requiredWidth = 400;
goRight = true;
goLeft = false;
radius = 10;
ballx = 100;
bally = 100;
balldx = 0.5;
balldy = minSpeed;
speedX = 1;
dxStorage;
dyStorage;
paddleBottomX = 0;
paddleBottomY = canvasHeight - paddleBottomHeight;
paddleTopX = 0;
paddleTopY = 0;
*/

var isFirefox = typeof InstallTrigger !== 'undefined';
var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
var isIE = false || !!document.documentMode;
var isChrome = !!window.chrome && !!window.chrome.webstore;

//set up canvas
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

canvas.style.background = '#34495E'; //set canvas background color

//create heartFull and heartEmpty variables and set their image and size
var heartFull = document.createElement("IMG");
heartFull.setAttribute("src", "graphics/heart_full_small.png");
var heartEmpty = document.createElement("IMG");
heartEmpty.setAttribute("src", "graphics/heart_empty_small.png");
var heartSize = 30;

//sets up the canvas to be the size of the whole window
var canvasWidth = window.innerWidth;
var canvasHeight = window.innerHeight;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

//keps track of which stage of the tutorial the player is in
var tutorialScreen = 1;
var tutorialActive = true;

var gameOverActive = false;

//player data
var lives = 3;
var level = 1;
var levelStorage; //an extra variable to store the level so that after it is reset, it can still be displayed in the Game Over Screen
var paused = false; //keeps track of if the game is paused or not
var resizeRequired = false; //keeps track of it the user needs to resize the window, pause first before setting this to true
var justStarted = true; //a variable to keep track of if the game just started, so as to pause it immediately

//variables that control what size the window needs to be
const startingHeight = 600;
const startingWidth = 500;
var requiredHeight = startingHeight;
var requiredWidth = startingWidth;

//variables keeping track of whether the player needs to move left or right
var goRight = true;
var goLeft = false;

var radius = 10; //ball's radius

//constant variables involving the ball's movement
var minSpeed;
var maxSpeed;
var accelerationFactor;
if (isChrome) {
	minSpeed = 1;
	maxSpeed = 5;
	accelerationFactor = 100; //the ball accelerates slower the higher this number is
}

else {
	minSpeed = 2;
	maxSpeed = 8;
	accelerationFactor = 50; //the ball accelerates slower the higher this number is
}

//ball's coordinates
var ballx = 100;
var bally = 100;

//ball's velocity components
var default_balldx;
if (isChrome) {
	default_balldx = 0.5;
}
else {
	default_balldx = 1.0;
}
balldx = default_balldx;
var balldy = minSpeed;

var speedX = 1; //increments every time velocity is increased in order to model velocity as a function

//stores the ball's velocity components while the game is paused
var dxStorage;
var dyStorage;

//height and width of the lower paddle
var paddleBottomWidth = 80;
var paddleBottomHeight = 10;

//height and width of the upper paddle
var paddleTopWidth = 80;
var paddleTopHeight = 10;

//coordinates of the lower paddle
var paddleBottomX = 0;
var paddleBottomY = canvasHeight - paddleBottomHeight;

//coordinates of the upper paddle
var paddleTopX = 0;
var paddleTopY = 0;


var paddledx;
if (isChrome) {
	paddledx = 2;
}

else {
	paddledx = 4;
}

//boolean to track if the right,left, up, or down arrow keys are being pressed
var rightPressed = false;
var leftPressed = false;
var upPressed = false;
var downPressed = false;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

window.addEventListener("resize", resizeFunction);

function drawBall() {
	ctx.beginPath();
	ctx.arc(ballx, bally, radius, 0, Math.PI*2);
	ctx.fillStyle = "#EC7063";
	ctx.fill();
	ctx.closePath();
}

function drawPaddleBottom() {
	ctx.beginPath();
	ctx.rect(paddleBottomX, paddleBottomY, paddleBottomWidth, paddleBottomHeight);
	ctx.fillStyle = "#EC7063";
	ctx.fill();
	ctx.closePath();
}

function drawPaddleTop() {
	ctx.beginPath();
	ctx.rect(paddleTopX, paddleTopY, paddleTopWidth, paddleTopHeight);
	ctx.fillStyle = "#EC7063";
	ctx.fill();
	ctx.closePath();
}

function drawLevel() {
	ctx.fillStyle = "#fff";
	ctx.font = "150px 'Norwester'";
	ctx.textAlign = "center";
	ctx.textBaseline = 'middle';
	ctx.fillText(level, canvasWidth/2, canvasHeight/2);
}

function drawRightGraphic() {
	ctx.beginPath();
	ctx.rect(canvasWidth - 10, 0, 10, canvasHeight);
	ctx.fillStyle = "#eee";
	ctx.fill();
	ctx.closePath();
}

function drawLeftGraphic() {
	ctx.beginPath();
	ctx.rect(0, 0, 10, canvasHeight);
	ctx.fillStyle = "#eee";
	ctx.fill();
	ctx.closePath();
}

function drawResizePrompt() {
	ctx.font = "40px Norwester";
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = "center";
	ctx.textBaseline = 'middle';
	ctx.fillText("Level " + level,canvasWidth/2,canvasHeight/2 - 125);
	ctx.font = "25px Norwester";

	ctx.textAlign = "center";
	ctx.textBaseline = 'middle';
	ctx.fillText("Please resize window to height: " + requiredHeight,canvasWidth/2,canvasHeight/2 - 75);

	ctx.textAlign = "center";
	ctx.textBaseline = 'middle';
	ctx.fillText("Please resize window to width: " + requiredWidth,canvasWidth/2,canvasHeight/2 - 25);

	ctx.textAlign = "center";
	ctx.textBaseline = 'middle';
	ctx.fillText("Current height: " + canvasHeight,canvasWidth/2,canvasHeight/2 + 25);	

	ctx.textAlign = "center";
	ctx.textBaseline = 'middle';
	ctx.fillText("Current width: " + canvasWidth,canvasWidth/2,canvasHeight/2 + 75);
}

function detectWallContact() {
	//when the ball gets to the right of the canvas it changes directions
	if ((ballx+radius) > canvasWidth) {
		balldx *= -1;
		//if it's supposed to hit the right wall, change directions it's supposed to go
		if (goRight == true) {
			goRight = false;
			goLeft = true;
		}
	}

	//when the ball gets to the left of the canvas it changes directions
	if ((ballx-radius) < 0) {
		balldx *= -1;
		//if it's supposed to hit the left wall, increase the level and change directions it's supposed to go
		if (goLeft == true) {
			goLeft = false;
			goRight = true;
			level++;

			switch (level) {
				case 1:
					requiredHeight = startingHeight;
					requiredWidth = startingWidth;
					break;
				case 2:
					requiredHeight = 600;
					requiredWidth = 600;
					break;
				case 3:
					requiredHeight = 500;
					requiredWidth = 500;
					break;
				case 4:
					requiredHeight = 600;
					requiredWidth = 800;
					break;
				case 5:
					requiredHeight = 400;
					requiredWidth = 800;
					break;
				case 6:
					requiredHeight = 600;
					requiredWidth = 1000;
					break;
				case 7:
					requiredHeight = 400;
					requiredWidth = 1000;
					break;
				case 8:
					requiredHeight = 400;
					requiredWidth = 1200;
					break;
				case 9:
					requiredHeight = 200;
					requiredWidth = 800;
					break;
				case 10:
					requiredHeight = 200;
					requiredWidth = 1000;
					break;
				case 11:
					requiredHeight = 200;
					requiredWidth = 1200;
					break;
				default: //after the last level, just keep that difficulty
					requiredHeight = 200;
					requiredWidth = 1200;
					break;
			}

			//reset ball and paddle variables
			ballx = 100;
			bally = 100;
			balldx = default_balldx;
			balldy = minSpeed;
			speedX = 1;
			paddleTopX = 0;
			paddleBottomX = 0;

			pauseGame();
			resizeRequired = true;
		}
	}
}

function detectPaddleContact() {
	if ((bally+radius) > canvasHeight) {
		//ball hits the bottom paddle and changes directions and speeds up
		if ((ballx >= paddleBottomX) && (ballx <= paddleBottomX+paddleBottomWidth)) {
			speedX++;
			balldy = (-1) * (((maxSpeed - minSpeed) * speedX) / (speedX + accelerationFactor) + minSpeed);
			balldx = (((ballx - paddleBottomX) / paddleBottomWidth) - 0.5) * 1.5;
		}

		//ball hits the bottom of the screen
		else {
			resetGame();
		}
	}

	if ((bally-radius) < 0) {
		//ball hits the top paddle and changes directions and speeds up
		if ((ballx >= paddleTopX) && (ballx <= paddleTopX+paddleTopWidth)) {
			speedX++;
			balldy = (1) * (((maxSpeed - minSpeed) * speedX) / (speedX + accelerationFactor) + minSpeed);
			balldx = (((ballx - paddleTopX) / paddleTopWidth) - 0.5) * 1.5;
		}

		//ball hits the bottom of the screen
		else {
			resetGame();
		}
	}
}

function detectArrowPress() {
	//if the right key is pressed and the paddle is not at the right edge, move it to the left
	if ((rightPressed) && (paddleBottomX + paddleBottomWidth < canvasWidth)) {
		paddleBottomX += paddledx;
	}

	//if the left key is pressed and the paddle is not at the left edge, move it to the left
	if ((leftPressed) && (paddleBottomX > 0)) {
		paddleBottomX -= paddledx;
	}

	//if the up key is pressed and the paddle is not at the right edge, move it to the left
	if ((upPressed) && (paddleTopX + paddleTopWidth < canvasWidth)) {
		paddleTopX += paddledx;
	}

	//if the down key is pressed and the paddle is not at the left edge, move it to the left
	if ((downPressed) && (paddleTopX > 0)) {
		paddleTopX -= paddledx;
	}
}

//called every time the window is resized
function resizeFunction() {
	if (paused == false) {
		pauseGame();
	}

	canvasWidth = window.innerWidth;
	canvasHeight = window.innerHeight;
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;

	if ((Math.abs(canvasWidth - requiredWidth) > 50) || (Math.abs(canvasHeight - requiredHeight) > 50)) {
		resizeRequired = true;
		paused = true;
	}
}

function resetGame() {
	ballx = 100;
	bally = 100;
	balldx = default_balldx;
	balldy = minSpeed;
	paddleTopX = 0;
	paddleBottomX = 0;
	speedX = 1;
	goLeft = false;
	goRight = true;

	if (lives > 1) {
		lives --;
	}

	else {
		gameOverActive = true;
		lives = 3;
		justStarted = true;
		levelStorage = level;
		level = 1;
		requiredHeight = startingHeight;
		requiredWidth = startingWidth;
	}
}

function pauseGame() {
	if (paused == false) {
		dxStorage = balldx;
		dyStorage = balldy;
		balldy = 0;
		balldx = 0;
		paused = true;
	}
}

function resumeGame() {
	//if the bottom paddle is to the right of the newly resized screen, place it at the right border of the screen
	if (paddleBottomX + paddleBottomWidth > canvasWidth) {
		paddleBottomX = canvasWidth - paddleBottomWidth;
	}

	//if the top paddle is to the right of the newly resized screen, place it at the right border of the screen
	if (paddleTopX + paddleTopWidth > canvasWidth) {
		paddleTopX = canvasWidth - paddleTopWidth;
	}

	//if the ball is to the right of the newly resized screen, place it at the right border of the screen
	if (ballx + radius > canvasWidth) {
		ballx = canvasWidth - radius;
	}

	//if the ball is below the newly resized screen, place it in the middle of the screen
	if (bally + radius > canvasHeight) {
		bally = canvasHeight/2;
	}

	//place the bottom paddle at the very base of the window (to account for resized windows)
	paddleBottomY = canvasHeight - paddleBottomHeight;

	balldx = dxStorage;
	balldy = dyStorage;
	paused = false;
}

function keyDownHandler(e) {
	if(e.keyCode == 37) {
		leftPressed = true;
	}
	else if(e.keyCode == 38) {
		upPressed = true;
	}
	else if(e.keyCode == 39) {
		rightPressed = true;
	}
	else if(e.keyCode == 40) {
		e.preventDefault(); //makes screen not scroll on press of down arrow
		downPressed = true;
	}

	//press of space bar
	else if(e.keyCode == 32 && !tutorialActive) {
		if (paused == false) {
			pauseGame();
		}

		else if (paused == true && resizeRequired == false) {
			resumeGame();
		}
	}
}

function keyUpHandler(e) {
	if(e.keyCode == 37) {
		leftPressed = false;
	}
	else if(e.keyCode == 38) {
		upPressed = false;
	}
	else if(e.keyCode == 39) {
		rightPressed = false;
	}
	else if(e.keyCode == 40) {
		e.preventDefault(); //makes screen not scroll on press of down arrow
		downPressed = false;
	}
	else if(e.keyCode == 32 && tutorialActive) {
		tutorialScreen++;
	}
	else if(e.keyCode == 32 && gameOverActive) {
		gameOverActive = false;
	}
}

function drawHearts() {
	if (lives == 3) {
		ctx.drawImage(heartFull, canvasWidth/2 - heartSize/2 - 1.5*heartSize, canvasHeight/2 - 115, heartSize, heartSize);
		ctx.drawImage(heartFull, canvasWidth/2 - heartSize/2, canvasHeight/2 - 115, heartSize, heartSize);
		ctx.drawImage(heartFull, canvasWidth/2 - heartSize/2 + 1.5*heartSize, canvasHeight/2 - 115, heartSize, heartSize);
	}

	else if (lives == 2) {
		ctx.drawImage(heartFull, canvasWidth/2 - heartSize/2 - 1.5*heartSize, canvasHeight/2 - 115, heartSize, heartSize);
		ctx.drawImage(heartFull, canvasWidth/2 - heartSize/2, canvasHeight/2 - 115, heartSize, heartSize);
		ctx.drawImage(heartEmpty, canvasWidth/2 - heartSize/2 + 1.5*heartSize, canvasHeight/2 - 115, heartSize, heartSize);
	}

	else if (lives == 1) {
		ctx.drawImage(heartFull, canvasWidth/2 - heartSize/2 - 1.5*heartSize, canvasHeight/2 - 115, heartSize, heartSize);
		ctx.drawImage(heartEmpty, canvasWidth/2 - heartSize/2, canvasHeight/2 - 115, heartSize, heartSize);
		ctx.drawImage(heartEmpty, canvasWidth/2 - heartSize/2 + 1.5*heartSize, canvasHeight/2 - 115, heartSize, heartSize);
	}

	else {
		ctx.drawImage(heartEmpty, canvasWidth/2 - heartSize/2 - 1.5*heartSize, canvasHeight/2 - 115, heartSize, heartSize);
		ctx.drawImage(heartEmpty, canvasWidth/2 - heartSize/2, canvasHeight/2 - 115, heartSize, heartSize);
		ctx.drawImage(heartEmpty, canvasWidth/2 - heartSize/2 + 1.5*heartSize, canvasHeight/2 - 115, heartSize, heartSize);
	}
}

function drawTutorial() {

	if (tutorialScreen == 1) {
		ctx.font = "40px Norwester";
		ctx.fillStyle = '#EC7063';

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("Move Right Move Left",canvasWidth/2,canvasHeight/2 - 75);

		ctx.fillStyle = '#fff';

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("is a game that's",canvasWidth/2,canvasHeight/2 - 25);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("a little bit different.",canvasWidth/2,canvasHeight/2 + 25);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("[press space bar to continue]",canvasWidth/2,canvasHeight/2 + 75);
	}

	else if (tutorialScreen == 2) {

		ctx.font = "30px Norwester";
		ctx.fillStyle = '#fff';

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("There are two paddles, each controlled independently.",canvasWidth/2,canvasHeight/2 - 175);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("The upper paddle is controlled",canvasWidth/2,canvasHeight/2 - 125);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("by the up and down arrow keys,",canvasWidth/2,canvasHeight/2 - 75);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("and the lower paddle is controlled",canvasWidth/2,canvasHeight/2 - 25);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("by the left and right arrow keys.",canvasWidth/2,canvasHeight/2 + 25);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("Practice controlling them now.",canvasWidth/2,canvasHeight/2 + 75);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("It's a little bit tricky.",canvasWidth/2,canvasHeight/2 + 125);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("[press space bar to continue]",canvasWidth/2,canvasHeight/2 + 175);

		drawPaddleTop();
		drawPaddleBottom();
		detectArrowPress();

		paddleBottomY = canvasHeight - paddleBottomHeight;
	}

	else if (tutorialScreen == 3) {
		ctx.font = "40px Norwester";
		ctx.fillStyle = '#fff';

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("Your goal is to use to paddles to control the ball.",canvasWidth/2,canvasHeight/2 - 125);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("In each level, you'll need to hit the right wall",canvasWidth/2,canvasHeight/2 - 75);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("with the ball, and then the left wall.",canvasWidth/2,canvasHeight/2 - 25);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("You'll then move on to the next level",canvasWidth/2,canvasHeight/2 + 25);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("and things will get harder.",canvasWidth/2,canvasHeight/2 + 75);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("[press space bar to continue]",canvasWidth/2,canvasHeight/2 + 125);
	}

	else if (tutorialScreen == 4) {
		ctx.font = "40px Norwester";
		ctx.fillStyle = '#fff';

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("Before each level, you'll need",canvasWidth/2,canvasHeight/2 - 100);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("to resize your browser's window",canvasWidth/2,canvasHeight/2 - 50);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("to change the game's size.",canvasWidth/2,canvasHeight/2 - 0);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("This can make the game a lot harder.",canvasWidth/2,canvasHeight/2 + 50);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("[press space bar to continue]",canvasWidth/2,canvasHeight/2 + 100);
	}

	else if (tutorialScreen == 5) {

		ctx.font = "40px Norwester";
		ctx.fillStyle = '#fff';

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("Try to get as far as you can",canvasWidth/2,canvasHeight/2 - 75);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("with three lives. It may start easy,",canvasWidth/2,canvasHeight/2 - 25);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("but just you wait. Good luck.",canvasWidth/2,canvasHeight/2 + 25);

		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		ctx.fillText("[press space bar to begin]",canvasWidth/2,canvasHeight/2 + 75);
	}

	else {
		tutorialActive = false;
	}
}

function drawGameOver() {
	ctx.font = "40px Norwester";
	ctx.fillStyle = '#EC7063';

	ctx.textAlign = "center";
	ctx.textBaseline = 'middle';
	ctx.fillText("Game Over",canvasWidth/2,canvasHeight/2 - 50);

	ctx.fillStyle = '#fff';

	ctx.textAlign = "center";
	ctx.textBaseline = 'middle';
	ctx.fillText("You got to level " + levelStorage,canvasWidth/2,canvasHeight/2 - 0);

	ctx.textAlign = "center";
	ctx.textBaseline = 'middle';
	ctx.fillText("[press space bar to play again]",canvasWidth/2,canvasHeight/2 + 50);
}

//this function is called every frame
function update() {
	
	if (tutorialActive) {
		ctx.clearRect(0, 0, canvasWidth, canvasHeight); //clear screen
		drawTutorial();
	}

	else if (gameOverActive) {
		ctx.clearRect(0, 0, canvasWidth, canvasHeight); //clear screen
		drawGameOver();
	}

	else {
		//sets up the initial resize prompt
		if (justStarted == true) {
			pauseGame();
			resizeRequired = true;
			justStarted = false;
		}

		//game not paused, normal game continues
		if (paused == false) {
			detectWallContact(); //deals with when the ball gets to the left and right of the screen
			detectPaddleContact(); //deals with when the ball gets to the top and bottom of the screen
			detectArrowPress();	//deals with when the user presses the arrow keys

			ctx.clearRect(0, 0, canvasWidth, canvasHeight); //clear screen

			drawHearts();
			drawLevel();
			drawBall();
			drawPaddleBottom();
			drawPaddleTop();

			ballx += balldx; //update ball's x position
			bally += balldy; //update ball's y position

			if (goRight == true) {
				drawRightGraphic();
			}

			if (goLeft == true) {
				drawLeftGraphic();
			}
		}

		else {
			//game paused and resize required
			if (resizeRequired == true) {
				pauseGame();
				ctx.clearRect(0, 0, canvasWidth, canvasHeight); //clear screen

				drawResizePrompt();

				if ((Math.abs(canvasWidth - requiredWidth) < 50) && (Math.abs(canvasHeight - requiredHeight) < 50)) {
					resizeRequired = false;
				}
			}

			//normal pause procedures
			else {
				ctx.clearRect(0, 0, canvasWidth, canvasHeight); //clear screen
				paddleBottomY = canvasHeight - paddleBottomHeight;
				drawLevel();
				drawBall();
				drawPaddleBottom();
				drawPaddleTop();
			}
		}
	}	
}

if (isChrome) {
	var gameInterval = setInterval(update, 5);
}

else {
	alert ("Warning: This game works best with Google Chrome");
	var gameInterval = setInterval(update, 5);
}