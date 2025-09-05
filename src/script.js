const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d');

const BASE_WIDTH = 680;
const BASE_HEIGHT = 680;
let SCREEN_WIDTH = BASE_WIDTH;
let SCREEN_HEIGHT = BASE_HEIGHT;

const fps = 60;
const frameTime = 1000 / fps;

//* colors (falbacks if sprites are not loaded)
const white = '#ffffff';
const skyBlue = '#87ceeb';
const green = '#00c800';
const red = '#ff0000';
const darkGray = '#282828';
const groundColor = '#8b4513';

//* sounds
const pointSound = new Audio('src/assets/sounds/point.ogg');
const flapSound = new Audio('src/assets/sounds/wing.ogg');
const hitSound = new Audio('src/assets/sounds/hit.ogg');
const dieSound = new Audio('src/assets/sounds/die.ogg');

//* pipe
const pipeWidth = 90;
const pipeGap = 150;
const pipeVelocity = 4;
const PIPE_SPAWN_TIME = 1500;

const PIPE_PATH = "src/assets/sprites/pipes/";
const PIPE_FILES = ["pipe-green.png", "pipe-red.png"];
let pipeSprites = [];
let pipeImg = null;

const BG_PATH = "src/assets/sprites/bg/";
const BG_FILES = ["background-day.png", "background-night.png"];
let bgSprites = [];
let bgImg = null;

//* ground
const groundHeight = 80;
const GROUND_FILE = "src/assets/sprites/others/base.png";
let groundSprite = null;

//* bird
const bird = {
	width: 50,
	height: 35,
	x: 60,
	y: SCREEN_HEIGHT / 2,
	velocity: 0,
	gravity: 0.6,
	flapStrength: -10,
	rotation: 0,
	forceAngle: null
};

const BIRD_COLORS = ["red", "yellow", "blue"];
const BIRD_PATH = "src/assets/sprites/birds/";
let birdSpritesMap = {};
let birdImg = null;
let birdFrame = 1;
let frameCount = 0;

//* score
const NUMBER_PATH = "src/assets/sprites/score/";
const NUMBER_FILES = ["0.png","1.png","2.png","3.png","4.png","5.png","6.png","7.png","8.png","9.png"];
let numberSprites = [];

//* game over
const GAMEOVER_FILE = "src/assets/sprites/others/gameover.png";
let gameOverSprite = null;

//* get ready message
const GETREADY_FILE = "src/assets/sprites/others/message.png";
let getReadySprite = null;

//* restart button
const RESTART_FILE = "src/assets/sprites/others/PlayButton.png";
let buttonSprite = null;

const restartButton = {
	x: SCREEN_WIDTH / 2 - 100,
	y: SCREEN_HEIGHT / 2 + 50,
	width: 100,
	height: 50,
};

//* ground and bg scrolling.
let bg_x = 0;
let ground_x = 0;
const BG_SPEED_MULT = 0.2
let bg_speed = pipeVelocity * BG_SPEED_MULT;
let ground_speed = pipeVelocity;

//* game state 
let running = true;
let gameOver = false;
let pipes = [];
let passedPipes = [];
let score = 0;
let lastPipeTime = 0;
let groundOffset = 0;

let gameState = "start";
let startTime = 0;
let floatOffset = 0;

let birdXRatio = 0.09
let devicePixelRatio = window.devicePixelRatio || 1;
let currentScale = 1;
let offsetX = 0;
let offsetY = 0;

//* death animation variables.
let dead = false;
let deathTimer = 0;
let hitBounce = false;
let startAngle = 50;
let angleTime = 20;
let angleFrame = 0;
let flashDuration = 8;
let flashTimer = 0;

const FLOAT_HEIGHT = 15;
const FLOAT_SPEED = 0.05;


//! ============================
//! ==== PRELOADING SPRITES ====
//! ============================

const loadImg = (src) => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	})
}

