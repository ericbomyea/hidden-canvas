/** Mini word search attached to a paint-by-numbers region. */
export interface MiniWordSearch {
  wordList: string[];
  grid: string[][];
}

/** One numbered region of the canvas. Unlock by completing its word search. */
export interface SceneRegion {
  id: string;
  number: number;
  color: string;
  wordSearch: MiniWordSearch;
}

/** Cell shape for the canvas: square grid or hex grid (classic paint-by-numbers style). */
export type CellShape = "square" | "hex";

/** A full paint-by-numbers scene: one big image + grid of numbered cells. */
export interface Scene {
  id: string;
  title: string;
  /** Full image URL (landscape, line art, or photo). */
  imageUrl: string;
  /** Grid of cell numbers (1-based). Same number can appear in many cells. */
  numberGrid: number[][];
  /** Region definitions: number → color + word search. */
  regions: SceneRegion[];
  /** Render cells as squares (default) or hexagons for a softer, classic look. */
  cellShape?: CellShape;
}

export interface GridCell {
  row: number;
  col: number;
  letter: string;
}
