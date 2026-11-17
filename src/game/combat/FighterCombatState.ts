import type {FighterInputSnapshot} from '../input/inputTypes';
import {AttackController} from './AttackController';
import {resolveAttackDefinition} from './AttackRegistry';
import {evaluateBlockState} from './BlockingSystem';
import type {
  AttackDefinition,
  AttackId,
  AttackPhase,
  CharacterAttackOverrides,
  CombatState,
} from './combatTypes';
import {applyHealthChange, isHealthDepleted} from './DamageSystem';

export type FighterCombatAnimationKey =
  | 'lightPunch'
  | 'heavyPunch'
  | 'lightKick'
  | 'heavyKick'
  | 'block'
  | 'hit'
  | null;

export interface FighterCombatStepResult {
  combatState: CombatState;
  attackPhase: AttackPhase;
  currentAttackId: AttackId | null;
  animationKeyName: FighterCombatAnimationKey;
  locksMovement: boolean;
  isBlocking: boolean;
  isDefeated: boolean;
}

/**
 * Pure per-fighter combat coordinator managing health, hitstun/blockstun timers,
 * attack lifecycle, defensive blocking, and combat/movement integration priority.
 */
export class FighterCombatState {
  private readonly maxHealth: number;
  private readonly attackOverrides?: CharacterAttackOverrides;
  private health: number;
  private readonly attackController = new AttackController();
  private stunRemainingMs = 0;
  private stunKind: 'hit' | 'block' = 'hit';
  private blocking = false;

  constructor(maxHealth: number, attackOverrides?: CharacterAttackOverrides) {
    this.maxHealth = Math.max(1, maxHealth);
    this.attackOverrides = attackOverrides;
    this.health = this.maxHealth;
  }

  step(
    deltaMs: number,
    input: FighterInputSnapshot,
    onGround: boolean,
  ): FighterCombatStepResult {
    const safeDelta = Math.max(0, deltaMs);

    if (this.isDefeated()) {
      this.blocking = false;
      this.stunRemainingMs = 0;
      this.attackController.interrupt();
      return {
        combatState: 'defeated',
        attackPhase: 'ready',
        currentAttackId: null,
        animationKeyName: 'hit',
        locksMovement: true,
        isBlocking: false,
        isDefeated: true,
      };
    }

    if (this.stunRemainingMs > 0) {
      this.stunRemainingMs = Math.max(0, this.stunRemainingMs - safeDelta);
      if (this.stunRemainingMs > 0) {
        this.blocking = this.stunKind === 'block' && input.blockHeld && onGround;
        return {
          combatState: this.stunKind === 'block' ? 'blocking' : 'hitstun',
          attackPhase: 'ready',
          currentAttackId: null,
          animationKeyName: this.stunKind === 'block' ? 'block' : 'hit',
          locksMovement: true,
          isBlocking: this.stunKind === 'block',
          isDefeated: false,
        };
      }
    }

    this.attackController.update(safeDelta);

    const isAttacking = this.attackController.isBusy();
    const blockEval = evaluateBlockState({
      blockHeld: input.blockHeld,
      onGround,
      isAttacking,
      isInHitstun: false,
      isDefeated: false,
    });

    this.blocking = blockEval.isBlocking;

    if (!isAttacking && this.attackController.canStartAttack(blockEval.canStartAttack)) {
      const requestedAttack = this.pickRequestedAttack(input);
      if (requestedAttack) {
        this.attackController.startAttack(requestedAttack);
        this.blocking = false;
      }
    }

    const activeAttack = this.attackController.getCurrentAttack();
    const phase = this.attackController.getSnapshot().phase;

    if (activeAttack) {
      return {
        combatState: 'attacking',
        attackPhase: phase,
        currentAttackId: activeAttack.id,
        animationKeyName: activeAttack.animationKeyName,
        locksMovement: true,
        isBlocking: false,
        isDefeated: false,
      };
    }

    if (this.blocking) {
      return {
        combatState: 'blocking',
        attackPhase: 'ready',
        currentAttackId: null,
        animationKeyName: 'block',
        locksMovement: true,
        isBlocking: true,
        isDefeated: false,
      };
    }

    return {
      combatState: 'none',
      attackPhase: 'ready',
      currentAttackId: null,
      animationKeyName: null,
      locksMovement: false,
      isBlocking: false,
      isDefeated: false,
    };
  }

  applyImpact(impact: {
    damage: number;
    wasBlocked: boolean;
    stunDurationMs: number;
  }): {remainingHealth: number; defeated: boolean} {
    this.health = applyHealthChange(this.health, this.maxHealth, impact.damage);
    const defeated = isHealthDepleted(this.health);

    if (!impact.wasBlocked || defeated) {
      this.attackController.interrupt();
      this.blocking = false;
      this.stunKind = 'hit';
      this.stunRemainingMs = Math.max(0, impact.stunDurationMs);
    } else {
      this.stunKind = 'block';
      this.stunRemainingMs = Math.max(0, impact.stunDurationMs);
    }

    return {remainingHealth: this.health, defeated};
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  isBlocking(): boolean {
    return this.blocking;
  }

  isDefeated(): boolean {
    return isHealthDepleted(this.health);
  }

  getAttackController(): AttackController {
    return this.attackController;
  }

  private pickRequestedAttack(input: FighterInputSnapshot): AttackDefinition | null {
    if (input.heavyKickJustPressed) {
      return resolveAttackDefinition('heavy-kick', this.attackOverrides);
    }
    if (input.lightKickJustPressed) {
      return resolveAttackDefinition('light-kick', this.attackOverrides);
    }
    if (input.heavyPunchJustPressed) {
      return resolveAttackDefinition('heavy-punch', this.attackOverrides);
    }
    if (input.lightPunchJustPressed) {
      return resolveAttackDefinition('light-punch', this.attackOverrides);
    }
    return null;
  }
}