const loadBirdSprites = async () => {
	for (const color of BIRD_COLORS) {
		//* paths for three bird animation frames
		const up = `${BIRD_PATH}${color}bird-upflap.png`;
		const mid = `${BIRD_PATH}${color}bird-midflap.png`;
		const down = `${BIRD_PATH}${color}bird-downflap.png`;

		try {
			//* to load all 3 frames simultaneously.
			const imgs = await Promise.all([loadImg(up), loadImg(mid), loadImg(down)]);
			birdSpritesMap[color] = imgs;
		} catch (err) {
			console.warn('Failed to load bird sprites for', color, err);
			birdSpritesMap[color] = null; //*fallback to drawing rectangle
		}
	}
}

const loadPipeSprites = async () => {
	//* to load pipe sprites (red pipe, green pipe).
	const promises = PIPE_FILES.map(fname => loadImg(PIPE_PATH + fname).catch(err => {
		console.warn("Failed to load pipe sprite", fname, err);
		return null;
	}))

	const imgs = await Promise.all(promises);
	pipeSprites = imgs;
}

const loadBgSprites = async () => {
	//* to load background sprites (day and night)
	const promises = BG_FILES.map(fname => loadImg(BG_PATH + fname).catch(err => {
		console.warn("Failed to load bg sprite", fname, err);
		return null;
	}));

	const imgs = await Promise.all(promises);
	bgSprites = imgs;
}

const loadGroundSprites = async () => {
	//* to load the ground sprite.
	try {
		groundSprite = await loadImg(GROUND_FILE);
	} catch (err) {
		console.warn("Failed to load ground sprite", err);
		groundSprite = null;
	}
}

const loadNumberSprites = async () => {
	// to load number sprites for score (0-9).
	const promises = NUMBER_FILES.map(fname => loadImg(NUMBER_PATH + fname).catch(err => {
		console.warn("Failed to load number sprite", fname, err);
		return null;
	}))

	const imgs = await Promise.all(promises);
	numberSprites = imgs;
}

const loadGameOverSprite = async () => {
	//* to load the "Game Over" text sprite.
	try {
		gameOverSprite = await loadImg(GAMEOVER_FILE);
	} catch (err) {
		console.warn("Failed to load game over sprite", err);
		gameOverSprite = null;
	}
}

const loadGetReadySprite = async () => {
	//* to load the "Get ready" sprite.
	try {
		getReadySprite = await loadImg(GETREADY_FILE);
	} catch (err) {
		console.warn("Failed to load get ready sprite", err);
		getReadySprite = null;
	}
}

const loadButtonSprite = async () => {
	//* to load the restart button sprite.
	try {
		buttonSprite = await loadImg(RESTART_FILE);
	} catch (err) {
		console.warn("Failed to load button sprite", err);
		buttonSprite = null;
	}
}


//! ==================================
//! ====== CORE GAME FUNCTIONS =======
//! ==================================

const gameStart = () => {
	gameState = "playing";
	running = true;
	startTime =performance.now();
}

