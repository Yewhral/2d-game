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
    dialog?: { text: string | string[]; npc?: string; portrait?: string; theme?: string };
    movePlayer?: { x: number; y: number };
    repeatable?: boolean;
    audio?: string;
  }
> = {
  build_smoke: {
    spriteKey: 'dust2',
    animKey: 'anim-dust2',
    scale: 2,
    depthOffset: 20,
    audio: 'woodBlock3',
  },
  shake: {
    shake: { duration: 500, intensity: 0.015 },
    dialog: {
      text: 'Something is happening there, perhaps you shouldn\'t go back.',
      theme: 'red',
      npc: "Narrator"
    },
    audio: 'woodBlock3',
  },
  shakeDuck: {
    shake: { duration: 400, intensity: 0.010 },
    dialog: {
      text: "As the duck looks at you, her eyes become green. You've been accepted.",
      theme: 'red',
      npc: "The Mighty Duck",
      portrait: 'gameAssets/duck.png',
    },
    audio: 'woodBlock3',
  },
  walkBack: {
    shake: { duration: 150, intensity: 0.005 },
    dialog: {
      text: 'Nothing to see there!',
      theme: 'black',
      npc: "Black Guard",
      portrait: 'gameAssets/blackLancerAvatar.png'
    },
    movePlayer: { x: -80, y: 0 },
    repeatable: true,
    audio: 'woodBlock3',
  },
  heal: {
    spriteKey: 'heal',
    animKey: 'anim-heal',
    scale: 0.5,
    depthOffset: 10,
  },
};
