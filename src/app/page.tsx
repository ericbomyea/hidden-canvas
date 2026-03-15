"use client";

import Link from "next/link";
import { SCENES } from "@/lib/scenes";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Hidden Canvas</h1>
        <p className={styles.tagline}>
          A paint-by-numbers scene. Pick an image, tap numbers to solve word
          searches, then paint the canvas.
        </p>
      </div>

      <section className={styles.sceneGrid} aria-label="Choose a scene">
        {SCENES.map((scene) => (
          <Link
            key={scene.id}
            href={`/scene/${scene.id}`}
            className={styles.sceneCard}
          >
            <span className={styles.sceneThumb}>
              <img
                src={scene.imageUrl}
                alt=""
                className={styles.sceneThumbImg}
              />
            </span>
            <span className={styles.sceneTitle}>{scene.title}</span>
          </Link>
        ))}
      </section>

      <p className={styles.hint}>
        Tap a scene to start. You’ll see a large image with numbered regions.
        Tap any number to open a word search; find all the words to unlock that
        color, then tap cells to paint.
      </p>
    </main>
  );
}
