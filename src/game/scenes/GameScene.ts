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
import { questManager } from "../quests/QuestManager";
import { 
  DEPTHS, 
  FADE_DURATION, 
  INTERACT_RADIUS, 
  LAYERS, 
  NPC_EXIT_RADIUS, 
  PLAYER_SPEED 
} from "../constants";

// ---- NPC registry ----------------------------------------------------------
// Maps npcId (set as a custom property on Tiled objects) → visual + default
// dialog data.  Quest-specific dialog is handled by the quest system —
// see src/game/quests/.
const NPC_REGISTRY: Record<
  string,
  {
    name: string;
    /** Default text when no quest overrides the dialog */
    text: string;
    spriteKey: string;
    frame: number;
    scale: number;
    bodySize: { width: number; height: number };
    bodyOffset: { x: number; y: number };
    portrait: string;
  }
> = {
  'purple-warrior': {
    name: 'Purple Warrior',
    text: 'Hey there, traveler.',
    spriteKey: 'purple-warrior-idle',
    frame: 0,
    scale: 0.75,
    bodySize: { width: 35, height: 35 },
    bodyOffset: { x: 80, y: 85 },
    portrait: 'gameAssets/purpleWarriorAvatar.png',
  },
  'purple-warrior2': {
    name: 'Mysterious Stranger',
    text: '...',
    spriteKey: 'purple-warrior-idle',
    frame: 0,
    scale: 0.75,
    bodySize: { width: 35, height: 35 },
    bodyOffset: { x: 80, y: 85 },
    portrait: 'gameAssets/purpleWarriorAvatar.png',
  },
};

