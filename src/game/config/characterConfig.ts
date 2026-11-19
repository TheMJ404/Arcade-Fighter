import type {CharacterAttackOverrides} from '../combat/combatTypes';

export type CharacterId = 'player-1' | 'player-2' | 'player-3';

export const VALID_CHARACTER_IDS: readonly CharacterId[] = [
  'player-1',
  'player-2',
  'player-3',
];

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
  attackOverrides?: CharacterAttackOverrides;
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
    lightPunch: CharacterAnimationDef;
    heavyPunch: CharacterAnimationDef;
    lightKick: CharacterAnimationDef;
    heavyKick: CharacterAnimationDef;
    block: CharacterAnimationDef;
    hit: CharacterAnimationDef;
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
      groundAcceleration: 2750,
      groundDrag: 2800,
      airAcceleration: 1650,
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
      lightPunch: {
        key: 'player1-light-punch',
        textureKey: 'fighter-player1-light-punch',
        startFrame: 0,
        endFrame: 5,
        frameRate: 19,
        repeat: 0,
      },
      heavyPunch: {
        key: 'player1-heavy-punch',
        textureKey: 'fighter-player1-heavy-punch',
        startFrame: 0,
        endFrame: 7,
        frameRate: 14,
        repeat: 0,
      },
      lightKick: {
        key: 'player1-light-kick',
        textureKey: 'fighter-player1-light-kick',
        startFrame: 0,
        endFrame: 7,
        frameRate: 20,
        repeat: 0,
      },
      heavyKick: {
        key: 'player1-heavy-kick',
        textureKey: 'fighter-player1-heavy-kick',
        startFrame: 0,
        endFrame: 7,
        frameRate: 12,
        repeat: 0,
      },
      block: {
        key: 'player1-block',
        textureKey: 'fighter-player1-block',
        startFrame: 0,
        endFrame: 3,
        frameRate: 10,
        repeat: -1,
      },
      hit: {
        key: 'player1-hit',
        textureKey: 'fighter-player1-hit',
        startFrame: 0,
        endFrame: 3,
        frameRate: 15,
        repeat: 0,
      },
    },
  },
  'player-2': {
    id: 'player-2',
    name: 'Player 2',
    stats: {
      maxHealth: 1000,
      moveSpeed: 240,
      runSpeed: 410,
      attackPower: 100,
      defense: 100,
    },
    physics: {
      groundAcceleration: 2750,
      groundDrag: 2800,
      airAcceleration: 1650,
      jumpVelocity: -640,
      gravityY: 1650,
      standingBody: {width: 52, height: 112},
      crouchingBody: {width: 56, height: 74},
    },
    facing: {
      autoFaceOpponent: false,
    },
    sprite: {
      textureKey: 'fighter-player2-idle',
      frameWidth: 144,
      frameHeight: 144,
      frameCount: 8,
    },
    render: {
      scale: 2,
      originX: 0.5,
      originY: 1,
      footOffsetY: 0,
      shadowWidth: 172,
      shadowHeight: 22,
    },
    animations: {
      idle: {
        key: 'player2-idle',
        textureKey: 'fighter-player2-idle',
        startFrame: 0,
        endFrame: 7,
        frameRate: 11,
        repeat: -1,
      },
      walk: {
        key: 'player2-walk',
        textureKey: 'fighter-player2-walk',
        startFrame: 0,
        endFrame: 7,
        frameRate: 13,
        repeat: -1,
      },
      run: {
        key: 'player2-run',
        textureKey: 'fighter-player2-run',
        startFrame: 0,
        endFrame: 7,
        frameRate: 17,
        repeat: -1,
      },
      jump: {
        key: 'player2-jump',
        textureKey: 'fighter-player2-jump',
        startFrame: 0,
        endFrame: 5,
        frameRate: 11,
        repeat: 0,
      },
      crouch: {
        key: 'player2-crouch',
        textureKey: 'fighter-player2-crouch',
        startFrame: 0,
        endFrame: 3,
        frameRate: 15,
        repeat: 0,
      },
      lightPunch: {
        key: 'player2-light-punch',
        textureKey: 'fighter-player2-light-punch',
        startFrame: 0,
        endFrame: 5,
        frameRate: 22,
        repeat: 0,
      },
      heavyPunch: {
        key: 'player2-heavy-punch',
        textureKey: 'fighter-player2-heavy-punch',
        startFrame: 0,
        endFrame: 7,
        frameRate: 16,
        repeat: 0,
      },
      lightKick: {
        key: 'player2-light-kick',
        textureKey: 'fighter-player2-light-kick',
        startFrame: 0,
        endFrame: 7,
        frameRate: 23,
        repeat: 0,
      },
      heavyKick: {
        key: 'player2-heavy-kick',
        textureKey: 'fighter-player2-heavy-kick',
        startFrame: 0,
        endFrame: 7,
        frameRate: 14,
        repeat: 0,
      },
      block: {
        key: 'player2-block',
        textureKey: 'fighter-player2-block',
        startFrame: 0,
        endFrame: 3,
        frameRate: 10,
        repeat: -1,
      },
      hit: {
        key: 'player2-hit',
        textureKey: 'fighter-player2-hit',
        startFrame: 0,
        endFrame: 3,
        frameRate: 15,
        repeat: 0,
      },
    },
  },
  'player-3': {
    id: 'player-3',
    name: 'Player 3',
    stats: {
      maxHealth: 1000,
      moveSpeed: 240,
      runSpeed: 410,
      attackPower: 100,
      defense: 100,
    },
    physics: {
      groundAcceleration: 2750,
      groundDrag: 2800,
      airAcceleration: 1650,
      jumpVelocity: -640,
      gravityY: 1650,
      standingBody: {width: 52, height: 112},
      crouchingBody: {width: 56, height: 74},
    },
    facing: {
      autoFaceOpponent: false,
    },
    sprite: {
      textureKey: 'fighter-player3-idle',
      frameWidth: 144,
      frameHeight: 144,
      frameCount: 8,
    },
    render: {
      scale: 2,
      originX: 0.5,
      originY: 1,
      footOffsetY: 0,
      shadowWidth: 184,
      shadowHeight: 22,
    },
    animations: {
      idle: {
        key: 'player3-idle',
        textureKey: 'fighter-player3-idle',
        startFrame: 0,
        endFrame: 7,
        frameRate: 9,
        repeat: -1,
      },
      walk: {
        key: 'player3-walk',
        textureKey: 'fighter-player3-walk',
        startFrame: 0,
        endFrame: 7,
        frameRate: 11,
        repeat: -1,
      },
      run: {
        key: 'player3-run',
        textureKey: 'fighter-player3-run',
        startFrame: 0,
        endFrame: 7,
        frameRate: 14,
        repeat: -1,
      },
      jump: {
        key: 'player3-jump',
        textureKey: 'fighter-player3-jump',
        startFrame: 0,
        endFrame: 5,
        frameRate: 9,
        repeat: 0,
      },
      crouch: {
        key: 'player3-crouch',
        textureKey: 'fighter-player3-crouch',
        startFrame: 0,
        endFrame: 3,
        frameRate: 13,
        repeat: 0,
      },
      lightPunch: {
        key: 'player3-light-punch',
        textureKey: 'fighter-player3-light-punch',
        startFrame: 0,
        endFrame: 5,
        frameRate: 17,
        repeat: 0,
      },
      heavyPunch: {
        key: 'player3-heavy-punch',
        textureKey: 'fighter-player3-heavy-punch',
        startFrame: 0,
        endFrame: 7,
        frameRate: 12,
        repeat: 0,
      },
      lightKick: {
        key: 'player3-light-kick',
        textureKey: 'fighter-player3-light-kick',
        startFrame: 0,
        endFrame: 7,
        frameRate: 17,
        repeat: 0,
      },
      heavyKick: {
        key: 'player3-heavy-kick',
        textureKey: 'fighter-player3-heavy-kick',
        startFrame: 0,
        endFrame: 7,
        frameRate: 11,
        repeat: 0,
      },
      block: {
        key: 'player3-block',
        textureKey: 'fighter-player3-block',
        startFrame: 0,
        endFrame: 3,
        frameRate: 10,
        repeat: -1,
      },
      hit: {
        key: 'player3-hit',
        textureKey: 'fighter-player3-hit',
        startFrame: 0,
        endFrame: 3,
        frameRate: 14,
        repeat: 0,
      },
    },
  },
};

export function isCharacterId(value: string | null | undefined): value is CharacterId {
  return value === 'player-1' || value === 'player-2' || value === 'player-3';
}

export function resolveFighterIdFromSearch(search: string): CharacterId {
  if (!search) {
    return 'player-1';
  }
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const requested = params.get('fighter')?.trim().toLowerCase();
  return isCharacterId(requested) ? requested : 'player-1';
}

export function getCharacterConfig(id: CharacterId = 'player-1'): CharacterConfig {
  return CHARACTER_REGISTRY[id];
}

export function getAllCharacterConfigs(): CharacterConfig[] {
  return VALID_CHARACTER_IDS.map((id) => CHARACTER_REGISTRY[id]);
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
