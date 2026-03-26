interface ItemConfig {
  textureKey: string;
  scale: number;
  bob: boolean;
  collides: boolean;
  hitbox?: { width: number; height: number; offsetX?: number; offsetY?: number };
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
    hitbox: { width: 24, height: 12, offsetX: 12, offsetY: 22 },
  },
};
