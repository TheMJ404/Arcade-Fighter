import type {
  ActiveHitboxDescriptor,
  AttackDefinition,
  RectBox,
} from './combatTypes';

/**
 * Pure directional hitbox calculator and overlap detector.
 * Hitboxes project strictly in the attacker's facing direction and are
 * tracked per-frame with explicit cleanup so no lingering hitboxes remain.
 */
export function computeAttackHitbox(
  attackerX: number,
  attackerY: number,
  facing: 'left' | 'right',
  attack: AttackDefinition,
): RectBox {
  const direction = facing === 'right' ? 1 : -1;
  const centerX = attackerX + direction * attack.hitboxOffsetX;
  const centerY = attackerY + attack.hitboxOffsetY;

  return {
    x: centerX - attack.hitboxWidth / 2,
    y: centerY - attack.hitboxHeight / 2,
    width: attack.hitboxWidth,
    height: attack.hitboxHeight,
  };
}

export function boxesOverlap(a: RectBox, b: RectBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Ensures strikes only connect with targets positioned on or in front of
 * the attacker's facing plane (prevents hitting opponents standing behind).
 */
export function isTargetInAttackArc(
  attackerX: number,
  targetHurtbox: RectBox,
  facing: 'left' | 'right',
): boolean {
  const targetCenterX = targetHurtbox.x + targetHurtbox.width / 2;
  if (facing === 'right') {
    return targetCenterX >= attackerX - 12;
  }
  return targetCenterX <= attackerX + 12;
}

export class HitboxManager {
  private readonly activeHitboxes = new Map<string, ActiveHitboxDescriptor>();

  setActiveHitbox(descriptor: ActiveHitboxDescriptor): void {
    this.activeHitboxes.set(descriptor.attackerId, descriptor);
  }

  clearHitbox(attackerId: string): void {
    this.activeHitboxes.delete(attackerId);
  }

  clearAll(): void {
    this.activeHitboxes.clear();
  }

  getActiveHitbox(attackerId: string): ActiveHitboxDescriptor | null {
    return this.activeHitboxes.get(attackerId) ?? null;
  }

  getActiveCount(): number {
    return this.activeHitboxes.size;
  }

  doesHitboxConnect(
    descriptor: ActiveHitboxDescriptor,
    targetHurtbox: RectBox,
  ): boolean {
    if (!isTargetInAttackArc(descriptor.attackerX, targetHurtbox, descriptor.facing)) {
      return false;
    }
    return boxesOverlap(descriptor.box, targetHurtbox);
  }
}

/**
 * Separates two grounded combatants horizontally when their pushboxes overlap
 * so fighters meet face-to-face at arcade striking distance instead of walking
 * through each other on the ground (airborne jump cross-ups remain unrestricted).
 */
export function resolveGroundedPushbox(
  aX: number,
  bX: number,
  minDistance: number,
  boundsLeft: number,
  boundsRight: number,
  aHalfWidth: number,
  bHalfWidth: number,
): {aX: number; bX: number} {
  const dx = bX - aX;
  const absDx = Math.abs(dx);
  if (absDx >= minDistance) {
    return {aX, bX};
  }

  const sign = dx >= 0 ? 1 : -1;
  const overlap = minDistance - absDx;

  // Push attacker/mover slightly more gently if dummy is stationary, or split evenly
  let nextA = aX - sign * (overlap * 0.5);
  let nextB = bX + sign * (overlap * 0.5);

  const minA = boundsLeft + aHalfWidth;
  const maxA = boundsRight - aHalfWidth;
  const minB = boundsLeft + bHalfWidth;
  const maxB = boundsRight - bHalfWidth;

  if (nextB > maxB) {
    const excess = nextB - maxB;
    nextB = maxB;
    nextA -= excess;
  } else if (nextB < minB) {
    const excess = minB - nextB;
    nextB = minB;
    nextA += excess;
  }

  if (nextA < minA) {
    const excess = minA - nextA;
    nextA = minA;
    nextB = Math.min(maxB, nextB + excess);
  } else if (nextA > maxA) {
    const excess = nextA - maxA;
    nextA = maxA;
    nextB = Math.max(minB, nextB - excess);
  }

  return {aX: nextA, bX: nextB};
}
