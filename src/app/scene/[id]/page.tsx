"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSceneById, getRegionByNumber } from "@/lib/scenes";
import type { Scene, SceneRegion } from "@/lib/types";
import { Canvas } from "./Canvas";
import { WordSearchModal } from "./WordSearchModal";
import styles from "./scene.module.css";

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
  /** Painted cells: "row,col" → color (or we could store just "row,col" and look up color by number). */
  const [paintedCells, setPaintedCells] = useState<Set<string>>(() => new Set());
  const [activeRegion, setActiveRegion] = useState<SceneRegion | null>(null);

  const handleCellTap = useCallback(
    (row: number, col: number, number: number) => {
      if (!scene) return;
      const key = `${row},${col}`;
      if (paintedCells.has(key)) return;
      const region = getRegionByNumber(scene, number);
      if (!region) return;
      if (unlockedNumbers.has(number)) {
        setPaintedCells((prev) => new Set(prev).add(key));
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
