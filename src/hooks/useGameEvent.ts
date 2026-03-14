/**
 * useGameEvent — subscribes to a typed EventBus event inside a React component.
 *
 * The handler is automatically removed when the component unmounts or when
 * `eventName` / `handler` reference changes.
 *
 * @example
 * useGameEvent("score-changed", ({ score }) => setScore(score));
 */

import { EventBus } from "@/game/EventBus";
import type { GameEvents } from "@/game/EventBus";
import type { Handler } from "mitt";
import { useEffect } from "react";

export function useGameEvent<K extends keyof GameEvents>(
  eventName: K,
  handler: (payload: GameEvents[K]) => void,
) {
  useEffect(() => {
    // Cast through unknown to satisfy mitt's strict generic overloads while
    // keeping the public API fully typed at the call site.
    EventBus.on(eventName, handler as unknown as Handler<GameEvents[K]>);
    return () => {
      EventBus.off(eventName, handler as unknown as Handler<GameEvents[K]>);
    };
  }, [eventName, handler]);
}
