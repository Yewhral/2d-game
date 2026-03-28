// ---- tileset name → preloaded image key ------------------------------------
// Every tileset name used in Tiled maps must have a corresponding preloaded
// image key here.  The Preloader scene must load these images beforehand.
export const TILESET_IMAGE_KEYS: Record<string, string> = {
  grass: 'grass-img',
  grass2: 'grass2-img',
  shadow: 'shadow-img',
  barracks: 'barracks-img',
  water: 'water-img',
  waterRocks2: 'waterRocks2-img',
  waterRocks4: 'waterRocks4-img',
  cloud: 'cloud-img',
  bushes: 'bushes-img',
  house: 'house-img',
  house2: 'house2-img',
};
