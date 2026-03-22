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
   * Iterates all registered handlers; the first one that returns non-null
   * text wins.  Returns `null` if no quest has anything to say for this NPC,
   * so the caller can fall back to the NPC's default text.
   */
  getNpcDialog(npcId: string): string | null {
    for (const [id, handler] of this.handlers) {
      const status = this.getStatus(id);
      const dialog = handler.getDialogForNpc(npcId, status);
      if (dialog !== null) return dialog;
    }
    return null;
  }

  /**
   * Notify the quest system that the player interacted with an NPC.
   *
   * Each handler decides independently whether this interaction should
   * advance its quest.  Call this *after* resolving dialog text so the
   * player sees the pre-transition message.
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

  // ---- lifecycle ------------------------------------------------------------

  /** Reset every quest back to inactive (e.g. on game restart). */
  reset(): void {
    for (const id of this.handlers.keys()) {
      this.states.set(id, 'inactive');
    }
  }

  // ---- internals ------------------------------------------------------------

  private setState(questId: string, status: QuestStatus): void {
    this.states.set(questId, status);
    const handler = this.handlers.get(questId);

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
    });
  }
}

// Singleton
export const questManager = new QuestManager(QUEST_DEFINITIONS);
