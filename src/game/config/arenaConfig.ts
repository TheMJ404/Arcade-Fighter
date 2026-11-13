import {GAME_HEIGHT, GAME_WIDTH} from './constants';

export type ArenaId = 'moonlit-temple';

export interface ArenaBounds {
  /** Left walkable boundary in logical world pixels */
  left: number;
  /** Right walkable boundary in logical world pixels */
  right: number;
  /** Upper ceiling bound for future aerial/jump clamping */
  top: number;
  /** Horizontal ground plane Y coordinate where fighters stand */
  groundY: number;
}

export interface ArenaSpawnPoint {
  x: number;
  y: number;
  facing: 'left' | 'right';
}

export interface ArenaConfig {
  id: ArenaId;
  name: string;
  textureKey: string;
  worldWidth: number;
  worldHeight: number;
  bounds: ArenaBounds;
  spawnPoints: {
    player1: ArenaSpawnPoint;
    player2: ArenaSpawnPoint;
  };
}

export interface CoverDimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

export const ARENA_REGISTRY: Record<ArenaId, ArenaConfig> = {
  'moonlit-temple': {
    id: 'moonlit-temple',
    name: 'Moonlit Temple',
    textureKey: 'arena-moonlit-temple',
    worldWidth: GAME_WIDTH,
    worldHeight: GAME_HEIGHT,
    bounds: {
      left: 48,
      right: GAME_WIDTH - 48,
      top: 64,
      groundY: 472,
    },
    spawnPoints: {
      player1: {x: 288, y: 472, facing: 'right'},
      player2: {x: 672, y: 472, facing: 'left'},
    },
  },
};

export function getArenaConfig(id: ArenaId = 'moonlit-temple'): ArenaConfig {
  return ARENA_REGISTRY[id];
}

/**
 * Computes proportional cover-fit dimensions so a background texture fills the
 * logical 960x540 arena without stretching or leaving border gaps.
 */
export function calculateCoverScale(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number = GAME_WIDTH,
  targetHeight: number = GAME_HEIGHT,
): CoverDimensions {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    return {width: targetWidth, height: targetHeight, x: targetWidth / 2, y: targetHeight / 2};
  }

  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  return {
    width: Math.round(sourceWidth * scale),
    height: Math.round(sourceHeight * scale),
    x: Math.round(targetWidth / 2),
    y: Math.round(targetHeight / 2),
  };
}

/**
 * Clamps a horizontal fighter center coordinate within the arena's walkable bounds.
 */
export function clampXToArenaBounds(
  x: number,
  halfWidth: number,
  bounds: ArenaBounds,
): number {
  const minX = bounds.left + Math.max(0, halfWidth);
  const maxX = bounds.right - Math.max(0, halfWidth);
  if (minX > maxX) {
    return Math.round((bounds.left + bounds.right) / 2);
  }
  return Math.min(maxX, Math.max(minX, x));
}
