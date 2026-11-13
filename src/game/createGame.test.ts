import test from 'node:test';
import assert from 'node:assert/strict';
import {destroyArcadeFighterGame} from './destroyGame';
import {gameEvents} from './events/gameEvents';

test('destroyArcadeFighterGame safely ignores null instance', () => {
  let destroyedEvents = 0;
  const unsubscribe = gameEvents.on('game:destroyed', () => {
    destroyedEvents += 1;
  });

  destroyArcadeFighterGame(null);
  assert.equal(destroyedEvents, 0);
  unsubscribe();
});

test('destroyArcadeFighterGame calls game.destroy(true) and emits game:destroyed', () => {
  let destroyedArg: boolean | undefined;
  let destroyedTimestamp = 0;

  const unsubscribe = gameEvents.on('game:destroyed', ({timestamp}) => {
    destroyedTimestamp = timestamp;
  });

  const mockGame = {
    destroy(removeCanvas: boolean) {
      destroyedArg = removeCanvas;
    },
  } as unknown as Parameters<typeof destroyArcadeFighterGame>[0];

  destroyArcadeFighterGame(mockGame);

  assert.equal(destroyedArg, true);
  assert.ok(destroyedTimestamp > 0);
  unsubscribe();
});
