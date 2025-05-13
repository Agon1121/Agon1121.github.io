// Tetris AI - Board state evaluator
class Evaluator {
    constructor() {
        // Weights for different evaluation features
        this.weights = {
            heightWeight: -0.510066,  // Total height of all columns
            linesWeight: 0.760666,    // Number of lines cleared
            holesWeight: -0.35663,    // Number of empty cells with filled cells above
            bumpinessWeight: -0.184483, // Sum of height differences between adjacent columns
            wellsWeight: -0.3,        // Deep wells can be useful for Tetris clears
            clearedWeight: 0.5,       // Clear lines bonus
            heightVarianceWeight: -0.2, // Variance of heights (prefer flat surface)
            blockedCellsWeight: -0.2, // Cells which have a block above them
            centerWeight: 0.02        // Prefer pieces close to center
        };
    }
    
    // Evaluate a board state and return a score
    evaluate(board) {
        const aggregateHeight = this.getAggregateHeight(board);
        const completedLines = this.getCompletedLines(board);
        const holes = this.getHoles(board);
        const bumpiness = this.getBumpiness(board);
        const wells = this.getWells(board);
        const heightVariance = this.getHeightVariance(board);
        const blockedCells = this.getBlockedCells(board);
        const centerScore = this.getCenterScore(board);
        
        // Calculate final score using weights
        return (
            this.weights.heightWeight * aggregateHeight +
            this.weights.linesWeight * completedLines +
            this.weights.holesWeight * holes +
            this.weights.bumpinessWeight * bumpiness +
            this.weights.wellsWeight * wells +
            this.weights.heightVarianceWeight * heightVariance +
            this.weights.blockedCellsWeight * blockedCells +
            this.weights.centerWeight * centerScore
        );
    }
    
    // Get the sum of heights of all columns
    getAggregateHeight(board) {
        let total = 0;
        const heights = this.getColumnHeights(board);
        
        for (let i = 0; i < heights.length; i++) {
            total += heights[i];
        }
        
        return total;
    }
    
    // Get heights of each column
    getColumnHeights(board) {
        const heights = [];
        
        for (let col = 0; col < COLS; col++) {
            let height = 0;
            for (let row = 0; row < ROWS; row++) {
                if (board.grid[row][col] !== 0) {
                    height = ROWS - row;
                    break;
                }
            }
            heights.push(height);
        }
        
        return heights;
    }
    
    // Get number of completed lines
    getCompletedLines(board) {
        let lines = 0;
        
        for (let row = 0; row < ROWS; row++) {
            if (board.grid[row].every(cell => cell !== 0)) {
                lines++;
            }
        }
        
        return lines;
    }
    
    // Count the number of holes (empty cells with filled cells above)
    getHoles(board) {
        let holes = 0;
        
        for (let col = 0; col < COLS; col++) {
            let blockFound = false;
            for (let row = 0; row < ROWS; row++) {
                if (board.grid[row][col] !== 0) {
                    blockFound = true;
                } else if (blockFound) {
                    holes++;
                }
            }
        }
        
        return holes;
    }
    
    // Calculate bumpiness (sum of height differences between adjacent columns)
    getBumpiness(board) {
        const heights = this.getColumnHeights(board);
        let bumpiness = 0;
        
        for (let i = 0; i < heights.length - 1; i++) {
            bumpiness += Math.abs(heights[i] - heights[i + 1]);
        }
        
        return bumpiness;
    }
    
    // Calculate wells (deep holes)
    getWells(board) {
        const heights = this.getColumnHeights(board);
        let wells = 0;
        
        // Check first column
        if (heights[0] < heights[1] - 1) {
            wells += heights[1] - heights[0] - 1;
        }
        
        // Check middle columns
        for (let i = 1; i < heights.length - 1; i++) {
            const leftDiff = heights[i - 1] - heights[i];
            const rightDiff = heights[i + 1] - heights[i];
            
            if (leftDiff > 1 && rightDiff > 1) {
                wells += Math.min(leftDiff, rightDiff) - 1;
            }
        }
        
        // Check last column
        if (heights[heights.length - 1] < heights[heights.length - 2] - 1) {
            wells += heights[heights.length - 2] - heights[heights.length - 1] - 1;
        }
        
        return wells;
    }
    
    // Calculate height variance
    getHeightVariance(board) {
        const heights = this.getColumnHeights(board);
        const mean = heights.reduce((sum, h) => sum + h, 0) / heights.length;
        
        let variance = 0;
        for (let i = 0; i < heights.length; i++) {
            variance += Math.pow(heights[i] - mean, 2);
        }
        
        return variance / heights.length;
    }
    
    // Count blocked cells (empty cells with a block above)
    getBlockedCells(board) {
        let blocked = 0;
        
        for (let col = 0; col < COLS; col++) {
            for (let row = ROWS - 2; row >= 0; row--) {
                if (board.grid[row][col] === 0 && board.grid[row + 1][col] !== 0) {
                    blocked++;
                }
            }
        }
        
        return blocked;
    }
    
    // Calculate center score (prefer pieces close to center)
    getCenterScore(board) {
        if (!board.piece) return 0;
        
        const centerX = COLS / 2;
        const pieceX = board.piece.x + board.piece.shape[0].length / 2;
        const distance = Math.abs(centerX - pieceX);
        
        return -distance;  // Negative because closer to center is better
    }
}