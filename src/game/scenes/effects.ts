/**
 * FX Registry — defines visual effects that can be spawned via EventBus.
 *
 * Usage:
 *   EventBus.emit("fx:spawn", { type: "build_smoke", x: 400, y: 300 });
 */

export const FX_REGISTRY: Record<
  string,
  {
    spriteKey: string;
    animKey: string;
    scale: number;
    depthOffset: number;
  }
> = {
  build_smoke: {
    spriteKey: 'dust2',
    animKey: 'anim-dust2',
    scale: 2,
    depthOffset: 20,
  },
};
