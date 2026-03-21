/**
 * QuestManager — manages quest state across the game.
 *
 * Quest lifecycle:
 *   1. 'inactive'  — quest hasn't been discovered yet
 *   2. 'active'    — player accepted the quest (added to quest list)
 *   3. 'done'      — player fulfilled the quest objective (e.g. talked to target NPC)
 *   4. 'complete'  — player returned to quest giver to hand in the quest
 *
 * Usage:
 *   import { questManager } from './QuestManager';
 *   questManager.activateQuest('talk-to-stranger');
 */

import { EventBus } from './EventBus';

// ---- Quest status enum -----------------------------------------------------
export type QuestStatus = 'inactive' | 'active' | 'done' | 'complete';

// ---- Quest definition ------------------------------------------------------
export interface QuestDefinition {
  id: string;
  title: string;
  description: string;
  /** NPC that gives the quest */
  giverNpcId: string;
  /** NPC that fulfills the quest objective */
  targetNpcId: string;
}

// ---- Quest registry --------------------------------------------------------
// Define all quests here. Each quest has a giver NPC and a target NPC.
const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    id: 'talk-to-stranger',
    title: 'The Stranger in the Fields',
    description: 'Find and talk to the mysterious stranger in the eastern fields.',
    giverNpcId: 'purple-warrior',
    targetNpcId: 'purple-warrior2',
  },
];

// ---- Quest Manager class ---------------------------------------------------
class QuestManager {
  private questStates: Map<string, QuestStatus> = new Map();
  private definitions: Map<string, QuestDefinition> = new Map();

  constructor() {
    for (const def of QUEST_DEFINITIONS) {
      this.definitions.set(def.id, def);
      this.questStates.set(def.id, 'inactive');
    }
  }

  /** Get the status of a quest */
  getStatus(questId: string): QuestStatus {
    return this.questStates.get(questId) ?? 'inactive';
  }

  /** Get a quest definition */
  getDefinition(questId: string): QuestDefinition | undefined {
    return this.definitions.get(questId);
  }

  /** Get all quests with their current status */
  getAllQuests(): Array<{ definition: QuestDefinition; status: QuestStatus }> {
    return QUEST_DEFINITIONS.map((def) => ({
      definition: def,
      status: this.getStatus(def.id),
    }));
  }

  /** Get all active (non-inactive, non-complete) quests */
  getActiveQuests(): Array<{ definition: QuestDefinition; status: QuestStatus }> {
    return this.getAllQuests().filter(
      (q) => q.status === 'active' || q.status === 'done',
    );
  }

  /** Activate a quest (inactive → active) */
  activateQuest(questId: string): boolean {
    if (this.getStatus(questId) !== 'inactive') return false;
    this.questStates.set(questId, 'active');
    const def = this.definitions.get(questId);
    EventBus.emit('quest-updated', {
      questId,
      status: 'active',
      title: def?.title ?? questId,
      message: `New quest: ${def?.title ?? questId}`,
    });
    return true;
  }

  /** Mark a quest as done (active → done) — objective fulfilled */
  markDone(questId: string): boolean {
    if (this.getStatus(questId) !== 'active') return false;
    this.questStates.set(questId, 'done');
    const def = this.definitions.get(questId);
    EventBus.emit('quest-updated', {
      questId,
      status: 'done',
      title: def?.title ?? questId,
      message: `Quest updated: ${def?.title ?? questId}`,
    });
    return true;
  }

  /** Complete a quest (done → complete) — handed in to quest giver */
  completeQuest(questId: string): boolean {
    if (this.getStatus(questId) !== 'done') return false;
    this.questStates.set(questId, 'complete');
    const def = this.definitions.get(questId);
    EventBus.emit('quest-updated', {
      questId,
      status: 'complete',
      title: def?.title ?? questId,
      message: `Quest complete: ${def?.title ?? questId}`,
    });
    return true;
  }

  /**
   * Find quests where the given NPC is the giver.
   * Returns the highest-priority actionable quest for that NPC.
   */
  getQuestsForGiver(npcId: string): QuestDefinition[] {
    return QUEST_DEFINITIONS.filter((def) => def.giverNpcId === npcId);
  }

  /**
   * Find quests where the given NPC is the target.
   */
  getQuestsForTarget(npcId: string): QuestDefinition[] {
    return QUEST_DEFINITIONS.filter((def) => def.targetNpcId === npcId);
  }

  /** Reset all quests (e.g. on game restart) */
  reset() {
    for (const def of QUEST_DEFINITIONS) {
      this.questStates.set(def.id, 'inactive');
    }
  }
}

// Singleton instance
export const questManager = new QuestManager();
