// Constants for game setup
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

// Get player canvas
const playerCanvas = document.getElementById("playerGame");
const playerContext = playerCanvas.getContext("2d");
playerCanvas.width = COLS * BLOCK_SIZE + 200; // Additional space for hold/next
playerCanvas.height = ROWS * BLOCK_SIZE + 50;

// Get AI canvas
const aiCanvas = document.getElementById("aiGame");
const aiContext = aiCanvas.getContext("2d");
aiCanvas.width = COLS * BLOCK_SIZE + 200;
aiCanvas.height = ROWS * BLOCK_SIZE + 50;

// Define tetromino shapes and rotations
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

// Define piece colors
const COLORS = {
    I: "cyan",
    O: "yellow",
    T: "purple",
    S: "green",
    Z: "red",
    J: "blue",
    L: "orange"
};

// Game states
const GAME_STATE = {
    IDLE: 'idle',
    PLAYING: 'playing',
    GAME_OVER: 'game_over'
};

// Game objects
let player = {
    grid: createEmptyGrid(),
    currentPiece: null,
    holdPiece: null,
    canHold: true,
    bag: [],
    nextPieces: [],
    isPieceLocked: false,
    gravitySpeed: 500,
    lastDropTime: Date.now(),
    score: 0,
    linesCleared: 0,
    gameLoopId: null,
    isHardDrop: false,
    state: GAME_STATE.IDLE
};

let ai = {
    grid: createEmptyGrid(),
    currentPiece: null,
    holdPiece: null,
    canHold: true,
    bag: [],
    nextPieces: [],
    isPieceLocked: false,
    gravitySpeed: 100, // AI drops pieces faster
    lastDropTime: Date.now(),
    score: 0,
    linesCleared: 0,
    gameLoopId: null,
    isHardDrop: false,
    moveDelay: 100, // Delay between AI moves
    lastMoveTime: Date.now(),
    state: GAME_STATE.IDLE,
    thinkingTime: 0, // Time spent planning moves
    currentMove: null, // The current planned move
    moveQueue: [] // Queue of moves to make
};

let gameState = GAME_STATE.IDLE;
let battleStarted = false;

// Create an empty grid
function createEmptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(""));
}

// Sleep function for animation delays
function sleep(ms) {
    const wakeUpTime = Date.now() + ms;
    while (Date.now() < wakeUpTime) {}
}

// Refill the piece queue
function refillQueue(gameObj) {
    while (gameObj.nextPieces.length < 6) {
        if (gameObj.bag.length === 0) {
            gameObj.bag = Object.keys(SHAPES).sort(() => Math.random() - 0.5);
        }
        gameObj.nextPieces.push({
            type: gameObj.bag.pop(),
            x: 3,
            y: 0,
            rotation: 0
        });
    }
}

// Spawn a new piece
function spawnPiece(gameObj) {
    refillQueue(gameObj);
    gameObj.currentPiece = gameObj.nextPieces.shift();
    gameObj.isPieceLocked = false;
    gameObj.canHold = true;

    // Check for game over
    if (isOverlap(gameObj.currentPiece, gameObj.grid)) {
        gameObj.state = GAME_STATE.GAME_OVER;
        checkWinner();
    }
}

// Check if a game is over and who wins
function checkWinner() {
    if (player.state === GAME_STATE.GAME_OVER && ai.state === GAME_STATE.GAME_OVER) {
        // Both games are over
        const winnerBanner = document.getElementById("winnerBanner");
        if (player.score > ai.score) {
            winnerBanner.textContent = "You Win!";
            winnerBanner.style.backgroundColor = "#4CAF50";
        } else if (ai.score > player.score) {
            winnerBanner.textContent = "AI Wins!";
            winnerBanner.style.backgroundColor = "#F44336";
        } else {
            winnerBanner.textContent = "It's a Tie!";
            winnerBanner.style.backgroundColor = "#2196F3";
        }
        winnerBanner.style.display = "block";
        battleStarted = false;
    } else if (player.state === GAME_STATE.GAME_OVER && battleStarted) {
        const winnerBanner = document.getElementById("winnerBanner");
        winnerBanner.textContent = "AI Wins!";
        winnerBanner.style.backgroundColor = "#F44336";
        winnerBanner.style.display = "block";
        battleStarted = false;
        cancelAnimationFrame(ai.gameLoopId);
        ai.state = GAME_STATE.IDLE;
    } else if (ai.state === GAME_STATE.GAME_OVER && battleStarted) {
        const winnerBanner = document.getElementById("winnerBanner");
        winnerBanner.textContent = "You Win!";
        winnerBanner.style.backgroundColor = "#4CAF50";
        winnerBanner.style.display = "block";
        battleStarted = false;
        cancelAnimationFrame(player.gameLoopId);
        player.state = GAME_STATE.IDLE;
    }
}

