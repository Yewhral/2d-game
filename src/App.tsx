/**
 * App — root component.
 *
 * Stacks the Phaser canvas and the React UI overlays as siblings inside a
 * full-screen container. Overlays use `position: fixed` so they overlay
 * the canvas without affecting layout.
 *
 * A dark cover hides the Phaser canvas during Boot/Preloader so loading
 * graphics never bleed through. MainMenuOverlay fades in once assets are
 * ready. GameHUD shows only during gameplay.
 */

import { useCallback, useState } from "react";
import styles from "./App.module.css";
import { GameHUD } from "./components/GameHUD/GameHUD";
import { MainMenuOverlay } from "./components/MainMenuOverlay/MainMenuOverlay";
import { PhaserCanvas } from "./components/PhaserCanvas/PhaserCanvas";
import { useGameEvent } from "./hooks/useGameEvent";

export default function App() {
  const [scene, setScene] = useState("Boot");
  const [loadingProgress, setLoadingProgress] = useState(0);

  useGameEvent(
    "scene-changed",
    useCallback(({ scene }) => setScene(scene), []),
  );

  useGameEvent(
    "loading-progress",
    useCallback(({ progress }) => setLoadingProgress(progress), []),
  );

  const isLoading = scene === "Boot" || scene === "Preloader";

  return (
    <div className={styles.app}>
      <PhaserCanvas />
      {/* Dark cover that hides Phaser canvas during loading */}
      {isLoading && (
        <div className={styles.loadingCover}>
          <div className={styles.loaderContainer}>
            <div className={styles.loaderTitle}>LOADING ASSETS</div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${loadingProgress * 100}%` }} 
              />
            </div>
            <div className={styles.loaderPercent}>
              {Math.round(loadingProgress * 100)}%
            </div>
          </div>
        </div>
      )}
      {scene === "MainMenu" && <MainMenuOverlay />}
      {scene === "GameScene" && <GameHUD />}
    </div>
  );
}
