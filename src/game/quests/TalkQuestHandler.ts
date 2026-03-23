/**
 * TalkQuestHandler — "talk to NPC A, then NPC B, then return to A".
 *
 * STATELESS: receives progress, returns QuestUpdate.
 * No dialog strings — those live in the quest definition.
 *
 * Lifecycle:
 *   1. Player talks to giver  → inactive → active
 *   2. Player talks to target → active   → done
 *   3. Player returns to giver → done    → complete
 */

import type { QuestHandler, QuestStatus, QuestUpdate } from './types';

export interface TalkQuestConfig {
  /** npcId of the quest giver */
  giverNpcId: string;
  /** npcId of the target NPC the player must visit */
  targetNpcId: string;
}

export class TalkQuestHandler implements QuestHandler {
  readonly type = 'talk' as const;

  private giverNpcId: string;
  private targetNpcId: string;

  constructor(config: TalkQuestConfig) {
    this.giverNpcId = config.giverNpcId;
    this.targetNpcId = config.targetNpcId;
  }

  getInitialProgress(): Record<string, unknown> {
    return {};
  }

  onNpcInteract(
    npcId: string,
    status: QuestStatus,
    _progress: Record<string, unknown>,
  ): QuestUpdate | null {
    // Giver: start the quest, or accept the hand-in
    if (npcId === this.giverNpcId) {
      if (status === 'inactive') return { status: 'active' };
      if (status === 'done') return { status: 'complete' };
    }
    // Target: fulfill the objective
    if (npcId === this.targetNpcId) {
      if (status === 'active') return { status: 'done' };
    }
    return null;
  }
}
