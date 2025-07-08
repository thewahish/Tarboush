class Game {
    constructor() {
        // --- Debugger Setup - INITIALIZE FIRST ---
        this.debuggerDisplay = document.getElementById('debuggerDisplay');
        if (!this.debuggerDisplay) {
            console.error("CRITICAL: Debugger display element #debuggerDisplay not found!");
            // If debugger isn't found, we can't update it, but game might continue.
        }
        this.updateDebugger("Initializing Game Class...");

        // Add a global error handler to catch any uncaught errors
        window.onerror = (message, source, lineno, colno, error) => {
            const errorMsg = `Global Error: ${message} (Line: ${lineno})`;
            this.updateDebugger(errorMsg);
            console.error("Global JavaScript Error:", errorMsg, error);
            this.gameRunning = false; // Halt the game if a critical global error occurs
            this.currentGameState = 'error'; // Set a specific state for error
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
                x: 100, y: 0, width: 40, height: 60, // player width/height for basic drawing
                velY: 0, jumping: false, grounded: true, isDucking: false,
                runHitbox: { x_offset: 5, y_offset: 5, width: 30, height: 55 }, // Relative to player.x, player.y
                duckHitbox: { x_offset: 5, y_offset: 25, width: 30, height: 35 } // Relative to player.x, player.y
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
            this.scoreDisplay = document.getElementById('score'); // The div containing the current score span
            this.currentScoreDisplay = document.getElementById('currentScore'); // Specific span for current score
            if (!this.currentScoreDisplay) throw new Error("currentScoreDisplay element not found!");
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
            this.distanceToNextSpawn = 0; // Distance to wait before spawning the next obstacle
            this.obstacleSpawnMin = 500; // Minimum distance for next obstacle
            this.obstacleSpawnMax = 1500; // Maximum distance for next obstacle
            
            // Define obstacle types with their dimensions and a simple drawing method
            this.obstacleDefinitions = [
                { type: 'single_cactus', minSpeed: 0, width: 20, height: 40, hitbox: {x_offset: 0, y_offset: 0, width: 20, height: 40}, draw: this._drawCactus.bind(this) },
                { type: 'single_rock', minSpeed: 0, width: 30, height: 20, hitbox: {x_offset: 0, y_offset: 0, width: 30, height: 20}, draw: this._drawRock.bind(this) },
                { type: 'spiky_bush', minSpeed: 3, width: 40, height: 25, hitbox: {x_offset: 5, y_offset: 5, width: 30, height: 15}, draw: this._drawSpikyBush.bind(this) },
                { type: 'high_bird', minSpeed: 4, width: 50, height: 30, yOffset: 60, hitbox: {x_offset: 0, y_offset: 0, width: 50, height: 30}, draw: this._drawBird.bind(this) }, // yOffset from ground
                { type: 'double_rock', minSpeed: 5, width: 60, height: 20, hitbox: {x_offset: 0, y_offset: 0, width: 60, height: 20}, draw: this._drawRock.bind(this) }, // Can adjust draw for double
                { type: 'swooping_bird', minSpeed: 6, width: 50, height: 30, yOffset: 20, hitbox: {x_offset: 0, y_offset: 0, width: 50, height: 30}, draw: this._drawBird.bind(this) }, // yOffset from ground
                { type: 'low_missile', minSpeed: 7, width: 70, height: 20, yOffset: 10, hitbox: {x_offset: 0, y_offset: 0, width: 70, height: 20}, draw: this._drawMissile.bind(this) } // yOffset from ground
            ];
            // Filter patterns based on speed to ensure they appear gradually
            this.obstaclePatterns = this.obstacleDefinitions.filter(obs => obs.minSpeed <= this.speed);

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
            this.currentGameState = 'error';
            this.updateUIVisibility(); // Ensure UI reflects error state
        }
        console.log("[Constructor DEBUG] Constructor finished. Final gameRunning state:", this.gameRunning);
    }

    // --- Canvas Setup ---
    setupCanvas() {
        const desiredAspectRatio = 2; // 2:1 width to height for a wider landscape view
        const minHorizontalPadding = 40; // Minimum padding on left/right
        const minVerticalPadding = 40; // Minimum padding on top/bottom

        let targetWidth = window.innerWidth - minHorizontalPadding;
        let targetHeight = window.innerHeight - minVerticalPadding;

        const baseCanvasHeight = 350; // Increased base height
        const baseCanvasWidth = baseCanvasHeight * desiredAspectRatio; // 700 for 2:1 aspect

        let scaleFactor = 1;
        // Scale down if window is too small or cap at max desirable size
        if (targetWidth < baseCanvasWidth) {
            scaleFactor = targetWidth / baseCanvasWidth;
        }
        if (targetHeight < baseCanvasHeight) {
            scaleFactor = Math.min(scaleFactor, targetHeight / baseCanvasHeight);
        }
        scaleFactor = Math.min(scaleFactor, 800 / baseCanvasWidth); // Cap at max 800px width for desktop

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

    // --- Cloud Management ---
    createClouds() {
        const clouds = [];
        for (let i = 0; i < 3; i++) {
            clouds.push({ x: Math.random() * this.canvas.width, y: 50 + Math.random() * (this.groundY / 3), w: 80 + Math.random() * 40, h: 40 + Math.random() * 20, speed: 0.5 + Math.random() * 0.3 });
        }
        return clouds;
    }

    // --- Theme Management ---
    _getColor(colorName) {
        const mode = this.isNightMode ? 'night' : 'day';
        return this.themeColors[mode][colorName];
    }

    toggleDayNight() {
        this.isNightMode = !this.isNightMode;
        document.body.classList.toggle('night-mode', this.isNightMode);
        this.updateScoreDisplay(); // Score display color might change
        this.draw(); // Redraw immediately to reflect theme changes
    }

    // --- Debugger ---
    updateDebugger(message) {
        if (this.debuggerDisplay) {
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
            this.debuggerDisplay.textContent = `[${timestamp}] ${message}`;
        } else {
            console.log(`[Debugger FB - No UI]: ${message}`);
        }
    }

    // --- UI Visibility Management ---
    updateUIVisibility() {
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;

        // Hide all main UI containers and screens initially
        document.querySelectorAll('.game-screen').forEach(el => el.style.display = 'none');
        this.uiContainer.style.display = 'none'; // Separate from .game-screen
        this.jumpButton.style.display = 'none';
        this.duckButton.style.display = 'none';
        this.debuggerDisplay.style.display = 'none'; // Debugger hidden by default (will be shown if appropriate state/orientation)

        // Show elements based on Orientation and currentGameState
        if (isLandscape) {
            if (this.currentGameState === 'playing') {
                this.gameContainer.style.display = 'flex';
                this.uiContainer.style.display = 'flex';
                this.scoreDisplay.style.display = 'block'; // Ensure score is block/flex if parent is flex
                this.jumpButton.style.display = 'flex';
                this.duckButton.style.display = 'flex';
                this.debuggerDisplay.style.display = 'flex'; // Show debugger in game
            } else if (this.currentGameState === 'gameOver') {
                this.gameContainer.style.display = 'flex'; // Keep canvas visible as background
                this.uiContainer.style.display = 'flex'; // Score display may still be visible below debugger
                this.scoreDisplay.style.display = 'block';
                this.gameOverScreen.style.display = 'flex';
                this.debuggerDisplay.style.display = 'flex'; // Show debugger on game over
            } else if (this.currentGameState === 'characterSelect') {
                this.characterSelectScreen.style.display = 'flex';
                this.debuggerDisplay.style.display = 'flex'; // Show debugger on character select
            } else if (this.currentGameState === 'error') {
                this.debuggerDisplay.style.display = 'flex'; // Keep debugger visible if there's an error
                // You might also want to display a simplified error message on screen
            }
        } else { // Portrait mode
            this.orientationWarning.style.display = 'flex';
            this.debuggerDisplay.style.display = 'flex'; // Keep debugger visible even in portrait to show warnings
        }
    }

    // --- Character Selection ---
    renderCharacterSelectScreen() {
        const characterGrid = this.characterSelectScreen.querySelector('.character-grid');
        if (!characterGrid) {
            console.error("Character grid element not found for rendering!");
            this.updateDebugger("Error: Character grid not found for rendering.");
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
                if (char.id === this.selectedCharacterId) {
                    slot.classList.add('selected');
                }
                slot.addEventListener('click', () => {
                    this.selectedCharacterId = char.id;
                    this.updateDebugger(`Selected: ${char.name}`);
                    // Visually update selection
                    characterGrid.querySelectorAll('.character-slot').forEach(s => s.classList.remove('selected'));
                    slot.classList.add('selected');
                    // No direct game start on character click for now, user clicks "Start Game" button
                });
            } else {
                slot.classList.add('grayed-out');
            }
            characterGrid.appendChild(slot);
        });

        // The start game button now explicitly starts the game after selection
        if (this.startGameBtn) {
            // Remove previous listener to prevent double-binding
            this.startGameBtn.removeEventListener('click', this.startGameHandler); // Ensure handler is reference
            this.startGameHandler = () => { // Create a new handler to bind correctly
                if (this.currentGameState === 'characterSelect') {
                    this.startGame();
                }
            };
            this.startGameBtn.addEventListener('click', this.startGameHandler);
        } else {
            this.updateDebugger("Error: start-game-btn not found!");
            console.error("Error: start-game-btn not found!");
        }

        this.updateUIVisibility(); // Ensure character select screen is visible
    }

    // --- Game Start/Restart ---
    startGame() {
        console.log("[startGame DEBUG] Starting new game...");
        this.updateDebugger('Starting new game...');
        this.gameRunning = true;
        this.score = 0;
        this.speed = 3;
        this.distance = 0;
        this.lastScoredDistance = 0;
        this.nextThemeToggleScore = 500; // Reset theme toggle score for new game
        this.player.y = this.groundY - this.player.height;
        this.player.velY = 0;
        this.player.grounded = true;
        this.player.isDucking = false;
        this.player.jumping = false;
        this.jumpRequested = false; // To handle jump input reliably
        this.obstacles = []; // Clear all previous obstacles
        this.setNextSpawnDistance();
        this.updateScoreDisplay();

        this.currentGameState = 'playing'; // Set game state to playing
        this.updateUIVisibility(); // Adjust UI to show game elements

        this.updateDebugger('Game started. Good luck!');
        console.log("[startGame DEBUG] Game started. gameRunning is:", this.gameRunning);

        this.gameLoop(); // Ensure the game loop is active
        console.log("[startGame DEBUG] gameLoop() explicitly called from startGame().");
    }

    // --- Score Management ---
    updateBestScoreDisplay() {
        if (this.bestScoreDisplay) {
            this.bestScoreDisplay.textContent = this.bestScore;
        }
    }

    updateScoreDisplay() {
        if (this.currentScoreDisplay) {
            this.currentScoreDisplay.textContent = this.score;
        }
        // Update best score if current score surpasses it
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('tarboushBestScore', this.bestScore);
            this.updateBestScoreDisplay(); // Update the best score display immediately
        }
    }

    // --- Obstacle Logic ---
    setNextSpawnDistance() {
        // Random distance between min/max
        this.distanceToNextSpawn = this.canvas.width + Math.random() * (this.obstacleSpawnMax - this.obstacleSpawnMin) + this.obstacleSpawnMin;
        this.updateDebugger(`Next spawn in: ${Math.round(this.distanceToNextSpawn)}`);
    }

    spawnObstacle() {
        // Filter obstacles based on current speed
        const availableObstacles = this.obstacleDefinitions.filter(obs => obs.minSpeed <= this.speed);
        if (availableObstacles.length === 0) {
            console.warn("No obstacles available at current speed!", this.speed);
            this.updateDebugger("No obstacles for speed!");
            return;
        }
        const obstacleDef = availableObstacles[Math.floor(Math.random() * availableObstacles.length)];

        let obstacleY = this.groundY - obstacleDef.height;
        if (obstacleDef.yOffset !== undefined) {
            obstacleY = this.groundY - obstacleDef.yOffset - obstacleDef.height;
        }

        const newObstacle = {
            x: this.canvas.width,
            y: obstacleY,
            width: obstacleDef.width,
            height: obstacleDef.height,
            type: obstacleDef.type,
            draw: obstacleDef.draw,
            hitbox: { // Use the hitbox defined in obstacleDefinition
                x_offset: obstacleDef.hitbox.x_offset,
                y_offset: obstacleDef.hitbox.y_offset,
                width: obstacleDef.hitbox.width,
                height: obstacleDef.hitbox.height
            }
        };
        this.obstacles.push(newObstacle);
        this.setNextSpawnDistance();
        this.updateDebugger(`Spawned: ${newObstacle.type}`);
    }

    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.speed;

            // Check for collision
            if (this.checkCollision(this.player, obs)) {
                this.gameOver();
                return; // Stop updating obstacles if game is over
            }

            // Remove obstacle if off screen
            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }

        // Spawn new obstacle if needed (check if last obstacle is far enough or no obstacles exist)
        if (this.obstacles.length === 0 || (this.canvas.width - this.obstacles[this.obstacles.length - 1].x) >= this.distanceToNextSpawn) {
            this.spawnObstacle();
        }
    }

    // --- Collision Detection ---
    checkCollision(player, obstacle) {
        // Get player's current hitbox based on state
        const p_hitbox = player.isDucking ? player.duckHitbox : player.runHitbox;

        const p_x = player.x + p_hitbox.x_offset;
        const p_y = player.y + p_hitbox.y_offset;
        const p_w = p_hitbox.width;
        const p_h = p_hitbox.height;

        const o_x = obstacle.x + obstacle.hitbox.x_offset;
        const o_y = obstacle.y + obstacle.hitbox.y_offset;
        const o_w = obstacle.hitbox.width;
        const o_h = obstacle.hitbox.height;

        // AABB collision detection
        return p_x < o_x + o_w &&
               p_x + p_w > o_x &&
               p_y < o_y + o_h &&
               p_y + p_h > o_y;
    }

    // --- Game Over ---
    gameOver() {
        this.gameRunning = false;
        this.currentGameState = 'gameOver';
        this.updateDebugger(`Game Over! Score: ${this.score}`);
        this.updateScoreDisplay(); // Update final score and best score
        this.updateUIVisibility();
        console.log("[Game Over] Game Ended.");
    }

    // --- Game Loop ---
    gameLoop() {
        if (!this.gameRunning || (this.currentGameState !== 'playing' && this.currentGameState !== 'error')) {
            // Keep requesting frames even when paused to re-evaluate game state
            // If currentGameState is 'characterSelect' or 'gameOver', the loop will continue to request frames
            // but update()/draw() won't execute until state is 'playing'.
            requestAnimationFrame(() => this.gameLoop());
            return;
        }
        // Only call update/draw if playing
        if (this.currentGameState === 'playing') {
            try {
                this.update();
                this.draw();
            } catch (e) {
                console.error("Error in gameLoop (caught by gameLoop):", e);
                this.updateDebugger(`CRITICAL ERROR in gameLoop: ${e.message}. Loop stopped.`);
                this.gameRunning = false;
                this.currentGameState = 'error';
                this.updateUIVisibility();
                return; // Stop requesting further frames on critical error
            }
        }
        requestAnimationFrame(() => this.gameLoop()); // Request next frame for next cycle
    }

    // --- Update Game State ---
    update() {
        // Player vertical movement (jumping/gravity)
        if (this.player.jumping) {
            this.player.velY += 0.5; // Gravity
            this.player.y += this.player.velY;

            // Check if player lands on ground
            if (this.player.y >= this.groundY - this.player.height) {
                this.player.y = this.groundY - this.player.height;
                this.player.jumping = false;
                this.player.grounded = true;
                this.player.velY = 0;
            }
        }
        // Handle jump request if not already jumping and on ground
        if (this.jumpRequested && this.player.grounded) {
            this.player.velY = -10; // Jump strength (adjust as needed)
            this.player.jumping = true;
            this.player.grounded = false;
            this.jumpRequested = false; // Reset flag
            this.player.isDucking = false; // Player can't duck while jumping
        }

        // Ensure player cannot duck while in air
        if (!this.player.grounded && this.player.isDucking) {
             this.player.isDucking = false; // Force stop ducking if player leaves ground
        }


        // Move clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.w < 0) {
                cloud.x = this.canvas.width + Math.random() * 50; // Loop cloud, add some randomness
            }
        });

        // Update obstacles
        this.updateObstacles();

        // Update score based on distance
        this.distance += this.speed;
        if (this.distance - this.lastScoredDistance >= 10) { // Score every 10 units of distance moved
            this.score++;
            this.lastScoredDistance = this.distance;
            this.updateScoreDisplay();

            // Theme toggle logic
            if (this.score >= this.nextThemeToggleScore) {
                this.toggleDayNight();
                this.nextThemeToggleScore += 500; // Next toggle in another 500 points
                this.updateDebugger(`Toggling theme! Next: ${this.nextThemeToggleScore}`);
            }
        }

        // Speed increase over time (adjust rate as needed for difficulty)
        this.speed += 0.0005;
        // Update available obstacle patterns as speed increases
        this.obstaclePatterns = this.obstacleDefinitions.filter(obs => obs.minSpeed <= this.speed);
    }

    // --- Drawing Functions ---
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear canvas

        // Draw sky/background (CSS var is applied to body/canvas container, use for canvas fill)
        const canvasBgColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg-color').trim();
        this.ctx.fillStyle = canvasBgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ground
        this.ctx.fillStyle = this._getColor('ground');
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

        // Draw clouds
        this.clouds.forEach(cloud => {
            this.ctx.fillStyle = this._getColor('cloud');
            this.ctx.fillRect(cloud.x, cloud.y, cloud.w, cloud.h); // Simple cloud drawing
            // Could add more complex cloud shapes here
        });

        // Draw obstacles
        this.obstacles.forEach(obs => {
            obs.draw(this.ctx, obs, this._getColor); // Pass context, obstacle, and color getter
        });

        // Draw player
        this._drawPlayer();

        // Optional: Draw hitboxes for debugging (uncomment to activate)
        // this._drawHitboxes();
    }

    // --- Specific Drawing Methods for Player and Obstacles ---
    _drawPlayer() {
        const p = this.player;
        const currentColors = this.isNightMode ? this.themeColors.night : this.themeColors.day;

        this.ctx.save(); // Save current canvas state

        // Main body (adjusted for ducking)
        let bodyY = p.y;
        let bodyHeight = p.height;
        if (p.isDucking) {
            bodyY = p.y + p.height / 2;
            bodyHeight = p.height / 2;
        }
        this.ctx.fillStyle = currentColors.playerBody;
        this.ctx.fillRect(p.x, bodyY, p.width, bodyHeight);

        // Tarboush (hat) - adjust position based on ducking
        this.ctx.fillStyle = currentColors.playerTarboush;
        const tarboushTopY = p.isDucking ? p.y + p.height / 2 - p.height * 0.2 : p.y - p.height * 0.2;
        const tarboushHeight = p.height * 0.2; // Base height of tarboush rectangle part
        const tarboushPeakHeight = p.height * 0.15; // Height of the peak part
        const tarboushPeakWidth = p.width * 0.2; // Width of the peak part

        this.ctx.beginPath();
        this.ctx.moveTo(p.x + p.width * 0.2, tarboushTopY + tarboushHeight); // Bottom-left corner
        this.ctx.lineTo(p.x + p.width * 0.8, tarboushTopY + tarboushHeight); // Bottom-right corner
        this.ctx.lineTo(p.x + p.width * 0.9, tarboushTopY); // Top-right (slant)
        this.ctx.lineTo(p.x + p.width * 0.1, tarboushTopY); // Top-left (slant)
        this.ctx.closePath();
        this.ctx.fill();

        // Top cap of the tarboush (rectangle on top of the slanted part)
        this.ctx.fillRect(p.x + p.width * 0.4, tarboushTopY - tarboushPeakHeight, tarboushPeakWidth, tarboushPeakHeight);


        // Player face/skin - adjust position based on ducking
        const faceY = p.isDucking ? p.y + p.height / 2 + p.height * 0.05 : p.y + p.height * 0.15;
        const faceHeight = p.isDucking ? p.height * 0.2 : p.height * 0.4;
        this.ctx.fillStyle = currentColors.playerSkin;
        this.ctx.fillRect(p.x + p.width * 0.15, faceY, p.width * 0.7, faceHeight);

        // Eyes (simple dots) - adjust position based on ducking
        const eyeY = p.isDucking ? p.y + p.height / 2 + p.height * 0.1 : p.y + p.height * 0.25;
        this.ctx.fillStyle = currentColors.playerDetail;
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width * 0.35, eyeY, 2, 0, Math.PI * 2);
        this.ctx.arc(p.x + p.width * 0.65, eyeY, 2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore(); // Restore canvas state
    }

    _drawCactus(ctx, obs, getColor) {
        ctx.fillStyle = getColor('obstacleGreen');
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height); // Main body
        ctx.fillRect(obs.x + obs.width * 0.7, obs.y + obs.height * 0.2, obs.width * 0.3, obs.height * 0.3); // Arm 1
        ctx.fillRect(obs.x, obs.y + obs.height * 0.4, obs.width * 0.3, obs.height * 0.3); // Arm 2
    }

    _drawRock(ctx, obs, getColor) {
        ctx.fillStyle = getColor('obstacleGrey');
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width * 0.2, obs.y + obs.height * 0.5);
        ctx.lineTo(obs.x + obs.width * 0.5, obs.y);
        ctx.lineTo(obs.x + obs.width * 0.8, obs.y + obs.height * 0.3);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
    }

    _drawSpikyBush(ctx, obs, getColor) {
        ctx.fillStyle = getColor('obstacleGreen');
        ctx.beginPath();
        ctx.arc(obs.x + obs.width * 0.2, obs.y + obs.height * 0.8, obs.width * 0.2, 0, Math.PI * 2);
        ctx.arc(obs.x + obs.width * 0.5, obs.y + obs.height * 0.5, obs.width * 0.3, 0, Math.PI * 2);
        ctx.arc(obs.x + obs.width * 0.8, obs.y + obs.height * 0.8, obs.width * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Spikes (simple triangles)
        ctx.fillStyle = getColor('obstacleBlack');
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.width * 0.5, obs.y + obs.height * 0.5);
        ctx.lineTo(obs.x + obs.width * 0.5 - 5, obs.y + obs.height * 0.5 - 10);
        ctx.lineTo(obs.x + obs.width * 0.5 + 5, obs.y + obs.height * 0.5 - 10);
        ctx.fill();
    }

    _drawBird(ctx, obs, getColor) {
        ctx.fillStyle = getColor('obstacleBlack');
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings (simple triangles)
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height / 2);
        ctx.lineTo(obs.x + obs.width / 4, obs.y);
        ctx.lineTo(obs.x + obs.width / 4, obs.y + obs.height);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(obs.x + obs.width, obs.y + obs.height / 2);
        ctx.lineTo(obs.x + obs.width * 3 / 4, obs.y);
        ctx.lineTo(obs.x + obs.width * 3 / 4, obs.y + obs.height);
        ctx.fill();
    }

    _drawMissile(ctx, obs, getColor) {
        ctx.fillStyle = getColor('obstacleGrey');
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height); // Missile body

        // Nose cone
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.width, obs.y);
        ctx.lineTo(obs.x + obs.width + 10, obs.y + obs.height / 2);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();

        // Flame (simple triangle)
        ctx.fillStyle = getColor('obstacleMissileFlame');
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height / 2);
        ctx.lineTo(obs.x - 15, obs.y + obs.height / 4);
        ctx.lineTo(obs.x - 15, obs.y + obs.height * 3 / 4);
        ctx.closePath();
        ctx.fill();
    }


    // --- Debugging Helper: Draw Hitboxes ---
    _drawHitboxes() {
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;

        // Player Hitbox
        const p = this.player;
        const currentHitbox = p.isDucking ? p.duckHitbox : p.runHitbox;
        this.ctx.strokeRect(p.x + currentHitbox.x_offset, p.y + currentHitbox.y_offset, currentHitbox.width, currentHitbox.height);

        // Obstacle Hitboxes
        this.obstacles.forEach(obs => {
            const o_hitbox = obs.hitbox;
            this.ctx.strokeRect(obs.x + o_hitbox.x_offset, obs.y + o_hitbox.y_offset, o_hitbox.width, o_hitbox.height);
        });
    }

    // --- Event Binding ---
    bindEvents() {
        // Jump Button (Touch)
        this.jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior (e.g., scrolling, double-tap zoom)
            if (this.currentGameState === 'playing' && this.player.grounded) {
                this.jumpRequested = true; // Set flag for jump in next update cycle
                this.player.isDucking = false; // Stop ducking if jumping
            }
        }, { passive: false }); // Use passive: false to allow preventDefault

        // Duck Button (Touch - Press and Hold)
        this.duckButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.currentGameState === 'playing' && this.player.grounded) {
                this.player.isDucking = true;
                this.duckButton.classList.add('active'); // Add visual feedback for active duck button
            }
        }, { passive: false });

        this.duckButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.currentGameState === 'playing' && this.player.isDucking) {
                this.player.isDucking = false;
                this.duckButton.classList.remove('active'); // Remove visual feedback
            }
        });

        // Keyboard Controls (for desktop/testing)
        document.addEventListener('keydown', (e) => {
            if (this.currentGameState === 'playing') {
                if (e.code === 'Space' && this.player.grounded) {
                    if (!this.player.jumping) { // Prevent multiple jump requests while airborne
                        this.jumpRequested = true;
                    }
                    this.player.isDucking = false;
                } else if (e.code === 'ArrowDown' && this.player.grounded) {
                    this.player.isDucking = true;
                }
            }
            // Allow Konami code to work regardless of game state
            konamiCodeCheck(e.code);
        });

        document.addEventListener('keyup', (e) => {
            if (this.currentGameState === 'playing') {
                if (e.code === 'ArrowDown' && this.player.isDucking) {
                    this.player.isDucking = false;
                }
            }
        });

        // Restart Button
        this.restartBtn.addEventListener('click', () => {
            if (this.currentGameState === 'gameOver') {
                this.startGame();
            }
        });

        // Window Resize and Orientation Change
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.updateUIVisibility();
        });
        window.addEventListener('orientationchange', () => {
            this.setupCanvas();
            this.updateUIVisibility();
        });
    }
}

