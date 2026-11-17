import moonlitTempleArenaUrl from '../../assets/images/moonlit_temple_arena_1794600210932.jpg';
import player1BlockSheetUrl from '../../assets/sprites/player1_block_sheet.png';
import player1CrouchSheetUrl from '../../assets/sprites/player1_crouch_sheet.png';
import player1HeavyKickSheetUrl from '../../assets/sprites/player1_heavy_kick_sheet.png';
import player1HeavyPunchSheetUrl from '../../assets/sprites/player1_heavy_punch_sheet.png';
import player1HitSheetUrl from '../../assets/sprites/player1_hit_sheet.png';
import player1IdleSheetUrl from '../../assets/sprites/player1_idle_sheet.png';
import player1JumpSheetUrl from '../../assets/sprites/player1_jump_sheet.png';
import player1LightKickSheetUrl from '../../assets/sprites/player1_light_kick_sheet.png';
import player1LightPunchSheetUrl from '../../assets/sprites/player1_light_punch_sheet.png';
import player1RunSheetUrl from '../../assets/sprites/player1_run_sheet.png';
import player1WalkSheetUrl from '../../assets/sprites/player1_walk_sheet.png';
import player2BlockSheetUrl from '../../assets/sprites/player2_block_sheet.png';
import player2CrouchSheetUrl from '../../assets/sprites/player2_crouch_sheet.png';
import player2HeavyKickSheetUrl from '../../assets/sprites/player2_heavy_kick_sheet.png';
import player2HeavyPunchSheetUrl from '../../assets/sprites/player2_heavy_punch_sheet.png';
import player2HitSheetUrl from '../../assets/sprites/player2_hit_sheet.png';
import player2IdleSheetUrl from '../../assets/sprites/player2_idle_sheet.png';
import player2JumpSheetUrl from '../../assets/sprites/player2_jump_sheet.png';
import player2LightKickSheetUrl from '../../assets/sprites/player2_light_kick_sheet.png';
import player2LightPunchSheetUrl from '../../assets/sprites/player2_light_punch_sheet.png';
import player2RunSheetUrl from '../../assets/sprites/player2_run_sheet.png';
import player2WalkSheetUrl from '../../assets/sprites/player2_walk_sheet.png';
import player3BlockSheetUrl from '../../assets/sprites/player3_block_sheet.png';
import player3CrouchSheetUrl from '../../assets/sprites/player3_crouch_sheet.png';
import player3HeavyKickSheetUrl from '../../assets/sprites/player3_heavy_kick_sheet.png';
import player3HeavyPunchSheetUrl from '../../assets/sprites/player3_heavy_punch_sheet.png';
import player3HitSheetUrl from '../../assets/sprites/player3_hit_sheet.png';
import player3IdleSheetUrl from '../../assets/sprites/player3_idle_sheet.png';
import player3JumpSheetUrl from '../../assets/sprites/player3_jump_sheet.png';
import player3LightKickSheetUrl from '../../assets/sprites/player3_light_kick_sheet.png';
import player3LightPunchSheetUrl from '../../assets/sprites/player3_light_punch_sheet.png';
import player3RunSheetUrl from '../../assets/sprites/player3_run_sheet.png';
import player3WalkSheetUrl from '../../assets/sprites/player3_walk_sheet.png';

export interface ImageAssetEntry {
  key: string;
  url: string;
}

export interface SpritesheetAssetEntry {
  key: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
}

/**
 * Centralized manifest of game image and spritesheet assets resolved through Vite.
 */
export const ARENA_ASSETS = {
  moonlitTemple: {
    key: 'arena-moonlit-temple',
    url: moonlitTempleArenaUrl,
  },
} as const satisfies Record<string, ImageAssetEntry>;

export const CHARACTER_ASSETS = {
  player1Idle: {
    key: 'fighter-player1-idle',
    url: player1IdleSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player1Walk: {
    key: 'fighter-player1-walk',
    url: player1WalkSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player1Run: {
    key: 'fighter-player1-run',
    url: player1RunSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player1Jump: {
    key: 'fighter-player1-jump',
    url: player1JumpSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 6,
  },
  player1Crouch: {
    key: 'fighter-player1-crouch',
    url: player1CrouchSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 4,
  },
  player1LightPunch: {
    key: 'fighter-player1-light-punch',
    url: player1LightPunchSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 6,
  },
  player1HeavyPunch: {
    key: 'fighter-player1-heavy-punch',
    url: player1HeavyPunchSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player1LightKick: {
    key: 'fighter-player1-light-kick',
    url: player1LightKickSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player1HeavyKick: {
    key: 'fighter-player1-heavy-kick',
    url: player1HeavyKickSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player1Block: {
    key: 'fighter-player1-block',
    url: player1BlockSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 4,
  },
  player1Hit: {
    key: 'fighter-player1-hit',
    url: player1HitSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 4,
  },
  player2Idle: {
    key: 'fighter-player2-idle',
    url: player2IdleSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player2Walk: {
    key: 'fighter-player2-walk',
    url: player2WalkSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player2Run: {
    key: 'fighter-player2-run',
    url: player2RunSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player2Jump: {
    key: 'fighter-player2-jump',
    url: player2JumpSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 6,
  },
  player2Crouch: {
    key: 'fighter-player2-crouch',
    url: player2CrouchSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 4,
  },
  player2LightPunch: {
    key: 'fighter-player2-light-punch',
    url: player2LightPunchSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 6,
  },
  player2HeavyPunch: {
    key: 'fighter-player2-heavy-punch',
    url: player2HeavyPunchSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player2LightKick: {
    key: 'fighter-player2-light-kick',
    url: player2LightKickSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player2HeavyKick: {
    key: 'fighter-player2-heavy-kick',
    url: player2HeavyKickSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player2Block: {
    key: 'fighter-player2-block',
    url: player2BlockSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 4,
  },
  player2Hit: {
    key: 'fighter-player2-hit',
    url: player2HitSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 4,
  },
  player3Idle: {
    key: 'fighter-player3-idle',
    url: player3IdleSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player3Walk: {
    key: 'fighter-player3-walk',
    url: player3WalkSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player3Run: {
    key: 'fighter-player3-run',
    url: player3RunSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player3Jump: {
    key: 'fighter-player3-jump',
    url: player3JumpSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 6,
  },
  player3Crouch: {
    key: 'fighter-player3-crouch',
    url: player3CrouchSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 4,
  },
  player3LightPunch: {
    key: 'fighter-player3-light-punch',
    url: player3LightPunchSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 6,
  },
  player3HeavyPunch: {
    key: 'fighter-player3-heavy-punch',
    url: player3HeavyPunchSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player3LightKick: {
    key: 'fighter-player3-light-kick',
    url: player3LightKickSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player3HeavyKick: {
    key: 'fighter-player3-heavy-kick',
    url: player3HeavyKickSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 8,
  },
  player3Block: {
    key: 'fighter-player3-block',
    url: player3BlockSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 4,
  },
  player3Hit: {
    key: 'fighter-player3-hit',
    url: player3HitSheetUrl,
    frameWidth: 144,
    frameHeight: 144,
    frameCount: 4,
  },
} as const satisfies Record<string, SpritesheetAssetEntry>;
