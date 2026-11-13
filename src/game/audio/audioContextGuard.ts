/**
 * Guards Phaser 3.90.0's WebAudioSoundManager against calling suspend()/resume()
 * on an already-closed AudioContext (for example during React StrictMode
 * unmount/remount, tab visibility switches, or orphaned unlock listeners).
 */

export interface AudioContextLike {
  state: 'suspended' | 'running' | 'closed' | 'interrupted' | string;
  suspend?: () => Promise<void>;
  resume?: () => Promise<void>;
  close?: () => Promise<void>;
}

export function canModifyAudioContext(
  context: AudioContextLike | null | undefined,
): context is AudioContextLike {
  return Boolean(context && context.state !== 'closed');
}

export function safeSuspendAudioContext(context: AudioContextLike | null | undefined): void {
  if (!canModifyAudioContext(context) || typeof context.suspend !== 'function') {
    return;
  }

  try {
    const result = context.suspend();
    if (result && typeof result.catch === 'function') {
      result.catch(() => {
        // Ignore late rejections if the AudioContext closes concurrently
      });
    }
  } catch {
    // Ignore synchronous InvalidStateError if AudioContext closed between checks
  }
}

export function safeResumeAudioContext(context: AudioContextLike | null | undefined): void {
  if (!canModifyAudioContext(context) || typeof context.resume !== 'function') {
    return;
  }

  try {
    const result = context.resume();
    if (result && typeof result.catch === 'function') {
      result.catch(() => {
        // Ignore late rejections if the AudioContext closes concurrently or lacks gesture
      });
    }
  } catch {
    // Ignore synchronous InvalidStateError if AudioContext closed between checks
  }
}

interface GuardedSoundManager {
  context: AudioContextLike | null;
  locked: boolean;
  unlocked: boolean;
  game: unknown;
  __visibleTimerId?: number | null;
  __destroyed?: boolean;
  __cleanupUnlock?: (() => void) | null;
  onGameVisible?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
  unlock?: () => void;
  destroy?: () => void;
}

interface GuardedPrototype extends GuardedSoundManager {
  __arcadeFighterAudioGuarded?: boolean;
}

export function applyWebAudioPrototypeGuards(proto: GuardedPrototype | undefined): void {
  if (!proto || proto.__arcadeFighterAudioGuarded) {
    return;
  }

  proto.__arcadeFighterAudioGuarded = true;

  const originalDestroy = proto.destroy;

  proto.onGameVisible = function onGameVisibleGuarded(this: GuardedSoundManager) {
    if (this.__destroyed) {
      return;
    }

    if (this.__visibleTimerId != null && typeof window !== 'undefined') {
      window.clearTimeout(this.__visibleTimerId);
    }

    const schedule = typeof window !== 'undefined' ? window.setTimeout : setTimeout;
    this.__visibleTimerId = schedule(() => {
      this.__visibleTimerId = null;
      if (this.__destroyed || !this.game || !canModifyAudioContext(this.context)) {
        return;
      }

      // Preserve Phaser's iOS visibility workaround only while context is still open
      safeSuspendAudioContext(this.context);
      safeResumeAudioContext(this.context);
    }, 100) as unknown as number;
  };

  proto.onBlur = function onBlurGuarded(this: GuardedSoundManager) {
    if (this.__destroyed || this.locked) {
      return;
    }
    safeSuspendAudioContext(this.context);
  };

  proto.onFocus = function onFocusGuarded(this: GuardedSoundManager) {
    if (this.__destroyed || this.locked) {
      return;
    }
    const context = this.context;
    if (
      canModifyAudioContext(context) &&
      (context.state === 'suspended' || context.state === 'interrupted')
    ) {
      safeResumeAudioContext(context);
    }
  };

  proto.unlock = function unlockGuarded(this: GuardedSoundManager) {
    if (this.__destroyed || typeof document === 'undefined' || !document.body) {
      return;
    }

    const body = document.body;
    const events = ['touchstart', 'touchend', 'mousedown', 'mouseup', 'keydown'] as const;

    const removeListeners = () => {
      for (const eventName of events) {
        body.removeEventListener(eventName, unlockHandler, false);
      }
      this.__cleanupUnlock = null;
    };

    const unlockHandler = () => {
      if (this.__destroyed || !canModifyAudioContext(this.context)) {
        removeListeners();
        return;
      }

      try {
        const resumePromise = this.context.resume?.();
        if (resumePromise && typeof resumePromise.then === 'function') {
          resumePromise.then(
            () => {
              this.unlocked = true;
              removeListeners();
            },
            () => {
              removeListeners();
            },
          );
        } else {
          removeListeners();
        }
      } catch {
        removeListeners();
      }
    };

    this.__cleanupUnlock = removeListeners;
    for (const eventName of events) {
      body.addEventListener(eventName, unlockHandler, false);
    }
  };

  proto.destroy = function destroyGuarded(this: GuardedSoundManager) {
    this.__destroyed = true;

    if (this.__visibleTimerId != null && typeof window !== 'undefined') {
      window.clearTimeout(this.__visibleTimerId);
      this.__visibleTimerId = null;
    }

    if (this.__cleanupUnlock) {
      this.__cleanupUnlock();
    }

    if (typeof originalDestroy === 'function') {
      originalDestroy.call(this);
    }
  };
}