const isMobile = () => {
	return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const resizeCanvas = () => {
	devicePixelRatio = window.devicePixelRatio || 1;

	//* to get the current window size.
	const cssWidth = window.innerWidth;
	const cssHeight = window.innerHeight;

	if (isMobile()) {
		//* for mobile
		SCREEN_WIDTH = cssWidth;
		SCREEN_HEIGHT = cssHeight;
	} else {
		//* for desktop
		SCREEN_WIDTH = Math.max(BASE_WIDTH, cssWidth);
		SCREEN_HEIGHT = Math.max(BASE_HEIGHT, cssHeight);
	}

	
	currentScale = 1;

	offsetX = 0;
	offsetY = 0;

	//* set css size (how big the game appears on the screen)
	canvas.style.width = cssWidth + 'px';
	canvas.style.height = cssHeight + 'px';
	canvas.style.position = 'fixed';
	canvas.style.top = "0"
	canvas.style.left = "0";

	canvas.width = Math.floor(cssWidth * devicePixelRatio);
	canvas.height = Math.floor(cssHeight * devicePixelRatio);

	//* to scale the rendering context.
	ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

	//* to reposition bird based on every screen size.
	bird.x = Math.max(60, SCREEN_WIDTH * birdXRatio);

	//* to keep bird in a good position if screen got smaller.
	if (bird.y > SCREEN_HEIGHT / 2) {
        bird.y = SCREEN_HEIGHT / 2;
    }

	//* restart button positioning.
	if (isMobile()) {
		const minButtonSize = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
		restartButton.width = Math.max(100, minButtonSize * 0.15);
		restartButton.height = Math.max(50, minButtonSize * 0.08);
	} else {
		restartButton.width = 100;
		restartButton.height = 50;
	}

	// restart button position.
	restartButton.x = Math.round((SCREEN_WIDTH - restartButton.width) / 2);
	restartButton.y = Math.round(SCREEN_HEIGHT * 0.55);

};


const getPointer = (evt) => {
	const rect = canvas.getBoundingClientRect();

	//* to handle both mouse and touch events.
	const clientX = evt.touches && evt.touches[0] ? evt.touches[0].clientX : evt.clientX;
	const clientY = evt.touches && evt.touches[0] ? evt.touches[0].clientY : evt.clientY;

	//* to convert from screen coordinates to canvas coordinates
	const cssX = clientX - rect.left;
	const cssY = clientY - rect.top;

	const insideX = cssX - offsetX;
	const insideY = cssY - offsetY;

	//* to check if the click is within the game area.
	if (
		insideX < 0 ||
		insideY < 0 ||
		insideX > SCREEN_WIDTH * currentScale ||
		insideY > SCREEN_HEIGHT * currentScale
	) {
		return null;
	}

	const x = insideX / currentScale;
	const y = insideY / currentScale;
	return { x, y };
};

const spawnPipe = () => {
	const minTop = 100;
	const maxTop = SCREEN_HEIGHT - pipeGap - groundHeight - 100;

	//* random height for the top pipe.
	const height = Math.random() * Math.max(0, maxTop - minTop) + minTop;

	//* to spawn pipes on the right side
	const spawnX = SCREEN_WIDTH + pipeWidth;

	const scalePipeWidth = isMobile() ? Math.max(pipeWidth, pipeWidth * (SCREEN_WIDTH / BASE_WIDTH)) : pipeWidth;

	//* pick a random pipe sprite.
	const sprite = pipeImg || null;

	//* create top pipe
	const topPipe = {
		x: spawnX,
		y: 0,
		width: scalePipeWidth,
		height: height,
		sprite: sprite
	};

	//* create bottom pipe
	const bottomPipe = {
		x: spawnX,
		y: height + pipeGap,
		width: scalePipeWidth,
		height: SCREEN_HEIGHT - (height + pipeGap) - groundHeight,
		sprite: sprite
	};

	return [topPipe, bottomPipe];
};

const movePipes = () => {
	//* looping backwards so we can safely remove pipes.
	for (let i = pipes.length - 1; i >= 0; i--) {
		//* move pipe left.
		pipes[i].x -= pipeVelocity;

		//* removing the pipes that are not be able to see on screen.
		if (pipes[i].x + pipes[i].width < -pipeWidth) {
			const removePipe = pipes[i];
			pipes.splice(i, 1);

			const passedIndex = passedPipes.indexOf(removePipe);
			if (passedIndex > -1) {
				passedPipes.splice(passedIndex, 1);
			}
		}
	}
};

const rectCollisions = (rect1, rect2) => {
	//* rectangles collission detection.
	return (
		rect1.x < rect2.x + rect2.width &&
		rect1.x + rect1.width > rect2.x &&
		rect1.y < rect2.y + rect2.height &&
		rect1.y + rect1.height > rect2.y
	);
};

const checkCollisions = () => {
	//* create bird's collision rectangle.
	const birdRect = {
		x: bird.x,
		y: bird.y,
		width: bird.width,
		height: bird.height,
	};
 
	//* to check the collisions with each pipe.
	for (let pipe of pipes) {
		if (rectCollisions(birdRect, pipe)) {
			hitSound.currentTime = 0;
			hitSound.play();

			dead = true;
			deathTimer = 30;
			flashTimer = flashDuration;
			return true;
		}
	}

	//* to check ground boundary
	if (bird.y + bird.height > SCREEN_HEIGHT - groundHeight) {
		//* hit and die sounds will play at the same time if the bird collides in ground.
		hitSound.currentTime = 0;
		hitSound.play();
		dieSound.currentTime = 0;
		dieSound.play();

		dead= true
		deathTimer = 0;
		flashTimer = flashDuration;
		return true;
	}

	//* to allow bird to fly above screen
	if (bird.y < -bird.height / 2) {
		bird.y = -bird.height / 2;
	}

	return false;
};

const updateScore = () => {
	//* to update the score when bird passes pipes.
	for (let pipe of pipes) {
		if (pipe.x + pipe.width < bird.x && !passedPipes.includes(pipe)) {
			score += 0.5;
			passedPipes.push(pipe);
			pointSound.currentTime = 0;
			pointSound.play();
		}
	}
};

const drawScore = (score) => {
	const scoreStr = Math.floor(score).toString();
	const digits = scoreStr.split("").map(d => parseInt(d, 10));

	//* scale digits based on screen size
	let scale = 1.5;
	if (isMobile()) {
		const minDimension = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
		scale = Math.max(1, minDimension / 400);
	}


	const digitWidth = (numberSprites[0]?.width || 30) * scale;
	const digitHeight = (numberSprites[0]?.height || 40) * scale;

	let totalWidth = digits.length * digitWidth;
	let startX = (SCREEN_WIDTH - totalWidth) / 2;
	let y ; //* score distance from top

	if (running) {
		y = isMobile() ? Math.max(50, SCREEN_HEIGHT * 0.08) : 30;
	} else {
		y = SCREEN_HEIGHT * 0.4;
	}

	digits.forEach(digit => {
		const img = numberSprites[digit];
		if (img) {
			ctx.drawImage(img, startX, y, digitWidth, digitHeight);
		} else {
			ctx.fillStyle = "white";
			ctx.font = `${digitHeight}px Arial`;
			ctx.textAlign ="left";
			ctx.fillText(digit, startX, y + digitHeight);
		}
		startX += digitWidth;
	})
};

const drawRect = (x, y, width, height, color) => {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, width, height);
};

