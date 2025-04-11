// Constants
const GRID_SIZE = 10;
const NEXT_BLOCKS_COUNT = 3;
const COLORS = ['blue', 'green', 'purple', 'pink', 'orange'];

const BLOCK_SHAPES = [
  [[1]], [[1, 1]], [[1], [1]],
  [[1, 1, 1]], [[1, 1], [1, 0]], [[1, 1], [0, 1]], [[1, 0], [1, 1]], [[0, 1], [1, 1]], [[1], [1], [1]],
  [[1, 1, 1, 1]], [[1], [1], [1], [1]], [[1, 1], [1, 1]],
  [[1, 1, 1], [1, 0, 0]], [[1, 1, 1], [0, 0, 1]], [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]],
  [[0, 1, 0], [1, 1, 1]], [[1, 1, 1], [0, 1, 0]]
];

// Game state
let grid = [];
let score = 0;
let highScore = parseInt(localStorage.getItem('blockGameHighScore') || '0');
let nextBlocks = [];
let selectedBlockIndex = null;
let isGameOver = false;

// DOM elements
const gameBoard = document.getElementById('game-board');
const blocksContainer = document.getElementById('blocks-container');
const currentScoreElement = document.querySelector('.current-score');
const highScoreElement = document.querySelector('.high-score');
const resetButton = document.getElementById('reset-button');
const infoButton = document.getElementById('info-button');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.querySelector('.final-score');
const playAgainButton = document.getElementById('play-again');
const toastElement = document.getElementById('toast');
const themeToggle = document.getElementById('theme-toggle');
const howToPlayModal = document.getElementById('how-to-play-modal');
const closeModalBtn = document.getElementById('close-modal');

// Init game
function initGame() {
  createGrid();
  generateNextBlocks();
  updateScore(0);
  updateHighScore(highScore);
  isGameOver = false;
  gameOverElement.classList.add('hidden');
  resetButton.classList.remove('active');

  resetButton.addEventListener('click', resetGame);
  playAgainButton.addEventListener('click', resetGame);
  themeToggle.addEventListener('click', toggleTheme);

  infoButton.addEventListener('click', () => {
    howToPlayModal.classList.remove('hidden');
  });
  closeModalBtn.addEventListener('click', () => {
    howToPlayModal.classList.add('hidden');
  });
  window.addEventListener('click', (e) => {
    if (e.target === howToPlayModal) {
      howToPlayModal.classList.add('hidden');
    }
  });

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.querySelector('.toggle-icon').textContent = '🌙';
  } else {
    document.body.classList.remove('dark-mode');
    themeToggle.querySelector('.toggle-icon').textContent = '☀️';
  }
}

// Create grid
function createGrid() {
  gameBoard.innerHTML = '';
  grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener('click', () => tryPlaceBlock(row, col));
      cell.addEventListener('mouseover', () => showPlacementPreview(row, col));
      cell.addEventListener('mouseout', clearPlacementPreview);
      gameBoard.appendChild(cell);
    }
  }
}

// Generate next blocks
function generateNextBlocks() {
  nextBlocks = [];
  blocksContainer.innerHTML = '';
  for (let i = 0; i < NEXT_BLOCKS_COUNT; i++) {
    const block = {
      id: Math.random().toString(36).substr(2, 9),
      shape: BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
    nextBlocks.push(block);
    renderBlockPreview(block, i);
  }
}

function renderBlockPreview(block, index) {
  const blockElement = document.createElement('div');
  blockElement.classList.add('block-piece');
  blockElement.dataset.index = index;
  const rows = block.shape.length;
  const cols = Math.max(...block.shape.map(row => row.length));
  blockElement.style.gridTemplateRows = `repeat(${rows}, 12px)`;
  blockElement.style.gridTemplateColumns = `repeat(${cols}, 12px)`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < (block.shape[r] || []).length; c++) {
      const miniCell = document.createElement('div');
      miniCell.classList.add('mini-cell');
      if (block.shape[r][c] === 1) miniCell.classList.add(block.color);
      blockElement.appendChild(miniCell);
    }
  }

  blockElement.addEventListener('click', () => selectBlock(index));
  blocksContainer.appendChild(blockElement);
}

function selectBlock(index) {
  document.querySelectorAll('.block-piece').forEach(el => el.classList.remove('selected'));
  selectedBlockIndex = index;
  document.querySelector(`.block-piece[data-index="${index}"]`).classList.add('selected');
}

