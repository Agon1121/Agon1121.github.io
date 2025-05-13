// Utility functions for the game
const Utils = {
    // 테트로미노 가방 시스템 구현
    tetrominoBag: [],
    
    // 가방에서 다음 테트로미노를 가져옴
    getRandomTetromino: function() {
        // 가방이 비었으면 새 가방 생성
        if (this.tetrominoBag.length === 0) {
            this.refillBag();
        }
        
        // 가방에서 테트로미노 하나를 꺼냄
        return this.tetrominoBag.pop();
    },
    
    // 가방에 7개의 테트로미노를 무작위 순서로 채움
    refillBag: function() {
        // 1부터 7까지의 숫자(테트로미노 타입)를 배열에 넣음
        this.tetrominoBag = [1, 2, 3, 4, 5, 6, 7];
        
        // Fisher-Yates 알고리즘으로 배열을 섞음
        for (let i = this.tetrominoBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tetrominoBag[i], this.tetrominoBag[j]] = [this.tetrominoBag[j], this.tetrominoBag[i]];
        }
    },
    
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