const drawText = (text, x, y, color, fontSize = 72) => {
	ctx.fillStyle = color;
	ctx.font = `${fontSize}px Arial`;
	ctx.textAlign = 'center';
	ctx.fillText(text, x, y);
};

const drawBird = () => {
	const img = birdImg ? birdImg[birdFrame] : null;

	let birdY = bird.y;
	let rotation = bird.rotation;

	if (gameState === "start") {
		birdY = bird.y + Math.sin(floatOffset) * FLOAT_HEIGHT;
		rotation = Math.sin(floatOffset * 0.5) * 5;

	} else if (dead && bird.forceAngle !== null) {
		rotate = bird.forceAngle;

	} else {
		rotation = Math.max(-25, Math.min(45, bird.velocity * 2));
	}

	const angleRad = (rotation * Math.PI) / 180;

	//bird rotation
	ctx.save();

	const cx = bird.x + bird.width / 2;
	const cy = birdY + bird.height / 2;
	ctx.translate(cx, cy);
	ctx.rotate(angleRad);

	//draw bird
	if (img) {
		ctx.drawImage(img, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
	} else {
		ctx.fillStyle = red;
		ctx.fillRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);
	}

	ctx.restore();
};

const drawGetReady = () => {
	if (getReadySprite) {
		//* calculating the size of the get ready message. 
		const width = 300;
		const height = 200;
		const x = (SCREEN_WIDTH - width) / 2;
		const y = (SCREEN_HEIGHT - height) / 2;
		
		ctx.drawImage(getReadySprite, x, y, width, height);
	}
}

