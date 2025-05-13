// AI player for Tetris
class AIPlayer {
    constructor(board) {
        this.board = board;
        this.beamSearch = new BeamSearch(2, 4);
        this.moveDelay = 50;    // Delay between AI moves in milliseconds
        this.thinkingTime = 200; // Time to calculate next move
        
        this.nextMoveTimeout = null;
        this.isPlaying = false;
        
        // Statistics
        this.movesPlayed = 0;
    }
    
    // Start AI gameplay loop
    start() {
        this.isPlaying = true;
        this.makeNextMove();
    }
    
    // Stop AI gameplay
    stop() {
        this.isPlaying = false;
        if (this.nextMoveTimeout) {
            clearTimeout(this.nextMoveTimeout);
            this.nextMoveTimeout = null;
        }
    }
    
    // Reset AI state
    reset() {
        this.stop();
        this.movesPlayed = 0;
    }
    
    // Main AI gameplay loop
    makeNextMove() {
        if (!this.isPlaying || this.board.gameOver || this.board.paused) {
            return;
        }
        
        // Find the best move
        const bestMove = this.beamSearch.findBestMove(this.board);
        
        if (bestMove) {
            // Execute the move
            this.executeMove(bestMove);
            this.movesPlayed++;
            
            // Schedule the next move after a short delay
            this.nextMoveTimeout = setTimeout(() => {
                // Move the piece down automatically
                if (!this.board.piece.moveDown(this.board.grid)) {
                    this.board.lockPiece();
                }
                
                // Schedule the next move
                this.nextMoveTimeout = setTimeout(() => {
                    this.makeNextMove();
                }, this.thinkingTime);
            }, this.moveDelay);
        }
    }
    
    // Execute a move on the board
    executeMove(move) {
        // Set position
        this.board.piece.x = move.x;
        this.board.piece.y = move.y;
        
        // Set rotation
        const targetRotation = move.rotation;
        const currentRotation = this.board.piece.rotation;
        
        // Rotate piece to match target rotation
        while (this.board.piece.rotation !== targetRotation) {
            this.board.piece.rotateCW(this.board.grid);
        }
    }
    
    // Adjust AI difficulty by changing search parameters
    adjustDifficulty() {
        this.beamSearch = new BeamSearch(4, 8);
        this.moveDelay = 30;
        this.thinkingTime = 100;
    }
}