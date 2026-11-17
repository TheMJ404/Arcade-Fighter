import {
  DEFAULT_COMBAT_CONFIG,
  type CombatBalanceConfig,
} from './combatConfig';
import type {
  AttackDefinition,
  DamageCalculationResult,
} from './combatTypes';

export interface DamageScalingOptions {
  attackerAttackPower?: number;
  defenderDefense?: number;
}

/**
 * Centralized damage, health clamping, block reduction, and knockback math.
 * Outgoing damage scales by (attackPower / 100) and incoming damage scales
 * inversely by defense via (100 / defense). Defaults (100 / 100) preserve
 * the exact Phase 5 baseline values.
 */
export function calculateAttackDamage(
  attack: AttackDefinition,
  isTargetBlocking: boolean,
  config: CombatBalanceConfig = DEFAULT_COMBAT_CONFIG,
  scaling: DamageScalingOptions = {},
): DamageCalculationResult {
  const baseDamage = Math.max(0, attack.damage);
  const attackPower = Math.max(1, scaling.attackerAttackPower ?? 100);
  const defense = Math.max(1, scaling.defenderDefense ?? 100);
  const scaledDamage =
    baseDamage > 0
      ? Math.max(1, Math.round(baseDamage * (attackPower / 100) * (100 / defense)))
      : 0;

  const effectiveBlock = isTargetBlocking && attack.blockable;

  if (!effectiveBlock) {
    return {
      rawDamage: scaledDamage,
      finalDamage: scaledDamage,
      wasBlocked: false,
      knockbackStrength: attack.knockbackStrength,
      stunDurationMs: attack.hitstunMs,
    };
  }

  const reducedDamage =
    scaledDamage > 0
      ? Math.max(
          config.minimumBlockChipDamage,
          Math.round(scaledDamage * config.blockDamageMultiplier),
        )
      : 0;

  return {
    rawDamage: scaledDamage,
    finalDamage: reducedDamage,
    wasBlocked: true,
    knockbackStrength: Math.round(
      attack.knockbackStrength * config.blockKnockbackMultiplier,
    ),
    stunDurationMs: attack.blockstunMs,
  };
}

export function applyHealthChange(
  currentHealth: number,
  maxHealth: number,
  damage: number,
): number {
  const safeMax = Math.max(1, maxHealth);
  const safeDamage = Math.max(0, damage);
  return Math.max(0, Math.min(safeMax, Math.round(currentHealth - safeDamage)));
}

export function isHealthDepleted(health: number): boolean {
  return health <= 0;
}
