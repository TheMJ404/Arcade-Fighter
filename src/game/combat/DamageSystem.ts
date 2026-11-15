import {
  DEFAULT_COMBAT_CONFIG,
  type CombatBalanceConfig,
} from './combatConfig';
import type {
  AttackDefinition,
  DamageCalculationResult,
} from './combatTypes';

/**
 * Centralized damage, health clamping, block reduction, and knockback math.
 */
export function calculateAttackDamage(
  attack: AttackDefinition,
  isTargetBlocking: boolean,
  config: CombatBalanceConfig = DEFAULT_COMBAT_CONFIG,
): DamageCalculationResult {
  const rawDamage = Math.max(0, attack.damage);
  const effectiveBlock = isTargetBlocking && attack.blockable;

  if (!effectiveBlock) {
    return {
      rawDamage,
      finalDamage: rawDamage,
      wasBlocked: false,
      knockbackStrength: attack.knockbackStrength,
      stunDurationMs: attack.hitstunMs,
    };
  }

  const reducedDamage =
    rawDamage > 0
      ? Math.max(
          config.minimumBlockChipDamage,
          Math.round(rawDamage * config.blockDamageMultiplier),
        )
      : 0;

  return {
    rawDamage,
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
