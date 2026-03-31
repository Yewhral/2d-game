// ---- NPC registry ----------------------------------------------------------
// Maps npcId (set as a custom property on Tiled objects) → visual + default
// dialog data.
export type NpcTheme = 'purple' | 'black' | 'blue' | 'red' | 'yellow';

export const NPC_REGISTRY: Record<
  string,
  {
    name: string;
    /** Default text when no quest overrides the dialog */
    text: string;
    spriteKey: string;
    frame: number;
    scale: number;
    bodySize: { width: number; height: number };
    bodyOffset: { x: number; y: number };
    portrait: string;
    animated?: boolean;
    flipX?: boolean;
    theme?: NpcTheme;
  }
> = {
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
  },
  'black-lancer-idle': {
    name: 'Mysterious Stranger',
    text: '...',
    spriteKey: 'black-lancer-idle',
    frame: 0,
    scale: 0.75,
    bodySize: { width: 35, height: 35 },
    bodyOffset: { x: 80, y: 85 },
    portrait: 'gameAssets/blackWarriorAvatar.png',
    theme: 'black',
  },
  'black-lancer-idle2': {
    name: 'Mysterious Stranger',
    text: '...',
    spriteKey: 'black-lancer-idle',
    frame: 8,
    scale: 0.75,
    bodySize: { width: 35, height: 35 },
    bodyOffset: { x: 80, y: 85 },
    portrait: 'gameAssets/blackWarriorAvatar.png',
    theme: 'black',
  },
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
  }
};
