# WordArena

- Creating a new letter sequence
  - going back on a letter should not toggle it off
  - if you don't want a letter sequence anymore, releasing should be the only way to reset it
- Sensitivity
  - Problem: sometimes I do a diagonal move and it also includes neighboring letters without my intent when I move fast
  - Solution: cell's hitbox is 70% of its visual area
- Feedback
  - correct sequence, show green
  - incorrect sequence, show nothing
  - already seen sequence, show yellow
  - lines that connect between each sequential letter you pass through
  - should be fast, quick feedback
- Word dictionary
  - https://github.com/dwyl/english-words (popular)
  - filter to 3+ letter lowercase words, no upper bound
