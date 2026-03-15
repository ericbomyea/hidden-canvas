import type { Scene, SceneRegion } from "./types";
import {
  generateValidatedWordSearchGrid,
  filterWordsToFit,
} from "./grid-generator";

/** Word counts: 3 = easy, 5 = medium, 10 = hard (max for mobile-friendly). Grid size by word count. */
const GRID_SIZE_BY_WORDS: Record<number, number> = {
  3: 4,
  5: 6,
  10: 9,
};

function buildRegion(
  regionIndex: number,
  number: number,
  color: string,
  words: string[],
  wordCount: 3 | 5 | 10
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

/** 10-word list for the challenge puzzle (region 11). Capped at 10 for mobile. */
const CHALLENGE_WORDS = [
  "MOUNTAIN", "LAKE", "WATER", "SKY", "CLOUD", "TREE", "PINE", "ROCK", "WAVE", "SUN",
];

/** One scene: mountain lake. Mix of 3-word (easy), 5-word, and 10-word puzzles (max 10 for mobile). */
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
  buildRegion(10, 11, "#7EB8DA", CHALLENGE_WORDS, 10),
  buildRegion(11, 12, "#4A7C59", ["GROW", "SEED", "SOIL", "LAWN", "DEW"], 5),
  buildRegion(12, 13, "#9BB8D4", ["CLOUD", "MIST", "HAZE"], 3),
  buildRegion(13, 14, "#6B8E9F", ["WAVE", "DEEP", "COOL"], 3),
  buildRegion(14, 15, "#5C8A6A", ["FERN", "MOSS", "DEW"], 3),
  buildRegion(15, 16, "#A08060", ["CLAY", "SOIL", "DUST"], 3),
  buildRegion(16, 17, "#E8C547", ["DAWN", "GLOW", "RAY"], 3),
  buildRegion(17, 18, "#7A9E7E", ["REED", "RUSH", "BOG"], 3),
];

/** Higher resolution: 48×64 = 3072 cells for a clearer, more rewarding painted image. */
const PIXEL_ROWS = 48;
const PIXEL_COLS = 64;
const NUM_COLORS = 18;

function wave(row: number, col: number, scale: number): number {
  const x = col * scale;
  const y = row * scale;
  return (Math.sin(x) * 0.3 + Math.sin(y * 0.7) * 0.2 + Math.sin((x + y) * 0.5) * 0.3 + 0.5);
}

function buildNumberGrid(rows: number, cols: number): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      const rowProgress = r / rows;
      const wobble = wave(r, c, 0.25) * 4;
      const band = (rowProgress * NUM_COLORS + wobble + (c / cols) * 1.5) % NUM_COLORS;
      const n = 1 + Math.floor((band + NUM_COLORS) % NUM_COLORS);
      row.push(Math.min(NUM_COLORS, Math.max(1, n)));
    }
    grid.push(row);
  }
  return grid;
}

const MOUNTAIN_LAKE_GRID = buildNumberGrid(PIXEL_ROWS, PIXEL_COLS);

/** Sunset Beach: warm palette, beach-themed words */
const SUNSET_BEACH_REGIONS: SceneRegion[] = [
  buildRegion(0, 1, "#FFE4C4", ["SUN", "SKY", "GOLD"], 3),
  buildRegion(1, 2, "#FFB347", ["GLOW", "WARM", "FIRE"], 3),
  buildRegion(2, 3, "#FF7F50", ["ROSE", "RED", "HUE"], 3),
  buildRegion(3, 4, "#87CEEB", ["WAVE", "SEA", "FOAM", "TIDE", "SURF"], 5),
  buildRegion(4, 5, "#F4A460", ["SAND", "DUNE", "WARM"], 3),
  buildRegion(5, 6, "#DEB887", ["WAVE", "SAND", "SUN"], 3),
  buildRegion(6, 7, "#D2691E", ["ROCK", "PIER", "JETTY", "SHORE", "REEF"], 5),
  buildRegion(7, 8, "#8B4513", ["WOOD", "LOG", "BOAT"], 3),
  buildRegion(8, 9, "#FFD700", ["LIGHT", "DAWN", "DUSK", "RISE", "SET", "BEAM", "SKY", "GOLD", "FIRE", "GLOW"], 10),
  buildRegion(9, 10, "#F0E68C", ["PALE", "SAND", "PALM"], 3),
  buildRegion(10, 11, "#FF8C00", ["SUNSET", "BEACH", "OCEAN", "WAVE", "SAND", "PALM", "SKY", "GOLD", "WARM", "COAST"], 10),
  buildRegion(11, 12, "#228B22", ["PALM", "LEAF", "TREE", "SHADE", "COOL"], 5),
  buildRegion(12, 13, "#B0C4DE", ["SKY", "PINK", "SOFT"], 3),
  buildRegion(13, 14, "#E0B0FF", ["DUSK", "PINK", "SKY"], 3),
  buildRegion(14, 15, "#98FB98", ["SEA", "FOAM", "MINT"], 3),
  buildRegion(15, 16, "#CD853F", ["PERU", "EARTH", "CLAY"], 3),
  buildRegion(16, 17, "#FFA07A", ["PINK", "ROSE", "DUST"], 3),
  buildRegion(17, 18, "#20B2AA", ["AQUA", "TEAL", "REEF"], 3),
];

