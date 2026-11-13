import moonlitTempleArenaUrl from '../../assets/images/moonlit_temple_arena_1794600210932.jpg';
import player1IdleSheetUrl from '../../assets/sprites/player1_idle_sheet.png';

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
} as const satisfies Record<string, SpritesheetAssetEntry>;
