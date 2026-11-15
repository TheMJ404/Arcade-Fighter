import Phaser from 'phaser';
import {
  EMPTY_DIRECTIONAL_INPUT,
  mergeDirectionalInputs,
  type DirectionalInputState,
  type FighterInputSnapshot,
} from './inputTypes';
import {virtualInputBridge} from './virtualInputBridge';

interface BoundKeys {
  leftA: Phaser.Input.Keyboard.Key;
  leftArrow: Phaser.Input.Keyboard.Key;
  rightD: Phaser.Input.Keyboard.Key;
  rightArrow: Phaser.Input.Keyboard.Key;
  jumpW: Phaser.Input.Keyboard.Key;
  jumpUp: Phaser.Input.Keyboard.Key;
  jumpSpace: Phaser.Input.Keyboard.Key;
  crouchS: Phaser.Input.Keyboard.Key;
  crouchDown: Phaser.Input.Keyboard.Key;
  shift: Phaser.Input.Keyboard.Key;
  lightPunchJ: Phaser.Input.Keyboard.Key;
  heavyPunchK: Phaser.Input.Keyboard.Key;
  lightKickU: Phaser.Input.Keyboard.Key;
  heavyKickI: Phaser.Input.Keyboard.Key;
  blockL: Phaser.Input.Keyboard.Key;
}

const CAPTURED_KEY_CODES = [
  Phaser.Input.Keyboard.KeyCodes.W,
  Phaser.Input.Keyboard.KeyCodes.A,
  Phaser.Input.Keyboard.KeyCodes.S,
  Phaser.Input.Keyboard.KeyCodes.D,
  Phaser.Input.Keyboard.KeyCodes.UP,
  Phaser.Input.Keyboard.KeyCodes.DOWN,
  Phaser.Input.Keyboard.KeyCodes.LEFT,
  Phaser.Input.Keyboard.KeyCodes.RIGHT,
  Phaser.Input.Keyboard.KeyCodes.SPACE,
  Phaser.Input.Keyboard.KeyCodes.J,
  Phaser.Input.Keyboard.KeyCodes.K,
  Phaser.Input.Keyboard.KeyCodes.U,
  Phaser.Input.Keyboard.KeyCodes.I,
  Phaser.Input.Keyboard.KeyCodes.L,
];

/**
 * Unified Phaser input coordinator combining desktop keyboard controls and
 * mobile touch controls via VirtualInputBridge. Handles key capture to stop
 * browser scrolling/shortcuts and resets stuck inputs on window blur / tab switch.
 */
export class InputManager {
  private readonly scene: Phaser.Scene;
  private readonly keys: BoundKeys | null;
  private prevJumpHeld = false;
  private prevLightPunchHeld = false;
  private prevHeavyPunchHeld = false;
  private prevLightKickHeld = false;
  private prevHeavyKickHeld = false;
  private destroyed = false;

  private readonly handleWindowBlur = (): void => {
    this.resetAllInputs();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.resetAllInputs();
    }
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const keyboard = scene.input.keyboard;

    if (keyboard) {
      keyboard.addCapture(CAPTURED_KEY_CODES);
      this.keys = {
        leftA: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A, true, false),
        leftArrow: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT, true, false),
        rightD: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D, true, false),
        rightArrow: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT, true, false),
        jumpW: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W, true, false),
        jumpUp: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP, true, false),
        jumpSpace: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, true, false),
        crouchS: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S, true, false),
        crouchDown: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN, true, false),
        shift: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT, false, false),
        lightPunchJ: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J, true, false),
        heavyPunchK: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K, true, false),
        lightKickU: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U, true, false),
        heavyKickI: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I, true, false),
        blockL: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L, true, false),
      };
    } else {
      this.keys = null;
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('blur', this.handleWindowBlur);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  sample(): FighterInputSnapshot {
    if (this.destroyed) {
      return {
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
    }

    const keyboardState: DirectionalInputState = this.keys
      ? {
          left: this.keys.leftA.isDown || this.keys.leftArrow.isDown,
          right: this.keys.rightD.isDown || this.keys.rightArrow.isDown,
          jump:
            this.keys.jumpW.isDown ||
            this.keys.jumpUp.isDown ||
            this.keys.jumpSpace.isDown,
          crouch: this.keys.crouchS.isDown || this.keys.crouchDown.isDown,
          run: this.keys.shift.isDown,
          lightPunch: this.keys.lightPunchJ.isDown,
          heavyPunch: this.keys.heavyPunchK.isDown,
          lightKick: this.keys.lightKickU.isDown,
          heavyKick: this.keys.heavyKickI.isDown,
          block: this.keys.blockL.isDown,
        }
      : EMPTY_DIRECTIONAL_INPUT;

    const merged = mergeDirectionalInputs(keyboardState, virtualInputBridge.getState());

    const jumpJustPressed = merged.jump && !this.prevJumpHeld;
    const lightPunchJustPressed = merged.lightPunch && !this.prevLightPunchHeld;
    const heavyPunchJustPressed = merged.heavyPunch && !this.prevHeavyPunchHeld;
    const lightKickJustPressed = merged.lightKick && !this.prevLightKickHeld;
    const heavyKickJustPressed = merged.heavyKick && !this.prevHeavyKickHeld;

    this.prevJumpHeld = merged.jump;
    this.prevLightPunchHeld = merged.lightPunch;
    this.prevHeavyPunchHeld = merged.heavyPunch;
    this.prevLightKickHeld = merged.lightKick;
    this.prevHeavyKickHeld = merged.heavyKick;

    return {
      left: merged.left,
      right: merged.right,
      jumpHeld: merged.jump,
      jumpJustPressed,
      crouch: merged.crouch,
      run: merged.run,
      lightPunchJustPressed,
      heavyPunchJustPressed,
      lightKickJustPressed,
      heavyKickJustPressed,
      blockHeld: merged.block,
    };
  }

  resetAllInputs(): void {
    this.prevJumpHeld = false;
    this.prevLightPunchHeld = false;
    this.prevHeavyPunchHeld = false;
    this.prevLightKickHeld = false;
    this.prevHeavyKickHeld = false;
    this.scene.input.keyboard?.resetKeys();
    virtualInputBridge.reset();
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;

    this.resetAllInputs();

    if (typeof window !== 'undefined') {
      window.removeEventListener('blur', this.handleWindowBlur);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    const keyboard = this.scene.input.keyboard;
    if (keyboard && this.keys) {
      keyboard.removeCapture(CAPTURED_KEY_CODES);
      for (const key of Object.values(this.keys)) {
        keyboard.removeKey(key, true);
      }
    }
  }
}