const drawStartScreen = () => {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = '#000'; // letterbox background color
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.restore();

	//* bg
	if (bgImg) {
		const bgWidth = bgImg.width;
        const numBgTiles = Math.ceil(SCREEN_WIDTH / bgWidth) + 1;
        
        for (let i = 0; i < numBgTiles; i++) {
            ctx.drawImage(bgImg, bg_x + (i * bgWidth), 0, bgWidth, SCREEN_HEIGHT);
        }
	} else {
		ctx.fillStyle = skyBlue;
		ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	}

	//* draw floating bird
	drawBird();

	//* ground
	const groundY = SCREEN_HEIGHT - groundHeight;
	if (typeof groundSprite !== "undefined" && groundSprite) {
		const groundWidth = groundSprite.width;
        const numGroundTiles = Math.ceil(SCREEN_WIDTH / groundWidth) + 1;
        
        for (let i = 0; i < numGroundTiles; i++) {
            ctx.drawImage(groundSprite, ground_x + (i * groundWidth), groundY, groundWidth, groundHeight);
        }
	} else {
		ctx.fillStyle = groundColor;
        ctx.fillRect(0, groundY, SCREEN_WIDTH, groundHeight);
	}

	//* draw get ready message
	if (getReadySprite) {
		let scale = 1;
		if (isMobile()) {
			const minDimension = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
			scale = minDimension / 600;
		}

		const width = Math.min(300 * scale, SCREEN_WIDTH * 0.45);
		const height = width * (getReadySprite.height / getReadySprite.width); 
		const x = (SCREEN_WIDTH - width) / 2;
		const y = SCREEN_HEIGHT * 0.18;

		ctx.drawImage(getReadySprite, x, y, width, height)
	}else {
		const fontSize = isMobile() ? Math.min(48, SCREEN_WIDTH / 12) : 48;
		const smallFontSize = isMobile() ? Math.min(32, SCREEN_WIDTH / 18) : 32;

		drawText('Get Ready!', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.35, white, fontSize);
		drawText('Tap to Start', SCREEN_WIDTH / 2, SCREEN_HEIGHT * 0.45, white, smallFontSize);
	}
}

const drawPipe = (pipe) => {
	const img = pipe.sprite;
	if (!img) {
		//fallback
		drawRect(pipe.x, pipe.y, pipe.width, pipe.height, green);
		return;
	}

	const SRC_CAP = 0.12;
	const DEST_CAP_MULTIPLIER = 0.80;
	const MIN_CAP = 6;
	const MAX_CAP = Math.round(pipe.width * 0.6);

	const srcCap = Math.max(1, Math.round(img.height * SRC_CAP));

	let destCap = Math.max(MIN_CAP, Math.round(pipe.width * DEST_CAP_MULTIPLIER));
	destCap = Math.min(destCap, MAX_CAP);

	//* to ensure the caps will fit into pipe height
	if (destCap * 2 > pipe.height) {
		destCap = Math.floor(pipe.height / 2);
	}

	const srcMiddleH = Math.max(0, img.height - srcCap * 2);
	const destMiddleH = Math.max(0, pipe.height - destCap * 2);

	//* draw bottom pipe
	if (pipe.y > 0) {
		ctx.drawImage(img, 0, 0, img.width, srcCap, pipe.x, pipe.y, pipe.width, destCap);

		if (destMiddleH > 0 && srcMiddleH > 0) {
      		ctx.drawImage(img, 0, srcCap, img.width, srcMiddleH, pipe.x, pipe.y + destCap, pipe.width, destMiddleH);
		}

		//* bottom cap
		ctx.drawImage(img, 0, img.height - srcCap, img.width, srcCap, pipe.x, pipe.y + destCap + destMiddleH, pipe.width, destCap);
    	return;
	}

	//* draw top pipe
	ctx.save();
	ctx.translate(pipe.x, pipe.height);
	ctx.scale(1, -1);
	ctx.drawImage(img, 0, 0, img.width, srcCap, 0, 0, pipe.width, destCap);

	if (destMiddleH > 0 && srcMiddleH > 0) {
		ctx.drawImage(img, 0, srcCap, img.width, srcMiddleH, 0, destCap, pipe.width, destMiddleH);
	}

	ctx.drawImage(img, 0, img.height - srcCap, img.width, srcCap, 0, destCap + destMiddleH, pipe.width, destCap);
  	ctx.restore();
}

