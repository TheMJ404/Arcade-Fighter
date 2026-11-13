/**
 * Core logical dimensions and 16-bit atmospheric color palette for Arcade Fighter.
 * Kept pure (no Phaser or DOM imports) so configuration can be shared and unit-tested.
 */

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const GAME_ASPECT_RATIO = GAME_WIDTH / GAME_HEIGHT;

export const SCENE_KEYS = {
  BOOT_PREVIEW: 'BootPreviewScene',
} as const;

export const STAGE_PALETTE = {
  /** Sky gradient bands from zenith to horizon */
  skyZenith: 0x0b0d1f,
  skyUpperNavy: 0x131636,
  skyMidViolet: 0x1f1c47,
  skyLowerPlum: 0x2d2154,
  skyHorizonGlow: 0x3f2963,
  skyZenithHex: '#0b0d1f',

  /** Stars & drifting clouds */
  starWhite: 0xe2e8f0,
  starLavender: 0xc4b5fd,
  starGold: 0xfde68a,
  cloudDark: 0x241d46,
  cloudMid: 0x35295e,

  /** Moon */
  moonHaloOuter: 0x2a2352,
  moonHaloInner: 0x3f326b,
  moonBase: 0xf4e8c1,
  moonShadow: 0xd9c89a,
  moonCrater: 0xc7b585,

  /** Mountains & Japanese temple silhouettes */
  mountainFar: 0x181533,
  mountainFarHighlight: 0x2a234d,
  mountainMid: 0x110e24,
  templeSilhouette: 0x0b0917,
  templeRim: 0x3b2f63,
  shojiWarm: 0xf59e0b,
  shojiBright: 0xfde047,
  toriiAccent: 0x451a24,

  /** Dojo stage floor */
  groundTopRim: 0x51427a,
  groundDeck: 0x292145,
  groundDeckSeam: 0x19142b,
  groundApron: 0x141024,
  groundBrick: 0x1d1833,
  groundInlay: 0x362b59,

  /** Title typography */
  titleText: '#f4e8c1',
  titleShadow: '#070512',
  titleRule: 0xc94a38,
  subtitleText: '#b9b4d8',
} as const;
