// ---- NPC registry ----------------------------------------------------------
// Maps npcId (set as a custom property on Tiled objects) → visual + default
// dialog data.  Quest-specific dialog is handled by the quest system —
// see src/game/quests/.
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
  },
  'purple-warrior2': {
    name: 'Mysterious Stranger',
    text: '...',
    spriteKey: 'purple-warrior-idle',
    frame: 0,
    scale: 0.75,
    bodySize: { width: 35, height: 35 },
    bodyOffset: { x: 80, y: 85 },
    portrait: 'gameAssets/purpleWarriorAvatar.png',
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
  }
};
