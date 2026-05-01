/**
 * EventBus — the single channel for Phaser ↔ React communication.
 *
 * Phaser scenes emit events here; React components subscribe via
 * the `useGameEvent` hook (see hooks/useGameEvent.ts).
 *
 * Usage in a Phaser scene:
 *   import { EventBus } from "@/game/EventBus";
 *   EventBus.emit("scene-changed", { scene: "MainScene" });
 *
 * Usage in React:
 *   import { useGameEvent } from "@/hooks/useGameEvent";
 *   useGameEvent("scene-changed", ({ scene }) => { ... });
 */

import mitt from "mitt";
import type { Emitter } from "mitt";

// ---------------------------------------------------------------------------
// Event map — add every event your game emits here.
// Keys are event names, values are the payload type.
// ---------------------------------------------------------------------------
export type GameEvents = {
  /** Phaser → React: the entire inventory contents changed. */
  "inventory-changed": { items: Record<string, number> };

  /** Fired when the current scene name changes. */
  "scene-changed": { scene: string };

  /** Phaser → React: an NPC started/stopped speaking.
   *  `text` is always an array — one entry per dialog page. */
  "npc-dialog": { npc: string; text: string[]; portrait?: string; theme?: string } | null;

  /** Phaser → React: player pressed [E] while dialog is open — advance or close. */
  "npc-dialog-advance": undefined;

  /** Phaser → React: a quest state changed. */
  "quest-updated": {
    questId: string;
    status: 'inactive' | 'active' | 'done' | 'complete' | 'failed';
    title: string;
    description?: string;
    message: string;
    /** Optional progress data, e.g. "1 / 2" or sub-task array */
    progress?: any;
    /** If true, don't show a notification toast. */
    silent?: boolean;
  };

  /** Phaser → React: the player's money total changed. */
  "money-changed": { money: number };

  /** Phaser → React: a wood log was collected. */
  "wood-collected": { id: string; itemType: string };

  /** Global event for any item collected. */
  "item-collected": { id: string; itemType: string };

  /** Quest completion: remove specific tiles from a map layer. */
  "quest:remove-tiles": {
    mapKey: string;
    layer: string;
    tileIds: number[];
  };

  "quest:fade-layer": {
    mapKey: string;
    layer: string;
  };

  /** Quest completion: show a previously-hidden tile layer. */
  "quest:show-layer": {
    mapKey: string;
    layer: string;
  };

  /** Trigger a refresh of worldState-controlled decorations. */
  "world:refresh-decorations": undefined;

  /** Spawn a visual effect at a position. */
  "fx:spawn": { type: string; x: number; y: number };

  /** React → Phaser: virtual joystick moved. */
  "mobile-move": { x: number; y: number };

  /** React → Phaser: action button pressed/released. */
  "mobile-interact": boolean;

  /** Phaser → React: notify if interaction is currently possible for UI visibility. */
  "mobile-interact-possible": boolean;

  /** React → Phaser: start a game from the main menu. */
  "menu:start-game": { newGame: boolean };

  /** Phaser → React: asset loading progress (0.0 to 1.0). */
  "loading-progress": { progress: number };
};

export const EventBus: Emitter<GameEvents> = mitt<GameEvents>();
