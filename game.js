class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.setupCanvas();

    this.gameRunning = true;
    this.score = 0;
    this.speed = 3;

    this.player = {
      x: 100,
      y: 300,
      width: 40,
      height: 60,
      velY: 0,
      jumping: false,
      grounded: true
    };

    this.obstacles = [];
    this.spawnTimer = 0;
    this.clouds = this.createClouds();

    this.bindEvents();
    this.gameLoop();
  }

  setupCanvas() {
    const maxW = Math.min(window.innerWidth - 40, 800);
    const maxH = Math.min(window.innerHeight * 0.7, 400);
    this.canvas.width = maxW;
    this.canvas.height = maxH;
    this.player.y = maxH - 100;
    this.groundY = maxH - 40;
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
    const jump = () => {
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
        jump();
      }
    });

    this.canvas.addEventListener('click', jump);
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      jump();
    });

    document.getElementById('restartBtn').addEventListener('click', () => this.restart());
    window.addEventListener('resize', () => this.setupCanvas());
  }

  update() {
    if (!this.gameRunning) return;

    this.player.velY += 0.6;
    this.player.y += this.player.velY;

    if (this.player.y >= this.groundY - this.player.height) {
      this.player.y = this.groundY - this.player.height;
      this.player.velY = 0;
      this.player.jumping = false;
      this.player.grounded = true;
    }

    this.spawnTimer++;
    if (this.spawnTimer > 100) {
      this.obstacles.push({
        x: this.canvas.width,
        y: this.groundY - 50,
        w: 30, h: 50,
        type: ['cactus', 'rock'][Math.floor(Math.random() * 2)]
      });
      this.spawnTimer = 0;
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      this.obstacles[i].x -= this.speed;
      if (this.obstacles[i].x + this.obstacles[i].w < 0) {
        this.obstacles.splice(i, 1);
        this.score += 10;
        document.getElementById('score').textContent = 'Score: ' + this.score;
        if (this.score % 50 === 0) this.speed += 0.5;
      }
    }

    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x + cloud.w < 0) cloud.x = this.canvas.width;
    });

    this.obstacles.forEach(obs => {
      if (
        this.player.x < obs.x + obs.w &&
        this.player.x + this.player.width > obs.x &&
        this.player.y < obs.y + obs.h &&
        this.player.y + this.player.height > obs.y
      ) {
        this.gameOver();
      }
    });
  }

  drawPlayer(px, py) {
    const ctx = this.ctx;

    // Tarboush
    ctx.fillStyle = '#DC143C';
    ctx.fillRect(px + 8, py, 24, 15);
    ctx.beginPath();
    ctx.arc(px + 20, py + 15, 12, 0, Math.PI);
    ctx.fill();

    // Tassel
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(px + 28, py + 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(px + 27, py + 5, 2, 6);

    // Head
    ctx.fillStyle = '#FDBCB4';
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
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(px + 16, py + 27, 8, 2);

    // Body
    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(px + 12, py + 35, 16, 25);

    // Arms
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();

    if (this.player.jumping) {
      ctx.arc(px + 28, py + 6, 4, 0, Math.PI * 2); // right hand on tarboush
      ctx.arc(px + 12, py + 42, 4, 0, Math.PI * 2); // left hand down
    } else {
      ctx.arc(px + 8, py + 42, 4, 0, Math.PI * 2);
      ctx.arc(px + 32, py + 42, 4, 0, Math.PI * 2);
    }

    ctx.fill();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.6);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.6);

    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, this.canvas.height * 0.6, this.canvas.width, this.canvas.height * 0.4);

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    this.clouds.forEach(cloud => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 20, 0, Math.PI * 2);
      ctx.arc(cloud.x + 25, cloud.y, 25, 0, Math.PI * 2);
      ctx.arc(cloud.x + 50, cloud.y, 20, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = '#CD853F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(this.canvas.width, this.groundY);
    ctx.stroke();

    this.drawPlayer(this.player.x, this.player.y);

    this.obstacles.forEach(obs => {
      if (obs.type === 'cactus') {
        ctx.fillStyle = '#228B22';
        ctx.fillRect(obs.x + 10, obs.y, 10, obs.h);
        ctx.fillRect(obs.x, obs.y + 15, 10, 10);
        ctx.fillRect(obs.x + 20, obs.y + 20, 10, 10);
      } else {
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, obs.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  gameOver() {
    this.gameRunning = false;
    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('gameOver').style.display = 'block';
  }

  restart() {
    this.gameRunning = true;
    this.score = 0;
    this.speed = 3;
    this.player.y = this.groundY - this.player.height;
    this.player.velY = 0;
    this.player.grounded = true;
    this.obstacles = [];
    this.spawnTimer = 0;
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('gameOver').style.display = 'none';
  }

  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }
}

window.addEventListener('load', () => new Game());