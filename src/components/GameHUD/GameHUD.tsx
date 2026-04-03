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
  const [isTouch, setIsTouch] = useState(false);
  const [mobileInteractPossible, setMobileInteractPossible] = useState(false);
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for touch device on mount
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

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

  useGameEvent(
    "mobile-interact-possible",
    useCallback((possible) => setMobileInteractPossible(possible), []),
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
            {dialog.portrait && (
              <div className={styles.dialogPortrait}>
                <img src={dialog.portrait} alt={dialog.npc} className={styles.portraitImg} />
              </div>
            )}
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

      {/* Mobile Controls */}
      {isTouch && scene === "GameScene" && (
        <div className={styles.mobileControls}>
          {/* Virtual Joystick */}
          <div className={styles.joystickContainer}>
            <Joystick 
              onMove={(e) => EventBus.emit("mobile-move", e)}
              onEnd={() => EventBus.emit("mobile-move", { x: 0, y: 0 })}
            />
          </div>

          {/* Action Button */}
          <div className={styles.mobileActions}>
            {mobileInteractPossible && (
              <button
                className={styles.mobileActionBtn}
                onTouchStart={(e) => {
                  e.preventDefault();
                  EventBus.emit("mobile-interact", true);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  EventBus.emit("mobile-interact", false);
                }}
              >
                E
              </button>
            )}
          </div>
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

/**
 * A simple React Virtual Joystick
 */
function Joystick({ onMove, onEnd }: { onMove: (pos: { x: number; y: number }) => void; onEnd: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleStart = () => {
    setIsDragging(true);
  };

  const handleMove = useCallback((e: TouchEvent | MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const radius = rect.width / 2;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > radius) {
      dx = (dx / distance) * radius;
      dy = (dy / distance) * radius;
    }

    setPos({ x: dx, y: dy });
    onMove({ x: dx / radius, y: dy / radius });
  }, [isDragging, onMove]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setPos({ x: 0, y: 0 });
    onEnd();
  }, [onEnd]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div 
      ref={containerRef} 
      className={styles.joystickBase}
      onTouchStart={handleStart}
      onMouseDown={handleStart}
    >
      <div 
        ref={thumbRef}
        className={styles.joystickThumb}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      />
    </div>
  );
}

