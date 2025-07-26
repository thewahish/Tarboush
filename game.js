class Game {
  constructor() {
    console.log("[Constructor DEBUG] Starting Game constructor."); 

    try {
        // Basic property initialization
        this.gameRunning = false;
        this.score = 0;
        this.bestScore = localStorage.getItem('tarboushBestScore') || 0;
        this.speed = 3.5; // Adjusted for balanced start
        this.initialSpeed = 3.5; // Store initial speed for resets
        this.maxSpeed = 10; // Cap for game speed
        this.distance = 0;
        this.steps = 0; // Track steps for new scoring system
        this.nextThemeToggleScore = 200; // Day/Night toggle every 200 points
        this.lastUpdateTime = 0; // For delta time calculation
        this.deltaTime = 0; // Time elapsed since last frame

        // Jump control variables
        this.jumpRequested = false;
        this.spacePressed = false; // For keyboard specific state

        // Pixel art scale factor
        this.scale = 2; // Each "pixel" in the art is 2x2 on canvas

        // Player properties - Updated for shorter character and scaled hitboxes
        this.player = {
            x: 120, y: 0, width: 24 * this.scale, height: 30 * this.scale, // Base pixel size (24x30) * scale
            velY: 0, jumping: false, grounded: true, isDucking: false,
            // Hitboxes are relative to player's top-left corner
            runHitbox: { x_offset: 3 * this.scale, y_offset: 3 * this.scale, width: 18 * this.scale, height: 27 * this.scale }, 
            duckHitbox: { x_offset: 3 * this.scale, y_offset: 12 * this.scale, width: 18 * this.scale, height: 15 * this.scale }, 
            animFrame: 0,
            animSpeed: 0.25 // Slightly faster animation
        };

        this.isNightMode = false;
        this.particles = [];
        
        // Updated Syrian Identity Color Themes with pixel art character colors
        // These now directly map to CSS variables for consistency
        this.themeColors = {
            day: {
                ground: getComputedStyle(document.documentElement).getPropertyValue('--golden-wheat-secondary'), 
                groundShadow: getComputedStyle(document.documentElement).getPropertyValue('--golden-wheat-dark'),
                cloud: 'rgba(237, 235, 224, 0.7)', 
                // Pixel art character colors (using day mode CSS variables for character)
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
                sky: getComputedStyle(document.documentElement).getPropertyValue('--charcoal-primary'), // White background
                coin: '#b9a779'
            },
            night: {
                ground: getComputedStyle(document.documentElement).getPropertyValue('--deep-umber-primary'), 
                groundShadow: getComputedStyle(document.documentElement).getPropertyValue('--deep-umber-secondary'),
                cloud: 'rgba(237, 235, 224, 0.3)',
                // Night mode character colors (slightly adjusted for night vision)
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
                sky: getComputedStyle(document.documentElement).getPropertyValue('--main-bg'), // Dark background for night
                coin: '#988561'
            }
        };

        // Character definitions (SVG images are good for character selection menu)
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
        if (!this.canvas) throw new Error("Canvas element #gameCanvas not found!");
        this.ctx = this.canvas.getContext('2d');
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
        this.gameContainer = document.querySelector('.game-container'); // Now parent of canvas and other UI
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
        this.debuggerDisplay = document.getElementById('debuggerDisplay');

        // Game state setup
        this.setupCanvas();
        this.obstacles = [];
        this.distanceToNextSpawn = 0;
        // Updated obstacle patterns with groups and varied heights
        // Added some more strategic patterns, e.g., jump then duck
        this.obstaclePatterns = [
            // Single obstacles
            { type: 'cactus', width: 12 * this.scale, height: 20 * this.scale, yOffset: 0, group: 'single', minSpacing: 200, maxSpacing: 400 },
            { type: 'rock', width: 15 * this.scale, height: 10 * this.scale, yOffset: 0, group: 'single', minSpacing: 200, maxSpacing: 400 },
            { type: 'bird', width: 18 * this.scale, height: 10 * this.scale, yOffset: 25 * this.scale, group: 'single', minSpacing: 250, maxSpacing: 500 }, // Mid-height bird
            { type: 'bird', width: 18 * this.scale, height: 10 * this.scale, yOffset: 35 * this.scale, group: 'single', minSpacing: 250, maxSpacing: 500 }, // High bird
            { type: 'missile', width: 25 * this.scale, height: 8 * this.scale, yOffset: 15 * this.scale, group: 'single', minSpacing: 300, maxSpacing: 600 }, // Mid-height missile
            { type: 'missile', width: 25 * this.scale, height: 8 * this.scale, yOffset: 25 * this.scale, group: 'single', minSpacing: 300, maxSpacing: 600 }, // High missile
            // Double obstacles (ground)
            { type: 'cactus', width: 12 * this.scale, height: 20 * this.scale, yOffset: 0, group: 'double-ground', count: 2, spacing: 60 * this.scale, minSpacing: 350, maxSpacing: 550 },
            { type: 'rock', width: 15 * this.scale, height: 10 * this.scale, yOffset: 0, group: 'double-ground', count: 2, spacing: 70 * this.scale, minSpacing: 350, maxSpacing: 550 },
            // Mixed patterns (more complex sequences)
            { type: 'cactus', width: 12 * this.scale, height: 20 * this.scale, yOffset: 0, group: 'jump-duck', sequence: [{ type: 'cactus', yOffset: 0 }, { type: 'bird', yOffset: 25 * this.scale, xOffset: 100 * this.scale }], minSpacing: 400, maxSpacing: 700 },
            { type: 'rock', width: 15 * this.scale, height: 10 * this.scale, yOffset: 0, group: 'duck-jump', sequence: [{ type: 'missile', yOffset: 15 * this.scale }, { type: 'cactus', yOffset: 0, xOffset: 120 * this.scale }], minSpacing: 400, maxSpacing: 700 }
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
            // Fallback for immediate display if animation issues
            this.currentGameState = 'characterSelect';
            this.updateUIVisibility();
            this.renderCharacterSelectScreen();
        }

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp)); // Start game loop with timestamp
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
        if (this.currentGameState === 'playing') { // No need for !this.jumpPressed here, handled by jumpRequested
            this.jumpRequested = true;
        }
    }, { passive: false });

    this.jumpButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // No need to reset jumpPressed here as jumpRequested is one-shot
    }, { passive: false });

    // Add click events as fallback
    this.jumpButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.currentGameState === 'playing') { // No need for !this.jumpPressed here, handled by jumpRequested
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
                this.spacePressed = true; // Set flag to prevent repeated jump
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
                this.spacePressed = false; // Reset flag on key up
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
    
    // Adjusted ground position for shorter character relative to canvas height
    this.groundY = this.canvas.height - (25 * this.scale); // Ground is 25 pixels (scaled) from bottom
    this.player.y = this.groundY - this.player.height; // Place player on the ground
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
    return color || this.themeColors.day.sky; // Fallback to day sky color
  }

  toggleDayNight() {
    this.isNightMode = !this.isNightMode;
    document.body.classList.toggle('night-mode', this.isNightMode);
    this.updateScoreDisplay(); // Update score display in case colors change
  }

  updateUIVisibility() {
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      
      // 1. Hide ALL game-screen elements first
      document.querySelectorAll('.game-screen').forEach(el => el.style.display = 'none');
      // 2. Always hide action buttons first
      this.jumpButton.style.display = 'none';
      this.duckButton.style.display = 'none';

      // Crucially, hide the game-container itself initially or when not in game state
      this.gameContainer.style.display = 'none'; // Hide game-container by default

      // 3. Show elements based on state and orientation
      if (this.currentGameState === 'loading') {
          this.loaderScreen.style.display = 'flex';
          // gameContainer remains hidden
      } else if (!isLandscape) {
          this.orientationWarning.style.display = 'flex';
          // gameContainer remains hidden
      } else {
          // If in a game state and landscape, game-container should be flex
          this.gameContainer.style.display = 'flex'; // Now explicitly show the game-container

          if (this.currentGameState === 'playing') {
              this.uiContainer.style.display = 'flex';
              this.scoreDisplay.style.display = 'block'; 
              this.jumpButton.style.display = 'flex';
              this.duckButton.style.display = 'flex';
              // Canvas is part of gameContainer, so it's visible automatically when gameContainer is flex
          } else if (this.currentGameState === 'gameOver') {
              this.uiContainer.style.display = 'flex';
              this.scoreDisplay.style.display = 'block';
              this.gameOverScreen.style.display = 'flex';
          } else if (this.currentGameState === 'characterSelect') {
              this.characterSelectScreen.style.display = 'flex';
          }
      }
      // Debugger can be shown independently if needed
      // this.debuggerDisplay.style.display = 'block'; // Or 'none' if you want to control it
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

      // Remove existing listener to prevent duplicates
      if (this._startGameButtonHandler) { // Check if handler exists before removing
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
      this.speed = this.initialSpeed; // Reset to initial speed
      this.distance = 0;
      this.steps = 0; // Reset steps counter
      this.nextThemeToggleScore = 200; // Reset theme toggle
      this.isNightMode = false; // Reset to day mode on game start
      document.body.classList.remove('night-mode'); // Ensure body class is removed

      // Reset player state
      this.player.y = this.groundY - this.player.height;
      this.player.velY = 0;
      this.player.grounded = true;
      this.player.isDucking = false;
      this.player.jumping = false;
      this.jumpRequested = false;
      this.spacePressed = false;
      this.player.animFrame = 0; // Reset animation frame

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
          this.scoreDisplay.textContent = `نقاط: ${this.score} ليرة سوري`; // Added currency
      }
      if (this.score > this.bestScore) {
          this.bestScore = this.score;
          localStorage.setItem('tarboushBestScore', this.bestScore);
          this.updateBestScoreDisplay();
      }
  }

  setNextSpawnDistance() {
      // Adjusted range for more varied spacing and challenge
      this.distanceToNextSpawn = (this.canvas.width * 0.4) + Math.random() * (this.canvas.width * 0.6);
  }

  spawnObstacle() {
      // Choose pattern type based on probability and current speed/difficulty
      const rand = Math.random();
      let patternsToChoose = [];

      if (this.score < 100) { // Easier obstacles early on
          patternsToChoose = this.obstaclePatterns.filter(p => p.group === 'single');
      } else if (this.score < 300) { // Introduce double obstacles
          patternsToChoose = this.obstaclePatterns.filter(p => p.group === 'single' || p.group === 'double-ground');
      } else { // All obstacles, including complex sequences
          patternsToChoose = this.obstaclePatterns;
      }
      
      const pattern = patternsToChoose[Math.floor(Math.random() * patternsToChoose.length)];

      const createObstacleInstance = (data, xOffset = 0) => {
          // Calculate obstacle height relative to ground and its own yOffset
          const actualY = this.groundY - data.height - data.yOffset;
          return {
              x: this.canvas.width + 10 + xOffset, // Start off screen
              y: actualY,
              width: data.width,
              height: data.height,
              type: data.type,
              yOffset: data.yOffset,
              hitbox: { // Simple AABB hitbox, slightly smaller than actual drawn size
                  x_offset: data.width * 0.1, // 10% from left
                  y_offset: data.height * 0.1, // 10% from top
                  width: data.width * 0.8,    // 80% of width
                  height: data.height * 0.8   // 80% of height
              },
              scored: false
          };
      };

      if (pattern.group === 'single') {
          this.obstacles.push(createObstacleInstance(pattern));
          this.distanceToNextSpawn = pattern.minSpacing + Math.random() * (pattern.maxSpacing - pattern.minSpacing);
      } else if (pattern.group === 'double-ground') {
          this.obstacles.push(createObstacleInstance(pattern));
          this.obstacles.push(createObstacleInstance(pattern, pattern.spacing)); // Fixed spacing
          this.distanceToNextSpawn = pattern.minSpacing + Math.random() * (pattern.maxSpacing - pattern.minSpacing);
      } else if (pattern.group === 'jump-duck' || pattern.group === 'duck-jump') {
          // For sequences, add all obstacles from the sequence
          pattern.sequence.forEach(seqItem => {
              const obstacleData = this.obstaclePatterns.find(p => p.type === seqItem.type && p.group === 'single');
              if (obstacleData) {
                  this.obstacles.push(createObstacleInstance({
                      ...obstacleData, // Copy base properties
                      yOffset: seqItem.yOffset, // Override yOffset
                      height: obstacleData.height // Ensure height is from base type
                  }, seqItem.xOffset || 0)); // Use xOffset if provided
              }
          });
          this.distanceToNextSpawn = pattern.minSpacing + Math.random() * (pattern.maxSpacing - pattern.minSpacing);
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

          // Enhanced collision detection
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

      // Spawn new obstacles - check last obstacle's position
      const lastObstacleX = this.obstacles.length > 0 ? this.obstacles[this.obstacles.length - 1].x : 0;
      if (this.obstacles.length === 0 || 
          (this.canvas.width - lastObstacleX) >= this.distanceToNextSpawn) {
          this.spawnObstacle();
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

      // Check for overlap
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
          particle.vy += 0.4; // Apply gravity to particles
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
      this.updateScoreDisplay(); // Ensures best score is updated
      this.updateUIVisibility();
  }

  gameLoop(timestamp) {
      this.deltaTime = (timestamp - this.lastUpdateTime) / 1000; // Convert to seconds
      this.lastUpdateTime = timestamp;

      if (this.currentGameState === 'playing' && this.gameRunning) {
          this.update(this.deltaTime);
      }
      this.draw();
      requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  update(deltaTime) {
      // Player animation
      this.player.animFrame = (this.player.animFrame + this.player.animSpeed * deltaTime * 60) % 4; // Adjust speed with deltaTime

      // Player physics (using deltaTime for smoother movement)
      const gravity = 0.8 * deltaTime * 60; // Increased gravity, scaled by deltaTime
      const jumpForce = -18 * deltaTime * 60; // Increased jump force, scaled by deltaTime
      const duckDescent = 0.6 * deltaTime * 60; // Smoother duck descent, scaled by deltaTime

      if (this.player.jumping) {
          this.player.velY += gravity;
          this.player.y += this.player.velY;

          if (this.player.y >= this.groundY - this.player.height) {
              this.player.y = this.groundY - this.player.height;
              this.player.jumping = false;
              this.player.grounded = true;
              this.player.velY = 0;
              this.player.animFrame = 0; // Reset anim frame on landing
          }
      }

      if (this.jumpRequested && this.player.grounded) {
          this.player.velY = jumpForce;
          this.player.jumping = true;
          this.player.grounded = false;
          this.jumpRequested = false;
          this.player.isDucking = false; // Cannot duck mid-jump request
          this.player.animFrame = 0; // Reset anim frame on jump start
      }

      // Allow ducking in air for faster descent
      if (!this.player.grounded && this.player.isDucking && this.player.velY > 0) { // Only if falling
          this.player.velY += duckDescent;
      }

      // Update clouds
      this.clouds.forEach(cloud => {
          cloud.x -= cloud.speed * deltaTime * 60; // Scale with deltaTime
          if (cloud.x + cloud.w < 0) {
              cloud.x = this.canvas.width + Math.random() * 100;
              cloud.y = 30 + Math.random() * (this.groundY / 3);
          }
      });

      // Update game elements
      this.updateObstacles(); // Obstacle movement already uses this.speed
      this.updateParticles(); // Particles are self-contained

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

      // Gradual speed increase - continuous progression
      this.speed = Math.min(this.initialSpeed + (this.score * 0.01), this.maxSpeed); // Increase speed based on score
  }

  draw() {
      // Clear canvas with background color
      this.ctx.fillStyle = this._getColor('sky');
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw ground with shadow
      this.ctx.fillStyle = this._getColor('groundShadow');
      this.ctx.fillRect(0, this.groundY + (2*this.scale), this.canvas.width, this.canvas.height - this.groundY - (2*this.scale));
      this.ctx.fillStyle = this._getColor('ground');
      this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

      // Draw clouds
      this.clouds.forEach(cloud => {
          this.ctx.save();
          this.ctx.globalAlpha = cloud.opacity;
          this.ctx.fillStyle = this._getColor('cloud');
          this.ctx.beginPath();
          // Simplified cloud drawing, can be more complex if desired
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

      // Draw player only if game is playing or over (not in character select)
      if (this.currentGameState === 'playing' || this.currentGameState === 'gameOver') {
        this.drawPlayer();
      }
  }

  // --- Pixel Art Drawing Functions (Simplified and Scaled) ---
  drawPlayer() {
      const p = this.player;
      const colors = this.isNightMode ? this.themeColors.night : this.themeColors.day;
      
      this.ctx.save();
      this.ctx.imageSmoothingEnabled = false; // Disable smoothing for pixel art
      
      // Base positions for all drawing
      const baseX = p.x;
      const baseY = p.y;
      
      // Pixel art rendering helper
      const drawPixel = (x, y, w, h, color) => {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(Math.floor(baseX + x), Math.floor(baseY + y), w, h);
      };
      
      if (p.isDucking) {
          this.drawDuckingCharacter(drawPixel, colors, this.scale);
      } else if (p.jumping) {
          this.drawJumpingCharacter(drawPixel, colors, this.scale);
      } else {
          this.drawRunningCharacter(drawPixel, colors, this.scale, Math.floor(p.animFrame) % 4);
      }
      
      this.ctx.restore();
  }
  
  // Base pixel art size is 24x30, scaled by this.scale
  drawRunningCharacter(drawPixel, colors, scale, walkFrame) {
      // Tarboush
      drawPixel(7*scale, 0*scale, 10*scale, 5*scale, colors.playerTarboush);
      drawPixel(9*scale, -1*scale, 6*scale, 3*scale, colors.playerTarboush);
      drawPixel(16*scale, 1*scale, 2*scale, 2*scale, colors.playerTarboushTassel); // Tassel
      
      // Head/Face
      drawPixel(7*scale, 5*scale, 8*scale, 6*scale, colors.playerSkin);
      drawPixel(15*scale, 7*scale, 2*scale, 1*scale, colors.playerSkin); // Nose
      drawPixel(12*scale, 7*scale, 1*scale, 1*scale, colors.playerBeard); // Eye (simple dot)
      
      // Beard/Mouth area
      drawPixel(5*scale, 10*scale, 6*scale, 4*scale, colors.playerBeard);
      drawPixel(9*scale, 9*scale, 4*scale, 2*scale, colors.playerBeard);
      drawPixel(12*scale, 9*scale, 3*scale, 1*scale, colors.playerBeard);
      
      // Thobe (Body)
      drawPixel(4*scale, 14*scale, 12*scale, 16*scale, colors.playerThobe);
      drawPixel(10*scale, 17*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      drawPixel(10*scale, 20*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      drawPixel(10*scale, 23*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      
      // Arms (Animation)
      const armSwingX1 = (walkFrame === 0 || walkFrame === 2) ? 14*scale : 15*scale;
      const armSwingY1 = (walkFrame === 0 || walkFrame === 2) ? 16*scale : 17*scale;
      const armSwingX2 = (walkFrame === 0 || walkFrame === 2) ? 3*scale : 2*scale;
      const armSwingY2 = (walkFrame === 0 || walkFrame === 2) ? 17*scale : 18*scale;

      drawPixel(armSwingX1, armSwingY1, 3*scale, 6*scale, colors.playerSkin); // Right arm
      drawPixel(armSwingX2, armSwingY2, 3*scale, 5*scale, colors.playerSkin); // Left arm
      
      // Legs (Animation)
      let rightLegX, leftLegX, rightFootX, leftFootX;
      let rightLegY, leftLegY, rightFootY, leftFootY;

      if (walkFrame === 0) { // Right leg forward, left leg back
          rightLegX = 11*scale; leftLegX = 8*scale;
          rightLegY = 28*scale; leftLegY = 28*scale;
          rightFootX = 10*scale; leftFootX = 7*scale;
          rightFootY = 29*scale; leftFootY = 29*scale;
      } else if (walkFrame === 1) { // Both legs mid-stride
          rightLegX = 10*scale; leftLegX = 9*scale;
          rightLegY = 28.5*scale; leftLegY = 28.5*scale;
          rightFootX = 9*scale; leftFootX = 8*scale;
          rightFootY = 29.5*scale; leftFootY = 29.5*scale;
      } else if (walkFrame === 2) { // Left leg forward, right leg back
          rightLegX = 8*scale; leftLegX = 11*scale;
          rightLegY = 28*scale; leftLegY = 28*scale;
          rightFootX = 7*scale; leftFootX = 10*scale;
          rightFootY = 29*scale; leftFootY = 29*scale;
      } else { // Both legs mid-stride (mirror of frame 1)
          rightLegX = 9*scale; leftLegX = 10*scale;
          rightLegY = 28.5*scale; leftLegY = 28.5*scale;
          rightFootX = 8*scale; leftFootX = 9*scale;
          rightFootY = 29.5*scale; leftFootY = 29.5*scale;
      }
      
      drawPixel(rightLegX, rightLegY, 2*scale, 4*scale, colors.playerSkin);
      drawPixel(rightFootX, rightFootY, 4*scale, 2*scale, colors.playerShoes);
      drawPixel(leftLegX, leftLegY, 2*scale, 4*scale, colors.playerSkin);
      drawPixel(leftFootX, leftFootY, 4*scale, 2*scale, colors.playerShoes);
  }
  
  drawJumpingCharacter(drawPixel, colors, scale) {
      // Tarboush
      drawPixel(7*scale, 0*scale, 10*scale, 5*scale, colors.playerTarboush);
      drawPixel(9*scale, -1*scale, 6*scale, 3*scale, colors.playerTarboush);
      drawPixel(16*scale, 1*scale, 2*scale, 2*scale, colors.playerTarboushTassel);
      
      // Head/Face
      drawPixel(7*scale, 5*scale, 8*scale, 6*scale, colors.playerSkin);
      drawPixel(15*scale, 7*scale, 2*scale, 1*scale, colors.playerSkin);
      drawPixel(12*scale, 7*scale, 1*scale, 1*scale, colors.playerBeard);
      
      // Beard/Mouth area
      drawPixel(5*scale, 10*scale, 6*scale, 4*scale, colors.playerBeard);
      drawPixel(9*scale, 9*scale, 4*scale, 2*scale, colors.playerBeard);
      drawPixel(12*scale, 9*scale, 3*scale, 1*scale, colors.playerBeard);
      
      // Thobe
      drawPixel(4*scale, 14*scale, 12*scale, 16*scale, colors.playerThobe);
      drawPixel(10*scale, 17*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      drawPixel(10*scale, 20*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      drawPixel(10*scale, 23*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      
      // Arms (Tucked in)
      drawPixel(15*scale, 15*scale, 3*scale, 4*scale, colors.playerSkin);
      drawPixel(2*scale, 16*scale, 3*scale, 4*scale, colors.playerSkin);
      
      // Legs (Tucked in)
      drawPixel(10*scale, 27*scale, 3*scale, 4*scale, colors.playerSkin);
      drawPixel(7*scale, 28*scale, 3*scale, 4*scale, colors.playerSkin);
      drawPixel(9*scale, 29*scale, 4*scale, 2*scale, colors.playerShoes);
      drawPixel(6*scale, 30*scale, 4*scale, 2*scale, colors.playerShoes);
  }
  
  drawDuckingCharacter(drawPixel, colors, scale) {
      // Tarboush (lower)
      drawPixel(7*scale, 5*scale, 10*scale, 5*scale, colors.playerTarboush);
      drawPixel(9*scale, 4*scale, 6*scale, 3*scale, colors.playerTarboush);
      drawPixel(16*scale, 6*scale, 2*scale, 2*scale, colors.playerTarboushTassel);
      
      // Head/Face (lower)
      drawPixel(7*scale, 10*scale, 8*scale, 6*scale, colors.playerSkin);
      drawPixel(15*scale, 12*scale, 2*scale, 1*scale, colors.playerSkin);
      drawPixel(12*scale, 12*scale, 1*scale, 1*scale, colors.playerBeard);
      
      // Beard/Mouth area
      drawPixel(5*scale, 15*scale, 6*scale, 4*scale, colors.playerBeard);
      drawPixel(9*scale, 14*scale, 4*scale, 2*scale, colors.playerBeard);
      drawPixel(12*scale, 14*scale, 3*scale, 1*scale, colors.playerBeard);
      
      // Thobe (Compressed)
      drawPixel(4*scale, 19*scale, 12*scale, 9*scale, colors.playerThobe); // Shorter thobe
      drawPixel(10*scale, 20*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      drawPixel(10*scale, 23*scale, 1*scale, 1*scale, colors.playerThobeDetails);
      
      // Arms (Down)
      drawPixel(15*scale, 20*scale, 3*scale, 5*scale, colors.playerSkin);
      drawPixel(2*scale, 21*scale, 3*scale, 5*scale, colors.playerSkin);
      
      // Legs (Crouched)
      drawPixel(8*scale, 26*scale, 5*scale, 4*scale, colors.playerSkin);
      drawPixel(7*scale, 28*scale, 7*scale, 2*scale, colors.playerShoes);
  }

  drawObstacle(obs) {
      const colors = this.isNightMode ? this.themeColors.night : this.themeColors.day;
      this.ctx.save();
      this.ctx.imageSmoothingEnabled = false; // Disable smoothing for pixel art
      
      switch (obs.type) {
          case 'cactus':
              // Base size of cactus pixel art: 12px wide, 20px tall (pre-scale)
              this.ctx.fillStyle = colors.obstacleGreen;
              this.ctx.fillRect(obs.x + 6 * this.scale, obs.y, 6 * this.scale, obs.height); // Main trunk
              this.ctx.fillRect(obs.x + 0 * this.scale, obs.y + 12 * this.scale, 10 * this.scale, 5 * this.scale); // Left arm
              this.ctx.fillRect(obs.x + 0 * this.scale, obs.y + 8 * this.scale, 5 * this.scale, 12 * this.scale);
              this.ctx.fillRect(obs.x + 14 * this.scale, obs.y + 16 * this.scale, 5 * this.scale, 12 * this.scale); // Right arm
              this.ctx.fillRect(obs.x + 17 * this.scale, obs.y + 12 * this.scale, 6 * this.scale, 5 * this.scale);
              this.ctx.fillStyle = colors.obstacleBlack;
              // Spikes
              for(let i = 0; i < 3; i++) {
                  this.ctx.fillRect(obs.x + 8 * this.scale, obs.y + 8 * this.scale + i * 8 * this.scale, 2 * this.scale, 2 * this.scale);
                  this.ctx.fillRect(obs.x + 10 * this.scale, obs.y + 12 * this.scale + i * 8 * this.scale, 2 * this.scale, 2 * this.scale);
              }
              break;
              
          case 'rock':
              // Base size of rock pixel art: 15px wide, 10px tall (pre-scale)
              this.ctx.fillStyle = colors.obstacleGrey;
              this.ctx.fillRect(obs.x, obs.y + obs.height - 6 * this.scale, obs.width, 6 * this.scale);
              this.ctx.fillRect(obs.x + 3 * this.scale, obs.y + obs.height - 12 * this.scale, obs.width - 6 * this.scale, 6 * this.scale);
              this.ctx.fillRect(obs.x + 6 * this.scale, obs.y, obs.width - 12 * this.scale, 6 * this.scale);
              this.ctx.fillStyle = colors.obstacleBlack;
              this.ctx.fillRect(obs.x + obs.width - 3 * this.scale, obs.y + obs.height - 9 * this.scale, 3 * this.scale, 9 * this.scale);
              this.ctx.fillRect(obs.x + obs.width - 6 * this.scale, obs.y + obs.height - 6 * this.scale, 3 * this.scale, 6 * this.scale);
              break;
              
          case 'bird':
              // Base size of bird pixel art: 18px wide, 10px tall (pre-scale)
              this.ctx.fillStyle = colors.obstacleBlack;
              const wingFlap = Math.sin(this.player.animFrame * 3) > 0 ? 0 : 1; // Animation based on player anim frame
              
              this.ctx.fillRect(obs.x + 6 * this.scale, obs.y + 3 * this.scale, 8 * this.scale, 3 * this.scale); // Body
              this.ctx.fillRect(obs.x + 14 * this.scale, obs.y + 2 * this.scale, 4 * this.scale, 2 * this.scale); // Head
              this.ctx.fillRect(obs.x + 17 * this.scale, obs.y + 3 * this.scale, 1 * this.scale, 1 * this.scale); // Beak
              
              if (wingFlap === 0) { // Wings up
                  this.ctx.fillRect(obs.x + 2 * this.scale, obs.y + 0 * this.scale, 10 * this.scale, 2 * this.scale);
                  this.ctx.fillRect(obs.x + 12 * this.scale, obs.y + 1 * this.scale, 6 * this.scale, 2 * this.scale);
              } else { // Wings down
                  this.ctx.fillRect(obs.x + 2 * this.scale, obs.y + 6 * this.scale, 10 * this.scale, 2 * this.scale);
                  this.ctx.fillRect(obs.x + 12 * this.scale, obs.y + 7 * this.scale, 6 * this.scale, 2 * this.scale);
              }
              
              this.ctx.fillStyle = colors.playerSkin; // Eye color
              this.ctx.fillRect(obs.x + 15 * this.scale, obs.y + 3 * this.scale, 1 * this.scale, 1 * this.scale);
              break;
              
          case 'missile':
              // Base size of missile pixel art: 25px wide, 8px tall (pre-scale)
              this.ctx.fillStyle = colors.obstacleGrey;
              this.ctx.fillRect(obs.x + 4 * this.scale, obs.y + 3 * this.scale, 20 * this.scale, 3 * this.scale); // Main body
              this.ctx.fillStyle = colors.obstacleBlack;
              this.ctx.fillRect(obs.x + 24 * this.scale, obs.y + 2 * this.scale, 3 * this.scale, 2 * this.scale); // Nose cone
              this.ctx.fillRect(obs.x + 27 * this.scale, obs.y + 3 * this.scale, 2 * this.scale, 2 * this.scale);
              
              this.ctx.fillStyle = colors.obstacleGrey;
              this.ctx.fillRect(obs.x + 5 * this.scale, obs.y + 0 * this.scale, 3 * this.scale, 2 * this.scale); // Top fin
              this.ctx.fillRect(obs.x + 5 * this.scale, obs.y + 6 * this.scale, 3 * this.scale, 2 * this.scale); // Bottom fin
              
              // Flame trail - animated
              this.ctx.fillStyle = colors.obstacleMissileFlame;
              const flameFrame = Math.floor(Date.now() * 0.01 * this.speed) % 3; // Flame speed depends on game speed
              const flameLength = (6 + flameFrame * 2) * this.scale;
              
              this.ctx.fillRect(obs.x + 4 * this.scale - flameLength, obs.y + 3 * this.scale, flameLength, 3 * this.scale);
              this.ctx.fillStyle = '#FFD700'; // Inner flame
              this.ctx.fillRect(obs.x + 4 * this.scale - flameLength + 2 * this.scale, obs.y + 4 * this.scale, flameLength - 4 * this.scale, 1 * this.scale);
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
