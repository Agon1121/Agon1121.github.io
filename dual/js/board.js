class Board {
    constructor() {
        // Create an empty board (ROWS × COLS)
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        this.reset();
    }
    
    // Reset the board to empty
    reset() {
        this.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        
        // Next pieces queue (show 3 next pieces)
        this.nextPieces = [
            new Tetromino(),
            new Tetromino(),
            new Tetromino()
        ];
        
        // Current active piece
        this.piece = new Tetromino();
        
        // Held piece
        this.heldPiece = null;
        this.canHold = true;
        
        // Game state
        this.gameOver = false;
        this.paused = false;
    }
    
    // Get the next piece and generate a new one for the queue
    getNextPiece() {
        // Move the first piece from the queue
        this.piece = this.nextPieces.shift();
        
        // Add a new piece to the end of the queue
        this.nextPieces.push(new Tetromino());
        
        // Check if the new piece can be placed - if not, game over
        if (!Utils.isValidMove(this.grid, this.piece)) {
            this.gameOver = true;
        }
        
        // Reset hold swap capability
        this.canHold = true;
    }
    
    // Hold the current piece
    holdPiece() {
        if (!this.canHold) return false;
        
        const currentPiece = this.piece;
        
        if (this.heldPiece === null) {
            // If no piece is being held, get the next piece from the queue
            this.heldPiece = new Tetromino(currentPiece.type);
            this.getNextPiece();
        } else {
            // Swap current piece with held piece
            this.piece = new Tetromino(this.heldPiece.type);
            this.heldPiece = new Tetromino(currentPiece.type);
        }
        
        // Prevent holding again until a piece is placed
        this.canHold = false;
        return true;
    }
    
    // Lock the current piece into the board
    lockPiece() {
        const { shape, x, y, type } = this.piece;
        
        // Add the piece to the grid
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    this.grid[y + row][x + col] = type;
                }
            }
        }
        
        // Check for completed lines
        this.clearLines();
        
        // Get the next piece
        this.getNextPiece();
    }
    
    // Check and clear completed lines
    clearLines() {
        let linesCleared = 0;
        
        for (let row = ROWS - 1; row >= 0; row--) {
            // Check if the row is full
            if (this.grid[row].every(cell => cell !== 0)) {
                // Remove the line and add an empty line at the top
                this.grid.splice(row, 1);
                this.grid.unshift(Array(COLS).fill(0));
                linesCleared++;
                
                // Since we removed a line, we need to check the same row index again
                row++;
            }
        }
        
        // Update score based on lines cleared
        if (linesCleared > 0) {
            this.updateScore(linesCleared);
            this.updateLevel();
        }
    }
    
    // Update the score based on lines cleared
    updateScore(linesCleared) {
        switch (linesCleared) {
            case 1:
                this.score += POINTS.SINGLE * this.level;
                break;
            case 2:
                this.score += POINTS.DOUBLE * this.level;
                break;
            case 3:
                this.score += POINTS.TRIPLE * this.level;
                break;
            case 4:
                this.score += POINTS.TETRIS * this.level;
                break;
        }
        
        this.lines += linesCleared;
    }
    
    // Update the level based on lines cleared
    updateLevel() {
        this.level = Math.min(
            Math.floor(this.lines / LEVEL.LINES_PER_LEVEL) + 1,
            LEVEL.MAX_LEVEL
        );
    }
    
    // Get fall speed based on the current level
    getDropSpeed() {
        return GRAVITY[this.level] || GRAVITY[LEVEL.MAX_LEVEL];
    }
    
    // Create a deep copy of this board for AI simulation
    clone() {
        const clonedBoard = new Board();
        clonedBoard.grid = this.grid.map(row => [...row]);
        clonedBoard.score = this.score;
        clonedBoard.lines = this.lines;
        clonedBoard.level = this.level;
        
        clonedBoard.piece = this.piece ? this.piece.clone() : null;
        clonedBoard.nextPieces = this.nextPieces.map(piece => piece.clone());
        clonedBoard.heldPiece = this.heldPiece ? this.heldPiece.clone() : null;
        clonedBoard.canHold = this.canHold;
        
        clonedBoard.gameOver = this.gameOver;
        clonedBoard.paused = this.paused;
        
        return clonedBoard;
    }
}