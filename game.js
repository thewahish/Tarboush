// game.js
class Game {
  constructor() {
    // --- NEW: Debugger Setup - INITIALIZE FIRST ---
    this.debuggerDisplay = document.getElementById('debuggerDisplay');
    if (!this.debuggerDisplay) {
        console.error("CRITICAL: Debugger display element #debuggerDisplay not found!");
    }
    this.updateDebugger("Initializing Game Class...");
    
    // Add a global error handler to catch any uncaught errors anywhere in the script
    window.onerror = (message, source, lineno, colno, error) => {
        const errorMsg = `Global Error: ${message} (Line: ${lineno})`;
        this.updateDebugger(errorMsg);
        console.error("Global JavaScript Error:", errorMsg, error);
        this.gameRunning = false; // Halt the game if a critical global error occurs
        return true; // Prevent default browser error handling
    };

    console.log("[Constructor DEBUG] Starting Game constructor."); // Initial log

    try { // Wrap the core constructor logic in try-catch
        this.canvas = document.getElementById('gameCanvas');
        console.log("[Constructor DEBUG] Canvas element:", this.canvas);
        if (!this.canvas) {
            throw new Error("Canvas element #gameCanvas not found!");
        }
        this.ctx = this.canvas.getContext('2d');
        console.log("[Constructor DEBUG] Canvas context:", this.ctx);
        if (!this.ctx) {
            throw new Error("Failed to get 2D rendering context for canvas.");
        }

        console.log("[Constructor DEBUG] Setting gameRunning = true;");
        this.gameRunning = true; // Should be true here
        console.log("[Constructor DEBUG] gameRunning after set:", this.gameRunning);

        this.score = 0;
        this.bestScore = localStorage.getItem('tarboushBestScore') || 0;
        this.speed = 3;
        this.distance = 0;
        this.lastScoredDistance = 0;

        this.nextThemeToggleScore = 1000;

        this.player = {
            x: 100, y: 0, width: 40, height: 60,
            velY: 0, jumping: false, grounded: true, isDucking: false,
            runHitbox: { x_offset: 5, y_offset: 5, width: 30, height: 55 },
            duckHitbox: { x_offset: 5, y_offset: 25, width: 30, height: 35 }
        };

        this.isNightMode = false;
        this.themeColors = {
          day: {
            ground: '#A0522D',
            cloud: 'rgba(255,255,255,0.8)',
            playerTarboush: '#CE1126',
            playerBody: '#FFFFFF',
            playerSkin: '#FDBCB4',
            playerDetail: '#000000',
            obstacleGreen: '#007A3D',
            obstacleBlack: '#000000',
            obstacleGrey: '#696969',
            obstacleMissileFlame: '#FF4500',
          },
          night: {
            ground: '#5A2C10',
            cloud: 'rgba(200,200,200,0.2)',
            playerTarboush: '#990B1E',
            playerBody: '#BBBBBB',
            playerSkin: '#A17B74',
            playerDetail: '#EEEEEE',
            obstacleGreen: '#004D27',
            obstacleBlack: '#AAAAAA',
            obstacleGrey: '#333333',
            obstacleMissileFlame: '#E68A00',
          }
        };

        this.setupCanvas();

        this.scoreDisplay = document.getElementById('score');
        console.log("[Constructor DEBUG] scoreDisplay:", this.scoreDisplay);
        if (!this.scoreDisplay) throw new Error("scoreDisplay element not found!");
        this.finalScoreDisplay = document.getElementById('finalScore');
        console.log("[Constructor DEBUG] finalScoreDisplay:", this.finalScoreDisplay);
        if (!this.finalScoreDisplay) throw new Error("finalScoreDisplay element not found!");
        this.bestScoreDisplay = document.getElementById('bestScore');
        console.log("[Constructor DEBUG] bestScoreDisplay:", this.bestScoreDisplay);
        if (!this.bestScoreDisplay) throw new Error("bestScoreDisplay element not found!");
        this.gameOverScreen = document.getElementById('gameOver');
        console.log("[Constructor DEBUG] gameOverScreen:", this.gameOverScreen);
        if (!this.gameOverScreen) throw new Error("gameOverScreen element not found!");
        this.jumpRequested = false;

        this.obstacles = [];
        this.distanceToNextSpawn = 0;
        this.obstaclePatterns = [
            { type: 'single_cactus', minSpeed: 0 },
            { type: 'single_rock', minSpeed: 0 },
            { type: 'spiky_bush', minSpeed: 3 },
            { type: 'high_bird', minSpeed: 4 },
            { type: 'double_rock', minSpeed: 5 },
            { type: 'swooping_bird', minSpeed: 6 },
            { type: 'low_missile', minSpeed: 7 }
        ];

        this.clouds = this.createClouds();
        this.bindEvents(); // This sets up event listeners
        this.updateBestScoreDisplay();
        this.setNextSpawnDistance();
        
        console.log("[Constructor DEBUG] Before final debugger message. gameRunning:", this.gameRunning);
        this.updateDebugger(`Game init success. Game running: ${this.gameRunning}\nPlayer Y: ${Math.floor(this.player.y)}`);
        
        console.log("[Constructor DEBUG] Calling gameLoop(). gameRunning:", this.gameRunning);
        this.gameLoop(); // Start the game loop
        console.log("[Constructor DEBUG] gameLoop() called. Constructor finishing. gameRunning:", this.gameRunning);

    } catch (e) {
        console.error("Error during Game initialization (caught by constructor):", e);
        this.updateDebugger(`CRITICAL ERROR during Game init: ${e.message}. Game stopped.`);
        this.gameRunning = false; // Stop game if init fails
    }
    console.log("[Constructor DEBUG] Constructor finished. Final gameRunning state:", this.gameRunning);
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

  _getColor(colorName) {
    const mode = this.isNightMode ? 'night' : 'day';
    return this.themeColors[mode][colorName];
  }

  toggleDayNight() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
    this.updateScoreDisplay();
    this.draw(); // Redraw immediately to reflect theme changes
  }

