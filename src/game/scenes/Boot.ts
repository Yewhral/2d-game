/**
 * Boot — the very first scene.
 * Sets global settings, then immediately moves to Preloader.
 */

import Phaser from "phaser";

export class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    // Load any assets needed by the loading screen itself here.
    // (e.g., a small loading bar sprite)
  }

  create() {
    this.scene.start("Preloader");
  }
}
