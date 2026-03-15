"use client";

import { useState, useCallback } from "react";
import type { Scene, SceneRegion } from "@/lib/types";
import { getRegionByNumber } from "@/lib/scenes";
import styles from "./scene.module.css";

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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom((z) => Math.min(2, Math.max(0.75, z + delta)));
    },
    []
  );

  const PAN_FACTOR = 0.85;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x / PAN_FACTOR, y: e.clientY - pan.y / PAN_FACTOR });
  }, [pan]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      setPan({
        x: (e.clientX - panStart.x) * PAN_FACTOR,
        y: (e.clientY - panStart.y) * PAN_FACTOR,
      });
    },
    [isPanning, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const { imageUrl, numberGrid, regions } = scene;
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

  return (
    <section className={styles.canvasSection}>
      <div className={styles.zoomControls}>
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))}
          aria-label="Zoom out"
        >
          −
        </button>
        <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
          aria-label="Zoom in"
        >
          +
        </button>
      </div>

      <div
        className={styles.canvasWrap}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className={styles.canvasInner}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
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
    </section>
  );
}
