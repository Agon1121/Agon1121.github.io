/**
 * Renderer.js
 * Handles all rendering logic for the Tetris game
 */
class Renderer {
  constructor(canvas, isAI = false) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.isAI = isAI;
    this.initCanvas();
  }

  initCanvas() {
    // Set canvas dimensions
    this.canvas.width = COLS * BLOCK_SIZE;
    this.canvas.height = ROWS * BLOCK_SIZE;
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBackground() {
    // Draw game area background
    this.context.fillStyle = '#f8f8f8';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.context.strokeStyle = '#e0e0e0';
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        this.context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }

  drawBlock(x, y, color) {
    this.context.fillStyle = color;
    this.context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    this.context.strokeStyle = 'white';
    this.context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  }

  drawPiece(piece) {
    const shape = SHAPES[piece.type][piece.rotation];
    const color = COLORS[piece.type];
    
    shape.forEach(([dx, dy]) => {
      const x = piece.x + dx;
      const y = piece.y + dy;
      if (y >= 0) { // Only draw visible blocks
        this.drawBlock(x, y, color);
      }
    });
  }

  drawGhostPiece(piece, board) {
    if (!piece) return;
    
    // Create ghost piece (a projected shadow of where the piece will land)
    const ghostPiece = {
      type: piece.type,
      x: piece.x,
      y: piece.y,
      rotation: piece.rotation
    };
    
    // Drop ghost piece to the bottom
    while (!board.isCollision(ghostPiece, 0, 1)) {
      ghostPiece.y++;
    }
    
    // Only draw ghost if it's at a different position
    if (ghostPiece.y !== piece.y) {
      const shape = SHAPES[ghostPiece.type][ghostPiece.rotation];
      
      shape.forEach(([dx, dy]) => {
        const x = ghostPiece.x + dx;
        const y = ghostPiece.y + dy;
        
        if (y >= 0) { // Only draw visible blocks
          // Draw ghost block with lower opacity
          this.context.strokeStyle = "rgba(54, 54, 54, 0.25)";
          this.context.lineWidth = 2;
          this.context.strokeRect(x * BLOCK_SIZE + 3, y * BLOCK_SIZE + 3, BLOCK_SIZE - 6, BLOCK_SIZE - 6);
          this.context.lineWidth = 1;
          
          this.context.fillStyle = "rgba(54, 54, 54, 0.25)";
          this.context.fillRect(x * BLOCK_SIZE + 3, y * BLOCK_SIZE + 3, BLOCK_SIZE - 6, BLOCK_SIZE - 6);
        }
      });
    }
  }

  drawBoard(board) {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = board.grid[y][x];
        if (cell) {
          this.drawBlock(x, y, COLORS[cell]);
        }
      }
    }
  }

  drawHoldPiece(holdPiece) {
    // Draw hold area frame (outside the canvas)
    if (!this.holdContext) {
      const holdCanvas = document.createElement('canvas');
      holdCanvas.width = 4 * BLOCK_SIZE;
      holdCanvas.height = 3 * BLOCK_SIZE;
      holdCanvas.className = 'hold-canvas';
      holdCanvas.style.position = 'absolute';
      holdCanvas.style.top = '35px';
      holdCanvas.style.left = this.isAI ? '-100px' : '-100px';
      this.canvas.parentNode.appendChild(holdCanvas);
      this.holdContext = holdCanvas.getContext('2d');
    }

    // Clear hold area
    this.holdContext.clearRect(0, 0, 4 * BLOCK_SIZE, 3 * BLOCK_SIZE);
    this.holdContext.fillStyle = '#f0f0f0';
    this.holdContext.fillRect(0, 0, 4 * BLOCK_SIZE, 3 * BLOCK_SIZE);
    this.holdContext.strokeStyle = 'black';
    this.holdContext.strokeRect(0, 0, 4 * BLOCK_SIZE, 3 * BLOCK_SIZE);
    
    // Draw HOLD text
    this.holdContext.fillStyle = 'black';
    this.holdContext.font = '14px Arial';
    this.holdContext.fillText('HOLD', 1.5 * BLOCK_SIZE - 15, 18);
    
    // Draw hold piece if exists
    if (holdPiece) {
      const shape = SHAPES[holdPiece.type][0]; // Always use first rotation
      
      // Center the piece
      let offsetX, offsetY;
      if (holdPiece.type === 'O') {
        offsetX = 1 * BLOCK_SIZE;
        offsetY = 1 * BLOCK_SIZE;
      } else if (holdPiece.type === 'I') {
        offsetX = 0.5 * BLOCK_SIZE;
        offsetY = 1.2 * BLOCK_SIZE;
      } else {
        offsetX = 1 * BLOCK_SIZE;
        offsetY = 1 * BLOCK_SIZE;
      }
      
      shape.forEach(([dx, dy]) => {
        this.holdContext.fillStyle = COLORS[holdPiece.type];
        this.holdContext.fillRect(
          dx * BLOCK_SIZE * 0.8 + offsetX, 
          dy * BLOCK_SIZE * 0.8 + offsetY, 
          BLOCK_SIZE * 0.8, 
          BLOCK_SIZE * 0.8
        );
        this.holdContext.strokeStyle = 'white';
        this.holdContext.strokeRect(
          dx * BLOCK_SIZE * 0.8 + offsetX, 
          dy * BLOCK_SIZE * 0.8 + offsetY, 
          BLOCK_SIZE * 0.8, 
          BLOCK_SIZE * 0.8
        );
      });
    }
  }

  drawNextPieces(nextPieces) {
    // Draw next pieces area (outside the canvas)
    if (!this.nextContext) {
      const nextCanvas = document.createElement('canvas');
      nextCanvas.width = 4 * BLOCK_SIZE;
      nextCanvas.height = 12 * BLOCK_SIZE;
      nextCanvas.className = 'next-canvas';
      nextCanvas.style.position = 'absolute';
      nextCanvas.style.top = '35px';
      nextCanvas.style.right = this.isAI ? '-100px' : '-100px';
      this.canvas.parentNode.appendChild(nextCanvas);
      this.nextContext = nextCanvas.getContext('2d');
    }

    // Clear next area
    this.nextContext.clearRect(0, 0, 4 * BLOCK_SIZE, 12 * BLOCK_SIZE);
    this.nextContext.fillStyle = '#f0f0f0';
    this.nextContext.fillRect(0, 0, 4 * BLOCK_SIZE, 12 * BLOCK_SIZE);
    this.nextContext.strokeStyle = 'black';
    this.nextContext.strokeRect(0, 0, 4 * BLOCK_SIZE, 12 * BLOCK_SIZE);
    
    // Draw NEXT text
    this.nextContext.fillStyle = 'black';
    this.nextContext.font = '14px Arial';
    this.nextContext.fillText('NEXT', 1.5 * BLOCK_SIZE - 15, 18);
    
    // Draw next pieces (up to 3)
    const numPiecesToShow = Math.min(nextPieces.length, 3);
    for (let i = 0; i < numPiecesToShow; i++) {
      const piece = nextPieces[i];
      const shape = SHAPES[piece.type][0]; // Always use first rotation
      
      // Center the piece
      let offsetX, offsetY;
      if (piece.type === 'O') {
        offsetX = 1 * BLOCK_SIZE;
        offsetY = (i * 4 + 1) * BLOCK_SIZE;
      } else if (piece.type === 'I') {
        offsetX = 0.5 * BLOCK_SIZE;
        offsetY = (i * 4 + 1.2) * BLOCK_SIZE;
      } else {
        offsetX = 1 * BLOCK_SIZE;
        offsetY = (i * 4 + 1) * BLOCK_SIZE;
      }
      
      shape.forEach(([dx, dy]) => {
        this.nextContext.fillStyle = COLORS[piece.type];
        this.nextContext.fillRect(
          dx * BLOCK_SIZE * 0.8 + offsetX, 
          dy * BLOCK_SIZE * 0.8 + offsetY, 
          BLOCK_SIZE * 0.8, 
          BLOCK_SIZE * 0.8
        );
        this.nextContext.strokeStyle = 'white';
        this.nextContext.strokeRect(
          dx * BLOCK_SIZE * 0.8 + offsetX, 
          dy * BLOCK_SIZE * 0.8 + offsetY, 
          BLOCK_SIZE * 0.8, 
          BLOCK_SIZE * 0.8
        );
      });
    }
  }

  drawGameInfo(score, linesCleared, level, gameState) {
    // Update HTML elements
    const scoreElement = this.isAI ? document.getElementById('ai-score') : document.getElementById('player-score');
    const linesElement = this.isAI ? document.getElementById('ai-lines') : document.getElementById('player-lines');
    const levelElement = this.isAI ? document.getElementById('ai-level') : document.getElementById('player-level');
    
    scoreElement.textContent = score;
    linesElement.textContent = linesCleared;
    levelElement.textContent = level;

    // If game is over, draw game over message
    if (gameState === 'gameover') {
      this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.context.fillStyle = 'white';
      this.context.font = 'bold 24px Arial';
      this.context.textAlign = 'center';
      this.context.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
      this.context.textAlign = 'start';
    } else if (gameState === 'paused') {
      this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.context.fillStyle = 'white';
      this.context.font = 'bold 24px Arial';
      this.context.textAlign = 'center';
      this.context.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
      this.context.textAlign = 'start';
    }
  }

  // Method to highlight recent line clears or combos
  highlightLines(lines, comboCount) {
    if (lines.length === 0) return;
    
    // First, draw a flash effect on cleared lines
    this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    lines.forEach(y => {
      this.context.fillRect(0, y * BLOCK_SIZE, COLS * BLOCK_SIZE, BLOCK_SIZE);
    });
    
    // Draw combo text if applicable
    if (comboCount > 1) {
      this.context.fillStyle = 'rgba(255, 50, 50, 0.9)';
      this.context.font = 'bold 20px Arial';
      this.context.textAlign = 'center';
      this.context.fillText(
        `${comboCount}x COMBO!`, 
        this.canvas.width / 2, 
        (lines[lines.length - 1] * BLOCK_SIZE) + 40
      );
      this.context.textAlign = 'start';
    }
    
    // Special effects for Tetris (4 lines)
    if (lines.length === 4) {
      this.context.fillStyle = 'rgba(255, 215, 0, 0.7)';
      this.context.font = 'bold 24px Arial';
      this.context.textAlign = 'center';
      this.context.fillText('TETRIS!', this.canvas.width / 2, this.canvas.height / 2);
      this.context.textAlign = 'start';
    }
  }

  // Method to highlight T-Spins
  highlightTSpin(tSpinType, linesCleared) {
    if (!tSpinType || tSpinType === 'none') return;
    
    let text = '';
    if (tSpinType === 'mini') {
      text = linesCleared === 0 ? 'MINI T-SPIN' : `MINI T-SPIN ${this.getLineClearText(linesCleared)}`;
    } else { // normal
      text = linesCleared === 0 ? 'T-SPIN' : `T-SPIN ${this.getLineClearText(linesCleared)}`;
    }
    
    this.context.fillStyle = 'rgba(128, 0, 128, 0.8)';
    this.context.font = 'bold 20px Arial';
    this.context.textAlign = 'center';
    this.context.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
    this.context.textAlign = 'start';
  }

  getLineClearText(lines) {
    switch(lines) {
      case 1: return 'SINGLE';
      case 2: return 'DOUBLE';
      case 3: return 'TRIPLE';
      case 4: return 'TETRIS';
      default: return '';
    }
  }

  // Master render method that draws everything
  render(gameState) {
    const { 
      board, 
      currentPiece, 
      holdPiece, 
      nextPieces, 
      score, 
      linesCleared, 
      level, 
      state,
      lastClearedLines,
      comboCount,
      lastTSpinType
    } = gameState;
    
    this.clearCanvas();
    this.drawBackground();
    this.drawBoard(board);
    
    if (currentPiece) {
      this.drawGhostPiece(currentPiece, board);
      this.drawPiece(currentPiece);
    }
    
    this.drawHoldPiece(holdPiece);
    this.drawNextPieces(nextPieces);
    this.drawGameInfo(score, linesCleared, level, state);
    
    // Highlight effects if needed
    if (lastClearedLines && lastClearedLines.length > 0) {
      this.highlightLines(lastClearedLines, comboCount);
    }
    
    if (lastTSpinType && lastTSpinType !== 'none') {
      this.highlightTSpin(lastTSpinType, lastClearedLines ? lastClearedLines.length : 0);
    }
  }
}