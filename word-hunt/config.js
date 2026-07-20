// Word Arena — game configuration
// Edit any value below and refresh the page to see changes.

const CONFIG = {
  // Tile hitbox: fraction of the cell's width/height from center.
  // 0.35 means the hitbox is 70% of the cell's total area (35% margin each side).
  // Increase to make tiles easier to hit (less precise), decrease for tighter control.
  tileHitboxSize: 0.4,

  // Board size options shown in settings (can be overridden via settings UI)
  boardSizes: [4, 5, 6],

  // Sound effect played when finding a correct word. Relative to the game root.
  correctSoundFile: "assets/correct1.mp3",

  // Sound effect played when selecting a letter. Relative to the game root.
  selectSoundFile: "assets/select1.mp3",

  // Volume for the correct-word sound (0 to 1).
  correctSoundVolume: 0.3,

  // Volume for the letter-select sound (0 to 1).
  selectSoundVolume: 0.3,

  // Play confetti burst on long words (6+ letters).
  confettiEnabled: false,

  // Timer mode: number of seconds on the clock, or null for infinite.
  timerDefault: null,

  // Default seconds added to the clock per word found (like chess increment).
  // Overridden by the in-game increment picker if set.
  timerIncrement: 2,

  // App version — bump this to know your latest updates applied.
  version: "1.0.2",
};
