// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = 200;

// Game Elements
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const restartButton = document.getElementById('restart');

// Game Variables
let score = 0;
let gameSpeed = 5;
let gameOver = false;
let animationId;
let lastTime = 0;

// Character
const character = {
    x: 50,
    y: 150,
    width: 40,
    height: 60,
    isJumping: false,
    jumpVelocity: 0,
    gravity: 0.5,
    draw() {
        // Draw tarboush (fez)
        ctx.fillStyle = '#bd1e2c';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y - 10, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw face
        ctx.fillStyle = '#f5d6b4';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw body
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x, this.y + 20, this.width, this.height - 20);
        
        // Draw eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2 - 8, this.y + this.height/2 - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.x + this.width/2 + 8, this.y + this.height/2 - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw mustache
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + this.width/2 - 15, this.y + this.height/2 + 5, 30, 5);
    },
    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = -12;
        }
    },
    update() {
        // Apply gravity
        this.y += this.jumpVelocity;
        this.jumpVelocity += this.gravity;
        
        // Ground collision
        if (this.y > 150) {
            this.y = 150;
            this.isJumping = false;
            this.jumpVelocity = 0;
        }
    }
};

// Obstacles
const obstacles = [];
class Obstacle {
    constructor() {
        this.width = 20 + Math.random() * 20;
        this.height = 20 + Math.random() * 40;
        this.x = canvas.width;
        this.y = 170 - this.height;
        this.passed = false;
    }
    
    draw() {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    update() {
        this.x -= gameSpeed;
    }
}

// Game Functions
function spawnObstacle() {
    if (Math.random() < 0.01 && obstacles.length < 3) {
        obstacles.push(new Obstacle());
    }
}

function checkCollisions() {
    obstacles.forEach(obstacle => {
        if (
            character.x + character.width > obstacle.x &&
            character.x < obstacle.x + obstacle.width &&
            character.y + character.height > obstacle.y
        ) {
            gameOver = true;
        }
        
        // Score calculation
        if (!obstacle.passed && character.x > obstacle.x + obstacle.width) {
            obstacle.passed = true;
            score++;
            scoreElement.textContent = score;
            
            // Increase game speed every 10 points
            if (score % 10 === 0) {
                gameSpeed += 0.5;
            }
        }
    });
}

function clearObstacles() {
    obstacles.forEach((obstacle, index) => {
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
        }
    });
}

function resetGame() {
    score = 0;
    gameSpeed = 5;
    gameOver = false;
    obstacles.length = 0;
    character.y = 150;
    character.isJumping = false;
    character.jumpVelocity = 0;
    scoreElement.textContent = '0';
    gameOverElement.style.display = 'none';
    restartButton.style.display = 'none';
    animationId = requestAnimationFrame(gameLoop);
}

// Game Loop
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(0, 170, canvas.width, 5);
    
    // Update and draw character
    character.update();
    character.draw();
    
    // Obstacle logic
    spawnObstacle();
    obstacles.forEach(obstacle => {
        obstacle.update();
        obstacle.draw();
    });
    
    checkCollisions();
    clearObstacles();
    
    if (!gameOver) {
        animationId = requestAnimationFrame(gameLoop);
    } else {
        gameOverElement.style.display = 'block';
        restartButton.style.display = 'block';
        cancelAnimationFrame(animationId);
    }
}

// Event Listeners
window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.key === 'ArrowUp') && !gameOver) {
        character.jump();
    }
    
    if (e.code === 'Space' && gameOver) {
        resetGame();
    }
});

restartButton.addEventListener('click', resetGame);

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
});

// Start game
resetGame();