export type CharacterId = 'player-1';

export interface CharacterStats {
  maxHealth: number;
  moveSpeed: number;
  runSpeed: number;
  attackPower: number;
  defense: number;
}

export interface CharacterBodySize {
  /** Collision box width in unscaled sprite pixels */
  width: number;
  /** Collision box height in unscaled sprite pixels */
  height: number;
}

export interface CharacterPhysicsConfig {
  groundAcceleration: number;
  groundDrag: number;
  airAcceleration: number;
  jumpVelocity: number;
  gravityY: number;
  standingBody: CharacterBodySize;
  crouchingBody: CharacterBodySize;
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
  physics: CharacterPhysicsConfig;
  facing: {
    /** Reserved for future opponent auto-facing once P2 / CPU fighters are added */
    autoFaceOpponent: boolean;
  };
  sprite: {
    textureKey: string;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
  };
  render: CharacterRenderConfig;
  animations: {
    idle: CharacterAnimationDef;
    walk: CharacterAnimationDef;
    run: CharacterAnimationDef;
    jump: CharacterAnimationDef;
    crouch: CharacterAnimationDef;
  };
}

export const CHARACTER_REGISTRY: Record<CharacterId, CharacterConfig> = {
  'player-1': {
    id: 'player-1',
    name: 'Player 1',
    stats: {
      maxHealth: 1000,
      moveSpeed: 240,
      runSpeed: 410,
      attackPower: 100,
      defense: 100,
    },
    physics: {
      groundAcceleration: 2400,
      groundDrag: 2600,
      airAcceleration: 1500,
      jumpVelocity: -640,
      gravityY: 1650,
      standingBody: {width: 52, height: 112},
      crouchingBody: {width: 56, height: 74},
    },
    facing: {
      autoFaceOpponent: false,
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
      walk: {
        key: 'player1-walk',
        textureKey: 'fighter-player1-walk',
        startFrame: 0,
        endFrame: 7,
        frameRate: 12,
        repeat: -1,
      },
      run: {
        key: 'player1-run',
        textureKey: 'fighter-player1-run',
        startFrame: 0,
        endFrame: 7,
        frameRate: 16,
        repeat: -1,
      },
      jump: {
        key: 'player1-jump',
        textureKey: 'fighter-player1-jump',
        startFrame: 0,
        endFrame: 5,
        frameRate: 10,
        repeat: 0,
      },
      crouch: {
        key: 'player1-crouch',
        textureKey: 'fighter-player1-crouch',
        startFrame: 0,
        endFrame: 3,
        frameRate: 14,
        repeat: 0,
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

/**
 * Computes bottom-anchored Arcade Physics body offsets in unscaled frame coordinates
 * so standing and crouching hitboxes keep feet flush with groundY.
 */
export function computePhysicsBodyOffset(
  frameWidth: number,
  frameHeight: number,
  bodyWidth: number,
  bodyHeight: number,
): {offsetX: number; offsetY: number} {
  return {
    offsetX: (frameWidth - bodyWidth) / 2,
    offsetY: frameHeight - bodyHeight,
  };
}
