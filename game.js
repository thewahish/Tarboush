// game.js
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.setupCanvas();

    // UI Elements
    this.scoreDisplay = document.getElementById('score');
    this.finalScoreDisplay = document.getElementById('finalScore');
    this.bestScoreDisplay = document.getElementById('bestScore');
    this.gameOverScreen = document.getElementById('gameOver');
    
    this.gameRunning = true;
    this.score = 0;
    this.bestScore = localStorage.getItem('tarboushBestScore') || 0;
    this.speed = 3;

    this.player = {
      x: 100,
      y: this.groundY - 60,
      width: 40,
      height: 60,
      velY: 0,
      jumping: false,
      grounded: true,
      // More forgiving hitbox, inset from the drawing box
      hitbox: {
        x_offset: 5,
        y_offset: 5,
        width: 30,
        height: 55
      }
    };

    this.obstacles = [];
    this.spawnTimer = 0;
    this.clouds = this.createClouds();

    this.bindEvents();
    this.updateBestScoreDisplay();
    this.gameLoop();
  }

  setupCanvas() {
    const maxW = Math.min(window.innerWidth - 40, 800);
    const maxH = Math.min(window.innerHeight * 0.7, 400);
    this.canvas.width = maxW;
    this.canvas.height = maxH;
    this.groundY = maxH - 40;
    this.player.y = this.groundY - this.player.height;
  }

  createClouds() {
    const clouds = [];
    for (let i = 0; i < 3; i++) {
      clouds.push({
        x: Math.random() * this.canvas.width,
        y: 50 + Math.random() * 100,
        w: 80, h: 40, speed: 0.5
      });
    }
    return clouds;
  }

  bindEvents() {
    const jumpAction = () => {
      if (this.gameRunning && this.player.grounded) {
        this.player.velY = -12;
        this.player.jumping = true;
        this.player.grounded = false;
      } else if (!this.gameRunning) {
        this.restart();
      }
    };

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        jumpAction();
      }
    });

    this.canvas.addEventListener('click', jumpAction);
    document.getElementById('jumpButton').addEventListener('click', jumpAction);
    
    this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        jumpAction();
    });
    document.getElementById('jumpButton').addEventListener('touchstart', (e) => {
        e.preventDefault();
        jumpAction();
    });

    document.getElementById('restartBtn').addEventListener('click', () => this.restart());
    window.addEventListener('resize', () => this.setupCanvas());
  }

  update() {
    if (!this.gameRunning) return;

    // Player physics
    this.player.velY += 0.6; // Gravity
    this.player.y += this.player.velY;

    // Ground collision
    if (this.player.y >= this.groundY - this.player.height) {
      this.player.y = this.groundY - this.player.height;
      this.player.velY = 0;
      this.player.jumping = false;
      this.player.grounded = true;
    }

    // --- PHYSICS IMPROVEMENT: Smooth Speed Increase ---
    this.speed += 0.001;

    // Spawn obstacles
    if (this.spawnTimer++ > 120 - (this.speed * 5)) {
      this.obstacles.push({
        x: this.canvas.width,
        y: this.groundY - 50,
        w: 30, h: 50,
        type: ['cactus', 'rock'][Math.floor(Math.random() * 2)]
      });
      this.spawnTimer = 0;
    }

    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.speed;

      // --- PHYSICS IMPROVEMENT: Use the smaller, fairer hitbox for collision detection ---
      const playerHitbox = {
        x: this.player.x + this.player.hitbox.x_offset,
        y: this.player.y + this.player.hitbox.y_offset,
        width: this.player.hitbox.width,
        height: this.player.hitbox.height
      };
      
      if (
        playerHitbox.x < obs.x + obs.w &&
        playerHitbox.x + playerHitbox.width > obs.x &&
        playerHitbox.y < obs.y + obs.h &&
        playerHitbox.y + playerHitbox.height > obs.y
      ) {
        this.gameOver();
      }

      // Remove off-screen obstacles and score
      if (obs.x + obs.w < 0) {
        this.obstacles.splice(i, 1);
        this.score += 10;
        this.scoreDisplay.textContent = 'Score: ' + this.score;
      }
    }

    // Update clouds
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.w < 0) cloud.x = this.canvas.width;
    });
  }
  
  drawPlayer(px, py) {
    const ctx = this.ctx;

    // Tarboush
    ctx.fillStyle = '#DC143C'; // Crimson Red
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 15);
    ctx.quadraticCurveTo(px + 20, py - 5, px + 32, py + 15);
    ctx.fill();

    // Tassel
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(px + 28, py + 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px + 27, py + 5, 2, 6);

    // Head
    ctx.fillStyle = '#FDBCB4'; // Skin tone
    ctx.beginPath();
    ctx.arc(px + 20, py + 25, 10, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(px + 17, py + 23, 1.5, 0, Math.PI * 2);
    ctx.arc(px + 23, py + 23, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Mustache
    ctx.fillStyle = '#8B4513'; // SaddleBrown
    ctx.fillRect(px + 16, py + 27, 8, 2);

    // Body (Dishdasha)
    ctx.fillStyle = '#F5F5DC'; // Beige
    ctx.fillRect(px + 12, py + 35, 16, 25);

    // Hands
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    if (this.player.jumping) {
      // One hand holds the tarboush while jumping
      ctx.arc(px + 28, py + 6, 4, 0, Math.PI * 2);
      ctx.arc(px + 12, py + 42, 4, 0, Math.PI * 2);
    } else {
      // Hands swinging while running
      ctx.arc(px + 8, py + 42, 4, 0, Math.PI * 2);
      ctx.arc(px + 32, py + 42, 4, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.9);
    grad.addColorStop(0, '#87CEEB'); // Sky Blue
    grad.addColorStop(1, '#B0E0E6'); // Powder Blue
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.groundY);

    // Ground
    ctx.fillStyle = '#DEB887'; // BurlyWood
    ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
    
    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    this.clouds.forEach(cloud => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 20, 0, Math.PI*2);
      ctx.arc(cloud.x + 25, cloud.y, 25, 0, Math.PI*2);
      ctx.arc(cloud.x + 50, cloud.y, 20, 0, Math.PI*2);
      ctx.fill();
    });

    // Player
    this.drawPlayer(this.player.x, this.player.y);

    // Obstacles
    this.obstacles.forEach(obs => {
        if (obs.type === 'cactus') {
            ctx.fillStyle = '#228B22'; // ForestGreen
            ctx.fillRect(obs.x + 10, obs.y, 10, obs.h);
            ctx.fillRect(obs.x, obs.y + 15, 10, 10);
            ctx.fillRect(obs.x + 20, obs.y + 20, 10, 10);
        } else { // rock
            ctx.fillStyle = '#696969'; // DimGray
            ctx.beginPath();
            ctx.ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, obs.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    });
  }

  gameOver() {
    this.gameRunning = false;
    this.finalScoreDisplay.textContent = this.score;
    
    if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem('tarboushBestScore', this.bestScore);
    }
    this.updateBestScoreDisplay();
    
    this.gameOverScreen.style.display = 'block';
  }

  restart() {
    this.gameRunning = true;
    this.score = 0;
    this.speed = 3; // Reset speed
    this.player.y = this.groundY - this.player.height;
    this.player.velY = 0;
    this.player.grounded = true;
    this.obstacles = [];
    this.spawnTimer = 0;
    this.scoreDisplay.textContent = 'Score: 0';
    this.gameOverScreen.style.display = 'none';
  }

  updateBestScoreDisplay() {
      this.bestScoreDisplay.textContent = this.bestScore;
  }

  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }
}

window.addEventListener('load', () => new Game());
