const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
canvas.width = COLS * BLOCK_SIZE + 200; // 오른쪽에 공간 추가
canvas.height = ROWS * BLOCK_SIZE + 50;

const SHAPES = {
I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]]
],
O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]]
],
T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]]
],
S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]]
],
Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]]
],
J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]]
],
L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]]
]
};

const COLORS = {
    I: "cyan",
    O: "yellow",
    T: "purple",
    S: "green",
    Z: "red",
    J: "blue",
    L: "orange"
};

let grid = createEmptyGrid();
let currentPiece = null;
let holdPiece = null;
let canHold = true; // 홀드 가능 여부
let bag = [];
let nextPieces = [];
let isPieceLocked = false;
let gravitySpeed = 500; // 중력 속도 설정 (500ms마다 떨어짐)
let lastDropTime = Date.now(); // 마지막 중력 적용 시간
let score = 0;
let linesCleared = 0;
let gameLoopId = null; // 게임 루프 ID

// 락다운 딜레이 관련 변수
const LOCK_DELAY = 500; // 락다운 딜레이 시간 (밀리초)
let lockDelayTimer = null;
let touchingGround = false;
let moveResetCount = 0;
const MAX_MOVE_RESETS = 15; // 최대 락다운 리셋 횟수

let isHardDrop = false;

function sleep(ms) {
    const wakeUpTime = Date.now() + ms;
    while (Date.now() < wakeUpTime) {}
}

function createEmptyGrid() {
    return Array.from({ length: ROWS}, () => Array(COLS).fill(""));
}

function refillQueue() {
    while (nextPieces.length < 6) {
        if (bag.length === 0) {
        bag = Object.keys(SHAPES).sort(() => Math.random() - 0.5);
        }
        nextPieces.push({
        type: bag.pop(),
        x: 3,
        y: 0,
        rotation: 0
        });
    }
}

function spawnPiece() {
    refillQueue();
    currentPiece = nextPieces.shift();
    isPieceLocked = false;
    canHold = true;
    touchingGround = false;
    moveResetCount = 0;
    if (lockDelayTimer) {
        clearTimeout(lockDelayTimer);
        lockDelayTimer = null;
    }

    // 게임 오버 검사
    if (isOverlap(currentPiece)) {
        gameOver();
    }
}

