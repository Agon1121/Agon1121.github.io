// AI Beam Search algorithm for finding optimal moves
class BeamSearch {
    constructor(depth = 2, width = 4) {
        this.evaluator = new Evaluator();
        this.depth = depth;      // How many pieces to look ahead
        this.width = width;      // How many top moves to keep at each step
    }
    
    // Find the best move for the current piece
    findBestMove(board) {
        // Start with the current board state
        const initialState = this.createState(board);
        
        // Get all possible moves for the current piece
        const possibleMoves = this.getAllPossibleMoves(initialState.board);
        
        if (possibleMoves.length === 0) {
            return null;
        }
        
        // Evaluate all moves
        const evaluatedMoves = possibleMoves.map(move => {
            const boardCopy = board.clone();
            
            // Apply the move
            boardCopy.piece.x = move.x;
            boardCopy.piece.y = move.y;
            boardCopy.piece.shape = move.shape;
            
            // Lock the piece and update the board
            boardCopy.lockPiece();
            
            // Calculate score
            const score = this.evaluator.evaluate(boardCopy);
            
            return {
                move,
                score,
                boardAfter: boardCopy
            };
        });
        
        // Sort by score (descending)
        evaluatedMoves.sort((a, b) => b.score - a.score);
        
        // Return the move with the highest score
        return evaluatedMoves[0].move;
    }
    
    // Create a state object for the search
    createState(board) {
        return {
            board: board.clone(),
            score: 0,
            moves: []
        };
    }
    
    // Get all possible moves for the current piece
    getAllPossibleMoves(board) {
        const moves = [];
        const piece = board.piece;
        
        // For each rotation (0, 90, 180, 270 degrees)
        for (let rotation = 0; rotation < 4; rotation++) {
            const rotatedPiece = piece.clone();
            
            // Apply rotation
            for (let r = 0; r < rotation; r++) {
                const originalShape = rotatedPiece.shape;
                rotatedPiece.shape = Utils.rotateMatrixCW(originalShape);
            }
            
            // For each possible x position
            for (let x = -rotatedPiece.shape[0].length + 1; x < COLS; x++) {
                const movedPiece = rotatedPiece.clone();
                movedPiece.x = x;
                movedPiece.y = 0;
                
                // Check if the position is valid
                if (Utils.isValidMove(board.grid, movedPiece)) {
                    // Find the landing y position
                    let y = 0;
                    while (Utils.isValidMove(board.grid, movedPiece, 0, 1)) {
                        y++;
                        movedPiece.y = y;
                    }
                    
                    // Add this move to the list
                    moves.push({
                        x: x,
                        y: y,
                        shape: Utils.cloneMatrix(rotatedPiece.shape),
                        rotation: rotation
                    });
                }
            }
        }
        
        return moves;
    }
}