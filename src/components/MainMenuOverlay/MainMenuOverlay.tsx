/**
 * MainMenuOverlay — React overlay for the Phaser MainMenu scene.
 *
 * Renders the title and action buttons over the Phaser background.
 * Conditionally shows:
 *   - "Start Game" when no save exists
 *   - "Continue" + "New Game" when a save exists
 *
 * Buttons emit "menu:start-game" via EventBus, which the Phaser
 * MainMenu scene listens for.
 */

import { useState } from "react";
import { EventBus } from "@/game/EventBus";
import { saveManager } from "@/game/saveManager";
import { CreditsModal } from "./CreditsModal";
import styles from "./MainMenuOverlay.module.css";

export function MainMenuOverlay() {
  const hasSave = saveManager.hasSave();
  const [confirming, setConfirming] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleStartGame = () => {
    EventBus.emit("menu:start-game", { newGame: true });
  };

  const handleContinue = () => {
    EventBus.emit("menu:start-game", { newGame: false });
  };

  const handleNewGame = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    // Confirmed — start fresh
    saveManager.deleteSave();
    EventBus.emit("menu:start-game", { newGame: true });
    setConfirming(false);
  };

  const handleClearData = () => {
    if (!clearing) {
      setClearing(true);
      return;
    }
    saveManager.deleteSave();
    window.location.reload();
  };

  return (
    <>
      <div className={styles.overlay}>
        {/* Title */}
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>2D GAME</h1>
          <div className={styles.titleGlow} />
        </div>

        {/* Buttons */}
        <div className={styles.buttons}>
          {hasSave ? (
            <>
              <button
                className={`${styles.menuBtn} ${styles.primary}`}
                onClick={handleContinue}
              >
                <span className={styles.btnIcon}>▶</span>
                Continue
              </button>

              <button
                className={`${styles.menuBtn} ${styles.secondary} ${confirming ? styles.confirming : ""}`}
                onClick={handleNewGame}
                onMouseLeave={() => setConfirming(false)}
              >
                <span className={styles.btnIcon}>{confirming ? "⚠" : "✦"}</span>
                {confirming ? "Are you sure?" : "New Game"}
              </button>
            </>
          ) : (
            <button
              className={`${styles.menuBtn} ${styles.primary}`}
              onClick={handleStartGame}
            >
              <span className={styles.btnIcon}>▶</span>
              Start Game
            </button>
          )}

          <button 
            className={styles.creditsBtn}
            onClick={() => setIsCreditsOpen(true)}
          >
            Credits
          </button>

          {hasSave && (
            <button 
              className={styles.dangerBtn}
              onClick={handleClearData}
              onMouseLeave={() => setClearing(false)}
            >
              {clearing ? "⚠ Wipe all data?" : "Clear Save Data"}
            </button>
          )}
        </div>

        {/* Footer hint */}
        <span className={styles.footer}>
          {hasSave
            ? "Your progress has been saved"
            : "Begin your adventure"}
        </span>
      </div>

      <CreditsModal 
        isOpen={isCreditsOpen} 
        onClose={() => setIsCreditsOpen(false)} 
      />
    </>
  );
}