// Draw a single block
function drawBlock(context, x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.strokeStyle = "white";
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// Draw a tetromino piece
function drawPiece(context, piece) {
    const shape = SHAPES[piece.type][piece.rotation];
    shape.forEach(([dx, dy]) => {
        drawBlock(context, piece.x + dx, piece.y + dy, COLORS[piece.type]);
    });
}

// Draw the hold area
function drawHoldArea(context, gameObj) {
    // Draw hold area
    context.fillStyle = "#f0f0f0";
    context.fillRect(COLS * BLOCK_SIZE + 10, 10, 180, 100);
    context.strokeStyle = "black";
    context.strokeRect(COLS * BLOCK_SIZE + 10, 10, 180, 100);

    // Draw "HOLD" text
    context.fillStyle = "black";
    context.font = "20px Arial";
    context.fillText("HOLD", COLS * BLOCK_SIZE + 75, 40);

    // Draw held piece
    if (gameObj.holdPiece) {
        const offsetX = COLS * BLOCK_SIZE + 70;
        const offsetY = 60;
        const shape = SHAPES[gameObj.holdPiece.type][0]; // Always show first rotation
        
        shape.forEach(([dx, dy]) => {
            context.fillStyle = COLORS[gameObj.holdPiece.type];
            context.fillRect((dx * BLOCK_SIZE) / 1.5 + offsetX, (dy * BLOCK_SIZE) / 1.5 + offsetY, BLOCK_SIZE / 1.5, BLOCK_SIZE / 1.5);
            context.strokeStyle = "white";
            context.strokeRect((dx * BLOCK_SIZE) / 1.5 + offsetX, (dy * BLOCK_SIZE) / 1.5 + offsetY, BLOCK_SIZE / 1.5, BLOCK_SIZE / 1.5);
        });
    }
}

// Draw the next pieces preview
function drawNextPieces(context, gameObj) {
    // Draw next pieces area
    context.fillStyle = "#f0f0f0";
    context.fillRect(COLS * BLOCK_SIZE + 10, 120, 180, 430);
    context.strokeStyle = "black";
    context.strokeRect(COLS * BLOCK_SIZE + 10, 120, 180, 430);

    // Draw "NEXT" text
    context.fillStyle = "black";
    context.font = "20px Arial";
    context.fillText("NEXT", COLS * BLOCK_SIZE + 75, 150);

    // Draw next pieces
    for (let i = 0; i < 6; i++) {
        if (i < gameObj.nextPieces.length) {
            const piece = gameObj.nextPieces[i];
            const offsetX = COLS * BLOCK_SIZE + 70;
            const offsetY = 180 + i * 80;
            const shape = SHAPES[piece.type][0]; // Always show first rotation
            
            shape.forEach(([dx, dy]) => {
                context.fillStyle = COLORS[piece.type];
                context.fillRect((dx * BLOCK_SIZE) / 1.5 + offsetX, (dy * BLOCK_SIZE) / 1.5 + offsetY, BLOCK_SIZE / 1.5, BLOCK_SIZE / 1.5);
                context.strokeStyle = "white";
                context.strokeRect((dx * BLOCK_SIZE) / 1.5 + offsetX, (dy * BLOCK_SIZE) / 1.5 + offsetY, BLOCK_SIZE / 1.5, BLOCK_SIZE / 1.5);
            });
        }
    }
}

// Draw the score
function drawScore(context, gameObj) {
    context.fillStyle = "black";
    context.font = "16px Arial";
    context.fillText(`Score: ${gameObj.score}`, COLS * BLOCK_SIZE + 60, ROWS * BLOCK_SIZE);
    context.fillText(`Lines: ${gameObj.linesCleared}`, COLS * BLOCK_SIZE + 60, ROWS * BLOCK_SIZE + 30);
}

// Draw the game state
function render(context, gameObj) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // Draw game area background
    context.fillStyle = "#f8f8f8";
    context.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

    // Draw grid
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (gameObj.grid[y][x]) {
                drawBlock(context, x, y, COLORS[gameObj.grid[y][x]]);
            } else {
                // Draw light grid lines for empty cells
                context.strokeStyle = "#e0e0e0";
                context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }

    // Draw current piece
    if (gameObj.currentPiece) {
        drawPiece(context, gameObj.currentPiece);
    }

    // Draw hold and next pieces areas
    drawHoldArea(context, gameObj);
    drawNextPieces(context, gameObj);
    drawScore(context, gameObj);
    
    // Draw game state if game is over
    if (gameObj.state === GAME_STATE.GAME_OVER) {
        context.fillStyle = "rgba(0, 0, 0, 0.5)";
        context.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        context.fillStyle = "white";
        context.font = "30px Arial";
        context.fillText("GAME OVER", COLS * BLOCK_SIZE / 2 - 80, ROWS * BLOCK_SIZE / 2);
    }
}

