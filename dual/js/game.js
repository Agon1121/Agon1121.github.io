// Game class to manage game state and controls
class Game {
    constructor() {
        // 공유 가방을 위한 Utils 초기화
        Utils.refillBag();
        
        // Create player board and renderer
        this.playerBoard = new Board();
        this.playerRenderer = new Renderer('player-canvas', this.playerBoard);
        
        // Create AI board and renderer
        this.aiBoard = new Board();
        this.aiRenderer = new Renderer('ai-canvas', this.aiBoard);
        
        // Create AI player
        this.aiPlayer = new AIPlayer(this.aiBoard);
        this.aiPlayer.adjustDifficulty();
        
        // Game timers
        this.playerDropInterval = null;
        this.lastTime = 0;
        this.dropCounter = 0;
        
        // Control states
        this.keyState = {};
        
        // Set up event listeners
        this.setupInputHandlers();
        
        // Start the game
        this.start();
    }
    
    // Start both player and AI games
    start() {
        // 새 게임 시작시 가방 시스템 리셋
        Utils.refillBag();
        
        // Reset boards
        this.playerBoard.reset();
        this.aiBoard.reset();
        
        // Clear any existing intervals
        if (this.playerDropInterval) {
            cancelAnimationFrame(this.playerDropInterval);
        }
        
        // Start the game loop
        this.lastTime = 0;
        this.update();
        
        // Start the AI player
        this.aiPlayer.start();
    }
    
    // Set up keyboard handlers
    setupInputHandlers() {
        // Keydown handler
        document.addEventListener('keydown', (e) => {
            if (this.playerBoard.gameOver) {
                if (e.key === 'r' || e.key === 'R') {
                    this.start();
                }
                return;
            }
            
            if (this.playerBoard.paused) {
                if (e.key === 'p' || e.key === 'P') {
                    this.playerBoard.paused = false;
                    this.aiBoard.paused = false;
                    this.aiPlayer.start();
                    this.update();
                }
                return;
            }
            
            // Store key state
            this.keyState[e.key] = true;
            
            switch (e.key) {
                case 'ArrowLeft':
                    this.playerBoard.piece.moveLeft(this.playerBoard.grid);
                    break;
                case 'ArrowRight':
                    this.playerBoard.piece.moveRight(this.playerBoard.grid);
                    break;
                case 'ArrowDown':
                    // Soft drop - move down and add points
                    if (this.playerBoard.piece.moveDown(this.playerBoard.grid)) {
                        this.playerBoard.score += POINTS.SOFT_DROP;
                    }
                    break;
                case 'ArrowUp':
                    this.playerBoard.piece.rotateCW(this.playerBoard.grid);
                    break;
                case 'z':
                case 'Z':
                    this.playerBoard.piece.rotateCCW(this.playerBoard.grid);
                    break;
                case 'a':
                case 'A':
                    this.playerBoard.piece.rotate180(this.playerBoard.grid);
                    break;
                case ' ':
                    // Hard drop - move to the bottom instantly
                    const dropDistance = this.playerBoard.piece.hardDrop(this.playerBoard.grid);
                    this.playerBoard.score += POINTS.HARD_DROP * dropDistance;
                    this.playerBoard.lockPiece();
                    break;
                case 'c':
                case 'C':
                    // Hold piece
                    this.playerBoard.holdPiece();
                    break;
                case 'p':
                case 'P':
                    // Pause game
                    this.playerBoard.paused = true;
                    this.aiBoard.paused = true;
                    this.aiPlayer.stop();
                    
                    // Draw pause screen
                    this.playerRenderer.drawPaused();
                    this.aiRenderer.drawPaused();
                    break;
                case 'r':
                case 'R':
                    // Restart game
                    this.start();
                    break;
            }
            
            // Prevent default action for game controls
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        // Keyup handler
        document.addEventListener('keyup', (e) => {
            this.keyState[e.key] = false;
        });
    }
    
    // Main game update loop
    update(time = 0) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        // Update player's board if not game over or paused
        if (!this.playerBoard.gameOver && !this.playerBoard.paused) {
            // Handle automatic falling
            this.dropCounter += deltaTime;
            
            if (this.dropCounter > this.playerBoard.getDropSpeed()) {
                this.playerBoard.piece.moveDown(this.playerBoard.grid);
                this.dropCounter = 0;
                
                // If piece can't move down, lock it in place
                if (!this.playerBoard.piece.moveDown(this.playerBoard.grid)) {
                    this.playerBoard.lockPiece();
                    
                    // Move back up
                    this.playerBoard.piece.y--;
                }
            }
            
            // Handle continuous soft drop if ArrowDown is held
            if (this.keyState['ArrowDown']) {
                if (this.playerBoard.piece.moveDown(this.playerBoard.grid)) {
                    this.playerBoard.score += POINTS.SOFT_DROP;
                }
            }
            
            // Render both games
            this.playerRenderer.render();
            this.playerRenderer.updateUI();
        } else if (this.playerBoard.gameOver) {
            this.playerRenderer.drawGameOver();
        }
        
        // Render AI game regardless of player's state
        if (!this.aiBoard.gameOver) {
            this.aiRenderer.render();
            this.aiRenderer.updateUI();
        } else {
            this.aiRenderer.drawGameOver();
        }
        
        // Continue the game loop
        this.playerDropInterval = requestAnimationFrame(this.update.bind(this));
    }
}