function drawBlock(x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.strokeStyle = "white";
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawPiece(piece) {
    const shape = SHAPES[piece.type][piece.rotation];
    shape.forEach(([dx, dy]) => {
        drawBlock(piece.x + dx, piece.y + dy, COLORS[piece.type]);
    });
}

// 고스트 미노 그리기 함수
function drawGhostPiece() {
    if (!currentPiece) return;
    
    // 현재 조각의 복사본 생성
    const ghostPiece = {
        type: currentPiece.type,
        x: currentPiece.x,
        y: currentPiece.y,
        rotation: currentPiece.rotation
    };
    
    // 고스트 조각을 바닥까지 내림
    while (!isAtBottom(ghostPiece)) {
        ghostPiece.y++;
    }
    
    // 고스트 조각이 현재 조각과 같은 위치가 아닌 경우에만 그림
    if (ghostPiece.y !== currentPiece.y) {
        const shape = SHAPES[ghostPiece.type][ghostPiece.rotation];
        shape.forEach(([dx, dy]) => {
            const x = ghostPiece.x + dx;
            const y = ghostPiece.y + dy;
            
            // 반투명한 외곽선만 표시
            context.strokeStyle = "rgba(54, 54, 54, 0.25)"; // 외곽선 색상
            context.lineWidth = 2;
            context.strokeRect(x * BLOCK_SIZE + 3, y * BLOCK_SIZE + 3, BLOCK_SIZE - 6, BLOCK_SIZE - 6);
            context.lineWidth = 1;
            
            // 반투명한 내부 색상
            context.fillStyle = "rgba(54, 54, 54, 0.25)" // 알파값 40 (25% 투명도)
            context.fillRect(x * BLOCK_SIZE + 3, y * BLOCK_SIZE + 3, BLOCK_SIZE - 6, BLOCK_SIZE - 6);
        });
    }
}

function drawHoldArea() {
    // 홀드 영역 그리기
    context.fillStyle = "#f0f0f0";
    context.fillRect(COLS * BLOCK_SIZE + 10, 10, 180, 100);
    context.strokeStyle = "black";
    context.strokeRect(COLS * BLOCK_SIZE + 10, 10, 180, 100);

    // "HOLD" 텍스트 표시
    context.fillStyle = "black";
    context.font = "20px Arial";
    context.fillText("HOLD", COLS * BLOCK_SIZE + 75, 40);

    // 홀드된 피스 그리기
    if (holdPiece) {
        const offsetX = COLS * BLOCK_SIZE + 70;
        const offsetY = 60;
        const shape = SHAPES[holdPiece.type][0]; // 항상 첫 번째 회전 상태로 표시
        
        shape.forEach(([dx, dy]) => {
        context.fillStyle = COLORS[holdPiece.type];
        context.fillRect((dx * BLOCK_SIZE) / 1.5 + offsetX, (dy * BLOCK_SIZE) / 1.5 + offsetY, BLOCK_SIZE / 1.5, BLOCK_SIZE / 1.5);
        context.strokeStyle = "white";
        context.strokeRect((dx * BLOCK_SIZE) / 1.5 + offsetX, (dy * BLOCK_SIZE) / 1.5 + offsetY, BLOCK_SIZE / 1.5, BLOCK_SIZE / 1.5);
        });
    }
}

function drawNextPieces() {
    // 다음 조각 영역 그리기
    context.fillStyle = "#f0f0f0";
    context.fillRect(COLS * BLOCK_SIZE + 10, 120, 180, 430);
    context.strokeStyle = "black";
    context.strokeRect(COLS * BLOCK_SIZE + 10, 120, 180, 430);

    // "NEXT" 텍스트 표시
    context.fillStyle = "black";
    context.font = "20px Arial";
    context.fillText("NEXT", COLS * BLOCK_SIZE + 75, 150);

    // 다음 조각들 그리기
    for (let i = 0; i < 6; i++) {
        if (i < nextPieces.length) {
        const piece = nextPieces[i];
        const offsetX = COLS * BLOCK_SIZE + 70;
        const offsetY = 180 + i * 80;
        const shape = SHAPES[piece.type][0]; // 항상 첫 번째 회전 상태로 표시
        
        shape.forEach(([dx, dy]) => {
            context.fillStyle = COLORS[piece.type];
            context.fillRect((dx * BLOCK_SIZE) / 1.5 + offsetX, (dy * BLOCK_SIZE) / 1.5 + offsetY, BLOCK_SIZE / 1.5, BLOCK_SIZE / 1.5);
            context.strokeStyle = "white";
            context.strokeRect((dx * BLOCK_SIZE) / 1.5 + offsetX, (dy * BLOCK_SIZE) / 1.5 + offsetY, BLOCK_SIZE / 1.5, BLOCK_SIZE / 1.5);
        });
        }
    }
}

function drawScore() {
    context.fillStyle = "black";
    context.font = "16px Arial";
    context.fillText(`점수: ${score}`, COLS * BLOCK_SIZE + 60, ROWS * BLOCK_SIZE );
    context.fillText(`제거한 줄: ${linesCleared}`, COLS * BLOCK_SIZE + 60, ROWS * BLOCK_SIZE + 30);
}

function render() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // 게임 영역 배경
    context.fillStyle = "#f8f8f8";
    context.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

    // 그리드 그리기
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
        if (grid[y][x]) {
            drawBlock(x, y, COLORS[grid[y][x]]);
        } else {
            // 빈 셀에 연한 격자 그리기
            context.strokeStyle = "#e0e0e0";
            context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
        }
    }

    // 고스트 미노 그리기
    if (currentPiece) {
        drawGhostPiece();
    }

    // 현재 조각 그리기
    if (currentPiece) {
        drawPiece(currentPiece);
    }

    // 홀드 및 다음 조각 영역 그리기
    drawHoldArea();
    drawNextPieces();
    drawScore();
}

