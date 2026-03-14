/**
 * App — root component.
 *
 * Stacks the Phaser canvas and the React HUD as siblings inside a
 * full-screen container. The HUD uses `position: fixed` so it overlays
 * the canvas without affecting layout.
 */

import styles from "./App.module.css";
import { GameHUD } from "./components/GameHUD/GameHUD";
import { PhaserCanvas } from "./components/PhaserCanvas/PhaserCanvas";

export default function App() {
  return (
    <div className={styles.app}>
      <PhaserCanvas />
      <GameHUD />
    </div>
  );
}
