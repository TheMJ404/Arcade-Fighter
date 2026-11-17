import {gameEvents} from '../events/gameEvents';
import {DEFAULT_COMBAT_CONFIG, type CombatBalanceConfig} from './combatConfig';
import type {
  ActiveHitboxDescriptor,
  CombatantActor,
  HitImpactEvent,
} from './combatTypes';
import {calculateAttackDamage} from './DamageSystem';
import {computeAttackHitbox, HitboxManager} from './HitboxManager';

/**
 * Coordinates combat participants, directional attack hitboxes, single-hit
 * activation filtering, damage calculation, blocking mitigation, and combat events.
 * Works identically for Player 1, temporary training opponents, or future fighters.
 */
export class CombatManager {
  private readonly combatants = new Map<string, CombatantActor>();
  private readonly hitboxManager = new HitboxManager();
  private readonly config: CombatBalanceConfig;
  private lastHitEvent: HitImpactEvent | null = null;

  constructor(config: CombatBalanceConfig = DEFAULT_COMBAT_CONFIG) {
    this.config = config;
  }

  registerCombatant(combatant: CombatantActor): void {
    this.combatants.set(combatant.getCombatantId(), combatant);
  }

  unregisterCombatant(combatantId: string): void {
    this.combatants.delete(combatantId);
    this.hitboxManager.clearHitbox(combatantId);
  }

  getCombatantIds(): string[] {
    return [...this.combatants.keys()];
  }

  resetCombatState(): void {
    this.hitboxManager.clearAll();
    this.lastHitEvent = null;
  }

  getActiveHitboxes(): ActiveHitboxDescriptor[] {
    const result: ActiveHitboxDescriptor[] = [];
    for (const combatant of this.combatants.values()) {
      const box = this.hitboxManager.getActiveHitbox(combatant.getCombatantId());
      if (box) {
        result.push(box);
      }
    }
    return result;
  }

  getLastHitEvent(): HitImpactEvent | null {
    return this.lastHitEvent;
  }

  update(): void {
    const actors = [...this.combatants.values()];

    // Step 1: Synchronize active attack hitboxes for every living combatant
    for (let i = 0; i < actors.length; i += 1) {
      const attacker = actors[i];
      const attackerId = attacker.getCombatantId();

      if (attacker.isDefeated()) {
        this.hitboxManager.clearHitbox(attackerId);
        continue;
      }

      const active = attacker.getActiveAttack();
      if (!active) {
        this.hitboxManager.clearHitbox(attackerId);
        continue;
      }

      const pos = attacker.getPosition();
      const facing = attacker.getFacing();
      const box = computeAttackHitbox(pos.x, pos.y, facing, active.attack);

      this.hitboxManager.setActiveHitbox({
        attackerId,
        activationId: active.activationId,
        attack: active.attack,
        facing,
        attackerX: pos.x,
        box,
      });
    }

    // Step 2: Resolve hitbox-to-hurtbox overlaps once per activation
    for (let i = 0; i < actors.length; i += 1) {
      const attacker = actors[i];
      const attackerId = attacker.getCombatantId();
      const active = attacker.getActiveAttack();
      const descriptor = this.hitboxManager.getActiveHitbox(attackerId);

      if (!active || !descriptor) {
        continue;
      }

      for (let j = 0; j < actors.length; j += 1) {
        const defender = actors[j];
        const defenderId = defender.getCombatantId();

        if (defenderId === attackerId || defender.isDefeated()) {
          continue;
        }

        if (active.hasHitTarget(defenderId)) {
          continue;
        }

        const defenderHurtbox = defender.getHurtbox();
        if (!this.hitboxManager.doesHitboxConnect(descriptor, defenderHurtbox)) {
          continue;
        }

        active.markTargetHit(defenderId);

        const outcome = calculateAttackDamage(
          active.attack,
          defender.isBlocking(),
          this.config,
          {
            attackerAttackPower: attacker.getAttackPower?.() ?? 100,
            defenderDefense: defender.getDefense?.() ?? 100,
          },
        );

        const knockbackSign = descriptor.facing === 'right' ? 1 : -1;
        const knockbackVelocityX = knockbackSign * outcome.knockbackStrength;

        const applied = defender.applyCombatImpact({
          damage: outcome.finalDamage,
          wasBlocked: outcome.wasBlocked,
          knockbackVelocityX,
          stunDurationMs: outcome.stunDurationMs,
        });

        const impactX = Math.round(
          (descriptor.box.x +
            descriptor.box.width / 2 +
            (defenderHurtbox.x + defenderHurtbox.width / 2)) /
            2,
        );
        const impactY = Math.round(descriptor.box.y + descriptor.box.height / 2);

        const hitEvent: HitImpactEvent = {
          attackerId,
          defenderId,
          attackId: active.attack.id,
          activationId: active.activationId,
          damageApplied: outcome.finalDamage,
          wasBlocked: outcome.wasBlocked,
          knockbackVelocityX,
          stunDurationMs: outcome.stunDurationMs,
          remainingHealth: applied.remainingHealth,
          maxHealth: defender.getMaxHealth(),
          defeated: applied.defeated,
          impactX,
          impactY,
        };

        this.lastHitEvent = hitEvent;
        gameEvents.emit('combat:hit', hitEvent);
        gameEvents.emit('combat:healthChanged', {
          combatantId: defenderId,
          name: defender.getDisplayName(),
          health: applied.remainingHealth,
          maxHealth: defender.getMaxHealth(),
          lastAttackId: active.attack.id,
          wasBlocked: outcome.wasBlocked,
        });

        if (applied.defeated) {
          gameEvents.emit('combat:defeated', {
            combatantId: defenderId,
            defeatedById: attackerId,
          });
        }
      }
    }
  }

  destroy(): void {
    this.hitboxManager.clearAll();
    this.combatants.clear();
    this.lastHitEvent = null;
  }
}