function gameLoop() {
    let currentTime = Date.now();
    if (!isPieceLocked && currentTime - lastDropTime >= gravitySpeed) {
        movePieceDown();
        lastDropTime = currentTime;
    }
    render();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function restartGame() {
    if (gameLoopId !== null) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    if (lockDelayTimer) {
        clearTimeout(lockDelayTimer);
        lockDelayTimer = null;
    }
    grid = createEmptyGrid();
    currentPiece = null;
    holdPiece = null;
    canHold = true;
    bag = [];
    nextPieces = [];
    isPieceLocked = false;
    gravitySpeed = 500;
    lastDropTime = Date.now();
    score = 0;
    linesCleared = 0;
    isHardDrop = false;
    touchingGround = false;
    moveResetCount = 0;
    gameLoop();
    spawnPiece();
    render();
}

function hold() {
    if (!canHold) return; // 이미 홀드를 사용했으면 리턴

    canHold = false; // 홀드 사용 표시
    
    // 락다운 타이머 취소
    if (lockDelayTimer) {
        clearTimeout(lockDelayTimer);
        lockDelayTimer = null;
    }
    touchingGround = false;

    if (holdPiece) {
        // 홀드된 조각이 있으면 교체
        const temp = holdPiece;
        holdPiece = {
            type: currentPiece.type,
            rotation: 0, // 홀드 시 회전 초기화
            x: 3,
            y: 0
        };
        currentPiece = {
            type: temp.type,
            rotation: 0, // 홀드에서 꺼낼 때 회전 초기화
            x: 3,
            y: 0
        };
    } else {
        // 홀드된 조각이 없으면 현재 조각을 홀드하고 새 조각 생성
        holdPiece = {
            type: currentPiece.type,
            rotation: 0,
            x: 3,
            y: 0
        };
        spawnPiece();
    }
}

function lockPiece() {
    if (isHardDrop) {
        finalLock();
        return;
    }
    
    // 락다운 딜레이 타이머 시작
    if (!touchingGround) {
        touchingGround = true;
        lockDelayTimer = setTimeout(() => {
            finalLock();
        }, LOCK_DELAY);
    }
}

function finalLock() {
    // 타이머 클리어
    if (lockDelayTimer) {
        clearTimeout(lockDelayTimer);
        lockDelayTimer = null;
    }
    
    if (isHardDrop) sleep(200); // 하드 드롭일 경우 짧은 지연
    else sleep(50); // 일반 락다운은 아주 짧은 지연
    
    // 현재 조각의 모양을 가져옴
    const shape = SHAPES[currentPiece.type][currentPiece.rotation];

    // 그리드에 블록 추가
    shape.forEach(([dx, dy]) => {
        const newY = currentPiece.y + dy;
        const newX = currentPiece.x + dx;
        if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
            grid[newY][newX] = currentPiece.type;
        }
    });

    // 회전 상태 저장 (락 직전의 플래그 상태 기억)
    const wasRotation = lastMoveWasRotation;
    const rotatedPieceType = currentPiece.type;

    // 채워진 줄 확인 및 제거
    clearLines();

    // 상태 초기화
    isPieceLocked = true;
    touchingGround = false;
    isHardDrop = false;
    
    // 상태 저장
    lastMoveWasRotation = wasRotation;
    lastRotatedPieceType = rotatedPieceType;
    
    spawnPiece();
}

// 블록이 바닥에 닿았는지 확인하는 함수
function isAtBottom(piece) {
    const shape = SHAPES[piece.type][piece.rotation];
    return shape.some(([dx, dy]) => {
        const newY = piece.y + dy + 1;
        const newX = piece.x + dx;
        return newY >= ROWS || (newY >= 0 && newX >= 0 && newX < COLS && grid[newY][newX] !== "");
    });
}

