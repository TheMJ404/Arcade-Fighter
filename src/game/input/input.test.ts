import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeDirectionalInputs, resolveHorizontalAxis} from './inputTypes';
import {VirtualInputBridge} from './virtualInputBridge';

test('resolveHorizontalAxis cancels opposing left and right inputs cleanly', () => {
  assert.equal(resolveHorizontalAxis(false, false), 0);
  assert.equal(resolveHorizontalAxis(true, false), -1);
  assert.equal(resolveHorizontalAxis(false, true), 1);
  assert.equal(resolveHorizontalAxis(true, true), 0);
});

test('mergeDirectionalInputs supports simultaneous keyboard and touch inputs', () => {
  const merged = mergeDirectionalInputs(
    {left: false, right: true, jump: false, crouch: false, run: true},
    {left: false, right: false, jump: true, crouch: false, run: false},
  );

  assert.deepEqual(merged, {
    left: false,
    right: true,
    jump: true,
    crouch: false,
    run: true,
  });
});

test('VirtualInputBridge tracks held touch buttons and resets cleanly', () => {
  const bridge = new VirtualInputBridge();

  bridge.setButton('right', true);
  bridge.setButton('jump', true);
  assert.deepEqual(bridge.getState(), {
    left: false,
    right: true,
    jump: true,
    crouch: false,
    run: false,
  });

  bridge.setButton('right', false);
  assert.equal(bridge.getState().right, false);
  assert.equal(bridge.getState().jump, true);

  bridge.reset();
  assert.deepEqual(bridge.getState(), {
    left: false,
    right: false,
    jump: false,
    crouch: false,
    run: false,
  });
});
