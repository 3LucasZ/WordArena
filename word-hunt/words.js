// Word Arena — word list, trie, and solver
let wordSet = null;
let solutionsTrie = null;

async function loadWords() {
  try {
    const resp = await fetch("words_raw.txt");
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const text = await resp.text();
    wordSet = new Set(text.trim().split("\n"));
    buildSolutionsTrie();
    return true;
  } catch (e) {
    const p = document.querySelector("#loading-overlay p");
    p.textContent =
      "Could not load word list. Make sure you are serving via HTTP.";
    console.error("Failed to load words:", e);
    return false;
  }
}

function buildSolutionsTrie() {
  if (solutionsTrie) return;
  const root = {};
  for (const word of wordSet) {
    if (word.length < 4) continue;
    let node = root;
    for (const ch of word) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
    }
    node.$ = true;
  }
  solutionsTrie = root;
}

function findAllWords(board, n) {
  const found = new Map();
  const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

  function dfs(r, c, node, prefix, visited) {
    const ch = board[r * n + c].toLowerCase();
    const next = node[ch];
    if (!next) return;

    const word = prefix + ch;
    if (next.$ && word.length >= 4) {
      const upper = word.toUpperCase();
      if (!found.has(upper)) {
        found.set(upper, wordScore(upper));
      }
    }

    visited.add(r * n + c);
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited.has(nr * n + nc)) {
        dfs(nr, nc, next, word, visited);
      }
    }
    visited.delete(r * n + c);
  }

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      dfs(r, c, solutionsTrie, "", new Set());
    }
  }

  return found;
}

function wordScore(word) {
  const len = word.length;
  if (len < 3) return 0;
  const map = {3: 100, 4: 400, 5: 800, 6: 1200, 7: 1600, 8: 2000};
  return map[len] || 2000 + (len - 8) * 400;
}
