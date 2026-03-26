/**
 * CollectQuestHandler — "collect N items of a given type".
 *
 * Supports two modes:
 *   • **Count-based**: collect any N items of a given type
 *     (set `requiredCount` and leave `requiredIds` undefined).
 *   • **ID-based**: collect specific items by their unique IDs
 *     (set `requiredIds`; `requiredCount` is derived automatically).
 *
 * STATELESS: all progress (collected count / collected IDs) is stored
 * externally in QuestManager and passed in as input.
 *
 * Lifecycle:
 *   1. Player talks to giver NPC        → inactive → active
 *   2. Player collects required items    → active   → done
 *   3. Player returns to giver NPC      → done     → complete
 */

import type { QuestHandler, QuestStatus, QuestUpdate, ItemCollectedInfo } from './types';
import { collectibleState } from '../collectibles/CollectibleState';

export interface CollectQuestConfig {
  /** npcId of the quest giver */
  giverNpcId: string;
  /** Item type string that must match the value passed to onItemCollected */
  itemType: string;
  /** How many items the player must collect (count-based mode) */
  requiredCount?: number;
  /**
   * Specific collectible IDs the player must collect (ID-based mode).
   * When set, `requiredCount` is ignored and derived from this array's length.
   */
  requiredIds?: string[];
}

export class CollectQuestHandler implements QuestHandler {
  readonly type = 'collect' as const;

  private giverNpcId: string;
  private itemType: string;
  private requiredCount: number;
  private requiredIds: string[] | undefined;

  constructor(config: CollectQuestConfig) {
    this.giverNpcId = config.giverNpcId;
    this.itemType = config.itemType;
    this.requiredIds = config.requiredIds;
    this.requiredCount = config.requiredIds
      ? config.requiredIds.length
      : config.requiredCount ?? 0;
  }

  getInitialProgress(): Record<string, unknown> {
    return {
      collected: 0,
      required: this.requiredCount,
      // Track which specific IDs have been collected (always present, but
      // only meaningful in ID-based mode).
      collectedIds: [] as string[],
    };
  }

  onNpcInteract(
    npcId: string,
    status: QuestStatus,
    _progress: Record<string, unknown>,
  ): QuestUpdate | null {
    if (npcId !== this.giverNpcId) return null;

    if (status === 'inactive') {
      // --- retroactive credit for items collected before quest started ------
      if (this.requiredIds) {
        const alreadyCollected = this.requiredIds.filter((id) =>
          collectibleState.isCollected(id),
        );
        const progress = {
          collected: alreadyCollected.length,
          required: this.requiredCount,
          collectedIds: alreadyCollected,
        };
        // All items already picked up → skip straight to 'done'
        if (alreadyCollected.length >= this.requiredCount) {
          return { status: 'done', progress };
        }
        return { status: 'active', progress };
      }
      return { status: 'active' };
    }

    if (status === 'done') return { status: 'complete' };
    return null;
  }

  onItemCollected(
    info: ItemCollectedInfo,
    status: QuestStatus,
    progress: Record<string, unknown>,
  ): QuestUpdate | null {
    if (status !== 'active') return null;
    if (info.itemType !== this.itemType) return null;

    // --- ID-based mode: only accept items whose ID is in the required list ---
    if (this.requiredIds) {
      if (!this.requiredIds.includes(info.collectibleId)) return null;

      const collectedIds = [...((progress.collectedIds as string[]) ?? [])];
      // Don't double-count
      if (collectedIds.includes(info.collectibleId)) return null;

      collectedIds.push(info.collectibleId);
      const collected = collectedIds.length;
      const required = this.requiredCount;

      if (collected >= required) {
        return { status: 'done', progress: { collected, required, collectedIds } };
      }
      return { progress: { collected, required, collectedIds } };
    }

    // --- Count-based mode: accept any item of the matching type --------------
    const collected = (progress.collected as number) + 1;
    const required = progress.required as number;

    if (collected >= required) {
      return { status: 'done', progress: { collected, required } };
    }
    return { progress: { collected, required } };
  }
}
