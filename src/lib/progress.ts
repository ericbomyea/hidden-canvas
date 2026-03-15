const STORAGE_KEY_PREFIX = "hidden-canvas-progress-";

export interface SceneProgress {
  unlockedNumbers: number[];
  paintedCells: string[];
}

export function loadProgress(sceneId: string): SceneProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + sceneId);
    if (!raw) return null;
    const data = JSON.parse(raw) as SceneProgress;
    if (!Array.isArray(data.unlockedNumbers) || !Array.isArray(data.paintedCells))
      return null;
    return data;
  } catch {
    return null;
  }
}

export function saveProgress(
  sceneId: string,
  unlockedNumbers: Set<number>,
  paintedCells: Set<string>
): void {
  if (typeof window === "undefined") return;
  try {
    const data: SceneProgress = {
      unlockedNumbers: Array.from(unlockedNumbers),
      paintedCells: Array.from(paintedCells),
    };
    window.localStorage.setItem(
      STORAGE_KEY_PREFIX + sceneId,
      JSON.stringify(data)
    );
  } catch {
    // ignore
  }
}