// 완성된 줄을 확인하고 제거하는 함수
function clearLines() {
    let linesCount = 0;

    for (let y = ROWS - 1; y >= 0; y--) {
        // 현재 줄이 가득 찼는지 확인
        if (grid[y].every(cell => cell !== "")) {
        // 가득 찬 줄 제거 및 위의 줄 내리기
        for (let y2 = y; y2 > 0; y2--) {
            for (let x = 0; x < COLS; x++) {
            grid[y2][x] = grid[y2-1][x];
            }
        }
        // 맨 위 줄은 빈 줄로 설정
        for (let x = 0; x < COLS; x++) {
            grid[0][x] = "";
        }
        
        linesCount++;
        // y 위치 조정 (같은 위치를 다시 검사하기 위해)
        y++;
        }
    }

    // 제거한 줄 수에 따라 점수 계산
    if (linesCount > 0) {
        linesCleared += linesCount;
        
        // 줄 수에 따른 점수 계산 (테트리스 규칙)
        switch (linesCount) {
        case 1:
            score += 100;
            break;
        case 2:
            score += 300;
            break;
        case 3:
            score += 500;
            break;
        case 4:
            score += 800; // 테트리스 (4줄 동시 제거)
            break;
        }
        
        console.log(`${linesCount}줄 제거! 총 점수: ${score}`);
    }
}

let lastMoveWasRotation = false;
let lastRotatedPieceType = "";
let tSpinType = ""; // "", "mini", "normal"

// T-Spin 체크를 위한 함수
function clearLines() {
    let linesCount = 0;
    let tSpinType = "none";
    
    // T-Spin 체크 (마지막으로 락다운된 조각이 T이고 회전으로 끝났을 경우)
    if (lastRotatedPieceType === "T" && lastMoveWasRotation) {
        tSpinType = checkTSpin();
    }

    for (let y = ROWS - 1; y >= 0; y--) {
        // 현재 줄이 가득 찼는지 확인
        if (grid[y].every(cell => cell !== "")) {
            // 가득 찬 줄 제거 및 위의 줄 내리기
            for (let y2 = y; y2 > 0; y2--) {
                for (let x = 0; x < COLS; x++) {
                    grid[y2][x] = grid[y2-1][x];
                }
            }
            // 맨 위 줄은 빈 줄로 설정
            for (let x = 0; x < COLS; x++) {
                grid[0][x] = "";
            }
            
            linesCount++;
            // y 위치 조정 (같은 위치를 다시 검사하기 위해)
            y++;
        }
    }

    // 제거한 줄 수와 T-Spin 여부에 따라 점수 계산
    if (linesCount > 0 || tSpinType !== "none") {
        linesCleared += linesCount;
        
        // T-Spin 및 줄 수에 따른 점수 계산
        if (tSpinType === "normal") {
            switch (linesCount) {
                case 0: // T-Spin No Lines
                    score += 400;
                    console.log("T-Spin No Lines! +400점");
                    break;
                case 1: // T-Spin Single
                    score += 800;
                    console.log("T-Spin Single! +800점");
                    break;
                case 2: // T-Spin Double
                    score += 1200;
                    console.log("T-Spin Double! +1200점");
                    break;
                case 3: // T-Spin Triple
                    score += 1600;
                    console.log("T-Spin Triple! +1600점");
                    break;
            }
        } else if (tSpinType === "mini") {
            switch (linesCount) {
                case 0: // Mini T-Spin No Lines
                    score += 100;
                    console.log("Mini T-Spin No Lines! +100점");
                    break;
                case 1: // Mini T-Spin Single
                    score += 200;
                    console.log("Mini T-Spin Single! +200점");
                    break;
                case 2: // Mini T-Spin Double
                    score += 400;
                    console.log("Mini T-Spin Double! +400점");
                    break;
            }
        } else {
            // 일반 라인 클리어 점수
            switch (linesCount) {
                case 1:
                    score += 100;
                    console.log("Single! +100점");
                    break;
                case 2:
                    score += 300;
                    console.log("Double! +300점");
                    break;
                case 3:
                    score += 500;
                    console.log("Triple! +500점");
                    break;
                case 4:
                    score += 800; // 테트리스 (4줄 동시 제거)
                    console.log("Tetris! +800점");
                    break;
            }
        }
        
        console.log(`${linesCount}줄 제거! 총 점수: ${score}`);
    }
    
    // 새 조각 생성 전에 회전 플래그 리셋
    lastMoveWasRotation = false;
}


