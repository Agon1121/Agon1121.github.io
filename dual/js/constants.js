// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    null,
    '#FF0D72', // I - Cyan
    '#0DC2FF', // J - Blue
    '#0DFF72', // L - Orange
    '#F538FF', // O - Yellow
    '#FF8E0D', // S - Green
    '#FFE138', // T - Purple
    '#3877FF'  // Z - Red
];

// Tetromino shapes defined in 4x4 matrices
const SHAPES = [
    null,
    // I tetromino
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J tetromino
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    // L tetromino
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    // O tetromino
    [
        [4, 4],
        [4, 4]
    ],
    // S tetromino
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T tetromino
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // Z tetromino
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

const POINTS = {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    TETRIS: 800,
    SOFT_DROP: 1,
    HARD_DROP: 2
};

const LEVEL = {
    LINES_PER_LEVEL: 10,
    MAX_LEVEL: 10,
    SOFT_DROP_FACTOR: 3,
}

// Time intervals in milliseconds for different levels
const GRAVITY = {
    1: 1000,
    2: 850,
    3: 700,
    4: 550,
    5: 400,
    6: 300,
    7: 250,
    8: 200,
    9: 150,
    10: 100
};