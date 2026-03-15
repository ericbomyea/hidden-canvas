"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { getWordFromList } from "@/lib/word-search";
import type { SceneRegion } from "@/lib/types";
import styles from "./scene.module.css";

function getPathFromSelection(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): { row: number; col: number }[] {
  const path: { row: number; col: number }[] = [];
  const dr = endRow - startRow;
  const dc = endCol - startCol;
  const steps = Math.max(Math.abs(dr), Math.abs(dc), 1);
  const stepR = dr === 0 ? 0 : dr > 0 ? 1 : -1;
  const stepC = dc === 0 ? 0 : dc > 0 ? 1 : -1;
  for (let i = 0; i <= steps; i++) {
    path.push({
      row: startRow + i * stepR,
      col: startCol + i * stepC,
    });
  }
  return path;
}

interface WordSearchModalProps {
  region: SceneRegion;
  onComplete: () => void;
  onClose: () => void;
}

export function WordSearchModal({
  region,
  onComplete,
  onClose,
}: WordSearchModalProps) {
  const { number, color, wordSearch } = region;
  const { grid, wordList } = wordSearch;
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  /** Cells that are part of a found word — stay highlighted like circling on paper. */
  const [foundWordCells, setFoundWordCells] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<{ row: number; col: number }[]>(
    []
  );
  const startRef = useRef<{ row: number; col: number } | null>(null);

  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number): { row: number; col: number } | null => {
      const el = document.elementFromPoint(clientX, clientY);
      if (!el) return null;
      const cell = el.closest("[data-row][data-col]");
      if (!cell) return null;
      const row = parseInt(cell.getAttribute("data-row") ?? "-1", 10);
      const col = parseInt(cell.getAttribute("data-col") ?? "-1", 10);
      if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length)
        return null;
      return { row, col };
    },
    [grid]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (cell) {
        startRef.current = cell;
        setSelection([cell]);
      }
    },
    [getCellFromPoint]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (cell) {
        const path = getPathFromSelection(
          startRef.current.row,
          startRef.current.col,
          cell.row,
          cell.col
        );
        setSelection(path);
      }
    },
    [getCellFromPoint]
  );

  const handlePointerUp = useCallback(() => {
    if (!startRef.current || selection.length < 2) {
      startRef.current = null;
      setSelection([]);
      return;
    }
    const matched = getWordFromList(grid, selection, wordList);
    if (matched && !foundWords.has(matched)) {
      const nextWords = new Set(foundWords).add(matched);
      setFoundWords(nextWords);
      const nextCells = new Set(foundWordCells);
      selection.forEach((p) => nextCells.add(`${p.row},${p.col}`));
      setFoundWordCells(nextCells);
      if (nextWords.size === wordList.length) {
        onComplete();
      }
    }
    startRef.current = null;
    setSelection([]);
  }, [grid, selection, wordList, foundWords, foundWordCells, onComplete]);

  const selectionSet = new Set(selection.map((p) => `${p.row},${p.col}`));
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  const gridSize = Math.max(rows, cols);
  const defaultZoom = gridSize >= 12 ? 0.45 : gridSize >= 9 ? 0.6 : 1;
  const [gridZoom, setGridZoom] = useState(defaultZoom);

  const gridWrapRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  useEffect(() => {
    const el = gridWrapRef.current;
    if (!el) return;

    const getCenter = (touches: TouchList) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    });

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        panStartRef.current = {
          ...getCenter(e.touches),
          scrollLeft: el.scrollLeft,
          scrollTop: el.scrollTop,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && panStartRef.current) {
        e.preventDefault();
        const center = getCenter(e.touches);
        el.scrollLeft = panStartRef.current.scrollLeft + (panStartRef.current.x - center.x);
        el.scrollTop = panStartRef.current.scrollTop + (panStartRef.current.y - center.y);
      }
    };

    const onTouchEndInner = (e: TouchEvent) => {
      if (e.touches.length < 2) panStartRef.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEndInner);
    el.addEventListener("touchcancel", onTouchEndInner);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEndInner);
      el.removeEventListener("touchcancel", onTouchEndInner);
    };
  }, []);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            Region {number} — find {wordList.length} word{wordList.length !== 1 ? "s" : ""} to unlock paint
          </h2>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={styles.modalZoomRow}>
          <span className={styles.modalZoomLabel}>Zoom grid</span>
          <button
            type="button"
            className={styles.modalZoomBtn}
            onClick={() => setGridZoom((z) => Math.max(0.35, z - 0.1))}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className={styles.modalZoomPct}>{Math.round(gridZoom * 100)}%</span>
          <button
            type="button"
            className={styles.modalZoomBtn}
            onClick={() => setGridZoom((z) => Math.min(1.2, z + 0.1))}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        <div className={styles.modalWordList}>
          {wordList.map((w) => {
            const upper = w.toUpperCase().replace(/\s/g, "");
            const found = foundWords.has(upper);
            return (
              <span
                key={w}
                className={`${styles.modalWord} ${found ? styles.modalWordFound : ""}`}
              >
                {w}
              </span>
            );
          })}
        </div>

        <div ref={gridWrapRef} className={styles.modalGridWrap}>
          <div
            className={styles.modalGrid}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              transform: `scale(${gridZoom})`,
              transformOrigin: "top center",
            }}
          >
            {grid.map((row, r) =>
            row.map((letter, c) => {
              const key = `${r},${c}`;
              const isSelected = selectionSet.has(key);
              const isFound = foundWordCells.has(key);
              return (
                <div
                  key={key}
                  data-row={r}
                  data-col={c}
                  className={`${styles.modalCell} ${isSelected ? styles.modalCellSelected : ""} ${isFound ? styles.modalCellFound : ""}`}
                >
                  {letter}
                </div>
              );
            })
          )}
          </div>
        </div>

        <p className={styles.modalHint}>
          Tap and drag to select a word (horizontal, vertical, or diagonal). On large grids: zoom out to see all, then two-finger drag to pan. Find all words to paint this region.
        </p>
      </div>
    </div>
  );
}
