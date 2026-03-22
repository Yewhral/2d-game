/**
 * QuestManager — thin orchestrator for the quest system.
 *
 * It knows nothing about specific quest *types* — all type-specific logic
 * lives in QuestHandler implementations (TalkQuestHandler, etc.).
 *
 * Responsibilities:
 *   • Store quest state (inactive / active / done / complete)
 *   • Delegate to handlers for dialog & state-transition decisions
 *   • Emit EventBus events so the React HUD can react
 *
 * Usage from GameScene:
 *   const dialog = questManager.getNpcDialog(npcId);   // before showing text
 *   questManager.handleNpcInteract(npcId);              // after text resolved
 *   questManager.handleItemCollected('chest');           // when an item is picked up
 */

import { EventBus } from '../EventBus';
import type { QuestHandler, QuestStatus } from './types';
import { QUEST_DEFINITIONS } from './definitions';

class QuestManager {
  private handlers: Map<string, QuestHandler> = new Map();
  private states: Map<string, QuestStatus> = new Map();

  constructor(definitions: QuestHandler[]) {
    for (const handler of definitions) {
      this.handlers.set(handler.id, handler);
      this.states.set(handler.id, 'inactive');
    }
  }

  // ---- queries --------------------------------------------------------------

  /** Current status for a quest id. Returns 'inactive' for unknown ids. */
  getStatus(questId: string): QuestStatus {
    return this.states.get(questId) ?? 'inactive';
  }

  /** All quests that should appear in the tracker (active or done). */
  getActiveQuests(): Array<{ id: string; title: string; status: QuestStatus }> {
    const result: Array<{ id: string; title: string; status: QuestStatus }> = [];
    for (const [id, handler] of this.handlers) {
      const status = this.getStatus(id);
      if (status === 'active' || status === 'done') {
        result.push({ id, title: handler.title, status });
      }
    }
    return result;
  }

  // ---- NPC integration (called by GameScene) --------------------------------

  /**
   * Get quest-aware dialog for an NPC.
   *
   * Priority: active/done quests first (in-progress), then inactive
   * (new quests to discover), then complete (past quests).
   * Returns `null` if no quest has dialog for this NPC.
   */
  getNpcDialog(npcId: string): string | null {
    let inactiveDialog: string | null = null;
    let completeDialog: string | null = null;

    for (const [id, handler] of this.handlers) {
      const status = this.getStatus(id);
      const dialog = handler.getDialogForNpc(npcId, status);
      if (dialog === null) continue;

      // Active / done quests take highest priority
      if (status === 'active' || status === 'done') return dialog;
      // Remember first inactive match as fallback
      if (status === 'inactive' && inactiveDialog === null) inactiveDialog = dialog;
      // Remember first complete match as last resort
      if (status === 'complete' && completeDialog === null) completeDialog = dialog;
    }

    return inactiveDialog ?? completeDialog ?? null;
  }

  /**
   * Notify the quest system that the player interacted with an NPC.
   */
  handleNpcInteract(npcId: string): void {
    for (const [id, handler] of this.handlers) {
      const currentStatus = this.getStatus(id);
      const newStatus = handler.onNpcInteract(npcId, currentStatus);
      if (newStatus && newStatus !== currentStatus) {
        this.setState(id, newStatus);
      }
    }
  }

  // ---- Item collection (called by GameScene) --------------------------------

  /**
   * Notify the quest system that the player collected an item.
   *
   * Handlers that implement `onItemCollected` will be checked.
   * If the quest state doesn't change but the handler has progress info,
   * a progress notification is emitted for the HUD.
   */
  handleItemCollected(itemType: string): void {
    for (const [id, handler] of this.handlers) {
      if (!handler.onItemCollected) continue;
      const currentStatus = this.getStatus(id);
      const newStatus = handler.onItemCollected(itemType, currentStatus);

      if (newStatus && newStatus !== currentStatus) {
        // Quest state changed (e.g. reached required count)
        this.setState(id, newStatus);
      } else if (currentStatus === 'active') {
        // Progress but no state change — emit a progress notification
        const progress = handler.getProgress?.() ?? null;
        if (progress) {
          EventBus.emit('quest-updated', {
            questId: id,
            status: currentStatus,
            title: handler.title,
            message: `${handler.title}: ${progress}`,
            progress,
          });
        }
      }
    }
  }

  // ---- lifecycle ------------------------------------------------------------

  /** Reset every quest back to inactive (e.g. on game restart). */
  reset(): void {
    for (const [id, handler] of this.handlers) {
      this.states.set(id, 'inactive');
      handler.reset?.();
    }
  }

  // ---- internals ------------------------------------------------------------

  private setState(questId: string, status: QuestStatus): void {
    this.states.set(questId, status);
    const handler = this.handlers.get(questId);
    const progress = handler?.getProgress?.() ?? undefined;

    let message = '';
    switch (status) {
      case 'active':
        message = `New quest: ${handler?.title}`;
        break;
      case 'done':
        message = `Quest updated: ${handler?.title}`;
        break;
      case 'complete':
        message = `Quest complete: ${handler?.title}`;
        break;
    }

    EventBus.emit('quest-updated', {
      questId,
      status,
      title: handler?.title ?? questId,
      message,
      progress,
    });
  }
}

// Singleton
export const questManager = new QuestManager(QUEST_DEFINITIONS);
