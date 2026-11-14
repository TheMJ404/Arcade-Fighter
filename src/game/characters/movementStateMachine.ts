import {resolveHorizontalAxis, type FighterInputSnapshot} from '../input/inputTypes';

export type FighterMovementState =
  | 'idle'
  | 'walking'
  | 'running'
  | 'jumping'
  | 'crouching';

export interface MovementEvaluationParams {
  input: FighterInputSnapshot;
  onGround: boolean;
  currentFacing: 'left' | 'right';
  walkSpeed: number;
  runSpeed: number;
  jumpVelocity: number;
  autoFaceOpponent: boolean;
}

export interface MovementDecision {
  state: FighterMovementState;
  targetVelocityX: number;
  shouldJump: boolean;
  jumpVelocityY: number;
  facing: 'left' | 'right';
  isCrouching: boolean;
  animationKeyName: 'idle' | 'walk' | 'run' | 'jump' | 'crouch';
}

const STATE_TO_ANIMATION: Record<
  FighterMovementState,
  'idle' | 'walk' | 'run' | 'jump' | 'crouch'
> = {
  idle: 'idle',
  walking: 'walk',
  running: 'run',
  jumping: 'jump',
  crouching: 'crouch',
};

/**
 * Pure deterministic movement and animation state evaluator for a 2D arcade fighter.
 * Priority: Jumping (airborne or jump takeoff) > Crouching (grounded) > Running/Walking > Idle.
 */
export function evaluateFighterMovement(params: MovementEvaluationParams): MovementDecision {
  const {
    input,
    onGround,
    currentFacing,
    walkSpeed,
    runSpeed,
    jumpVelocity,
    autoFaceOpponent,
  } = params;

  const axis = resolveHorizontalAxis(input.left, input.right);

  let facing: 'left' | 'right' = currentFacing;
  if (!autoFaceOpponent && axis !== 0) {
    facing = axis > 0 ? 'right' : 'left';
  }

  // Trigger a single jump only when grounded, not crouching, and jump was freshly pressed
  const shouldJump = onGround && !input.crouch && input.jumpJustPressed;

  if (!onGround || shouldJump) {
    const airSpeed = input.run ? runSpeed : walkSpeed;
    return {
      state: 'jumping',
      targetVelocityX: axis * airSpeed,
      shouldJump,
      jumpVelocityY: shouldJump ? jumpVelocity : 0,
      facing,
      isCrouching: false,
      animationKeyName: STATE_TO_ANIMATION.jumping,
    };
  }

  if (input.crouch) {
    return {
      state: 'crouching',
      targetVelocityX: 0,
      shouldJump: false,
      jumpVelocityY: 0,
      facing,
      isCrouching: true,
      animationKeyName: STATE_TO_ANIMATION.crouching,
    };
  }

  if (axis !== 0) {
    const state: FighterMovementState = input.run ? 'running' : 'walking';
    const speed = input.run ? runSpeed : walkSpeed;
    return {
      state,
      targetVelocityX: axis * speed,
      shouldJump: false,
      jumpVelocityY: 0,
      facing,
      isCrouching: false,
      animationKeyName: STATE_TO_ANIMATION[state],
    };
  }

  return {
    state: 'idle',
    targetVelocityX: 0,
    shouldJump: false,
    jumpVelocityY: 0,
    facing,
    isCrouching: false,
    animationKeyName: STATE_TO_ANIMATION.idle,
  };
}
