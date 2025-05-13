/* 
* constants.js
* This file contains all the constants used in the Tetris game.
*/

// Game dimensions
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

// Visual settings
const GHOST_ALPHA = 0.25;
const PREVIEW_SCALE = 0.7;
const NEXT_PIECES_COUNT = 5;

// Game mechanics
const LOCK_DELAY = 500; // Lock delay in milliseconds
const MAX_MOVE_RESETS = 15; // Maximum number of lock delay resets
const INITIAL_GRAVITY = 800; // Initial gravity speed in milliseconds
const GRAVITY_DECREASE_FACTOR = 0.85; // How much gravity speeds up per level
const LEVEL_UP_LINES = 10; // Lines needed to level up
const MAX_LEVEL = 15; // Maximum level

// Piece shapes
const SHAPES = {
    I: [
        [[0, 1], [1, 1], [2, 1], [3, 1]],
        [[2, 0], [2, 1], [2, 2], [2, 3]],
        [[0, 2], [1, 2], [2, 2], [3, 2]],
        [[1, 0], [1, 1], [1, 2], [1, 3]]
    ],
    O: [
        [[1, 0], [2, 0], [1, 1], [2, 1]],
        [[1, 0], [2, 0], [1, 1], [2, 1]],
        [[1, 0], [2, 0], [1, 1], [2, 1]],
        [[1, 0], [2, 0], [1, 1], [2, 1]]
    ],
    T: [
        [[1, 0], [0, 1], [1, 1], [2, 1]],
        [[1, 0], [1, 1], [2, 1], [1, 2]],
        [[0, 1], [1, 1], [2, 1], [1, 2]],
        [[1, 0], [0, 1], [1, 1], [1, 2]]
    ],
    S: [
        [[1, 0], [2, 0], [0, 1], [1, 1]],
        [[1, 0], [1, 1], [2, 1], [2, 2]],
        [[1, 1], [2, 1], [0, 2], [1, 2]],
        [[0, 0], [0, 1], [1, 1], [1, 2]]
    ],
    Z: [
        [[0, 0], [1, 0], [1, 1], [2, 1]],
        [[2, 0], [1, 1], [2, 1], [1, 2]],
        [[0, 1], [1, 1], [1, 2], [2, 2]],
        [[1, 0], [0, 1], [1, 1], [0, 2]]
    ],
    J: [
        [[0, 0], [0, 1], [1, 1], [2, 1]],
        [[1, 0], [2, 0], [1, 1], [1, 2]],
        [[0, 1], [1, 1], [2, 1], [2, 2]],
        [[1, 0], [1, 1], [0, 2], [1, 2]]
    ],
    L: [
        [[2, 0], [0, 1], [1, 1], [2, 1]],
        [[1, 0], [1, 1], [1, 2], [2, 2]],
        [[0, 1], [1, 1], [2, 1], [0, 2]],
        [[0, 0], [1, 0], [1, 1], [1, 2]]
    ]
};

// Piece colors
const COLORS = {
    I: "#00FFFF", // Cyan
    O: "#FFFF00", // Yellow
    T: "#800080", // Purple
    S: "#00FF00", // Green
    Z: "#FF0000", // Red
    J: "#0000FF", // Blue
    L: "#FFA500"  // Orange
};

// Scoring system
const SCORING = {
    SOFT_DROP: 1,            // Points per cell for soft drop
    HARD_DROP: 2,            // Points per cell for hard drop
    SINGLE: 100,             // 1 line clear
    DOUBLE: 300,             // 2 lines clear
    TRIPLE: 500,             // 3 lines clear
    TETRIS: 800,             // 4 lines clear
    MINI_TSPIN: 100,         // Mini T-Spin no lines
    MINI_TSPIN_SINGLE: 200,  // Mini T-Spin single
    MINI_TSPIN_DOUBLE: 400,  // Mini T-Spin double
    TSPIN: 400,              // T-Spin no lines
    TSPIN_SINGLE: 800,       // T-Spin single
    TSPIN_DOUBLE: 1200,      // T-Spin double
    TSPIN_TRIPLE: 1600,      // T-Spin triple
    COMBO: 50,               // Additional points per combo
    BACK_TO_BACK: 1.5        // Multiplier for back-to-back special clears
};

// Game states
const GAME_STATE = {
    READY: 'ready',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameover'
};

// AI difficulty settings
const AI_SETTINGS = {
    easy: {
        beamWidth: 4,
        searchDepth: 1,
        thinkingTime: 500,
        linesClearFactor: 0.6,
        heightFactor: 0.5,
        holesFactor: 0.4,
        bumpinessFactor: 0.3,
        useAdvancedFeatures: false
    },
    medium: {
        beamWidth: 8,
        searchDepth: 2,
        thinkingTime: 300,
        linesClearFactor: 0.7,
        heightFactor: 0.6,
        holesFactor: 0.6,
        bumpinessFactor: 0.5,
        useAdvancedFeatures: true
    },
    hard: {
        beamWidth: 12,
        searchDepth: 3,
        thinkingTime: 200,
        linesClearFactor: 0.8,
        heightFactor: 0.7,
        holesFactor: 0.8,
        bumpinessFactor: 0.7,
        useAdvancedFeatures: true
    },
    expert: {
        beamWidth: 16,
        searchDepth: 4,
        thinkingTime: 100,
        linesClearFactor: 1.0,
        heightFactor: 0.9,
        holesFactor: 1.0,
        bumpinessFactor: 0.9,
        useAdvancedFeatures: true
    }
};