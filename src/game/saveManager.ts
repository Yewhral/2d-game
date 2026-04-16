/**
 * SaveManager — handles serialization/deserialization of game state
 * to/from localStorage.
 *
 * Saved state includes:
 *  - Current map key
 *  - Player position
 *  - Inventory
 *  - WorldState (structures, hidden/shown layers)
 *  - CollectibleState (collected set + money)
 *  - Quest states + progress
 */

import { inventory } from './inventory';
import { worldState } from './worldState';
import { collectibleState } from './collectibles/CollectibleState';
import { questManager } from './quests/QuestManager';

const SAVE_KEY = '2d-game-save';

export interface SaveData {
  version: 1;
  timestamp: number;
  mapKey: string;
  playerX: number;
  playerY: number;
  inventory: Record<string, number>;
  worldState: Record<string, string>;
  collectibles: {
    collected: string[];
    money: number;
  };
  quests: {
    states: Record<string, string>;
    progress: Record<string, Record<string, unknown>>;
  };
}

export const saveManager = {
  /** Check if a save file exists in localStorage. */
  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  },

  /** Save the current game state. */
  save(mapKey: string, playerX: number, playerY: number): void {
    const data: SaveData = {
      version: 1,
      timestamp: Date.now(),
      mapKey,
      playerX,
      playerY,
      inventory: { ...inventory.items },
      worldState: { ...worldState.structures },
      collectibles: {
        collected: collectibleState.getCollectedIds(),
        money: collectibleState.getMoney(),
      },
      quests: questManager.serialize(),
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  },

  /** Load the saved game state, or null if none exists. */
  load(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    try {
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== 1) return null;
      return data;
    } catch {
      return null;
    }
  },

  /** Apply a loaded save to all game singletons. */
  apply(data: SaveData): void {
    // Restore inventory
    inventory.reset();
    for (const [key, count] of Object.entries(data.inventory)) {
      inventory.add(key, count);
    }

    // Restore worldState
    worldState.reset();
    for (const [key, value] of Object.entries(data.worldState)) {
      worldState.set(key, value);
    }

    // Restore collectibles
    collectibleState.reset();
    for (const id of data.collectibles.collected) {
      collectibleState.markCollected(id);
    }
    collectibleState.addMoney(data.collectibles.money);

    // Restore quests
    questManager.deserialize(data.quests);
  },

  /** Delete the save file. */
  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  },

  /** Reset all game state to initial values (for New Game). */
  resetAll(): void {
    inventory.reset();
    worldState.reset();
    collectibleState.reset();
    questManager.reset();
  },
};
