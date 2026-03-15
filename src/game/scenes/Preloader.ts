/**
 * Preloader — loads all game assets, then moves to MainMenu.
 * Shows a simple progress bar while loading.
 */

import Phaser from "phaser";

export class Preloader extends Phaser.Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Background bar
    this.add.rectangle(cx, cy, 468, 32, 0x1a1a24).setStrokeStyle(1, 0x2e2e42);

    // Fill bar — updated by the 'progress' event
    const bar = this.add.rectangle(cx - 230, cy, 4, 28, 0x7c6af7);

    this.load.on("progress", (progress: number) => {
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    this.load.setPath("gameAssets");
    this.load.image('grass-img', 'grass.png');
    this.load.tilemapTiledJSON('grass-json', 'grass.json');

    // ----------------------------------------------------------------
    // Add your real asset loads here, e.g.:
    // this.load.image("sky", "sky.png");
    // this.load.tilemapTiledJSON("map", "level-01.json");
    // ----------------------------------------------------------------
  }

  create() {
    this.scene.start("MainMenu");
  }
}
