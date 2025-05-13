class Renderer {
    constructor(canvasId, boardRef) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.board = boardRef;
        
        // Set canvas dimensions
        this.canvas.width = COLS * BLOCK_SIZE;
        this.canvas.height = ROWS * BLOCK_SIZE;
        
        // Preview area on the right
        this.previewX = COLS * BLOCK_SIZE + 10;
        this.previewWidth = 4 * BLOCK_SIZE;
        
        // Set up event listeners for key presses
        this.setupControls();
    }
    
    setupControls() {
        // This will be handled in the Game class
    }
    
    // Clear the canvas
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Draw the entire game state
    render() {
        this.clear();
        
        // Draw the grid background
        this.drawGrid();
        
        // Draw the board
        this.drawBoard();
        
        // Draw the current active piece
        this.drawActivePiece();
        
        // Draw ghost piece (drop preview)
        this.drawGhostPiece();
    }
    
    // Draw the grid background
    drawGrid() {
        this.ctx.strokeStyle = "#CCCCCC";
        this.ctx.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let i = 0; i <= COLS; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * BLOCK_SIZE, 0);
            this.ctx.lineTo(i * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let i = 0; i <= ROWS; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * BLOCK_SIZE);
            this.ctx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    // Draw the board with all locked pieces
    drawBoard() {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = this.board.grid[y][x];
                if (cell !== 0) {
                    this.drawBlock(x, y, COLORS[cell]);
                }
            }
        }
    }
    
    // Draw the active falling piece
    drawActivePiece() {
        const { shape, x, y, color } = this.board.piece;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    this.drawBlock(x + col, y + row, color);
                }
            }
        }
    }
    
    // Draw the ghost piece showing where the current piece would land
    drawGhostPiece() {
        const { piece, grid } = this.board;
        const ghostPiece = piece.clone();
        
        // Calculate the drop position
        while (Utils.isValidMove(grid, ghostPiece, 0, 1)) {
            ghostPiece.y++;
        }
        
        // Draw the ghost piece with transparency
        const { shape, x, y, color } = ghostPiece;
        
        this.ctx.globalAlpha = 0.3;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    this.drawBlock(x + col, y + row, color);
                }
            }
        }
        this.ctx.globalAlpha = 1.0;
    }
    
    // Draw a single block
    drawBlock(x, y, color) {
        // Don't draw blocks that are above the visible area
        if (y < 0) return;
        
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = 1;
        
        const xPos = x * BLOCK_SIZE;
        const yPos = y * BLOCK_SIZE;
        
        // Draw the filled block
        this.ctx.fillRect(xPos, yPos, BLOCK_SIZE, BLOCK_SIZE);
        
        // Draw block border
        this.ctx.strokeRect(xPos, yPos, BLOCK_SIZE, BLOCK_SIZE);
        
        // Add a highlight effect
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        this.ctx.fillRect(xPos, yPos, BLOCK_SIZE / 2, BLOCK_SIZE / 2);
    }
    
    // Draw game over message
    drawGameOver() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.font = "bold 24px Arial";
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(
            "GAME OVER",
            this.canvas.width / 2,
            this.canvas.height / 2
        );
        
        this.ctx.font = "16px Arial";
        this.ctx.fillText(
            "Press R to restart",
            this.canvas.width / 2,
            this.canvas.height / 2 + 30
        );
    }
    
    // Draw pause message
    drawPaused() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.font = "bold 24px Arial";
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(
            "PAUSED",
            this.canvas.width / 2,
            this.canvas.height / 2
        );
        
        this.ctx.font = "16px Arial";
        this.ctx.fillText(
            "Press P to resume",
            this.canvas.width / 2,
            this.canvas.height / 2 + 30
        );
    }
    
    // Update UI elements
    updateUI() {
        document.querySelector(`#${this.canvas.id.split('-')[0]}-score`).textContent = this.board.score;
        document.querySelector(`#${this.canvas.id.split('-')[0]}-lines`).textContent = this.board.lines;
        document.querySelector(`#${this.canvas.id.split('-')[0]}-level`).textContent = this.board.level;
    }
}