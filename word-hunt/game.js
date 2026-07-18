// Word Arena — game logic

// ============================================================
// LETTER DISTRIBUTION
// ============================================================
const WEIGHTS = {
  A: 8, B: 2, C: 3, D: 4, E: 12, F: 2, G: 3, H: 2, I: 8,
  J: 1, K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6,
  S: 4, T: 6, U: 4, V: 1, W: 2, X: 1, Y: 2, Z: 1,
};
const LETTERS = Object.keys(WEIGHTS);
const VOWELS = ["A", "E", "I", "O", "U"];

function weightedPick() {
  let total = 0;
  for (const l of LETTERS) total += WEIGHTS[l];
  let r = Math.random() * total;
  for (const l of LETTERS) {
    r -= WEIGHTS[l];
    if (r <= 0) return l;
  }
  return "E";
}

function generateBoard(size) {
  const total = size * size;
  for (let attempt = 0; attempt < 20; attempt++) {
    const cells = Array.from({ length: total }, () => weightedPick());
    const vc = cells.filter((c) => VOWELS.includes(c)).length;
    if (vc >= 3) return cells;
  }
  const cells = Array.from({ length: total }, () => weightedPick());
  cells[0] = "A";
  cells[size - 1] = "E";
  const mid = Math.floor(total / 2);
  if (cells[mid] && !VOWELS.includes(cells[mid])) cells[mid] = "I";
  cells[total - 1] = "O";
  return cells;
}

// ============================================================
// GAME STATE
// ============================================================
const S = {
  board: [],
  selection: [],
  foundWords: new Set(),
  foundList: [],
  score: 0,
  showSolutions: false,
  solutionsList: null,
};

// ============================================================
// DOM REFS
// ============================================================
const boardEl = document.getElementById("board");
const boardWrapper = document.getElementById("board-wrapper");
const canvas = document.getElementById("board-lines");
const ctx = canvas.getContext("2d");
const currentWordEl = document.getElementById("current-word");
const scoreEl = document.getElementById("score");
const wordsContainer = document.getElementById("words-container");
const wordsCountEl = document.getElementById("words-count");
const loadingOverlay = document.getElementById("loading-overlay");

// ============================================================
// BOARD RENDER
// ============================================================
function renderBoard() {
  const n = S.gridSize;
  const cells = boardEl.children;

  let pathStatus = "";
  if (S.selection.length >= 3) {
    const word = S.selection.map((t) => S.board[t.r * n + t.c]).join("");
    const lower = word.toLowerCase();
    if (wordSet && wordSet.has(lower)) {
      pathStatus = S.foundWords.has(word) ? "dup" : "valid";
    }
  }

  for (let i = 0; i < n * n; i++) {
    const cell = cells[i];
    cell.textContent = S.board[i];
    const row = Math.floor(i / n);
    const col = i % n;
    const si = S.selection.findIndex((t) => t.r === row && t.c === col);
    cell.className = "cell";
    if (si >= 0) {
      if (pathStatus === "valid") cell.classList.add("selected-valid");
      else if (pathStatus === "dup") cell.classList.add("selected-dup");
      else cell.classList.add("selected");
      if (si === 0) cell.classList.add("first");
    }
  }
  currentWordEl.className = "";
  const word = S.selection.map((t) => S.board[t.r * n + t.c]).join("");
  currentWordEl.textContent = word || " ";
  drawLines(pathStatus);
}

function drawLines(status) {
  const n = S.gridSize;
  const dpr = window.devicePixelRatio || 1;
  const rect = boardWrapper.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, rect.width, rect.height);

  if (S.selection.length < 2) return;

  let color = "rgba(74,144,217,0.5)";
  if (status === "valid") color = "rgba(52,199,89,0.6)";
  else if (status === "dup") color = "rgba(255,149,0,0.6)";

  const cells = boardEl.children;
  const points = S.selection.map((t) => {
    const el = cells[t.r * n + t.c];
    const cr = el.getBoundingClientRect();
    return {
      x: cr.left - rect.left + cr.width / 2,
      y: cr.top - rect.top + cr.height / 2,
    };
  });

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

// ============================================================
// POINTER / TOUCH HANDLING
// ============================================================
let dragging = false;

function tileAtPoint(x, y) {
  const n = S.gridSize;
  const rect = boardEl.getBoundingClientRect();
  const w = rect.width / n;
  const h = rect.height / n;
  const col = Math.floor((x - rect.left) / w);
  const row = Math.floor((y - rect.top) / h);
  if (row < 0 || row >= n || col < 0 || col >= n) return null;
  const cx = rect.left + (col + 0.5) * w;
  const cy = rect.top + (row + 0.5) * h;
  const hw = w * CONFIG.tileHitboxSize;
  const hh = h * CONFIG.tileHitboxSize;
  if (Math.abs(x - cx) > hw || Math.abs(y - cy) > hh) return null;
  return { r: row, c: col };
}

