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
    flipX?: boolean;
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
      offsetX: 22,
      offsetY: 10,
    },
    bodyOffset: { x: -30, y: 40 },
  },
  'bush--1': {
    name: 'Bush',
    spriteKey: 'bush',
    scale: 0.75,
    frame: 1,
    depthOffset: -34,
    hasCollision: true,
    hitbox: {
      width: 24,
      height: 6,
      offsetX: 22,
      offsetY: 10,
    },
    bodyOffset: { x: -30, y: 40 },
    flipX: true,
  },
  'bush--2': {
    name: 'Bush',
    spriteKey: 'bush',
    scale: 0.75,
    frame: 2,
    depthOffset: -34,
    hasCollision: true,
    hitbox: {
      width: 24,
      height: 6,
      offsetX: 22,
      offsetY: 10,
    },
    bodyOffset: { x: -30, y: 40 },
  },
  'bush--5': {
    name: 'Bush',
    spriteKey: 'bush',
    scale: 0.75,
    frame: 5,
    depthOffset: -34,
    hasCollision: true,
    hitbox: {
      width: 24,
      height: 6,
      offsetX: 22,
      offsetY: 10,
    },
    bodyOffset: { x: -30, y: 40 },
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
      offsetY: 8,
    },
    bodyOffset: { x: -96, y: 28 },
  },
  'tree3-sm': {
    name: 'Tree',
    spriteKey: 'tree3',
    scale: 0.5,
    frame: 0,
    depthOffset: -10,
    hasCollision: true,
    hitbox: {
      width: 10,
      height: 4,
      offsetX: 12,
      offsetY: 8,
    },
    bodyOffset: { x: -48, y: 14 },
    flipX: true,
  },
  barracks: {
    name: 'Barracks',
    spriteKey: 'barracks',
    scale: 1,
    frame: 0,
    depthOffset: -40,
    hasCollision: true,
    hitbox: {
      width: 160,
      height: 50,
      offsetX: 15,
      offsetY: -36,
    },
    bodyOffset: { x: -16, y: 24 },
  },
  house2: {
    name: 'House2',
    spriteKey: 'house2',
    scale: 1,
    frame: 0,
    depthOffset: -40,
    hasCollision: true,
    hitbox: {
      width: 110,
      height: 10,
      offsetX: 12,
      offsetY: -16,
    },
    bodyOffset: { x: -12, y: 24 },
  },
  'house2-1': {
    name: 'House2-1',
    spriteKey: 'house2',
    scale: 1,
    frame: 0,
    flipX: true,
    depthOffset: -36,
    hasCollision: true,
    hitbox: {
      width: 110,
      height: 10,
      offsetX: 12,
      offsetY: -12,
    },
    bodyOffset: { x: -12, y: 24 },
  },
  house: {
    name: 'House2',
    spriteKey: 'house2',
    scale: 1,
    frame: 0,
    depthOffset: -40,
    hasCollision: true,
    hitbox: {
      width: 110,
      height: 10,
      offsetX: 12,
      offsetY: -16,
    },
    bodyOffset: { x: -12, y: 24 },
  },
  house2black: {
    name: 'House2black',
    spriteKey: 'house2black',
    scale: 1,
    frame: 0,
    depthOffset: -40,
    hasCollision: true,
    hitbox: {
      width: 110,
      height: 10,
      offsetX: 12,
      offsetY: -16,
    },
    bodyOffset: { x: -12, y: 24 },
  },
};