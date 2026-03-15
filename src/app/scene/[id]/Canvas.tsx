"use client";

import { useState, useCallback } from "react";
import type { Scene } from "@/lib/types";
import { getRegionByNumber } from "@/lib/scenes";
import styles from "./scene.module.css";

const BASE_WIDTH = 960;
const BASE_HEIGHT = 720;
const ZOOM_MIN = 0.75;
const ZOOM_MAX = 3;

interface CanvasProps {
  scene: Scene;
  unlockedNumbers: Set<number>;
  paintedCells: Set<string>;
  onCellTap: (row: number, col: number, number: number) => void;
}

export function Canvas({
  scene,
  unlockedNumbers,
  paintedCells,
  onCellTap,
}: CanvasProps) {
  const [zoom, setZoom] = useState(1);

  const { imageUrl, numberGrid } = scene;
  const rows = numberGrid.length;
  const cols = numberGrid[0]?.length ?? 0;
  const gridStyle = {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
  };

  const getColorForNumber = useCallback(
    (n: number): string => {
      const region = getRegionByNumber(scene, n);
      return region?.color ?? "#ccc";
    },
    [scene]
  );

  const contentWidth = Math.round(BASE_WIDTH * zoom);
  const contentHeight = Math.round(BASE_HEIGHT * zoom);

  return (
    <section className={styles.canvasSection}>
      <div className={styles.zoomControls}>
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - 0.25))}
          aria-label="Zoom out"
        >
          −
        </button>
        <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + 0.25))}
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
      <p className={styles.canvasHint}>
        Scroll to move around · Use +/− to zoom
      </p>

      <div className={styles.canvasWrap}>
        <div
          className={styles.canvasInner}
          style={{
            width: contentWidth,
            height: contentHeight,
          }}
        >
          <div
            className={styles.canvasContent}
            style={{
              width: BASE_WIDTH,
              height: BASE_HEIGHT,
              transform: `scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <div className={styles.imageWrap}>
              <img
                src={imageUrl}
                alt={scene.title}
                className={styles.sceneImage}
                draggable={false}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div
                className={styles.regionGrid}
                style={gridStyle}
              >
                {numberGrid.map((row, r) =>
                  row.map((num, c) => {
                    const key = `${r},${c}`;
                    const painted = paintedCells.has(key);
                    const unlocked = unlockedNumbers.has(num);
                    const color = getColorForNumber(num);
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`${styles.region} ${painted ? styles.regionPainted : ""} ${unlocked && !painted ? styles.regionUnlocked : ""}`}
                        style={
                          painted
                            ? { backgroundColor: color }
                            : undefined
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          onCellTap(r, c, num);
                        }}
                      >
                        {!painted && (
                          <span className={styles.regionNumber}>{num}</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
