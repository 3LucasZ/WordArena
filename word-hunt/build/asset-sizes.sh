# Run: bash build/asset-sizes.sh
# Prints size of every distributable file in the project.

cd "$(dirname "$0")/.."

kb() {
  awk '{printf "%d KB", $1/1024}'
}

echo "=== Source ==="
for f in index.html styles.css config.js words.js game.js; do
  size=$(wc -c < "$f" | kb)
  printf "  %-6s %s\n" "$size" "$f"
done

echo ""
echo "=== Assets ==="
for f in assets/*; do
  size=$(wc -c < "$f" | kb)
  printf "  %-6s %s\n" "$size" "${f#assets/}"
done

echo ""
echo "=== Totals ==="
source=$(cat index.html styles.css config.js words.js game.js | wc -c | kb)
assets=$(cat assets/* | wc -c | kb)
total=$(cat index.html styles.css config.js words.js game.js assets/* | wc -c | kb)
printf "  %-6s Source\n" "$source"
printf "  %-6s Assets\n" "$assets"
printf "  %-6s Combined\n" "$total"