// --- Konami Code Debugger Toggle ---
const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];
let konamiCodePosition = 0;

function konamiCodeCheck(keyCode) {
    if (keyCode === konamiCode[konamiCodePosition]) {
        konamiCodePosition++;
        if (konamiCodePosition === konamiCode.length) {
            konamiCodePosition = 0; // Reset for next time
            const debuggerDisplay = document.getElementById('debuggerDisplay');
            if (debuggerDisplay) {
                debuggerDisplay.style.display = debuggerDisplay.style.display === 'flex' ? 'none' : 'flex';
                console.log("Konami Code activated! Debugger toggled.");
            }
        }
    } else {
        konamiCodePosition = 0; // Reset if the sequence is broken
    }
}

// Wrap the game initialization in a window.addEventListener('load')
window.addEventListener('load', () => {
    console.log("[Load DEBUG] Window loaded. Initializing Game.");
    try {
        new Game();
    } catch (e) {
        const debuggerElem = document.getElementById('debuggerDisplay');
        if (debuggerElem) {
            debuggerElem.textContent = `FATAL Error on load: ${e.message}. Check console.`;
            debuggerElem.style.display = 'flex'; // Ensure debugger is visible on fatal error
        }
        console.error("Fatal error during game initialization on load:", e);
    }
});
