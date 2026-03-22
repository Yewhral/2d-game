/**
 * TalkQuestHandler — "talk to NPC A, then talk to NPC B, then return to A".
 *
 * Lifecycle managed automatically:
 *   1. Player talks to giver  → inactive  → active
 *   2. Player talks to target → active    → done
 *   3. Player returns to giver → done     → complete
 *
 * All dialog text is configured via the `dialogs` map so no quest-specific
 * logic leaks into the NPC registry or the scene.
 */

import type { QuestHandler, QuestStatus } from './types';

export interface TalkQuestConfig {
  id: string;
  title: string;
  description: string;
  /** npcId of the quest giver */
  giverNpcId: string;
  /** npcId of the target NPC the player must visit */
  targetNpcId: string;
  /** Dialog lines keyed by quest status, per NPC role */
  dialogs: {
    giver: Partial<Record<QuestStatus, string>>;
    target: Partial<Record<QuestStatus, string>>;
  };
}

export class TalkQuestHandler implements QuestHandler {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly type = 'talk' as const;

  private giverNpcId: string;
  private targetNpcId: string;
  private dialogs: TalkQuestConfig['dialogs'];

  constructor(config: TalkQuestConfig) {
    this.id = config.id;
    this.title = config.title;
    this.description = config.description;
    this.giverNpcId = config.giverNpcId;
    this.targetNpcId = config.targetNpcId;
    this.dialogs = config.dialogs;
  }

  getDialogForNpc(npcId: string, status: QuestStatus): string | null {
    if (npcId === this.giverNpcId) {
      return this.dialogs.giver[status] ?? null;
    }
    if (npcId === this.targetNpcId) {
      return this.dialogs.target[status] ?? null;
    }
    return null;
  }

  onNpcInteract(npcId: string, currentStatus: QuestStatus): QuestStatus | null {
    // Giver: start the quest, or accept the hand-in
    if (npcId === this.giverNpcId) {
      if (currentStatus === 'inactive') return 'active';
      if (currentStatus === 'done') return 'complete';
    }
    // Target: fulfill the objective
    if (npcId === this.targetNpcId) {
      if (currentStatus === 'active') return 'done';
    }
    return null;
  }
}
