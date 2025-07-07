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
    this.distance = 0;

    this.player = {
      x: 100,
      y: this.groundY - 60,
      width: 40,
      height: 60,
      velY: 0,
      jumping: false,
      grounded: true,
      isDucking: false,
      // Hitboxes
      runHitbox: { x_offset: 5, y_offset: 5, width: 30, height: 55 },
      duckHitbox: { x_offset: 5, y_offset: 25, width: 30, height: 35 }
    };

    // Control flags
    this.jumpRequested = false;

    // Obstacle Management
    this.obstacles = [];
    this.distanceToNextSpawn = 0;
    // CRITICAL FIX: Added a missing comma after the 'high_bird' object
    this.obstaclePatterns = [
        { type: 'single_cactus', minSpeed: 0 },
        { type: 'single_rock', minSpeed: 0 },
        { type: 'high_bird', minSpeed: 4 },
        { type: 'double_rock', minSpeed: 5 }
    ];

    this.clouds = this.createClouds();

    this.bindEvents();
    this.updateBestScoreDisplay();
    this.setNextSpawnDistance();
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
    const handleAction = () => {
        if (this.gameRunning) {
            if (!this.player.isDucking) {
                this.jumpRequested = true;
            }
        } else {
            this.restart();
        }
    };
    const duckStart = () => {
        if (this.player.grounded && this.gameRunning) {
            this.player.isDucking = true;
        }
    };
    const duckEnd = () => { this.player.isDucking = false; };

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleAction();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        duckStart();
      }
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            duckEnd();
        }
    });

    // Touch and Click events
    document.getElementById('jumpButton').addEventListener('click', handleAction);
    document.getElementById('jumpButton').addEventListener('touchstart', (e) => { e.preventDefault(); handleAction(); });
    document.getElementById('duckButton').addEventListener('touchstart', (e) => { e.preventDefault(); duckStart(); });
    document.getElementById('duckButton').addEventListener('touchend', (e) => { e.preventDefault(); duckEnd(); });

    // Other events
    document.getElementById('restartBtn').addEventListener('click', () => this.restart());
    window.addEventListener('resize', () => this.setupCanvas());
  }

  setNextSpawnDistance() {
      const min = 300;
      const max = 600;
      this.distanceToNextSpawn = Math.floor(Math.random() * (max - min + 1) + min);
  }

  spawnObstacles() {
    const availablePatterns = this.obstaclePatterns.filter(p => this.speed >= p.minSpeed);
    const pattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];

    switch (pattern.type) {
        case 'single_cactus':
            this.obstacles.push({ x: this.canvas.width, w: 30, h: 50, type: 'cactus' });
            break;
        case 'single_rock':
            this.obstacles.push({ x: this.canvas.width, w: 30, h: 50, type: 'rock' });
            break;
        case 'high_bird':
            this.obstacles.push({ x: this.canvas.width, w: 40, h: 30, type: 'bird' });
            break;
        case 'double_rock':
            this.obstacles.push({ x: this.canvas.width, w: 30, h: 50, type: 'rock' });
            this.obstacles.push({ x: this.canvas.width + 60, w: 30, h: 50, type: 'rock' });
            break;
    }
    this.setNextSpawnDistance();
  }

  update() {
    if (!this.gameRunning) return;

    this.distance += this.speed;

    if (this.jumpRequested && this.player.grounded) {
        this.player.velY = -12;
        this.player.jumping = true;
        this.player.grounded = false;
        this.jumpRequested = false;
    }

    this.player.velY += 0.6;
    this.player.y += this.player.velY;

    if (this.player.y >= this.groundY - this.player.height) {
        this.player.y = this.groundY - this.player.height;
        this.player.velY = 0;
        this.player.jumping = false;
        this.player.grounded = true;
    }
    if(!this.player.grounded) {
        this.player.isDucking = false;
    }

    this.speed += 0.001;

    this.distanceToNextSpawn -= this.speed;
    if (this.distanceToNextSpawn <= 0) {
        this.spawnObstacles();
    }
    
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.x -= this.speed;

        obs.y = (obs.type === 'bird') ? this.groundY - 80 : this.groundY - obs.h;
        
        const hitbox = this.player.isDucking ? this.player.duckHitbox : this.player.runHitbox;
        const playerHitbox = {
            x: this.player.x + hitbox.x_offset,
            y: this.player.y + hitbox.y_offset,
            width: hitbox.width,
            height: hitbox.height
        };
      
        if (
            playerHitbox.x < obs.x + obs.w &&
            playerHitbox.x + playerHitbox.width > obs.x &&
            playerHitbox.y < obs.y + obs.h &&
            playerHitbox.y + playerHitbox.height > obs.y
        ) {
            this.gameOver();
        }

        if (obs.x + obs.w < 0) {
            this.obstacles.splice(i, 1);
            this.score += 10;
            this.scoreDisplay.textContent = 'Score: ' + this.score;
        }
    }

    this.clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.w < 0) cloud.x = this.canvas.width;
    });
    
    if (this.player.jumping) {
        this.jumpRequested = false;
    }
  }
  
  drawPlayer(px, py) {
    const ctx = this.ctx;

    if (this.player.isDucking) {
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(px + 6, py + 35, 28, 25);
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.moveTo(px + 8, py + 40);
        ctx.quadraticCurveTo(px + 20, py + 20, px + 32, py + 40);
        ctx.fill();
        ctx.fillStyle = '#FDBCB4';
        ctx.beginPath();
        ctx.arc(px + 20, py + 45, 10, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 15);
    ctx.quadraticCurveTo(px + 20, py - 5, px + 32, py + 15);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(px + 28, py + 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px + 27, py + 5, 2, 6);
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.arc(px + 20, py + 25, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(px + 17, py + 23, 1.5, 0, Math.PI * 2);
    ctx.arc(px + 23, py + 23, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(px + 16, py + 27, 8, 2);
    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(px + 12, py + 35, 16, 25);
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    if (this.player.jumping) {
      ctx.arc(px + 28, py + 6, 4, 0, Math.PI * 2);
      ctx.arc(px + 12, py + 42, 4, 0, Math.PI * 2);
    } else {
      ctx.arc(px + 8, py + 42, 4, 0, Math.PI * 2);
      ctx.arc(px + 32, py + 42, 4, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.9);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.groundY);
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
    
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    this.clouds.forEach(cloud => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 20, 0, Math.PI*2);
      ctx.arc(cloud.x + 25, cloud.y, 25, 0, Math.PI*2);
      ctx.arc(cloud.x + 50, cloud.y, 20, 0, Math.PI*2);
      ctx.fill();
    });

    this.drawPlayer(this.player.x, this.player.y);

    this.obstacles.forEach(obs => {
        if (obs.type === 'cactus') {
            ctx.fillStyle = '#228B22';
            ctx.fillRect(obs.x + 10, obs.y, 10, obs.h);
            ctx.fillRect(obs.x, obs.y + 15, 10, 10);
            ctx.fillRect(obs.x + 20, obs.y + 20, 10, 10);
        } else if (obs.type === 'rock') {
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, obs.h / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (obs.type === 'bird') {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y + obs.h / 2);
            ctx.quadraticCurveTo(obs.x + obs.w / 2, obs.y - obs.h / 2, obs.x + obs.w, obs.y + obs.h / 2);
            ctx.quadraticCurveTo(obs.x + obs.w / 2, obs.y + obs.h, obs.x, obs.y + obs.h / 2);
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
    this.speed = 3;
    this.distance = 0;
    this.player.y = this.groundY - this.player.height;
    this.player.velY = 0;
    this.player.grounded = true;
    this.player.isDucking = false;
    this.player.jumping = false;
    this.jumpRequested = false;
    this.obstacles = [];
    this.setNextSpawnDistance();
    
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
