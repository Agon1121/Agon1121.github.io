/**
 * tetromino.js
 * Handles all tetromino-related functionality
 */

class Tetromino {
  /**
   * Create a new tetromino
   * @param {string} type - The type of tetromino (I, O, T, S, Z, J, L)
   * @param {number} x - The x position
   * @param {number} y - The y position
   * @param {number} rotation - The rotation state (0-3)
   */
  constructor(type, x = 3, y = 0, rotation = 0) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.lockDelayTimerId = null;
    this.moveResetCount = 0;
    this.lastMoveWasRotation = false;
  }

  /**
   * Get the current shape based on type and rotation
   * @returns {Array} Array of [x,y] coordinates
   */
  getShape() {
    return SHAPES[this.type][this.rotation];
  }

  /**
   * Clone this tetromino
   * @returns {Tetromino} A new tetromino with the same properties
   */
  clone() {
    return new Tetromino(this.type, this.x, this.y, this.rotation);
  }

  /**
   * Move the tetromino left/right/down
   * @param {number} dx - Change in x
   * @param {number} dy - Change in y
   * @param {Array} grid - The game grid
   * @returns {boolean} Whether the move was successful
   */
  move(dx, dy, grid) {
    // Save original position to restore if move is invalid
    const originalX = this.x;
    const originalY = this.y;
    
    this.x += dx;
    this.y += dy;
    
    if (this.isColliding(grid)) {
      // Restore original position
      this.x = originalX;
      this.y = originalY;
      return false;
    }
    
    // Reset rotation flag if we're moving horizontally or down
    if (dx !== 0 || dy !== 0) {
      this.lastMoveWasRotation = false;
    }
    
    return true;
  }

  /**
   * Rotate the tetromino clockwise
   * @param {Array} grid - The game grid
   * @returns {boolean} Whether the rotation was successful
   */
  rotateClockwise(grid) {
    const originalRotation = this.rotation;
    this.rotation = (this.rotation + 1) % 4;
    
    // Try simple rotation first
    if (!this.isColliding(grid)) {
      this.lastMoveWasRotation = true;
      return true;
    }
    
    // If simple rotation failed, try wall kicks
    const wallKickData = this.getWallKickData(originalRotation, this.rotation);
    for (const [kickX, kickY] of wallKickData) {
      this.x += kickX;
      this.y += kickY;
      
      if (!this.isColliding(grid)) {
        this.lastMoveWasRotation = true;
        return true;
      }
      
      // Undo kick
      this.x -= kickX;
      this.y -= kickY;
    }
    
    // If all wall kicks fail, restore original rotation
    this.rotation = originalRotation;
    return false;
  }

  /**
   * Rotate the tetromino counter-clockwise
   * @param {Array} grid - The game grid
   * @returns {boolean} Whether the rotation was successful
   */
  rotateCounterClockwise(grid) {
    const originalRotation = this.rotation;
    this.rotation = (this.rotation + 3) % 4; // +3 is same as -1 but ensures positive result
    
    // Try simple rotation first
    if (!this.isColliding(grid)) {
      this.lastMoveWasRotation = true;
      return true;
    }
    
    // If simple rotation failed, try wall kicks
    const wallKickData = this.getWallKickData(originalRotation, this.rotation);
    for (const [kickX, kickY] of wallKickData) {
      this.x += kickX;
      this.y += kickY;
      
      if (!this.isColliding(grid)) {
        this.lastMoveWasRotation = true;
        return true;
      }
      
      // Undo kick
      this.x -= kickX;
      this.y -= kickY;
    }
    
    // If all wall kicks fail, restore original rotation
    this.rotation = originalRotation;
    return false;
  }

  /**
   * Rotate the tetromino 180 degrees (flip)
   * @param {Array} grid - The game grid
   * @returns {boolean} Whether the rotation was successful
   */
  rotate180(grid) {
    const originalRotation = this.rotation;
    this.rotation = (this.rotation + 2) % 4;
    
    // Try simple rotation first
    if (!this.isColliding(grid)) {
      this.lastMoveWasRotation = true;
      return true;
    }
    
    // Try some basic wall kicks for 180 rotation
    // These are simplified; real 180 kicks would be more complex
    const kicks = [
      [0, 0], [1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1]
    ];
    
    for (const [kickX, kickY] of kicks) {
      this.x += kickX;
      this.y += kickY;
      
      if (!this.isColliding(grid)) {
        this.lastMoveWasRotation = true;
        return true;
      }
      
      // Undo kick
      this.x -= kickX;
      this.y -= kickY;
    }
    
    // If all wall kicks fail, restore original rotation
    this.rotation = originalRotation;
    return false;
  }

  /**
   * Get wall kick data for SRS (Super Rotation System)
   * @param {number} prevRotation - Previous rotation state
   * @param {number} newRotation - New rotation state
   * @returns {Array} Array of [x,y] wall kick tests
   */
  getWallKickData(prevRotation, newRotation) {
    // I tetromino has different wall kick data
    if (this.type === 'I') {
      const wallKicks = {
        '0-1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        '1-2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
        '2-3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        '3-0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        '1-0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
        '2-1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
        '3-2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
        '0-3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
      };
      return wallKicks[`${prevRotation}-${newRotation}`] || [[0, 0]];
    } else {
      // Wall kick data for J, L, S, T, Z tetrominoes
      const wallKicks = {
        '0-1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '1-2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        '2-3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        '3-0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '1-0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        '2-1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        '3-2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        '0-3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
      };
      return wallKicks[`${prevRotation}-${newRotation}`] || [[0, 0]];
    }
  }

  /**
   * Check if the tetromino is colliding with anything in the grid
   * @param {Array} grid - The game grid
   * @returns {boolean} Whether there is a collision
   */
  isColliding(grid) {
    const shape = this.getShape();
    return shape.some(([dx, dy]) => {
      const x = this.x + dx;
      const y = this.y + dy;
      
      // Check if out of bounds
      if (x < 0 || x >= COLS || y >= ROWS) {
        return true;
      }
      
      // Check if overlapping with existing blocks
      // Allow negative y (above the grid) as long as it's not overlapping
      return y >= 0 && grid[y][x] !== "";
    });
  }

  /**
   * Check if the tetromino is at the bottom
   * @param {Array} grid - The game grid
   * @returns {boolean} Whether the tetromino is at the bottom
   */
  isAtBottom(grid) {
    const testPiece = this.clone();
    testPiece.y += 1;
    return testPiece.isColliding(grid);
  }

  /**
   * Calculate ghost piece position (where the piece will land)
   * @param {Array} grid - The game grid
   * @returns {Tetromino} Ghost piece at landing position
   */
  getGhostPiece(grid) {
    const ghost = this.clone();
    while (!ghost.isColliding(grid)) {
      ghost.y++;
    }
    ghost.y--; // Move back up one step from collision
    return ghost;
  }

  /**
   * Calculate drop distance (how many cells the piece will fall)
   * @param {Array} grid - The game grid
   * @returns {number} Drop distance in cells
   */
  getDropDistance(grid) {
    let distance = 0;
    const testPiece = this.clone();
    
    while (!testPiece.isColliding(grid)) {
      testPiece.y++;
      distance++;
    }
    
    return distance - 1; // Adjust for going one too far
  }

  /**
   * Lock the tetromino into the grid
   * @param {Array} grid - The game grid to modify
   * @returns {Array} The updated grid
   */
  lockIntoGrid(grid) {
    const shape = this.getShape();
    const newGrid = grid.map(row => [...row]);
    
    shape.forEach(([dx, dy]) => {
      const newY = this.y + dy;
      const newX = this.x + dx;
      if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
        newGrid[newY][newX] = this.type;
      }
    });
    
    return newGrid;
  }

  /**
   * Check if this is a T-Spin
   * @param {Array} grid - The game grid
   * @param {boolean} lastMoveWasRotation - Whether the last move was a rotation
   * @returns {string} "none", "mini", or "normal"
   */
  checkTSpin(grid) {
    // Only T pieces can T-Spin and only after rotation
    if (this.type !== "T" || !this.lastMoveWasRotation) {
      return "none";
    }

    // Check corners around T piece center
    // T piece center is always at position 2 in the shape array
    const centerX = this.x + 1; // T center is always at [1,1] offset
    const centerY = this.y + 1;
    
    // Check the four corners around the T center
    const corners = [
      [centerX - 1, centerY - 1], // Top-left
      [centerX + 1, centerY - 1], // Top-right
      [centerX - 1, centerY + 1], // Bottom-left
      [centerX + 1, centerY + 1]  // Bottom-right
    ];
    
    // Count filled corners
    let filledCorners = 0;
    for (const [x, y] of corners) {
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS || (y >= 0 && grid[y][x] !== "")) {
        filledCorners++;
      }
    }
    
    if (filledCorners >= 3) {
      // Determine front corners based on rotation
      let frontCorners;
      switch (this.rotation) {
        case 0: // T facing up, front is bottom 2 corners
          frontCorners = [corners[2], corners[3]];
          break;
        case 1: // T facing right, front is left 2 corners
          frontCorners = [corners[0], corners[2]];
          break;
        case 2: // T facing down, front is top 2 corners
          frontCorners = [corners[0], corners[1]];
          break;
        case 3: // T facing left, front is right 2 corners
          frontCorners = [corners[1], corners[3]];
          break;
      }
      
      // Count filled front corners
      let filledFrontCorners = 0;
      for (const [x, y] of frontCorners) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS || (y >= 0 && grid[y][x] !== "")) {
          filledFrontCorners++;
        }
      }
      
      // If at least one front corner is filled, it's a normal T-spin
      return filledFrontCorners >= 1 ? "normal" : "mini";
    }
    
    return "none";
  }
}