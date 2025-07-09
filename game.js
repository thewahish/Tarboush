class Game {
  constructor() {
    console.log("[Constructor DEBUG] Starting Game constructor."); 

    try {
        // Basic property initialization
        this.gameRunning = false;
        this.score = 0;
        this.bestScore = localStorage.getItem('tarboushBestScore') || 0;
        this.speed = 3.5; // Adjusted for balanced start
        this.distance = 0;
        this.lastScoredDistance = 0;
        this.steps = 0; // Track steps for new scoring system
        this.nextThemeToggleScore = 200; // Day/Night toggle every 200 points

        // Jump control variables - prevent double jumping
        this.jumpPressed = false;
        this.spacePressed = false;

        // Player properties - Updated for shorter character
        this.player = {
            x: 120, y: 0, width: 48, height: 60, // Reduced from 50x70 to 48x60
            velY: 0, jumping: false, grounded: true, isDucking: false,
            runHitbox: { x_offset: 6, y_offset: 6, width: 36, height: 54 }, // Adjusted proportionally
            duckHitbox: { x_offset: 6, y_offset: 25, width: 36, height: 35 }, // Adjusted for ducking
            animFrame: 0,
            animSpeed: 0.2
        };

        this.isNightMode = false;
        this.particles = [];
        
        // Updated Syrian Identity Color Themes with pixel art character colors
        this.themeColors = {
            day: {
                ground: '#b9a779', groundShadow: '#988561',
                cloud: 'rgba(237, 235, 224, 0.7)', 
                // Pixel art character colors
                playerTarboush: '#054239',        // Dark green tarboush
                playerTarboushTassel: '#FFD700', // Gold tassel
                playerSkin: '#D4A574',           // Peachy tan skin
                playerBeard: '#2C1810',          // Dark brown beard
                playerThobe: '#F5F5F0',          // Off-white thobe
                playerThobeDetails: '#6B2F2A',   // Maroon details
                playerShoes: '#2C1810',          // Dark shoes
                obstacleGreen: '#42B177', 
                obstacleBlack: '#3C3C3C',        // Pixel art obstacle color
                obstacleGrey: '#988561',
                obstacleMissileFlame: '#b9a779',
                sky: '#ffffff', // White background
                coin: '#b9a779'
            },
            night: {
                ground: '#6B2F2A', groundShadow: '#4A1F1E',
                cloud: 'rgba(237, 235, 224, 0.3)',
                // Night mode character colors (slightly adjusted)
                playerTarboush: '#002623',
                playerTarboushTassel: '#B8860B', // Darker gold
                playerSkin: '#C49464',           // Slightly darker skin
                playerBeard: '#1C0F08',          // Darker beard
                playerThobe: '#E5E5E0',          // Slightly darker thobe
                playerThobeDetails: '#5B1F1A',   // Darker maroon
                playerShoes: '#1C0F08',          // Darker shoes
                obstacleGreen: '#054239', 
                obstacleBlack: '#2C2C2C',        // Darker obstacle
                obstacleGrey: '#6B2F2A',
                obstacleMissileFlame: '#988561',
                sky: '#f8f8f8',
                coin: '#988561'
            }
        };

        // Character definitions
        this.characters = [
            { 
                id: 'shami_abu_tarboush', 
                name: 'شامي أبو طربوش', 
                available: true, 
                image: 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="60" height="60" fill="#42B177" rx="8"/>
                        <circle cx="30" cy="38" r="16" fill="#b9a779"/>
                        <rect x="18" y="8" width="24" height="16" fill="#054239" rx="2"/>
                        <rect x="27" y="4" width="6" height="6" fill="#054239"/>
                        <circle cx="26" cy="35" r="1.5" fill="#3d3a3b"/>
                        <circle cx="34" cy="35" r="1.5" fill="#3d3a3b"/>
                        <rect x="24" y="40" width="12" height="2" fill="#988561" rx="1"/>
                        <rect x="22" y="48" width="16" height="12" fill="#edebe0"/>
                        <circle cx="44" cy="10" r="2" fill="#988561"/>
                    </svg>
                `)
            },
            { 
                id: 'fatom_hays_bays', 
                name: 'فطوم حيص بيص', 
                available: false, 
                image: 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="60" height="60" fill="#988561" rx="8"/>
                        <text x="30" y="38" font-family="Arial" font-size="20" font-weight="normal" text-anchor="middle" fill="#edebe0">ف</text>
                    </svg>
                `)
            },
            { 
                id: 'zulfiqar', 
                name: 'زولفيقار', 
                available: false, 
                image: 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="60" height="60" fill="#3d3a3b" rx="8"/>
                        <text x="30" y="38" font-family="Arial" font-size="20" font-weight="normal" text-anchor="middle" fill="#edebe0">ز</text>
                    </svg>
                `)
            },
            { 
                id: 'bakri_abu_halab', 
                name: 'بكري أبو حلب', 
                available: false, 
                image: 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="60" height="60" fill="#b9a779" rx="8"/>
                        <text x="30" y="38" font-family="Arial" font-size="20" font-weight="normal" text-anchor="middle" fill="#054239">ب</text>
                    </svg>
                `)
            },
            { 
                id: 'warni_warni', 
                name: 'ورني ورني', 
                available: false, 
                image: 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="60" height="60" fill="#161616" rx="8"/>
                        <text x="30" y="38" font-family="Arial" font-size="20" font-weight="normal" text-anchor="middle" fill="#edebe0">و</text>
                    </svg>
                `)
            }
        ];
        this.selectedCharacterId = 'shami_abu_tarboush';

        // Get Canvas and Context
        this.canvas = document.getElementById('gameCanvas');
        console.log("[Constructor DEBUG] Canvas element:", this.canvas);
        if (!this.canvas) throw new Error("Canvas element #gameCanvas not found!");
        this.ctx = this.canvas.getContext('2d');
        console.log("[Constructor DEBUG] Canvas context:", this.ctx);
        if (!this.ctx) throw new Error("Failed to get 2D rendering context for canvas.");

        // Get UI element references
        this.scoreDisplay = document.getElementById('score');
        if (!this.scoreDisplay) throw new Error("scoreDisplay element not found!");
        this.finalScoreDisplay = document.getElementById('finalScore');
        if (!this.finalScoreDisplay) throw new Error("finalScoreDisplay element not found!");
        this.bestScoreDisplay = document.getElementById('bestScore');
        if (!this.bestScoreDisplay) throw new Error("bestScoreDisplay element not found!");
        this.gameOverScreen = document.getElementById('gameOver');
        if (!this.gameOverScreen) throw new Error("gameOverScreen element not found!");
        this.characterSelectScreen = document.getElementById('characterSelectScreen');
        if (!this.characterSelectScreen) throw new Error("characterSelectScreen element not found!");
        this.gameContainer = document.querySelector('.game-container');
        if (!this.gameContainer) throw new Error("Game container element not found!");
        this.uiContainer = document.getElementById('ui-container');
        if (!this.uiContainer) throw new Error("uiContainer element not found!");
        this.jumpButton = document.getElementById('jumpButton');
        if (!this.jumpButton) throw new Error("jumpButton element not found!");
        this.duckButton = document.getElementById('duckButton');
        if (!this.duckButton) throw new Error("duckButton element not found!");
        this.restartBtn = document.getElementById('restartBtn');
        if (!this.restartBtn) throw new Error("restartBtn element not found!");
        this.startGameBtn = document.getElementById('start-game-btn');
        if (!this.startGameBtn) throw new Error("start-game-btn not found!");
        this.orientationWarning = document.getElementById('orientation-warning');
        if (!this.orientationWarning) throw new Error("orientation-warning element not found!");
        this.loaderScreen = document.getElementById('loader');
        if (!this.loaderScreen) throw new Error("loaderScreen element not found!");

        // Game state setup
        this.setupCanvas();
        this.obstacles = [];
        this.distanceToNextSpawn = 0;
        // Updated obstacle patterns with groups and varied heights
        this.obstaclePatterns = [
            // Single obstacles
            { type: 'cactus', width: 24, height: 40, yOffset: 0, group: 'single' },
            { type: 'rock', width: 30, height: 20, yOffset: 0, group: 'single' },
            { type: 'bird', width: 35, height: 20, yOffset: 45, group: 'single' },
            { type: 'bird', width: 35, height: 20, yOffset: 65, group: 'single' }, // Higher bird
            { type: 'missile', width: 50, height: 15, yOffset: 25, group: 'single' },
            { type: 'missile', width: 50, height: 15, yOffset: 40, group: 'single' }, // Higher missile
            // Double obstacles
            { type: 'cactus', width: 24, height: 40, yOffset: 0, group: 'double', count: 2, spacing: () => 50 + Math.random() * 50 },
            { type: 'rock', width: 30, height: 20, yOffset: 0, group: 'double', count: 2, spacing: () => 50 + Math.random() * 50 },
            // Mixed groups
            { type: 'bird', width: 35, height: 20, yOffset: 45, group: 'mixed', follow: 'cactus', followOffset: () => 100 + Math.random() * 50 },
            { type: 'missile', width: 50, height: 15, yOffset: 25, group: 'mixed', follow: 'rock', followOffset: () => 100 + Math.random() * 50 }
        ];
        this.clouds = this.createClouds();

        // Bind events
        this.bindEvents();
        
        // Initial UI state
        this.updateBestScoreDisplay();
        this.setNextSpawnDistance();
        
        this.currentGameState = 'loading';
        this.updateUIVisibility();
        
        // Handle loader animation
        const loaderCharacter = this.loaderScreen.querySelector('.character-enter');
        if(loaderCharacter) {
            loaderCharacter.addEventListener('animationend', () => {
                this.loaderScreen.style.opacity = 0;
                setTimeout(() => {
                    this.loaderScreen.style.display = 'none';
                    this.currentGameState = 'characterSelect';
                    this.updateUIVisibility();
                    this.renderCharacterSelectScreen();
                }, 500);
            });
        } else {
            // Fallback
            this.currentGameState = 'characterSelect';
            this.updateUIVisibility();
            this.renderCharacterSelectScreen();
        }

        this.gameLoop();
    } catch (e) {
        console.error("Error during Game initialization:", e);
        this.gameRunning = false;
        this.updateUIVisibility();
    }
    console.log("[Constructor DEBUG] Constructor finished. Final gameRunning state:", this.gameRunning);
  }

  bindEvents() {
    // Fixed touch events for buttons
    this.jumpButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.currentGameState === 'playing' && !this.jumpPressed) {
            this.jumpRequested = true;
            this.jumpPressed = true;
        }
    }, { passive: false });

    this.jumpButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.jumpPressed = false;
    }, { passive: false });

    // Add click events as fallback
    this.jumpButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.currentGameState === 'playing' && !this.jumpPressed) {
            this.jumpRequested = true;
        }
    });

    this.duckButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.currentGameState === 'playing') {
            this.player.isDucking = true;
        }
    }, { passive: false });

    this.duckButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.currentGameState === 'playing') {
            this.player.isDucking = false;
        }
    }, { passive: false });

    // Add click events as fallback for duck button
    this.duckButton.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (this.currentGameState === 'playing') {
            this.player.isDucking = true;
        }
    });

    this.duckButton.addEventListener('mouseup', (e) => {
        e.preventDefault();
        if (this.currentGameState === 'playing') {
            this.player.isDucking = false;
        }
    });

    this.duckButton.addEventListener('mouseleave', (e) => {
        if (this.currentGameState === 'playing') {
            this.player.isDucking = false;
        }
    });

    // Fixed keyboard events - prevent double jumping
    document.addEventListener('keydown', (e) => {
        if (this.currentGameState === 'playing') {
            if ((e.code === 'Space' || e.code === 'ArrowUp') && !this.spacePressed) {
                e.preventDefault();
                this.jumpRequested = true;
                this.spacePressed = true;
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                this.player.isDucking = true;
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        if (this.currentGameState === 'playing') {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.spacePressed = false;
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                this.player.isDucking = false;
            }
        }
    });

    // Restart button
    this.restartBtn.addEventListener('click', () => {
        this.startGame();
    });

    // Window resize and orientation
    window.addEventListener('resize', () => {
        this.setupCanvas();
        this.updateUIVisibility();
    });

    window.addEventListener('orientationchange', () => {
        this.updateUIVisibility();
    });

    // Character selection
    const characterGrid = this.characterSelectScreen.querySelector('.character-grid');
    characterGrid.addEventListener('click', (event) => {
        const slot = event.target.closest('.character-slot.available');
        if (slot) {
            const charId = slot.dataset.charId;
            this.selectedCharacterId = charId;
            characterGrid.querySelectorAll('.character-slot').forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
        }
    });
  }

  setupCanvas() {
    const desiredAspectRatio = 2.2;
    const minPadding = 40; 
    const maxWidth = 900;
    const maxHeight = 400;

    let targetWidth = Math.min(window.innerWidth - minPadding, maxWidth);
    let targetHeight = Math.min(window.innerHeight - minPadding, maxHeight);

    if (targetWidth / targetHeight > desiredAspectRatio) {
        targetWidth = targetHeight * desiredAspectRatio;
    } else {
        targetHeight = targetWidth / desiredAspectRatio;
    }

    this.canvas.width = Math.max(targetWidth, 400);
    this.canvas.height = Math.max(targetHeight, 200);
    
    // Adjusted ground position for shorter character
    this.groundY = this.canvas.height - 50; // Reduced from 60 to 50
    this.player.y = this.groundY - this.player.height;
  }

  createClouds() {
    const clouds = [];
    for (let i = 0; i < 4; i++) {
        clouds.push({
            x: Math.random() * this.canvas.width,
            y: 30 + Math.random() * (this.groundY / 3),
            w: 60 + Math.random() * 40,
            h: 25 + Math.random() * 15,
            speed: 0.3 + Math.random() * 0.4,
            opacity: 0.6 + Math.random() * 0.4
        });
    }
    return clouds;
  }

  _getColor(colorName) {
    const mode = this.isNightMode ? 'night' : 'day';
    const color = this.themeColors[mode][colorName];
    return color || this.themeColors.day.sky;
  }

  toggleDayNight() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
    this.updateScoreDisplay();
  }

  updateUIVisibility() {
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      
      // Hide all elements first
      this.gameContainer.style.display = 'none';
      this.uiContainer.style.display = 'none';
      this.jumpButton.style.display = 'none';
      this.duckButton.style.display = 'none';
      this.characterSelectScreen.style.display = 'none';
      this.gameOverScreen.style.display = 'none';
      this.orientationWarning.style.display = 'none';
      this.loaderScreen.style.display = 'none';

      // Show elements based on state and orientation
      if (this.currentGameState === 'loading') {
          this.loaderScreen.style.display = 'flex';
      } else if (!isLandscape) {
          this.orientationWarning.style.display = 'flex';
      } else {
          if (this.currentGameState === 'playing') {
              this.gameContainer.style.display = 'flex';
              this.uiContainer.style.display = 'flex';
              this.scoreDisplay.style.display = 'block';
              this.jumpButton.style.display = 'flex';
              this.duckButton.style.display = 'flex';
          } else if (this.currentGameState === 'gameOver') {
              this.gameContainer.style.display = 'flex';
              this.uiContainer.style.display = 'flex';
              this.scoreDisplay.style.display = 'block';
              this.gameOverScreen.style.display = 'flex';
          } else if (this.currentGameState === 'characterSelect') {
              this.characterSelectScreen.style.display = 'flex';
          }
      }
  }

  renderCharacterSelectScreen() {
      const characterGrid = this.characterSelectScreen.querySelector('.character-grid');
      characterGrid.innerHTML = '';

      this.characters.forEach(char => {
          const slot = document.createElement('div');
          slot.classList.add('character-slot');
          slot.setAttribute('data-char-id', char.id);

          slot.innerHTML = `
              <img src="${char.image}" alt="${char.name}" loading="lazy">
              <p>${char.name}</p>
          `;

          if (char.available) {
              slot.classList.add('available');
              if (char.id === this.selectedCharacterId) {
                  slot.classList.add('selected');
              }
          } else {
              slot.classList.add('grayed-out');
          }
          characterGrid.appendChild(slot);
      });

      if (this._startGameButtonHandler) {
          this.startGameBtn.removeEventListener('click', this._startGameButtonHandler);
      }
      this._startGameButtonHandler = () => {
          if (this.currentGameState === 'characterSelect') {
              this.startGame();
          }
      };
      this.startGameBtn.addEventListener('click', this._startGameButtonHandler);
  }

  startGame() {
      this.gameRunning = true;
      this.score = 0;
      this.speed = 3.5; // Balanced start speed
      this.distance = 0;
      this.lastScoredDistance = 0;
      this.steps = 0; // Reset steps counter
      this.nextThemeToggleScore = 200;
      this.player.y = this.groundY - this.player.height;
      this.player.velY = 0;
      this.player.grounded = true;
      this.player.isDucking = false;
      this.player.jumping = false;
      this.jumpRequested = false;
      this.jumpPressed = false;
      this.spacePressed = false;
      this.obstacles = [];
      this.particles = [];
      this.clouds = this.createClouds();
      this.setNextSpawnDistance();
      this.updateScoreDisplay();
      
      this.currentGameState = 'playing';
      this.updateUIVisibility();
  }

  updateBestScoreDisplay() {
      if (this.bestScoreDisplay) {
          this.bestScoreDisplay.textContent = this.bestScore;
      }
  }

  updateScoreDisplay() {
      if (this.scoreDisplay) {
          this.scoreDisplay.textContent = `نقاط: ${this.score}`;
      }
      if (this.score > this.bestScore) {
          this.bestScore = this.score;
          localStorage.setItem('tarboushBestScore', this.bestScore);
          this.updateBestScoreDisplay();
      }
  }

  setNextSpawnDistance() {
      this.distanceToNextSpawn = this.canvas.width / 2 + Math.random() * this.canvas.width / 2; // Wider range for unpredictability
  }

  spawnObstacle() {
      // Choose pattern type based on probability
      const rand = Math.random();
      let pattern;
      if (rand < 0.5) {
          // Single obstacle (50%)
          pattern = this.obstaclePatterns.filter(p => p.group === 'single')[Math.floor(Math.random() * 6)];
      } else if (rand < 0.8) {
          // Double obstacle (30%)
          pattern = this.obstaclePatterns.filter(p => p.group === 'double')[Math.floor(Math.random() * 2)];
      } else {
          // Mixed group (20%)
          pattern = this.obstaclePatterns.filter(p => p.group === 'mixed')[Math.floor(Math.random() * 2)];
      }

      const createObstacle = (data, xOffset = 0) => {
          return {
              x: this.canvas.width + 10 + xOffset,
              y: this.groundY - data.height - data.yOffset,
              width: data.width,
              height: data.height,
              type: data.type,
              yOffset: data.yOffset,
              hitbox: {
                  x_offset: 2,
                  y_offset: 2,
                  width: data.width - 4,
                  height: data.height - 4
              },
              scored: false
          };
      };

      if (pattern.group === 'single') {
          this.obstacles.push(createObstacle(pattern));
      } else if (pattern.group === 'double') {
          this.obstacles.push(createObstacle(pattern));
          this.obstacles.push(createObstacle(pattern, pattern.spacing()));
      } else if (pattern.group === 'mixed') {
          this.obstacles.push(createObstacle(pattern));
          const followData = this.obstaclePatterns.find(p => p.type === pattern.follow && p.group === 'single');
          this.obstacles.push(createObstacle(followData, pattern.followOffset()));
      }
  }

  updateObstacles() {
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
          const obs = this.obstacles[i];
          obs.x -= this.speed;

          // Scoring - 10 points per obstacle
          if (!obs.scored && obs.x + obs.width < this.player.x) {
              this.score += 10;
              obs.scored = true;
              this.updateScoreDisplay();
          }

          // Enhanced collision detection - especially for flying objects
          if (this.checkCollision(this.player, obs)) {
              this.createExplosionParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
              this.gameOver();
              return;
          }

          // Remove off-screen obstacles
          if (obs.x + obs.width < 0) {
              this.obstacles.splice(i, 1);
          }
      }

      // Spawn new obstacles
      if (this.obstacles.length === 0 || 
          (this.canvas.width - (this.obstacles.length > 0 ? this.obstacles[this.obstacles.length - 1].x : this.canvas.width)) >= this.distanceToNextSpawn) {
          this.spawnObstacle();
          this.setNextSpawnDistance();
      }
  }

  checkCollision(player, obstacle) {
      const p_hitbox = player.isDucking ? player.duckHitbox : player.runHitbox;
      
      const p_x = player.x + p_hitbox.x_offset;
      const p_y = player.y + p_hitbox.y_offset;
      const p_w = p_hitbox.width;
      const p_h = p_hitbox.height;

      const o_x = obstacle.x + obstacle.hitbox.x_offset;
      const o_y = obstacle.y + obstacle.hitbox.y_offset;
      const o_w = obstacle.hitbox.width;
      const o_h = obstacle.hitbox.height;

      const collision = p_x < o_x + o_w &&
             p_x + p_w > o_x &&
             p_y < o_y + o_h &&
             p_y + p_h > o_y;

      return collision;
  }

  createExplosionParticles(x, y) {
      for (let i = 0; i < 15; i++) {
          this.particles.push({
              x: x + (Math.random() - 0.5) * 10,
              y: y + (Math.random() - 0.5) * 10,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10 - 5,
              life: 60,
              color: ['#FF4500', '#FFD700', '#FF6347', this._getColor('coin'), this._getColor('obstacleGreen')][Math.floor(Math.random() * 5)],
              size: 2 + Math.random() * 3
          });
      }
  }

  updateParticles() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
          const particle = this.particles[i];
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.4;
          particle.life--;

          if (particle.life <= 0) {
              this.particles.splice(i, 1);
          }
      }
  }

  gameOver() {
      this.gameRunning = false;
      this.currentGameState = 'gameOver';
      this.finalScoreDisplay.textContent = this.score;
      this.updateScoreDisplay();
      this.updateBestScoreDisplay();
      this.updateUIVisibility();
  }

  gameLoop() {
      if (this.currentGameState === 'playing' && this.gameRunning) {
          this.update();
      }
      this.draw();
      requestAnimationFrame(() => this.gameLoop());
  }

  update() {
      // Player animation
      this.player.animFrame = (this.player.animFrame + this.player.animSpeed) % 4;

      // Player physics
      if (this.player.jumping) {
          this.player.velY += 0.6;
          this.player.y += this.player.velY;

          if (this.player.y >= this.groundY - this.player.height) {
              this.player.y = this.groundY - this.player.height;
              this.player.jumping = false;
              this.player.grounded = true;
              this.player.velY = 0;
              this.player.animFrame = 0;
          }
      }

      if (this.jumpRequested && this.player.grounded) {
          this.player.velY = -14; // Increased for better obstacle clearance
          this.player.jumping = true;
          this.player.grounded = false;
          this.jumpRequested = false;
          this.player.isDucking = false;
          this.player.animFrame = 0;
      }

      // Allow ducking in air for faster descent
      if (!this.player.grounded && this.player.isDucking) {
          this.player.velY += 1.5; // Reduced for smoother descent
      }

      // Update clouds
      this.clouds.forEach(cloud => {
          cloud.x -= cloud.speed;
          if (cloud.x + cloud.w < 0) {
              cloud.x = this.canvas.width + Math.random() * 100;
              cloud.y = 30 + Math.random() * (this.groundY / 3);
          }
      });

      // Update game elements
      this.updateObstacles();
      this.updateParticles();

      // Update score - New scoring system
      this.distance += this.speed;
      this.steps++;
      
      // 1 point every 50 steps
      if (this.steps >= 50) {
          this.score += 1;
          this.steps = 0; // Reset step counter
          this.updateScoreDisplay();
      }

      // Auto day/night toggle every 200 points
      if (this.score >= this.nextThemeToggleScore) {
          this.toggleDayNight();
          this.nextThemeToggleScore += 200; // Next toggle at +200 points
      }

      // Gradual speed increase - balanced progression
      if (this.score >= 50 && this.score < 100 && this.speed < 4.5) {
          this.speed = Math.min(this.speed + 0.003, 4.5);
      } else if (this.score >= 100 && this.score < 200 && this.speed < 5.5) {
          this.speed = Math.min(this.speed + 0.003, 5.5);
      } else if (this.score >= 200 && this.speed < 7) {
          this.speed = Math.min(this.speed + 0.003, 7);
      }
  }

  draw() {
      // Clear canvas with white background
      this.ctx.fillStyle = this._getColor('sky');
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw ground with shadow
      this.ctx.fillStyle = this._getColor('groundShadow');
      this.ctx.fillRect(0, this.groundY + 5, this.canvas.width, this.canvas.height - this.groundY - 5);
      this.ctx.fillStyle = this._getColor('ground');
      this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

      // Draw clouds
      this.clouds.forEach(cloud => {
          this.ctx.save();
          this.ctx.globalAlpha = cloud.opacity;
          this.ctx.fillStyle = this._getColor('cloud');
          this.ctx.beginPath();
          this.ctx.arc(cloud.x, cloud.y, cloud.w * 0.3, 0, Math.PI * 2);
          this.ctx.arc(cloud.x + cloud.w * 0.3, cloud.y, cloud.w * 0.4, 0, Math.PI * 2);
          this.ctx.arc(cloud.x + cloud.w * 0.6, cloud.y, cloud.w * 0.3, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
      });

      // Draw obstacles
      this.obstacles.forEach(obs => this.drawObstacle(obs));

      // Draw particles
      this.particles.forEach(particle => {
          this.ctx.save();
          this.ctx.globalAlpha = particle.life / 60;
          this.ctx.fillStyle = particle.color;
          this.ctx.beginPath();
          this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
      });

      // Draw player
      this.drawPlayer();
  }

  drawPlayer() {
      const p = this.player;
      const colors = this.isNightMode ? this.themeColors.night : this.themeColors.day;
      
      this.ctx.save();
      
      // Disable smoothing for pixel art style
      this.ctx.imageSmoothingEnabled = false;
      
      // Animation frame for walking cycle (0-3)
      const walkFrame = Math.floor(p.animFrame) % 4;
      
      // Base positions
      const baseX = p.x;
      const baseY = p.y;
      
      // Pixel art rendering function
      const drawPixel = (x, y, w = 2, h = 2, color) => {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(Math.floor(baseX + x), Math.floor(baseY + y), w, h);
      };
      
      // Character scale (2x2 pixels for each "pixel")
      const scale = 2;
      
      if (p.isDucking) {
          this.drawDuckingCharacter(drawPixel, colors, scale);
      } else if (p.jumping) {
          this.drawJumpingCharacter(drawPixel, colors, scale);
      } else {
          this.drawRunningCharacter(drawPixel, colors, scale, walkFrame);
      }
      
      this.ctx.restore();
  }
  
  drawRunningCharacter(drawPixel, colors, scale, walkFrame) {
      // TARBOUSH (Traditional Syrian cap) - Scaled down
      drawPixel(6*scale, 1*scale, 10*scale, 5*scale, colors.playerTarboush);
      drawPixel(8*scale, 0, 6*scale, 3*scale, colors.playerTarboush);
      drawPixel(16*scale, 1*scale, 2*scale, 2*scale, colors.playerTarboushTassel);
      
      // HEAD & FACE (side profile) - Scaled down
      drawPixel(6*scale, 6*scale, 8*scale, 6*scale, colors.playerSkin);
      drawPixel(14*scale, 8*scale, 2*scale, 1*scale, colors.playerSkin);
      drawPixel(11*scale, 8*scale, 1*scale, 1*scale, colors.playerBeard);
      
      // BEARD & MUSTACHE - Scaled down
      drawPixel(4*scale, 11*scale, 6*scale, 4*scale, colors.playerBeard);
      drawPixel(8*scale, 10*scale, 4*scale, 2*scale, colors.playerBeard);
      drawPixel(11*scale, 10*scale, 3*scale, 1*scale, colors.playerBeard);
      
      // THOBE (Traditional robe) - Scaled down
      drawPixel(3*scale, 15*scale, 12*scale, 16*scale, colors.playerThobe);
      drawPixel(9*scale, 18*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      drawPixel(9*scale, 21*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      drawPixel(9*scale, 24*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      
      // ARMS - Animated based on walk cycle, scaled down
      const armSwing = walkFrame < 2 ? 0 : 1*scale;
      const armSwing2 = walkFrame < 2 ? 1*scale : 0;
      
      drawPixel(15*scale, 17*scale + armSwing, 3*scale, 6*scale, colors.playerSkin);
      drawPixel(17*scale, 21*scale + armSwing, 3*scale, 3*scale, colors.playerSkin);
      drawPixel(1*scale, 18*scale + armSwing2, 3*scale, 5*scale, colors.playerSkin);
      
      // LEGS - Animated walking cycle, scaled down
      let rightLegY, leftLegY, rightFootY, leftFootY;
      
      if (walkFrame === 0) {
          rightLegY = 31*scale; leftLegY = 32*scale;
          rightFootY = 37*scale; leftFootY = 38*scale;
      } else if (walkFrame === 1) {
          rightLegY = 31.5*scale; leftLegY = 31.5*scale;
          rightFootY = 37.5*scale; leftFootY = 37.5*scale;
      } else if (walkFrame === 2) {
          rightLegY = 32*scale; leftLegY = 31*scale;
          rightFootY = 38*scale; leftFootY = 37*scale;
      } else {
          rightLegY = 31.5*scale; leftLegY = 31.5*scale;
          rightFootY = 37.5*scale; leftFootY = 37.5*scale;
      }
      
      drawPixel(11*scale, rightLegY, 2*scale, 6*scale, colors.playerSkin);
      drawPixel(10*scale, rightFootY, 4*scale, 3*scale, colors.playerShoes);
      drawPixel(8*scale, leftLegY, 2*scale, 6*scale, colors.playerSkin);
      drawPixel(7*scale, leftFootY, 4*scale, 3*scale, colors.playerShoes);
  }
  
  drawJumpingCharacter(drawPixel, colors, scale) {
      // TARBOUSH
      drawPixel(6*scale, 1*scale, 10*scale, 5*scale, colors.playerTarboush);
      drawPixel(8*scale, 0, 6*scale, 3*scale, colors.playerTarboush);
      drawPixel(16*scale, 1*scale, 2*scale, 2*scale, colors.playerTarboushTassel);
      
      // HEAD & FACE
      drawPixel(6*scale, 6*scale, 8*scale, 6*scale, colors.playerSkin);
      drawPixel(14*scale, 8*scale, 2*scale, 1*scale, colors.playerSkin);
      drawPixel(11*scale, 8*scale, 1*scale, 1*scale, colors.playerBeard);
      
      // BEARD
      drawPixel(4*scale, 11*scale, 6*scale, 4*scale, colors.playerBeard);
      drawPixel(8*scale, 10*scale, 4*scale, 2*scale, colors.playerBeard);
      drawPixel(11*scale, 10*scale, 3*scale, 1*scale, colors.playerBeard);
      
      // THOBE
      drawPixel(3*scale, 15*scale, 12*scale, 16*scale, colors.playerThobe);
      drawPixel(9*scale, 18*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      drawPixel(9*scale, 21*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      drawPixel(9*scale, 24*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      
      // ARMS - Raised up for jumping, scaled down
      drawPixel(15*scale, 14*scale, 3*scale, 5*scale, colors.playerSkin);
      drawPixel(1*scale, 15*scale, 3*scale, 5*scale, colors.playerSkin);
      
      // LEGS - Bent/tucked for jumping, scaled down
      drawPixel(9*scale, 33*scale, 3*scale, 5*scale, colors.playerSkin);
      drawPixel(6*scale, 35*scale, 3*scale, 5*scale, colors.playerSkin);
      drawPixel(8*scale, 36*scale, 4*scale, 2*scale, colors.playerShoes);
      drawPixel(5*scale, 38*scale, 4*scale, 2*scale, colors.playerShoes);
  }
  
  drawDuckingCharacter(drawPixel, colors, scale) {
      // TARBOUSH - Lower due to ducking, scaled down
      drawPixel(6*scale, 8*scale, 10*scale, 5*scale, colors.playerTarboush);
      drawPixel(8*scale, 6*scale, 6*scale, 3*scale, colors.playerTarboush);
      drawPixel(16*scale, 7*scale, 2*scale, 2*scale, colors.playerTarboushTassel);
      
      // HEAD - Lower position, scaled down
      drawPixel(6*scale, 13*scale, 8*scale, 6*scale, colors.playerSkin);
      drawPixel(14*scale, 15*scale, 2*scale, 1*scale, colors.playerSkin);
      drawPixel(11*scale, 15*scale, 1*scale, 1*scale, colors.playerBeard);
      
      // BEARD - scaled down
      drawPixel(4*scale, 18*scale, 6*scale, 4*scale, colors.playerBeard);
      drawPixel(8*scale, 17*scale, 4*scale, 2*scale, colors.playerBeard);
      drawPixel(11*scale, 17*scale, 3*scale, 1*scale, colors.playerBeard);
      
      // THOBE - Compressed/crouched, scaled down
      drawPixel(3*scale, 22*scale, 12*scale, 12*scale, colors.playerThobe);
      drawPixel(9*scale, 25*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      drawPixel(9*scale, 28*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      
      // ARMS - Down for ducking, scaled down
      drawPixel(15*scale, 24*scale, 3*scale, 5*scale, colors.playerSkin);
      drawPixel(1*scale, 25*scale, 3*scale, 5*scale, colors.playerSkin);
      
      // LEGS - Crouched position, scaled down
      drawPixel(7*scale, 34*scale, 5*scale, 5*scale, colors.playerSkin);
      drawPixel(6*scale, 37*scale, 7*scale, 3*scale, colors.playerShoes);
  }

  drawObstacle(obs) {
      const colors = this.isNightMode ? this.themeColors.night : this.themeColors.day;
      this.ctx.save();
      
      // Disable smoothing for pixel art style
      this.ctx.imageSmoothingEnabled = false;
      
      switch (obs.type) {
          case 'cactus':
              // Pixel art cactus - Syrian desert plant (scaled for shorter character)
              this.ctx.fillStyle = colors.obstacleGreen;
              this.ctx.fillRect(obs.x + 6, obs.y, 6, obs.height);
              this.ctx.fillRect(obs.x, obs.y + 12, 10, 5);
              this.ctx.fillRect(obs.x, obs.y + 8, 5, 12);
              this.ctx.fillRect(obs.x + 14, obs.y + 16, 5, 12);
              this.ctx.fillRect(obs.x + 17, obs.y + 12, 6, 5);
              this.ctx.fillStyle = colors.obstacleBlack;
              for(let i = 0; i < 3; i++) {
                  this.ctx.fillRect(obs.x + 8, obs.y + 8 + i*8, 2, 2);
                  this.ctx.fillRect(obs.x + 10, obs.y + 12 + i*8, 2, 2);
              }
              break;
              
          case 'rock':
              // Pixel art rock formation (scaled for shorter character)
              this.ctx.fillStyle = colors.obstacleGrey;
              this.ctx.fillRect(obs.x, obs.y + obs.height - 6, obs.width, 6);
              this.ctx.fillRect(obs.x + 3, obs.y + obs.height - 12, obs.width - 6, 6);
              this.ctx.fillRect(obs.x + 6, obs.y, obs.width - 12, 6);
              this.ctx.fillStyle = colors.obstacleBlack;
              this.ctx.fillRect(obs.x + obs.width - 3, obs.y + obs.height - 9, 3, 9);
              this.ctx.fillRect(obs.x + obs.width - 6, obs.y + obs.height - 6, 3, 6);
              break;
              
          case 'bird':
              // Pixel art flying bird (scaled for shorter character)
              this.ctx.fillStyle = colors.obstacleBlack;
              const wingFlap = Math.sin(this.player.animFrame * 3) > 0 ? 0 : 1;
              
              this.ctx.fillRect(obs.x + 12, obs.y + 6, 8, 5);
              this.ctx.fillRect(obs.x + 20, obs.y + 5, 5, 3);
              this.ctx.fillRect(obs.x + 25, obs.y + 6, 2, 1);
              
              if (wingFlap === 0) {
                  this.ctx.fillRect(obs.x + 6, obs.y + 2, 10, 3);
                  this.ctx.fillRect(obs.x + 16, obs.y + 3, 6, 3);
                  this.ctx.fillRect(obs.x + 22, obs.y + 2, 6, 3);
              } else {
                  this.ctx.fillRect(obs.x + 6, obs.y + 10, 10, 3);
                  this.ctx.fillRect(obs.x + 16, obs.y + 11, 6, 3);
                  this.ctx.fillRect(obs.x + 22, obs.y + 10, 6, 3);
              }
              
              this.ctx.fillStyle = colors.playerSkin;
              this.ctx.fillRect(obs.x + 21, obs.y + 6, 1, 1);
              break;
              
          case 'missile':
              // Pixel art missile - modern threat (scaled for shorter character)
              this.ctx.fillStyle = colors.obstacleGrey;
              this.ctx.fillRect(obs.x + 8, obs.y + 5, 32, 6);
              this.ctx.fillStyle = colors.obstacleBlack;
              this.ctx.fillRect(obs.x + 40, obs.y + 3, 5, 3);
              this.ctx.fillRect(obs.x + 45, obs.y + 5, 3, 3);
              this.ctx.fillRect(obs.x + 48, obs.y + 6, 2, 3);
              
              this.ctx.fillStyle = colors.obstacleGrey;
              this.ctx.fillRect(obs.x + 10, obs.y + 2, 5, 3);
              this.ctx.fillRect(obs.x + 10, obs.y + 11, 5, 3);
              
              // Flame trail - animated (scaled for shorter character)
              this.ctx.fillStyle = colors.obstacleMissileFlame;
              const flameFrame = Math.floor(Date.now() * 0.01) % 3;
              const flameLength = 12 + flameFrame * 2;
              
              this.ctx.fillRect(obs.x + 8 - flameLength, obs.y + 6, flameLength, 3);
              this.ctx.fillRect(obs.x + 8 - flameLength + 2, obs.y + 5, flameLength - 3, 2);
              this.ctx.fillRect(obs.x + 8 - flameLength + 2, obs.y + 9, flameLength - 3, 2);
              
              // Inner flame
              this.ctx.fillStyle = '#FFD700';
              this.ctx.fillRect(obs.x + 8 - flameLength/2, obs.y + 7, flameLength/2, 1);
              break;
      }
      
      this.ctx.restore();
  }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    try {
        new Game();
    } catch (error) {
        console.error('Game initialization failed:', error);
    }
});
