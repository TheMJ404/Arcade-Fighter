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
} as const satisfies Record<string, SpritesheetAssetEntry>;
