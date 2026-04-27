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
import { inventory } from "@/game/inventory";
import { collectibleState } from "@/game/collectibles/CollectibleState";

const getAssetPath = (path: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, ""); // remove trailing slash
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
};

const QUEST_NOTIFICATION_DURATION = 3000;

export function GameHUD() {
  const [money, setMoney] = useState(collectibleState.getMoney());
  const [items, setItems] = useState(inventory.items);
  const [dialog, setDialog] = useState<{
    npc: string;
    text: string;
    portrait?: string;
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
    "money-changed",
    useCallback(({ money }) => setMoney(money), []),
  );
  useGameEvent(
    "inventory-changed",
    useCallback(({ items }) => setItems(items), []),
  );
  useGameEvent(
    "npc-dialog",
    useCallback((payload) => setDialog(payload ?? null), []),
  );
  useGameEvent(
    "quest-updated",
    useCallback(
      (payload) => {
        if (!payload.silent) {
          // Show notification toast
          setQuestNotification({
            message: payload.message,
            status: payload.status,
          });

          // Show red dot on Q button
          setHasUnseenQuests(true);

          // Clear previous timer
          if (notifTimer.current) clearTimeout(notifTimer.current);
          notifTimer.current = setTimeout(() => {
            setQuestNotification(null);
          }, QUEST_NOTIFICATION_DURATION);
        }

        // Update quest tracker (always, even if silent)
        setQuests((prev) => {
          const existing = prev.find((q) => q.questId === payload.questId);
          if (existing) {
            return prev.map((q) =>
              q.questId === payload.questId
                ? { ...q, status: payload.status, progress: payload.progress, description: payload.description }
                : q,
            );
          }
          if (payload.questId === 'batch-fail') return prev; // Don't add batch item to list
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
      if (e.key.toLowerCase() === 'q' && !dialog) {
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
  }, [dialog, isQuestLogOpen]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (notifTimer.current) clearTimeout(notifTimer.current);
    };
  }, []);





  return (
    <div className={`${styles.hud}${isTouch ? ` ${styles.hasMobileControls}` : ''}`}>
      {/* Top-left: inventory */}
      {(
        <div className={styles.panel}>
          <div className={styles.inventoryItem}>
            <img src={getAssetPath("gameAssets/woodLog.png")} className={styles.icon} alt="Logs" />
            <span className={styles.value}>x {items.log || 0}</span>
          </div>

          <div className={styles.inventoryItem}>
            <img src={getAssetPath("gameAssets/money.png")} className={styles.icon} alt="Money" />
            <span className={styles.value}>x {money}</span>
          </div>
        </div>
      )}

      {/* Top-right: controls */}
      <div className={styles.controls}>
        {(
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
                <img src={getAssetPath(dialog.portrait)} alt={dialog.npc} className={styles.portraitImg} />
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
                : questNotification.status === 'failed'
                  ? styles.questNotifFailed
                  : styles.questNotifNew
          }`}
        >
          <span className={styles.questNotifIcon}>
            {questNotification.status === 'complete'
              ? '✦'
              : questNotification.status === 'done'
                ? '◆'
                : questNotification.status === 'failed'
                  ? '✘'
                  : '!'}
          </span>
          <span className={styles.questNotifText}>
            {questNotification.message}
          </span>
        </div>
      )}

      {/* Mobile Controls */}
      {isTouch && (
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

