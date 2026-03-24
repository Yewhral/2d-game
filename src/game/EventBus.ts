/**
 * EventBus — the single channel for Phaser ↔ React communication.
 *
 * Phaser scenes emit events here; React components subscribe via
 * the `useGameEvent` hook (see hooks/useGameEvent.ts).
 *
 * Usage in a Phaser scene:
 *   import { EventBus } from "@/game/EventBus";
 *   EventBus.emit("player-health-changed", { current: 80, max: 100 });
 *
 * Usage in React:
 *   import { useGameEvent } from "@/hooks/useGameEvent";
 *   useGameEvent("player-health-changed", ({ current, max }) => { ... });
 */

import mitt from "mitt";
import type { Emitter } from "mitt";

// ---------------------------------------------------------------------------
// Event map — add every event your game emits here.
// Keys are event names, values are the payload type.
// ---------------------------------------------------------------------------
export type GameEvents = {
  /** Fired once when Phaser is fully ready and the first scene is active. */
  "game-ready": { scene: string };

  /** Fired whenever the player's HP changes. */
  "player-health-changed": { current: number; max: number };

  /** Fired whenever the score changes. */
  "score-changed": { score: number };

  /** Fired when the current scene name changes. */
  "scene-changed": { scene: string };

  /** React → Phaser: request to restart the current scene. */
  "ui:restart-scene": undefined;

  /** React → Phaser: toggle pause state. */
  "ui:toggle-pause": undefined;

  /** Phaser → React: an NPC started/stopped speaking. */
  "npc-dialog": { npc: string; text: string; portrait: string } | null;

  /** Phaser → React: a quest state changed. */
  "quest-updated": {
    questId: string;
    status: 'inactive' | 'active' | 'done' | 'complete';
    title: string;
    message: string;
    /** Optional progress string, e.g. "1 / 2" */
    progress?: string;
  };

  /** Phaser → React: the player's money total changed. */
  "money-changed": { money: number };
};

export const EventBus: Emitter<GameEvents> = mitt<GameEvents>();
