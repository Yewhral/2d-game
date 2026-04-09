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

  /** Phaser → React: an NPC started/stopped speaking. */
  "npc-dialog": { npc: string; text: string; portrait?: string; theme?: string } | null;

  /** Phaser → React: a quest state changed. */
  "quest-updated": {
    questId: string;
    status: 'inactive' | 'active' | 'done' | 'complete';
    title: string;
    description?: string;
    message: string;
    /** Optional progress string, e.g. "1 / 2" */
    progress?: string;
  };

  /** Phaser → React: the player's money total changed. */
  "money-changed": { money: number };

  /** Phaser → React: a wood log was collected. */
  "wood-collected": { id: string; itemType: string };

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
};

export const EventBus: Emitter<GameEvents> = mitt<GameEvents>();
