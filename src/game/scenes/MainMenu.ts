/**
 * MainMenu — title screen (Phaser scene).
 *
 * Only renders the animated background. The actual UI buttons
 * live in the React <MainMenuOverlay>.
 *
 * Listens for "menu:start-game" from React to transition
 * to the GameScene with the appropriate state.
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { saveManager } from "../saveManager";

export class MainMenu extends Phaser.Scene {
  private particles: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super("MainMenu");
  }

  create() {
    const { width, height } = this.scale;

    // ---- Background gradient panel  -----------------------------------------
    const panel = this.add.graphics();
    panel.fillGradientStyle(0x0f0f13, 0x0f0f13, 0x1a1a24, 0x1a1a24, 1);
    panel.fillRect(0, 0, width, height);

    // ---- Floating particles -------------------------------------------------
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const radius = Phaser.Math.FloatBetween(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.4);

      const dot = this.add.circle(x, y, radius, 0x7c6af7, alpha);
      dot.setDepth(1);

      // Gentle drift animation
      this.tweens.add({
        targets: dot,
        y: y - Phaser.Math.Between(40, 120),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 8000),
        ease: "Sine.InOut",
        repeat: -1,
        yoyo: true,
        delay: Phaser.Math.Between(0, 3000),
      });

      this.particles.push(dot);
    }

    // ---- Listen for React menu buttons --------------------------------------
    const startHandler = ({ newGame }: { newGame: boolean }) => {
      EventBus.off("menu:start-game", startHandler);

      if (!newGame) {
        // Continue — load saved state
        const data = saveManager.load();
        if (data) {
          saveManager.apply(data);
          this.scene.start("GameScene", {
            loadSave: true,
            mapKey: data.mapKey,
            playerX: data.playerX,
            playerY: data.playerY,
          });
          return;
        }
      }

      // New game or no save found — start fresh
      saveManager.resetAll();
      this.scene.start("GameScene", { loadSave: false });
    };

    EventBus.on("menu:start-game", startHandler);

    // ---- Tell React we're on the main menu ----------------------------------
    EventBus.emit("scene-changed", { scene: "MainMenu" });
    EventBus.emit("loading-progress", { progress: 0 });
  }

  shutdown() {
    EventBus.off("menu:start-game");
    for (const p of this.particles) p.destroy();
    this.particles = [];
  }
}
