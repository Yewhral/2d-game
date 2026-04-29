/**
 * Quest system types.
 *
 * Handlers are STATELESS — they receive progress as input and return
 * updates.  All mutable state lives in QuestManager.
 */

// ---- Quest status -----------------------------------------------------------
export type QuestStatus = 'inactive' | 'active' | 'done' | 'complete' | 'failed';

// ---- Quest type -------------------------------------------------------------
export type QuestType = 'talk' | 'collect';

// ---- Item collection info ---------------------------------------------------
/** Passed to handlers when a collectible is picked up. */
export interface ItemCollectedInfo {
  itemType: string;
  collectibleId: string;
}

// ---- Quest update (returned by handlers) ------------------------------------
/**
 * Return type for handler event hooks.
 *
 * - `status`   — set to advance the quest lifecycle.
 * - `progress` — set to update quest-specific runtime data
 *                (e.g. `{ collected: 1 }`).
 *
 * Both fields are optional.  Return `null` from a hook if the event
 * is irrelevant to this quest.
 */
export type QuestUpdate = {
  status?: QuestStatus;
  progress?: Record<string, unknown>;
};

// ---- Quest handler (stateless logic) ----------------------------------------
/**
 * Handlers contain ONLY gameplay logic — no state, no UI strings,
 * no side effects.  They receive the current status + progress and
 * return a QuestUpdate describing what changed.
 *
 * Implement only the event hooks you need; all are optional.
 */
export interface QuestHandler {
  readonly type: QuestType;

  /** Return the initial progress blob when the quest becomes active. */
  getInitialProgress(): Record<string, unknown>;

  // ---- Event hooks (all optional) -------------------------------------------
  onNpcInteract?(
    npcId: string,
    status: QuestStatus,
    progress: Record<string, unknown>,
  ): QuestUpdate | null;

  onItemCollected?(
    info: ItemCollectedInfo,
    status: QuestStatus,
    progress: Record<string, unknown>,
  ): QuestUpdate | null;

  // Future hooks — add as needed:
  // onAreaEntered?(areaId: string, status: QuestStatus, progress: Record<string, unknown>): QuestUpdate | null;
  // onEnemyKilled?(enemyType: string, status: QuestStatus, progress: Record<string, unknown>): QuestUpdate | null;
}

// ---- Dialog templates -------------------------------------------------------
/**
 * Dialog templates keyed by npcId → quest status.
 * Placeholders like `{collected}` are interpolated from progress data
 * by the QuestManager at runtime.
 *
 * Use string[] for multi-page dialogs (one entry per page).
 */
export type QuestDialogs = Record<
  string,
  Partial<Record<QuestStatus, string | string[]>>
>;

// ---- Quest definition (full package) ----------------------------------------
/**
 * A complete quest definition: metadata + stateless handler + dialog config.
 * This is the unit you add to `definitions.ts` when creating a new quest.
 */
export interface QuestDefinition {
  /** Unique quest identifier */
  id: string;
  /** Human-readable title shown in the tracker */
  title: string;
  /** Description for each status of the quest */
  description: Record<'active' | 'done' | 'complete' | 'failed', string>;
  /** Stateless handler containing gameplay logic */
  handler: QuestHandler;
  /** NPC dialog templates, interpolated with progress data */
  dialogs: QuestDialogs;
  /** Optional formatter for the progress badge in the quest tracker */
  formatProgress?: (progress: Record<string, unknown>) => string | null;
  /** Optional callback fired when the quest transitions to 'complete'.
   *  `retroactive` is true when re-applying on map load (skip one-time FX). */
  onComplete?: (retroactive?: boolean) => void;
}
