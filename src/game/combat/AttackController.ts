import {getAttackTotalDurationMs} from './AttackRegistry';
import type {
  AttackControllerSnapshot,
  AttackDefinition,
  AttackId,
  AttackPhase,
} from './combatTypes';

/**
 * Deterministic state machine for a single fighter's attack lifecycle:
 * ready -> startup -> active -> recovery -> ready.
 * Tracks per-activation target hits so each attack activation hits a target once.
 */
export class AttackController {
  private currentAttack: AttackDefinition | null = null;
  private elapsedMs = 0;
  private phase: AttackPhase = 'ready';
  private activationId = 0;
  private readonly hitTargetIds = new Set<string>();

  canStartAttack(canAct: boolean): boolean {
    return canAct && this.phase === 'ready' && this.currentAttack === null;
  }

  startAttack(attack: AttackDefinition): boolean {
    if (this.phase !== 'ready' || this.currentAttack !== null) {
      return false;
    }

    this.currentAttack = attack;
    this.elapsedMs = 0;
    this.activationId += 1;
    this.hitTargetIds.clear();
    this.phase = attack.startupMs > 0 ? 'startup' : 'active';
    return true;
  }

  update(deltaMs: number): AttackPhase {
    if (!this.currentAttack || this.phase === 'ready') {
      return 'ready';
    }

    const safeDelta = Math.max(0, deltaMs);
    this.elapsedMs += safeDelta;

    const {startupMs, activeMs} = this.currentAttack;
    const totalMs = getAttackTotalDurationMs(this.currentAttack);

    if (this.elapsedMs >= totalMs) {
      this.resetToReady();
      return 'ready';
    }

    if (this.elapsedMs < startupMs) {
      this.phase = 'startup';
    } else if (this.elapsedMs < startupMs + activeMs) {
      this.phase = 'active';
    } else {
      this.phase = 'recovery';
    }

    return this.phase;
  }

  interrupt(): void {
    this.resetToReady();
  }

  isBusy(): boolean {
    return this.phase !== 'ready' && this.currentAttack !== null;
  }

  isHitboxActive(): boolean {
    return this.phase === 'active' && this.currentAttack !== null;
  }

  getCurrentAttack(): AttackDefinition | null {
    return this.currentAttack;
  }

  getCurrentAttackId(): AttackId | null {
    return this.currentAttack?.id ?? null;
  }

  getActivationId(): number {
    return this.activationId;
  }

  hasHitTarget(targetId: string): boolean {
    return this.hitTargetIds.has(targetId);
  }

  markTargetHit(targetId: string): void {
    this.hitTargetIds.add(targetId);
  }

  getSnapshot(): AttackControllerSnapshot {
    return {
      phase: this.phase,
      attackId: this.currentAttack?.id ?? null,
      activationId: this.activationId,
      elapsedMs: Math.round(this.elapsedMs * 100) / 100,
      totalDurationMs: this.currentAttack
        ? getAttackTotalDurationMs(this.currentAttack)
        : 0,
      hitboxActive: this.isHitboxActive(),
    };
  }

  private resetToReady(): void {
    this.currentAttack = null;
    this.elapsedMs = 0;
    this.phase = 'ready';
    this.hitTargetIds.clear();
  }
}
