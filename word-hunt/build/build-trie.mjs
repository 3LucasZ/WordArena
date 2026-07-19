// Run: node build-trie.mjs
// Reads words_raw.txt, builds a prefix trie, and writes trie.json.gz.
// The browser loads trie.json.gz so it doesn't need to build the trie at runtime.

import fs from 'fs';
import zlib from 'zlib';

const text = fs.readFileSync('build/words_raw.txt', 'utf8');
const words = text.trim().split('\n');

const trie = {};
for (const word of words) {
  let node = trie;
  for (const ch of word) {
    if (!node[ch]) node[ch] = {};
    node = node[ch];
  }
  node.$ = 1;
}

const gzipped = zlib.gzipSync(JSON.stringify(trie), { level: 9 });
fs.writeFileSync('assets/trie.json.gz', gzipped);

console.log(`Built from ${words.length} words`);
console.log(`Wrote assets/trie.json.gz (${(gzipped.length / 1024).toFixed(1)}KB)`);
