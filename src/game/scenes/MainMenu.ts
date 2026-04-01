/**
 * MainMenu — title screen.
 * Emits "scene-changed" so React can update the UI layer,
 * then waits for a click/tap to start the game.
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";

export class MainMenu extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Background gradient panel
    const panel = this.add.graphics();
    panel.fillGradientStyle(0x0f0f13, 0x0f0f13, 0x1a1a24, 0x1a1a24, 1);
    panel.fillRect(0, 0, width, height);

    // Title
    this.add
      .text(cx, cy - 80, "2D GAME", {
        fontFamily: "monospace",
        fontSize: "56px",
        color: "#7c6af7",
        stroke: "#2e2e42",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Subtitle
    const prompt = this.add
      .text(cx, cy + 20, "Click anywhere to play", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#888899",
      })
      .setOrigin(0.5);

    // Blink the prompt
    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 800,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });

    // Start game on pointer down
    this.input.once("pointerdown", () => {
      this.scene.start("GameScene");
    });


    EventBus.emit("scene-changed", { scene: "MainMenu" });
  }

  shutdown() {
  }
}
