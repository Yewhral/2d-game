/**
 * GameScene — top-down gameplay scene.
 *
 * Controls:
 *   Arrow keys / WASD → move in 8 directions
 *   E                 → interact with nearby objects
 *
 * Two-way EventBus integration:
 *   Phaser → React: "scene-changed"
 */

import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { questManager } from "../quests/QuestManager";
import { saveManager } from "../saveManager";
import { QUEST_DEFINITIONS } from "../quests/definitions";
import { Collectible } from "../collectibles/Collectible";
import { spawnCollectibles } from "../collectibles/spawnCollectibles";
import { 
  DEPTHS, 
  FADE_DURATION, 
  GAME_BG_COLOR, 
  INTERACT_RADIUS, 
  LAYERS, 
  NPC_EXIT_RADIUS, 
  PLAYER_SPEED 
} from "../constants";
import { NPC_REGISTRY, type NpcData } from "./npcs";
import { DECORATION_REGISTRY } from "./decorations";
import { TILESET_IMAGE_KEYS } from "../tilesets";
import { worldState } from "../worldState";
import { FX_REGISTRY } from "./effects";
import { collectibleState } from "../collectibles/CollectibleState";

const INITIAL_MAP = '16-json';

interface SceneData {
  loadSave?: boolean;
  mapKey?: string;
  playerX?: number;
  playerY?: number;
}

// ---- types -----------------------------------------------------------------
interface InteractableObject {
  gfx: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle;
  body: Phaser.Physics.Arcade.StaticBody;
  label: Phaser.GameObjects.Text;
  onInteract: () => void;
  collected: boolean;
}

interface NpcPatrolState {
  axis: 'x' | 'y';
  speed: number;
  minPos: number;
  maxPos: number;
  direction: 1 | -1;
  defaultFlip: boolean;
  pauseMs: number;
  paused: boolean;
  pauseTimer: number;
}

interface NpcObject {
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  name: string;
  onInteract: () => void;
  patrol?: NpcPatrolState;
  data?: NpcData;
}

interface DecorationEntry {
  gameObject: Phaser.GameObjects.GameObject;
  worldStateId: string | null;
}


export class GameScene extends Phaser.Scene {
  // --- state -----------------------------------------------------------------
  private sceneData: SceneData = {};
  private isTransitioning = false;
  private currentMapKey = '';

  // --- map -------------------------------------------------------------------
  private map!: Phaser.Tilemaps.Tilemap;
  private waterLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private groundLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private shadowLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private highGroundLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private obstaclesLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private overheadLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private barriersLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private passagesLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private mapColliders: Phaser.Physics.Arcade.Collider[] = [];
  private exitZones!: Phaser.Physics.Arcade.StaticGroup;
  private activeExitZone: Phaser.GameObjects.Zone | null = null;
  private effectZones!: Phaser.Physics.Arcade.StaticGroup;

  // --- scene objects ---------------------------------------------------------
  private player!: Phaser.Physics.Arcade.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private interactables: InteractableObject[] = [];
  private npcs: NpcObject[] = [];
  private decorations: DecorationEntry[] = [];
  private collectibles: Collectible[] = [];
  private collectibleOverlap: Phaser.Physics.Arcade.Collider | null = null;
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

  // --- mobile controls -------------------------------------------------------
  private isTouchDevice = false;
  private mobileMoveVector = { x: 0, y: 0 };
  private mobileInteractPressed = false;
  private canInteract = false;

  constructor() {
    super("GameScene");
  }

  init(data?: SceneData) {
    this.sceneData = data ?? {};
  }

  // ---------------------------------------------------------------------------
  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(GAME_BG_COLOR);

