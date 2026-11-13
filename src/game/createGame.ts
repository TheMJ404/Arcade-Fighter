import Phaser from 'phaser';
import {applyWebAudioPrototypeGuards} from './audio/audioContextGuard';
import {createPhaserConfig} from './config/gameConfig';

export {destroyArcadeFighterGame} from './destroyGame';

function ensurePhaserAudioGuards(): void {
  const webAudioCtor = Phaser.Sound?.WebAudioSoundManager;
  if (webAudioCtor?.prototype) {
    applyWebAudioPrototypeGuards(webAudioCtor.prototype as never);
  }
}

/**
 * Instantiates a single Phaser.Game inside the supplied container element.
 * Clears any stale child elements beforehand so React Strict Mode double-mounts
 * never leave duplicate canvases behind.
 */
export function createArcadeFighterGame(parent: HTMLElement): Phaser.Game {
  ensurePhaserAudioGuards();
  parent.replaceChildren();
  const config = createPhaserConfig(parent);
  return new Phaser.Game(config);
}
