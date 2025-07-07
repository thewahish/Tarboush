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
        this.updateUIVisibility(); // Ensure UI reflects halt
        return true; // Prevent default browser error handling
    };

    console.log("[Constructor DEBUG] Starting Game constructor."); 

    try {
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

        this.gameRunning = false; // Game starts as not running, waiting for character select
        this.score = 0;
        this.bestScore = localStorage.getItem('tarboushBestScore') || 0;
        this.speed = 3;
        this.distance = 0;
        this.lastScoredDistance = 0;

        // --- CHANGE: Day/Night toggle every 500 points ---
        this.nextThemeToggleScore = 500; 

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

        // --- NEW: Character Data ---
        this.characters = [
            { id: 'shami_abu_tarboush', name: 'شامي أبو طربوش', available: true, image: 'placeholder.png' }, // Placeholder image
            { id: 'fatom_hays_bays', name: 'فطوم حيص بيص', available: false, image: 'placeholder.png' },
            { id: 'zulfiqar', name: 'زولفيقار', available: false, image: 'placeholder.png' },
            { id: 'bakri_abu_halab', name: 'بكري أبو حلب', available: false, image: 'placeholder.png' },
            { id: 'warni_warni', name: 'ورني ورني', available: false, image: 'placeholder.png' }
        ];
        this.selectedCharacterId = 'shami_abu_tarboush'; // Default selected character

        this.setupCanvas(); // Sets up canvas dimensions and groundY

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
        this.bindEvents(); // Sets up event listeners
        this.updateBestScoreDisplay();
        this.setNextSpawnDistance();
        
        // --- NEW: Game starts in character select state ---
        this.currentGameState = 'characterSelect';
        this.updateUIVisibility(); // Adjusts UI based on initial state
        this.renderCharacterSelectScreen(); // Populates character select UI

        console.log("[Constructor DEBUG] Game init success. currentGameState:", this.currentGameState);
        this.updateDebugger(`Game init success. State: ${this.currentGameState}`);

        // Initial draw for character select screen (even if not playing)
        this.gameLoop(); // Starts the main loop, but it will pause in 'characterSelect' state.

    } catch (e) {
        console.error("Error during Game initialization (caught by constructor):", e);
        this.updateDebugger(`CRITICAL ERROR during Game init: ${e.message}. Game stopped.`);
        this.gameRunning = false;
        this.updateUIVisibility(); // Ensure UI reflects error state
    }
    console.log("[Constructor DEBUG] Constructor finished. Final gameRunning state:", this.gameRunning);
  }

  // --- CHANGE: Canvas Setup for Landscape Aspect Ratio ---
  setupCanvas() {
    const desiredAspectRatio = 2; // e.g., 2:1 width to height for a wider landscape view
    const minPadding = 40; // Minimum padding on sides

    let targetWidth = window.innerWidth - minPadding;
    let targetHeight = window.innerHeight - minPadding;

    // Calculate actual canvas dimensions maintaining aspect ratio
    if (targetWidth / targetHeight > desiredAspectRatio) {
        // Window is wider than desired aspect, constrain by height
        this.canvas.height = Math.min(targetHeight, 400); // Cap height at 400
        this.canvas.width = this.canvas.height * desiredAspectRatio;
    } else {
        // Window is taller than desired aspect, constrain by width
        this.canvas.width = Math.min(targetWidth, 800); // Cap width at 800
        this.canvas.height = this.canvas.width / desiredAspectRatio;
    }

    // Ensure it doesn't get too small if window is tiny
    // These minimums are important for small mobile screens in landscape
    const absoluteMinWidth = 300;
    const absoluteMinHeight = 150;

    if (this.canvas.width < absoluteMinWidth) {
        this.canvas.width = absoluteMinWidth;
        this.canvas.height = this.canvas.width / desiredAspectRatio;
    }
    if (this.canvas.height < absoluteMinHeight) {
        this.canvas.height = absoluteMinHeight;
        this.canvas.width = this.canvas.height * desiredAspectRatio;
    }

    this.groundY = this.canvas.height - 40; // Ground is relative to canvas height
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

  // --- NEW: Manages visibility of main game UI and Character Select / Game Over screens ---
  updateUIVisibility() {
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      
      const gameElements = [
          this.canvas.parentElement, // .game-container
          this.scoreDisplay.parentElement, // #ui-container
          document.getElementById('jumpButton'),
          document.getElementById('duckButton'),
          this.debuggerDisplay
      ];

      // Hide all game elements by default (they are shown in landscape CSS)
      // We explicitly hide them here based on game state
      gameElements.forEach(el => {
        if(el) el.style.display = 'none';
      });
      this.gameOverScreen.style.display = 'none';
      this.characterSelectScreen.style.display = 'none';
      
      if (isLandscape) {
          if (this.currentGameState === 'playing') {
              gameElements.forEach(el => {
                // Ensure correct display type (flex for containers, block for score/debugger/canvas itself)
                if (el.id === 'ui-container' || el.id === 'debuggerDisplay' || el.classList.contains('action-button') || el.classList.contains('game-container')) {
                    if(el) el.style.display = 'flex';
                } else if (el) { // Canvas element parent and score itself are not flex by default
                    el.style.display = 'block';
                }
              });
              this.scoreDisplay.style.display = 'block'; // Explicitly set score display to block
          } else if (this.currentGameState === 'gameOver') {
              this.gameOverScreen.style.display = 'block';
              // Keep canvas visible in game over to see final state
              if(this.canvas.parentElement) this.canvas.parentElement.style.display = 'flex';
              if(this.canvas) this.canvas.style.display = 'block';
              if(this.debuggerDisplay) this.debuggerDisplay.style.display = 'flex'; // Keep debugger visible
          } else if (this.currentGameState === 'characterSelect') {
              this.characterSelectScreen.style.display = 'flex';
          }
      }
      // Orientation warning CSS handles portrait display automatically
  }


  // --- NEW: Renders/updates the character selection screen ---
  renderCharacterSelectScreen() {
      const characterGrid = this.characterSelectScreen.querySelector('.character-grid');
      characterGrid.innerHTML = ''; // Clear previous slots

      this.characters.forEach(char => {
          const slot = document.createElement('div');
          slot.classList.add('character-slot');
          
          let imgSource = char.image; // Use char.image if you have actual images
          // For now, let's just make it a colored square/circle if no image path exists
          const charImageHtml = `<div style="width:60px; height:60px; border-radius:50%; background-color:${char.available ? 'var(--revolutionary-red)' : '#888'}; border: 2px solid var(--syrian-white); margin-bottom: 8px;"></div>`;
          
          slot.innerHTML = `${charImageHtml}<p>${char.name}</p>`;

          if (char.available) {
              slot.classList.add('available');
              slot.addEventListener('click', () => {
                  this.selectedCharacterId = char.id;
                  // Add visual feedback for selection if desired (e.g., add 'selected' class)
                  this.updateDebugger(`Selected character: ${char.name}`);
                  // Highlight selected character
                  characterGrid.querySelectorAll('.character-slot').forEach(s => s.classList.remove('selected'));
                  slot.classList.add('selected');
              });
          } else {
              slot.classList.add('grayed-out');
          }
          characterGrid.appendChild(slot);
      });

      const startGameBtn = document.getElementById('start-game-btn');
      if (startGameBtn) {
          startGameBtn.onclick = () => this.startGame(); // Bind to startGame
      } else {
          this.updateDebugger("Error: start-game-btn not found!");
          console.error("Error: start-game-btn not found!");
      }

      this.updateUIVisibility(); // Ensure character select screen is visible
  }


  // --- NEW: Starts or restarts the game from character select or game over ---
  startGame() {
    console.log("[startGame DEBUG] Starting new game...");
    this.updateDebugger('Starting new game...');
    this.gameRunning = true; // Set game to running
    this.score = 0; this.speed = 3; this.distance = 0;
    this.lastScoredDistance = 0; // Reset for new game
    this.nextThemeToggleScore = 500; // Reset theme toggle score for new game
    this.player.y = this.groundY - this.player.height;
    this.player.velY = 0; this.player.grounded = true; this.player.isDucking = false;
    this.player.jumping = false; this.jumpRequested = false;
    this.obstacles = []; this.setNextSpawnDistance();
    this.updateScoreDisplay();
    
    this.currentGameState = 'playing'; // Set game state to playing
    this.updateUIVisibility(); // Adjust UI to show game elements

    this.updateDebugger('Game started. Good luck!');
    console.log("[startGame DEBUG] Game started. gameRunning is:", this.gameRunning);

    // Ensure the game loop is running. This is crucial if it was paused.
    this.gameLoop(); // Call gameLoop once to trigger a new requestAnimationFrame
    console.log("[startGame DEBUG] gameLoop() explicitly called from startGame().");
  }


  bindEvents() {
    console.log("[bindEvents DEBUG] Starting bindEvents.");
    try {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); if (this.currentGameState === 'playing') this.jumpRequested = true; }
            else if (e.key === 'ArrowDown') { e.preventDefault(); if (this.currentGameState === 'playing') { this.player.isDucking = true; if (!this.player.grounded) { this.player.velY += 5; } } }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); if (this.currentGameState === 'playing') this.player.isDucking = false; }
        });

        const jumpButton = document.getElementById('jumpButton');
        console.log("[bindEvents DEBUG] jumpButton:", jumpButton);
        if (jumpButton) {
            jumpButton.addEventListener('click', () => { if (this.currentGameState === 'playing' && !this.player.isDucking) this.jumpRequested = true; });
            jumpButton.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.currentGameState === 'playing' && !this.player.isDucking) this.jumpRequested = true; });
        } else {
            throw new Error("jumpButton not found!");
        }

        const duckButton = document.getElementById('duckButton');
        console.log("[bindEvents DEBUG] duckButton:", duckButton);
        if (duckButton) {
            duckButton.addEventListener('mousedown', (e) => { e.preventDefault(); if (this.currentGameState === 'playing' && !this.player.isDucking) { this.player.isDucking = true; if (!this.player.grounded) { this.player.velY += 5; } } });
            duckButton.addEventListener('mouseup', (e) => { e.preventDefault(); this.player.isDucking = false; });
            duckButton.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.currentGameState === 'playing' && !this.player.isDucking) { this.player.isDucking = true; if (!this.player.grounded) { this.player.velY += 5; } } });
            duckButton.addEventListener('touchend', (e) => { e.preventDefault(); this.player.isDucking = false; });
        } else {
            throw new Error("duckButton not found!");
        }

        const restartBtn = document.getElementById('restartBtn');
        console.log("[bindEvents DEBUG] restartBtn:", restartBtn);
        if (restartBtn) {
            // "Play Again" button now calls startGame
            restartBtn.addEventListener('click', () => this.startGame()); 
        } else {
            throw new Error("restartBtn not found!");
        }

        // --- NEW: Add event listener for screen orientation changes ---
        window.addEventListener('orientationchange', () => this.updateUIVisibility());
        window.addEventListener('resize', () => {
            this.setupCanvas(); // Recalculate canvas size on resize
            this.updateUIVisibility(); // Adjust UI visibility (esp. for orientation changes)
        });

        this.updateDebugger('All core events bound successfully.');
        console.log("[bindEvents DEBUG] bindEvents finished successfully.");
    } catch (e) {
        console.error("Error binding events (caught by bindEvents):", e);
        this.updateDebugger(`ERROR binding events: ${e.message}. Game might not respond to input.`);
        this.gameRunning = false;
        this.updateUIVisibility(); // Ensure UI reflects error state
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
      this.scoreDisplay.textContent = 'نقاط: ' + Math.floor(this.score) + ' ليرة سوري'; // Score and currency
  }

  update() {
    console.log("[update DEBUG] update() invoked. gameRunning:", this.gameRunning); // This is key!
    this.updateDebugger(
        `Game Running: ${this.gameRunning} | Score: ${Math.floor(this.score)} | Speed: ${this.speed.toFixed(2)}\n` +
        `Player Y: ${Math.floor(this.player.y)} | Obstacles: ${this.obstacles.length}\n` +
        `Mode: ${this.isNightMode ? 'Night' : 'Day'}`
    );

    if (!this.gameRunning || this.currentGameState !== 'playing') { // Only update if game is running AND state is 'playing'
        console.log("[update DEBUG] update() returning because game is not running or state is not playing.");
        return; 
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

        // --- CHANGE: Day/Night toggle every 500 points ---
        if (this.score >= this.nextThemeToggleScore) {
             this.toggleDayNight();
             this.nextThemeToggleScore += 500; // Increment by 500
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
            else if (obs.type === 'low_missile') obs.y = this.groundY - 65; // Corrected missile positioning
            else obs.y = this.groundY - obs.h; // This handles cactus, rock, spiky_bush (ground obstacles)
            
            // --- NEW: Detailed Obstacle Y Debugging ---
            console.log(`[Obstacle Y DEBUG] Type: ${obs.type}, GroundY: ${this.groundY}, Obs.h: ${obs.h}, Calculated Y: ${obs.y}`);
            // --- END NEW DEBUG ---

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
        this.updateUIVisibility(); // Adjust UI visibility on error
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
    console.log("[draw DEBUG] draw() invoked.");
    // Only draw if game is in a state where visual updates are expected
    if (this.currentGameState !== 'playing' && this.currentGameState !== 'gameOver') {
        return; 
    }
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
    try {
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
    this.gameRunning = false;
    this.finalScoreDisplay.textContent = Math.floor(this.score);
    if (this.score > this.bestScore) {
        this.bestScore = Math.floor(this.score);
        localStorage.setItem('tarboushBestScore', this.bestScore);
    }
    this.updateBestScoreDisplay();
    
    this.currentGameState = 'gameOver'; // Set game state to game over
    this.updateUIVisibility(); // Adjust UI to show game over screen

    this.updateDebugger(`Game Over. Final Score: ${Math.floor(this.score)}. Tap 'Play Again'`);
    console.log("[gameOver DEBUG] Game Over called. gameRunning set to false.");
  }

  // --- NEW: Replaced restart() with startGame() for unified flow ---
  // startGame() now handles initial game start and restarts after game over.
  // It's called when 'ابدأ اللعب' or 'العب مرة أخرى' is pressed.
  startGame() {
    console.log("[startGame DEBUG] Starting new game...");
    this.updateDebugger('Starting new game...');
    this.gameRunning = true; // Set game to running
    this.score = 0; this.speed = 3; this.distance = 0;
    this.lastScoredDistance = 0;
    this.nextThemeToggleScore = 500; // Reset theme toggle score for new game
    this.player.y = this.groundY - this.player.height;
    this.player.velY = 0; this.player.grounded = true; this.player.isDucking = false;
    this.player.jumping = false; this.jumpRequested = false;
    this.obstacles = []; this.setNextSpawnDistance();
    this.updateScoreDisplay();
    
    this.currentGameState = 'playing'; // Set game state to playing
    this.updateUIVisibility(); // Adjust UI to show game elements

    this.updateDebugger('Game started. Good luck!');
    console.log("[startGame DEBUG] Game started. gameRunning is:", this.gameRunning);

    // Ensure the game loop is running. This is crucial if it was paused.
    this.gameLoop(); // Call gameLoop once to trigger a new requestAnimationFrame
    console.log("[startGame DEBUG] gameLoop() explicitly called from startGame().");
  }

  updateBestScoreDisplay() { this.bestScoreDisplay.textContent = this.bestScore; }

  gameLoop() {
    console.log("[gameLoop DEBUG] gameLoop invoked. gameRunning:", this.gameRunning, " | currentGameState:", this.currentGameState);

    if (!this.gameRunning || this.currentGameState !== 'playing') { // Only run if game is running AND state is 'playing'
        console.log("[gameLoop DEBUG] gameLoop returning because gameRunning is false OR state is not playing.");
        // If currentGameState is 'characterSelect' or 'gameOver', the loop will continue to request frames
        // but it will immediately return from update()/draw() until currentGameState is 'playing'.
        requestAnimationFrame(() => this.gameLoop()); // Keep loop alive even when paused
        return; 
    }

    try {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    } catch (e) {
        console.error("Error in gameLoop (caught by gameLoop):", e);
        this.updateDebugger(`CRITICAL ERROR in gameLoop: ${e.message}. Loop stopped.`);
        this.gameRunning = false;
        this.updateUIVisibility(); // Adjust UI visibility on error
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