// ---- tileset name → preloaded image key ------------------------------------
// Every tileset name used in Tiled maps must have a corresponding preloaded
// image key here.  The Preloader scene must load these images beforehand.
const TILESET_IMAGE_KEYS: Record<string, string> = {
  grass: 'grass-img',
  barracks: 'barracks-img',
};

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
  private isTransitioning = false;
  private currentMapKey = '';

  // --- map -------------------------------------------------------------------
  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private obstaclesLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private overheadLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private mapColliders: Phaser.Physics.Arcade.Collider[] = [];
  private exitZones!: Phaser.Physics.Arcade.StaticGroup;
  private activeExitZone: Phaser.GameObjects.Zone | null = null;

  // --- scene objects ---------------------------------------------------------
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private interactables: InteractableObject[] = [];
  private npcs: NpcObject[] = [];
  private hint!: Phaser.GameObjects.Text;
  private activeDialogNpc: NpcObject | null = null;

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

    // ---- player animations ---------------------------------------------------
    const directions = ['up', 'ne', 'right', 'se', 'down', 'sw', 'left', 'nw'];
    directions.forEach((dir, index) => {
      this.anims.create({
        key: `walk-${dir}`,
        frames: [
          { key: 'player', frame: 72 + index },
          { key: 'player', frame: 80 + index },
          { key: 'player', frame: 88 + index },
        ],
        frameRate: 10,
        repeat: -1,
      });
    });

    // ---- player --------------------------------------------------------------
    this.player = this.physics.add.sprite(width / 2, height / 2, 'player', 76);
    this.player.setScale(3);
    this.player.setDepth(this.player.y);
    this.player.setOrigin(0.5, 1);
    if (this.player.body) {
      this.player.body.setSize(9, 6);
      this.player.body.setOffset(3, 18);
    }
    this.player.setCollideWorldBounds(true);

    // ---- player shadow -------------------------------------------------------
    this.playerShadow = this.add.ellipse(0, 0, 28, 22, 0x000000, 0.25);
    this.playerShadow.setDepth(this.player.y - 1);

    // ---- walls ---------------------------------------------------------------
    this.walls = this.physics.add.staticGroup();
    this.buildWalls(width, height);
    this.physics.add.collider(this.player, this.walls);

    // ---- interactable objects -----------------------------------------------
    this.buildInteractables(width, height);

    // ---- load initial map ---------------------------------------------------
    this.changeMap('16-json', 'spawn');

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
      questManager.reset();
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

    if (this.player && this.playerShadow) {
      this.playerShadow.setPosition(this.player.x - 2, this.player.y - 10);
      const isMoving = (this.player.body as Phaser.Physics.Arcade.Body).velocity.length() > 0;
      this.playerShadow.setScale(isMoving ? 1.1 : 1.0);
      this.player.setDepth(this.player.y);
    }

    if (this.isTransitioning) return;

    this.handleMovement();
    this.checkDialogExitRadius();
    this.updateInteractHint();
    this.handleInteract();
  }

  // ---------------------------------------------------------------------------
  shutdown() {
    EventBus.off("ui:toggle-pause");
    EventBus.off("ui:restart-scene");
  }

  // ---- map management -------------------------------------------------------

  /**
   * Transition to a different tilemap.
   *
   * @param mapKey   - Cache key of the tilemap JSON (loaded in Preloader).
   * @param spawnName - Name of the spawn-point object on the map's
   *                    "Objects" layer.  Falls back to map center if not found.
   */
  changeMap(
    mapKey: string,
    spawnName: string,
    relativePos?: { axis: 'x' | 'y'; value: number },
  ) {
    // --- clean up previous map ------------------------------------------------
    this.cleanupMap();
    this.currentMapKey = mapKey;

    // --- create new tilemap ---------------------------------------------------
    this.map = this.make.tilemap({ key: mapKey });

    // Add every tileset referenced by this map
    const tilesets: Phaser.Tilemaps.Tileset[] = [];
    for (const tilesetData of this.map.tilesets) {
      const imageKey = TILESET_IMAGE_KEYS[tilesetData.name];
      if (imageKey) {
        const ts = this.map.addTilesetImage(tilesetData.name, imageKey);
        if (ts) tilesets.push(ts);
      } else {
        console.warn(
          `Tileset "${tilesetData.name}" has no image key in TILESET_IMAGE_KEYS — skipping.`,
        );
      }
    }

    // --- create layers -------------------------------------------------------
    if (tilesets.length > 0) {
      this.groundLayer = this.map.createLayer('Ground', tilesets) ?? null;
      this.obstaclesLayer = this.map.createLayer('Obstacles', tilesets) ?? null;
      this.overheadLayer = this.map.createLayer('Overhead', tilesets) ?? null;

      this.groundLayer?.setDepth(DEPTHS.GROUND);
      this.obstaclesLayer?.setDepth(DEPTHS.OBSTACLES);
      this.overheadLayer?.setDepth(DEPTHS.OVERHEAD);

      // Set collisions on collidable layers based on the tile property
      for (const layer of [this.groundLayer, this.obstaclesLayer]) {
        if (layer) {
          layer.setCollisionByProperty({ collides: '1' });
          const collider = this.physics.add.collider(this.player, layer);
          this.mapColliders.push(collider);
        }
      }
    }

    // --- position player at spawn point --------------------------------------
    const spawnPoint = this.map.findObject(
      LAYERS.MARKERS,
      (obj) => obj.name === spawnName,
    );

    if (spawnPoint?.x != null && spawnPoint?.y != null) {
      const spawnW = spawnPoint.width ?? 0;
      const spawnH = spawnPoint.height ?? 0;

      if (relativePos && spawnW > 0 && spawnH > 0) {
        // Map the relative exit position onto this spawn zone
        if (relativePos.axis === 'y') {
          const newY = spawnPoint.y + relativePos.value * spawnH;
          // Nudge player away from the map edge so they don't re-enter the exit zone
          const nudgeX = spawnPoint.x < 100 ? 50 : -50;
          this.player.setPosition(spawnPoint.x + spawnW / 2 + nudgeX, newY);
          this.playerShadow.setPosition(spawnPoint.x + spawnW / 2 + nudgeX - 2, newY + 26);
        } else {
          const newX = spawnPoint.x + relativePos.value * spawnW;
          const nudgeY = spawnPoint.y < 100 ? 50 : -50;
          this.player.setPosition(newX, spawnPoint.y + spawnH / 2 + nudgeY);
          this.playerShadow.setPosition(newX - 2, spawnPoint.y + spawnH / 2 + nudgeY + 26);
        }
      } else {
        // Point spawn or no relative position — place at center
        const centerX = spawnPoint.x + spawnW / 2;
        const centerY = spawnPoint.y + spawnH / 2;
        this.player.setPosition(centerX, centerY);
        this.playerShadow.setPosition(centerX - 2, centerY + 26);
      }
    } else {
      console.warn(
        `Spawn point "${spawnName}" not found in map "${mapKey}" — placing player at map center.`,
      );
      this.player.setPosition(
        this.map.widthInPixels / 2,
        this.map.heightInPixels / 2,
      );
    }

    // --- spawn map objects (NPCs, etc.) --------------------------------------
    this.spawnObjects();

    // --- create exit zones for map transitions --------------------------------
    this.createExitZones();
  }

  /**
   * Destroy the current map, its layers, colliders, and NPC references.
   */
  private cleanupMap() {
    for (const collider of this.mapColliders) {
      collider.destroy();
    }
    this.mapColliders = [];

    // Destroy exit zones from the previous map
    if (this.exitZones) {
      this.exitZones.clear(true, true);
    }

    this.groundLayer?.destroy();
    this.obstaclesLayer?.destroy();
    this.overheadLayer?.destroy();
    this.groundLayer = null;
    this.obstaclesLayer = null;
    this.overheadLayer = null;

    for (const npc of this.npcs) {
      npc.sprite.destroy();
    }
    this.npcs = [];

    if (this.map) {
      this.map.destroy();
    }
  }

  /**
   * Each object with a custom property `npcId` will be spawned as an NPC
   * using the data from NPC_REGISTRY.
   */
  private spawnObjects() {
    // adjust to spawn other things too
    const objectLayer = this.map.getObjectLayer(LAYERS.NPCS);
    if (!objectLayer) return;

    for (const obj of objectLayer.objects) {
      if (obj.x == null || obj.y == null) continue;

      // Look for the npcId custom property
      const npcIdProp = (
        obj.properties as Array<{ name: string; value: unknown }> | undefined
      )?.find((p) => p.name === 'npcId');

      if (npcIdProp) {
        const npcId = String(npcIdProp.value);
        this.spawnNpc(obj.x, obj.y, npcId);
      }
    }
  }

  /**
   * Spawn a single NPC at the given world position using NPC_REGISTRY data.
   */
  private spawnNpc(x: number, y: number, npcId: string) {
    const data = NPC_REGISTRY[npcId];
    if (!data) {
      console.warn(`Unknown npcId "${npcId}" — skipping spawn at (${x}, ${y}).`);
      return;
    }

    const sprite = this.physics.add.sprite(x, y, data.spriteKey, data.frame);
    sprite.setScale(data.scale);
    sprite.setDepth(sprite.y);
    sprite.setImmovable(true);

    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(data.bodySize.width, data.bodySize.height);
    body.setOffset(data.bodyOffset.x, data.bodyOffset.y);

    this.physics.add.collider(this.player, sprite);

    const npc: NpcObject = {
      sprite,
      x,
      y,
      name: data.name,
      onInteract: () => {
        // 1. Ask the quest system for dialog (reads current state)
        const questDialog = questManager.getNpcDialog(npcId);
        const text = questDialog ?? data.text;

        // 2. Notify the quest system (may advance quest state)
        questManager.handleNpcInteract(npcId);

        // 3. Show dialog
        this.activeDialogNpc = npc;
        EventBus.emit('npc-dialog', {
          npc: data.name,
          text,
          portrait: data.portrait,
        });
      },
    };

    this.npcs.push(npc);
  }

  // ---- exit zone management --------------------------------------------------

  /**
   * Create physics zones for each Markers-layer object that has a `target_map`
   * property.  An overlap callback triggers the map transition.
   */
  private createExitZones() {
    this.exitZones = this.physics.add.staticGroup();

    const markersLayer = this.map.getObjectLayer(LAYERS.MARKERS);
    if (!markersLayer) return;

    for (const obj of markersLayer.objects) {
      if (!obj.width || !obj.height || obj.x == null || obj.y == null) continue;

      const props = obj.properties as
        | Array<{ name: string; value: unknown }>
        | undefined;
      const targetMapProp = props?.find((p) => p.name === 'target_map');
      if (!targetMapProp) continue;

      const zone = this.add.zone(
        obj.x + obj.width / 2,
        obj.y + obj.height / 2,
        obj.width,
        obj.height,
      );

      this.physics.add.existing(zone, true);

      zone.setData('targetMap', String(targetMapProp.value));
      zone.setData('width', obj.width);
      zone.setData('height', obj.height);
      zone.setData('y', obj.y);

      this.exitZones.add(zone);
    }

    // The overlap fires every frame while the player touches the zone
    this.physics.add.overlap(
      this.player,
      this.exitZones,
      this.handleExitOverlap as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
  }

  /**
   * Called by the physics overlap each frame. Ignores the zone if the player
   * hasn't left it yet (prevents the spawn-loop problem).
   */
  private handleExitOverlap(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    zone: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    if (this.isTransitioning) return;

    // Ignore if this is the zone the player just spawned into
    if (this.activeExitZone === zone) return;

    this.activeExitZone = zone as Phaser.GameObjects.Zone;

    const targetMap = (zone as Phaser.GameObjects.Zone).getData('targetMap') as string;
    const zoneY = (zone as Phaser.GameObjects.Zone).getData('y') as number;
    const zoneH = (zone as Phaser.GameObjects.Zone).getData('height') as number;

    const relY = (this.player.y - zoneY) / zoneH; 

    this.startMapTransition(targetMap, relY);
  }

  /**
   * Perform a fade-out → change map → fade-in transition.
   */
  private startMapTransition(
    targetMapId: string,
    relativeY: number,
  ) {
    this.isTransitioning = true;

    // Stop player movement immediately
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.player.anims.stop();

    // Derive the map cache key (maps are loaded as "<id>-json")
    const mapKey = `${targetMapId}-json`;

    // The destination spawn name is the same as the exit spawn name on the
    // *current* map — the two maps share a naming convention where a zone
    // on one map has a `target_map` pointing to the other map, and the
    // matching zone on the other map points back. We need to find the zone
    // on the *target* map whose `target_map` points back to the current map.
    const currentMapId = this.currentMapKey.replace('-json', '');

    // Fade out
    this.cameras.main.fadeOut(FADE_DURATION, 0, 0, 0);

    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        // Find the matching spawn zone on the target map
        // We need to peek into the target map data to find the correct spawn
        const targetTilemap = this.make.tilemap({ key: mapKey });
        const targetMarkersLayer = targetTilemap.getObjectLayer(LAYERS.MARKERS);
        let destinationSpawnName = 'spawn';

        if (targetMarkersLayer) {
          for (const obj of targetMarkersLayer.objects) {
            const objProps = obj.properties as
              | Array<{ name: string; value: unknown }>
              | undefined;
            const tmProp = objProps?.find((p) => p.name === 'target_map');
            if (tmProp && String(tmProp.value) === currentMapId) {
              destinationSpawnName = obj.name;
              break;
            }
          }
        }
        targetTilemap.destroy();

        // Change the map with relative positioning
        this.changeMap(mapKey, destinationSpawnName, {
          axis: 'y',
          value: relativeY,
        });

        // Fade back in
        this.cameras.main.fadeIn(FADE_DURATION, 0, 0);

        // Mark the zone the player just spawned into so it won't re-trigger
        // We find it by checking which exit zone contains the player
        this.activeExitZone = null;
        for (const child of this.exitZones.getChildren()) {
          const z = child as Phaser.GameObjects.Zone;
          const bounds = z.getBounds();
          if (Phaser.Geom.Rectangle.Contains(bounds, this.player.x, this.player.y)) {
            this.activeExitZone = z;
            break;
          }
        }

        this.cameras.main.once(
          Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
          () => {
            this.isTransitioning = false;
          },
        );
      },
    );
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
      if (this.activeDialogNpc) {
        this.hint.setVisible(false);
      } else {
        this.hint?.setText(`Press [E] to ${nearestNpc ? 'talk' : 'interact'}`);
        this.hint.setVisible(true);
      }
    } else {
        this.hint?.setText('');
        this.hint.setVisible(false);
    }
  }

  private checkDialogExitRadius() {
    if (!this.activeDialogNpc) return;
    const dist = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.activeDialogNpc.x,
      this.activeDialogNpc.y,
    );
    if (dist > NPC_EXIT_RADIUS) {
      this.activeDialogNpc = null;
      EventBus.emit('npc-dialog', null);
    }
  }

  private handleInteract() {
    if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
      // If dialog is open, close it first
      if (this.activeDialogNpc) {
        this.activeDialogNpc = null;
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

        // Notify quest system
        questManager.handleItemCollected('chest');

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
