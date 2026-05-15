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
import styles from "./MainMenuOverlay.module.css";
import { RibbonButton } from "./RibbonButton";
import { CreditsButton } from "./CreditsButton";

export function MainMenuOverlay() {
  const hasSave = saveManager.hasSave();
  const [confirming, setConfirming] = useState(false);
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
        <div className={styles.overlayContent}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>2D GAME</h1>
          <div className={styles.titleGlow} />
        </div>

        {/* Buttons */}
        <div className={styles.buttons}>
          {hasSave ? (
            <>
              {/* Continue — purple ribbon */}
              <RibbonButton color="purple" onClick={handleContinue}>
                ▶ Continue
              </RibbonButton>

              {/* New Game — teal ribbon; turns red when confirming */}
              <RibbonButton
                color={confirming ? "red" : "teal"}
                onClick={handleNewGame}
                onMouseLeave={() => setConfirming(false)}
              >
                {confirming ? "⚠ Are you sure?" : "✦ New Game"}
              </RibbonButton>
            </>
          ) : (
            /* Start Game — purple ribbon */
            <RibbonButton color="purple" onClick={handleStartGame}>
              ▶ Start Game
            </RibbonButton>
          )}

          {/* Credits — yellow ribbon (owns its modal) */}
          <div className={styles.creditsBtnWrapper}>
            <CreditsButton />
          </div>

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
      </div>
    </>
  );
}
