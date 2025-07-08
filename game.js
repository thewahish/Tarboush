class Game {
    constructor() {
        this.gameRunning = false;
        this.score = 0;
        this.bestScore = localStorage.getItem('tarboushBestScore') || 0;
        this.speed = 4;
        this.distance = 0;
        this.lastScoredDistance = 0;
        this.nextThemeToggleScore = 500;

        // Enhanced player with animation states
        this.player = {
            x: 120, y: 0, width: 50, height: 70,
            velY: 0, jumping: false, grounded: true, isDucking: false,
            animFrame: 0, animSpeed: 0.2, // animFrame controls walk cycle, animSpeed how fast
            runHitbox: { x_offset: 8, y_offset: 8, width: 34, height: 62 },
            duckHitbox: { x_offset: 8, y_offset: 35, width: 34, height: 35 }
        };

        this.isNightMode = false;
        this.particles = []; // For explosion effects
        
        // Official Syrian Identity Color Themes
        this.themeColors = {
            day: {
                ground: '#b9a779', groundShadow: '#988561',
                cloud: 'rgba(237, 235, 224, 0.9)', 
                playerTarboush: '#054239', // Forest secondary
                playerBody: '#edebe0', playerSkin: '#b9a779', playerDetail: '#3d3a3b',
                playerMustache: '#988561',
                obstacleGreen: '#42B177', obstacleBlack: '#3d3a3b', obstacleGrey: '#988561',
                obstacleMissileFlame: '#b9a779', // Golden Wheat Secondary
                sky: '#42B177', // Forest primary
                coin: '#b9a779' // Golden Wheat Secondary
            },
            night: {
                ground: '#6B2F2A', groundShadow: '#4A1F1E',
                cloud: 'rgba(237, 235, 224, 0.4)',
                playerTarboush: '#002623', // Forest dark
                playerBody: '#edebe0', playerSkin: '#b9a779', playerDetail: '#edebe0',
                playerMustache: '#988561',
                obstacleGreen: '#054239', obstacleBlack: '#3d3a3b', obstacleGrey: '#6B2F2A',
                obstacleMissileFlame: '#988561', // Golden Wheat Dark
                sky: '#054239', // Forest secondary
                coin: '#988561' // Golden Wheat Dark
            }
        };

        // Character definitions with SVG data URLs
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

        // Initialize all core components
        this.init();
    }

    init() {
        // --- 1. Get Canvas and Context ---
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) throw new Error("Canvas element #gameCanvas not found!");
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) throw new Error("Failed to get 2D rendering context for canvas.");

        // --- 2. Setup Canvas Dimensions (responsive landscape) ---
        this.setupCanvas();

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
        this.loaderScreen = document.getElementById('loader'); // Get loader screen
        if (!this.loaderScreen) throw new Error("loaderScreen element not found!");

        // --- 4. Bind events (now all elements are available) ---
        this.bindEvents();
        
        // --- 5. Initial game state setup and rendering ---
        this.obstacles = [];
        this.clouds = this.createClouds();
        this.setNextSpawnDistance(); // Sets distance for first obstacle spawn
        this.updateBestScoreDisplay();
        
        this.currentGameState = 'loading'; // Start with loading state
        this.updateUIVisibility(); // Adjusts UI based on initial state
        
        // Hide loader after animation
        const loaderCharacter = this.loaderScreen.querySelector('.character-enter');
        if(loaderCharacter) {
            loaderCharacter.addEventListener('animationend', () => {
                this.loaderScreen.style.opacity = 0; // Fade out loader
                setTimeout(() => {
                    this.loaderScreen.style.display = 'none'; // Hide after fade
                    this.currentGameState = 'characterSelect'; // Transition to character select
                    this.updateUIVisibility(); // Show character select screen
                    this.renderCharacterSelectScreen(); // Render characters
                }, 500); // Wait for fade out
            });
        } else {
            // Fallback if animation element not found or animation doesn't play
            this.currentGameState = 'characterSelect';
            this.updateUIVisibility();
            this.renderCharacterSelectScreen();
        }

        this.gameLoop(); // Start the main loop (it will pause/unpause based on currentGameState)
    }

    setupCanvas() {
        const desiredAspectRatio = 2.2; // Optimized for a wider landscape
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

        this.canvas.width = Math.max(targetWidth, 400); // Minimum sensible width
        this.canvas.height = Math.max(targetHeight, 200); // Minimum sensible height
        
        this.groundY = this.canvas.height - 60; // Adjusted ground height from 40 to 60 for larger character
        this.player.y = this.groundY - this.player.height;
    }

    setupUI() { /* This method now just serves as a placeholder */ }

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
        return color || this.themeColors.day.sky; // Fallback to day sky color if color not found
    }

    toggleDayNight() {
        this.isNightMode = !this.isNightMode;
        document.body.classList.toggle('night-mode', this.isNightMode);
        this.updateScoreDisplay();
    }

    updateDebugger(message) {
        if (this.debuggerDisplay) {
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
            this.debuggerDisplay.textContent = `[${timestamp}] ${message}`;
        }
    }

    updateUIVisibility() {
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        
        // Hide all main UI containers and screens first
        this.gameContainer.style.display = 'none';
        this.uiContainer.style.display = 'none';
        this.jumpButton.style.display = 'none';
        this.duckButton.style.display = 'none';
        this.debuggerDisplay.style.display = 'none';
        this.characterSelectScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.orientationWarning.style.display = 'none';
        this.loaderScreen.style.display = 'none'; // Ensure loader is hidden by default here

        // Show elements based on current game state and orientation
        if (this.currentGameState === 'loading') {
            this.loaderScreen.style.display = 'flex';
        } else if (!isLandscape) { // Not loading, and in Portrait mode
            this.orientationWarning.style.display = 'flex';
        } else { // In Landscape mode
            if (this.currentGameState === 'playing') {
                this.gameContainer.style.display = 'flex';
                this.uiContainer.style.display = 'flex';
                this.scoreDisplay.style.display = 'block';
                this.jumpButton.style.display = 'flex';
                this.duckButton.style.display = 'flex';
                this.debuggerDisplay.style.display = 'flex';
            } else if (this.currentGameState === 'gameOver') {
                this.gameContainer.style.display = 'flex';
                this.uiContainer.style.display = 'flex';
                this.scoreDisplay.style.display = 'block';
                this.gameOverScreen.style.display = 'flex';
                this.debuggerDisplay.style.display = 'flex';
            } else if (this.currentGameState === 'characterSelect') {
                this.characterSelectScreen.style.display = 'flex';
                this.debuggerDisplay.style.display = 'flex';
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
                slot.addEventListener('click', () => {
                    this.selectedCharacterId = char.id;
                    characterGrid.querySelectorAll('.character-slot').forEach(s => s.classList.remove('selected'));
                    slot.classList.add('selected');
                    this.startGame();
                });
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
        this.speed = 4;
        this.distance = 0;
        this.lastScoredDistance = 0;
        this.nextThemeToggleScore = 500;
        this.player.y = this.groundY - this.player.height;
        this.player.velY = 0;
        this.player.grounded = true;
        this.player.isDucking = false;
        this.player.jumping = false;
        this.jumpRequested = false;
        this.obstacles = [];
        this.particles = []; // Clear particles on new game
        this.clouds = this.createClouds(); // Recreate clouds for fresh positions
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
            this.scoreDisplay.textContent = `نقاط: ${this.score} ليرة سوري`;
        }
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('tarboushBestScore', this.bestScore);
            this.updateBestScoreDisplay();
        }
    }

    setNextSpawnDistance() {
        this.distanceToNextSpawn = this.canvas.width / 2 + Math.random() * this.canvas.width / 4; // Shorter distance for initial spawning
    }

    spawnObstacle() {
        const availablePatterns = [
            { type: 'cactus', width: 25, height: 50, yOffset: 0 },
            { type: 'rock', width: 35, height: 25, yOffset: 0 },
            { type: 'bird', width: 40, height: 25, yOffset: 60 },
            { type: 'missile', width: 60, height: 20, yOffset: 30 }
        ];

        const obstacleData = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
        const obstacle = {
            x: this.canvas.width + 10, // Spawn slightly off-screen
            y: this.groundY - obstacleData.height - obstacleData.yOffset,
            width: obstacleData.width,
            height: obstacleData.height,
            type: obstacleData.type,
            hitbox: {
                x_offset: 2,
                y_offset: 2,
                width: obstacleData.width - 4,
                height: obstacleData.height - 4
            },
            scored: false
        };

        this.obstacles.push(obstacle);
    }

    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.speed;

            // Scoring
            if (!obs.scored && obs.x + obs.width < this.player.x) {
                this.score += 10;
                obs.scored = true;
                this.updateScoreDisplay();
            }

            if (this.checkCollision(this.player, obs)) {
                this.createExplosionParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
                this.gameOver();
                return; // Stop game loop update after game over
            }

            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }

        // Spawn next obstacle only if enough distance passed or no obstacles
        if (this.obstacles.length === 0 || 
            (this.canvas.width - (this.obstacles.length > 0 ? this.obstacles[this.obstacles.length - 1].x : this.canvas.width)) >= this.distanceToNextSpawn) {
            this.spawnObstacle();
            this.setNextSpawnDistance(); // Recalculate next spawn distance
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

        return p_x < o_x + o_w &&
               p_x + p_w > o_x &&
               p_y < o_y + o_h &&
               p_y + p_h > o_y;
    }

    createExplosionParticles(x, y) {
        for (let i = 0; i < 15; i++) { // More particles
            this.particles.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 10, // Stronger initial velocity
                vy: (Math.random() - 0.5) * 10 - 5, // Upward bias
                life: 60, // Longer life
                color: ['#FF4500', '#FFD700', '#FF6347', '#b9a779', '#edebe0'][Math.floor(Math.random() * 5)], // More colors
                size: 2 + Math.random() * 3 // Varied size
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.4; // gravity increased for faster fall
            particle.life--;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    gameOver() {
        this.gameRunning = false;
        this.currentGameState = 'gameOver';
        this.updateScoreDisplay();
        if (this.finalScoreDisplay) {
            this.finalScoreDisplay.textContent = this.score;
        }
        this.updateBestScoreDisplay();
        this.updateUIVisibility(); // Show game over screen
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
        this.player.animFrame += this.player.animSpeed;
        if (this.player.animFrame >= 4) this.player.animFrame = 0;

        // Player physics
        if (this.player.jumping) {
            this.player.velY += 0.6; // gravity
            this.player.y += this.player.velY;

            if (this.player.y >= this.groundY - this.player.height) {
                this.player.y = this.groundY - this.player.height;
                this.player.jumping = false;
                this.player.grounded = true;
                this.player.velY = 0;
                this.player.animFrame = 0; // Reset animation frame on landing
            }
        }

        if (this.jumpRequested && this.player.grounded) {
            this.player.velY = -12;
            this.player.jumping = true;
            this.player.grounded = false;
            this.jumpRequested = false;
            this.player.isDucking = false;
            this.player.animFrame = 0; // Reset animation frame on jump
        }

        if (!this.player.grounded && this.player.isDucking) {
            // Player can't duck in air, so stop ducking state
            this.player.isDucking = false;
            // Optionally add a slight downward boost if trying to duck in air for faster descent
            // this.player.velY += 5;
        }

        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.w < 0) {
                cloud.x = this.canvas.width + Math.random() * 100; // Reposition off-screen right
                cloud.y = 30 + Math.random() * (this.groundY / 3); // New random height
            }
        });

        // Update obstacles and particles
        this.updateObstacles();
        this.updateParticles();

        // Update score
        this.distance += this.speed;
        if (this.distance - this.lastScoredDistance >= 15) { // Score every 15 distance units for 1 point
            this.score++;
            this.lastScoredDistance = this.distance;
            this.updateScoreDisplay();

            if (this.score >= this.nextThemeToggleScore) {
                this.toggleDayNight();
                this.nextThemeToggleScore += 500; // Next toggle at +500 points
            }
        }

        // Increase speed gradually
        this.speed += 0.0005; // Slower speed increase for more balanced game
    }

    draw() {
        // Draw sky/background (solid color)
        this.ctx.fillStyle = this._getColor('sky');
        this.ctx.fillRect(0, 0, this.canvas.width, this.groundY);

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
            this.ctx.globalAlpha = particle.life / 60; // Life is 60 now
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); // Use particle.size
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

        // Player is 50x70, groundY - 60. Duck hitbox y_offset 35. Height 35.
        // runHitbox y_offset 8, height 62.

        // Adjust Y for ducking to align base
        let effectivePlayerY = p.y;
        if (p.isDucking) {
            effectivePlayerY = p.y + (p.height - p.duckHitbox.height); // Adjust Y so bottom aligns
        }

        // Running animation for horizontal movement
        const animOffset = p.grounded && !p.jumping && !p.isDucking ? Math.sin(p.animFrame * 0.8) * 2 : 0; // Slower bob

        // Body (thobe)
        this.ctx.fillStyle = colors.playerBody;
        this.ctx.fillRect(p.x + 5, effectivePlayerY + 20, p.width - 10, p.height - 20 - (p.isDucking ? 10 : 0)); // Shorten body when ducking

        // Head/face
        this.ctx.fillStyle = colors.playerSkin;
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width / 2, effectivePlayerY + 15, 12, 0, Math.PI * 2);
        this.ctx.fill();

        // Tarboush
        this.ctx.fillStyle = colors.playerTarboush;
        this.ctx.fillRect(p.x + p.width / 2 - 10, effectivePlayerY - 5, 20, 15); // Base
        this.ctx.beginPath(); // Top cone
        this.ctx.moveTo(p.x + p.width / 2 - 8, effectivePlayerY - 5);
        this.ctx.lineTo(p.x + p.width / 2 + 8, effectivePlayerY - 5);
        this.ctx.lineTo(p.x + p.width / 2 + 6, effectivePlayerY - 15);
        this.ctx.lineTo(p.x + p.width / 2 - 6, effectivePlayerY - 15);
        this.ctx.closePath();
        this.ctx.fill();
        // Tassel
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width / 2 + 8, effectivePlayerY - 10, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Eyes
        this.ctx.fillStyle = colors.playerDetail;
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width / 2 - 4, effectivePlayerY + 12, 1.5, 0, Math.PI * 2);
        this.ctx.arc(p.x + p.width / 2 + 4, effectivePlayerY + 12, 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Mustache
        this.ctx.fillStyle = colors.playerMustache;
        this.ctx.fillRect(p.x + p.width / 2 - 6, effectivePlayerY + 18, 12, 3);

        // Arms
        this.ctx.fillStyle = colors.playerSkin;
        if (!p.isDucking) {
            // Running arms (swinging)
            this.ctx.fillRect(p.x + 2 + animOffset, effectivePlayerY + 25 + Math.abs(animOffset), 8, 15); // Left arm
            this.ctx.fillRect(p.x + p.width - 10 - animOffset, effectivePlayerY + 25 + Math.abs(animOffset), 8, 15); // Right arm
        } else {
            // Ducking arms
            this.ctx.fillRect(p.x + 5, effectivePlayerY + 25, 10, 8);
            this.ctx.fillRect(p.x + p.width - 15, effectivePlayerY + 25, 10, 8);
        }

        // Legs (simple for now, can be improved with animFrame)
        this.ctx.fillStyle = colors.playerDetail;
        if (p.grounded && !p.isDucking) {
             const legAnimOffset = Math.sin(p.animFrame * 1.5) * 4; // More pronounced leg movement
             this.ctx.fillRect(p.x + p.width / 2 - 8, effectivePlayerY + bodyHeight + 5 + legAnimOffset, 6, 15 - legAnimOffset);
             this.ctx.fillRect(p.x + p.width / 2 + 2, effectivePlayerY + bodyHeight + 5 - legAnimOffset, 6, 15 + legAnimOffset);
        } else if (p.isDucking) {
            // Ducking legs (squashed)
            this.ctx.fillRect(p.x + p.width / 2 - 8, effectivePlayerY + bodyHeight + 5, 6, 8);
            this.ctx.fillRect(p.x + p.width / 2 + 2, effectivePlayerY + bodyHeight + 5, 6, 8);
        } else {
            // Jumping legs (slightly bent)
            this.ctx.fillRect(p.x + p.width / 2 - 8, p.y + p.height - 10, 6, 15);
            this.ctx.fillRect(p.x + p.width / 2 + 2, p.y + p.height - 10, 6, 15);
        }

        this.ctx.restore();
    }

    drawObstacle(obs) {
        this.ctx.save();
        
        switch (obs.type) {
            case 'cactus':
                this.ctx.fillStyle = this._getColor('obstacleGreen');
                this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                // Cactus arms
                this.ctx.fillRect(obs.x - 8, obs.y + 15, 12, 20);
                this.ctx.fillRect(obs.x + obs.width - 4, obs.y + 10, 12, 15);
                break;
                
            case 'rock':
                this.ctx.fillStyle = this._getColor('obstacleGrey');
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x, obs.y + obs.height);
                this.ctx.lineTo(obs.x + obs.width * 0.3, obs.y);
                this.ctx.lineTo(obs.x + obs.width * 0.7, obs.y + obs.height * 0.2);
                this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'bird':
                this.ctx.fillStyle = this._getColor('obstacleBlack');
                // Bird body
                this.ctx.beginPath();
                this.ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, 
                               obs.width / 3, obs.height / 3, 0, 0, Math.PI * 2);
                this.ctx.fill();
                // Wings (simple flapping animation)
                const wingFlap = Math.sin(this.player.animFrame * 2) * 8; // Use player animFrame for sync
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x, obs.y + obs.height / 2);
                this.ctx.lineTo(obs.x + obs.width / 2, obs.y + wingFlap);
                this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height / 2);
                this.ctx.fill();
                break;
                
            case 'missile':
                // Missile body
                this.ctx.fillStyle = this._getColor('obstacleGrey');
                this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                
                // Nose cone
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x + obs.width, obs.y);
                this.ctx.lineTo(obs.x + obs.width + 15, obs.y + obs.height / 2);
                this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Flame trail
                this.ctx.fillStyle = this._getColor('obstacleMissileFlame');
                const flameLength = 20 + Math.sin(Date.now() * 0.02) * 5;
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x, obs.y + obs.height / 2);
                this.ctx.lineTo(obs.x - flameLength, obs.y + obs.height / 4);
                this.ctx.lineTo(obs.x - flameLength * 0.7, obs.y + obs.height / 2);
                this.ctx.lineTo(obs.x - flameLength, obs.y + obs.height * 3 / 4);
                this.ctx.closePath();
                this.ctx.fill();
                break;
        }
        
        this.ctx.restore();
    }

    bindEvents() {
        // Jump button event listeners
        if (this.jumpButton) {
            const jumpHandler = (e) => {
                e.preventDefault();
                if (this.currentGameState === 'playing' && this.player.grounded) {
                    this.player.velY = -12;
                    this.player.jumping = true;
                    this.player.grounded = false;
                    this.jumpRequested = false; // Clear jump request
                    this.player.isDucking = false; // Stop ducking on jump
                    this.player.animFrame = 0; // Reset animation frame for jump
                }
            };
            this.jumpButton.addEventListener('touchstart', jumpHandler, { passive: false });
            this.jumpButton.addEventListener('click', jumpHandler); // For desktop/fallback
        }

        // Duck button event listeners
        if (this.duckButton) {
            const duckStartHandler = (e) => {
                e.preventDefault();
                if (this.currentGameState === 'playing' && this.player.grounded) {
                    this.player.isDucking = true;
                    this.duckButton.style.background = this._getColor('golden-wheat-dark'); // Visual feedback
                }
            };
            const duckEndHandler = (e) => {
                e.preventDefault();
                if (this.currentGameState === 'playing') {
                    this.player.isDucking = false;
                    this.duckButton.style.background = this._getColor('ui-button-bg'); // Reset color
                }
            };
            this.duckButton.addEventListener('touchstart', duckStartHandler, { passive: false });
            this.duckButton.addEventListener('mousedown', duckStartHandler); // Desktop
            this.duckButton.addEventListener('touchend', duckEndHandler);
            this.duckButton.addEventListener('mouseup', duckEndHandler); // Desktop
            this.duckButton.addEventListener('mouseleave', duckEndHandler); // Desktop
        }

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (this.currentGameState === 'playing') {
                if ((e.code === 'Space' || e.code === 'ArrowUp') && this.player.grounded) {
                    this.player.velY = -12;
                    this.player.jumping = true;
                    this.player.grounded = false;
                    this.jumpRequested = false;
                    this.player.isDucking = false;
                    this.player.animFrame = 0;
                    e.preventDefault();
                } else if (e.code === 'ArrowDown' && this.player.grounded) {
                    this.player.isDucking = true;
                    e.preventDefault();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowDown') {
                this.player.isDucking = false;
            }
        });

        // Restart button (on Game Over screen)
        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.currentGameState === 'gameOver') {
                    this.startGame();
                }
            });
        }

        // Window events for responsiveness
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.updateUIVisibility();
        });

        window.addEventListener('orientationchange', () => {
            // Add a small delay for orientation change to complete and window dimensions to update
            setTimeout(() => {
                this.setupCanvas();
                this.updateUIVisibility();
            }, 100); // 100ms delay
        });
    }

    updateBestScoreDisplay() {
        if (this.bestScoreDisplay) { // Check if element exists
            this.bestScoreDisplay.textContent = this.bestScore;
        }
    }

    updateScoreDisplay() {
        if (this.scoreDisplay) { // Check if element exists
            this.scoreDisplay.textContent = `نقاط: ${this.score} ليرة سوري`;
        }
        if (this.score > this.bestScore) { // Update best score logic
            this.bestScore = this.score;
            localStorage.setItem('tarboushBestScore', this.bestScore);
            this.updateBestScoreDisplay();
        }
    }

    setNextSpawnDistance() {
        this.distanceToNextSpawn = this.canvas.width / 2 + Math.random() * this.canvas.width / 4; // Spawn distance relative to canvas width
    }

    spawnObstacle() {
        const obstacleTypes = [
            { type: 'cactus', width: 25, height: 50, yOffset: 0 },
            { type: 'rock', width: 35, height: 25, yOffset: 0 },
            { type: 'bird', width: 40, height: 25, yOffset: 60 },
            { type: 'missile', width: 60, height: 20, yOffset: 30 }
        ];

        const obstacleData = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const obstacle = {
            x: this.canvas.width + 10, // Spawn slightly off-screen right
            y: this.groundY - obstacleData.height - obstacleData.yOffset,
            width: obstacleData.width,
            height: obstacleData.height,
            type: obstacleData.type,
            hitbox: {
                x_offset: 2,
                y_offset: 2,
                width: obstacleData.width - 4,
                height: obstacleData.height - 4
            },
            scored: false
        };
        this.obstacles.push(obstacle);
    }

    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.speed;

            // Scoring for passing obstacle
            if (!obs.scored && obs.x + obs.width < this.player.x) {
                this.score += 10;
                obs.scored = true;
                this.updateScoreDisplay();
            }

            // Collision detection
            if (this.checkCollision(this.player, obs)) {
                this.createExplosionParticles(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
                this.gameOver();
                return; // Exit loop immediately after game over
            }

            // Remove off-screen obstacles
            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }

        // Spawn next obstacle if needed
        if (this.obstacles.length === 0 || 
            (this.canvas.width - (this.obstacles.length > 0 ? this.obstacles[this.obstacles.length - 1].x : this.canvas.width)) >= this.distanceToNextSpawn) {
            this.spawnObstacle();
            this.setNextSpawnDistance(); // Recalculate distance for next spawn
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

        return p_x < o_x + o_w &&
               p_x + p_w > o_x &&
               p_y < o_y + o_h &&
               p_y + p_h > o_y;
    }

    createExplosionParticles(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 5,
                life: 60,
                color: ['#FF4500', '#FFD700', '#FF6347', this._getColor('golden-wheat-secondary'), this._getColor('golden-wheat-primary')][Math.floor(Math.random() * 5)], // Using theme colors
                size: 2 + Math.random() * 3
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.4; // Gravity
            particle.life--;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    gameOver() {
        this.gameRunning = false;
        this.currentGameState = 'gameOver';
        this.updateScoreDisplay(); // Update final score display
        this.updateBestScoreDisplay(); // Update best score display
        this.updateUIVisibility(); // Show game over screen
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
        this.player.animFrame = (this.player.animFrame + this.player.animSpeed) % 4; // Ensure animFrame loops 0-3

        // Player physics
        if (this.player.jumping) {
            this.player.velY += 0.6; // Gravity
            this.player.y += this.player.velY;

            if (this.player.y >= this.groundY - this.player.height) {
                this.player.y = this.groundY - this.player.height;
                this.player.jumping = false;
                this.player.grounded = true;
                this.player.velY = 0;
                this.player.animFrame = 0; // Reset animation frame on landing
            }
        }

        if (this.jumpRequested && this.player.grounded) {
            this.player.velY = -12;
            this.player.jumping = true;
            this.player.grounded = false;
            this.jumpRequested = false;
            this.player.isDucking = false; // Stop ducking on jump
            this.player.animFrame = 0; // Reset animation frame on jump
        }

        if (!this.player.grounded && this.player.isDucking) {
            // Player can't duck in air, so stop ducking state
            this.player.isDucking = false;
        }

        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.w < 0) {
                cloud.x = this.canvas.width + Math.random() * 100; // Reposition off-screen right
                cloud.y = 30 + Math.random() * (this.groundY / 3); // New random height
            }
        });

        // Update obstacles and particles
        this.updateObstacles();
        this.updateParticles();

        // Update score
        this.distance += this.speed;
        if (this.distance - this.lastScoredDistance >= 15) { // Score every 15 distance units for 1 point
            this.score++;
            this.lastScoredDistance = this.distance;
            this.updateScoreDisplay();

            if (this.score >= this.nextThemeToggleScore) {
                this.toggleDayNight();
                this.nextThemeToggleScore += 500; // Next toggle at +500 points
            }
        }

        // Increase speed gradually
        this.speed += 0.0005; // Slower speed increase for more balanced game
    }

    draw() {
        // Draw sky/background (solid color)
        this.ctx.fillStyle = this._getColor('sky');
        this.ctx.fillRect(0, 0, this.canvas.width, this.groundY);

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
            this.ctx.globalAlpha = particle.life / 60; // Life is 60 now
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); // Use particle.size
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

        // Player is 50x70, groundY - 60. Duck hitbox y_offset 35. Height 35.
        // runHitbox y_offset 8, height 62.

        // Adjust Y for ducking to align base
        let effectivePlayerY = p.y;
        if (p.isDucking) {
            effectivePlayerY = p.y + (p.height - p.duckHitbox.height); // Adjust Y so bottom aligns
        }

        // Running animation for horizontal movement
        const animOffset = p.grounded && !p.jumping && !p.isDucking ? 
            Math.sin(p.animFrame * 0.8) * 2 : 0; // Slower bob

        // Body (thobe)
        this.ctx.fillStyle = colors.playerBody;
        this.ctx.fillRect(p.x + 5, effectivePlayerY + 20, p.width - 10, p.height - 20 - (p.isDucking ? 10 : 0)); // Shorten body when ducking

        // Head/face
        this.ctx.fillStyle = colors.playerSkin;
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width / 2, effectivePlayerY + 15, 12, 0, Math.PI * 2);
        this.ctx.fill();

        // Tarboush
        this.ctx.fillStyle = colors.playerTarboush;
        
        // Tarboush base
        this.ctx.fillRect(p.x + p.width / 2 - 10, effectivePlayerY - 5, 20, 15);
        
        // Tarboush top part
        this.ctx.beginPath();
        this.ctx.moveTo(p.x + p.width / 2 - 8, effectivePlayerY - 5);
        this.ctx.lineTo(p.x + p.width / 2 + 8, effectivePlayerY - 5);
        this.ctx.lineTo(p.x + p.width / 2 + 6, effectivePlayerY - 15);
        this.ctx.lineTo(p.x + p.width / 2 - 6, effectivePlayerY - 15);
        this.ctx.closePath();
        this.ctx.fill();

        // Tarboush tassel
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width / 2 + 8, effectivePlayerY - 10, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Eyes
        this.ctx.fillStyle = colors.playerDetail;
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width / 2 - 4, effectivePlayerY + 12, 1.5, 0, Math.PI * 2);
        this.ctx.arc(p.x + p.width / 2 + 4, effectivePlayerY + 12, 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Mustache
        this.ctx.fillStyle = colors.playerMustache;
        this.ctx.fillRect(p.x + p.width / 2 - 6, effectivePlayerY + 18, 12, 3);

        // Arms
        this.ctx.fillStyle = colors.playerSkin;
        if (!p.isDucking) {
            // Running arms (swinging)
            this.ctx.fillRect(p.x + 2 + animOffset, effectivePlayerY + 25 + Math.abs(animOffset), 8, 15); // Left arm
            this.ctx.fillRect(p.x + p.width - 10 - animOffset, effectivePlayerY + 25 + Math.abs(animOffset), 8, 15); // Right arm
        } else {
            // Ducking arms
            this.ctx.fillRect(p.x + 5, effectivePlayerY + 25, 10, 8);
            this.ctx.fillRect(p.x + p.width - 15, effectivePlayerY + 25, 10, 8);
        }

        // Legs (simple for now, can be improved with animFrame)
        this.ctx.fillStyle = colors.playerDetail;
        if (p.grounded && !p.isDucking) {
             const legAnimOffset = Math.sin(p.animFrame * 1.5) * 4; // More pronounced leg movement
             this.ctx.fillRect(p.x + p.width / 2 - 8, effectivePlayerY + bodyHeight + 5 + legAnimOffset, 6, 15 - legAnimOffset);
             this.ctx.fillRect(p.x + p.width / 2 + 2, effectivePlayerY + bodyHeight + 5 - legAnimOffset, 6, 15 + legAnimOffset);
        } else if (p.isDucking) {
            // Ducking legs (squashed)
            this.ctx.fillRect(p.x + p.width / 2 - 8, effectivePlayerY + bodyHeight + 5, 6, 8);
            this.ctx.fillRect(p.x + p.width / 2 + 2, effectivePlayerY + bodyHeight + 5, 6, 8);
        } else {
            // Jumping legs (slightly bent)
            this.ctx.fillRect(p.x + p.width / 2 - 8, p.y + p.height - 10, 6, 15);
            this.ctx.fillRect(p.x + p.width / 2 + 2, p.y + p.height - 10, 6, 15);
        }

        this.ctx.restore();
    }

    drawObstacle(obs) {
        const colors = this.isNightMode ? this.themeColors.night : this.themeColors.day;
        this.ctx.save();
        
        switch (obs.type) {
            case 'cactus':
                this.ctx.fillStyle = colors.obstacleGreen;
                this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                // Cactus arms
                this.ctx.fillRect(obs.x - 8, obs.y + 15, 12, 20);
                this.ctx.fillRect(obs.x + obs.width - 4, obs.y + 10, 12, 15);
                break;
                
            case 'rock':
                this.ctx.fillStyle = colors.obstacleGrey;
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x, obs.y + obs.height);
                this.ctx.lineTo(obs.x + obs.width * 0.3, obs.y);
                this.ctx.lineTo(obs.x + obs.width * 0.7, obs.y + obs.height * 0.2);
                this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                this.ctx.closePath();
                this.ctx.fill();
                break;
                
            case 'bird':
                this.ctx.fillStyle = colors.obstacleBlack;
                // Bird body
                this.ctx.beginPath();
                this.ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, 
                               obs.width / 3, obs.height / 3, 0, 0, Math.PI * 2);
                this.ctx.fill();
                // Wings (simple flapping animation)
                const wingFlap = Math.sin(this.player.animFrame * 2) * 8; // Use player animFrame for sync
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x, obs.y + obs.height / 2);
                this.ctx.lineTo(obs.x + obs.width / 2, obs.y + wingFlap);
                this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height / 2);
                this.ctx.fill();
                break;
                
            case 'missile':
                // Missile body
                this.ctx.fillStyle = colors.obstacleGrey;
                this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                
                // Nose cone
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x + obs.width, obs.y);
                this.ctx.lineTo(obs.x + obs.width + 15, obs.y + obs.height / 2);
                this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Flame trail
                this.ctx.fillStyle = colors.obstacleMissileFlame;
                const flameLength = 20 + Math.sin(Date.now() * 0.02) * 5;
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x, obs.y + obs.height / 2);
                this.ctx.lineTo(obs.x - flameLength, obs.y + obs.height / 4);
                this.ctx.lineTo(obs.x - flameLength * 0.7, obs.y + obs.height / 2);
                this.ctx.lineTo(obs.x - flameLength, obs.y + obs.height * 3 / 4);
                this.ctx.closePath();
                this.ctx.fill();
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