// Player game loop
function playerGameLoop() {
    if (player.state === GAME_STATE.PLAYING) {
        let currentTime = Date.now();
        if (!player.isPieceLocked && currentTime - player.lastDropTime >= player.gravitySpeed) {
            movePieceDown(player);
            player.lastDropTime = currentTime;
        }
    }
    render(playerContext, player);
    player.gameLoopId = requestAnimationFrame(playerGameLoop);
}

// AI game loop
function aiGameLoop() {
    if (ai.state === GAME_STATE.PLAYING) {
        let currentTime = Date.now();
        
        // Process AI's move if it's time
        if (currentTime - ai.lastMoveTime >= ai.moveDelay && ai.moveQueue.length > 0) {
            const move = ai.moveQueue.shift();
            executeAIMove(move);
            ai.lastMoveTime = currentTime;
        }
        
        // Apply gravity
        if (!ai.isPieceLocked && currentTime - ai.lastDropTime >= ai.gravitySpeed) {
            movePieceDown(ai);
            ai.lastDropTime = currentTime;
        }
        
        // Plan next move if needed
        if (ai.moveQueue.length === 0 && ai.currentPiece && !ai.isPieceLocked) {
            planAIMove();
        }
    }
    render(aiContext, ai);
    ai.gameLoopId = requestAnimationFrame(aiGameLoop);
}

// Execute a planned AI move
function executeAIMove(move) {
    if (!move) return;
    
    switch(move.type) {
        case 'left':
            movePiece(ai, -1, 0);
            break;
        case 'right':
            movePiece(ai, 1, 0);
            break;
        case 'rotate':
            clockwisePiece(ai);
            break;
        case 'counterspin':
            counterclockwisePiece(ai);
            break;
        case 'harddrop':
            hardDrop(ai);
            break;
        case 'hold':
            hold(ai);
            break;
    }
}

// Plan the AI's next move using beam search
function planAIMove() {
    // If there's no current piece, return
    if (!ai.currentPiece) return;
    
    // Clone the AI state for simulation
    const aiClone = cloneAIState();
    
    // Get possible moves using beam search
    const bestMove = findBestMove(aiClone);
    
    // Queue up the moves
    if (bestMove) {
        ai.moveQueue = bestMove.moves;
    } else {
        // If no good move, just hard drop
        ai.moveQueue = [{ type: 'harddrop' }];
    }
}

// AI Algorithm - Find best move using beam search
function findBestMove(aiState) {
    const BEAM_WIDTH = 10;
    const MAX_DEPTH = 3; // Look ahead 3 pieces
    
    // Initial states to evaluate (different rotations and positions of current piece)
    let states = generateInitialStates(aiState);
    
    // Sort states by eval score and keep only top BEAM_WIDTH
    states.sort((a, b) => b.score - a.score);
    states = states.slice(0, BEAM_WIDTH);
    
    // For each lookahead depth
    for (let depth = 1; depth < MAX_DEPTH; depth++) {
        if (depth >= aiState.nextPieces.length) break;
        
        let newStates = [];
        
        // For each state in our beam
        for (let state of states) {
            // Generate next piece states
            let nextStates = generateNextPieceStates(state, aiState.nextPieces[depth - 1].type);
            newStates.push(...nextStates);
        }
        
        // Sort and prune again
        newStates.sort((a, b) => b.score - a.score);
        states = newStates.slice(0, BEAM_WIDTH);
    }
    
    // Return the best move sequence
    return states.length > 0 ? states[0] : null;
}

