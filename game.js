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
        // --- 1. Basic property initialization ---
        this.gameRunning = false; // Game starts as not running, waiting for character select
        this.score = 0;
        this.bestScore = localStorage.getItem('tarboushBestScore') || 0;
        this.speed = 3;
        this.distance = 0;
        this.lastScoredDistance = 0;
        this.nextThemeToggleScore = 500; // Day/Night toggle every 500 points

        this.player = {
            x: 100, y: 0, width: 40, height: 60,
            velY: 0, jumping: false, grounded: true, isDucking: false,
            runHitbox: { x_offset: 5, y_offset: 5, width: 30, height: 55 },
            duckHitbox: { x_offset: 5, y_offset: 25, width: 30, height: 35 }
        };

        this.isNightMode = false;
        this.themeColors = {
          day: {
            ground: '#A0522D', cloud: 'rgba(255,255,255,0.8)', playerTarboush: '#CE1126',
            playerBody: '#FFFFFF', playerSkin: '#FDBCB4', playerDetail: '#000000',
            obstacleGreen: '#007A3D', obstacleBlack: '#000000', obstacleGrey: '#696969',
            obstacleMissileFlame: '#FF4500',
          },
          night: {
            ground: '#5A2C10', cloud: 'rgba(200,200,200,0.2)', playerTarboush: '#990B1E',
            playerBody: '#BBBBBB', playerSkin: '#A17B74', playerDetail: '#EEEEEE',
            obstacleGreen: '#004D27', obstacleBlack: '#AAAAAA', obstacleGrey: '#333333',
            obstacleMissileFlame: '#E68A00',
          }
        };

        this.characters = [
            { id: 'shami_abu_tarboush', name: 'شامي أبو طربوش', available: true, image: 'https://via.placeholder.com/60/CE1126/FFFFFF?text=ش' },
            { id: 'fatom_hays_bays', name: 'فطوم حيص بيص', available: false, image: 'https://via.placeholder.com/60/007A3D/FFFFFF?text=ف' },
            { id: 'zulfiqar', name: 'زولفيقار', available: false, image: 'https://via.placeholder.com/60/36454F/FFFFFF?text=ز' },
            { id: 'bakri_abu_halab', name: 'بكري أبو حلب', available: false, image: 'https://via.placeholder.com/60/A0522D/FFFFFF?text=ب' },
            { id: 'warni_warni', name: 'ورني ورني', available: false, image: 'https://via.placeholder.com/60/000000/FFFFFF?text=و' }
        ];
        this.selectedCharacterId = 'shami_abu_tarboush'; // Default selected character

        // --- 2. Get Canvas and Context ---
        this.canvas = document.getElementById('gameCanvas');
        console.log("[Constructor DEBUG] Canvas element:", this.canvas);
        if (!this.canvas) throw new Error("Canvas element #gameCanvas not found!");
        this.ctx = this.canvas.getContext('2d');
        console.log("[Constructor DEBUG] Canvas context:", this.ctx);
        if (!this.ctx) throw new Error("Failed to get 2D rendering context for canvas.");

        // --- 3. Get all relevant UI element references ---
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
        if (!this.uiContainer) throw new Error("UI container element not found!");
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

        // --- 4. Game state dependent setup (uses elements gathered above) ---
        this.setupCanvas(); // Sets canvas dimensions and groundY
        this.obstacles = [];
        this.distanceToNextSpawn = 0;
        this.obstaclePatterns = [
            { type: 'single_cactus', minSpeed: 0 }, { type: 'single_rock', minSpeed: 0 },
            { type: 'spiky_bush', minSpeed: 3 }, { type: 'high_bird', minSpeed: 4 },
            { type: 'double_rock', minSpeed: 5 }, { type: 'swooping_bird', minSpeed: 6 },
            { type: 'low_missile', minSpeed: 7 }
        ];
        this.clouds = this.createClouds();

        // --- 5. Bind events (now all elements are available) ---
        this.bindEvents(); // Sets up event listeners

        // --- 6. Initial UI state and rendering ---
        this.updateBestScoreDisplay();
        this.setNextSpawnDistance(); // Sets distance for first obstacle spawn
        this.currentGameState = 'characterSelect'; // Game starts in character select state
        this.updateUIVisibility(); // Adjusts UI based on initial state
        this.renderCharacterSelectScreen(); // Populates character select UI

        console.log("[Constructor DEBUG] Game init success. currentGameState:", this.currentGameState);
        this.updateDebugger(`Game init success. State: ${this.currentGameState}`);

        // --- 7. Start the main game loop (it will pause/unpause based on currentGameState) ---
        this.gameLoop(); 
        console.log("[Constructor DEBUG] gameLoop() called. Constructor finishing.");

    } catch (e) {
        console.error("Error during Game initialization (caught by constructor):", e);
        this.updateDebugger(`CRITICAL ERROR during Game init: ${e.message}. Game stopped.`);
        this.gameRunning = false;
        this.updateUIVisibility(); // Ensure UI reflects error state
    }
    console.log("[Constructor DEBUG] Constructor finished. Final gameRunning state:", this.gameRunning);
  }

  // --- CHANGE: Canvas Setup for Larger Size and Landscape Aspect Ratio ---
  setupCanvas() {
    const desiredAspectRatio = 2; // 2:1 width to height for a wider landscape view
    const minHorizontalPadding = 40; // Minimum padding on left/right
    const minVerticalPadding = 40; // Minimum padding on top/bottom

    // Attempt to fill available screen space while respecting aspect ratio and max limits
    let targetWidth = window.innerWidth - minHorizontalPadding;
    let targetHeight = window.innerHeight - minVerticalPadding;

    // --- Adjusting base dimensions for a larger feel ---
    const baseCanvasHeight = 350; // Increased base height from 300 to 350
    const baseCanvasWidth = baseCanvasHeight * desiredAspectRatio; // 700 for 2:1 aspect

    // Scale down if window is too small, or cap at max desirable size
    let scaleFactor = 1;
    if (targetWidth < baseCanvasWidth) {
        scaleFactor = targetWidth / baseCanvasWidth;
    }
    if (targetHeight < baseCanvasHeight) {
        scaleFactor = Math.min(scaleFactor, targetHeight / baseCanvasHeight);
    }
    // Cap at a max scale (e.g., if desktop is very large)
    scaleFactor = Math.min(scaleFactor, 800 / baseCanvasWidth); // Don't let it get larger than 800px width

    this.canvas.width = baseCanvasWidth * scaleFactor;
    this.canvas.height = baseCanvasHeight * scaleFactor;

    // Ensure it doesn't get ridiculously small (minimum playable size)
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

  // --- REFINED: Manages visibility of main game UI and Character Select / Game Over screens ---
  updateUIVisibility() {
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      
      // --- Step 1: Hide all main UI containers and screens (using collected elements) ---
      // These elements were collected in constructor
      this.gameContainer.style.display = 'none';
      this.uiContainer.style.display = 'none';
      this.jumpButton.style.display = 'none';
      this.duckButton.style.display = 'none';
      this.debuggerDisplay.style.display = 'none';
      this.characterSelectScreen.style.display = 'none';
      this.gameOverScreen.style.display = 'none';
      this.orientationWarning.style.display = 'none';


      // --- Step 2: Show elements based on Orientation and currentGameState ---
      if (isLandscape) {
          // In landscape, we show game or character select or game over
          if (this.currentGameState === 'playing') {
              this.gameContainer.style.display = 'flex'; // Game canvas container
              this.uiContainer.style.display = 'flex';   // UI (score, etc.)
              this.scoreDisplay.style.display = 'block'; // Score is a child of uiContainer
              this.jumpButton.style.display = 'flex';    // Action buttons
              this.duckButton.style.display = 'flex';
              this.debuggerDisplay.style.display = 'flex'; // Debugger
              // Game over screen and char select screen remain hidden
          } else if (this.currentGameState === 'gameOver') {
              this.gameContainer.style.display = 'flex'; // Still show background canvas
              this.uiContainer.style.display = 'flex';   // To show score below debugger
              this.scoreDisplay.style.display = 'block';
              this.gameOverScreen.style.display = 'flex'; // Game Over dialog itself is now flex to center content
              this.debuggerDisplay.style.display = 'flex'; // Keep debugger visible
              // Action buttons and char select remain hidden
          } else if (this.currentGameState === 'characterSelect') {
              this.characterSelectScreen.style.display = 'flex'; // Show character select
              this.debuggerDisplay.style.display = 'flex'; // Keep debugger visible
          }
      } else { // Portrait mode
          this.orientationWarning.style.display = 'flex'; // Only show orientation warning
          // All other game elements remain hidden by initial 'display: none'
      }
  }


  // --- NEW: Renders/updates the character selection screen ---
  renderCharacterSelectScreen() {
      const characterGrid = this.characterSelectScreen.querySelector('.character-grid');
      if (!characterGrid) {
          console.error("Character grid element not found!");
          this.updateDebugger("Error: Character grid not found.");
          return;
      }
      characterGrid.innerHTML = ''; // Clear previous slots

      this.characters.forEach(char => {
          const slot = document.createElement('div');
          slot.classList.add('character-slot');
          slot.setAttribute('data-char-id', char.id); // Store ID for selection

          const charImageHtml = `<img src="${char.image}" alt="${char.name}" loading="lazy">`;
          
          slot.innerHTML = `${charImageHtml}<p>${char.name}</p>`;

          if (char.available) {
              slot.classList.add('available');
              // Highlight initial selected character
              if (char.id === this.selectedCharacterId) {
                  slot.classList.add('selected');
              }
              slot.addEventListener('click', () => {
                  this.selectedCharacterId = char.id;
                  this.updateDebugger(`Selected: ${char.name}`);
                  // Update visual selection
                  characterGrid.querySelectorAll('.character-slot').forEach(s => s.classList.remove('selected'));
                  slot.classList.add('selected');
                  // --- FIX: Character click now starts the game directly ---
                  this.startGame(); 
              });
          } else {
              slot.classList.add('grayed-out');
          }
          characterGrid.appendChild(slot);
      });

      // --- FIX: Start game button is no longer strictly necessary if character click starts game, but keep it as alternative ---
      if (this.startGameBtn) {
          // Ensure it's not double-bound if character click already starts the game
          this.startGameBtn.onclick = null; // Clear previous handler
          this.startGameBtn.onclick = () => {
              if (this.currentGameState === 'characterSelect') { // Only allow click if still on select screen
                  this.startGame();
              }
          }; 
      } else {
          this.updateDebugger("Error: start-game-btn not found!");
          console.error("Error: start-game-btn not found!");
      }

      this.updateUIVisibility(); // Ensure character select screen is visible
  }


  // --- NEW: Starts or restarts the game from character select or game over ---
  // It's called when a character is selected OR 'Play Again' is pressed.
  startGame() {
    console.log("[startGame DEBUG] Starting new game...");
    this.updateDebugger('Starting new game...');
    this.gameRunning = true; // Set game to running
    this.score = 0; this.speed = 3;
    this.distance = 0;
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

// --- NEW: Konami Code Debugger Toggle ---
// Keyboard sequence: Up, Up, Down, Down, Left, Right, Left, Right, B, A
const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];
let konamiCodePosition = 0;

document.addEventListener('keydown', (e) => {
    // Check if the current key matches the next key in the Konami Code sequence
    if (e.code === konamiCode[konamiCodePosition]) {
        konamiCodePosition++;
        // If the entire sequence is matched
        if (konamiCodePosition === konamiCode.length) {
            konamiCodePosition = 0; // Reset for next time
            const debuggerDisplay = document.getElementById('debuggerDisplay');
            if (debuggerDisplay) {
                // Toggle debugger visibility
                debuggerDisplay.style.display = debuggerDisplay.style.display === 'flex' ? 'none' : 'flex';
                // Optionally, log to console
                console.log("Konami Code activated! Debugger toggled.");
            }
        }
    } else {
        konamiCodePosition = 0; // Reset if the sequence is broken
    }
});


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
