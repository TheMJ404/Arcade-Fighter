import type {DirectionalInputState, VirtualControlButton} from './inputTypes';

/**
 * Bridges React virtual touch controls to Phaser's frame-based InputManager
 * without triggering React re-renders on every input frame.
 */
export class VirtualInputBridge {
  private state: DirectionalInputState = {
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

  setButton(button: VirtualControlButton, pressed: boolean): void {
    this.state[button] = pressed;
  }

  getState(): DirectionalInputState {
    return {...this.state};
  }

  reset(): void {
    this.state.left = false;
    this.state.right = false;
    this.state.jump = false;
    this.state.crouch = false;
    this.state.run = false;
    this.state.lightPunch = false;
    this.state.heavyPunch = false;
    this.state.lightKick = false;
    this.state.heavyKick = false;
    this.state.block = false;
  }
}

export const virtualInputBridge = new VirtualInputBridge();