// Generate all possible moves for current piece
function generateInitialStates(aiState) {
    const states = [];
    const piece = aiState.currentPiece;
    const grid = aiState.grid;
    
    // Try holding first
    states.push({
        moves: [{ type: 'hold' }],
        score: 0 // Will be evaluated later
    });
    
    // Try different rotations (0-3)
    for (let rotation = 0; rotation < 4; rotation++) {
        // Calculate rotation moves
        const rotationMoves = [];
        const rotationDiff = (rotation - piece.rotation + 4) % 4;
        
        if (rotationDiff === 1) {
            rotationMoves.push({ type: 'rotate' });
        } else if (rotationDiff === 2) {
            rotationMoves.push({ type: 'rotate' });
            rotationMoves.push({ type: 'rotate' });
        } else if (rotationDiff === 3) {
            rotationMoves.push({ type: 'counterspin' });
        }
        
        // Try different x positions
        for (let x = -5; x <= 5; x++) {
            // Clone piece for simulation
            const simulatedPiece = {
                ...piece,
                rotation: rotation,
                x: piece.x + x
            };
            
            // Check if position is valid
            if (!isValidPosition(simulatedPiece, grid)) continue;
            
            // Create move sequence
            const moves = [...rotationMoves];
            
            // Add horizontal moves
            if (x < 0) {
                for (let i = 0; i > x; i--) {
                    moves.push({ type: 'left' });
                }
            } else if (x > 0) {
                for (let i = 0; i < x; i++) {
                    moves.push({ type: 'right' });
                }
            }
            
            // Add hard drop
            moves.push({ type: 'harddrop' });
            
            // Simulate the move
            const simState = simulateMove(aiState, simulatedPiece);
            
            // Evaluate the position
            const score = evaluatePosition(simState.grid, simState.linesCleared);
            
            states.push({
                moves: moves,
                score: score
            });
            
            // Check for T-spins
            if (piece.type === 'T') {
                const tSpinScore = checkTSpin(simState.grid, simulatedPiece);
                if (tSpinScore > 0) {
                    states.push({
                        moves: moves,
                        score: score + tSpinScore // Bonus for T-spin
                    });
                }
            }
        }
    }
    
    return states;
}

// Generate states for next piece
function generateNextPieceStates(currentState, nextPieceType) {
    // Create a simulated state
    const simState = {
        grid: JSON.parse(JSON.stringify(currentState.simState?.grid || [])),
        linesCleared: currentState.simState?.linesCleared || 0,
        currentPiece: {
            type: nextPieceType,
            x: 3,
            y: 0,
            rotation: 0
        }
    };
    
    // Generate moves for this piece
    const initialStates = generateInitialStates(simState);
    
    // Add previous moves to each new state
    return initialStates.map(state => ({
        moves: currentState.moves,
        score: currentState.score + state.score * 0.7, // Discount future moves
        simState: state.simState
    }));
}

// Simulate a move and return the resulting state
function simulateMove(aiState, piece) {
    // Clone the grid
    const grid = JSON.parse(JSON.stringify(aiState.grid));
    let linesCleared = aiState.linesCleared || 0;
    
    // Drop the piece to the bottom
    let dropY = piece.y;
    while (true) {
        if (!isValidPosition({...piece, y: dropY + 1}, grid)) break;
        dropY++;
    }
    
    // Lock the piece
    const shape = SHAPES[piece.type][piece.rotation];
    shape.forEach(([dx, dy]) => {
        const newY = dropY + dy;
        const newX = piece.x + dx;
        if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
            grid[newY][newX] = piece.type;
        }
    });
    
    // Clear lines
    const clearedLines = clearLinesSimulation(grid);
    linesCleared += clearedLines;
    
    return { grid, linesCleared };
}

// Check if a position is valid
function isValidPosition(piece, grid) {
    const shape = SHAPES[piece.type][piece.rotation];
    return shape.every(([dx, dy]) => {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        return (
            newX >= 0 && newX < COLS &&
            newY < ROWS &&
            (newY < 0 || grid[newY][newX] === "")
        );
    });
}

// Clear lines simulation
function clearLinesSimulation(grid) {
    let linesCount = 0;

    for (let y = ROWS - 1; y >= 0; y--) {
        if (grid[y].every(cell => cell !== "")) {
            // Remove full line and shift lines down
            for (let y2 = y; y2 > 0; y2--) {
                for (let x = 0; x < COLS; x++) {
                    grid[y2][x] = grid[y2-1][x];
                }
            }
            // Clear top line
            for (let x = 0; x < COLS; x++) {
                grid[0][x] = "";
            }
            
            linesCount++;
            y++; // Check same line again
        }
    }
    
    return linesCount;
}

// Position evaluation function
function evaluatePosition(grid, linesCleared) {
    let score = 0;
    
    // 1. Height penalty
    const heights = getColumnHeights(grid);
    const maxHeight = Math.max(...heights);
    score -= maxHeight * 0.5;
    
    // 2. Holes penalty
    const holes = countHoles(grid);
    score -= holes * 5;
    
    // 3. Bumpiness penalty (difference between adjacent columns)
    let bumpiness = 0;
    for (let i = 0; i < heights.length - 1; i++) {
        bumpiness += Math.abs(heights[i] - heights[i + 1]);
    }
    score -= bumpiness * 0.3;
    
    // 4. Complete lines bonus
    score += linesCleared * linesCleared * 10;
    
    // 5. Well creation bonus
    score += findWells(heights) * 2;
    
    // 6. Check for flat surface
    const flatness = calculateFlatness(heights);
    score += flatness * 0.5;
    
    return score;
}

