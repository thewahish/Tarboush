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

    try { // --- Start of the main try block for the constructor ---

        // --- 1. Basic property initialization ---
        this.gameRunning = false; // Game starts as not running, waiting for character select
        this.score = 0;
        this.bestScore = localStorage.getItem('tarboushBestScore') || 0;
        this.speed = 4;
        this.distance = 0;
        this.lastScoredDistance = 0;
        this.nextThemeToggleScore = 500; // Day/Night toggle every 500 points

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

        // --- 2. Get Canvas and Context ---
        this.canvas = document.getElementById('gameCanvas');
        console.log("[Constructor DEBUG] Canvas element:", this.canvas);
        if (!this.canvas) throw new Error("Canvas element #gameCanvas not found!");
        this.ctx = this.canvas.getContext('2d');
        console.log("[Constructor DEBUG] Canvas context:", this.ctx);
        if (!this.ctx) throw new Error("Failed to get 2D rendering context for canvas.");

        // --- 3. Get all relevant UI element references ---
        // These must be retrieved before updateUIVisibility is called
        this.scoreDisplay = document.getElementById('score');
        if (!this.scoreDisplay) throw new Error("scoreDisplay element not found!");
        this.finalScoreDisplay = document.getElementById('finalScore');
        if (!this.finalScoreDisplay) throw new Error("final
