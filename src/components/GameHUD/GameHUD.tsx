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
import { QuestLogModal, type Quest } from "./QuestLogModal";

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
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isQuestLogOpen, setIsQuestLogOpen] = useState(false);
  const [hasUnseenQuests, setHasUnseenQuests] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
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

        // Show red dot on Q button
        setHasUnseenQuests(true);

        // Update quest tracker
        setQuests((prev) => {
          const existing = prev.find((q) => q.questId === payload.questId);
          if (existing) {
            return prev.map((q) =>
              q.questId === payload.questId
                ? { ...q, status: payload.status, progress: payload.progress, description: payload.description }
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
              description: payload.description,
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

  // Keyboard shortcut: Q for Quest Log
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'q' && !dialog && scene === 'GameScene') {
        setIsQuestLogOpen((prev) => {
          if (!prev) setHasUnseenQuests(false);
          return !prev;
        });
      }
      if (e.key === 'Escape' && isQuestLogOpen) {
        setIsQuestLogOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog, isQuestLogOpen, scene]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (notifTimer.current) clearTimeout(notifTimer.current);
    };
  }, []);


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
      </div>

      {/* Top-right: controls */}
      <div className={styles.controls}>
        {scene === "GameScene" && (
          <button 
            className={`${styles.btn} ${styles.questLogBtn} ${hasUnseenQuests ? styles.hasNotification : ''}`}
            onClick={() => {
              setIsQuestLogOpen(true);
              setHasUnseenQuests(false);
              if (!selectedQuestId && quests.length > 0) {
                setSelectedQuestId(quests[0].questId);
              }
            }}
            title="Quest Log (Q)"
          >
            Q
          </button>
        )}
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

      {/* Quest Log Modal */}
      <QuestLogModal
        isOpen={isQuestLogOpen}
        onClose={() => setIsQuestLogOpen(false)}
        quests={quests}
        selectedQuestId={selectedQuestId}
        onSelectQuest={setSelectedQuestId}
      />
    </div>
  );
}

