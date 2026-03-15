const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type Direction = [dr: number, dc: number];

const DIRECTIONS: Record<string, Direction> = {
  horizontal: [0, 1],
  "horizontal-back": [0, -1],
  vertical: [1, 0],
  "vertical-up": [-1, 0],
  diagonal: [1, 1],
  "diagonal-back": [1, -1],
  "diagonal-up": [-1, 1],
  "diagonal-up-back": [-1, -1],
};

const MAX_PLACEMENT_ATTEMPTS = 200;
const MAX_VALIDATION_RETRIES = 50;

/** Simple seeded RNG for reproducible grids. */
function createSeededRandom(seed: number) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function randomInt(max: number, rng: () => number = Math.random): number {
  return Math.floor(rng() * max);
}

function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function generateWordSearchGrid(
  words: string[],
  rows: number,
  cols: number,
  difficulty: "easy" | "medium" | "hard" = "easy",
  seed: number = Date.now()
): string[][] {
  const rng = createSeededRandom(seed);
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array(cols).fill("")
  );

  const allowDiagonal = difficulty !== "easy";
  const dirKeys = allowDiagonal
    ? Object.keys(DIRECTIONS)
    : ["horizontal", "horizontal-back", "vertical", "vertical-up"];

  for (const word of shuffle(words, rng)) {
    const upper = word.toUpperCase().replace(/\s/g, "");
    if (!upper.length) continue;

    const dirKey = dirKeys[randomInt(dirKeys.length, rng)];
    const [dr, dc] = DIRECTIONS[dirKey];
    let placed = false;

    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS && !placed; attempt++) {
      const r0 = randomInt(rows, rng);
      const c0 = randomInt(cols, rng);
      const rEnd = r0 + (upper.length - 1) * dr;
      const cEnd = c0 + (upper.length - 1) * dc;
      if (rEnd < 0 || rEnd >= rows || cEnd < 0 || cEnd >= cols) continue;

      let fits = true;
      for (let i = 0; i < upper.length; i++) {
        const r = r0 + i * dr;
        const c = c0 + i * dc;
        const cell = grid[r][c];
        if (cell !== "" && cell !== upper[i]) {
          fits = false;
          break;
        }
      }
      if (!fits) continue;

      for (let i = 0; i < upper.length; i++) {
        grid[r0 + i * dr][c0 + i * dc] = upper[i];
      }
      placed = true;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "") {
        grid[r][c] = LETTERS[randomInt(LETTERS.length, rng)];
      }
    }
  }

  return grid;
}

/**
 * Check if a word exists in the grid starting at (r0, c0) in direction (dr, dc).
 */
function wordMatchesAt(
  grid: string[][],
  word: string,
  r0: number,
  c0: number,
  dr: number,
  dc: number
): boolean {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const upper = word.toUpperCase().replace(/\s/g, "");
  for (let i = 0; i < upper.length; i++) {
    const r = r0 + i * dr;
    const c = c0 + i * dc;
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    if (grid[r][c] !== upper[i]) return false;
  }
  return true;
}

/**
 * Check if a word exists in the grid in any of the 8 directions.
 */
function gridContainsWord(grid: string[][], word: string): boolean {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const upper = word.toUpperCase().replace(/\s/g, "");
  if (!upper.length || upper.length > Math.max(rows, cols)) return false;

  for (const [dr, dc] of Object.values(DIRECTIONS)) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (wordMatchesAt(grid, upper, r, c, dr, dc)) return true;
      }
    }
  }
  return false;
}

/**
 * Verify that every word in the list appears in the grid (forward or backward
 * in any of the 8 directions). Used to double-check generated puzzles.
 */
export function gridContainsAllWords(
  grid: string[][],
  wordList: string[]
): boolean {
  for (const word of wordList) {
    const upper = word.toUpperCase().replace(/\s/g, "");
    if (!upper.length) continue;
    const reversed = upper.split("").reverse().join("");
    if (!gridContainsWord(grid, upper) && !gridContainsWord(grid, reversed)) {
      return false;
    }
  }
  return true;
}

/**
 * Filter word list to only words that fit in a grid of given size.
 * Ensures no word is longer than the smallest dimension.
 */
export function filterWordsToFit(
  wordList: string[],
  rows: number,
  cols: number
): string[] {
  const maxLen = Math.min(rows, cols);
  return wordList.filter((w) => {
    const len = w.toUpperCase().replace(/\s/g, "").length;
    return len >= 2 && len <= maxLen;
  });
}

/**
 * Generate a word search grid that is guaranteed to contain all words.
 * Filters words to fit the grid, then retries generation (with different seeds)
 * until gridContainsAllWords passes. Throws if no valid grid found after retries.
 */
export function generateValidatedWordSearchGrid(
  words: string[],
  rows: number,
  cols: number,
  difficulty: "easy" | "medium" | "hard" = "easy",
  baseSeed: number = Date.now()
): string[][] {
  const fitted = filterWordsToFit(words, rows, cols);
  if (fitted.length === 0) {
    throw new Error(
      `No words fit in ${rows}x${cols} grid. Max word length is ${Math.min(rows, cols)}.`
    );
  }

  for (let attempt = 0; attempt < MAX_VALIDATION_RETRIES; attempt++) {
    const seed = baseSeed + attempt;
    const grid = generateWordSearchGrid(fitted, rows, cols, difficulty, seed);
    if (gridContainsAllWords(grid, fitted)) {
      return grid;
    }
  }

  throw new Error(
    `Could not generate valid word search for ${fitted.length} words in ${rows}x${cols} after ${MAX_VALIDATION_RETRIES} attempts. Try shorter words or a larger grid.`
  );
}
