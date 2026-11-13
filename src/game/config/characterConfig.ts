export type CharacterId = 'player-1';

export interface CharacterStats {
  maxHealth: number;
  moveSpeed: number;
  attackPower: number;
  defense: number;
}

export interface CharacterAnimationDef {
  key: string;
  textureKey: string;
  startFrame: number;
  endFrame: number;
  frameRate: number;
  repeat: number;
}

export interface CharacterRenderConfig {
  /** Uniform display scale applied to native pixel-art sprite frames */
  scale: number;
  /** Sprite origin X (0.5 centers horizontally) */
  originX: number;
  /** Sprite origin Y (1.0 aligns bottom edge with floor groundY) */
  originY: number;
  /** Optional vertical pixel nudge relative to arena groundY */
  footOffsetY: number;
  /** Width/height of the grounded contact shadow ellipse at scale 1 */
  shadowWidth: number;
  shadowHeight: number;
}

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  stats: CharacterStats;
  sprite: {
    textureKey: string;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
  };
  render: CharacterRenderConfig;
  animations: {
    idle: CharacterAnimationDef;
  };
}

export const CHARACTER_REGISTRY: Record<CharacterId, CharacterConfig> = {
  'player-1': {
    id: 'player-1',
    name: 'Player 1',
    stats: {
      maxHealth: 1000,
      moveSpeed: 240,
      attackPower: 100,
      defense: 100,
    },
    sprite: {
      textureKey: 'fighter-player1-idle',
      frameWidth: 144,
      frameHeight: 144,
      frameCount: 8,
    },
    render: {
      scale: 2,
      originX: 0.5,
      originY: 1,
      footOffsetY: 0,
      shadowWidth: 176,
      shadowHeight: 22,
    },
    animations: {
      idle: {
        key: 'player1-idle',
        textureKey: 'fighter-player1-idle',
        startFrame: 0,
        endFrame: 7,
        frameRate: 10,
        repeat: -1,
      },
    },
  },
};

export function getCharacterConfig(id: CharacterId = 'player-1'): CharacterConfig {
  return CHARACTER_REGISTRY[id];
}

export function computeCharacterGroundY(arenaGroundY: number, footOffsetY: number = 0): number {
  return Math.round(arenaGroundY + footOffsetY);
}