// Count holes in the grid
function countHoles(grid) {
    let holes = 0;
    
    for (let x = 0; x < COLS; x++) {
        let blockFound = false;
        for (let y = 0; y < ROWS; y++) {
            if (grid[y][x] !== "") {
                blockFound = true;
            } else if (blockFound) {
                holes++;
            }
        }
    }
    
    return holes;
}

// Get heights of each column
function getColumnHeights(grid) {
    const heights = Array(COLS).fill(0);
    
    for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
            if (grid[y][x] !== "") {
                heights[x] = ROWS - y;
                break;
            }
        }
    }
    
    return heights;
}

// Find wells (good for I pieces)
function findWells(heights) {
    let wells = 0;
    
    for (let i = 0; i < heights.length; i++) {
        if (i === 0) {
            if (heights[i] + 2 <= heights[i + 1]) {
                wells++;
            }
        } else if (i === heights.length - 1) {
            if (heights[i] + 2 <= heights[i - 1]) {
                wells++;
            }
        } else {
            if (heights[i] + 2 <= heights[i - 1] && heights[i] + 2 <= heights[i + 1]) {
                wells++;
            }
        }
    }
    
    return wells;
}

// Calculate flatness of the surface
function calculateFlatness(heights) {
    const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
    const variance = heights.reduce((sum, h) => sum + Math.pow(h - avgHeight, 2), 0) / heights.length;
    return 10 - Math.sqrt(variance); // Higher is better
}

// Check for T-spin opportunities
function checkTSpin(grid, piece) {
    if (piece.type !== 'T') return 0;
    
    // Check if 3 corners are filled (T-spin condition)
    const tx = piece.x;
    const ty = piece.y;
    let cornersFilled = 0;
    
    // Define corners relative to T center
    const corners = [
        [tx - 1, ty - 1],
        [tx + 1, ty - 1],
        [tx - 1, ty + 1],
        [tx + 1, ty + 1]
    ];
    
    corners.forEach(([x, y]) => {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS || grid[y][x] !== "") {
            cornersFilled++;
        }
    });
    
    // T-spin requires at least 3 corners
    if (cornersFilled >= 3) {
        return 100; // High score for T-spin
    }
    
    return 0;
}

// Clone AI state for simulation
function cloneAIState() {
    return {
        grid: JSON.parse(JSON.stringify(ai.grid)),
        currentPiece: {...ai.currentPiece},
        nextPieces: ai.nextPieces.map(piece => ({...piece})),
        linesCleared: ai.linesCleared,
        score: ai.score
    };
}

// Restart the game
function restartGame() {
    // Hide winner banner
    document.getElementById("winnerBanner").style.display = "none";
    
    // Cancel any existing game loops
    if (player.gameLoopId !== null) {
        cancelAnimationFrame(player.gameLoopId);
        player.gameLoopId = null;
    }
    if (ai.gameLoopId !== null) {
        cancelAnimationFrame(ai.gameLoopId);
        ai.gameLoopId = null;
    }
    
    // Reset player
    player.grid = createEmptyGrid();
    player.currentPiece = null;
    player.holdPiece = null;
    player.canHold = true;
    player.bag = [];
    player.nextPieces = [];
    player.isPieceLocked = false;
    player.gravitySpeed = 500;
    player.lastDropTime = Date.now();
    player.score = 0;
    player.linesCleared = 0;
    player.isHardDrop = false;
    player.state = GAME_STATE.IDLE;
    
    // Reset AI
    ai.grid = createEmptyGrid();
    ai.currentPiece = null;
    ai.holdPiece = null;
    ai.canHold = true;
    ai.bag = [];
    ai.nextPieces = [];
    ai.isPieceLocked = false;
    ai.gravitySpeed = 100;
    ai.lastDropTime = Date.now();
    ai.score = 0;
    ai.linesCleared = 0;
    ai.isHardDrop = false;
    ai.moveDelay = 100;
    ai.lastMoveTime = Date.now();
    ai.moveQueue = [];
    ai.state = GAME_STATE.IDLE;
    
    // Reset game state
    battleStarted = false;
    
    // Start game loops
    playerGameLoop();
    aiGameLoop();
}