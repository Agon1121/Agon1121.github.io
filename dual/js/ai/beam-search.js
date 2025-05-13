class BeamSearch {
    constructor(gameState, depth = 3, beamWidth = 10) {
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

    // Beam search algorithm
    findBestMove(gameState, pieces) {
        let candidates = [{ state: gameState, moves: [], score: 0 }];
        
        // Look ahead for the next few pieces
        for (let d = 0; d < this.depth; d++) {
            let nextCandidates = [];
            
            for (let candidate of candidates) {
                let possibleMoves = this.generatePossibleMoves(candidate.state, pieces[d]);
                
                for (let move of possibleMoves) {
                    let newState = this.simulateMove(candidate.state, move);
                    let moveScore = this.evaluatePosition(newState);
                    
                    // Add combo and T-spin bonuses
                    moveScore += this.evaluateCombo(newState) * this.weights.comboWeight;
                    moveScore += this.detectTSpin(newState, move) * this.weights.tSpinWeight;
                    
                    nextCandidates.push({
                        state: newState,
                        moves: [...candidate.moves, move],
                        score: candidate.score + moveScore
                    });
                }
            }
            
            // Keep only the best candidates according to beam width
            candidates = this.selectBestCandidates(nextCandidates);
        }
        
        // Return the first move of the best sequence
        return candidates[0].moves[0];
    }

    // Evaluate board position
    evaluatePosition(state) {
        return this.weights.heightWeight * this.getAggregateHeight(state) +
               this.weights.linesWeight * this.getCompleteLines(state) +
               this.weights.holesWeight * this.getHoles(state) +
               this.weights.bumpinessWeight * this.getBumpiness(state);
    }

    // Helper methods
    detectTSpin(state, move) {
        // T-spin detection logic
        // Returns 1 if T-spin, 0 otherwise
        if (move.piece.type !== 'T') {
            return 0;
        }

        // Check if the last move was a rotation
        if (!move.isRotation) {
            return 0;
        }

        // Count blocked corners
        let corners = 0;
        let x = move.finalX;
        let y = move.finalY;
        
        // Check all 4 corners around T piece
        if (state.isOccupied(x - 1, y - 1) || y - 1 < 0 || x - 1 < 0) corners++;
        if (state.isOccupied(x + 1, y - 1) || y - 1 < 0 || x + 1 >= state.width) corners++;
        if (state.isOccupied(x - 1, y + 1) || y + 1 >= state.height || x - 1 < 0) corners++;
        if (state.isOccupied(x + 1, y + 1) || y + 1 >= state.height || x + 1 >= state.width) corners++;

        // T-spin requires at least 3 corners to be blocked
        return corners >= 3 ? 1 : 0;
        }

        evaluateCombo(state) {
        return state.combo || 0;
        }

        getAggregateHeight(state) {
        let total = 0;
        for (let x = 0; x < state.width; x++) {
            total += state.getColumnHeight(x);
        }
        return total;
        }

        getCompleteLines(state) {
        return state.getCompletedLines().length;
        }

        getHoles(state) {
        let holes = 0;
        for (let x = 0; x < state.width; x++) {
            let blockFound = false;
            for (let y = state.height - 1; y >= 0; y--) {
            if (state.isOccupied(x, y)) {
                blockFound = true;
            } else if (blockFound) {
                holes++;
            }
            }
        }
        return holes;
        }

        getBumpiness(state) {
        let bumpiness = 0;
        for (let x = 0; x < state.width - 1; x++) {
            bumpiness += Math.abs(state.getColumnHeight(x) - state.getColumnHeight(x + 1));
        }
        return bumpiness;
        }

        generatePossibleMoves(state, piece) {
        // Implementation depends on your game's move generation system
        return state.getPossibleMoves(piece);
        }

        simulateMove(state, move) {
        // Create a copy of the state and apply the move
        let newState = state.clone();
        newState.applyMove(move);
        return newState;
        }

        selectBestCandidates(candidates) {
        return candidates
            .sort((a, b) => b.score - a.score)
            .slice(0, this.beamWidth);
        }
    }
    