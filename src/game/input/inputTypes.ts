export type VirtualControlButton =
  | 'left'
  | 'right'
  | 'jump'
  | 'crouch'
  | 'lightPunch'
  | 'heavyPunch'
  | 'lightKick'
  | 'heavyKick'
  | 'block';

export interface DirectionalInputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  crouch: boolean;
  run: boolean;
  lightPunch: boolean;
  heavyPunch: boolean;
  lightKick: boolean;
  heavyKick: boolean;
  block: boolean;
}

export interface FighterInputSnapshot {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  crouch: boolean;
  run: boolean;
  lightPunchJustPressed: boolean;
  heavyPunchJustPressed: boolean;
  lightKickJustPressed: boolean;
  heavyKickJustPressed: boolean;
  blockHeld: boolean;
}

export const EMPTY_DIRECTIONAL_INPUT: DirectionalInputState = {
  left: false,
  right: false,
  jump: false,
  crouch: false,
  run: false,
  lightPunch: false,
  heavyPunch: false,
  lightKick: false,
  heavyKick: false,
  block: false,
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
 * and combat actions simultaneously without overwriting the other.
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
    lightPunch: keyboard.lightPunch || touch.lightPunch,
    heavyPunch: keyboard.heavyPunch || touch.heavyPunch,
    lightKick: keyboard.lightKick || touch.lightKick,
    heavyKick: keyboard.heavyKick || touch.heavyKick,
    block: keyboard.block || touch.block,
  };
}
