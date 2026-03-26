export const DECORATION_REGISTRY: Record<
  string,
  {
    name: string;
    spriteKey: string;
    frame: number;
    scale: number;
    depthOffset: number;
    hasCollision: boolean;
    animated?: boolean;
    hitbox?: {
      width: number;
      height: number;
      offsetX: number;
      offsetY: number;
    };
    bodyOffset: { x: number; y: number };
  }
> = {
  bush: {
    name: 'Bush',
    spriteKey: 'bush',
    scale: 0.75,
    frame: 0,
    depthOffset: -34,
    hasCollision: true,
    hitbox: {
      width: 24,
      height: 6,
      offsetX: 52,
      offsetY: -30,
    },
    bodyOffset: { x: 0, y: 0 },
  },
  tree3: {
    name: 'Tree',
    spriteKey: 'tree3',
    scale: 1,
    frame: 0,
    depthOffset: -18,
    hasCollision: true,
    hitbox: {
      width: 10,
      height: 4,
      offsetX: 12,
      offsetY: -20,
    },
    bodyOffset: { x: -96, y: 0 },
  },
};