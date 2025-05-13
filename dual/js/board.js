/**
 * board.js
 * Handles the Tetris game board and game state
 */

class Board {
  /**
   * Create a new Tetris board
   * @param {boolean} isAI - Whether this board is controlled by AI
   */
  constructor(isAI = false) {
    this.grid = this.createEmptyGrid();
    this.currentPiece = null;
    this.holdPiece = null;
    this.canHold = true;
    this.bag = [];
    this.nextPieces = [];
    this.score = 0;
    this.linesCleared = 0;
    this.level = 1;
    this.combo = 0;
    this.backToBack = false;
    this.isGameOver = false;
    this.gravitySpeed = INITIAL_GRAVITY;
    this.lastDropTime = Date.now();
    this.isAI = isAI;
    this.lockDelayTimer = null;
    
    // Fill the queue
    this.refillQueue();
  }

  /**
   * Create an empty grid
   */
  createEmptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(""));
  }

  /**
   * Refill the next pieces queue
   */
  refillQueue() {
    while (this.nextPieces.length < NEXT_PIECES_COUNT) {
      if (this.bag.length === 0) {
        this.bag = Object.keys(SHAPES).sort(() => Math.random() - 0.5);
      }
      const type = this.bag.pop();
      this.nextPieces.push(new Tetromino(type));
    }
  }

  /**
   * Spawn a new tetromino
   */
  spawnPiece() {
    this.refillQueue();
    this.currentPiece = this.nextPieces.shift();
    
    // Reset lock delay properties
    if (this.lockDelayTimer) {
      clearTimeout(this.lockDelayTimer);
      this.lockDelayTimer = null;
    }
    
    // Reset hold ability
    this.canHold = true;
    
    // Check for game over
    if (this.currentPiece.isColliding(this.grid)) {
      this.isGameOver = true;
      return false;
    }
    
    return true;
  }

  /**
   * Process a hard drop
   * @returns {number} Number of cells dropped
   */
  hardDrop() {
    if (!this.currentPiece) return 0;
    
    const dropDistance = this.currentPiece.getDropDistance(this.grid);
    this.currentPiece.move(0, dropDistance, this.grid);
    
    // Lock piece immediately
    this.lockPiece();
    
    // Return drop distance for scoring
    return dropDistance;
  }

  /**
   * Move current piece down
   * @returns {boolean} True if moved, false if locked or couldn't move
   */
  movePieceDown() {
    if (!this.currentPiece || this.isGameOver) return false;
    
    if (!this.currentPiece.move(0, 1, this.grid)) {
      // Couldn't move down, start lock process
      this.startLockDelay();
      return false;
    }
    
    return true;
  }

  /**
   * Move current piece left
   * @returns {boolean} True if moved
   */
  movePieceLeft() {
    if (!this.currentPiece || this.isGameOver) return false;
    return this.currentPiece.move(-1, 0, this.grid);
  }

  /**
   * Move current piece right
   * @returns {boolean} True if moved
   */
  movePieceRight() {
    if (!this.currentPiece || this.isGameOver) return false;
    return this.currentPiece.move(1, 0, this.grid);
  }

  /**
   * Rotate piece clockwise
   * @returns {boolean} True if rotated
   */
  rotatePieceClockwise() {
    if (!this.currentPiece || this.isGameOver) return false;
    const success = this.currentPiece.rotateClockwise(this.grid);
    
    // Reset lock delay if piece is at bottom and rotation succeeded
    if (success && this.currentPiece.isAtBottom(this.grid)) {
      this.resetLockDelay();
    }
    
    return success;
  }

  /**
   * Rotate piece counter-clockwise
   * @returns {boolean} True if rotated
   */
  rotatePieceCounterClockwise() {
    if (!this.currentPiece || this.isGameOver) return false;
    const success = this.currentPiece.rotateCounterClockwise(this.grid);
    
    // Reset lock delay if piece is at bottom and rotation succeeded
    if (success && this.currentPiece.isAtBottom(this.grid)) {
      this.resetLockDelay();
    }
    
    return success;
  }

  /**
   * Rotate piece 180 degrees
   * @returns {boolean} True if rotated
   */
  rotatePiece180() {
    if (!this.currentPiece || this.isGameOver) return false;
    const success = this.currentPiece.rotate180(this.grid);
    
    // Reset lock delay if piece is at bottom and rotation succeeded
    if (success && this.currentPiece.isAtBottom(this.grid)) {
      this.resetLockDelay();
    }
    
    return success;
  }

  /**
   * Start the lock delay timer
   */
  startLockDelay() {
    // If already in lock delay, don't restart
    if (this.lockDelayTimer) return;
    
    this.lockDelayTimer = setTimeout(() => {
      this.lockPiece();
    }, LOCK_DELAY);
  }

  /**
   * Reset the lock delay if possible
   */
  resetLockDelay() {
    // Only reset if we have moves left and the piece is at the bottom
    if (this.currentPiece.moveResetCount < MAX_MOVE_RESETS &&
        this.currentPiece.isAtBottom(this.grid)) {
      
      if (this.lockDelayTimer) {
        clearTimeout(this.lockDelayTimer);
        this.lockDelayTimer = setTimeout(() => {
          this.lockPiece();
        }, LOCK_DELAY);
      }
      
      this.currentPiece.moveResetCount++;
    }
  }

  /**
   * Lock the current piece into the grid
   */
  lockPiece() {
    if (!this.currentPiece || this.isGameOver) return;
    
    // Clear lock timer
    if (this.lockDelayTimer) {
      clearTimeout(this.lockDelayTimer);
      this.lockDelayTimer = null;
    }
    
    // Check for T-Spin before locking
    const tSpinType = this.currentPiece.checkTSpin(this.grid);
    
    // Lock the piece into the grid
    this.grid = this.currentPiece.lockIntoGrid(this.grid);
    
    // Clear lines and calculate score
    const linesCleared = this.clearLines();
    this.updateScore(linesCleared, tSpinType);
    
    // Spawn new piece
    this.spawnPiece();
  }

  /**
   * Hold the current piece
   * @returns {boolean} Whether the hold was successful
   */
  holdPiece() {
    if (!this.currentPiece || !this.canHold || this.isGameOver) return false;
    
    this.canHold = false;
    
    // Cancel lock delay timer
    if (this.lockDelayTimer) {
      clearTimeout(this.lockDelayTimer);
      this.lockDelayTimer = null;
    }
    
    // If there's already a held piece, swap them
    if (this.holdPiece) {
      const tempType = this.holdPiece.type;
      this.holdPiece = new Tetromino(this.currentPiece.type);
      this.currentPiece = new Tetromino(tempType);
    } else {
      // No held piece yet, hold current and get next
      this.holdPiece = new Tetromino(this.currentPiece.type);
      this.spawnPiece();
    }
    
    return true;
  }

  /**
   * Clear completed lines and return how many were cleared
   * @returns {number} Number of lines cleared
   */
  clearLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
      // Check if this row is full
      if (this.grid[y].every(cell => cell !== "")) {
        // Remove this row and add a new empty row at the top
        this.grid.splice(y, 1);
        this.grid.unshift(Array(COLS).fill(""));
        
        // Since we removed a row, we need to check the same index again
        y++;
        linesCleared++;
      }
    }
    
    this.linesCleared += linesCleared;
    
    // Update level based on lines cleared
    this.level = Math.min(Math.floor(this.linesCleared / LEVEL_UP_LINES) + 1, MAX_LEVEL);
    
    // Update gravity speed based on level
    this.gravitySpeed = INITIAL_GRAVITY * Math.pow(GRAVITY_DECREASE_FACTOR, this.level - 1);
    
    return linesCleared;
  }

  /**
   * Update score based on lines cleared and T-Spin status
   * @param {number} linesCleared - Number of lines cleared
   * @param {string} tSpinType - Type of T-Spin: "none", "mini", or "normal"
   */
  updateScore(linesCleared, tSpinType) {
    let scoreToAdd = 0;
    let isSpecialClear = false;
    
    // Calculate base score
    if (tSpinType === "normal") {
      isSpecialClear = true;
      // T-Spin scoring
      switch (linesCleared) {
        case 0: scoreToAdd = SCORING.TSPIN; break;
        case 1: scoreToAdd = SCORING.TSPIN_SINGLE; break;
        case 2: scoreToAdd = SCORING.TSPIN_DOUBLE; break;
        case 3: scoreToAdd = SCORING.TSPIN_TRIPLE; break;
      }
    } else if (tSpinType === "mini") {
      isSpecialClear = true;
      // Mini T-Spin scoring
      switch (linesCleared) {
        case 0: scoreToAdd = SCORING.MINI_TSPIN; break;
        case 1: scoreToAdd = SCORING.MINI_TSPIN_SINGLE; break;
        case 2: scoreToAdd = SCORING.MINI_TSPIN_DOUBLE; break;
      }
    } else {
      // Regular line clear scoring
      switch (linesCleared) {
        case 1: scoreToAdd = SCORING.SINGLE; break;
        case 2: scoreToAdd = SCORING.DOUBLE; break;
        case 3: scoreToAdd = SCORING.TRIPLE; break;
        case 4: 
          scoreToAdd = SCORING.TETRIS; 
          isSpecialClear = true; 
          break;
      }
    }
    
    // Apply level multiplier
    scoreToAdd *= this.level;
    
    // Back-to-back bonus
    if (isSpecialClear && this.backToBack && linesCleared > 0) {
      scoreToAdd = Math.floor(scoreToAdd * SCORING.BACK_TO_BACK);
    }
    
    // Update back-to-back status for next time
    if (linesCleared > 0) {
      this.backToBack = isSpecialClear;
    }
    
    // Combo bonus
    if (linesCleared > 0) {
      this.combo++;
      scoreToAdd += SCORING.COMBO * this.combo * this.level;
    } else {
      this.combo = 0;
    }
    
    // Add to total score
    this.score += scoreToAdd;
  }

  /**
   * Update game state for one frame
   * @param {number} currentTime - Current timestamp
   */
  update(currentTime) {
    if (this.isGameOver || !this.currentPiece) return;
    
    // Apply gravity
    if (currentTime - this.lastDropTime >= this.gravitySpeed) {
      this.movePieceDown();
      this.lastDropTime = currentTime;
    }
  }

  /**
   * Get a preview of the current state for rendering
   * @returns {Object} All data needed for rendering
   */
  getState() {
    return {
      grid: this.grid,
      currentPiece: this.currentPiece,
      ghostPiece: this.currentPiece ? this.currentPiece.getGhostPiece(this.grid) : null,
      holdPiece: this.holdPiece,
      nextPieces: this.nextPieces,
      score: this.score,
      linesCleared: this.linesCleared,
      level: this.level,
      combo: this.combo,
      isGameOver: this.isGameOver
    };
  }
}