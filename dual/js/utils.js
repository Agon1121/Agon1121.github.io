// Utility functions for the game
const Utils = {
    // Check if the piece can move to a new position
    isValidMove: function(board, piece, offsetX = 0, offsetY = 0) {
        const { shape, x, y } = piece;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    const newX = x + col + offsetX;
                    const newY = y + row + offsetY;
                    
                    // Check if the new position is outside the board or collides with another piece
                    if (
                        newX < 0 || newX >= COLS ||
                        newY < 0 || newY >= ROWS ||
                        (newY >= 0 && board[newY][newX] !== 0)
                    ) {
                        return false;
                    }
                }
            }
        }
        return true;
    },
    
    // Rotate matrix clockwise
    rotateMatrixCW: function(matrix) {
        const N = matrix.length;
        const result = Array.from({ length: N }, () => Array(N).fill(0));
        
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                result[j][N - 1 - i] = matrix[i][j];
            }
        }
        
        return result;
    },
    
    // Rotate matrix counter-clockwise
    rotateMatrixCCW: function(matrix) {
        const N = matrix.length;
        const result = Array.from({ length: N }, () => Array(N).fill(0));
        
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                result[N - 1 - j][i] = matrix[i][j];
            }
        }
        
        return result;
    },
    
    // Rotate matrix 180 degrees
    rotateMatrix180: function(matrix) {
        const N = matrix.length;
        const result = Array.from({ length: N }, () => Array(N).fill(0));
        
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                result[N - 1 - i][N - 1 - j] = matrix[i][j];
            }
        }
        
        return result;
    },
    
    // Create a deep copy of a matrix
    cloneMatrix: function(matrix) {
        return matrix.map(row => [...row]);
    },
    
    // Generate a random tetromino index (1-7)
    getRandomTetromino: function() {
        return Math.floor(Math.random() * 7) + 1;
    },
    
    // Get wall kick data for rotation
    getWallKickData: function(pieceType, prevRotation, newRotation) {
        // We're using Super Rotation System (SRS)
        // This is a simplified version with just basic kicks
        const kicks = [
            [0, 0],
            [-1, 0],
            [1, 0],
            [0, -1],
            [-1, -1],
            [1, -1]
        ];
        
        return kicks;
    },
    
    // Calculate the drop points based on the distance
    calculateDropPoints: function(distance) {
        return distance * POINTS.HARD_DROP;
    }
};