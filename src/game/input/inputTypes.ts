export type VirtualControlButton = 'left' | 'right' | 'jump' | 'crouch';

export interface DirectionalInputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  crouch: boolean;
  run: boolean;
}

export interface FighterInputSnapshot {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  crouch: boolean;
  run: boolean;
}

export const EMPTY_DIRECTIONAL_INPUT: DirectionalInputState = {
  left: false,
  right: false,
  jump: false,
  crouch: false,
  run: false,
};

/**
 * Resolves conflicting left/right directional inputs cleanly to -1, 0, or 1.
 */
export function resolveHorizontalAxis(left: boolean, right: boolean): -1 | 0 | 1 {
  if (left === right) {
    return 0;
  }
  return right ? 1 : -1;
}

/**
 * Combines keyboard and touch input states so either source can drive movement
 * simultaneously without overwriting the other.
 */
export function mergeDirectionalInputs(
  keyboard: DirectionalInputState,
  touch: DirectionalInputState,
): DirectionalInputState {
  return {
    left: keyboard.left || touch.left,
    right: keyboard.right || touch.right,
    jump: keyboard.jump || touch.jump,
    crouch: keyboard.crouch || touch.crouch,
    run: keyboard.run || touch.run,
  };
}
