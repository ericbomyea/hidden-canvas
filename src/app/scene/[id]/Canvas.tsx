"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Scene } from "@/lib/types";
import { getRegionByNumber } from "@/lib/scenes";
import styles from "./scene.module.css";

const BASE_WIDTH = 960;
const BASE_HEIGHT = 720;
const ZOOM_MIN = 0.35; /* zoom out to 35% so whole image fits on mobile */
const ZOOM_MAX = 3;

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

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
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{
    distance: number;
    zoom: number;
    center: { x: number; y: number };
    scrollLeft: number;
    scrollTop: number;
    rect: DOMRect;
  } | null>(null);

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

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && canvasWrapRef.current) {
        const el = canvasWrapRef.current;
        const rect = el.getBoundingClientRect();
        const dist = distance(
          { x: e.touches[0].clientX, y: e.touches[0].clientY },
          { x: e.touches[1].clientX, y: e.touches[1].clientY }
        );
        const center = midpoint(
          { x: e.touches[0].clientX, y: e.touches[0].clientY },
          { x: e.touches[1].clientX, y: e.touches[1].clientY }
        );
        pinchRef.current = {
          distance: dist,
          zoom,
          center: { x: center.x - rect.left, y: center.y - rect.top },
          scrollLeft: el.scrollLeft,
          scrollTop: el.scrollTop,
          rect,
        };
      }
    },
    [zoom]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const p = pinchRef.current;
        const currentDist = distance(
          { x: e.touches[0].clientX, y: e.touches[0].clientY },
          { x: e.touches[1].clientX, y: e.touches[1].clientY }
        );
        const scale = currentDist / p.distance;
        const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, p.zoom * scale));

        const center = midpoint(
          { x: e.touches[0].clientX, y: e.touches[0].clientY },
          { x: e.touches[1].clientX, y: e.touches[1].clientY }
        );
        const centerInEl = { x: center.x - p.rect.left, y: center.y - p.rect.top };

        const contentX = (p.scrollLeft + p.center.x) / p.zoom;
        const contentY = (p.scrollTop + p.center.y) / p.zoom;
        const newScrollLeft = contentX * newZoom - centerInEl.x;
        const newScrollTop = contentY * newZoom - centerInEl.y;

        setZoom(newZoom);
        if (canvasWrapRef.current) {
          canvasWrapRef.current.scrollLeft = Math.max(0, newScrollLeft);
          canvasWrapRef.current.scrollTop = Math.max(0, newScrollTop);
        }
      }
    },
    []
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
  }, []);

  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const preventTwoFinger = (e: TouchEvent) => {
      if (e.touches.length === 2) e.preventDefault();
    };
    el.addEventListener("touchstart", preventTwoFinger, { passive: false });
    el.addEventListener("touchmove", preventTwoFinger, { passive: false });
    return () => {
      el.removeEventListener("touchstart", preventTwoFinger);
      el.removeEventListener("touchmove", preventTwoFinger);
    };
  }, []);

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
        Scroll to move · Pinch or +/− to zoom
      </p>

      <div
        ref={canvasWrapRef}
        className={styles.canvasWrap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
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
