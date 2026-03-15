"use client";

import Link from "next/link";
import { SCENES } from "@/lib/scenes";
import styles from "./page.module.css";

export default function Home() {
  const scene = SCENES[0];

  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Hidden Canvas</h1>
        <p className={styles.tagline}>
          A paint-by-numbers scene. Zoom in, tap a number, and solve a word
          search to unlock that region and paint it.
        </p>
        <Link
          href={scene ? `/scene/${scene.id}` : "/"}
          className={styles.cta}
        >
          Start Painting
        </Link>
      </div>
      <p className={styles.hint}>
        You’ll see a large image with numbered regions. Tap any number to open
        a small word search. Find all the words to unlock the paint for that
        region.
      </p>
    </main>
  );
}
