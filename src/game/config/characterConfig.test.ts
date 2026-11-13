import test from 'node:test';
import assert from 'node:assert/strict';
import {getArenaConfig} from './arenaConfig';
import {computeCharacterGroundY, getCharacterConfig} from './characterConfig';

test('Player 1 character configuration defines stats, sprite dimensions, and looping idle animation', () => {
  const player1 = getCharacterConfig('player-1');

  assert.equal(player1.id, 'player-1');
  assert.equal(player1.name, 'Player 1');
  assert.ok(player1.stats.maxHealth > 0);
  assert.ok(player1.stats.moveSpeed > 0);
  assert.ok(player1.stats.attackPower > 0);
  assert.ok(player1.stats.defense > 0);

  assert.equal(player1.sprite.frameWidth, 144);
  assert.equal(player1.sprite.frameHeight, 144);
  assert.equal(player1.sprite.frameCount, 8);

  assert.equal(player1.animations.idle.startFrame, 0);
  assert.equal(player1.animations.idle.endFrame, 7);
  assert.equal(player1.animations.idle.repeat, -1);
  assert.ok(player1.animations.idle.frameRate >= 6);
});

test('Player 1 aligns feet cleanly with Moonlit Temple groundY and spawnX', () => {
  const arena = getArenaConfig('moonlit-temple');
  const player1 = getCharacterConfig('player-1');

  assert.equal(arena.spawnPoints.player1.x, 288);
  assert.equal(arena.spawnPoints.player1.facing, 'right');
  assert.equal(player1.render.originX, 0.5);
  assert.equal(player1.render.originY, 1);

  const groundY = computeCharacterGroundY(arena.bounds.groundY, player1.render.footOffsetY);
  assert.equal(groundY, arena.bounds.groundY);
});
