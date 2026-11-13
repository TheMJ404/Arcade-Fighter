import Phaser from 'phaser';
import {GAME_HEIGHT, GAME_WIDTH, STAGE_PALETTE} from './constants';
import {BootPreviewScene} from '../scenes/BootPreviewScene';

/**
 * Builds the Phaser 3.90.0 configuration bound to a given parent container.
 * Uses a fixed 960x540 (16:9) logical resolution with FIT scaling and pixel-art rendering.
 */
export function createPhaserConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: STAGE_PALETTE.skyZenithHex,
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    input: {
      mouse: true,
      touch: true,
    },
    scene: [BootPreviewScene],
  };
}
