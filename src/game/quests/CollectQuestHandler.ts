/**
 * CollectQuestHandler — "collect N items of a given type".
 *
 * Lifecycle:
 *   1. Player talks to giver NPC        → inactive → active
 *   2. Player collects required items    → active   → done  (auto when count reached)
 *   3. Player returns to giver NPC      → done     → complete
 *
 * Dialog strings may contain `{collected}` and `{required}` placeholders
 * which are replaced with the current progress values at runtime.
 */

import type { QuestHandler, QuestStatus } from './types';

export interface CollectQuestConfig {
  id: string;
  title: string;
  description: string;
  /** npcId of the quest giver */
  giverNpcId: string;
  /** Item type string that must match the value passed to onItemCollected */
  itemType: string;
  /** How many items the player must collect */
  requiredCount: number;
  /** Dialog lines keyed by quest status for the giver NPC */
  dialogs: {
    giver: Partial<Record<QuestStatus, string>>;
  };
}

export class CollectQuestHandler implements QuestHandler {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly type = 'collect' as const;

  private giverNpcId: string;
  private itemType: string;
  private requiredCount: number;
  private collectedCount = 0;
  private dialogs: CollectQuestConfig['dialogs'];

  constructor(config: CollectQuestConfig) {
    this.id = config.id;
    this.title = config.title;
    this.description = config.description;
    this.giverNpcId = config.giverNpcId;
    this.itemType = config.itemType;
    this.requiredCount = config.requiredCount;
    this.dialogs = config.dialogs;
  }

  // ---- QuestHandler required methods ----------------------------------------

  getDialogForNpc(npcId: string, status: QuestStatus): string | null {
    if (npcId !== this.giverNpcId) return null;
    const template = this.dialogs.giver[status] ?? null;
    if (!template) return null;
    return this.interpolate(template);
  }

  onNpcInteract(npcId: string, currentStatus: QuestStatus): QuestStatus | null {
    if (npcId !== this.giverNpcId) return null;
    // Accept the quest
    if (currentStatus === 'inactive') return 'active';
    // Hand in the completed quest
    if (currentStatus === 'done') return 'complete';
    return null;
  }

  // ---- QuestHandler optional methods ----------------------------------------

  onItemCollected(itemType: string, currentStatus: QuestStatus): QuestStatus | null {
    if (currentStatus !== 'active') return null;
    if (itemType !== this.itemType) return null;
    this.collectedCount++;
    if (this.collectedCount >= this.requiredCount) return 'done';
    return null; // progress but not done yet
  }

  getProgress(): string | null {
    return `${this.collectedCount} / ${this.requiredCount}`;
  }

  reset(): void {
    this.collectedCount = 0;
  }

  // ---- internal -------------------------------------------------------------

  /** Replace `{collected}` and `{required}` placeholders in a dialog string. */
  private interpolate(template: string): string {
    return template
      .replace(/\{collected\}/g, String(this.collectedCount))
      .replace(/\{required\}/g, String(this.requiredCount));
  }
}
