/**
 * Inventory — singleton for tracking items the player is carrying.
 *
 * Items are tracked by type (e.g. 'log') with a simple count.
 * Quests that consume items should deduct from inventory on completion.
 */

export const inventory = {
  items: {} as Record<string, number>,

  /** Add `count` items of the given type. */
  add(itemType: string, count = 1) {
    this.items[itemType] = (this.items[itemType] ?? 0) + count;
  },

  /** Remove up to `count` items; never goes below 0. */
  remove(itemType: string, count = 1) {
    const current = this.items[itemType] ?? 0;
    this.items[itemType] = Math.max(0, current - count);
  },

  /** Get the current count of an item type. */
  get(itemType: string): number {
    return this.items[itemType] ?? 0;
  },

  /** Reset all items (e.g. on new game). */
  reset() {
    this.items = {};
  },
};
