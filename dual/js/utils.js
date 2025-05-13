/**
 * Creates an empty grid for the Tetris board
 * @returns {Array} 2D array representing an empty grid
 * utils.js
 */
function createEmptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(""));
}

/**
 * Creates a deep copy of a grid
 * @param {Array} grid - The grid to copy
 * @returns {Array} A deep copy of the grid
 */
function copyGrid(grid) {
    return grid.map(row => [...row]);
}

/**
 * Creates a deep copy of a tetromino
 * @param {Object} piece - The tetromino to copy
 * @returns {Object} A deep copy of the tetromino
 */
function copyPiece(piece) {
    if (!piece) return null;
    return {
        type: piece.type,
        x: piece.x,
        y: piece.y,
        rotation: piece.rotation
    };
}

/**
 * Shuffles array using Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} The shuffled array
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Generate a new bag of tetrominos using the 7-bag randomizer
 * @returns {Array} Array of tetromino types
 */
function generateBag() {
    return shuffleArray(Object.keys(SHAPES));
}

/**
 * Calculate the level based on number of lines cleared
 * @param {number} lines - Number of lines cleared
 * @returns {number} Current level
 */
function calculateLevel(lines) {
    const level = 1 + Math.floor(lines / LEVEL_UP_LINES);
    return Math.min(level, MAX_LEVEL);
}

/**
 * Calculate gravity speed based on current level
 * @param {number} level - Current level
 * @returns {number} Gravity speed in milliseconds
 */
function calculateGravity(level) {
    return INITIAL_GRAVITY * Math.pow(GRAVITY_DECREASE_FACTOR, level - 1);
}

/**
 * Check if a position is valid for a tetromino
 * @param {Object} piece - The tetromino
 * @param {Array} grid - The current grid
 * @returns {boolean} Whether the position is valid
 */
function isValidPosition(piece, grid) {
    const shape = SHAPES[piece.type][piece.rotation];
    return shape.every(([dx, dy]) => {
        const x = piece.x + dx;
        const y = piece.y + dy;
        
        // Check if outside grid boundaries
        if (x < 0 || x >= COLS || y >= ROWS) {
            return false;
        }
        
        // Check if overlapping with existing blocks
        // Allow negative y (above the grid) as long as it's not overlapping
        return y < 0 || grid[y][x] === "";
    });
}

/**
 * Check if a tetromino is at the bottom (can't move down further)
 * @param {Object} piece - The tetromino
 * @param {Array} grid - The current grid
 * @returns {boolean} Whether the tetromino is at the bottom
 */
function isAtBottom(piece, grid) {
    const testPiece = copyPiece(piece);
    testPiece.y += 1;
    return !isValidPosition(testPiece, grid);
}

/**
 * Get drop position of a tetromino
 * @param {Object} piece - The tetromino
 * @param {Array} grid - The current grid
 * @returns {Object} The piece at its drop position
 */
function getDropPosition(piece, grid) {
    const dropPiece = copyPiece(piece);
    while (isValidPosition(dropPiece, grid)) {
        dropPiece.y += 1;
    }
    dropPiece.y -= 1; // Adjust after going one step too far
    return dropPiece;
}

/**
 * Calculate the drop distance for a piece
 * @param {Object} piece - The tetromino
 * @param {Array} grid - The current grid
 * @returns {number} Drop distance in cells
 */
function getDropDistance(piece, grid) {
    let distance = 0;
    const testPiece = copyPiece(piece);
    
    while (isValidPosition(testPiece, grid)) {
        testPiece.y++;
        distance++;
    }
    
    return distance - 1; // Adjust for going one too far
}

/**
 * Check if piece rotation is a T-Spin
 * @param {Object} piece - The tetromino
 * @param {Array} grid - The current grid
 * @returns {string} "none", "mini", or "normal"
 */
function checkTSpin(piece, grid) {
    // Only T pieces can T-Spin
    if (piece.type !== "T") {
        return "none";
    }

    // Check the four corners around the T piece
    // The arrangement depends on rotation
    let corners = [];
    
    switch (piece.rotation) {
        case 0: // T facing up
            corners = [
                [piece.x, piece.y],         // Top-left
                [piece.x + 2, piece.y],     // Top-right
                [piece.x, piece.y + 2],     // Bottom-left
                [piece.x + 2, piece.y + 2]  // Bottom-right
            ];
            break;
        case 1: // T facing right
            corners = [
                [piece.x, piece.y],         // Top-left
                [piece.x + 2, piece.y],     // Top-right
                [piece.x, piece.y + 2],     // Bottom-left
                [piece.x + 2, piece.y + 2]  // Bottom-right
            ];
            break;
        case 2: // T facing down
            corners = [
                [piece.x, piece.y],         // Top-left
                [piece.x + 2, piece.y],     // Top-right
                [piece.x, piece.y + 2],     // Bottom-left
                [piece.x + 2, piece.y + 2]  // Bottom-right
            ];
            break;
        case 3: // T facing left
            corners = [
                [piece.x, piece.y],         // Top-left
                [piece.x + 2, piece.y],     // Top-right
                [piece.x, piece.y + 2],     // Bottom-left
                [piece.x + 2, piece.y + 2]  // Bottom-right
            ];
            break;
    }
    
    // Count filled corners
    let filledCorners = 0;
    for (const [x, y] of corners) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS || (y >= 0 && grid[y][x] !== "")) {
            filledCorners++;
        }
    }
    
    if (filledCorners >= 3) {
        // Determine if it's a mini T-spin or normal T-spin
        // This is simplified and might need more complex logic for accurate detection
        
        // Front corners based on rotation
        let frontCorners;
        switch (piece.rotation) {
            case 0: // Front corners are at the top
                frontCorners = [corners[0], corners[1]];
                break;
            case 1: // Front corners are at the right
                frontCorners = [corners[1], corners[3]];
                break;
            case 2: // Front corners are at the bottom
                frontCorners = [corners[2], corners[3]];
                break;
            case 3: // Front corners are at the left
                frontCorners = [corners[0], corners[2]];
                break;
        }
        
        // Count filled front corners
        let filledFrontCorners = 0;
        for (const [x, y] of frontCorners) {
            if (x < 0 || x >= COLS || y < 0 || y >= ROWS || (y >= 0 && grid[y][x] !== "")) {
                filledFrontCorners++;
            }
        }
        
        // If at least one front corner is filled, it's a normal T-spin
        // Otherwise, it's a mini T-spin
        return filledFrontCorners >= 1 ? "normal" : "mini";
    }
    
    return "none";
}