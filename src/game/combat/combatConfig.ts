export interface CombatBalanceConfig {
  /** Multiplier applied to incoming damage while defender is blocking (0.2 = 80% reduction) */
  blockDamageMultiplier: number;
  /** Multiplier applied to knockback when an attack is blocked */
  blockKnockbackMultiplier: number;
  /** Horizontal drag applied to defenders sliding from knockback */
  knockbackDragX: number;
  /** Minimum chip damage dealt on a blocked blockable attack when raw damage > 0 */
  minimumBlockChipDamage: number;
  trainingOpponent: {
    id: string;
    name: string;
    maxHealth: number;
    bodyWidth: number;
    bodyHeight: number;
    knockbackDragX: number;
  };
}

export const DEFAULT_COMBAT_CONFIG: CombatBalanceConfig = {
  blockDamageMultiplier: 0.2,
  blockKnockbackMultiplier: 0.35,
  knockbackDragX: 2100,
  minimumBlockChipDamage: 1,
  trainingOpponent: {
    id: 'training-dummy',
    name: 'Training Dummy',
    maxHealth: 1000,
    bodyWidth: 96,
    bodyHeight: 224,
    knockbackDragX: 2000,
  },
};
