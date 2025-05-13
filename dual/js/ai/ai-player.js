class AIPlayer {
    constructor(depth = 3, beamWidth = 5) {
        this.depth = depth;
        this.beamWidth = beamWidth;
        this.weights = {
            heightWeight: -0.510066,
            linesWeight: 0.760666,
            holesWeight: -0.35663,
            bumpinessWeight: -0.184483,
            tSpinWeight: 0.5,
            comboWeight: 0.2,
            perfectClearWeight: 1.0
        };
        this.gravity = 1.0;
    }

    // Increase gravity over time
    updateGravity(time) {
        this.gravity = Math.min(20.0, 1.0 + time / 60000); // Increases every minute
    }

    // Main method to get next move
    getNextMove(gameState) {
        const moves = this.beamSearch(gameState);
        return moves.length > 0 ? moves[0] : null;
    }

    // Beam search implementation
    beamSearch(gameState) {
        let candidates = [{ state: gameState, moves: [], score: 0 }];
        
        for (let d = 0; d < this.depth; d++) {
            let newCandidates = [];
            
            for (let candidate of candidates) {
                const possibleMoves = this.getAllPossibleMoves(candidate.state);
                
                for (let move of possibleMoves) {
                    const newState = this.applyMove(candidate.state, move);
                    const score = this.evaluatePosition(newState);
                    
                    newCandidates.push({
                        state: newState,
                        moves: [...candidate.moves, move],
                        score: score
                    });
                }
            }
            
            // Sort and keep top beam width candidates
            candidates = newCandidates
                .sort((a, b) => b.score - a.score)
                .slice(0, this.beamWidth);
        }
        
        return candidates[0].moves;
    }

    // Evaluate board position
    evaluatePosition(state) {
        const metrics = {
            height: this.calculateHeight(state),
            lines: this.calculateCompleteLines(state),
            holes: this.calculateHoles(state),
            bumpiness: this.calculateBumpiness(state),
            tSpin: this.detectTSpin(state),
            combo: state.combo || 0,
            perfectClear: this.isPerfectClear(state)
        };

        return Object.keys(metrics).reduce((score, key) => {
            return score + (metrics[key] * this.weights[`${key}Weight`]);
        }, 0);
    }

    // T-Spin detection
    detectTSpin(state) {
        if (state.currentPiece?.type !== 'T') return 0;
        
        const corners = this.countBlockedCorners(state);
        const lastMove = state.lastMove;
        
        return (corners >= 3 && lastMove?.rotation) ? 1 : 0;
    }

    // Helper methods
    calculateHeight(state) {
        const heights = this.getColumnHeights(state);
        return Math.max(...heights);
    }

    calculateHoles(state) {
        let holes = 0;
        const heights = this.getColumnHeights(state);
        
        for (let col = 0; col < state.board[0].length; col++) {
            for (let row = state.board.length - 1; row >= state.board.length - heights[col]; row--) {
                if (!state.board[row][col]) holes++;
            }
        }
        
        return holes;
    }

    calculateBumpiness(state) {
        const heights = this.getColumnHeights(state);
        let bumpiness = 0;
        
        for (let i = 0; i < heights.length - 1; i++) {
            bumpiness += Math.abs(heights[i] - heights[i + 1]);
        }
        
        return bumpiness;
    }

    getColumnHeights(state) {
        const heights = new Array(state.board[0].length).fill(0);
        
        for (let col = 0; col < state.board[0].length; col++) {
            for (let row = 0; row < state.board.length; row++) {
                if (state.board[row][col]) {
                    heights[col] = state.board.length - row;
                    break;
                }
            }
        }
        
        return heights;
    }

    // Look ahead implementation
    predictNextPieces(state) {
        return state.nextPieces?.slice(0, this.depth) || [];
    }

    isPerfectClear(state) {
        return state.board.every(row => row.every(cell => !cell)) ? 1 : 0;
    }

    countBlockedCorners(state) {
        // Implementation for T-spin detection
        let corners = 0;
        const piece = state.currentPiece;
        if (!piece) return 0;
        
        const positions = [
            {x: piece.x - 1, y: piece.y - 1},
            {x: piece.x + 1, y: piece.y - 1},
            {x: piece.x - 1, y: piece.y + 1},
            {x: piece.x + 1, y: piece.y + 1}
        ];

        for (let pos of positions) {
            if (this.isBlocked(state, pos.x, pos.y)) corners++;
        }

        return corners;
    }

    isBlocked(state, x, y) {
        return x < 0 || x >= state.board[0].length || 
               y < 0 || y >= state.board.length ||
               state.board[y][x];
    }
}