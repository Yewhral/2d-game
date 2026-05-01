interface ItemConfig {
  textureKey?: string;
  scale: number;
  bob: boolean;
  collides: boolean;
  hitbox?: { width: number; height: number; offsetX?: number; offsetY?: number };
  fxType?: string;
}

export const ITEM_REGISTRY: Record<string, ItemConfig> = {
  money: {
    textureKey: 'money-img',
    scale: 0.5,
    bob: true,
    collides: false,
  },
  log: {
    textureKey: 'woodLog-img',
    scale: 0.7,
    bob: false,
    collides: true,
    hitbox: { width: 44, height: 26, offsetX: 12, offsetY: 20 },
  },
  'artifact': {
    fxType: 'heal',
    scale: 0.8,
    bob: true,
    collides: true,
    textureKey: 'money-img',
    hitbox: { width: 44, height: 26, offsetX: 12, offsetY: 20 },
  },
  'artifact2': {
    scale: 0.8,
    bob: true,
    collides: true,
    textureKey: 'money-img',
    hitbox: { width: 44, height: 26, offsetX: 12, offsetY: 20 },
  },
};
