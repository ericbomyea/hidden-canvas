/**
 * Get up to maxCount cells that are 4-connected to (row, col), have the same number,
 * and are not yet painted. Used for "fill connected" tap to reduce repetitive tapping.
 */
export function getConnectedSameNumber(
  numberGrid: number[][],
  startRow: number,
  startCol: number,
  number: number,
  paintedCells: Set<string>,
  maxCount: number
): string[] {
  const rows = numberGrid.length;
  const cols = numberGrid[0]?.length ?? 0;
  const result: string[] = [];
  const visited = new Set<string>();
  const queue: [number, number][] = [[startRow, startCol]];
  visited.add(`${startRow},${startCol}`);

  const dirs: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0 && result.length < maxCount) {
    const [r, c] = queue.shift()!;
    const key = `${r},${c}`;
    if (numberGrid[r]?.[c] !== number || paintedCells.has(key)) continue;
    result.push(key);
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      const nkey = `${nr},${nc}`;
      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        !visited.has(nkey) &&
        numberGrid[nr][nc] === number &&
        !paintedCells.has(nkey)
      ) {
        visited.add(nkey);
        queue.push([nr, nc]);
      }
    }
  }
  return result;
}

/** 6-neighbor directions for flat-top hex grid (row, col), axial-style. */
const HEX_DIRS: [number, number][] = [
  [0, 1], [0, -1], [-1, 1], [-1, 0], [1, -1], [1, 0],
];

/**
 * Same as getConnectedSameNumber but for hex grid: 6-connected neighbors.
 */
export function getConnectedSameNumberHex(
  numberGrid: number[][],
  startRow: number,
  startCol: number,
  number: number,
  paintedCells: Set<string>,
  maxCount: number
): string[] {
  const rows = numberGrid.length;
  const cols = numberGrid[0]?.length ?? 0;
  const result: string[] = [];
  const visited = new Set<string>();
  const queue: [number, number][] = [[startRow, startCol]];
  visited.add(`${startRow},${startCol}`);

  while (queue.length > 0 && result.length < maxCount) {
    const [r, c] = queue.shift()!;
    const key = `${r},${c}`;
    if (numberGrid[r]?.[c] !== number || paintedCells.has(key)) continue;
    result.push(key);
    for (const [dr, dc] of HEX_DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const nkey = `${nr},${nc}`;
      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        !visited.has(nkey) &&
        numberGrid[nr][nc] === number &&
        !paintedCells.has(nkey)
      ) {
        visited.add(nkey);
        queue.push([nr, nc]);
      }
    }
  }
  return result;
}
