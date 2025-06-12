console.log("script.js loaded");

const GAME_BOARD_WIDTH = 10;
const GAME_BOARD_HEIGHT = 20;
const gameBoardElement = document.getElementById('game-board');
const scoreElement = document.getElementById('score');

let board = [];
let score = 0;
let currentTetrominoShape = null;
let currentTetrominoColor = '';
let currentTetrominoType = ''; // Added to store the type (e.g., 'L', 'T') for logging
let currentTetrominoX = 0;
let currentTetrominoY = 0;

function createEmptyBoard() {
  for (let row = 0; row < GAME_BOARD_HEIGHT; row++) {
    board[row] = [];
    for (let col = 0; col < GAME_BOARD_WIDTH; col++) {
      board[row][col] = 0;
    }
  }
}

const TETROMINOES = {
  'I': { shape: [[1, 1, 1, 1]], color: 'cyan' },
  'O': { shape: [[1, 1], [1, 1]], color: 'yellow' },
  'L': { shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' },
  'T': { shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' },
  'S': { shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },
  'Z': { shape: [[1, 1, 0], [0, 1, 1]], color: 'red' },
  'J': { shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' }
};
const TETROMINO_TYPES = Object.keys(TETROMINOES);

function updateScoreDisplay() {
  scoreElement.textContent = 'Score: ' + score;
}

function spawnRandomTetromino() {
  const type = TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
  const tetromino = TETROMINOES[type];
  currentTetrominoShape = tetromino.shape;
  currentTetrominoColor = tetromino.color;
  currentTetrominoType = type; // Store type

  currentTetrominoX = Math.floor((GAME_BOARD_WIDTH - currentTetrominoShape[0].length) / 2);
  currentTetrominoY = 0;

  console.log(`Tetromino spawned: type=${currentTetrominoType}, position=(${currentTetrominoX},${currentTetrominoY}), shape=${JSON.stringify(currentTetrominoShape)}`);

  if (!canPlaceTetromino(currentTetrominoShape, currentTetrominoX, currentTetrominoY)) {
    console.error("Game Over! Failed to spawn new Tetromino. Final score:", score);
    alert("Game Over!");
    clearInterval(gameInterval);
    return false;
  }
  return true;
}

function canPlaceTetromino(shape, x, y) {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] !== 0) {
        const boardX = x + col;
        const boardY = y + row;
        if (boardX < 0 || boardX >= GAME_BOARD_WIDTH || boardY >= GAME_BOARD_HEIGHT) {
          return false; // Collision: Out of bounds
        }
        if (boardY >= 0 && board[boardY][boardX] !== 0) {
          return false; // Collision: Board cell occupied
        }
      }
    }
  }
  return true;
}

function rotateCurrentTetromino() {
  if (!currentTetrominoShape) return false;

  const originalShape = currentTetrominoShape; // For logging
  const originalX = currentTetrominoX;
  const originalY = currentTetrominoY;

  const shape = currentTetrominoShape;
  const rows = shape.length;
  const cols = shape[0].length;
  const newShape = [];
  for (let j = 0; j < cols; j++) {
    newShape[j] = [];
    for (let i = rows - 1; i >= 0; i--) {
      newShape[j].push(shape[i][j]);
    }
  }

  let rotated = false;
  if (canPlaceTetromino(newShape, currentTetrominoX, currentTetrominoY)) {
    currentTetrominoShape = newShape;
    rotated = true;
  } else if (canPlaceTetromino(newShape, currentTetrominoX - 1, currentTetrominoY)) {
    currentTetrominoShape = newShape;
    currentTetrominoX--;
    rotated = true;
  } else if (canPlaceTetromino(newShape, currentTetrominoX + 1, currentTetrominoY)) {
    currentTetrominoShape = newShape;
    currentTetrominoX++;
    rotated = true;
  }

  if (rotated) {
    console.log(`Player action: rotate, type=${currentTetrominoType}, from_pos=(${originalX},${originalY}), to_pos=(${currentTetrominoX},${currentTetrominoY}), new_shape=${JSON.stringify(currentTetrominoShape)}`);
    return true;
  } else {
    console.log(`Player action: rotate (failed), type=${currentTetrominoType}, pos=(${originalX},${originalY}), shape=${JSON.stringify(originalShape)}`);
    return false;
  }
}

function drawBoard() {
  gameBoardElement.innerHTML = '';
  let displayBoard = board.map(row => [...row]);

  if (currentTetrominoShape) {
    for (let row = 0; row < currentTetrominoShape.length; row++) {
      for (let col = 0; col < currentTetrominoShape[row].length; col++) {
        if (currentTetrominoShape[row][col] !== 0) {
          if (currentTetrominoY + row >= 0) {
             displayBoard[currentTetrominoY + row][currentTetrominoX + col] = currentTetrominoColor;
          }
        }
      }
    }
  }

  for (let row = 0; row < GAME_BOARD_HEIGHT; row++) {
    for (let col = 0; col < GAME_BOARD_WIDTH; col++) {
      const cell = document.createElement('div');
      cell.classList.add('block'); // Base class for all cells (styling from style.css)
      if (displayBoard[row][col] !== 0) {
        // This is a Tetromino piece
        cell.style.backgroundColor = displayBoard[row][col]; // Apply Tetromino-specific color
        cell.classList.add('tetromino-piece'); // Add class for specific border (defined in style.css)
      }
      // Else: This is an empty cell. It will be styled by the .block class from style.css
      gameBoardElement.appendChild(cell);
    }
  }
}

