import test from 'node:test';
import assert from 'node:assert/strict';
import type {FighterInputSnapshot} from '../input/inputTypes';
import {evaluateFighterMovement} from './movementStateMachine';

const BASE_PARAMS = {
  onGround: true,
  currentFacing: 'right' as const,
  walkSpeed: 240,
  runSpeed: 410,
  jumpVelocity: -640,
  autoFaceOpponent: false,
};

const EMPTY_INPUT: FighterInputSnapshot = {
  left: false,
  right: false,
  jumpHeld: false,
  jumpJustPressed: false,
  crouch: false,
  run: false,
  lightPunchJustPressed: false,
  heavyPunchJustPressed: false,
  lightKickJustPressed: false,
  heavyKickJustPressed: false,
  blockHeld: false,
};

test('defaults to idle when grounded with no input and preserves last facing', () => {
  const decision = evaluateFighterMovement({
    ...BASE_PARAMS,
    currentFacing: 'left',
    input: {...EMPTY_INPUT},
  });

  assert.equal(decision.state, 'idle');
  assert.equal(decision.targetVelocityX, 0);
  assert.equal(decision.facing, 'left');
  assert.equal(decision.shouldJump, false);
  assert.equal(decision.isCrouching, false);
});

test('walks left/right and runs when Shift is held', () => {
  const walkLeft = evaluateFighterMovement({
    ...BASE_PARAMS,
    input: {...EMPTY_INPUT, left: true},
  });
  assert.equal(walkLeft.state, 'walking');
  assert.equal(walkLeft.targetVelocityX, -240);
  assert.equal(walkLeft.facing, 'left');

  const runRight = evaluateFighterMovement({
    ...BASE_PARAMS,
    currentFacing: 'left',
    input: {...EMPTY_INPUT, right: true, run: true},
  });
  assert.equal(runRight.state, 'running');
  assert.equal(runRight.targetVelocityX, 410);
  assert.equal(runRight.facing, 'right');
});

test('crouch shrinks stance and stops horizontal movement on ground', () => {
  const crouch = evaluateFighterMovement({
    ...BASE_PARAMS,
    input: {...EMPTY_INPUT, right: true, crouch: true, run: true},
  });
  assert.equal(crouch.state, 'crouching');
  assert.equal(crouch.isCrouching, true);
  assert.equal(crouch.targetVelocityX, 0);
  assert.equal(crouch.shouldJump, false);
});

test('prevents infinite jumping while airborne and gives jump priority over walk/crouch', () => {
  const takeoff = evaluateFighterMovement({
    ...BASE_PARAMS,
    input: {...EMPTY_INPUT, right: true, jumpHeld: true, jumpJustPressed: true},
  });
  assert.equal(takeoff.state, 'jumping');
  assert.equal(takeoff.shouldJump, true);
  assert.equal(takeoff.jumpVelocityY, -640);
  assert.equal(takeoff.targetVelocityX, 240);

  const airborneAttempt = evaluateFighterMovement({
    ...BASE_PARAMS,
    onGround: false,
    input: {...EMPTY_INPUT, jumpHeld: true, jumpJustPressed: true, crouch: true},
  });
  assert.equal(airborneAttempt.state, 'jumping');
  assert.equal(airborneAttempt.shouldJump, false);
  assert.equal(airborneAttempt.isCrouching, false);
});
