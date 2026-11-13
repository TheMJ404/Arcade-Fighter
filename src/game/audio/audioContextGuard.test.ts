import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyWebAudioPrototypeGuards,
  canModifyAudioContext,
  safeResumeAudioContext,
  safeSuspendAudioContext,
  type AudioContextLike,
} from './audioContextGuard';

test('canModifyAudioContext rejects null, undefined, and closed AudioContexts', () => {
  assert.equal(canModifyAudioContext(null), false);
  assert.equal(canModifyAudioContext(undefined), false);
  assert.equal(canModifyAudioContext({state: 'closed'}), false);
  assert.equal(canModifyAudioContext({state: 'suspended'}), true);
  assert.equal(canModifyAudioContext({state: 'running'}), true);
});

test('safeSuspendAudioContext and safeResumeAudioContext skip closed contexts and swallow async rejections', async () => {
  let called = false;
  const closedContext: AudioContextLike = {
    state: 'closed',
    suspend: async () => {
      called = true;
      throw new Error('Cannot suspend a closed AudioContext.');
    },
    resume: async () => {
      called = true;
      throw new Error('Cannot resume a closed AudioContext.');
    },
  };

  safeSuspendAudioContext(closedContext);
  safeResumeAudioContext(closedContext);
  assert.equal(called, false);

  const rejectingOpenContext: AudioContextLike = {
    state: 'running',
    suspend: () => Promise.reject(new Error('Cannot suspend a closed AudioContext.')),
    resume: () => Promise.reject(new Error('Cannot resume a closed AudioContext.')),
  };

  // Should not throw synchronously or trigger unhandled rejections
  safeSuspendAudioContext(rejectingOpenContext);
  safeResumeAudioContext(rejectingOpenContext);
  await new Promise((resolve) => setTimeout(resolve, 10));
});

test('applyWebAudioPrototypeGuards cancels pending onGameVisible timer on destroy and blocks blur/focus after destroy', async () => {
  let suspendCount = 0;
  let resumeCount = 0;
  let originalDestroyCalled = false;

  const proto = {
    context: {
      state: 'suspended',
      suspend: async () => {
        suspendCount += 1;
      },
      resume: async () => {
        resumeCount += 1;
      },
    } as AudioContextLike,
    locked: false,
    unlocked: false,
    game: {},
    destroy() {
      originalDestroyCalled = true;
      this.context = {
        state: 'closed',
        suspend: async () => {
          throw new Error('Cannot suspend a closed AudioContext.');
        },
        resume: async () => {
          throw new Error('Cannot resume a closed AudioContext.');
        },
      };
    },
  };

  applyWebAudioPrototypeGuards(proto);

  const instance = Object.create(proto);
  instance.onGameVisible();
  instance.destroy();

  // Attempting blur/focus after destroy must be a no-op
  instance.onBlur();
  instance.onFocus();

  await new Promise((resolve) => setTimeout(resolve, 140));

  assert.equal(originalDestroyCalled, true);
  assert.equal(suspendCount, 0);
  assert.equal(resumeCount, 0);
});