    // ---- player animations ---------------------------------------------------
    const directions = ['up', 'ne', 'right', 'se', 'down', 'sw', 'left', 'nw'];
    directions.forEach((dir, index) => {
      const animKey = `walk-${dir}`;
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: [
            { key: 'player', frame: 72 + index },
            { key: 'player', frame: 80 + index },
            { key: 'player', frame: 88 + index },
          ],
          frameRate: 10,
          repeat: -1,
        });
      }
    });

    // ---- decoration animations -----------------------------------------------
    Object.values(DECORATION_REGISTRY).forEach((data) => {
      if (data.animated) {
        if (!this.anims.exists(`anim-${data.spriteKey}`)) {
          this.anims.create({
            key: `anim-${data.spriteKey}`,
            frames: this.anims.generateFrameNumbers(data.spriteKey, {}),
            frameRate: 10,
            repeat: -1,
          });
        }
      }
    });

    // ---- FX animations -------------------------------------------------------
    Object.values(FX_REGISTRY).forEach((fx) => {
      if (fx.animKey && fx.spriteKey && !this.anims.exists(fx.animKey)) {
        this.anims.create({
          key: fx.animKey,
          frames: this.anims.generateFrameNumbers(fx.spriteKey, {}),
          frameRate: 12,
          repeat: 0,
        });
      }
    });

    // ---- player --------------------------------------------------------------
    this.player = this.physics.add.sprite(width / 2, height / 2, 'player', 76);
    this.player.setScale(3);
    this.player.setDepth(this.player.y);
    this.player.setOrigin(0.5, 1);
    if (this.player.body) {
      this.player.body.setSize(9, 5);
      this.player.body.setOffset(3, 18);
    }
    this.player.setCollideWorldBounds(true);

    // ---- player shadow -------------------------------------------------------
    this.playerShadow = this.add.ellipse(0, 0, 28, 22, 0x000000, 0.25);
    this.playerShadow.setDepth(this.player.y - 1);

    // ---- load initial map ---------------------------------------------------
    if (this.sceneData.loadSave && this.sceneData.mapKey) {
      // Continuing a saved game — load the saved map
      this.changeMap(this.sceneData.mapKey, 'spawn');
      // Override spawn with saved position
      if (this.sceneData.playerX != null && this.sceneData.playerY != null) {
        this.player.setPosition(this.sceneData.playerX, this.sceneData.playerY);
        this.playerShadow.setPosition(this.sceneData.playerX - 2, this.sceneData.playerY - 10);
      }
    } else {
      this.changeMap(INITIAL_MAP, 'spawn');
    }

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
      .setDepth(300000);

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

    // ---- mobile controls (touch devices only) --------------------------------
    this.isTouchDevice = this.sys.game.device.input.touch;
    
    // Listen for mobile control events from React
    EventBus.on("mobile-move", (vec) => {
      this.mobileMoveVector = vec;
    });

    EventBus.on("mobile-interact", (pressed) => {
      this.mobileInteractPressed = pressed;
    });

    // ---- EventBus (React → Phaser) ------------------------------------------

    EventBus.on("quest:remove-tiles", ({ mapKey, layer, tileIds }) => {
      if (mapKey !== this.currentMapKey) return;
      const tilemapLayer =
        layer === LAYERS.OBSTACLES ? this.obstaclesLayer :
        layer === LAYERS.BARRIERS ? this.barriersLayer : null;
      if (!tilemapLayer) return;

      const tileIdSet = new Set(tileIds);
      tilemapLayer.forEachTile((tile) => {
        if (tileIdSet.has(tile.index)) {
          tilemapLayer.removeTileAt(tile.x, tile.y);
        }
      });
    });

    EventBus.on("quest:fade-layer", ({ mapKey, layer }) => {
      if (mapKey !== this.currentMapKey) return;

      const tilemapLayer =
        layer === LAYERS.OBSTACLES ? this.obstaclesLayer :
        layer === LAYERS.BARRIERS ? this.barriersLayer : null;

      if (!tilemapLayer) return;

      // Persist so returning to this map skips the animation
      const stateKey = `hiddenLayer_${mapKey}_${layer}`;
      if (worldState.get(stateKey)) return; // already hidden
      worldState.set(stateKey, 'hidden');

      this.tweens.add({
        targets: tilemapLayer,
        alpha: 0,
        duration: 800,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.hideLayer(tilemapLayer);
        },
      });
    });

    EventBus.on("world:refresh-decorations", () => {
      this.refreshWorldDecorations();
    });

    EventBus.on("quest:show-layer", ({ mapKey, layer }) => {
      if (mapKey !== this.currentMapKey) return;

      const tilemapLayer =
        layer === LAYERS.PASSAGES ? this.passagesLayer : null;

      if (!tilemapLayer) return;

      // Persist so returning to this map shows it immediately
      const stateKey = `shownLayer_${mapKey}_${layer}`;
      if (worldState.get(stateKey)) return; // already shown
      worldState.set(stateKey, 'shown');

      tilemapLayer.setAlpha(0);
      tilemapLayer.setVisible(true);
      this.tweens.add({
        targets: tilemapLayer,
        alpha: 1,
        duration: 800,
        ease: 'Sine.easeIn',
      });
    });

    EventBus.on("fx:spawn", ({ type, x, y }) => {
      this.spawnEffect(type, x, y);
    });

    EventBus.on("npc-dialog", (payload) => {
      if (!payload) this.activeDialogNpc = null;
    });

    EventBus.on('item-collected', ({ id }) => {
      this.npcs.forEach(npc => {
        if (npc.data?.stopAnimWhenCollected === id) {
          npc.sprite.anims.stop();
          npc.sprite.setFrame(npc.data.frame);
        }
      });
    });

    // ---- initial React sync -------------------------------------------------
    EventBus.emit("scene-changed", { scene: "GameScene" });

    // After loading a save, we need to tell React about the restored quest states.
    // We wait a tiny bit to ensure GameHUD is mounted and listening.
    setTimeout(() => {
      questManager.emitAllStates();
    }, 100);
  }

  // ---------------------------------------------------------------------------
  update() {
    if (!this.cursors) return;

    if (this.player && this.playerShadow) {
      this.playerShadow.setPosition(this.player.x - 2, this.player.y - 10);
      const isMoving = (this.player.body as Phaser.Physics.Arcade.Body).velocity.length() > 0;
      this.playerShadow.setScale(isMoving ? 1.1 : 1.0);
      this.player.setDepth(this.player.y);
    }

    if (this.isTransitioning) return;

    this.handleMovement();
    this.updatePatrols();
    this.checkDialogExitRadius();
    this.updateInteractHint();
    this.handleInteract();

    // consume mobile interact flag
    this.mobileInteractPressed = false;
  }

  // ---------------------------------------------------------------------------
  shutdown() {
    EventBus.off("quest:remove-tiles");
    EventBus.off("quest:fade-layer");
    EventBus.off("world:refresh-decorations");
    EventBus.off("fx:spawn");
    EventBus.off("npc-dialog");
    EventBus.off("quest:show-layer");
    EventBus.off("mobile-move");
    EventBus.off("mobile-interact");
    EventBus.off("item-collected");
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
      this.waterLayer = this.map.getLayer(LAYERS.WATER)
        ? this.map.createLayer(LAYERS.WATER, tilesets)
        : null;
      this.groundLayer = this.map.getLayer(LAYERS.GROUND)
        ? this.map.createLayer(LAYERS.GROUND, tilesets)
        : null;
      this.obstaclesLayer = this.map.getLayer(LAYERS.OBSTACLES)
        ? this.map.createLayer(LAYERS.OBSTACLES, tilesets)
        : null;
      this.overheadLayer = this.map.getLayer(LAYERS.OVERHEAD)
        ? this.map.createLayer(LAYERS.OVERHEAD, tilesets)
        : null;
      this.barriersLayer = this.map.getLayer(LAYERS.BARRIERS)
        ? this.map.createLayer(LAYERS.BARRIERS, tilesets)
        : null;
      this.passagesLayer = this.map.getLayer(LAYERS.PASSAGES)
        ? this.map.createLayer(LAYERS.PASSAGES, tilesets)
        : null;
      this.shadowLayer = this.map.getLayer(LAYERS.SHADOW)
        ? this.map.createLayer(LAYERS.SHADOW, tilesets)
        : null;
      this.highGroundLayer = this.map.getLayer(LAYERS.HIGH_GROUND)
        ? this.map.createLayer(LAYERS.HIGH_GROUND, tilesets)
        : null;

      this.waterLayer?.setDepth(DEPTHS.WATER);
      this.groundLayer?.setDepth(DEPTHS.GROUND);
      this.shadowLayer?.setDepth(DEPTHS.SHADOW);
      this.highGroundLayer?.setDepth(DEPTHS.HIGH_GROUND);
      this.obstaclesLayer?.setDepth(DEPTHS.OBSTACLES);
      this.overheadLayer?.setDepth(DEPTHS.OVERHEAD);
      this.barriersLayer?.setDepth(DEPTHS.BARRIERS);
      this.passagesLayer?.setDepth(DEPTHS.PASSAGES);
      this.passagesLayer?.setVisible(false);

      // Set collisions on collidable layers based on the tile property
      const collidableLayers = [this.groundLayer, this.highGroundLayer, this.obstaclesLayer, this.barriersLayer, this.passagesLayer]
        .filter((l): l is Phaser.Tilemaps.TilemapLayer => l !== null);

      for (const layer of collidableLayers) {
        layer.setCollisionByProperty({ collides: '1' });
      }
      
      if (collidableLayers.length > 0) {
        const collider = this.physics.add.collider(this.player, collidableLayers);
        this.mapColliders.push(collider);
      }

      // --- restore previously hidden/shown layers (no animation) ---------------
      this.restoreLayerStates(mapKey);
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

    this.preloadNpcAvatars();
    this.spawnObjects();
    this.spawnCollectibles();
    this.createExitZones();
    this.createEffectZones();
    this.checkRetroactiveQuests();
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
    if (this.effectZones) {
      this.effectZones.clear(true, true);
    }

    this.waterLayer?.destroy();
    this.groundLayer?.destroy();
    this.obstaclesLayer?.destroy();
    this.overheadLayer?.destroy();
    this.barriersLayer?.destroy();
    this.passagesLayer?.destroy();
    this.shadowLayer?.destroy();
    this.highGroundLayer?.destroy();

    this.waterLayer = null;
    this.groundLayer = null;
    this.obstaclesLayer = null;
    this.overheadLayer = null;
    this.barriersLayer = null;
    this.passagesLayer = null;
    this.shadowLayer = null;
    this.highGroundLayer = null;

    for (const npc of this.npcs) {
      npc.sprite.destroy();
    }
    this.npcs = [];

    for (const entry of this.decorations) {
      entry.gameObject.destroy();
    }
    this.decorations = [];

    // Destroy collectibles from previous map
    if (this.collectibleOverlap) {
      this.collectibleOverlap.destroy();
      this.collectibleOverlap = null;
    }
    for (const c of this.collectibles) {
      if (!c.isCollected) c.destroySprite();
    }
    this.collectibles = [];

    if (this.map) {
      this.map.destroy();
    }
  }

  /**
   * Hide a tilemap layer: make it invisible and disable all its tile collisions.
   */
  private hideLayer(layer: Phaser.Tilemaps.TilemapLayer) {
    layer.setVisible(false);
    layer.setAlpha(1);
    layer.forEachTile((tile) => {
      tile.setCollision(false);
    });
  }

  /**
   * Show a tilemap layer: make it visible and re-enable collisions
   * based on the tile's `collides` property.
   */
  private showLayer(layer: Phaser.Tilemaps.TilemapLayer) {
    layer.setVisible(true);
    layer.setAlpha(1);
    layer.setCollisionByProperty({ collides: '1' });
  }

  /**
   * On map load, check worldState for layers that were previously
   * hidden (fade-layer) or shown (show-layer) and apply immediately.
   */
  private restoreLayerStates(mapKey: string) {
    // Layers that can be hidden via quest:fade-layer
    const hideable: Array<{ name: string; layer: Phaser.Tilemaps.TilemapLayer | null }> = [
      { name: LAYERS.OBSTACLES, layer: this.obstaclesLayer },
      { name: LAYERS.BARRIERS, layer: this.barriersLayer },
    ];

    for (const { name, layer } of hideable) {
      if (layer && worldState.get(`hiddenLayer_${mapKey}_${name}`)) {
        this.hideLayer(layer);
      }
    }

    // Layers that can be shown via quest:show-layer
    const showable: Array<{ name: string; layer: Phaser.Tilemaps.TilemapLayer | null }> = [
      { name: LAYERS.PASSAGES, layer: this.passagesLayer },
    ];

    for (const { name, layer } of showable) {
      if (layer && worldState.get(`shownLayer_${mapKey}_${name}`)) {
        this.showLayer(layer);
      }
    }
  }

  private spawnDecorations(worldStateOnly = false) {
    const layer = this.map.getObjectLayer(LAYERS.DECORATIONS);
    if (!layer) return;

    for (const obj of layer.objects) {
      if (obj.x == null || obj.y == null) continue;

      const getProp = (name: string) => (
        obj.properties as Array<{ name: string; value: unknown }> | undefined
      )?.find((p) => p.name === name)?.value;

      const decIdProp = getProp('decorationId');
      if (!decIdProp) continue;

      const baseId = String(decIdProp);
      const worldStateId = getProp('worldStateId') ? String(getProp('worldStateId')) : undefined;

      // CASE 1: no worldState → spawn normally (legacy behavior)
      if (!worldStateId) {
        if (!worldStateOnly) {
          this.spawnDecoration(obj, baseId, null);
        }
        continue;
      }

      // CASE 2: worldState-controlled — only spawn if state exists
      if (!worldState.get(worldStateId)) continue;

      this.spawnDecoration(obj, baseId, worldStateId);
    }
  }

  private spawnNpcs() {
    const objectLayer = this.map.getObjectLayer(LAYERS.NPCS);
    if (!objectLayer) return;

    for (const obj of objectLayer.objects) {
      if (obj.x == null || obj.y == null) continue;

      const npcIdProp = (
        obj.properties as Array<{ name: string; value: unknown }> | undefined
      )?.find((p) => p.name === 'npcId');

      if (npcIdProp) {
        const npcId = String(npcIdProp.value);
        this.spawnNpc(obj.x, obj.y, npcId);
      }
    }
  }

  private spawnObjects() {
    this.spawnNpcs();
    this.spawnDecorations();
  }

  private preloadNpcAvatars() {
    const objectLayer = this.map.getObjectLayer(LAYERS.NPCS);
    if (!objectLayer) return;

    const portraitsToLoad = new Set<string>();
    for (const obj of objectLayer.objects) {
      const npcIdProp = (
        obj.properties as Array<{ name: string; value: unknown }> | undefined
      )?.find((p) => p.name === 'npcId');

      if (npcIdProp) {
        const npcId = String(npcIdProp.value);
        const data = NPC_REGISTRY[this.currentMapKey]?.[npcId];
        if (data?.portrait) {
          portraitsToLoad.add(data.portrait);
        }
      }
    }

    let startedLoad = false;
    for (const portrait of portraitsToLoad) {
      if (!this.textures.exists(portrait)) {
        this.load.image(portrait, portrait);
        startedLoad = true;
      }
    }

    if (startedLoad) {
      this.load.start();
    }
  }

  private spawnNpc(x: number, y: number, npcId: string) {
    const data = NPC_REGISTRY[this.currentMapKey]?.[npcId];
    if (!data) {
      console.warn(`Unknown npcId "${npcId}" on map "${this.currentMapKey}" — skipping spawn at (${x}, ${y}).`);
      return;
    }

    const sprite = this.physics.add.sprite(x, y, data.spriteKey, data.frame);
    sprite.setScale(data.scale);
    sprite.setDepth(sprite.y);
    sprite.setImmovable(true);
    sprite.setFlipX(data.flipX ?? false);

    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(data.bodySize.width, data.bodySize.height);
    body.setOffset(data.bodyOffset.x, data.bodyOffset.y);

    this.physics.add.collider(this.player, sprite);

    const shouldAnimate = data.animated &&
      !(data.stopAnimWhenCollected && collectibleState.isCollected(data.stopAnimWhenCollected));

    if (shouldAnimate) {
      const animKey = `anim-${this.currentMapKey}-${npcId}`;
      if (!this.anims.exists(animKey)) {
        const frames = this.anims.generateFrameNumbers(data.spriteKey, {});
        if (frames.length > 0) {
          this.anims.create({
            key: animKey,
            frames,
            frameRate: 10,
            repeatDelay: data.repeatDelay ?? 0,
            delay: data.delay ?? 0,
            randomFrame: true,
            repeat: -1,
          });
        }
      }
      if (this.anims.exists(animKey)) {
        sprite.play({ key: animKey, startFrame: data.frame });
      }
    }

    const npc: NpcObject = {
      sprite,
      x,
      y,
      name: data.name,
      data,
      onInteract: () => {
        // 1. Capture the pre-interaction dialog (inactive=intro, active=progress, etc.)
        //    This ensures quest-accept interactions show the correct 'inactive' dialog.
        const questDialog = questManager.getNpcDialog(npcId);
        const raw = questDialog ?? data.text;
        const defaultPages = Array.isArray(raw) ? raw : [raw];

        // 2. Run quest logic. If a delivery happens, onDelivered will emit an
        //    'npc-dialog' override we capture here.
        let dialogOverride: { npc: string; text: string[]; portrait?: string; theme?: string } | null = null;
        const captureOverride = (payload: typeof dialogOverride) => { dialogOverride = payload; };
        EventBus.on('npc-dialog', captureOverride);
        questManager.handleNpcInteract(npcId);
        EventBus.off('npc-dialog', captureOverride);

        // 3. If onDelivered emitted a receipt dialog, show that; otherwise show the
        //    pre-interaction default (quest intro for inactive, progress for active, etc.)
        this.activeDialogNpc = npc;
        if (dialogOverride) {
          EventBus.emit('npc-dialog', dialogOverride);
        } else {
          EventBus.emit('npc-dialog', {
            npc: data.name,
            text: defaultPages,
            portrait: data?.portrait,
            theme: data.theme ?? 'purple',
          });
        }
      },
    };

    this.npcs.push(npc);

    // ---- patrol behaviour (velocity-based) ----------------------------------
    if (data.patrol) {
      const { axis, distance, speed, pauseMs = 0 } = data.patrol;
      const origin = axis === 'x' ? x : y;

      npc.patrol = {
        axis,
        speed,
        minPos: origin - distance,
        maxPos: origin + distance,
        direction: 1,
        defaultFlip: data.flipX ?? false,
        pauseMs,
        paused: false,
        pauseTimer: 0,
      };
    }
  }

  /** Drive all patrolling NPCs via physics velocity each frame. */
  private updatePatrols() {
    for (const npc of this.npcs) {
      if (!npc.patrol) continue;

      const p = npc.patrol;
      const body = npc.sprite.body as Phaser.Physics.Arcade.Body;
      if (!body) continue;

      // ---- pause at endpoints ------------------------------------------------
      if (p.paused) {
        p.pauseTimer -= this.game.loop.delta;
        if (p.pauseTimer <= 0) {
          p.paused = false;
        } else {
          body.setVelocity(0, 0);
          continue;
        }
      }

      // ---- move toward current target ----------------------------------------
      const currentPos = p.axis === 'x' ? npc.sprite.x : npc.sprite.y;
      const target = p.direction === 1 ? p.maxPos : p.minPos;
      const reachedTarget = p.direction === 1
        ? currentPos >= target
        : currentPos <= target;

      if (reachedTarget) {
        // Clamp to exact endpoint
        if (p.axis === 'x') npc.sprite.x = target;
        else npc.sprite.y = target;

        body.setVelocity(0, 0);
        p.direction = (p.direction === 1 ? -1 : 1) as 1 | -1;

        // Flip sprite for new direction
        if (p.axis === 'x') {
          npc.sprite.setFlipX(p.direction === -1 ? !p.defaultFlip : p.defaultFlip);
        }

        if (p.pauseMs > 0) {
          p.paused = true;
          p.pauseTimer = p.pauseMs;
        }
      } else {
        // Apply velocity in the patrol direction
        if (p.axis === 'x') {
          body.setVelocityX(p.speed * p.direction);
          body.setVelocityY(0);
        } else {
          body.setVelocityX(0);
          body.setVelocityY(p.speed * p.direction);
        }
      }

      // Sync tracked position for dialog-exit-radius
      npc.x = npc.sprite.x;
      npc.y = npc.sprite.y;
    }
  }

