/**
 * GameHUD — the React overlay UI.
 *
 * Subscribes to EventBus events to display live game state (score, HP)
 * and provides buttons that emit events back into Phaser.
 */

import { EventBus } from "@/game/EventBus";
import { useGameEvent } from "@/hooks/useGameEvent";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./GameHUD.module.css";

export function GameHUD() {
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState({ current: 100, max: 100 });
  const [scene, setScene] = useState("—");
  const [dialog, setDialog] = useState<{
    npc: string;
    text: string;
    portrait: string;
    theme?: string;
  } | null>(null);
  const [questNotification, setQuestNotification] = useState<{
    message: string;
    status: string;
  } | null>(null);
  const [quests, setQuests] = useState<
    Array<{ questId: string; title: string; status: string; progress?: string }>
  >([]);
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to Phaser events
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
  useGameEvent(
    "quest-updated",
    useCallback(
      (payload) => {
        // Show notification toast
        setQuestNotification({
          message: payload.message,
          status: payload.status,
        });

        // Update quest tracker
        setQuests((prev) => {
          const existing = prev.find((q) => q.questId === payload.questId);
          if (existing) {
            return prev.map((q) =>
              q.questId === payload.questId
                ? { ...q, status: payload.status, progress: payload.progress }
                : q,
            );
          }
          return [
            ...prev,
            {
              questId: payload.questId,
              title: payload.title,
              status: payload.status,
              progress: payload.progress,
            },
          ];
        });

        // Clear previous timer
        if (notifTimer.current) clearTimeout(notifTimer.current);
        notifTimer.current = setTimeout(() => {
          setQuestNotification(null);
        }, 3000);
      },
      [],
    ),
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (notifTimer.current) clearTimeout(notifTimer.current);
    };
  }, []);


  const visibleQuests = quests.filter((q) => q.status !== 'complete');

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
      </div>

      {/* NPC dialog bubble */}
      {dialog && (
        <div
          className={`${styles.dialogOverlay} ${styles[`theme-${dialog.theme ?? 'purple'}`]}`}
          onClick={() => {
            if ('ontouchstart' in window) {
              EventBus.emit('npc-dialog', null);
            }
          }}
        >
          <div className={styles.dialogBox}>
            <div className={styles.dialogPortrait}>
              <img src={dialog.portrait} alt={dialog.npc} className={styles.portraitImg} />
            </div>
            <div className={styles.dialogContent}>
              <span className={styles.dialogNpcName}>{dialog.npc}</span>
              <p className={styles.dialogText} dangerouslySetInnerHTML={{ __html: dialog.text }} />
            </div>
          </div>
          <span className={styles.dialogHint}>
            {'ontouchstart' in window ? 'Tap to close' : 'Press [E] to close'}
          </span>
        </div>
      )}

      {/* Quest notification toast */}
      {questNotification && (
        <div
          className={`${styles.questNotification} ${
            questNotification.status === 'complete'
              ? styles.questNotifComplete
              : questNotification.status === 'done'
                ? styles.questNotifDone
                : styles.questNotifNew
          }`}
        >
          <span className={styles.questNotifIcon}>
            {questNotification.status === 'complete'
              ? '✦'
              : questNotification.status === 'done'
                ? '◆'
                : '!'}
          </span>
          <span className={styles.questNotifText}>
            {questNotification.message}
          </span>
        </div>
      )}

      {/* Quest tracker (bottom-left) */}
      {visibleQuests.length > 0 && (
        <div className={styles.questTracker}>
          <div className={styles.questTrackerHeader}>Quests</div>
          {visibleQuests.map((q) => (
            <div key={q.questId} className={styles.questEntry}>
              <span
                className={`${styles.questStatus} ${
                  q.status === 'done' ? styles.questStatusDone : ''
                }`}
              >
                {q.status === 'done' ? '◆' : '○'}
              </span>
              <span className={styles.questTitle}>{q.title}</span>
              {q.progress && (
                <span className={styles.questProgress}>{q.progress}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