function clearLines() {
  let linesClearedThisTurn = 0;
  for (let y = GAME_BOARD_HEIGHT - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== 0)) {
      linesClearedThisTurn++;
      board.splice(y, 1);
      board.unshift(Array(GAME_BOARD_WIDTH).fill(0));
      y++;
    }
  }
  if (linesClearedThisTurn > 0) {
    score += linesClearedThisTurn * 100 * linesClearedThisTurn;
    updateScoreDisplay();
    console.log(`Lines cleared: ${linesClearedThisTurn}, newScore=${score}`);
  }
}

function gameTick() {
  const prevX = currentTetrominoX; // For logging if it locks
  const prevY = currentTetrominoY;

  if (currentTetrominoShape && canPlaceTetromino(currentTetrominoShape, currentTetrominoX, currentTetrominoY + 1)) {
    currentTetrominoY++;
  } else {
    // Tetromino cannot move down further, or there's no current Tetromino (e.g., initial state before first spawn)
    if (currentTetrominoShape) {
      // An active Tetromino exists and it's time to lock it
      for (let row = 0; row < currentTetrominoShape.length; row++) {
        for (let col = 0; col < currentTetrominoShape[row].length; col++) {
          if (currentTetrominoShape[row][col] !== 0) {
            if (currentTetrominoY + row < 0) {
              console.error(`Game Over! Tetromino locked above board. Type=${currentTetrominoType}, Pos=(${currentTetrominoX},${currentTetrominoY}). Final score: ${score}`);
              alert("Game Over! Blocked at top.");
              clearInterval(gameInterval);
              return;
            }
            board[currentTetrominoY + row][currentTetrominoX + col] = currentTetrominoColor;
          }
        }
      }
      console.log(`Tetromino locked: type=${currentTetrominoType}, position=(${currentTetrominoX},${currentTetrominoY}), shape=${JSON.stringify(currentTetrominoShape)}`);
      currentTetrominoShape = null; // Important: Clear current tetromino after locking
      clearLines();
    }
    if (!spawnRandomTetromino()) {
      // Game over message is handled in spawnRandomTetromino if it fails there
      return;
    }
  }
  drawBoard();
}

// --- Initialize Game ---
console.log("Game starting...");
createEmptyBoard();
updateScoreDisplay();
console.log("Game board initialized:", JSON.parse(JSON.stringify(board))); // Deep copy for logging initial state
if (spawnRandomTetromino()) {
    drawBoard();
    console.log("Game started successfully.");
} else {
    console.error("Game could not start due to spawn failure.");
}

const GAME_SPEED = 1000;
let gameInterval = setInterval(gameTick, GAME_SPEED);

document.addEventListener('keydown', (event) => {
  if (!currentTetrominoShape) return;

  const prevX = currentTetrominoX;
  const prevY = currentTetrominoY;
  let action = '';
  let moved = false;

  try {
    if (event.key === 'ArrowLeft') {
      action = 'moveLeft';
      if (canPlaceTetromino(currentTetrominoShape, currentTetrominoX - 1, currentTetrominoY)) {
        currentTetrominoX--;
        moved = true;
      }
    } else if (event.key === 'ArrowRight') {
      action = 'moveRight';
      if (canPlaceTetromino(currentTetrominoShape, currentTetrominoX + 1, currentTetrominoY)) {
        currentTetrominoX++;
        moved = true;
      }
    } else if (event.key === 'ArrowDown') {
      action = 'moveDown (soft drop)';
      // Soft drop: advance game tick
      console.log(`Player action: ${action} initiated, type=${currentTetrominoType}, from=(${prevX},${prevY})`);
      gameTick(); // This will handle movement, locking, and its own logging/drawing.
      // Note: gameTick calls drawBoard.
      return; // Avoid double drawBoard call. Keydown's drawBoard is skipped.
    } else if (event.key === 'ArrowUp') {
      action = 'rotate';
      // rotateCurrentTetromino logs its own success/failure
      moved = rotateCurrentTetromino(); // rotate logs internally
    }

    if (moved && action !== 'rotate' && action !== 'moveDown (soft drop)') { // Rotation logs itself, soft drop is complex
      console.log(`Player action: ${action}, type=${currentTetrominoType}, from=(${prevX},${prevY}), to=(${currentTetrominoX},${currentTetrominoY})`);
    } else if (!moved && action !== '' && action !== 'rotate' && action !== 'moveDown (soft drop)') {
      console.log(`Player action: ${action} (failed), type=${currentTetrominoType}, pos=(${prevX},${prevY})`);
    }

    if (moved) { // If any move action (left, right, rotation) occurred and was successful
      drawBoard();
    }
  } catch (error) {
    console.error(`Error during player action (${action}):`, error, {
      tetrominoType: currentTetrominoType,
      position: `(${prevX},${prevY})`,
      shape: currentTetrominoShape
    });
  }
});
