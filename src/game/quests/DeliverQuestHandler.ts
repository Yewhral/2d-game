/**
 * DeliverQuestHandler — "collect specific items and bring them one by one to
 * the quest giver NPC".
 *
 * Unlike CollectQuestHandler (which auto-transitions to 'done' when all items
 * are collected), this handler advances progress each time the player interacts
 * with the giver NPC while carrying one of the required items.  The quest
 * remains 'active' until every item has been delivered.
 *
 * Designed for quests where:
 *  • The player may return multiple times with partial deliveries.
 *  • Each delivery should trigger a world-state side effect.
 *  • A future third (or more) artifact can be added by extending `items`.
 *
 * STATELESS: all progress is stored externally in QuestManager and passed in.
 *
 * Lifecycle:
 *   1. Player talks to giver NPC              → inactive → active
 *   2. Player collects an item, returns, talks → active   (partial progress)
 *   3. All items delivered on the last return  → active   → complete
 *
 * Progress shape:
 *   {
 *     delivered:    number,      // how many items have been delivered so far
 *     required:     number,      // total items required
 *     deliveredIds: string[],    // item IDs already handed in
 *   }
 */

import type { QuestHandler, QuestStatus, QuestUpdate, ItemCollectedInfo } from './types';
import { inventory } from '../inventory';

export interface DeliverItem {
  /**
   * The inventory item type key (must match the item's `itemType` in the
   * ITEM_REGISTRY and collectEffects).
   */
  itemType: string;
  /**
   * Optional callback fired the first time this particular item is delivered
   * to the quest giver.  Use this for per-delivery worldState mutations or
   * visual effects.
   */
  onDelivered?: () => void;
}

export interface DeliverQuestConfig {
  /** npcId of the quest giver who accepts the deliveries */
  giverNpcId: string;
  /** Ordered list of items the player must deliver (order of delivery is free) */
  items: DeliverItem[];
}

export class DeliverQuestHandler implements QuestHandler {
  readonly type = 'deliver' as const;

  private giverNpcId: string;
  private items: DeliverItem[];

  constructor(config: DeliverQuestConfig) {
    this.giverNpcId = config.giverNpcId;
    this.items = config.items;
  }

  getInitialProgress(): Record<string, unknown> {
    return {
      delivered: 0,
      required: this.items.length,
      deliveredIds: [] as string[],
    };
  }

  onNpcInteract(
    npcId: string,
    status: QuestStatus,
    progress: Record<string, unknown>,
  ): QuestUpdate | null {
    if (npcId !== this.giverNpcId) return null;

    // ── Activate the quest ─────────────────────────────────────────────────
    if (status === 'inactive') {
      return { status: 'active' };
    }

    // ── Try to accept a delivery ────────────────────────────────────────────
    if (status === 'active') {
      const deliveredIds = [...((progress.deliveredIds as string[]) ?? [])];

      // Find the first item the player currently carries that hasn't been
      // delivered yet.
      const item = this.items.find(
        (i) => !deliveredIds.includes(i.itemType) && inventory.get(i.itemType) > 0,
      );

      if (!item) return null; // nothing to hand in right now

      // Remove one from inventory and record the delivery
      inventory.remove(item.itemType, 1);
      deliveredIds.push(item.itemType);
      item.onDelivered?.();

      const delivered = deliveredIds.length;
      const required = this.items.length;
      const newProgress = { delivered, required, deliveredIds };

      if (delivered >= required) {
        return { status: 'complete', progress: newProgress };
      }

      return { progress: newProgress };
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onItemCollected(
    _info: ItemCollectedInfo,
    _status: QuestStatus,
    _progress: Record<string, unknown>,
  ): QuestUpdate | null {
    // Items are tracked via inventory; no per-collect quest update needed.
    return null;
  }
}
