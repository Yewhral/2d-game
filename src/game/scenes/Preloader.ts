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
    this.load.image('grass2-img', 'grass2.png');
    this.load.image('shadow-img', 'shadow.png');
    this.load.image('water-img', 'water.png');
    this.load.image('house-img', 'house.png');
    this.load.image('cloud-img', 'cloud.png');
    this.load.image('waterRocks2-img', 'waterRocks2.png');
    this.load.image('waterRocks4-img', 'waterRocks4.png');
    this.load.image('bushes-img', 'bushes.png');
    this.load.image('woodLog-img', 'woodLog.png');
    this.load.image('money-img', 'money.png');
    this.load.image('barracks-img', 'barracks.png');
    this.load.spritesheet('house2', 'house2.png', {
      frameWidth: 128,
      frameHeight: 192,
    });
    this.load.spritesheet('barracks', 'barracks.png', {
      frameWidth: 192,
      frameHeight: 256,
    });
    this.load.spritesheet('purple-warrior-idle', 'purpleWarriorIdle.png', {
      frameWidth: 192,
      frameHeight: 192,
    });
    this.load.spritesheet('purple-monk-idle', 'purpleMonkIdle.png', {
      frameWidth: 192,
      frameHeight: 192,
    });
    this.load.spritesheet('purple-pawn-idle', 'purplePawnIdle.png', {
      frameWidth: 192,
      frameHeight: 192,
    });
    this.load.spritesheet('purple-pawn-idle-wood', 'purplePawnIdleWood.png', {
      frameWidth: 192,
      frameHeight: 192,
    });
    this.load.spritesheet('black-warrior-idle', 'blackWarriorIdle.png', {
      frameWidth: 192,
      frameHeight: 192,
    });
    this.load.spritesheet('black-lancer-idle', 'blackLancerIdle.png', {
      frameWidth: 320,
      frameHeight: 320,
    });
    this.load.spritesheet('bush', 'bushes.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.spritesheet('tree3', 'tree3.png', {
      frameWidth: 192,
      frameHeight: 192,
    });
    this.load.tilemapTiledJSON('16-json', '16.json');
    this.load.tilemapTiledJSON('26-json', '26.json');
    this.load.spritesheet('player', 'player.png', {
      frameWidth: 16,
      frameHeight: 24
    });
  }

  create() {
    this.scene.start("MainMenu");
  }
}
