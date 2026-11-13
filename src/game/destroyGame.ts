import type Phaser from 'phaser';
import {gameEvents} from './events/gameEvents';

export interface DestroyableGame {
  destroy(removeCanvas?: boolean): void;
}

/**
 * Cleanly tears down a Phaser.Game instance, removing its canvas and event loops.
 */
export function destroyArcadeFighterGame(game: Phaser.Game | DestroyableGame | null): void {
  if (!game) {
    return;
  }

  game.destroy(true);
  gameEvents.emit('game:destroyed', {timestamp: Date.now()});
}
