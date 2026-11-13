import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEventBus} from './gameEvents';

test('GameEventBus delivers typed payloads and unsubscribes cleanly', () => {
  const bus = new GameEventBus();
  const received: Array<{sceneKey: string; width: number; height: number}> = [];

  const unsubscribe = bus.on('scene:ready', (payload) => {
    received.push(payload);
  });

  assert.equal(bus.listenerCount('scene:ready'), 1);

  bus.emit('scene:ready', {sceneKey: 'BootPreviewScene', width: 960, height: 540});
  assert.equal(received.length, 1);
  assert.deepEqual(received[0], {sceneKey: 'BootPreviewScene', width: 960, height: 540});

  unsubscribe();
  assert.equal(bus.listenerCount('scene:ready'), 0);

  bus.emit('scene:ready', {sceneKey: 'BootPreviewScene', width: 960, height: 540});
  assert.equal(received.length, 1);
});

test('GameEventBus isolates events and clears all listeners', () => {
  const bus = new GameEventBus();
  let destroyedCount = 0;

  bus.on('game:destroyed', () => {
    destroyedCount += 1;
  });

  bus.emit('viewport:resized', {width: 844, height: 390});
  assert.equal(destroyedCount, 0);

  bus.emit('game:destroyed', {timestamp: 12345});
  assert.equal(destroyedCount, 1);

  bus.clear();
  assert.equal(bus.listenerCount(), 0);
});
