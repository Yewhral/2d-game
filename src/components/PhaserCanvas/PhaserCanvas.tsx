/**
 * PhaserCanvas — mounts and tears down the Phaser.Game instance.
 *
 * This is the bridge between React and Phaser:
 *  - A div ref is passed as the `parent` to `createGame()`
 *  - On unmount, `game.destroy(true)` cleans up all Phaser resources
 *  - The component itself renders NO React children; the Phaser canvas
 *    lives entirely within the div managed by this component.
 */

import { createGame } from "@/game/PhaserGame";
import type Phaser from "phaser";
import { useEffect, useRef } from "react";
import styles from "./PhaserCanvas.module.css";

export function PhaserCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    gameRef.current = createGame(containerRef.current);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className={styles.canvas} />;
}
