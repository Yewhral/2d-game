/**
 * spawnCollectibles — reads the "Collectibles" object layer from a Tiled
 * map and creates Collectible instances, skipping any that have already
 * been collected (checked via CollectibleState).
 *
 * Keeps the scene file clean: the scene just calls `spawnCollectibles()`
 * and gets back an array of live Collectible objects to wire up overlaps on.
 */

import Phaser from 'phaser';
import { Collectible } from './Collectible';
import { collectibleState } from './CollectibleState';
import { questManager } from '../quests/QuestManager';
import { EventBus } from '../EventBus';
import { LAYERS } from '../constants';

/** Texture key used for tile-object collectibles (loaded from the tileset). */
const COLLECTIBLE_TEXTURE = 'money-img';

/**
 * Read a custom property value from a Tiled object's property array.
 */
function getProp(
  obj: Phaser.Types.Tilemaps.TiledObject,
  name: string,
): string | undefined {
  const props = obj.properties as
    | Array<{ name: string; value: unknown }>
    | undefined;
  const p = props?.find((prop) => prop.name === name);
  return p ? String(p.value) : undefined;
}

/**
 * Spawn all collectibles from the map's Collectibles layer.
 *
 * @returns An array of `Collectible` instances that were actually spawned
 *          (i.e. not already collected).
 */
export function spawnCollectibles(
  scene: Phaser.Scene,
  map: Phaser.Tilemaps.Tilemap,
): Collectible[] {
  const layer = map.getObjectLayer(LAYERS.COLLECTIBLES);
  if (!layer) return [];

  const spawned: Collectible[] = [];

  for (const obj of layer.objects) {
    if (obj.x == null || obj.y == null) continue;

    const id = getProp(obj, 'id');
    const itemType = getProp(obj, 'type');
    const collectibleType = getProp(obj, 'collectible') as
      | 'auto'
      | 'interact'
      | undefined;

    if (!id || !itemType || !collectibleType) {
      console.warn(
        `Collectible object missing required properties (id, type, collectible) — skipping`,
        obj,
      );
      continue;
    }

    // --- already collected? skip --------------------------------------------
    if (collectibleState.isCollected(id)) continue;

    // --- determine position -------------------------------------------------
    // Tiled tile objects have their y at the *bottom* of the sprite.
    // We need to account for the object's height to get the center.
    const objW = obj.width ?? 0;
    const objH = obj.height ?? 0;
    const cx = obj.x + objW / 2;
    const cy = obj.y - objH / 2;

    // --- extra data ---------------------------------------------------------
    const extra: Record<string, unknown> = {};
    const value = getProp(obj, 'value');
    if (value != null) extra.value = Number(value);

    // --- determine sprite ---------------------------------------------------
    // Tile objects carry a `gid` which references a tile in the tileset.
    // We derive the frame index from the gid.
    let textureKey = COLLECTIBLE_TEXTURE;
    let frame: number | undefined;

    if (obj.gid != null) {
      // Find the tileset this gid belongs to
      for (const ts of map.tilesets) {
        if (obj.gid >= ts.firstgid && obj.gid < ts.firstgid + ts.total) {
          frame = obj.gid - ts.firstgid;
          // Use the tileset's image key if available
          const tsImageKey = (ts as unknown as { key?: string }).key;
          if (tsImageKey) textureKey = tsImageKey;
          break;
        }
      }
    }

    // --- create the Collectible --------------------------------------------
    const collectible = new Collectible({
      scene,
      x: cx,
      y: cy,
      id,
      itemType,
      collectibleType,
      textureKey,
      frame,
      scale: 0.5,
      extra,
      onCollect: (c) => handleCollect(scene, c),
    });

    spawned.push(collectible);
  }

  return spawned;
}

// ---- shared collect logic ---------------------------------------------------

function handleCollect(scene: Phaser.Scene, collectible: Collectible): void {
  // 1. Mark in global state
  collectibleState.markCollected(collectible.id);

  // 2. Money handling
  if (collectible.itemType === 'money') {
    const value = (collectible.extra.value as number) ?? 0;
    collectibleState.addMoney(value);
    EventBus.emit('money-changed', { money: collectibleState.getMoney() });
    showFloatText(scene, collectible.sprite.x, collectible.sprite.y, `+${value} 💰`);
  }

  // 3. Notify quest system
  questManager.handleItemCollected(collectible.itemType);

  // 4. Destroy sprite with a quick scale-down tween
  scene.tweens.add({
    targets: collectible.sprite,
    scaleX: 0,
    scaleY: 0,
    alpha: 0,
    duration: 250,
    ease: 'Back.In',
    onComplete: () => collectible.destroySprite(),
  });
}

function showFloatText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
): void {
  const label = scene.add
    .text(x, y - 16, text, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#fbbf24',
      stroke: '#000',
      strokeThickness: 3,
    })
    .setOrigin(0.5)
    .setDepth(15);

  scene.tweens.add({
    targets: label,
    y: y - 50,
    alpha: 0,
    duration: 800,
    ease: 'Quadratic.Out',
    onComplete: () => label.destroy(),
  });
}
