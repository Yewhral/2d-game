/**
 * GameScene — the main gameplay scene.
 *
 * Demonstrates two-way EventBus usage:
 *  • Phaser → React: emits "score-changed" and "player-health-changed"
 *  • React → Phaser: listens for "ui:toggle-pause" and "ui:restart-scene"
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";

const PLAYER_SPEED = 200;
const GRAVITY = 300;
const JUMP_VELOCITY = -380;

export class GameScene extends Phaser.Scene {
  // --- state -----------------------------------------------------------------
  private score = 0;
  private health = { current: 100, max: 100 };
  private isPaused = false;

  // --- phaser objects --------------------------------------------------------
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerGfx!: Phaser.GameObjects.Rectangle;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private coins!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super("GameScene");
  }

  create() {
    const { width, height } = this.scale;

    // --- platforms -----------------------------------------------------------
    this.platforms = this.physics.add.staticGroup();

    // Ground
    const ground = this.add.rectangle(width / 2, height - 16, width, 32, 0x2e2e42);
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);

    // Ledges
    const ledgeData = [
      { x: 150, y: height - 140 },
      { x: 450, y: height - 220 },
      { x: 650, y: height - 300 },
    ];
    for (const { x, y } of ledgeData) {
      const ledge = this.add.rectangle(x, y, 180, 20, 0x7c6af7);
      this.physics.add.existing(ledge, true);
      this.platforms.add(ledge);
    }

    // --- player --------------------------------------------------------------
    // We use a coloured rectangle for the player body since we have no art yet.
    // The physics sprite is invisible and used purely for physics; its position
    // is copied to playerGfx every frame.
    this.player = this.physics.add.sprite(100, height - 100, "__DEFAULT");
    this.player.setVisible(false);
    this.player.setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(GRAVITY);

    this.playerGfx = this.add.rectangle(100, height - 100, 28, 40, 0x4ade80).setDepth(1);

    // --- coins ---------------------------------------------------------------
    this.coins = this.physics.add.staticGroup();
    const coinPositions = [
      { x: 150, y: height - 185 },
      { x: 450, y: height - 265 },
      { x: 650, y: height - 345 },
      { x: 300, y: height - 100 },
      { x: 600, y: height - 100 },
    ];
    for (const { x, y } of coinPositions) {
      const coinGfx = this.add.circle(x, y, 10, 0xfbbf24);
      this.physics.add.existing(coinGfx, true);
      this.coins.add(coinGfx);
    }

    // --- colliders -----------------------------------------------------------
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.coins, (_player, coin) => {
      (coin as Phaser.GameObjects.GameObject).destroy();
      this.score += 10;
      EventBus.emit("score-changed", { score: this.score });
    });

    // --- input ---------------------------------------------------------------
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    // --- EventBus listeners --------------------------------------------------
    EventBus.on("ui:toggle-pause", () => {
      this.isPaused = !this.isPaused;
      this.isPaused ? this.physics.pause() : this.physics.resume();
    });

    EventBus.on("ui:restart-scene", () => {
      this.score = 0;
      this.health = { current: 100, max: 100 };
      this.scene.restart();
    });

    // --- initial UI sync -----------------------------------------------------
    EventBus.emit("scene-changed", { scene: "GameScene" });
    EventBus.emit("score-changed", { score: this.score });
    EventBus.emit("player-health-changed", { ...this.health });
  }

  update() {
    if (this.isPaused || !this.cursors) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    // Horizontal movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-PLAYER_SPEED);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(PLAYER_SPEED);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    if (this.cursors.up.isDown && onGround) {
      this.player.setVelocityY(JUMP_VELOCITY);
    }

    // Sync the visible rectangle to the physics body position
    this.playerGfx.setPosition(this.player.x, this.player.y);
  }

  shutdown() {
    EventBus.off("ui:toggle-pause");
    EventBus.off("ui:restart-scene");
  }
}
