/**
 * FX Registry — defines visual effects that can be spawned via EventBus.
 *
 * Usage:
 *   EventBus.emit("fx:spawn", { type: "build_smoke", x: 400, y: 300 });
 */

export const FX_REGISTRY: Record<
  string,
  {
    spriteKey?: string;
    animKey?: string;
    scale?: number;
    depthOffset?: number;
    shake?: { duration: number; intensity: number };
    dialog?: { text: string; npc?: string; portrait?: string; theme?: string };
  }
> = {
  build_smoke: {
    spriteKey: 'dust2',
    animKey: 'anim-dust2',
    scale: 2,
    depthOffset: 20,
  },
  shake: {
    shake: { duration: 500, intensity: 0.015 },
    dialog: {
      text: 'Something is happening there, perhaps you shouldn\'t go back.',
      theme: 'red',
      npc: "Narrator"
    },
  },
};
