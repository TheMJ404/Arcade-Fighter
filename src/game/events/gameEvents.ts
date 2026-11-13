/**
 * Typed publish/subscribe bridge for decoupled communication between Phaser scenes
 * and React components. Keeps Phaser internals out of React state.
 */

export interface GameEventMap {
  'scene:ready': {
    sceneKey: string;
    width: number;
    height: number;
    arenaId?: string;
    groundY?: number;
    characters?: Array<{
      id: string;
      x: number;
      y: number;
      facing: 'left' | 'right';
      animationKey: string;
    }>;
  };
  'viewport:resized': {width: number; height: number};
  'game:destroyed': {timestamp: number};
}

export type GameEventName = keyof GameEventMap;
export type GameEventListener<K extends GameEventName> = (payload: GameEventMap[K]) => void;

export class GameEventBus {
  private listeners = new Map<GameEventName, Set<GameEventListener<never>>>();

  on<K extends GameEventName>(event: K, listener: GameEventListener<K>): () => void {
    let eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      eventListeners = new Set();
      this.listeners.set(event, eventListeners);
    }

    eventListeners.add(listener as GameEventListener<never>);

    return () => {
      this.off(event, listener);
    };
  }

  off<K extends GameEventName>(event: K, listener: GameEventListener<K>): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return;
    }

    eventListeners.delete(listener as GameEventListener<never>);
    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<K extends GameEventName>(event: K, payload: GameEventMap[K]): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return;
    }

    // Iterate over a snapshot so unsubscribes inside listeners are safe
    for (const listener of [...eventListeners]) {
      (listener as GameEventListener<K>)(payload);
    }
  }

  listenerCount(event?: GameEventName): number {
    if (event) {
      return this.listeners.get(event)?.size ?? 0;
    }

    let total = 0;
    for (const set of this.listeners.values()) {
      total += set.size;
    }
    return total;
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const gameEvents = new GameEventBus();
