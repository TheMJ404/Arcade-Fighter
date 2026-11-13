import moonlitTempleArenaUrl from '../../assets/images/moonlit_temple_arena_1794600210932.jpg';

export interface ImageAssetEntry {
  key: string;
  url: string;
}

/**
 * Centralized manifest of game image assets resolved through Vite's bundler.
 */
export const ARENA_ASSETS = {
  moonlitTemple: {
    key: 'arena-moonlit-temple',
    url: moonlitTempleArenaUrl,
  },
} as const satisfies Record<string, ImageAssetEntry>;