const drawFlashEffect = () => {
	if (flashTimer > 0) {
		ctx.save();
		ctx.globalAlpha = (flashTimer / flashDuration) * 0.5;
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
		ctx.restore();
	}
}

const drawGame = (drawBirdOnTop = false) => {
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.restore();

	//* bg
	if (bgImg) {
		const bgWidth = bgImg.width;
        const numBgTiles = Math.ceil(SCREEN_WIDTH / bgWidth) + 1;
        
        for (let i = 0; i < numBgTiles; i++) {
            ctx.drawImage(bgImg, bg_x + (i * bgWidth), 0, bgWidth, SCREEN_HEIGHT);
        }
	} else {
		ctx.fillStyle = skyBlue;
		ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	}

	//* bird
	if (!drawBirdOnTop) {
		drawBird();
	}

	//* pipes
	for (let pipe of pipes) {
		drawPipe(pipe);
	}

	//* ground
	const groundY = SCREEN_HEIGHT - groundHeight;
	if (typeof groundSprite !== "undefined" && groundSprite) {
		const groundWidth = groundSprite.width;
        const numGroundTiles = Math.ceil(SCREEN_WIDTH / groundWidth) + 1;
        
        for (let i = 0; i < numGroundTiles; i++) {
            ctx.drawImage(groundSprite, ground_x + (i * groundWidth), groundY, groundWidth, groundHeight);
        }
	} else {
		ctx.fillStyle = groundColor;
        ctx.fillRect(0, groundY, SCREEN_WIDTH, groundHeight);
	}

	if (drawBirdOnTop) {
		drawBird();
	}

	//* flash effect if the bird die.
	drawFlashEffect();

	// score
	drawScore(score);
};

const drawGameOver = () => {
	drawGame(true);

	if (gameOverSprite) {
		let scale = 1;
		if (isMobile()) {
			const minDimension = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
			scale = minDimension / 600
		}

		const gameOverWidth = Math.min(360 * scale, SCREEN_WIDTH * 0.8);
		const gameOverHeight = Math.min(60 * scale, gameOverWidth * (60/360));
		const gameOverX = (SCREEN_WIDTH - gameOverWidth) / 2;
		const gameOverY = SCREEN_HEIGHT * 0.25;

		ctx.drawImage(gameOverSprite, gameOverX, gameOverY, gameOverWidth, gameOverHeight);
	} else {
		//* fallback text if the game over sprite failed to load.
		const fontSize = isMobile() ? Math.min(72, SCREEN_WIDTH / 10) : 72;
		drawText('Game Over', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 100, white, fontSize);
	}
	
	drawScore(score);


	//* draw restart button
	if (buttonSprite) {
		ctx.drawImage(buttonSprite, restartButton.x, restartButton.y, restartButton.width, restartButton.height);
	} else {
		ctx.fillStyle = red;
		ctx.fillRect(
			restartButton.x,
			restartButton.y,
			restartButton.width,
			restartButton.height
		);

		const fontSize = isMobile() ? Math.min(48, SCREEN_WIDTH / 15) : 48;
		drawText('Restart', SCREEN_WIDTH / 2, restartButton.y + restartButton.height/2 + 8, white, fontSize);
	}
};