private spawnDecoration(obj: any, id: string, worldStateId: string | null) {
  const data = DECORATION_REGISTRY[id];
  if (!data) {
    console.warn(`Unknown decoration "${id}"`);
    return;
  }

  const offsetX = data?.bodyOffset?.x ?? 0;
  const offsetY = data?.bodyOffset?.y ?? 0;

  const sprite = this.add.sprite(
    obj.x + offsetX,
    obj.y + offsetY,
    data.spriteKey,
    data.frame
  );

  sprite.setOrigin(0, 1);
  sprite.setScale(data.scale);
  sprite.setDepth(sprite.y + (data.depthOffset ?? 0));
  sprite.setFlipX(data.flipX ?? false);

  if (data.animated) {
    sprite.play(`anim-${data.spriteKey}`);
  }

  this.decorations.push({ gameObject: sprite, worldStateId });

  // --- collision
  if (data.hasCollision && data.hitbox) {
    const body = this.physics.add.staticImage(obj.x, obj.y, '');
    body.setVisible(false);

    body.body.setSize(
      data.hitbox.width,
      data.hitbox.height
    );

    body.body.setOffset(
      data.hitbox.offsetX,
      data.hitbox.offsetY
    );

    this.physics.add.collider(this.player, body);
    this.decorations.push({ gameObject: body, worldStateId });
  }
}

  private refreshWorldDecorations() {
    // Remove only worldState-controlled decorations
    this.decorations = this.decorations.filter((entry) => {
      if (!entry.worldStateId) return true;

      entry.gameObject.destroy();
      return false;
    });

    // Respawn only worldState-controlled decorations from map
    this.spawnDecorations(true);
  }

  // ---- visual effects -------------------------------------------------------

  private spawnEffect(type: string, x?: number, y?: number) {
    const fx = FX_REGISTRY[type];
    if (!fx) {
      console.warn(`Unknown FX type "${type}"`);
      return;
    }

    if (fx.shake) {
      this.cameras.main.shake(fx.shake.duration, fx.shake.intensity);
    }

    if (fx.movePlayer) {
      this.player.x += fx.movePlayer.x;
      this.player.y += fx.movePlayer.y;
    }

    if (fx.dialog && x !== undefined && y !== undefined) {
      this.activeDialogNpc = {
        sprite: this.player, 
        x: fx.movePlayer ? this.player.x : x,
        y: fx.movePlayer ? this.player.y : y,
        name: fx.dialog.npc || 'System',
        onInteract: () => {}
      };

      const fxPages = Array.isArray(fx.dialog.text) ? fx.dialog.text : [fx.dialog.text];

      EventBus.emit('npc-dialog', {
        npc: fx.dialog.npc || '',
        text: fxPages,
        portrait: fx.dialog.portrait || '',
        theme: fx.dialog.theme || 'purple',
      });
    }

    if (fx.spriteKey && fx.animKey && x !== undefined && y !== undefined) {
      const sprite = this.add.sprite(x, y, fx.spriteKey);
      sprite.setScale(fx.scale ?? 1);
      sprite.setDepth(y + (fx.depthOffset ?? 0));

      sprite.play(fx.animKey);

      sprite.once('animationcomplete', () => {
        sprite.destroy();
      });
    }
  }

  // ---- mobile controls (React-based HUD) ------------------------------------

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
      zone.setData('x', obj.x);
      zone.setData('y', obj.y);
      zone.setData('width', obj.width);
      zone.setData('height', obj.height);
      zone.setData('name', obj.name);

      const failQuestIdProp = props?.find((p) => p.name === 'failQuestId');
      if (failQuestIdProp) {
        zone.setData('failQuestId', String(failQuestIdProp.value));
      }

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
    const zoneX = (zone as Phaser.GameObjects.Zone).getData('x') as number;
    const zoneY = (zone as Phaser.GameObjects.Zone).getData('y') as number;
    const zoneW = (zone as Phaser.GameObjects.Zone).getData('width') as number;
    const zoneH = (zone as Phaser.GameObjects.Zone).getData('height') as number;
    const failQuestId = (zone as Phaser.GameObjects.Zone).getData('failQuestId') as string;

    if (failQuestId) {
      const ids = failQuestId.split(',').map(id => id.trim());
      questManager.failQuests(ids);
    }

    // Determine exit direction based on zone aspect ratio:
    // - Tall/narrow zone → left/right exit → track Y position
    // - Wide/short zone → top/bottom exit → track X position
    const isHorizontalExit = zoneW > zoneH;
    const axis: 'x' | 'y' = isHorizontalExit ? 'x' : 'y';
    const relValue = isHorizontalExit
      ? (this.player.x - zoneX) / zoneW
      : (this.player.y - zoneY) / zoneH;

    const zoneName = (zone as Phaser.GameObjects.Zone).getData('name') as string;
    this.startMapTransition(targetMap, { axis, value: relValue }, zoneName);
  }

  private createEffectZones() {
    this.effectZones = this.physics.add.staticGroup();

    const markersLayer = this.map.getObjectLayer(LAYERS.MARKERS);
    if (!markersLayer) return;

    for (const obj of markersLayer.objects) {
      if (!obj.width || !obj.height || obj.x == null || obj.y == null) continue;

      const props = obj.properties as Array<{ name: string; value: unknown }> | undefined;
      const effectTypeProp = props?.find((p) => p.name === 'effectType');
      const failQuestIdProp = props?.find((p) => p.name === 'failQuestId');

      if (obj.type !== 'effect' && !effectTypeProp) continue;

      const effectType = effectTypeProp ? String(effectTypeProp.value) : obj.name;
      
      const worldStateId = `effect_${this.currentMapKey}_${obj.id}`;
      // Just like pawn house built! 
      if (!FX_REGISTRY[effectType]?.repeatable && worldState.get(worldStateId) === 'triggered') {
        continue;
      }

      const zone = this.add.zone(
        obj.x + obj.width / 2,
        obj.y + obj.height / 2,
        obj.width,
        obj.height,
      );

      this.physics.add.existing(zone, true);
      zone.setData('effectType', effectType);
      zone.setData('worldStateId', worldStateId);
      if (failQuestIdProp) {
        zone.setData('failQuestId', String(failQuestIdProp.value));
      }

      this.effectZones.add(zone);
    }

    this.physics.add.overlap(
      this.player,
      this.effectZones,
      this.handleEffectOverlap as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
  }

  private handleEffectOverlap(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    zone: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ) {
    if (this.isTransitioning) return;

    const z = zone as Phaser.GameObjects.Zone;
    const effectType = z.getData('effectType') as string;
    const worldStateId = z.getData('worldStateId') as string;
    const failQuestId = z.getData('failQuestId') as string;

    if (failQuestId) {
      const ids = failQuestId.split(',').map(id => id.trim());
      questManager.failQuests(ids);
    }

    if (FX_REGISTRY[effectType]) {
      this.spawnEffect(effectType, this.player.x, this.player.y);
      if (!FX_REGISTRY[effectType].repeatable) {
        worldState.set(worldStateId, 'triggered');
        z.destroy();
      } else {
        const body = z.body as Phaser.Physics.Arcade.Body;
        if (body) body.enable = false;
        this.time.delayedCall(50, () => {
          if (z.active && body) body.enable = true;
        });
      }
    } else {
      console.warn(`Effect zone triggered unknown effect: ${effectType}`);
    }
  }

  /**
   * Perform a fade-out → change map → fade-in transition.
   */
  private static OPPOSITE_DIRECTIONS: Record<string, string> = {
    bottom: 'top',
    top: 'bottom',
    left: 'right',
    right: 'left',
  };

  private startMapTransition(
    targetMapId: string,
    relativePos: { axis: 'x' | 'y'; value: number },
    exitZoneName: string,
  ) {
    this.isTransitioning = true;

    // Stop player movement immediately
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.player.anims.stop();

    // Derive the map cache key (maps are loaded as "<id>-json")
    const mapKey = `${targetMapId}-json`;

    const currentMapId = this.currentMapKey.replace('-json', '');

    // Fade out
    this.cameras.main.fadeOut(FADE_DURATION, 0, 0, 0);

    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        // Find the matching spawn zone on the target map.
        // Primary: look for a zone whose target_map points back to this map.
        // Fallback: mirror the exit zone's direction name (e.g. spawn_bottom → spawn_top).
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

            // Fallback: mirror the direction in the exit zone name
            if (destinationSpawnName === 'spawn' && exitZoneName) {
              const parts = exitZoneName.split('_');
              const dir = parts[parts.length - 1];
              const opposite = GameScene.OPPOSITE_DIRECTIONS[dir];
              if (opposite) {
                const mirroredName = [...parts.slice(0, -1), opposite].join('_');
              const found = targetMarkersLayer.objects.find((o) => o.name === mirroredName);
                if (found) {
                  destinationSpawnName = mirroredName;
                }
              }
            }
          }
        targetTilemap.destroy();

        // Change the map with relative positioning
        this.changeMap(mapKey, destinationSpawnName, relativePos);

        // Auto-save after map transition
        saveManager.save(mapKey, this.player.x, this.player.y);

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
    const { x: jx, y: jy } = this.mobileMoveVector;

    const left = this.cursors.left.isDown || this.wasd.left.isDown || jx < -0.3;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || jx > 0.3;
    const up = this.cursors.up.isDown || this.wasd.up.isDown || jy < -0.3;
    const down = this.cursors.down.isDown || this.wasd.down.isDown || jy > 0.3;

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
    const nearestCol = this.nearestCollectible();
    const canInteract = !!(nearest || nearestNpc || nearestCol);

    // If we are in range OF something OR a dialog is already open
    if (canInteract || this.activeDialogNpc) {
      if (this.activeDialogNpc) {
        this.hint.setVisible(false);
        this.canInteract = true;
      } else {
        const label = nearestNpc ? 'talk' : nearestCol ? 'pick up' : 'interact';
        const verb = this.isTouchDevice ? 'Tap' : 'Press [E]';
        this.hint?.setText(`${verb} to ${label}`);
        
        // Show hint on desktop, but on mobile we use the button visibility instead
        this.hint.setVisible(!this.isTouchDevice);
        this.canInteract = true;
      }
    } else {
      this.hint?.setText('');
      this.hint.setVisible(false);
      this.canInteract = false;
    }

    // Sync interaction state to React if it changed
    if (this.isTouchDevice) {
      EventBus.emit("mobile-interact-possible", this.canInteract);
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
    const pressed = Phaser.Input.Keyboard.JustDown(this.keyE) || this.mobileInteractPressed;
    if (pressed) {
      // If dialog is open, let React advance the page (or close on last page)
      if (this.activeDialogNpc) {
        EventBus.emit('npc-dialog-advance', undefined);
        return;
      }
      const target = this.nearestInteractable();
      if (target) {
        target.onInteract();
        return;
      }
      const col = this.nearestCollectible();
      if (col) {
        col.collect();
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

  /** Find the closest interact-type collectible within range. */
  private nearestCollectible(): Collectible | null {
    for (const c of this.collectibles) {
      if (c.isCollected || c.collectibleType !== 'interact') continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        c.sprite.x, c.sprite.y,
      );
      if (dist <= INTERACT_RADIUS) return c;
    }
    return null;
  }

  // ---- collectible spawning -------------------------------------------------

  /**
   * Spawn collectibles from the Tiled Collectibles layer and set up
   * auto-collect overlaps.
   */
  private spawnCollectibles() {
    this.collectibles = spawnCollectibles(this, this.map);

    // 1. Filter for auto-collect sprites and create a single overlap
    const autoSprites = this.collectibles
      .filter((c) => c.collectibleType === 'auto')
      .map((c) => c.sprite);

    if (autoSprites.length > 0) {
      const group = this.physics.add.group(autoSprites);
      this.collectibleOverlap = this.physics.add.overlap(
        this.player,
        group,
        (_player, sprite) => {
          const col = this.collectibles.find(
            (c) => c.sprite === sprite && !c.isCollected,
          );
          if (col) col.collect();
        },
      );
    }

    // 2. Filter for items that should physically block the player
    const solidSprites = this.collectibles
      .filter((c) => c.collides)
      .map((c) => c.sprite);

    if (solidSprites.length > 0) {
      this.physics.add.collider(this.player, solidSprites);
    }
  }

  private checkRetroactiveQuests() {
    for (const def of QUEST_DEFINITIONS) {
      if (questManager.getStatus(def.id) === 'complete') {
        def.onComplete?.(true);
      }
    }
  }
}
