/**
 * CollectibleState — global persistence for collected items.
 *
 * This is the single source of truth for which collectibles have been
 * picked up.  It is independent of Phaser scenes —- once an item is
 * marked collected it stays collected even if the player re-enters
 * the map.
 *
 * For money-type collectibles, it also tracks the total value accrued.
 */

class CollectibleState {
  private collected: Set<string> = new Set();
  private money = 0;

  // ---- queries ----------------------------------------------------------------

  isCollected(id: string): boolean {
    return this.collected.has(id);
  }

  getMoney(): number {
    return this.money;
  }

  getCollectedIds(): string[] {
    return Array.from(this.collected);
  }

  // ---- mutations ---------------------------------------------------------------

  markCollected(id: string): void {
    this.collected.add(id);
  }

  addMoney(amount: number): void {
    this.money += amount;
  }

  /**
   * Reset all collectible state (e.g. on game restart).
   */
  reset(): void {
    this.collected.clear();
    this.money = 0;
  }
}

// Singleton — imported by scenes, collectible helpers, etc.
export const collectibleState = new CollectibleState();
