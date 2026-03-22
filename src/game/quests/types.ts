/**
 * Quest system types.
 *
 * QuestStatus defines the lifecycle every quest goes through.
 * QuestHandler is the interface that each quest *type* implements
 * (TalkQuestHandler, CollectQuestHandler, etc.).
 */

// ---- Quest status -----------------------------------------------------------
export type QuestStatus = 'inactive' | 'active' | 'done' | 'complete';

// ---- Quest type -------------------------------------------------------------
export type QuestType = 'talk' | 'collect';

// ---- Quest handler interface ------------------------------------------------
export interface QuestHandler {
  /** Unique quest identifier */
  readonly id: string;
  /** Human-readable title shown in the tracker */
  readonly title: string;
  /** Longer description (for journal / tooltip) */
  readonly description: string;
  /** Quest type — must be a registered QuestType */
  readonly type: QuestType;

  /**
   * Return quest-specific dialog for an NPC, or `null` to fall through
   * to the NPC's default text.
   *
   * Called *before* `onNpcInteract`, so it sees the status *prior* to
   * any state change on this interaction.
   */
  getDialogForNpc(npcId: string, status: QuestStatus): string | null;

  /**
   * Called when the player interacts with an NPC.
   * Return the new QuestStatus if this interaction should advance the
   * quest, or `null` if no change should occur.
   */
  onNpcInteract(npcId: string, currentStatus: QuestStatus): QuestStatus | null;

  /**
   * Called when the player collects / picks up an item.
   * Return the new QuestStatus if this changes the quest, or `null`.
   * Optional — only implement for collection-type quests.
   */
  onItemCollected?(itemType: string, currentStatus: QuestStatus): QuestStatus | null;

  /**
   * Return a short progress string (e.g. "1 / 2") for display in the
   * quest tracker, or `null` if no progress info is available.
   */
  getProgress?(): string | null;

  /**
   * Reset handler-internal state (e.g. collected counts).
   * Called by QuestManager.reset().
   */
  reset?(): void;
}