const resetGame = () => {
	const color = BIRD_COLORS[Math.floor(Math.random() * BIRD_COLORS.length)];
	birdImg = birdSpritesMap[color] || null;

	//* to randomly pick pipe sprite every time the game reset
	if (pipeSprites && pipeSprites.length > 0) {
		let idx = Math.floor(Math.random() * pipeSprites.length);

		if (!pipeSprites[idx]) {
			const firstValid = pipeSprites.find(img => img !== null);
			idx = pipeSprites.indexOf(firstValid);
		}

		pipeImg = pipeSprites[idx] || null;
	} else {
		pipeImg = null;
	}

	//* to randomly pick background sprite every time the game reset.
	if (bgSprites && bgSprites.length > 0) {
		let idx = Math.floor(Math.random() * bgSprites.length);
		if (!bgSprites[idx]) {
			const firstValid = bgSprites.find(img => img !== null);
			idx = bgSprites.indexOf(firstValid);
		}
		bgImg = bgSprites[idx] || null;
	} else {
		bgImg = null;
	}

	//* scale bird for mobile
	if (isMobile()) {
		const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
		bird.width = 50 * Math.max(1, scale * 0.8);
		bird.height = 35 * Math.max(1, scale * 0.8);
	} else {
		bird.width = 50;
		bird.height = 35;
	}

	birdFrame = 1;
	frameCount= 0;

	//* reset physics.
	bird.y = SCREEN_HEIGHT / 2;
	bird.x = Math.max(60, SCREEN_WIDTH * birdXRatio);
	bird.velocity = 0;
	bird.forceAngle = null;

	dead = false;
	deathTimer = 0;
	hitBounce = false;
	angleFrame = 0;
	flashTimer = 0;

	pipes = [];
	passedPipes = [];
	score = 0;
	running = true;
	gameOver = false;
	gameState = "start";
	lastPipeTime = 0;
	startTime = 0;
	floatOffset = 0;

	bg_x = 0;
	ground_x = 0;
	bg_speed = pipeVelocity * BG_SPEED_MULT;
	ground_speed = pipeVelocity;

	canvas.style.cursor = "default";

};

const handleClick = (event) => {
	event.preventDefault(); //* to prevent zooming on mobile.

	const p = getPointer(event);
	if (!p) return;

	const clickX = p.x;
	const clickY = p.y;

	
	if (gameState === "start") {
		flapSound.currentTime = 0;
		flapSound.play();
		bird.velocity = bird.flapStrength;
		gameStart();
	} else if (gameState === "gameOver") {
		//* to check if restart button was clicked
		const touchPadding = isMobile() ? 20 : 0;
		if (
			clickX >= restartButton.x - touchPadding &&
			clickX <= restartButton.x + restartButton.width + touchPadding &&
			clickY >= restartButton.y - touchPadding &&
			clickY <= restartButton.y + restartButton.height + touchPadding
		) {
			resetGame();
		}
	} else if (gameState === "playing" && !dead) {
		flapSound.currentTime = 0;
		flapSound.play();
		
		//* flap the bird
		bird.velocity = bird.flapStrength;
	}
};

const gameLoop = (currentTime) => {
	if (gameState === "start") {

		floatOffset += FLOAT_SPEED;

		//* animate bird frames.
		frameCount++;
		if (frameCount % 10 === 0) {
			birdFrame = (birdFrame + 1) % 3;
		}

		//* scrolling for visual appeal (background)
		bg_x -=bg_speed * 0.3;
		if (bgImg) {
			const bgWidth = bgImg.width;
			if(bg_x <= -bgWidth) {
				bg_x += bgWidth;
			}
		} else {
			if (bg_x <= -SCREEN_WIDTH) {
				bg_x += SCREEN_WIDTH
			}
		}

		//* scrolling for visual appeal (ground)
		ground_x -= ground_speed * 0.3;
		if (groundSprite) {
			const groundWidth = groundSprite.width;
			if(ground_x <= -groundWidth) {
				ground_x += groundWidth;
			}
		} else {
			if (ground_x <= -SCREEN_WIDTH) {
				ground_x += SCREEN_WIDTH
			}
		}

		drawStartScreen();

	} else if (gameState === "playing")  {
		//* spawn pipes
		if (currentTime - lastPipeTime > PIPE_SPAWN_TIME) {
			pipes.push(...spawnPipe());
			lastPipeTime = currentTime;
		}

		//* update bird
		if (!dead) {
			bird.velocity += bird.gravity;
			bird.y += bird.velocity;

		} else {
			//* to handle death animation.
			if (deathTimer > 0) {
				deathTimer -=1;

				//* transition angle animation
				const progress = angleFrame / angleTime;
				const ease = 1 - Math.pow(1 - progress, 2);
				bird.forceAngle = (1 - ease) * startAngle;
				angleFrame += 1;

				//* bird bounce when hit.
				if(!hitBounce) {
					bird.velocity = -5.5;
					bird.y += bird.velocity;
					hitBounce = true;
				}

				dieSound.currentTime = 0;
				dieSound.play();

			} else {
				bird.forceAngle = null;
				bird.velocity += bird.gravity;
				bird.y += bird.velocity;

				//* falling stop at the ground.
				if(bird.y + bird.height >= SCREEN_HEIGHT - groundHeight) {
					bird.y = SCREEN_HEIGHT - groundHeight - bird.height;

					if( flashTimer <= 0) {
						gameState ="gameOver";
						running = false;
						gameOver = true;
					}
				}
			}
		}

		frameCount++;
		if(frameCount % 5 === 0) {
			birdFrame = (birdFrame + 1) % 3;
		}

		//* full speed scrolling
		if (!dead) {
			bg_x -= bg_speed;
			if (bgImg) {
				const bgWidth = bgImg.width;
				if(bg_x <= -bgWidth) {
					bg_x += bgWidth;
				}
			} else {
				if (bg_x <= -SCREEN_WIDTH) {
					bg_x += SCREEN_WIDTH
				}
			}

			ground_x -= ground_speed;
			if (groundSprite) {
				const groundWidth = groundSprite.width;
				if(ground_x <= -groundWidth) {
					ground_x += groundWidth;
				}
			} else {
				if (ground_x <= -SCREEN_WIDTH) {
					ground_x += SCREEN_WIDTH
				}
			}

			movePipes();

			checkCollisions();

			updateScore();
		}

		if (flashTimer > 0) {
			flashTimer -= 1
		}

		drawGame(true);

	} else if(gameState === "gameOver") {
		drawGameOver();
	}

	requestAnimationFrame(gameLoop);
};



