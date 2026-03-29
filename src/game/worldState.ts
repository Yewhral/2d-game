/**
 * WorldState — singleton for tracking world-level state
 * that affects decoration rendering (e.g., built structures).
 *
 * Decorations with a `worldStateId` in Tiled are only spawned
 * if a matching entry exists here. The state value determines
 * which variant is rendered.
 */

export const worldState = {
  structures: {} as Record<string, string>,

  get(id: string): string | undefined {
    return this.structures[id];
  },

  set(id: string, state: string) {
    this.structures[id] = state;
  },

  reset() {
    this.structures = {};
  },
};
