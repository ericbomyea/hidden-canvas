const wordFromPath = (
  grid: string[][],
  path: { row: number; col: number }[]
): string => {
  const raw = path.map((p) => grid[p.row]?.[p.col] ?? "").join("");
  return raw.toUpperCase();
};

/** Check if selection spells a word from the given list (forward or reverse). */
export function getWordFromList(
  grid: string[][],
  path: { row: number; col: number }[],
  wordList: string[]
): string | null {
  if (path.length < 2) return null;
  const upper = wordFromPath(grid, path);
  const reversed = upper.split("").reverse().join("");
  const set = new Set(wordList.map((w) => w.toUpperCase().replace(/\s/g, "")));
  if (set.has(upper)) return upper;
  if (set.has(reversed)) return reversed;
  return null;
}

/**
 * Check if a selection path spells a word in the grid,
 * and return the word and region id if it matches (legacy map format).
 */
export function getWordFromSelection(
  grid: string[][],
  path: { row: number; col: number }[],
  wordToRegionMap: Record<string, string>
): { word: string; regionId: string } | null {
  if (path.length < 2) return null;
  const upper = wordFromPath(grid, path);
  const reversed = upper.split("").reverse().join("");
  if (wordToRegionMap[upper]) {
    return { word: upper, regionId: wordToRegionMap[upper] };
  }
  if (wordToRegionMap[reversed]) {
    return { word: reversed, regionId: wordToRegionMap[reversed] };
  }
  return null;
}
