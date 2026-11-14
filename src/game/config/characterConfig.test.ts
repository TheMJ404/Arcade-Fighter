import test from 'node:test';
import assert from 'node:assert/strict';
import {getArenaConfig} from './arenaConfig';
import {
  computeCharacterGroundY,
  computePhysicsBodyOffset,
  getCharacterConfig,
} from './characterConfig';

test('Player 1 character configuration defines stats, physics, sprite dimensions, and all movement animations', () => {
  const player1 = getCharacterConfig('player-1');

  assert.equal(player1.id, 'player-1');
  assert.equal(player1.name, 'Player 1');
  assert.ok(player1.stats.maxHealth > 0);
  assert.ok(player1.stats.moveSpeed > 0);
  assert.ok(player1.stats.runSpeed > player1.stats.moveSpeed);
  assert.ok(player1.stats.attackPower > 0);
  assert.ok(player1.stats.defense > 0);

  assert.ok(player1.physics.jumpVelocity < 0);
  assert.ok(player1.physics.gravityY > 0);
  assert.ok(player1.physics.groundAcceleration > 0);
  assert.ok(player1.physics.groundDrag > 0);
  assert.ok(player1.physics.crouchingBody.height < player1.physics.standingBody.height);
  assert.equal(player1.facing.autoFaceOpponent, false);

  assert.equal(player1.sprite.frameWidth, 144);
  assert.equal(player1.sprite.frameHeight, 144);
  assert.equal(player1.sprite.frameCount, 8);

  assert.equal(player1.animations.idle.startFrame, 0);
  assert.equal(player1.animations.idle.endFrame, 7);
  assert.equal(player1.animations.idle.repeat, -1);

  assert.equal(player1.animations.walk.startFrame, 0);
  assert.equal(player1.animations.walk.endFrame, 7);
  assert.equal(player1.animations.walk.repeat, -1);

  assert.equal(player1.animations.run.startFrame, 0);
  assert.equal(player1.animations.run.endFrame, 7);
  assert.equal(player1.animations.run.repeat, -1);

  assert.equal(player1.animations.jump.startFrame, 0);
  assert.equal(player1.animations.jump.endFrame, 5);
  assert.equal(player1.animations.jump.repeat, 0);

  assert.equal(player1.animations.crouch.startFrame, 0);
  assert.equal(player1.animations.crouch.endFrame, 3);
  assert.equal(player1.animations.crouch.repeat, 0);
});

test('Player 1 aligns feet cleanly with Moonlit Temple groundY and anchors standing/crouching bodies to floor', () => {
  const arena = getArenaConfig('moonlit-temple');
  const player1 = getCharacterConfig('player-1');

  assert.equal(arena.spawnPoints.player1.x, 288);
  assert.equal(arena.spawnPoints.player1.facing, 'right');
  assert.equal(player1.render.originX, 0.5);
  assert.equal(player1.render.originY, 1);

  const groundY = computeCharacterGroundY(arena.bounds.groundY, player1.render.footOffsetY);
  assert.equal(groundY, arena.bounds.groundY);

  const standingOffset = computePhysicsBodyOffset(
    player1.sprite.frameWidth,
    player1.sprite.frameHeight,
    player1.physics.standingBody.width,
    player1.physics.standingBody.height,
  );
  const crouchingOffset = computePhysicsBodyOffset(
    player1.sprite.frameWidth,
    player1.sprite.frameHeight,
    player1.physics.crouchingBody.width,
    player1.physics.crouchingBody.height,
  );

  assert.equal(standingOffset.offsetY + player1.physics.standingBody.height, 144);
  assert.equal(crouchingOffset.offsetY + player1.physics.crouchingBody.height, 144);
});