function isAdj(a, b) {
  return (
    Math.abs(a.r - b.r) <= 1 &&
    Math.abs(a.c - b.c) <= 1 &&
    !(a.r === b.r && a.c === b.c)
  );
}

function onPointerDown(e) {
  const tile = tileAtPoint(e.clientX, e.clientY);
  if (!tile) return;
  dragging = true;
  S.selection = [tile];
  boardEl.setPointerCapture(e.pointerId);
  renderBoard();
}

function onPointerMove(e) {
  if (!dragging) return;
  const tile = tileAtPoint(e.clientX, e.clientY);
  if (!tile) return;
  const last = S.selection[S.selection.length - 1];
  if (tile.r === last.r && tile.c === last.c) return;
  if (S.selection.some((t) => t.r === tile.r && t.c === tile.c)) return;
  if (!isAdj(tile, last)) return;
  S.selection.push(tile);
  renderBoard();
}

function onPointerUp(e) {
  if (!dragging) return;
  dragging = false;
  if (boardEl.hasPointerCapture(e.pointerId)) {
    boardEl.releasePointerCapture(e.pointerId);
  }
  submitWord();
}

boardEl.addEventListener("pointerdown", onPointerDown);
boardEl.addEventListener("pointermove", onPointerMove);
boardEl.addEventListener("pointerup", onPointerUp);
boardEl.addEventListener("pointercancel", () => {
  dragging = false;
  submitWord();
});

// ============================================================
// KEYBOARD INPUT
// ============================================================
function findPath(board, n, seq) {
  function dfs(r, c, i, visited) {
    if (i === seq.length) return [{ r, c }];
    visited.add(r * n + c);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
        if (visited.has(nr * n + nc)) continue;
        if (board[nr * n + nc] !== seq[i]) continue;
        const rest = dfs(nr, nc, i + 1, visited);
        if (rest) {
          visited.delete(r * n + c);
          return [{ r, c }, ...rest];
        }
      }
    }
    visited.delete(r * n + c);
    return null;
  }

  for (let i = 0; i < n * n; i++) {
    if (board[i] === seq[0]) {
      const path = dfs(Math.floor(i / n), i % n, 1, new Set());
      if (path) return path;
    }
  }
  return null;
}

document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (/^[a-zA-Z]$/.test(key)) {
    e.preventDefault();
    const ch = key.toUpperCase();
    const n = S.gridSize;
    const seq = S.selection.map(t => S.board[t.r * n + t.c]).join('') + ch;
    const path = findPath(S.board, n, seq);
    if (path) {
      S.selection = path;
      renderBoard();
    }
  }

  if (key === "Backspace" && S.selection.length) {
    e.preventDefault();
    S.selection.pop();
    renderBoard();
  }

  if (key === "Enter" || key === " ") {
    e.preventDefault();
    submitWord();
  }

  if (key === "Escape") {
    e.preventDefault();
    S.selection = [];
    renderBoard();
  }
});

// ============================================================
// WORD SUBMISSION
// ============================================================
function submitWord() {
  const n = S.gridSize;
  const word = S.selection.map((t) => S.board[t.r * n + t.c]).join("");
  S.selection = [];
  renderBoard();

  if (
    word.length >= 3 &&
    wordSet &&
    wordSet.has(word.toLowerCase()) &&
    !S.foundWords.has(word)
  ) {
    S.foundWords.add(word);
    S.foundList.unshift({ word, score: wordScore(word) });
    S.score += wordScore(word);
    updateScore();
    renderFoundWords();
  }
}


function updateScore() {
  scoreEl.textContent = S.score;
}

// ============================================================
// UI UPDATES
// ============================================================
function renderFoundWords() {
  wordsContainer.innerHTML = "";

  if (S.showSolutions) {
    if (!S.solutionsList) {
      const found = findAllWords(S.board, S.gridSize);
      S.solutionsList = Array.from(found, ([word, score]) => ({ word, score }));
      S.solutionsList.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));
    }

    wordsCountEl.textContent = S.solutionsList.length;
    for (const entry of S.solutionsList) {
      const div = document.createElement("div");
      div.className = "word-entry";
      const found = S.foundWords.has(entry.word);
      if (found) div.classList.add("found");
      div.innerHTML =
        `<span class="word-text">${entry.word}</span>` +
        `<span class="word-score">${entry.score}</span>`;
      wordsContainer.appendChild(div);
    }
    return;
  }

  if (S.foundList.length === 0) {
    wordsContainer.innerHTML =
      '<div class="empty-state">Drag across adjacent letters to find words</div>';
    wordsCountEl.textContent = "0";
    return;
  }
  wordsCountEl.textContent = S.foundList.length;
  for (const entry of S.foundList) {
    const div = document.createElement("div");
    div.className = "word-entry";
    div.innerHTML = `<span class="word-text">${entry.word}</span><span class="word-score">${entry.score}</span>`;
    wordsContainer.appendChild(div);
  }
}

