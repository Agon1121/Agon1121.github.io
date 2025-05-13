class TetrisEvaluator {
    constructor() {
        // Weights for different evaluation metrics
        this.weights = {
            heightWeight: -0.510066,
            linesWeight: 0.760666,
            holesWeight: -0.35663,
            bumpinessWeight: -0.184483,
            tSpinWeight: 0.95,
            comboWeight: 0.2,
            wellWeight: 0.34,
        };
    }

    // Main evaluation function
    evaluate(board, moveInfo) {
        const aggregateHeight = this.getAggregateHeight(board);
        const completedLines = this.getCompletedLines(board);
        const holes = this.getHoles(board);
        const bumpiness = this.getBumpiness(board);
        const tSpinScore = this.evaluateTSpin(board, moveInfo);
        const comboScore = moveInfo.combo * this.weights.comboWeight;
        const wellScore = this.evaluateWell(board);

        // Combine all metrics with their weights
        return (
            this.weights.heightWeight * aggregateHeight +
            this.weights.linesWeight * completedLines +
            this.weights.holesWeight * holes +
            this.weights.bumpinessWeight * bumpiness +
            this.weights.tSpinWeight * tSpinScore +
            comboScore +
            this.weights.wellWeight * wellScore
        );
    }

    // Get total height of all columns
    getAggregateHeight(board) {
        let total = 0;
        for (let col = 0; col < board[0].length; col++) {
            total += this.getColumnHeight(board, col);
        }
        return total;
    }

    // Get height of a specific column
    getColumnHeight(board, col) {
        for (let row = 0; row < board.length; row++) {
            if (board[row][col]) return board.length - row;
        }
        return 0;
    }

    // Count completed lines
    getCompletedLines(board) {
        let lines = 0;
        for (let row = 0; row < board.length; row++) {
            if (board[row].every(cell => cell)) lines++;
        }
        return lines;
    }

    // Count holes (empty cells with filled cells above)
    getHoles(board) {
        let holes = 0;
        for (let col = 0; col < board[0].length; col++) {
            let blockFound = false;
            for (let row = 0; row < board.length; row++) {
                if (board[row][col]) {
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
        let bumpiness = 0;
        for (let col = 0; col < board[0].length - 1; col++) {
            bumpiness += Math.abs(
                this.getColumnHeight(board, col) - 
                this.getColumnHeight(board, col + 1)
            );
        }
        return bumpiness;
    }

    // Evaluate T-Spin potential
    evaluateTSpin(board, moveInfo) {
        if (!moveInfo.isTSpin) return 0;
        return moveInfo.linesCleared * 2; // Bonus for T-Spin lines
    }

    // Evaluate well formations (columns with deep gaps)
    evaluateWell(board) {
        let wellScore = 0;
        for (let col = 0; col < board[0].length; col++) {
            let wellDepth = 0;
            let isWell = true;
            
            for (let row = board.length - 1; row >= 0; row--) {
                if (!board[row][col] && isWell) {
                    if (this.isWellColumn(board, row, col)) {
                        wellDepth++;
                    } else {
                        isWell = false;
                    }
                }
            }
            wellScore += wellDepth * (wellDepth + 1) / 2;
        }
        return wellScore;
    }

    // Helper function to check if a position forms a well
    isWellColumn(board, row, col) {
        if (col === 0) {
            return col + 1 < board[0].length && board[row][col + 1];
        } else if (col === board[0].length - 1) {
            return board[row][col - 1];
        }
        return board[row][col - 1] && board[row][col + 1];
    }
}

// Export the evaluator
export default TetrisEvaluator;