function movePieceDown() {
    const shape = SHAPES[currentPiece.type][currentPiece.rotation];
    if (shape.some(([dx, dy]) => {
        const newY = currentPiece.y + dy + 1;
        const newX = currentPiece.x + dx;
        return newY >= ROWS || (newY >= 0 && newX >= 0 && newX < COLS && grid[newY][newX] !== "");
    })) {
        lockPiece();
    } else {
        currentPiece.y += 1;
        // 바닥에 닿았다가 움직였으면 락다운 타이머 리셋
        if (touchingGround) {
            resetLockDelay();
        }
    }
}

// 락다운 딜레이 리셋 함수
function resetLockDelay() {
    if (moveResetCount < MAX_MOVE_RESETS && touchingGround) {
        if (lockDelayTimer) {
            clearTimeout(lockDelayTimer);
        }
        lockDelayTimer = setTimeout(() => {
            finalLock();
        }, LOCK_DELAY);
        moveResetCount++;
    }
}

function movePiece(dx, dy) {
    const shape = SHAPES[currentPiece.type][currentPiece.rotation];
    if (shape.every(([x, y]) => {
        const newX = currentPiece.x + dx + x;
        const newY = currentPiece.y + dy + y;
        return newX >= 0 && newX < COLS && 
            (newY < 0 || (newY < ROWS && grid[newY][newX] === ""));
    })) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        
        // 이동 시 회전 플래그 리셋
        lastMoveWasRotation = false;
        
        // 움직인 후 바닥에 닿았는지 확인하고 락다운 타이머 리셋
        if (isAtBottom(currentPiece)) {
            lockPiece();
        } else if (touchingGround) {
            // 바닥에서 멀어진 경우 락다운 상태 해제
            touchingGround = false;
            if (lockDelayTimer) {
                clearTimeout(lockDelayTimer);
                lockDelayTimer = null;
            }
        }
        
        return true;
    }
    return false;
}

function clockwisePiece() {
    const newRotation = (currentPiece.rotation + 1) % 4;
    const shape = SHAPES[currentPiece.type][newRotation];
    if (shape.every(([dx, dy]) => {
        const newX = currentPiece.x + dx;
        const newY = currentPiece.y + dy;
        return newX >= 0 && newX < COLS && 
            (newY < 0 || (newY < ROWS && grid[newY][newX] === ""));
    })) {
        currentPiece.rotation = newRotation;
        
        // 회전 성공 시 회전 플래그 설정
        lastMoveWasRotation = true;
        lastRotatedPieceType = currentPiece.type;
        
        // 회전 후 바닥에 닿았는지 확인
        if (isAtBottom(currentPiece)) {
            lockPiece();
        } else if (touchingGround) {
            resetLockDelay();
        }
        return true;
    }
    return false;
}

// counterclockwisePiece 함수도 수정
function counterclockwisePiece() {
    const newRotation = (currentPiece.rotation + 3) % 4;
    const shape = SHAPES[currentPiece.type][newRotation];
    if (shape.every(([dx, dy]) => {
        const newX = currentPiece.x + dx;
        const newY = currentPiece.y + dy;
        return newX >= 0 && newX < COLS &&
                (newY < 0 || (newY < ROWS && grid[newY][newX] === ""));
    })) {
        currentPiece.rotation = newRotation;
        
        // 회전 성공 시 회전 플래그 설정
        lastMoveWasRotation = true;
        lastRotatedPieceType = currentPiece.type;
        
        // 회전 후 바닥에 닿았는지 확인
        if (isAtBottom(currentPiece)) {
            lockPiece();
        } else if (touchingGround) {
            resetLockDelay();
        }
        return true;
    }
    return false;
}