//! =========================
//! ==== EVENT LISTENERS ====
//! =========================

canvas.addEventListener('click', handleClick);

canvas.addEventListener('touchstart',(evt) => {
	evt.preventDefault();
	handleClick(evt);
}, { passive: false });

//* to show pointer cursor when hovering the restart button.
canvas.addEventListener("mousemove", (evt) => {
	const p = getPointer(evt);
	if(!p) {
		canvas.style.cursor = "default";
		return;
	}

	//* only show pointer when the restart button is visible.
	const overButton = (gameState === "gameOver") &&
	p.x >= restartButton.x &&
	p.x <= restartButton.x + restartButton.width &&
	p.y >= restartButton.y &&
	p.y <= restartButton.y + restartButton.height;

	canvas.style.cursor = overButton ? "pointer" : "default";
})


window.addEventListener('resize', resizeCanvas);
resizeCanvas();

Promise.all([
	loadBirdSprites(), 
	loadPipeSprites(), 
	loadBgSprites(), 
	loadGroundSprites(),
	loadNumberSprites(),
	loadGameOverSprite(),
	loadGetReadySprite(),
	loadButtonSprite()
]).then(() => {
	resetGame();
	requestAnimationFrame(gameLoop);
}).catch((err) => {
	console.warn("Error loading sprites:", err);
	resetGame();
	requestAnimationFrame(gameLoop);
})

//* handling spacebar for flapping and others.
document.addEventListener('keydown', function (event) {
	if (event.code === "Space") {
		event.preventDefault();
		if (gameState === "start") {
			bird.velocity = bird.flapStrength;
			flapSound.currentTime = 0;
			flapSound.play();
			gameStart();

		} else if (gameState === "gameOver") {
			resetGame();

		} else if (gameState === "playing" && !dead) {
			bird.velocity = bird.flapStrength;
			flapSound.currentTime = 0;
			flapSound.play();
		}
	}
});

//* to prevent scrolling/zooming on mobile.
document.addEventListener("touchmove", (e) => {
	e.preventDefault();
}, {passive: false});

document.addEventListener("gesturestart", (e) => {
	e.preventDefault();
}, {passive: false});

document.addEventListener("gesturechange", (e) => {
	e.preventDefault();
}, {passive: false});

document.addEventListener("gestureend", (e) => {
	e.preventDefault();
}, {passive: false});

// resetGame();
// requestAnimationFrame(gameLoop);