function tryPlaceBlock(row, col) {
  if (isGameOver || selectedBlockIndex === null) return false;
  const block = nextBlocks[selectedBlockIndex];
  if (canPlaceBlockAt(row, col, block)) {
    for (let r = 0; r < block.shape.length; r++) {
      for (let c = 0; c < block.shape[r].length; c++) {
        if (block.shape[r][c] === 1) {
          grid[row + r][col + c] = block.color;
        }
      }
    }
    updateGridView();
    generateNewBlock(selectedBlockIndex);
    selectedBlockIndex = null;
    document.querySelectorAll('.block-piece').forEach(el => el.classList.remove('selected'));

    const cleared = checkForCompletedLines();
    if (cleared > 0) {
      updateScore(score + cleared * 10);
      showToast(`+${cleared * 10} points!`);
    }

    if (!canAnyBlockBePlaced()) gameOver();
    return true;
  }
  return false;
}

function canPlaceBlockAt(row, col, block) {
  for (let r = 0; r < block.shape.length; r++) {
    for (let c = 0; c < block.shape[r].length; c++) {
      if (block.shape[r][c] === 1) {
        if (row + r >= GRID_SIZE || col + c >= GRID_SIZE || grid[row + r][col + c] !== null) return false;
      }
    }
  }
  return true;
}

function generateNewBlock(index) {
  const block = {
    id: Math.random().toString(36).substr(2, 9),
    shape: BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  };
  nextBlocks[index] = block;
  const oldBlock = document.querySelector(`.block-piece[data-index="${index}"]`);
  oldBlock.remove();
  renderBlockPreview(block, index);
}

function updateGridView() {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
      cell.className = 'cell';
      if (grid[row][col] !== null) {
        cell.classList.add(`filled-${grid[row][col]}`);
      }
    }
  }
}

function checkForCompletedLines() {
  let cleared = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    if (grid[row].every(cell => cell !== null)) {
      grid[row].fill(null);
      cleared++;
    }
  }
  for (let col = 0; col < GRID_SIZE; col++) {
    if (grid.every(row => row[col] !== null)) {
      grid.forEach(row => row[col] = null);
      cleared++;
    }
  }
  updateGridView();
  return cleared;
}

function canAnyBlockBePlaced() {
  for (const block of nextBlocks) {
    for (let r = 0; r <= GRID_SIZE - block.shape.length; r++) {
      for (let c = 0; c <= GRID_SIZE - block.shape[0].length; c++) {
        if (canPlaceBlockAt(r, c, block)) return true;
      }
    }
  }
  return false;
}

function showPlacementPreview(row, col) {
  if (isGameOver || selectedBlockIndex === null) return;
  clearPlacementPreview();
  const block = nextBlocks[selectedBlockIndex];
  const canPlace = canPlaceBlockAt(row, col, block);
  for (let r = 0; r < block.shape.length; r++) {
    for (let c = 0; c < block.shape[r].length; c++) {
      if (block.shape[r][c] === 1 && row + r < GRID_SIZE && col + c < GRID_SIZE) {
        const cell = document.querySelector(`.cell[data-row="${row + r}"][data-col="${col + c}"]`);
        if (canPlace) cell.classList.add('preview', `filled-${block.color}`);
        else cell.classList.add('invalid');
      }
    }
  }
}

function clearPlacementPreview() {
  document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('preview', 'invalid', 'filled-blue', 'filled-green', 'filled-purple', 'filled-pink', 'filled-orange');
  });
  updateGridView();
}

function updateScore(newScore) {
  score = newScore;
  currentScoreElement.textContent = score;
  if (score > highScore) updateHighScore(score);
}

function updateHighScore(newHighScore) {
  highScore = newHighScore;
  highScoreElement.textContent = `High Score: ${highScore}`;
  localStorage.setItem('blockGameHighScore', highScore.toString());
}

function gameOver() {
  isGameOver = true;
  resetButton.classList.add('active');
  finalScoreElement.textContent = score;
  gameOverElement.classList.remove('hidden');
}

function resetGame() {
  createGrid();
  generateNextBlocks();
  updateScore(0);
  isGameOver = false;
  selectedBlockIndex = null;
  gameOverElement.classList.add('hidden');
  resetButton.classList.remove('active');
  showToast('Game Reset!');
}

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.remove('hidden');
  toastElement.style.animation = 'fadeIn 0.3s forwards';
  setTimeout(() => {
    toastElement.style.opacity = '0';
    setTimeout(() => {
      toastElement.classList.add('hidden');
      toastElement.style.opacity = '1';
    }, 300);
  }, 3000);
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  themeToggle.querySelector('.toggle-icon').textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  showToast(isDark ? 'Dark Mode Activated' : 'Light Mode Activated');
}

document.addEventListener('DOMContentLoaded', initGame);