function fliprotatePiece() {
    const newRotation = (currentPiece.rotation + 2) % 4;
    const shape = SHAPES[currentPiece.type][newRotation];
    if (shape.every(([dx, dy]) => {
        const newX = currentPiece.x + dx;
        const newY = currentPiece.y + dy;
        return newX >= 0 && newX < COLS && 
            (newY < 0 || (newY < ROWS && grid[newY][newX] === ""));
    })) {
        currentPiece.rotation = newRotation;
        
        // 회전 성공 시 회전 플래그 설정
        lastMoveWasRotation = true;
        lastRotatedPieceType = currentPiece.type;
        
        // 회전 후 바닥에 닿았는지 확인
        if (isAtBottom(currentPiece)) {
            lockPiece();
        } else if (touchingGround) {
            resetLockDelay();
        }
        return true;
    }
    return false;
}

function hold() {
    if (!canHold) return; // 이미 홀드를 사용했으면 리턴

    // 홀드는 회전이 아니므로 플래그 리셋
    lastMoveWasRotation = false;
    
    canHold = false; // 홀드 사용 표시
    
    // 락다운 타이머 취소
    if (lockDelayTimer) {
        clearTimeout(lockDelayTimer);
        lockDelayTimer = null;
    }
    touchingGround = false;

    if (holdPiece) {
        // 홀드된 조각이 있으면 교체
        const temp = holdPiece;
        holdPiece = {
            type: currentPiece.type,
            rotation: 0, // 홀드 시 회전 초기화
            x: 3,
            y: 0
        };
        currentPiece = {
            type: temp.type,
            rotation: 0, // 홀드에서 꺼낼 때 회전 초기화
            x: 3,
            y: 0
        };
    } else {
        // 홀드된 조각이 없으면 현재 조각을 홀드하고 새 조각 생성
        holdPiece = {
            type: currentPiece.type,
            rotation: 0,
            x: 3,
            y: 0
        };
        spawnPiece();
    }
}


function isOverlap(piece) {
    const shape = SHAPES[piece.type][piece.rotation];
    return shape.some(([dx, dy]) => {
        const x = piece.x + dx;
        const y = piece.y + dy;
        // 그리드 바깥이거나 이미 채워진 칸이면 겹침
        return y >= 0 && y < ROWS && x >= 0 && x < COLS && grid[y][x] !== "";
    });
}

// 2) 게임 오버 처리 함수 (원하는 로직으로 바꿔서 사용)
function gameOver() {
    alert("GAME OVER!");
    restartGame();
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") movePiece(-1, 0);
    if (e.key === "ArrowRight") movePiece(1, 0);
    if (e.key === "ArrowDown") movePieceDown();
    if (e.key === "ArrowUp") clockwisePiece();
    if (e.key === "a" || e.key === "A") fliprotatePiece();
    if (e.key === "z" || e.key === "Z") counterclockwisePiece();
    if (e.key === "c" || e.key === "C") hold();
    if (e.key === "r" || e.key === "R") restartGame();
    if (e.key === " ") hardDrop();
});

function restartGame() {
    if (gameLoopId !== null) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    if (lockDelayTimer) {
        clearTimeout(lockDelayTimer);
        lockDelayTimer = null;
    }
    grid = createEmptyGrid();
    currentPiece = null;
    holdPiece = null;
    canHold = true;
    bag = [];
    nextPieces = [];
    isPieceLocked = false;
    gravitySpeed = 500;
    lastDropTime = Date.now();
    score = 0;
    linesCleared = 0;
    isHardDrop = false;
    touchingGround = false;
    moveResetCount = 0;
    lastMoveWasRotation = false;
    lastRotatedPieceType = "";
    gameLoop();
    spawnPiece();
    render();
}

spawnPiece();
gameLoop();