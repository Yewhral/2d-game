// ---- NPC registry ----------------------------------------------------------
// Maps mapId → npcId → visual + default dialog data.
export type NpcTheme = 'purple' | 'black' | 'blue' | 'red' | 'yellow';

export interface NpcPatrol {
  /** Direction of patrol movement */
  axis: 'x' | 'y';
  /** Total distance the NPC walks in each direction from spawn */
  distance: number;
  /** Movement speed in px/s */
  speed: number;
  /** Pause at each end in ms (default 0) */
  pauseMs?: number;
}

export interface NpcData {
  name: string;
  /** Default text when no quest overrides the dialog */
  text: string;
  spriteKey: string;
  frame: number;
  scale: number;
  bodySize: { width: number; height: number };
  bodyOffset: { x: number; y: number };
  portrait?: string;
  animated?: boolean;
  repeatDelay?: number;
  delay?: number;
  flipX?: boolean;
  theme?: NpcTheme;
  patrol?: NpcPatrol;
}

export const NPC_REGISTRY: Record<string, Record<string, NpcData>> = {
  '16-json': {
    'purple-warrior': {
      name: 'Purple Warrior',
      text: 'Hey there, traveler.',
      spriteKey: 'purple-warrior-idle',
      frame: 0,
      scale: 0.75,
      bodySize: { width: 35, height: 35 },
      bodyOffset: { x: 80, y: 85 },
      portrait: 'gameAssets/purpleWarriorAvatar.png',
      theme: 'purple',
      animated: true,
      repeatDelay: 200,
      delay: 200,
    },
    'purple-pawn-idle': {
      name: 'Purple Pawn',
      text: 'I love my life!',
      spriteKey: 'purple-pawn-idle',
      frame: 0,
      scale: 0.8,
      bodySize: { width: 35, height: 35 },
      bodyOffset: { x: 80, y: 85 },
      portrait: 'gameAssets/purplePawnAvatar.png',
      theme: 'purple',
      flipX: true,
      animated: true,
    },
    'purple-monk': {
      name: 'One Without a Name',
      text: '...',
      spriteKey: 'purple-monk-idle',
      frame: 0,
      scale: 0.75,
      bodySize: { width: 35, height: 35 },
      bodyOffset: { x: 80, y: 85 },
      portrait: 'gameAssets/purpleMonkAvatar.png',
      theme: 'purple',
      animated: true,
      repeatDelay: 1000,
      delay: 1000,
    },
    'purple-pawn-idle-wood': {
      name: 'Purple Pawn',
      text: 'Life of a pawn is hard',
      spriteKey: 'purple-pawn-idle-wood',
      frame: 0,
      scale: 0.75,
      bodySize: { width: 35, height: 35 },
      bodyOffset: { x: 80, y: 85 },
      portrait: 'gameAssets/purplePawnAvatar.png',
      flipX: true,
      theme: 'purple',
      animated: true,
      repeatDelay: 500,
      delay: 200,
    },
  },

  '16b-json': {
    'purple-warrior-black': {
      name: 'Purple? Warrior',
      text: 'Hey there, traveler.',
      spriteKey: 'black-warrior-idle',
      frame: 0,
      scale: 0.75,
      bodySize: { width: 35, height: 35 },
      bodyOffset: { x: 80, y: 85 },
      portrait: 'gameAssets/blackWarriorAvatar.png',
      theme: 'black',
      animated: true,
      repeatDelay: 200,
      delay: 200,
    },
    'black-warrior-16b': {
      name: 'Mysterious Stranger',
      text: '...',
      spriteKey: 'black-warrior-idle',
      frame: 4,
      scale: 0.75,
      bodySize: { width: 35, height: 35 },
      bodyOffset: { x: 80, y: 85 },
      portrait: 'gameAssets/blackWarriorAvatar.png',
      theme: 'black',
      flipX: true,
      animated: true,
      repeatDelay: 200,
      delay: 200,
    },
    'black-lancer-guard-top-16b': {
      name: 'Mysterious Stranger',
      text: '...',
      spriteKey: 'black-lancer-defense',
      frame: 0,
      scale: 0.75,
      bodySize: { width: 60, height: 35 },
      bodyOffset: { x: 120, y: 160 },
      portrait: 'gameAssets/blackLancerAvatar.png',
      theme: 'black',
      flipX: true,
      animated: true,
      repeatDelay: 200,
      delay: 200,
    },
    'black-lancer-guard-bot-16b': {
      name: 'Mysterious Stranger',
      text: '...',
      spriteKey: 'black-lancer-defense',
      frame: 4,
      scale: 0.75,
      bodySize: { width: 60, height: 35 },
      bodyOffset: { x: 120, y: 160 },
      portrait: 'gameAssets/blackLancerAvatar.png',
      theme: 'black',
      flipX: true,
      animated: true,
      repeatDelay: 200,
      delay: 200,
    },
  },

  '17-json': {
    // Empty for now
  },

  '18-json': {
    'purple-pawn-idle-hammer-18': {
      name: 'Purple Pawn',
      text: 'Life of a pawn is hard',
      spriteKey: 'purple-pawn-idle-hammer',
      frame: 0,
      scale: 0.75,
      bodySize: { width: 35, height: 35 },
      bodyOffset: { x: 80, y: 85 },
      portrait: 'gameAssets/purplePawnAvatar.png',
      flipX: true,
      theme: 'purple',
      animated: true,
      repeatDelay: 100,
      delay: 200,
    },
    'duck': {
      name: 'Duck',
      text: 'Quack',
      spriteKey: 'duck',
      frame: 0,
      scale: 1,
      bodySize: { width: 32, height: 32 },
      bodyOffset: { x: 0, y: 0 },
      portrait: 'gameAssets/purplePawnAvatar.png',
      flipX: true,
      theme: 'red',
      animated: true,
      repeatDelay: 100,
      delay: 100,
      patrol: {
        axis: 'x',
        distance: 90,
        speed: 80,
        pauseMs: 1000,
      }
    }
  },

  '26-json': {
    'purple-pawn-idle-26': {
      name: 'Purple Pawn Sheppard',
      text: 'I used to be a warrior, but this life suits me better!',
      spriteKey: 'purple-pawn-idle',
      frame: 0,
      scale: 0.75,
      bodySize: { width: 35, height: 35 },
      bodyOffset: { x: 80, y: 85 },
      portrait: 'gameAssets/purplePawnAvatar.png',
      theme: 'purple',
      animated: true,
    },
    'sheep-26-1': {
      name: 'Sheep',
      text: 'Baa!',
      spriteKey: 'sheep',
      frame: 1,
      scale: 0.85,
      bodySize: { width: 35, height: 30 },
      bodyOffset: { x: 50, y: 50 },
      theme: 'purple',
      animated: true,
    },
    'sheep-26-2': {
      name: 'Sheep',
      text: 'Baa!',
      spriteKey: 'sheep',
      frame: 0,
      scale: 0.75,
      bodySize: { width: 35, height: 25 },
      bodyOffset: { x: 50, y: 50 },
      theme: 'purple',
      animated: true,
    },
    'sheep-26-3': {
      name: 'Sheep',
      text: 'Baa!',
      spriteKey: 'sheep',
      frame: 3,
      scale: 0.75,
      bodySize: { width: 35, height: 25 },
      bodyOffset: { x: 50, y: 50 },
      theme: 'purple',
      animated: true,
    },
    'black-warrior': {
      name: 'Mysterious Stranger',
      text: '...',
      spriteKey: 'black-warrior-idle',
      frame: 0,
      scale: 0.75,
      bodySize: { width: 35, height: 35 },
      bodyOffset: { x: 80, y: 85 },
      portrait: 'gameAssets/blackWarriorAvatar.png',
      theme: 'black',
      animated: true,
      repeatDelay: 200,
      delay: 200,
    },
    'black-lancer-idle': {
      name: 'Mysterious Stranger',
      text: '...',
      spriteKey: 'black-lancer-idle',
      frame: 0,
      scale: 0.75,
      bodySize: { width: 45, height: 35 },
      bodyOffset: { x: 120, y: 160 },
      portrait: 'gameAssets/blackWarriorAvatar.png',
      theme: 'black',
      animated: true,
      repeatDelay: 200,
      delay: 200,
    },
    'black-lancer-idle2': {
      name: 'Mysterious Stranger',
      text: '...',
      spriteKey: 'black-lancer-idle',
      frame: 8,
      scale: 0.75,
      bodySize: { width: 45, height: 35 },
      bodyOffset: { x: 120, y:  160 },
      portrait: 'gameAssets/blackWarriorAvatar.png',
      theme: 'black',
      animated: true,
      repeatDelay: 200,
      delay: 200,
    },
  },
};
