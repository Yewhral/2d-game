/**
 * Collectible — a single collectible item in the world.
 *
 * Wraps a Phaser physics sprite with collectible metadata (`id`,
 * `itemType`, `collectibleType`).  Handles the two collection modes:
 *
 *   • "auto"     – collected automatically on overlap with the player
 *   • "interact" – collected only when the player presses E while in range
 *
 * The actual collect side-effects (marking state, notifying quests,
 * destroying the sprite) are handled by the `onCollect` callback
 * passed in at construction time, keeping this class reusable and
 * free of hardcoded game logic.
 */

import Phaser from 'phaser';

export type CollectibleType = 'auto' | 'interact';

export interface CollectibleConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  /** Unique persistent ID (survives scene restarts) */
  id: string;
  /** Semantic type, e.g. "money", "chest" */
  itemType: string;
  /** How the item is collected */
  collectibleType: CollectibleType;
  /** Sprite texture key */
  textureKey: string;
  /** Optional sprite frame */
  frame?: number;
  /** Scale applied to the sprite (default 1) */
  scale?: number;
  /** Extra data bag (e.g. { value: 10 } for money) */
  extra?: Record<string, unknown>;
  /** Callback invoked when the item is collected */
  onCollect: (collectible: Collectible) => void;
}

export class Collectible {
  readonly id: string;
  readonly itemType: string;
  readonly collectibleType: CollectibleType;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly extra: Record<string, unknown>;

  private _collected = false;
  private onCollect: (collectible: Collectible) => void;

  constructor(config: CollectibleConfig) {
    this.id = config.id;
    this.itemType = config.itemType;
    this.collectibleType = config.collectibleType;
    this.extra = config.extra ?? {};
    this.onCollect = config.onCollect;

    // ---- sprite ----------------------------------------------------------
    this.sprite = config.scene.physics.add.sprite(
      config.x,
      config.y,
      config.textureKey,
      config.frame,
    );
    this.sprite.setScale(config.scale ?? 1);
    this.sprite.setDepth(config.y);
    this.sprite.setImmovable(true);

    // Smaller hitbox so the player must get close
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(
      this.sprite.width * 0.5,
      this.sprite.height * 0.5,
    );
    body.setOffset(
      this.sprite.width * 0.25,
      this.sprite.height * 0.25,
    );

    // Idle bob tween for visual polish
    config.scene.tweens.add({
      targets: this.sprite,
      y: config.y - 4,
      duration: 800,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });
  }

  // ---- public API --------------------------------------------------------

  get isCollected(): boolean {
    return this._collected;
  }

  /**
   * Call this to collect the item.  Safe to call multiple times —
   * only the first call has any effect.
   */
  collect(): void {
    if (this._collected) return;
    this._collected = true;
    this.onCollect(this);
  }

  /** Destroy the underlying sprite (called after collect animation). */
  destroySprite(): void {
    this.sprite.destroy();
  }
}
