export type AttackId =
  | 'light-punch'
  | 'heavy-punch'
  | 'light-kick'
  | 'heavy-kick';

export type AttackCategory = 'punch' | 'kick';

export type AttackStrength = 'light' | 'heavy';

export type AttackPhase = 'ready' | 'startup' | 'active' | 'recovery';

export type CombatState = 'none' | 'attacking' | 'blocking' | 'hitstun' | 'defeated';

export type CombatAnimationKeyName =
  | 'lightPunch'
  | 'heavyPunch'
  | 'lightKick'
  | 'heavyKick';

export interface RectBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AttackDefinition {
  id: AttackId;
  displayName: string;
  category: AttackCategory;
  strength: AttackStrength;
  damage: number;
  startupMs: number;
  activeMs: number;
  recoveryMs: number;
  hitboxWidth: number;
  hitboxHeight: number;
  /** Horizontal offset forward from fighter center in world pixels */
  hitboxOffsetX: number;
  /** Vertical offset relative to fighter floor anchor Y (negative = upward) */
  hitboxOffsetY: number;
  knockbackStrength: number;
  hitstunMs: number;
  blockstunMs: number;
  animationKeyName: CombatAnimationKeyName;
  blockable: boolean;
}

export interface AttackControllerSnapshot {
  phase: AttackPhase;
  attackId: AttackId | null;
  activationId: number;
  elapsedMs: number;
  totalDurationMs: number;
  hitboxActive: boolean;
}

export interface DamageCalculationResult {
  rawDamage: number;
  finalDamage: number;
  wasBlocked: boolean;
  knockbackStrength: number;
  stunDurationMs: number;
}

export interface ActiveHitboxDescriptor {
  attackerId: string;
  activationId: number;
  attack: AttackDefinition;
  facing: 'left' | 'right';
  attackerX: number;
  box: RectBox;
}

export interface HitImpactEvent {
  attackerId: string;
  defenderId: string;
  attackId: AttackId;
  activationId: number;
  damageApplied: number;
  wasBlocked: boolean;
  knockbackVelocityX: number;
  stunDurationMs: number;
  remainingHealth: number;
  maxHealth: number;
  defeated: boolean;
  impactX: number;
  impactY: number;
}

/**
 * Shared combat participant contract allowing any playable fighter or
 * temporary training opponent to participate cleanly in CombatManager.
 */
export interface CombatantActor {
  getCombatantId(): string;
  getDisplayName(): string;
  getPosition(): {x: number; y: number};
  getFacing(): 'left' | 'right';
  getHurtbox(): RectBox;
  getHealth(): number;
  getMaxHealth(): number;
  isBlocking(): boolean;
  isDefeated(): boolean;
  getActiveAttack(): {
    activationId: number;
    attack: AttackDefinition;
    hasHitTarget: (targetId: string) => boolean;
    markTargetHit: (targetId: string) => void;
  } | null;
  applyCombatImpact(impact: {
    damage: number;
    wasBlocked: boolean;
    knockbackVelocityX: number;
    stunDurationMs: number;
  }): {remainingHealth: number; defeated: boolean};
}
