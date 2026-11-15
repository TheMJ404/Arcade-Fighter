import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_DIRECTIONAL_INPUT,
  mergeDirectionalInputs,
  resolveHorizontalAxis,
} from './inputTypes';
import {VirtualInputBridge} from './virtualInputBridge';

test('resolveHorizontalAxis cancels opposing left and right inputs cleanly', () => {
  assert.equal(resolveHorizontalAxis(false, false), 0);
  assert.equal(resolveHorizontalAxis(true, false), -1);
  assert.equal(resolveHorizontalAxis(false, true), 1);
  assert.equal(resolveHorizontalAxis(true, true), 0);
});

test('mergeDirectionalInputs supports simultaneous keyboard and touch combat inputs', () => {
  const merged = mergeDirectionalInputs(
    {...EMPTY_DIRECTIONAL_INPUT, right: true, run: true},
    {...EMPTY_DIRECTIONAL_INPUT, jump: true, lightPunch: true},
  );
  assert.deepEqual(merged, {
    ...EMPTY_DIRECTIONAL_INPUT,
    right: true,
    jump: true,
    run: true,
    lightPunch: true,
  });
});

test('VirtualInputBridge tracks held movement and combat buttons and resets cleanly', () => {
  const bridge = new VirtualInputBridge();
  bridge.setButton('left', true);
  bridge.setButton('block', true);
  assert.equal(bridge.getState().left, true);
  assert.equal(bridge.getState().block, true);
  assert.equal(bridge.getState().right, false);

  bridge.reset();
  assert.deepEqual(bridge.getState(), EMPTY_DIRECTIONAL_INPUT);
});
