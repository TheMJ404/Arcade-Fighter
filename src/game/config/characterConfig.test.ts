import test from 'node:test';
import assert from 'node:assert/strict';
import {getArenaConfig} from './arenaConfig';
import {
  computeCharacterGroundY,
  computePhysicsBodyOffset,
  getAllCharacterConfigs,
  getCharacterConfig,
  resolveFighterIdFromSearch,
} from './characterConfig';

test('Player 1 character configuration preserves exact Phase 5 stats, physics, sprite dimensions, and animations', () => {
  const player1 = getCharacterConfig('player-1');

  assert.equal(player1.id, 'player-1');
  assert.equal(player1.name, 'Player 1');
  assert.equal(player1.stats.maxHealth, 1000);
  assert.equal(player1.stats.moveSpeed, 240);
  assert.equal(player1.stats.runSpeed, 410);
  assert.equal(player1.stats.attackPower, 100);
  assert.equal(player1.stats.defense, 100);
  assert.equal(player1.attackOverrides, undefined);

  assert.equal(player1.physics.groundAcceleration, 2750);
  assert.equal(player1.physics.groundDrag, 2800);
  assert.equal(player1.physics.airAcceleration, 1650);
  assert.equal(player1.physics.jumpVelocity, -640);
  assert.equal(player1.physics.gravityY, 1650);
  assert.deepEqual(player1.physics.standingBody, {width: 52, height: 112});
  assert.deepEqual(player1.physics.crouchingBody, {width: 56, height: 74});
  assert.equal(player1.facing.autoFaceOpponent, false);

  assert.equal(player1.sprite.textureKey, 'fighter-player1-idle');
  assert.equal(player1.sprite.frameWidth, 144);
  assert.equal(player1.sprite.frameHeight, 144);
  assert.equal(player1.sprite.frameCount, 8);

  assert.equal(player1.animations.idle.key, 'player1-idle');
  assert.equal(player1.animations.idle.repeat, -1);
  assert.equal(player1.animations.walk.repeat, -1);
  assert.equal(player1.animations.run.repeat, -1);
  assert.equal(player1.animations.jump.repeat, 0);
  assert.equal(player1.animations.crouch.repeat, 0);

  assert.equal(player1.animations.lightPunch.endFrame, 5);
  assert.equal(player1.animations.heavyPunch.endFrame, 7);
  assert.equal(player1.animations.lightKick.endFrame, 7);
  assert.equal(player1.animations.heavyKick.endFrame, 7);
  assert.equal(player1.animations.block.endFrame, 3);
  assert.equal(player1.animations.block.repeat, -1);
  assert.equal(player1.animations.hit.endFrame, 3);
  assert.equal(player1.animations.hit.repeat, 0);
});

test('All three fighters share identical combat and movement physics while preserving distinct visual animations', () => {
  const all = getAllCharacterConfigs();
  assert.equal(all.length, 3);

  const p1 = getCharacterConfig('player-1');
  const p2 = getCharacterConfig('player-2');
  const p3 = getCharacterConfig('player-3');

  for (const fighter of [p2, p3]) {
    assert.deepEqual(fighter.stats, p1.stats, `${fighter.id} stats must match Player 1`);
    assert.deepEqual(fighter.physics, p1.physics, `${fighter.id} physics must match Player 1`);
    assert.deepEqual(fighter.facing, p1.facing, `${fighter.id} facing must match Player 1`);
    assert.equal(fighter.attackOverrides, undefined);
    assert.equal(fighter.render.scale, p1.render.scale);
    assert.equal(fighter.render.footOffsetY, p1.render.footOffsetY);
  }

  const expectedFrames = {
    idle: {endFrame: 7, repeat: -1},
    walk: {endFrame: 7, repeat: -1},
    run: {endFrame: 7, repeat: -1},
    jump: {endFrame: 5, repeat: 0},
    crouch: {endFrame: 3, repeat: 0},
    lightPunch: {endFrame: 5, repeat: 0},
    heavyPunch: {endFrame: 7, repeat: 0},
    lightKick: {endFrame: 7, repeat: 0},
    heavyKick: {endFrame: 7, repeat: 0},
    block: {endFrame: 3, repeat: -1},
    hit: {endFrame: 3, repeat: 0},
  } as const;

  const animKeys = new Set<string>();
  for (const fighter of all) {
    assert.equal(fighter.sprite.frameWidth, 144);
    assert.equal(fighter.sprite.frameHeight, 144);
    assert.equal(fighter.render.originX, 0.5);
    assert.equal(fighter.render.originY, 1);

    for (const [slot, rule] of Object.entries(expectedFrames)) {
      const anim = fighter.animations[slot as keyof typeof fighter.animations];
      assert.ok(anim, `Missing animation ${slot} for ${fighter.id}`);
      assert.equal(anim.startFrame, 0);
      assert.equal(anim.endFrame, rule.endFrame);
      assert.equal(anim.repeat, rule.repeat);
      assert.ok(anim.frameRate > 0);
      assert.ok(!animKeys.has(anim.key), `Duplicate animation key ${anim.key}`);
      animKeys.add(anim.key);
    }
  }
});

test('resolveFighterIdFromSearch supports ?fighter=player-1|player-2|player-3 and defaults safely to player-1', () => {
  assert.equal(resolveFighterIdFromSearch(''), 'player-1');
  assert.equal(resolveFighterIdFromSearch('?fighter=player-1'), 'player-1');
  assert.equal(resolveFighterIdFromSearch('?fighter=player-2'), 'player-2');
  assert.equal(resolveFighterIdFromSearch('?fighter=player-3'), 'player-3');
  assert.equal(resolveFighterIdFromSearch('?foo=bar&fighter=PLAYER-2'), 'player-2');
  assert.equal(resolveFighterIdFromSearch('?fighter=unknown'), 'player-1');
});

test('All three fighters align feet cleanly with Moonlit Temple groundY and anchor bodies to floor', () => {
  const arena = getArenaConfig('moonlit-temple');
  assert.equal(arena.spawnPoints.player1.x, 288);
  assert.equal(arena.spawnPoints.player1.facing, 'right');

  for (const fighter of getAllCharacterConfigs()) {
    const groundY = computeCharacterGroundY(arena.bounds.groundY, fighter.render.footOffsetY);
    assert.equal(groundY, arena.bounds.groundY);

    const standingOffset = computePhysicsBodyOffset(
      fighter.sprite.frameWidth,
      fighter.sprite.frameHeight,
      fighter.physics.standingBody.width,
      fighter.physics.standingBody.height,
    );
    const crouchingOffset = computePhysicsBodyOffset(
      fighter.sprite.frameWidth,
      fighter.sprite.frameHeight,
      fighter.physics.crouchingBody.width,
      fighter.physics.crouchingBody.height,
    );

    assert.equal(standingOffset.offsetY + fighter.physics.standingBody.height, 144);
    assert.equal(crouchingOffset.offsetY + fighter.physics.crouchingBody.height, 144);
  }
});
