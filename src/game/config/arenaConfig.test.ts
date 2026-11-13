import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCoverScale,
  clampXToArenaBounds,
  getArenaConfig,
} from './arenaConfig';

test('moonlit-temple arena config defines 960x540 world, groundY, and symmetric spawns', () => {
  const arena = getArenaConfig('moonlit-temple');
  assert.equal(arena.worldWidth, 960);
  assert.equal(arena.worldHeight, 540);
  assert.ok(arena.bounds.left > 0 && arena.bounds.right < 960);
  assert.ok(arena.bounds.groundY > 400 && arena.bounds.groundY < 540);
  assert.equal(arena.spawnPoints.player1.y, arena.bounds.groundY);
  assert.equal(arena.spawnPoints.player2.y, arena.bounds.groundY);
  assert.equal(arena.spawnPoints.player1.facing, 'right');
  assert.equal(arena.spawnPoints.player2.facing, 'left');
});

test('calculateCoverScale covers 960x540 proportionally for 1376x768 background artwork', () => {
  const cover = calculateCoverScale(1376, 768, 960, 540);
  assert.equal(cover.x, 480);
  assert.equal(cover.y, 270);
  assert.equal(cover.height, 540);
  assert.ok(cover.width >= 960);
});

test('clampXToArenaBounds keeps entities inside configurable left/right bounds', () => {
  const {bounds} = getArenaConfig('moonlit-temple');
  assert.equal(clampXToArenaBounds(10, 24, bounds), bounds.left + 24);
  assert.equal(clampXToArenaBounds(950, 24, bounds), bounds.right - 24);
  assert.equal(clampXToArenaBounds(480, 24, bounds), 480);
});