/** Forest Path: greens and browns, nature words */
const FOREST_PATH_REGIONS: SceneRegion[] = [
  buildRegion(0, 1, "#228B22", ["LEAF", "TREE", "GREEN"], 3),
  buildRegion(1, 2, "#2E8B57", ["FERN", "MOSS", "IVY"], 3),
  buildRegion(2, 3, "#3CB371", ["LAWN", "GROW", "LEAF"], 3),
  buildRegion(3, 4, "#6B8E23", ["BRANCH", "BARK", "ROOT", "WOOD", "TRUNK"], 5),
  buildRegion(4, 5, "#8B4513", ["BARK", "LOG", "ROOT"], 3),
  buildRegion(5, 6, "#A0522D", ["DIRT", "PATH", "SOIL"], 3),
  buildRegion(6, 7, "#556B2F", ["FOREST", "SHADE", "CANOPY", "TRAIL", "WALK"], 5),
  buildRegion(7, 8, "#654321", ["MUD", "EARTH", "STEP"], 3),
  buildRegion(8, 9, "#2F4F4F", ["STONE", "ROCK", "GRAY", "MOSS", "COOL", "DARK", "SHADE", "FERN", "DEW", "WET"], 10),
  buildRegion(9, 10, "#DEB887", ["TWIG", "STICK", "FALL"], 3),
  buildRegion(10, 11, "#8FBC8F", ["FOREST", "PATH", "TREE", "LEAF", "MOSS", "FERN", "DEW", "SHADE", "WOOD", "NATURE"], 10),
  buildRegion(11, 12, "#4A7C59", ["PINE", "CONE", "NEEDLE", "SAP", "SMELL"], 5),
  buildRegion(12, 13, "#5C4033", ["RUST", "DRY", "DARK"], 3),
  buildRegion(13, 14, "#006400", ["DARK", "DEEP", "WOOD"], 3),
  buildRegion(14, 15, "#9ACD32", ["LIME", "LIGHT", "NEW"], 3),
  buildRegion(15, 16, "#8B7355", ["TAN", "SAND", "DUST"], 3),
  buildRegion(16, 17, "#6B8E23", ["ARMY", "SAGE", "LEAF"], 3),
  buildRegion(17, 18, "#808000", ["LEAF", "DULL", "DARK"], 3),
];

/** Garden: bright florals and greens */
const GARDEN_REGIONS: SceneRegion[] = [
  buildRegion(0, 1, "#FFB6C1", ["ROSE", "PINK", "BUD"], 3),
  buildRegion(1, 2, "#FF69B4", ["SOFT", "PINK", "ROSE"], 3),
  buildRegion(2, 3, "#FFC0CB", ["DEW", "MIST", "SOFT"], 3),
  buildRegion(3, 4, "#32CD32", ["LEAF", "STEM", "GROW", "LAWN", "GRASS"], 5),
  buildRegion(4, 5, "#FFD700", ["SUN", "GLOW", "GOLD"], 3),
  buildRegion(5, 6, "#9370DB", ["IRIS", "BLUE", "BUD"], 3),
  buildRegion(6, 7, "#FF6347", ["TULIP", "POPPY", "RED", "ROSE", "PETAL"], 5),
  buildRegion(7, 8, "#87CEEB", ["SKY", "BLUE", "CLEAR"], 3),
  buildRegion(8, 9, "#FF4500", ["ORANGE", "MARIGOLD", "ZINNIA", "WARM", "FLAME", "COPPER", "RUST", "GLOW", "SUN", "FIRE"], 10),
  buildRegion(9, 10, "#FFFFFF", ["LILY", "PURE", "SNOW"], 3),
  buildRegion(10, 11, "#4B0082", ["IRIS", "VIOLET", "GARDEN", "FLOWER", "BLOOM", "ROSE", "LEAF", "BEE", "SUN", "DEW"], 10),
  buildRegion(11, 12, "#228B22", ["GREEN", "BUSH", "HEDGE", "LAWN", "LEAF"], 5),
  buildRegion(12, 13, "#DDA0DD", ["PLUM", "PINK", "ROSE"], 3),
  buildRegion(13, 14, "#F0E68C", ["GOLD", "SUN", "DEW"], 3),
  buildRegion(14, 15, "#98FB98", ["MINT", "FRESH", "PALE"], 3),
  buildRegion(15, 16, "#BC8F8F", ["ROSE", "DUST", "PALE"], 3),
  buildRegion(16, 17, "#FFA500", ["FIRE", "WARM", "GLOW"], 3),
  buildRegion(17, 18, "#40E0D0", ["BLUE", "AQUA", "SKY"], 3),
];

const SUNSET_BEACH_GRID = buildNumberGrid(PIXEL_ROWS, PIXEL_COLS);
const FOREST_PATH_GRID = buildNumberGrid(PIXEL_ROWS, PIXEL_COLS);
const GARDEN_GRID = buildNumberGrid(PIXEL_ROWS, PIXEL_COLS);

export const SCENES: Scene[] = [
  {
    id: "mountain-lake",
    title: "Mountain Lake",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    numberGrid: MOUNTAIN_LAKE_GRID,
    regions: MOUNTAIN_LAKE_REGIONS,
  },
  {
    id: "sunset-beach",
    title: "Sunset Beach",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80",
    numberGrid: SUNSET_BEACH_GRID,
    regions: SUNSET_BEACH_REGIONS,
  },
  {
    id: "forest-path",
    title: "Forest Path",
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80",
    numberGrid: FOREST_PATH_GRID,
    regions: FOREST_PATH_REGIONS,
  },
  {
    id: "garden",
    title: "Garden",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80",
    numberGrid: GARDEN_GRID,
    regions: GARDEN_REGIONS,
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
