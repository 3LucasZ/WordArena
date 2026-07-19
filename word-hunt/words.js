// Word Arena — pre-built trie and solver
let solutionsTrie = null;

async function loadWords() {
  try {
    console.time("fetch");
    const resp = await fetch("assets/trie.json.gz");
    const compressed = await resp.arrayBuffer();
    console.timeEnd("fetch");

    console.time("decompress+parse");
    const ds = new DecompressionStream("gzip");
    solutionsTrie = await new Response(
      new ReadableStream({ start(ctrl) { ctrl.enqueue(new Uint8Array(compressed)); ctrl.close(); } }).pipeThrough(ds)
    ).json();
    console.timeEnd("decompress+parse");
    return true;
  } catch (e) {
    const p = document.querySelector("#loading-overlay p");
    p.textContent =
      "Could not load word list. Make sure you are serving via HTTP.";
    console.error("Failed to load words:", e);
    return false;
  }
}

function isValidWord(word) {
  if (!solutionsTrie) return false;
  let node = solutionsTrie;
  for (const ch of word) {
    if (!node[ch]) return false;
    node = node[ch];
  }
  return node.$ === 1;
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