// ============================================================
// NEW GAME
// ============================================================
function newGame() {
  S.board = generateBoard(S.gridSize);
  S.selection = [];
  S.foundWords = new Set();
  S.foundList = [];
  S.score = 0;
  S.showSolutions = false;
  S.solutionsList = null;
  document.getElementById("solutions-btn").textContent = "SOLUTIONS";

  const n = S.gridSize;
  boardEl.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${n}, 1fr)`;
  const fs = n <= 4 ? 'clamp(28px, 7vw, 44px)' : n === 5 ? 'clamp(22px, 5.5vw, 34px)' : 'clamp(18px, 4.5vw, 28px)';
  boardEl.style.setProperty('--cell-fs', fs);

  boardEl.innerHTML = "";
  for (let i = 0; i < n * n; i++) {
    const div = document.createElement("div");
    div.className = "cell";
    boardEl.appendChild(div);
  }

  renderBoard();
  updateScore();
  renderFoundWords();
  currentWordEl.textContent = "Drag to play";
  currentWordEl.className = "hint";
}

// ============================================================
// THEMES
// ============================================================
const THEMES = [
  { id: "dark-purple", colors: ["#0c0c1d", "#1a1a3e", "#0d0d28"] },
  { id: "true-dark", colors: ["#0a0a0a", "#141414", "#0a0a0a"] },
  { id: "deep-slate", colors: ["#0f1117", "#1a1d27", "#0c0d12"] },
  { id: "midnight", colors: ["#0a0e1a", "#111830", "#080b14"] },
  { id: "cream", colors: ["#f5f0e8", "#ece4d6", "#efe6d4"] },
  { id: "sky", colors: ["#e3f0fa", "#d0e3f5", "#d8eaf7"] },
  { id: "mint", colors: ["#e8f4e8", "#d4e8d4", "#dceee0"] },
];

function setTheme(id) {
  document.body.setAttribute("data-theme", id);
  localStorage.setItem("wh-theme", id);
  document.querySelectorAll(".theme-swatch").forEach((el) => {
    el.classList.toggle("active", el.dataset.theme === id);
  });
  if (S.selection.length) drawLines();
}

function buildThemePicker() {
  const container = document.getElementById("theme-picker");
  const saved = localStorage.getItem("wh-theme") || "dark-purple";
  for (const t of THEMES) {
    const swatch = document.createElement("div");
    swatch.className = "theme-swatch" + (t.id === saved ? " active" : "");
    swatch.dataset.theme = t.id;
    swatch.style.background = `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[2]})`;
    swatch.addEventListener("click", () => setTheme(t.id));
    container.appendChild(swatch);
  }
}

// ============================================================
// BOARD SIZE
// ============================================================
function setBoardSize(size) {
  S.gridSize = size;
  localStorage.setItem("wh-size", String(size));
  document.querySelectorAll(".size-btn").forEach((el) => {
    el.classList.toggle("active", Number(el.dataset.size) === size);
  });
  newGame();
}

function buildSizePicker() {
  const container = document.getElementById("size-picker");
  const saved = Number(localStorage.getItem("wh-size")) || 4;
  S.gridSize = saved;
  for (const size of (CONFIG.boardSizes || [4, 5, 6])) {
    const btn = document.createElement("button");
    btn.className = "size-btn" + (size === saved ? " active" : "");
    btn.dataset.size = size;
    btn.textContent = size + "×" + size;
    btn.addEventListener("click", () => setBoardSize(size));
    container.appendChild(btn);
  }
}

// ============================================================
// SOLUTIONS TOGGLE
// ============================================================
document.getElementById("solutions-btn").addEventListener("click", () => {
  S.showSolutions = !S.showSolutions;
  document.getElementById("solutions-btn").textContent =
    S.showSolutions ? "FOUND" : "SOLUTIONS";
  renderFoundWords();
});

// ============================================================
// INIT
// ============================================================
document.getElementById("btn-new").addEventListener("click", newGame);
document.getElementById("btn-settings").addEventListener("click", () => {
  document.getElementById("settings-modal").classList.add("open");
});
document.getElementById("btn-close-settings").addEventListener("click", () => {
  document.getElementById("settings-modal").classList.remove("open");
});
document.getElementById("settings-modal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("open");
});

(function restoreTheme() {
  const saved = localStorage.getItem("wh-theme");
  if (saved) document.body.setAttribute("data-theme", saved);
})();

buildSizePicker();
buildThemePicker();

async function init() {
  const ok = await loadWords();
  loadingOverlay.classList.add("hidden");
  if (ok) newGame();
}

init();
