import type { Scene, SceneRegion } from "./types";
import {
  generateValidatedWordSearchGrid,
  filterWordsToFit,
} from "./grid-generator";

/** Short word-search puzzles: 4×4 grid, 3 words max (quick interrupt, not a long task). */
const WORD_SEARCH_SIZE = 4;
const WORD_SEARCH_WORDS = 3;

function buildRegion(
  regionIndex: number,
  number: number,
  color: string,
  words: string[]
): SceneRegion {
  const id = `r-${regionIndex}`;
  const seed = id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const fitted = filterWordsToFit(words, WORD_SEARCH_SIZE, WORD_SEARCH_SIZE).slice(
    0,
    WORD_SEARCH_WORDS
  );
  if (fitted.length === 0) {
    throw new Error(
      `Region ${number}: no words fit in ${WORD_SEARCH_SIZE}x${WORD_SEARCH_SIZE}. Max length is ${WORD_SEARCH_SIZE}.`
    );
  }
  const grid = generateValidatedWordSearchGrid(
    fitted,
    WORD_SEARCH_SIZE,
    WORD_SEARCH_SIZE,
    "easy",
    seed
  );
  return {
    id,
    number,
    color,
    wordSearch: { wordList: fitted, grid },
  };
}

/** One scene: mountain lake. 12 numbers, each with a short 3-word puzzle. */
const MOUNTAIN_LAKE_REGIONS: SceneRegion[] = [
  buildRegion(0, 1, "#87CEEB", ["SKY", "BLUE", "AIR"]),
  buildRegion(1, 2, "#B0C4DE", ["SKY", "BIRD", "WING"]),
  buildRegion(2, 3, "#7EB8DA", ["LAKE", "BLUE", "WAVE"]),
  buildRegion(3, 4, "#5A9FB8", ["WAVE", "BOAT", "DEEP"]),
  buildRegion(4, 5, "#4A7C59", ["PINE", "TREE", "LEAF"]),
  buildRegion(5, 6, "#3D6B4A", ["WOOD", "BARK", "ROOT"]),
  buildRegion(6, 7, "#8B7355", ["ROCK", "GRAY", "CLIFF"]),
  buildRegion(7, 8, "#6B5344", ["DIRT", "PATH", "GROUND"]),
  buildRegion(8, 9, "#C9A959", ["SUN", "GOLD", "WARM"]),
  buildRegion(9, 10, "#E8D5B7", ["SAND", "SHORE", "PALE"]),
  buildRegion(10, 11, "#7EB8DA", ["LAKE", "CALM", "WAVE"]),
  buildRegion(11, 12, "#4A7C59", ["GROW", "SEED", "SOIL"]),
];

/** Pixel-art paint-by-numbers: large grid, 4:3 ratio so cells stay square. 24×32 = 768 cells. */
const PIXEL_ROWS = 24;
const PIXEL_COLS = 32;

function wave(row: number, col: number, scale: number): number {
  const x = col * scale;
  const y = row * scale;
  return (Math.sin(x) * 0.3 + Math.sin(y * 0.7) * 0.2 + Math.sin((x + y) * 0.5) * 0.3 + 0.5);
}

function mountainLakeNumberGrid(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < PIXEL_ROWS; r++) {
    const row: number[] = [];
    const x = (r + 1) * 0.4 + wave(r, 0, 0.25) * 4;
    for (let c = 0; c < PIXEL_COLS; c++) {
      const wobble = wave(r, c, 0.4) * 3;
      const horizon = 5 + x + wobble;
      const shore = 13 + wave(r, c, 0.3) * 4;
      const trees = 18 + wave(r, c, 0.35) * 3;
      // Landscape bands with horizontal variation (pixel-art “shape”)
      let n: number;
      if (r < horizon) {
        n = 1 + Math.floor(wave(r, c, 0.5) * 2) % 2;
      } else if (r < shore) {
        n = 3 + Math.floor(wave(r, c, 0.45) * 2) % 2;
      } else if (r < trees) {
        n = 5 + Math.floor(wave(r, c, 0.4) * 4) % 4;
      } else {
        n = 9 + Math.floor(wave(r, c, 0.35) * 4) % 4;
      }
      row.push(Math.min(12, Math.max(1, n)));
    }
    grid.push(row);
  }
  return grid;
}

export const SCENES: Scene[] = [
  {
    id: "mountain-lake",
    title: "Mountain Lake",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    numberGrid: mountainLakeNumberGrid(),
    regions: MOUNTAIN_LAKE_REGIONS,
  },
];

export function getSceneById(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id);
}

export function getSceneRegion(scene: Scene, regionId: string): SceneRegion | undefined {
  return scene.regions.find((r) => r.id === regionId);
}

export function getRegionByNumber(scene: Scene, number: number): SceneRegion | undefined {
  return scene.regions.find((r) => r.number === number);
}
