"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Scene, SceneRegion } from "@/lib/types";
import { getRegionByNumber } from "@/lib/scenes";
import styles from "./scene.module.css";

const PAN_FACTOR = 0.85;
const PAN_THRESHOLD_PX = 8;
const ZOOM_MIN = 0.75;
const ZOOM_MAX = 2;

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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  const pinchRef = useRef<{
    distance: number;
    center: { x: number; y: number };
    zoom: number;
    pan: { x: number; y: number };
  } | null>(null);

  const canvasWrapRef = useRef<HTMLDivElement>(null);

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

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)));
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.button !== undefined) return;
      hasMovedRef.current = false;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      panStartRef.current = {
        x: e.clientX - pan.x / PAN_FACTOR,
        y: e.clientY - pan.y / PAN_FACTOR,
      };
    },
    [pan]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;
      if (!hasMovedRef.current && (Math.abs(dx) > PAN_THRESHOLD_PX || Math.abs(dy) > PAN_THRESHOLD_PX)) {
        hasMovedRef.current = true;
        setIsPanning(true);
      }
      if (isPanning && hasMovedRef.current) {
        setPan({
          x: (e.clientX - panStartRef.current.x) * PAN_FACTOR,
          y: (e.clientY - panStartRef.current.y) * PAN_FACTOR,
        });
      }
    },
    [isPanning]
  );

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = {
          distance: distance(
            { x: e.touches[0].clientX, y: e.touches[0].clientY },
            { x: e.touches[1].clientX, y: e.touches[1].clientY }
          ),
          center: midpoint(
            { x: e.touches[0].clientX, y: e.touches[0].clientY },
            { x: e.touches[1].clientX, y: e.touches[1].clientY }
          ),
          zoom,
          pan: { ...pan },
        };
      }
    },
    [zoom, pan]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        const p = pinchRef.current;
        const currentDist = distance(
          { x: e.touches[0].clientX, y: e.touches[0].clientY },
          { x: e.touches[1].clientX, y: e.touches[1].clientY }
        );
        const currentCenter = midpoint(
          { x: e.touches[0].clientX, y: e.touches[0].clientY },
          { x: e.touches[1].clientX, y: e.touches[1].clientY }
        );
        const scale = currentDist / p.distance;
        const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, p.zoom * scale));
        const contentX = (p.center.x - p.pan.x) / p.zoom;
        const contentY = (p.center.y - p.pan.y) / p.zoom;
        setZoom(newZoom);
        setPan({
          x: currentCenter.x - contentX * newZoom,
          y: currentCenter.y - contentY * newZoom,
        });
        pinchRef.current = {
          distance: currentDist,
          center: currentCenter,
          zoom: newZoom,
          pan: { x: currentCenter.x - contentX * newZoom, y: currentCenter.y - contentY * newZoom },
        };
      }
    },
    []
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
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
        ref={canvasWrapRef}
        className={styles.canvasWrap}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
