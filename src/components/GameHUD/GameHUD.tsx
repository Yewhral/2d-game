/**
 * GameHUD — the React overlay UI.
 *
 * Subscribes to EventBus events to display live game state (score, HP)
 * and provides buttons that emit events back into Phaser.
 */

import { EventBus } from "@/game/EventBus";
import { useGameEvent } from "@/hooks/useGameEvent";
import { useCallback, useState } from "react";
import styles from "./GameHUD.module.css";

export function GameHUD() {
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState({ current: 100, max: 100 });
  const [scene, setScene] = useState("—");
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [dialog, setDialog] = useState<{ npc: string; text: string; portrait: string } | null>(null);

  // Subscribe to Phaser events
  useGameEvent(
    "game-ready",
    useCallback(() => setReady(true), []),
  );
  useGameEvent(
    "scene-changed",
    useCallback(({ scene }) => setScene(scene), []),
  );
  useGameEvent(
    "score-changed",
    useCallback(({ score }) => setScore(score), []),
  );
  useGameEvent(
    "player-health-changed",
    useCallback(({ current, max }) => setHealth({ current, max }), []),
  );
  useGameEvent(
    "npc-dialog",
    useCallback((payload) => setDialog(payload ?? null), []),
  );

  const handleTogglePause = () => {
    EventBus.emit("ui:toggle-pause", undefined);
    setPaused((p) => !p);
  };

  const handleRestart = () => {
    EventBus.emit("ui:restart-scene", undefined);
    setPaused(false);
    setScore(0);
    setHealth({ current: 100, max: 100 });
    setDialog(null);
  };

  const hpPct = Math.max(0, (health.current / health.max) * 100);
  const hpColor =
    hpPct > 60 ? "var(--color-success)" : hpPct > 30 ? "#fbbf24" : "var(--color-danger)";

  return (
    <div className={styles.hud}>
      {/* Top-left: stats */}
      <div className={styles.panel}>
        <div className={styles.stat}>
          <span className={styles.label}>SCORE</span>
          <span className={styles.value}>{score}</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.label}>HP</span>
          <div className={styles.hpBar}>
            <div className={styles.hpFill} style={{ width: `${hpPct}%`, background: hpColor }} />
          </div>
          <span className={styles.value}>
            {health.current}/{health.max}
          </span>
        </div>

        <div className={styles.stat}>
          <span className={styles.label}>SCENE</span>
          <span className={styles.sceneName}>{scene}</span>
        </div>
      </div>

      {/* Top-right: controls */}
      <div className={styles.controls}>
        {ready && (
          <>
            <button id="btn-pause" type="button" className={styles.btn} onClick={handleTogglePause}>
              {paused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button
              id="btn-restart"
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={handleRestart}
            >
              ↺ Restart
            </button>
          </>
        )}
      </div>

      {/* Pause overlay */}
      {paused && (
        <div className={styles.pauseOverlay}>
          <span>PAUSED</span>
        </div>
      )}

      {/* NPC dialog bubble */}
      {dialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogBox}>
            <div className={styles.dialogPortrait}>
              <img src={dialog.portrait} alt={dialog.npc} className={styles.portraitImg} />
            </div>
            <div className={styles.dialogContent}>
              <span className={styles.dialogNpcName}>{dialog.npc}</span>
              <p className={styles.dialogText}>{dialog.text}</p>
            </div>
          </div>
          <span className={styles.dialogHint}>Press [E] to close</span>
        </div>
      )}
    </div>
  );
}

