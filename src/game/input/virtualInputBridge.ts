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
  }
}

export const virtualInputBridge = new VirtualInputBridge();
