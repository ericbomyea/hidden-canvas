"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSceneById, getRegionByNumber } from "@/lib/scenes";
import { getConnectedSameNumber } from "@/lib/fill-connected";
import type { Scene, SceneRegion } from "@/lib/types";
import { Canvas } from "./Canvas";
import { WordSearchModal } from "./WordSearchModal";
import styles from "./scene.module.css";

const FILL_CONNECTED_CAP = 15;

export default function ScenePage() {
  const params = useParams();
  const scene = useMemo(
    () => getSceneById(params.id as string),
    [params.id]
  );

  /** Numbers whose word search has been completed (user can now paint those cells). */
  const [unlockedNumbers, setUnlockedNumbers] = useState<Set<number>>(
    () => new Set()
  );
  /** Painted cells: "row,col" */
  const [paintedCells, setPaintedCells] = useState<Set<string>>(() => new Set());
  const [activeRegion, setActiveRegion] = useState<SceneRegion | null>(null);
  /** Streak toast: show "N filled!" when filling multiple cells at once */
  const [fillToast, setFillToast] = useState<number | null>(null);

  useEffect(() => {
    if (fillToast === null) return;
    const t = setTimeout(() => setFillToast(null), 1400);
    return () => clearTimeout(t);
  }, [fillToast]);

  const handleCellTap = useCallback(
    (row: number, col: number, number: number) => {
      if (!scene) return;
      const key = `${row},${col}`;
      if (paintedCells.has(key)) return;
      const region = getRegionByNumber(scene, number);
      if (!region) return;
      if (unlockedNumbers.has(number)) {
        const toFill = getConnectedSameNumber(
          scene.numberGrid,
          row,
          col,
          number,
          paintedCells,
          FILL_CONNECTED_CAP
        );
        if (toFill.length > 0) {
          setPaintedCells((prev) => new Set(Array.from(prev).concat(toFill)));
          if (toFill.length > 1) setFillToast(toFill.length);
        }
      } else {
        setActiveRegion(region);
      }
    },
    [scene, unlockedNumbers, paintedCells]
  );

  const handleWordSearchComplete = useCallback(() => {
    if (activeRegion) {
      setUnlockedNumbers((prev) => new Set(prev).add(activeRegion.number));
      setActiveRegion(null);
    }
  }, [activeRegion]);

  const handleCloseModal = useCallback(() => {
    setActiveRegion(null);
  }, []);

  if (!scene) {
    return (
      <main className={styles.container}>
        <p>Scene not found.</p>
        <Link href="/">Home</Link>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>
          ← Back
        </Link>
        <h1 className={styles.title}>{scene.title}</h1>
        <p className={styles.subtitle}>
          Tap a number to do a quick word search and unlock it. Then tap every cell with that number to paint—lots to tap.
        </p>
      </header>

      <section className={styles.palette} aria-label="Unlocked colors">
        <p className={styles.paletteLabel}>Palette — solved numbers</p>
        <div className={styles.paletteWells}>
          {scene.regions
            .slice()
            .sort((a, b) => a.number - b.number)
            .map((region) => {
              const unlocked = unlockedNumbers.has(region.number);
              return (
                <button
                  key={region.id}
                  type="button"
                  className={`${styles.paletteWell} ${unlocked ? styles.paletteWellUnlocked : ""}`}
                  style={
                    unlocked
                      ? { backgroundColor: region.color }
                      : undefined
                  }
                  onClick={() => {
                    if (unlocked) return;
                    setActiveRegion(region);
                  }}
                  title={unlocked ? `Number ${region.number} (unlocked)` : `Tap to solve word search for number ${region.number}`}
                >
                  <span className={styles.paletteWellNumber}>{region.number}</span>
                </button>
              );
            })}
        </div>
      </section>

      {fillToast !== null && (
        <div className={styles.fillToast} role="status">
          {fillToast} filled!
        </div>
      )}

      <Canvas
        scene={scene}
        unlockedNumbers={unlockedNumbers}
        paintedCells={paintedCells}
        onCellTap={handleCellTap}
      />

      {activeRegion && (
        <WordSearchModal
          region={activeRegion}
          onComplete={handleWordSearchComplete}
          onClose={handleCloseModal}
        />
      )}
    </main>
  );
}
