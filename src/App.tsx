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

import { useCallback, useEffect, useState } from "react";
import styles from "./App.module.css";
import { GameHUD } from "./components/GameHUD/GameHUD";
import { MainMenuOverlay } from "./components/MainMenuOverlay/MainMenuOverlay";
import { PhaserCanvas } from "./components/PhaserCanvas/PhaserCanvas";
import { useGameEvent } from "./hooks/useGameEvent";
import { Loader } from "./components/MainMenuOverlay/Loader";
import { NPC_REGISTRY } from "./game/scenes/npcs";

const getAssetPath = (path: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
};

const UI_ASSETS_TO_PRELOAD = [
  "/UI/ribbon_08_purple_rounded_left.png",
  "/UI/ribbon_08_purple_rounded_middle.png",
  "/UI/ribbon_08_purple_rounded_right.png",
  "/UI/ribbon_02_teal_rounded_left.png",
  "/UI/ribbon_02_teal_rounded_middle.png",
  "/UI/ribbon_02_teal_rounded_right.png",
  "/UI/ribbon_04_red_rounded_left.png",
  "/UI/ribbon_04_red_rounded_middle.png",
  "/UI/ribbon_04_red_rounded_right.png",
  "/UI/ribbon_06_yellow_rounded_left.png",
  "/UI/ribbon_06_yellow_rounded_middle.png",
  "/UI/ribbon_06_yellow_rounded_right.png",
  "/UI/ribbon_10_slate_rounded_left.png",
  "/UI/ribbon_10_slate_rounded_middle.png",
  "/UI/ribbon_10_slate_rounded_right.png",
];

function getNpcPortraitPaths(): string[] {
  const portraits = new Set<string>();

  for (const npcsById of Object.values(NPC_REGISTRY)) {
    for (const npc of Object.values(npcsById)) {
      if (npc.portrait) portraits.add(npc.portrait);
    }
  }

  return [...portraits];
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = getAssetPath(src);
    void img.decode?.().then(resolve, resolve);
  });
}

export default function App() {
  const [scene, setScene] = useState("Boot");
  const [ribbonAssetsReady, setRibbonAssetsReady] = useState(false);

  // Preload React-rendered assets in the browser cache.
  useEffect(() => {
    void Promise.all(UI_ASSETS_TO_PRELOAD.map(preloadImage)).then(() => {
      setRibbonAssetsReady(true);
    });

    for (const src of getNpcPortraitPaths()) {
      void preloadImage(src);
    }
  }, []);

  useGameEvent(
    "scene-changed",
    useCallback(({ scene }) => setScene(scene), []),
  );

  const isLoading = scene === "Boot" || scene === "Preloader" || (scene === "MainMenu" && !ribbonAssetsReady);

  return (
    <div className={styles.app}>
      <PhaserCanvas />
      {/* Dark cover that hides Phaser canvas during loading */}
      {isLoading && (
        <div className={styles.loadingCover}>
          <div className={styles.loaderContainer}>
            <div className={styles.loaderTitle}>LOADING ASSETS</div>
            <Loader />
          </div>
        </div>
      )}
      {scene === "MainMenu" && <MainMenuOverlay />}
      {scene === "GameScene" && <GameHUD />}
    </div>
  );
}
