/**
 * GameScene — top-down gameplay scene.
 *
 * Controls:
 *   Arrow keys / WASD → move in 8 directions
 *   E                 → interact with nearby objects
 *
 * Two-way EventBus integration:
 *   Phaser → React: "score-changed", "player-health-changed", "scene-changed"
 *   React  → Phaser: "ui:toggle-pause", "ui:restart-scene"
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";

// ---- tuning ----------------------------------------------------------------
const PLAYER_SPEED = 180;
// const PLAYER_SIZE = 16; // half-extents for physics body
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

interface NpcObject {
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  name: string;
  onInteract: () => void;
}

export class GameScene extends Phaser.Scene {
  // --- state -----------------------------------------------------------------
  private score = 0;
  private health = { current: 100, max: 100 };
  private isPaused = false;

  // --- scene objects ---------------------------------------------------------
  private player!: Phaser.Physics.Arcade.Sprite;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private interactables: InteractableObject[] = [];
  private npcs: NpcObject[] = [];
  private hint!: Phaser.GameObjects.Text;
  private dialogOpen = false;

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
    const map = this.make.tilemap({ key: '16-json' });
    const tileset = map.addTilesetImage('grass', 'grass-img');
    // const tileset2 = map.addTilesetImage('tree', 'tree-img');
    // const tileset3 = map.addTilesetImage('cloud', 'cloud-img');
    // const tileset4 = map.addTilesetImage('house', 'house-img');
    const tileset5 = map.addTilesetImage('barracks', 'barracks-img');
    let layer: Phaser.Tilemaps.TilemapLayer | null = null;
    let layer2: Phaser.Tilemaps.TilemapLayer | null = null;
    let layer3: Phaser.Tilemaps.TilemapLayer | null = null;
    const obstaclesTilesetList = [tileset5] as Phaser.Tilemaps.Tileset[];
    const overheadTilesList = [tileset5] as Phaser.Tilemaps.Tileset[];
    if (tileset && tileset5) {
      layer = map.createLayer('Ground', tileset, 0, 0);
      layer2 = map.createLayer('Obstacles', obstaclesTilesetList, 0, 0);
      layer3 = map.createLayer('Overhead', overheadTilesList, 0, 0);

      layer?.setDepth(0);
      layer2?.setDepth(10);
      layer3?.setDepth(30);
      console.log('layers:', layer, layer2);
      console.log('tilesets:', map.tilesets);
    } else {
      console.error("Tileset not found in JSON or images not loaded.");
    }

    // ---- walls ---------------------------------------------------------------
    this.walls = this.physics.add.staticGroup();
    this.buildWalls(width, height);

    // ---- player --------------------------------------------------------------
    const directions = ['up', 'ne', 'right', 'se', 'down', 'sw', 'left', 'nw'];
    directions.forEach((dir, index) => {
        this.anims.create({
            key: `walk-${dir}`,
            frames: [
                { key: 'player', frame: 72 + index },
                { key: 'player', frame: 80 + index },
                { key: 'player', frame: 88 + index }
            ],
            frameRate: 10,
            repeat: -1
        });
    });

    this.player = this.physics.add.sprite(width / 2, height / 2, 'player', 76);
    this.player.setScale(3); 
    this.player.setDepth(20);
    if(this.player.body) {
      this.player.body.setSize(10, 6);
      this.player.body.setOffset(3, 18);
    }
    this.player.setCollideWorldBounds(true);

    if (layer && layer2) {
      layer.setCollisionByProperty({ collides: '1' });
      layer2.setCollisionByProperty({ collides: '1' });

      this.physics.add.collider(this.player, layer);
      this.physics.add.collider(this.player, layer2);
    }

    // ---- interactable objects -----------------------------------------------
    this.buildInteractables(width, height);

    // ---- NPC: Purple Warrior on tile row 10 (map line 16) -------------------
    // Tile row 10, column 10  → world x = 10*32 + 16 = 336, y = 10*32 + 16 = 336
    this.addPurpleWarrior(336, 336);

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
    const speed = PLAYER_SPEED;

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    let vx = 0;
    let vy = 0;

    if (left) vx = -1;
    else if (right) vx = 1;

    if (up) vy = -1;
    else if (down) vy = 1;

    if (vx !== 0 || vy !== 0) {
      const vector = new Phaser.Math.Vector2(vx, vy).normalize().scale(speed);
      body.setVelocity(vector.x, vector.y);

      let animKey = 'walk-down';

      if (vy < 0) {
        if (vx > 0) animKey = 'walk-ne';
        else if (vx < 0) animKey = 'walk-nw';
        else animKey = 'walk-up';
      } else if (vy > 0) {
        if (vx > 0) animKey = 'walk-se';
        else if (vx < 0) animKey = 'walk-sw';
        else animKey = 'walk-down';
      } else {
        if (vx > 0) animKey = 'walk-right';
        else if (vx < 0) animKey = 'walk-left';
      }

      this.player.anims.play(animKey, true);
    } else {
      body.setVelocity(0, 0);
      this.player.anims.stop();
    }
}

  private updateInteractHint() {
    const nearest = this.nearestInteractable();
    const nearestNpc = this.nearestNpc();
    if (nearest || nearestNpc) {
      if (this.dialogOpen) {
        this.hint?.setText('');
        this.hint.setVisible(false);
      } else {
        this.hint?.setText(`Press [E] to ${nearestNpc ? 'talk' : 'interact'}`);
      }
      this.hint.setVisible(true);
    } else {
      if (this.dialogOpen) {
        // still show close hint even when walking away
        this.hint?.setText("Press [E] to close dialog");
        this.hint.setVisible(true);
      } else {
        this.hint?.setText('');
        this.hint.setVisible(false);
      }
    }
  }

  private handleInteract() {
    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      // If dialog is open, close it first
      if (this.dialogOpen) {
        this.dialogOpen = false;
        EventBus.emit('npc-dialog', null);
        return;
      }
      const target = this.nearestInteractable();
      if (target) {
        target.onInteract();
        return;
      }
      const npc = this.nearestNpc();
      if (npc) npc.onInteract();
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

  private nearestNpc(): NpcObject | null {
    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist <= INTERACT_RADIUS) return npc;
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
    // const pillars = [
    //   // horizontal wall with gap
    //   { x: 280, y: 300, w: 160, h: 16 },
    // ];
    // for (const { x, y, w, h } of pillars) {
    //   this.addWall(x, y, w, h);
    // }
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

  // ---- Purple Warrior NPC ---------------------------------------------------
  private addPurpleWarrior(x: number, y: number) {
    // Static sprite: frame 0 only, no animation
    const sprite = this.physics.add.sprite(x, y, 'purple-warrior-idle', 0);
    const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
    sprite.setScale(0.75); 
    body.setSize(35, 35);
    body.setOffset(80, 85);
    sprite.setDepth(18);    // above land/obstacles, below HUD
    sprite.setFlipX(false);
    sprite.setImmovable(true);
    
    this.physics.add.collider(this.player, sprite);

    const npc: NpcObject = {
      sprite,
      x,
      y,
      name: 'Purple Warrior',
      onInteract: () => {
        this.dialogOpen = true;
        EventBus.emit('npc-dialog', { npc: 'Purple Warrior', text: 'hey' });
      },
    };

    this.npcs.push(npc);
  }
}