  updateDebugger(message) {
      if (this.debuggerDisplay) {
          const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
          this.debuggerDisplay.textContent = `[${timestamp}] ${message}`;
      } else {
          console.log(`[Debugger FB - No UI]: ${message}`);
      }
  }

  bindEvents() {
    console.log("[bindEvents DEBUG] Starting bindEvents.");
    try {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); this.jumpRequested = true; }
            else if (e.key === 'ArrowDown') { e.preventDefault(); this.player.isDucking = true; if (!this.player.grounded) { this.player.velY += 5; } }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); this.player.isDucking = false; }
        });

        const jumpButton = document.getElementById('jumpButton');
        console.log("[bindEvents DEBUG] jumpButton:", jumpButton);
        if (jumpButton) {
            jumpButton.addEventListener('click', () => { if (this.gameRunning && !this.player.isDucking) this.jumpRequested = true; });
            jumpButton.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.gameRunning && !this.player.isDucking) this.jumpRequested = true; });
        } else {
            throw new Error("jumpButton not found!");
        }

        const duckButton = document.getElementById('duckButton');
        console.log("[bindEvents DEBUG] duckButton:", duckButton);
        if (duckButton) {
            duckButton.addEventListener('mousedown', (e) => { e.preventDefault(); if (this.gameRunning && !this.player.isDucking) { this.player.isDucking = true; if (!this.player.grounded) { this.player.velY += 5; } } });
            duckButton.addEventListener('mouseup', (e) => { e.preventDefault(); this.player.isDucking = false; });
            duckButton.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.gameRunning && !this.player.isDucking) { this.player.isDucking = true; if (!this.player.grounded) { this.player.velY += 5; } } });
            duckButton.addEventListener('touchend', (e) => { e.preventDefault(); this.player.isDucking = false; });
        } else {
            throw new Error("duckButton not found!");
        }

        const restartBtn = document.getElementById('restartBtn');
        console.log("[bindEvents DEBUG] restartBtn:", restartBtn);
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restart());
        } else {
            throw new Error("restartBtn not found!");
        }

        window.addEventListener('resize', () => this.setupCanvas());
        this.updateDebugger('All core events bound successfully.');
        console.log("[bindEvents DEBUG] bindEvents finished successfully.");
    } catch (e) {
        console.error("Error binding events (caught by bindEvents):", e);
        this.updateDebugger(`ERROR binding events: ${e.message}. Game might not respond to input.`);
        this.gameRunning = false; // This sets gameRunning to false
    }
  }

  setNextSpawnDistance() {
      const min = 75;
      const max = 150;
      this.distanceToNextSpawn = Math.floor(Math.random() * (max - min + 1) + min);
  }

  spawnObstacles() {
    const availablePatterns = this.obstaclePatterns.filter(p => this.speed >= p.minSpeed);
    const pattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
    const scoredProp = { scored: false }; // Add property to track if we've scored this obstacle

    switch (pattern.type) {
        case 'single_cactus': this.obstacles.push({ x: this.canvas.width, w: 30, h: 50, type: 'cactus', ...scoredProp }); break;
        case 'single_rock': this.obstacles.push({ x: this.canvas.width, w: 30, h: 50, type: 'rock', ...scoredProp }); break;
        case 'spiky_bush': this.obstacles.push({ x: this.canvas.width, w: 60, h: 25, type: 'spiky_bush', ...scoredProp }); break;
        case 'high_bird': this.obstacles.push({ x: this.canvas.width, w: 40, h: 30, type: 'bird', ...scoredProp }); break;
        case 'double_rock':
            this.obstacles.push({ x: this.canvas.width, w: 30, h: 50, type: 'rock', ...scoredProp });
            this.obstacles.push({ x: this.canvas.width + 60, w: 30, h: 50, type: 'rock', ...scoredProp });
            break;
        case 'swooping_bird': this.obstacles.push({ x: this.canvas.width, w: 40, h: 30, type: 'swooping_bird', vy: 1, ...scoredProp }); break;
        case 'low_missile': this.obstacles.push({ x: this.canvas.width, w: 50, h: 20, type: 'low_missile', ...scoredProp }); break;
    }
    this.setNextSpawnDistance();
  }
  
  updateScoreDisplay() {
      this.scoreDisplay.textContent = 'Score: ' + Math.floor(this.score);
  }

  update() {
    console.log("[update DEBUG] update() invoked. gameRunning:", this.gameRunning); // This is key!
    this.updateDebugger(
        `Game Running: ${this.gameRunning} | Score: ${Math.floor(this.score)} | Speed: ${this.speed.toFixed(2)}\n` +
        `Player Y: ${Math.floor(this.player.y)} | Obstacles: ${this.obstacles.length}\n` +
        `Mode: ${this.isNightMode ? 'Night' : 'Day'}`
    );

    if (!this.gameRunning) {
        console.log("[update DEBUG] update() returning because gameRunning is false.");
        return; // If game isn't running, stop updating
    }

    try {
        this.distance += this.speed;

        const currentTotalSteps = Math.floor(this.distance);
        const stepsSinceLastScore = currentTotalSteps - this.lastScoredDistance;

        if (stepsSinceLastScore >= 100) {
            this.score += Math.floor(stepsSinceLastScore / 100);
            this.lastScoredDistance += Math.floor(stepsSinceLastScore / 100) * 100;
            this.updateScoreDisplay();
        }

        const currentThousandBlock = Math.floor(this.score / 1000);
        if (this.score >= this.nextThemeToggleScore) {
             this.toggleDayNight();
             this.nextThemeToggleScore += 1000;
             this.updateDebugger(`Theme changed at ${Math.floor(this.score)} points! Now ${this.isNightMode ? 'Night' : 'Day'} Mode.`);
        }


        if (this.jumpRequested && this.player.grounded) {
            this.player.velY = -12; this.player.jumping = true; this.player.grounded = false; this.jumpRequested = false;
        }

        this.player.velY += 0.6; this.player.y += this.player.velY;

        if (this.player.y >= this.groundY - this.player.height) {
            this.player.y = this.groundY - this.player.height; this.player.velY = 0;
            this.player.jumping = false; this.player.grounded = true;
        }

        this.speed += 0.001;
        if (this.distanceToNextSpawn-- <= 0) this.spawnObstacles();
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.speed;

            if (obs.type === 'bird') obs.y = this.groundY - 80;
            else if (obs.type === 'swooping_bird') {
                if(!obs.y) obs.y = this.groundY - 150; obs.y += obs.vy;
            }
            else if (obs.type === 'low_missile') obs.y = this.groundY - 65;
            else obs.y = obs.h; // This line might cause issues if obs.h is not defined for all obstacle types.
                                // It should be obs.y = this.groundY - obs.h; as it was previously.
                                // **This is a potential bug introduced from previous copy-paste!**
            
            const hitbox = this.player.isDucking ? this.player.duckHitbox : this.player.runHitbox;
            const playerHitbox = {
                x: this.player.x + hitbox.x_offset, y: this.player.y + hitbox.y_offset,
                width: hitbox.width, height: hitbox.height
            };
          
            if (playerHitbox.x < obs.x + obs.w && playerHitbox.x + playerHitbox.width > obs.x &&
                playerHitbox.y < obs.y + obs.h && playerHitbox.y + playerHitbox.height > obs.y) {
                this.gameOver();
            }

            if (!obs.scored && obs.x + obs.w < this.player.x) {
                this.score += 10;
                obs.scored = true;
                this.updateScoreDisplay();
            }

            if (obs.x + obs.w < 0) {
                this.obstacles.splice(i, 1);
            }
        }

        this.clouds.forEach(c => { c.x -= c.speed; if (c.x + c.w < 0) c.x = this.canvas.width; });
        if (this.player.jumping) this.jumpRequested = false;

    } catch (e) {
        console.error("Error in update() (caught by update):", e);
        this.updateDebugger(`RUNTIME ERROR in update(): ${e.message}. Game stopped.`);
        this.gameRunning = false; // Stop game on error
    }
  }
  
  drawPlayer(px, py) {
    const ctx = this.ctx;
    const tarboushColor = this._getColor('playerTarboush');
    const bodyColor = this._getColor('playerBody');
    const skinColor = this._getColor('playerSkin');
    const detailColor = this._getColor('playerDetail');

    if (this.player.isDucking) {
        ctx.fillStyle = bodyColor; ctx.fillRect(px + 6, py + 35, 28, 25);
        ctx.fillStyle = tarboushColor; ctx.beginPath();
        ctx.moveTo(px + 8, py + 40); ctx.quadraticCurveTo(px + 20, py + 20, px + 32, py + 40); ctx.fill();
        ctx.fillStyle = skinColor; ctx.beginPath(); ctx.arc(px + 20, py + 45, 10, 0, Math.PI * 2); ctx.fill();
        return;
    }

    ctx.fillStyle = tarboushColor; ctx.beginPath();
    ctx.moveTo(px + 8, py + 15); ctx.quadraticCurveTo(px + 20, py - 5, px + 32, py + 15); ctx.fill();
    ctx.fillStyle = detailColor; ctx.beginPath(); ctx.arc(px + 28, py + 3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(px + 27, py + 5, 2, 6);
    ctx.fillStyle = skinColor; ctx.beginPath(); ctx.arc(px + 20, py + 25, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = detailColor; ctx.beginPath(); ctx.arc(px + 17, py + 23, 1.5, 0, Math.PI * 2); ctx.arc(px + 23, py + 23, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8B4513'; ctx.fillRect(px + 16, py + 27, 8, 2); // Beard color (remains fixed)
    ctx.fillStyle = bodyColor; ctx.fillRect(px + 12, py + 35, 16, 25);
    ctx.fillStyle = skinColor; ctx.beginPath();
    if (this.player.jumping) {
      ctx.arc(px + 28, py + 6, 4, 0, Math.PI * 2); ctx.arc(px + 12, py + 42, 4, 0, Math.PI * 2);
    } else {
      ctx.arc(px + 8, py + 42, 4, 0, Math.PI * 2); ctx.arc(px + 32, py + 42, 4, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  draw() {
    console.log("[draw DEBUG] draw() invoked."); // This log tells us if draw is running
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear entire canvas

    // Ground
    ctx.fillStyle = this._getColor('ground');
    ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

    // Clouds
    ctx.fillStyle = this._getColor('cloud');
    this.clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 20, 0, Math.PI*2);
      ctx.arc(c.x + 25, c.y, 25, 0, Math.PI*2);
      ctx.arc(c.x + 50, c.y, 20, 0, Math.PI*2);
      ctx.fill();
    });

    // Player
    try { // Try-catch around drawPlayer for specific errors
        this.drawPlayer(this.player.x, this.player.y);
    } catch (e) {
        console.error("Error drawing player (caught by draw):", e);
        this.updateDebugger(`ERROR drawing player: ${e.message}`);
    }

    // Obstacles
    this.obstacles.forEach(obs => {
      let obstacleFillStyle;
      if (obs.type === 'cactus' || obs.type === 'spiky_bush') {
        obstacleFillStyle = this._getColor('obstacleGreen');
      } else if (obs.type === 'rock') {
        obstacleFillStyle = this._getColor('obstacleGrey');
      } else if (obs.type === 'bird' || obs.type === 'swooping_bird') {
        obstacleFillStyle = this._getColor('obstacleBlack');
      } else if (obs.type === 'low_missile') {
        obstacleFillStyle = this._getColor('obstacleGrey');
      }
      ctx.fillStyle = obstacleFillStyle;

      if (obs.type === 'cactus') {
          ctx.fillRect(obs.x + 10, obs.y, 10, obs.h); ctx.fillRect(obs.x, obs.y + 15, 10, 10); ctx.fillRect(obs.x + 20, obs.y + 20, 10, 10);
      } else if (obs.type === 'rock') {
          ctx.beginPath(); ctx.ellipse(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w / 2, obs.h / 2, 0, 0, Math.PI * 2); ctx.fill();
      } else if (obs.type === 'spiky_bush') {
          ctx.beginPath(); ctx.moveTo(obs.x, obs.y + obs.h); ctx.lineTo(obs.x + obs.w / 2, obs.y); ctx.lineTo(obs.x + obs.w, obs.y + obs.h); ctx.closePath(); ctx.fill();
      } else if (obs.type === 'bird' || obs.type === 'swooping_bird') {
          ctx.beginPath(); ctx.moveTo(obs.x, obs.y + obs.h / 2);
          ctx.quadraticCurveTo(obs.x + obs.w / 2, obs.y - obs.h / 2, obs.x + obs.w, obs.y + obs.h / 2);
          ctx.quadraticCurveTo(obs.x + obs.w / 2, obs.y + obs.h, obs.x, obs.y + obs.h / 2); ctx.fill();
      } else if (obs.type === 'low_missile') {
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.fillStyle = this._getColor('obstacleMissileFlame'); // Missile flame color
          ctx.beginPath(); ctx.arc(obs.x + obs.w, obs.y + obs.h / 2, obs.h / 2, -Math.PI/2, Math.PI/2); ctx.fill();
      }
    });
  }

  gameOver() {
    this.gameRunning = false; // Game stops
    this.finalScoreDisplay.textContent = Math.floor(this.score);
    if (this.score > this.bestScore) {
        this.bestScore = Math.floor(this.score);
        localStorage.setItem('tarboushBestScore', this.bestScore);
    }
    this.updateBestScoreDisplay();
    this.gameOverScreen.style.display = 'block'; // Make game over screen visible
    this.updateDebugger(`Game Over. Final Score: ${Math.floor(this.score)}. Tap 'Play Again'`);
    console.log("[gameOver DEBUG] Game Over called. gameRunning set to false.");
  }

  restart() {
    console.log("[restart DEBUG] Restart initiated.");
    this.updateDebugger('Restart initiated. Setting gameRunning=true...');
    this.gameRunning = true; // Sets game to running
    this.score = 0; this.speed = 3; this.distance = 0;
    this.lastScoredDistance = 0; // Reset for new game
    this.nextThemeToggleScore = 1000; // Reset theme toggle score for new game
    this.player.y = this.groundY - this.player.height;
    this.player.velY = 0; this.player.grounded = true; this.player.isDucking = false;
    this.player.jumping = false; this.jumpRequested = false;
    this.obstacles = []; this.setNextSpawnDistance();
    this.updateScoreDisplay();
    this.gameOverScreen.style.display = 'none'; // Hide game over screen
    this.updateDebugger('Restart completed. Game should be active.');
    console.log("[restart DEBUG] Restart finished. gameRunning is:", this.gameRunning);

    // --- FIX: Explicitly re-call gameLoop to ensure rAF chain restarts ---
    this.gameLoop(); // Call gameLoop once to trigger a new requestAnimationFrame
    console.log("[restart DEBUG] gameLoop() explicitly called from restart().");
  }

  updateBestScoreDisplay() { this.bestScoreDisplay.textContent = this.bestScore; }

  gameLoop() {
    console.log("[gameLoop DEBUG] gameLoop invoked. gameRunning:", this.gameRunning); // This is key!

    if (!this.gameRunning) {
        console.log("[gameLoop DEBUG] gameLoop returning because gameRunning is false.");
        return; // Stop the loop if game is not running
    }
    try {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    } catch (e) {
        console.error("Error in gameLoop (caught by gameLoop):", e);
        this.updateDebugger(`CRITICAL ERROR in gameLoop: ${e.message}. Loop stopped.`);
        this.gameRunning = false; // Stop the loop on error
    }
  }
}

// Wrap the game initialization in a window.addEventListener('load') to ensure all DOM elements are ready
window.addEventListener('load', () => {
    console.log("[Load DEBUG] Window loaded. Initializing Game.");
    try {
        new Game();
    } catch (e) {
        const debuggerElem = document.getElementById('debuggerDisplay');
        if (debuggerElem) {
            debuggerElem.textContent = `FATAL Error on load: ${e.message}. Check console.`;
        }
        console.error("Fatal error during game initialization on load:", e);
    }
});
