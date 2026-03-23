/**
 * CollectQuestHandler — "collect N items of a given type".
 *
 * STATELESS: all progress (collected count) is stored externally in
 * QuestManager and passed in as input.  The handler only decides
 * what the updated progress/status should be.
 *
 * Lifecycle:
 *   1. Player talks to giver NPC        → inactive → active
 *   2. Player collects required items    → active   → done
 *   3. Player returns to giver NPC      → done     → complete
 */

import type { QuestHandler, QuestStatus, QuestUpdate } from './types';

export interface CollectQuestConfig {
  /** npcId of the quest giver */
  giverNpcId: string;
  /** Item type string that must match the value passed to onItemCollected */
  itemType: string;
  /** How many items the player must collect */
  requiredCount: number;
}

export class CollectQuestHandler implements QuestHandler {
  readonly type = 'collect' as const;

  private giverNpcId: string;
  private itemType: string;
  private requiredCount: number;

  constructor(config: CollectQuestConfig) {
    this.giverNpcId = config.giverNpcId;
    this.itemType = config.itemType;
    this.requiredCount = config.requiredCount;
  }

  getInitialProgress(): Record<string, unknown> {
    return { collected: 0, required: this.requiredCount };
  }

  onNpcInteract(
    npcId: string,
    status: QuestStatus,
    _progress: Record<string, unknown>,
  ): QuestUpdate | null {
    if (npcId !== this.giverNpcId) return null;
    if (status === 'inactive') return { status: 'active' };
    if (status === 'done') return { status: 'complete' };
    return null;
  }

  onItemCollected(
    itemType: string,
    status: QuestStatus,
    progress: Record<string, unknown>,
  ): QuestUpdate | null {
    if (status !== 'active') return null;
    if (itemType !== this.itemType) return null;

    const collected = (progress.collected as number) + 1;
    const required = progress.required as number;

    if (collected >= required) {
      return { status: 'done', progress: { collected, required } };
    }
    return { progress: { collected, required } };
  }
}
