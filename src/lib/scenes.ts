import type { Scene, SceneRegion } from "./types";
import {
  generateValidatedWordSearchGrid,
  filterWordsToFit,
} from "./grid-generator";

/** Word counts: 3 = easy, 5 = medium, 10 = hard, 25 = epic surprise. Grid size by word count. */
const GRID_SIZE_BY_WORDS: Record<number, number> = {
  3: 4,
  5: 6,
  10: 9,
  25: 15,
};

function buildRegion(
  regionIndex: number,
  number: number,
  color: string,
  words: string[],
  wordCount: 3 | 5 | 10 | 25
): SceneRegion {
  const id = `r-${regionIndex}`;
  const seed = id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const size = GRID_SIZE_BY_WORDS[wordCount];
  const fitted = filterWordsToFit(words, size, size).slice(0, wordCount);
  if (fitted.length < Math.min(2, wordCount)) {
    throw new Error(
      `Region ${number}: not enough words fit in ${size}x${size} (need ${wordCount}).`
    );
  }
  const grid = generateValidatedWordSearchGrid(
    fitted,
    size,
    size,
    "medium",
    seed
  );
  return {
    id,
    number,
    color,
    wordSearch: { wordList: fitted, grid },
  };
}

/** 25-word list for the epic puzzle (region 11). All ≤14 letters for 14×14 grid. */
const EPIC_WORDS = [
  "MOUNTAIN", "LAKE", "WATER", "SKY", "CLOUD", "TREE", "PINE", "ROCK", "SUN",
  "WAVE", "BOAT", "SHORE", "SAND", "GRASS", "BIRD", "LEAF", "STONE", "WIND",
  "PEAK", "REFLECT", "CALM", "GREEN", "BLUE", "STILL", "FLOW",
];

/** One scene: mountain lake. Mix of 3-word (easy), 5-word, 10-word, and one 25-word puzzle. */
const MOUNTAIN_LAKE_REGIONS: SceneRegion[] = [
  buildRegion(0, 1, "#87CEEB", ["SKY", "BLUE", "AIR"], 3),
  buildRegion(1, 2, "#B0C4DE", ["SKY", "BIRD", "WING"], 3),
  buildRegion(2, 3, "#7EB8DA", ["LAKE", "BLUE", "WAVE"], 3),
  buildRegion(3, 4, "#5A9FB8", ["WAVE", "BOAT", "DOCK", "DEEP", "FLOAT"], 5),
  buildRegion(4, 5, "#4A7C59", ["PINE", "TREE", "LEAF"], 3),
  buildRegion(5, 6, "#3D6B4A", ["WOOD", "BARK", "ROOT"], 3),
  buildRegion(6, 7, "#8B7355", ["ROCK", "GRAY", "CLIFF", "STONE", "SLOPE"], 5),
  buildRegion(7, 8, "#6B5344", ["DIRT", "PATH", "GROUND"], 3),
  buildRegion(8, 9, "#C9A959", ["SUN", "GOLD", "WARM", "DAWN", "GLOW", "LIGHT", "RISE", "BEAM", "HEAT", "DAY"], 10),
  buildRegion(9, 10, "#E8D5B7", ["SAND", "SHORE", "PALE"], 3),
  buildRegion(10, 11, "#7EB8DA", EPIC_WORDS, 25),
  buildRegion(11, 12, "#4A7C59", ["GROW", "SEED", "SOIL", "LAWN", "DEW"], 5),
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
