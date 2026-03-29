/**
 * QuestManager — the single owner of all quest runtime state.
 *
 * Handlers are stateless functions that receive (status, progress) and
 * return a QuestUpdate.  The manager:
 *   • stores quest status + progress
 *   • routes game events to handlers
 *   • applies returned updates
 *   • interpolates dialog templates with progress data
 *   • emits EventBus events for the HUD
 */

import { EventBus } from '../EventBus';
import type { QuestDefinition, QuestStatus, QuestUpdate, ItemCollectedInfo } from './types';
import { QUEST_DEFINITIONS } from './definitions';

class QuestManager {
  private definitions: Map<string, QuestDefinition> = new Map();
  private states: Map<string, QuestStatus> = new Map();
  private progressMap: Map<string, Record<string, unknown>> = new Map();

  constructor(definitions: QuestDefinition[]) {
    for (const def of definitions) {
      this.definitions.set(def.id, def);
      this.states.set(def.id, 'inactive');
      this.progressMap.set(def.id, {});
    }
  }

  // ---- Queries --------------------------------------------------------------

  getStatus(questId: string): QuestStatus {
    return this.states.get(questId) ?? 'inactive';
  }

  getProgress(questId: string): Record<string, unknown> {
    return this.progressMap.get(questId) ?? {};
  }

  getActiveQuests(): Array<{ id: string; title: string; status: QuestStatus }> {
    const result: Array<{ id: string; title: string; status: QuestStatus }> = [];
    for (const [id, def] of this.definitions) {
      const status = this.getStatus(id);
      if (status === 'active' || status === 'done') {
        result.push({ id, title: def.title, status });
      }
    }
    return result;
  }

  // ---- NPC dialog -----------------------------------------------------------

  /**
   * Get quest-aware dialog for an NPC.
   *
   * Looks up dialog templates from quest definitions, interpolates
   * `{key}` placeholders with progress data.
   *
   * Priority: active/done > inactive > complete.
   */
  getNpcDialog(npcId: string): string | null {
    let inactiveDialog: string | null = null;
    let completeDialog: string | null = null;

    for (const [id, def] of this.definitions) {
      const status = this.getStatus(id);
      const npcDialogs = def.dialogs[npcId];
      if (!npcDialogs) continue;

      const template = npcDialogs[status] ?? null;
      if (!template) continue;

      const progress = this.getProgress(id);
      const resolved = this.interpolate(template, progress);

      if (status === 'active' || status === 'done') return resolved;
      if (status === 'inactive' && inactiveDialog === null) inactiveDialog = resolved;
      if (status === 'complete' && completeDialog === null) completeDialog = resolved;
    }

    return inactiveDialog ?? completeDialog ?? null;
  }

  // ---- Event routing --------------------------------------------------------

  handleNpcInteract(npcId: string): void {
    for (const [id, def] of this.definitions) {
      if (!def.handler.onNpcInteract) continue;
      const status = this.getStatus(id);
      const progress = this.getProgress(id);
      const update = def.handler.onNpcInteract(npcId, status, progress);
      if (update) this.applyUpdate(id, update);
    }
  }

  handleItemCollected(info: ItemCollectedInfo): void {
    for (const [id, def] of this.definitions) {
      if (!def.handler.onItemCollected) continue;
      const status = this.getStatus(id);
      const progress = this.getProgress(id);
      const update = def.handler.onItemCollected(info, status, progress);
      if (update) this.applyUpdate(id, update);
    }
  }

  // ---- Lifecycle ------------------------------------------------------------

  reset(): void {
    for (const [id] of this.definitions) {
      this.states.set(id, 'inactive');
      this.progressMap.set(id, {});
    }
  }

  // ---- Internals ------------------------------------------------------------

  /**
   * Apply a QuestUpdate returned by a handler.
   *
   * If the quest transitions to 'active', its initial progress is seeded
   * from the handler's `getInitialProgress()`.
   */
  private applyUpdate(questId: string, update: QuestUpdate): void {
    const def = this.definitions.get(questId);
    if (!def) return;

    const oldStatus = this.getStatus(questId);
    let progressChanged = false;

    // Merge progress updates
    if (update.progress) {
      const current = this.getProgress(questId);
      this.progressMap.set(questId, { ...current, ...update.progress });
      progressChanged = true;
    }

    // Apply status transition
    if (update.status && update.status !== oldStatus) {
      // Seed initial progress when quest becomes active
      if (update.status === 'active' && oldStatus === 'inactive') {
        const initial = def.handler.getInitialProgress();
        const merged = { ...initial, ...(update.progress ?? {}) };
        this.progressMap.set(questId, merged);
      }

      this.states.set(questId, update.status);
      this.emitStatusChange(questId, update.status);

      if (update.status === 'complete' && def.onComplete) {
        def.onComplete(false);
      }
    } else if (progressChanged) {
      // Progress changed but status didn't — emit progress notification
      this.emitProgressUpdate(questId);
    }
  }

  private emitStatusChange(questId: string, status: QuestStatus): void {
    const def = this.definitions.get(questId);
    const progress = this.getProgress(questId);
    const progressStr = def?.formatProgress?.(progress) ?? undefined;

    let message = '';
    switch (status) {
      case 'active':
        message = `New quest: ${def?.title}`;
        break;
      case 'done':
        message = `Quest updated: ${def?.title}`;
        break;
      case 'complete':
        message = `Quest complete: ${def?.title}`;
        break;
    }

    EventBus.emit('quest-updated', {
      questId,
      status,
      title: def?.title ?? questId,
      message,
      progress: progressStr,
    });
  }

  private emitProgressUpdate(questId: string): void {
    const def = this.definitions.get(questId);
    const status = this.getStatus(questId);
    const progress = this.getProgress(questId);
    const progressStr = def?.formatProgress?.(progress) ?? undefined;

    EventBus.emit('quest-updated', {
      questId,
      status,
      title: def?.title ?? questId,
      message: progressStr
        ? `${def?.title}: ${progressStr}`
        : `${def?.title}`,
      progress: progressStr,
    });
  }

  /** Replace `{key}` placeholders in a template with progress values. */
  private interpolate(
    template: string,
    progress: Record<string, unknown>,
  ): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) => {
      return progress[key] !== undefined ? String(progress[key]) : match;
    });
  }
}

// Singleton
export const questManager = new QuestManager(QUEST_DEFINITIONS);
