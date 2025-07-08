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
            animFrame: 0, animSpeed: 0.2,
            runHitbox: { x_offset: 8, y_offset: 8, width: 34, height: 62 },
            duckHitbox: { x_offset: 8, y_offset: 35, width: 34, height: 35 }
        };

        this.isNightMode = false;
        this.particles = [];
        
        // Official Syrian Identity Color Themes
        this.themeColors = {
            day: {
                ground: '#b9a779', groundShadow: '#988561',
                cloud: 'rgba(237, 235, 224, 0.9)', 
                playerTarboush: '#054239', // Forest secondary
                playerBody: '#edebe0', playerSkin: '#b9a779', playerDetail: '#3d3a3b',
                playerMustache: '#988561',
                obstacleGreen: '#42B177', obstacleBlack: '#3d3a3b', obstacleGrey: '#988561',
                obstacleMissileFlame: '#b9a779',
                sky: '#42B177', // Forest primary
                coin: '#b9a779'
            },
            night: {
                ground: '#6B2F2A', groundShadow: '#4A1F1E',
                cloud: 'rgba(237, 235, 224, 0.4)',
                playerTarboush: '#002623', // Forest dark
                playerBody: '#edebe0', playerSkin: '#b9a779', playerDetail: '#edebe0',
                playerMustache: '#988561',
                obstacleGreen: '#054239', obstacleBlack: '#3d3a3b', obstacleGrey: '#6B2F2A',
                obstacleMissileFlame: '#988561',
                sky: '#054239', // Forest secondary
                coin: '#988561'
            }
        };

        this.characters = [
            { 
                id: 'shami_abu_tarboush', 
                name: 'شامي أبو طربوش', 
                available: true, 
                image: 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
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
                    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
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
                    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
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
                    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
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
                    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="60" height="60" fill="#161616" rx="8"/>
                        <text x="30" y="38" font-family="Arial" font-size="20" font-weight="normal" text-anchor="middle" fill="#edebe0">و</text>
                    </svg>
                `)
            }
        ];
        this.selectedCharacterId = 'shami_abu_tarboush';

        this.init();
    }

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupCanvas();
        this.setupUI();
        this.bindEvents();
        
        this.obstacles = [];
        this.clouds = this.createClouds();
        this.setNextSpawnDistance();
        
        this.currentGameState = 'characterSelect';
        this.updateUIVisibility();
        this.renderCharacterSelectScreen();
        this.gameLoop();
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
        
        this.groundY = this.canvas.height - 60;
        this.player.y = this.groundY - this.player.height;
    }

    setupUI() {
        this.scoreDisplay = document.getElementById('score');
        this.finalScoreDisplay = document.getElementById('finalScore');
        this.bestScoreDisplay = document.getElementById('bestScore');
        this.gameOverScreen = document.getElementById('gameOver');
        this.characterSelectScreen = document.getElementById('characterSelectScreen');
        this.gameContainer = document.querySelector('.game-container');
        this.uiContainer = document.getElementById('ui-container');
        this.jumpButton = document.getElementById('jumpButton');
        this.duckButton = document.getElementById('duckButton');
        this.restartBtn = document.getElementById('restartBtn');
        this.startGameBtn = document.getElementById('start-game-btn');
        this.orientationWarning = document.getElementById('orientation-warning');
        
        this.updateBestScoreDisplay();
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
        return color || '#42B177'; // Fallback to forest primary if color not found
    }

    toggleDayNight() {
        this.isNightMode = !this.isNightMode;
        document.body.classList.toggle('night-mode', this.isNightMode);
        this.updateScoreDisplay();
    }

    updateUIVisibility() {
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        
        document.querySelectorAll('.game-screen').forEach(el => el.style.display = 'none');
        this.jumpButton.style.display = 'none';
        this.duckButton.style.display = 'none';

        if (isLandscape) {
            if (this.currentGameState === 'playing') {
                this.gameContainer.style.display = 'flex';
                this.uiContainer.style.display = 'flex';
                this.jumpButton.style.display = 'flex';
                this.duckButton.style.display = 'flex';
            } else if (this.currentGameState === 'gameOver') {
                this.gameContainer.style.display = 'flex';
                this.uiContainer.style.display = 'flex';
                this.gameOverScreen.style.display = 'flex';
            } else if (this.currentGameState === 'characterSelect') {
                this.characterSelectScreen.style.display = 'flex';
            }
        } else {
            this.orientationWarning.style.display = 'flex';
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
                this.ctx.lineTo(obs.x - flameLength, obs.y + obs.height * 3 / 4);
                this.ctx.closePath();
                this.ctx.fill();
                break;
        }
        
        this.ctx.restore();
    }

    bindEvents() {
        // Touch events for buttons
        this.jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.currentGameState === 'playing' && this.player.grounded) {
                this.jumpRequested = true;
                this.player.isDucking = false;
            }
        }, { passive: false });

        // Click events for buttons (desktop/mobile backup)
        this.jumpButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.currentGameState === 'playing' && this.player.grounded) {
                this.jumpRequested = true;
                this.player.isDucking = false;
            }
        });

        this.duckButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.currentGameState === 'playing' && this.player.grounded) {
                this.player.isDucking = true;
                this.duckButton.style.background = '#b9a779';
            }
        }, { passive: false });

        this.duckButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.currentGameState === 'playing' && this.player.grounded) {
                this.player.isDucking = true;
                this.duckButton.style.background = '#b9a779';
            }
        });

        this.duckButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.currentGameState === 'playing') {
                this.player.isDucking = false;
                this.duckButton.style.background = '#054239';
            }
        });

        this.duckButton.addEventListener('mouseup', (e) => {
            e.preventDefault();
            if (this.currentGameState === 'playing') {
                this.player.isDucking = false;
                this.duckButton.style.background = '#054239';
            }
        });

        this.duckButton.addEventListener('mouseleave', (e) => {
            if (this.currentGameState === 'playing') {
                this.player.isDucking = false;
                this.duckButton.style.background = '#054239';
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (this.currentGameState === 'playing') {
                if ((e.code === 'Space' || e.code === 'ArrowUp') && this.player.grounded) {
                    this.jumpRequested = true;
                    this.player.isDucking = false;
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

        // Restart button
        this.restartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (this.currentGameState === 'gameOver') {
                this.startGame();
            }
        });

        // Window events
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.updateUIVisibility();
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.setupCanvas();
                this.updateUIVisibility();
            }, 100);
        });
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
        this.distanceToNextSpawn = this.canvas.width + 300 + Math.random() * 400;
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
            x: this.canvas.width,
            y: this.groundY - obstacleData.height - obstacleData.yOffset,
            width: obstacleData.width,
            height: obstacleData.height,
            type: obstacleData.type,
            hitbox: {
                x_offset: 2,
                y_offset: 2,
                width: obstacleData.width - 4,
                height: obstacleData.height - 4
            }
        };

        this.obstacles.push(obstacle);
        this.setNextSpawnDistance();
    }

    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.speed;

            if (this.checkCollision(this.player, obs)) {
                this.createExplosionParticles(obs.x, obs.y);
                this.gameOver();
                return;
            }

            if (obs.x + obs.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }

        if (this.obstacles.length === 0 || 
            (this.canvas.width - this.obstacles[this.obstacles.length - 1].x) >= this.distanceToNextSpawn) {
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

        return p_x < o_x + o_w &&
               p_x + p_w > o_x &&
               p_y < o_y + o_h &&
               p_y + p_h > o_y;
    }

    createExplosionParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x + Math.random() * 30,
                y: y + Math.random() * 30,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                color: ['#FF4500', '#FFD700', '#FF6347'][Math.floor(Math.random() * 3)]
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.2; // gravity
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
            }
        }

        if (this.jumpRequested && this.player.grounded) {
            this.player.velY = -12;
            this.player.jumping = true;
            this.player.grounded = false;
            this.jumpRequested = false;
            this.player.isDucking = false;
        }

        if (!this.player.grounded && this.player.isDucking) {
            this.player.isDucking = false;
        }

        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.w < 0) {
                cloud.x = this.canvas.width + Math.random() * 100;
            }
        });

        // Update obstacles and particles
        this.updateObstacles();
        this.updateParticles();

        // Update score
        this.distance += this.speed;
        if (this.distance - this.lastScoredDistance >= 15) {
            this.score++;
            this.lastScoredDistance = this.distance;
            this.updateScoreDisplay();

            if (this.score >= this.nextThemeToggleScore) {
                this.toggleDayNight();
                this.nextThemeToggleScore += 500;
            }
        }

        // Increase speed gradually
        this.speed += 0.001;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
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

        // Calculate animation offset for walking
        const walkOffset = this.player.grounded && !this.player.isDucking ? 
            Math.sin(this.player.animFrame) * 2 : 0;

        // Body
        let bodyY = p.y + walkOffset;
        let bodyHeight = p.height;
        if (p.isDucking) {
            bodyY = p.y + p.height * 0.4 + walkOffset;
            bodyHeight = p.height * 0.6;
        }

        // Draw body (thobe)
        this.ctx.fillStyle = colors.playerBody;
        this.ctx.fillRect(p.x + 5, bodyY + 15, p.width - 10, bodyHeight - 15);

        // Draw head/face
        this.ctx.fillStyle = colors.playerSkin;
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width / 2, bodyY + 15, 12, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw tarboush (green as requested)
        this.ctx.fillStyle = colors.playerTarboush;
        
        // Tarboush base
        this.ctx.fillRect(p.x + p.width / 2 - 10, bodyY - 5, 20, 15);
        
        // Tarboush top part
        this.ctx.beginPath();
        this.ctx.moveTo(p.x + p.width / 2 - 8, bodyY - 5);
        this.ctx.lineTo(p.x + p.width / 2 + 8, bodyY - 5);
        this.ctx.lineTo(p.x + p.width / 2 + 6, bodyY - 15);
        this.ctx.lineTo(p.x + p.width / 2 - 6, bodyY - 15);
        this.ctx.closePath();
        this.ctx.fill();

        // Tarboush tassel
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width / 2 + 8, bodyY - 10, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Eyes
        this.ctx.fillStyle = colors.playerDetail;
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width / 2 - 4, bodyY + 12, 1.5, 0, Math.PI * 2);
        this.ctx.arc(p.x + p.width / 2 + 4, bodyY + 12, 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Mustache
        this.ctx.fillStyle = colors.playerMustache;
        this.ctx.fillRect(p.x + p.width / 2 - 6, bodyY + 18, 12, 3);

        // Arms (simple)
        this.ctx.fillStyle = colors.playerSkin;
        if (!p.isDucking) {
            // Running arms
            this.ctx.fillRect(p.x + 2, bodyY + 20 + walkOffset, 8, 15);
            this.ctx.fillRect(p.x + p.width - 10, bodyY + 25 - walkOffset, 8, 15);
        } else {
            // Ducking arms
            this.ctx.fillRect(p.x + 5, bodyY + 20, 10, 8);
            this.ctx.fillRect(p.x + p.width - 15, bodyY + 20, 10, 8);
        }

        // Legs (when not ducking)
        if (!p.isDucking && p.grounded) {
            this.ctx.fillStyle = colors.playerDetail;
            const legOffset = Math.sin(this.player.animFrame * 2) * 3;
            this.ctx.fillRect(p.x + p.width / 2 - 8, bodyY + bodyHeight - 5, 6, 15 + legOffset);
            this.ctx.fillRect(p.x + p.width / 2 + 2, bodyY + bodyHeight - 5, 6, 15 - legOffset);
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
                // Wings
                const wingFlap = Math.sin(Date.now() * 0.01) * 5;
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x, obs.y + obs.height / 2);
                this.ctx.lineTo(obs.x + 15, obs.y + wingFlap);
                this.ctx.lineTo(obs.x + 15, obs.y + obs.height - wingFlap);
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.moveTo(obs.x + obs.width, obs.y + obs.height / 2);
                this.ctx.lineTo(obs.x + obs.width - 15, obs.y + wingFlap);
                this.ctx.lineTo(obs.x + obs.width - 15, obs.y + obs.height - wingFlap);
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
                this.ctx.lineTo(obs.x - flameLengthclass Game {
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
            animFrame: 0, animSpeed: 0.2,
            runHitbox: { x_offset: 8, y_offset: 8, width: 34, height: 62 },
            duckHitbox: { x_offset: 8, y_offset: 35, width: 34, height: 35 }
        };

        this.isNightMode = false;
        this.particles = [];
        
        // Official Syrian Identity Color Themes
        this.themeColors = {
            day: {
                ground: '#b9a779', groundShadow: '#988561',
                cloud: 'rgba(237, 235, 224, 0.9)', 
                playerTarboush: '#054239', // Forest secondary
                playerBody: '#edebe0', playerSkin: '#b9a779', playerDetail: '#3d3a3b',
                playerMustache: '#988561',
                obstacleGreen: '#42B177', obstacleBlack: '#3d3a3b', obstacleGrey: '#988561',
                obstacleMissileFlame: '#b9a779',
                sky: '#42B177', // Forest primary
                coin: '#b9a779'
            },
            night: {
                ground: '#6B2F2A', groundShadow: '#4A1F1E',
                cloud: 'rgba(237, 235, 224, 0.4)',
                playerTarboush: '#002623', // Forest dark
                playerBody: '#edebe0', playerSkin: '#b9a779', playerDetail: '#edebe0',
                playerMustache: '#988561',
                obstacleGreen: '#054239', obstacleBlack: '#3d3a3b', obstacleGrey: '#6B2F2A',
                obstacleMissileFlame: '#988561',
                sky: '#054239', // Forest secondary
                coin: '#988561'
            }
        };

        this.characters = [
            { 
                id: 'shami_abu_tarboush', 
                name: 'شامي أبو طربوش', 
                available: true, 
                image: 'data:image/svg+xml,' + encodeURIComponent(`
                    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
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
                    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
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
                    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
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
                    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
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
                    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="60" height="60" fill="#161616" rx="8"/>
                        <text x="30" y="38" font-family="Arial" font-size="20" font-weight="normal" text-anchor="middle" fill="#edebe0">و</text>
                    </svg>
                `)
            }
        ];
        this.selectedCharacterId = 'shami_abu_tarboush';

        this.init();
    }

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupCanvas();
        this.setupUI();
        this.bindEvents();
        
        this.obstacles = [];
        this.clouds = this.createClouds();
        this.setNextSpawnDistance();
        
        this.currentGameState = 'characterSelect';
        this.updateUIVisibility();
        this.renderCharacterSelectScreen();
        this.gameLoop();
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
        
        this.groundY = this.canvas.height - 60;
        this.player.y = this.groundY - this.player.height;
    }

    setupUI() {
        this.scoreDisplay = document.getElementById('score');
        this.finalScoreDisplay = document.getElementById('finalScore');
        this.bestScoreDisplay = document.getElementById('bestScore');
        this.gameOverScreen = document.getElementById('gameOver');
        this.characterSelectScreen = document.getElementById('characterSelectScreen');
        this.gameContainer = document.querySelector('.game-container');
        this.uiContainer = document.getElementById('ui-container');
        this.jumpButton = document.getElementById('jumpButton');
        this.duckButton = document.getElementById('duckButton');
        this.restartBtn = document.getElementById('restartBtn');
        this.startGameBtn = document.getElementById('start-game-btn');
        this.orientationWarning = document.getElementById('orientation-warning');
        
        this.updateBestScoreDisplay();
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
        return color || '#42B177'; // Fallback to forest primary if color not found
    }

    toggleDayNight() {
        this.isNightMode = !this.isNightMode;
        document.body.classList.toggle('night-mode', this.isNightMode);
        this.updateScoreDisplay();
    }

    updateUIVisibility() {
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        
        document.querySelectorAll('.game-screen').forEach(el => el.style.display = 'none');
        this.jumpButton.style.display = 'none';
        this.duckButton.style.display = 'none';

        if (isLandscape) {
            if (this.currentGameState === 'playing') {
                this.gameContainer.style.display = 'flex';
                this.uiContainer.style.display = 'flex';
                this.jumpButton.style.display = 'flex';
                this.duckButton.style.display = 'flex';
            } else if (this.currentGameState === 'gameOver') {
                this.gameContainer.style.display = 'flex';
                this.uiContainer.style.display = 'flex';
                this.gameOverScreen.style.display = 'flex';
            } else if (this.currentGameState === 'characterSelect') {
                this.characterSelectScreen.style.display = 'flex';
            }
        } else {
            this.orientationWarning.style.display = 'flex';
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
        this.nextTh
