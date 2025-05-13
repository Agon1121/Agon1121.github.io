class Tetromino {
    constructor(type = 0) {
        this.type = type > 0 ? type : Utils.getRandomTetromino();
        this.shape = Utils.cloneMatrix(SHAPES[this.type]);
        this.color = COLORS[this.type];
        this.rotation = 0; // 0, 1, 2, or 3 (0, 90, 180, 270 degrees)
        
        // Initial position (centered at the top)
        this.x = Math.floor((COLS - this.shape[0].length) / 2);
        this.y = 0;
    }
    
    // Move the piece left
    moveLeft(board) {
        if (Utils.isValidMove(board, this, -1, 0)) {
            this.x--;
            return true;
        }
        return false;
    }
    
    // Move the piece right
    moveRight(board) {
        if (Utils.isValidMove(board, this, 1, 0)) {
            this.x++;
            return true;
        }
        return false;
    }
    
    // Move the piece down
    moveDown(board) {
        if (Utils.isValidMove(board, this, 0, 1)) {
            this.y++;
            return true;
        }
        return false;
    }
    
    // Try to rotate the piece clockwise with wall kicks
    rotateCW(board) {
        const originalShape = this.shape;
        const originalRotation = this.rotation;
        
        // Rotate the shape
        this.shape = Utils.rotateMatrixCW(this.shape);
        this.rotation = (this.rotation + 1) % 4;
        
        // Try wall kicks
        const kicks = Utils.getWallKickData(this.type, originalRotation, this.rotation);
        
        for (const [kickX, kickY] of kicks) {
            if (Utils.isValidMove(board, this, kickX, kickY)) {
                this.x += kickX;
                this.y += kickY;
                return true;
            }
        }
        
        // If no valid position found, revert back
        this.shape = originalShape;
        this.rotation = originalRotation;
        return false;
    }
    
    // Try to rotate the piece counter-clockwise with wall kicks
    rotateCCW(board) {
        const originalShape = this.shape;
        const originalRotation = this.rotation;
        
        // Rotate the shape
        this.shape = Utils.rotateMatrixCCW(this.shape);
        this.rotation = (this.rotation + 3) % 4; // +3 is the same as -1 in modulo 4
        
        // Try wall kicks
        const kicks = Utils.getWallKickData(this.type, originalRotation, this.rotation);
        
        for (const [kickX, kickY] of kicks) {
            if (Utils.isValidMove(board, this, kickX, kickY)) {
                this.x += kickX;
                this.y += kickY;
                return true;
            }
        }
        
        // If no valid position found, revert back
        this.shape = originalShape;
        this.rotation = originalRotation;
        return false;
    }
    
    // Rotate 180 degrees
    rotate180(board) {
        const originalShape = this.shape;
        const originalRotation = this.rotation;
        
        // Rotate the shape
        this.shape = Utils.rotateMatrix180(this.shape);
        this.rotation = (this.rotation + 2) % 4;
        
        // Try wall kicks
        const kicks = Utils.getWallKickData(this.type, originalRotation, this.rotation);
        
        for (const [kickX, kickY] of kicks) {
            if (Utils.isValidMove(board, this, kickX, kickY)) {
                this.x += kickX;
                this.y += kickY;
                return true;
            }
        }
        
        // If no valid position found, revert back
        this.shape = originalShape;
        this.rotation = originalRotation;
        return false;
    }
    
    // Hard drop the piece
    hardDrop(board) {
        let dropDistance = 0;
        while (Utils.isValidMove(board, this, 0, 1)) {
            this.y++;
            dropDistance++;
        }
        return dropDistance;
    }
    
    // Create a clone of this tetromino
    clone() {
        const cloned = new Tetromino(this.type);
        cloned.shape = Utils.cloneMatrix(this.shape);
        cloned.x = this.x;
        cloned.y = this.y;
        cloned.rotation = this.rotation;
        return cloned;
    }
}