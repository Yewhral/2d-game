/**
 * GameScene — top-down gameplay scene.
 *
 * Controls:
 *   Arrow keys / WASD → move in 4 directions
 *   E                 → interact with nearby objects
 *
 * Two-way EventBus integration:
 *   Phaser → React: "score-changed", "player-health-changed", "scene-changed"
 *   React  → Phaser: "ui:toggle-pause", "ui:restart-scene"
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";

// ---- tuning ----------------------------------------------------------------
const PLAYER_SPEED = 160;
const PLAYER_SIZE = 24; // half-extents for physics body
const INTERACT_RADIUS = 50;
// const TILE = 32; // grid cell size

// ---- types -----------------------------------------------------------------
interface InteractableObject {
  gfx: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle;
  body: Phaser.Physics.Arcade.StaticBody;
  label: Phaser.GameObjects.Text;
  onInteract: () => void;
  collected: boolean;
}

export class GameScene extends Phaser.Scene {
  // --- state -----------------------------------------------------------------
  private score = 0;
  private health = { current: 100, max: 100 };
  private isPaused = false;

  // --- scene objects ---------------------------------------------------------
  private player!: Phaser.Physics.Arcade.Image;
  private playerGfx!: Phaser.GameObjects.Container;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private interactables: InteractableObject[] = [];
  private hint!: Phaser.GameObjects.Text;

  // --- input -----------------------------------------------------------------
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private keyE!: Phaser.Input.Keyboard.Key;

  constructor() {
    super("GameScene");
  }

  // ---------------------------------------------------------------------------
  create() {
    const { width, height } = this.scale;

    // ---- floor ---------------------------------------------------------------
    const map = this.make.tilemap({ key: 'grass-json' });
    const tileset = map.addTilesetImage('grass', 'grass-img');
    if (tileset) {
      const layer = map.createLayer('Tile Layer 1', tileset, 0, 0);
      console.log('layers:', layer);
      console.log('tilesets:', map.tilesets);
    } else {
      console.error("Tileset 'Grass' not found in JSON or image 'grass-tiles-img' not loaded.");
    }

    // ---- walls ---------------------------------------------------------------
    this.walls = this.physics.add.staticGroup();
    this.buildWalls(width, height);

    // ---- player --------------------------------------------------------------
    // The physics object is invisible; we sync a visible Container to it.
    this.player = this.physics.add.image(width / 2, height / 2, "__DEFAULT");
    this.player.setVisible(false);
    this.player.setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setSize(PLAYER_SIZE, PLAYER_SIZE);

    // Visual: filled circle + direction indicator
    this.playerGfx = this.add.container(width / 2, height / 2).setDepth(10);
    const body = this.add.circle(0, 0, PLAYER_SIZE / 2, 0x4ade80);
    const eye = this.add.circle(0, -PLAYER_SIZE / 4, 4, 0x0f0f13);
    this.playerGfx.add([body, eye]);

    // ---- interactable objects -----------------------------------------------
    this.buildInteractables(width, height);

    // ---- hint text -----------------------------------------------------------
    this.hint = this.add
      .text(width / 2, height - 24, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#888899",
        backgroundColor: "#0f0f1388",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(20);

    // ---- physics colliders ---------------------------------------------------
    this.physics.add.collider(this.player, this.walls);

    // ---- input ---------------------------------------------------------------
    const kb = this.input.keyboard;
    if (kb) {
      this.cursors = kb.createCursorKeys();
      this.wasd = {
        up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.keyE = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    // ---- EventBus (React → Phaser) ------------------------------------------
    EventBus.on("ui:toggle-pause", () => {
      this.isPaused = !this.isPaused;
      this.isPaused ? this.physics.pause() : this.physics.resume();
    });

    EventBus.on("ui:restart-scene", () => {
      this.score = 0;
      this.health = { current: 100, max: 100 };
      this.scene.restart();
    });

    // ---- initial React sync -------------------------------------------------
    EventBus.emit("scene-changed", { scene: "GameScene" });
    EventBus.emit("score-changed", { score: this.score });
    EventBus.emit("player-health-changed", { ...this.health });
  }

  // ---------------------------------------------------------------------------
  update() {
    if (this.isPaused || !this.cursors) return;

    this.handleMovement();
    this.syncPlayerVisual();
    this.updateInteractHint();
    this.handleInteract();
  }

  // ---------------------------------------------------------------------------
  shutdown() {
    EventBus.off("ui:toggle-pause");
    EventBus.off("ui:restart-scene");
  }

  // ---- private helpers ------------------------------------------------------

  private handleMovement() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    let vx = 0;
    let vy = 0;

    if (left) vx = -PLAYER_SPEED;
    else if (right) vx = PLAYER_SPEED;
    if (up) vy = -PLAYER_SPEED;
    else if (down) vy = PLAYER_SPEED;

    // Normalise diagonal speed
    if (vx !== 0 && vy !== 0) {
      const factor = 1 / Math.SQRT2;
      vx *= factor;
      vy *= factor;
    }

    body.setVelocity(vx, vy);

    // Rotate the eye dot toward movement direction
    if (vx !== 0 || vy !== 0) {
      const angle = Math.atan2(vy, vx) + Math.PI / 2; // offset so "up" = 0°
      this.playerGfx.setRotation(angle);
    }
  }

  private syncPlayerVisual() {
    this.playerGfx.setPosition(this.player.x, this.player.y);
  }

  private updateInteractHint() {
    const nearest = this.nearestInteractable();
    if (nearest) {
      this.hint.setText("Press [E] to interact");
    } else {
      this.hint.setText("");
    }
  }

  private handleInteract() {
    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      const target = this.nearestInteractable();
      if (target) target.onInteract();
    }
  }

  private nearestInteractable(): InteractableObject | null {
    for (const obj of this.interactables) {
      if (obj.collected) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.gfx.x, obj.gfx.y);
      if (dist <= INTERACT_RADIUS) return obj;
    }
    return null;
  }

  // ---- map builders ---------------------------------------------------------

  private buildWalls(width: number, height: number) {
    const W = 16; // wall thickness

    // Outer border
    const borders = [
      { x: width / 2, y: W / 2, w: width, h: W }, // top
      { x: width / 2, y: height - W / 2, w: width, h: W }, // bottom
      { x: W / 2, y: height / 2, w: W, h: height }, // left
      { x: width - W / 2, y: height / 2, w: W, h: height }, // right
    ];
    for (const { x, y, w, h } of borders) {
      this.addWall(x, y, w, h);
    }

    // Inner obstacles — a few rooms / pillars
    const pillars = [
      { x: 150, y: 150, w: 40, h: 40 },
      { x: 650, y: 150, w: 40, h: 40 },
      { x: 150, y: 450, w: 40, h: 40 },
      { x: 650, y: 450, w: 40, h: 40 },
      // horizontal wall with gap
      { x: 280, y: 300, w: 160, h: 16 },
      { x: 520, y: 300, w: 160, h: 16 },
    ];
    for (const { x, y, w, h } of pillars) {
      this.addWall(x, y, w, h);
    }
  }

  private addWall(x: number, y: number, w: number, h: number) {
    const rect = this.add.rectangle(x, y, w, h, 0x2e2e42);
    rect.setStrokeStyle(1, 0x3e3e56);
    this.physics.add.existing(rect, true);
    this.walls.add(rect);
  }

  private buildInteractables(width: number, height: number) {
    // Coins to collect
    const coinSpots = [
      { x: 100, y: 100 },
      { x: width - 100, y: 100 },
      { x: 100, y: height - 100 },
      { x: width - 100, y: height - 100 },
      { x: width / 2, y: 140 },
      { x: width / 2, y: height - 140 },
    ];

    for (const { x, y } of coinSpots) {
      this.addCoin(x, y);
    }

    // A chest that heals the player
    this.addChest(width / 2 - 60, height / 2);
    this.addChest(width / 2 + 60, height / 2);
  }

  private addCoin(x: number, y: number) {
    const gfx = this.add.circle(x, y, 10, 0xfbbf24).setDepth(5);
    gfx.setStrokeStyle(2, 0xf59e0b);
    this.physics.add.existing(gfx, true);

    // Idle bob tween
    this.tweens.add({
      targets: gfx,
      y: y - 5,
      duration: 700,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });

    const label = this.add
      .text(x, y - 20, "+10", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#fbbf24",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(15);

    const item: InteractableObject = {
      gfx,
      body: gfx.body as Phaser.Physics.Arcade.StaticBody,
      label,
      collected: false,
      onInteract: () => {
        if (item.collected) return;
        item.collected = true;

        this.score += 10;
        EventBus.emit("score-changed", { score: this.score });

        // Float-up animation then destroy
        this.tweens.add({
          targets: label,
          y: label.y - 30,
          alpha: 1,
          duration: 600,
          ease: "Quadratic.Out",
          onComplete: () => {
            this.tweens.add({
              targets: label,
              alpha: 0,
              duration: 300,
              onComplete: () => label.destroy(),
            });
          },
        });

        this.tweens.add({
          targets: gfx,
          alpha: 0,
          scaleX: 2,
          scaleY: 2,
          duration: 300,
          onComplete: () => gfx.destroy(),
        });
      },
    };

    this.interactables.push(item);
  }

  private addChest(x: number, y: number) {
    const gfx = this.add.rectangle(x, y, 28, 22, 0xb45309).setDepth(5);
    gfx.setStrokeStyle(2, 0x7c6af7);
    this.physics.add.existing(gfx, true);

    const label = this.add
      .text(x, y - 24, "❤ +20 HP", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#4ade80",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(15);

    const item: InteractableObject = {
      gfx,
      body: gfx.body as Phaser.Physics.Arcade.StaticBody,
      label,
      collected: false,
      onInteract: () => {
        if (item.collected) return;
        item.collected = true;

        this.health.current = Math.min(this.health.current + 20, this.health.max);
        EventBus.emit("player-health-changed", { ...this.health });

        this.tweens.add({
          targets: label,
          y: label.y - 30,
          alpha: 1,
          duration: 600,
          ease: "Quadratic.Out",
          onComplete: () => {
            this.tweens.add({
              targets: label,
              alpha: 0,
              duration: 300,
              onComplete: () => label.destroy(),
            });
          },
        });

        // Lid-open visual
        this.tweens.add({
          targets: gfx,
          fillColor: 0x78350f,
          scaleY: 0.4,
          duration: 200,
          yoyo: false,
        });
      },
    };

    this.interactables.push(item);
  }
}
