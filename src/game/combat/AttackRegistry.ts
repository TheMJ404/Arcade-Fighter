import type {AttackDefinition, AttackId} from './combatTypes';

export const ATTACK_REGISTRY: Record<AttackId, AttackDefinition> = {
  'light-punch': {
    id: 'light-punch',
    displayName: 'Light Punch',
    category: 'punch',
    strength: 'light',
    damage: 40,
    startupMs: 80,
    activeMs: 90,
    recoveryMs: 140,
    hitboxWidth: 74,
    hitboxHeight: 46,
    hitboxOffsetX: 68,
    hitboxOffsetY: -148,
    knockbackStrength: 150,
    hitstunMs: 220,
    blockstunMs: 130,
    animationKeyName: 'lightPunch',
    blockable: true,
  },
  'heavy-punch': {
    id: 'heavy-punch',
    displayName: 'Heavy Punch',
    category: 'punch',
    strength: 'heavy',
    damage: 90,
    startupMs: 180,
    activeMs: 130,
    recoveryMs: 260,
    hitboxWidth: 88,
    hitboxHeight: 54,
    hitboxOffsetX: 76,
    hitboxOffsetY: -152,
    knockbackStrength: 300,
    hitstunMs: 340,
    blockstunMs: 200,
    animationKeyName: 'heavyPunch',
    blockable: true,
  },
  'light-kick': {
    id: 'light-kick',
    displayName: 'Light Kick',
    category: 'kick',
    strength: 'light',
    damage: 55,
    startupMs: 110,
    activeMs: 110,
    recoveryMs: 180,
    hitboxWidth: 92,
    hitboxHeight: 48,
    hitboxOffsetX: 78,
    hitboxOffsetY: -124,
    knockbackStrength: 190,
    hitstunMs: 250,
    blockstunMs: 150,
    animationKeyName: 'lightKick',
    blockable: true,
  },
  'heavy-kick': {
    id: 'heavy-kick',
    displayName: 'Heavy Kick',
    category: 'kick',
    strength: 'heavy',
    damage: 110,
    startupMs: 220,
    activeMs: 140,
    recoveryMs: 310,
    hitboxWidth: 108,
    hitboxHeight: 58,
    hitboxOffsetX: 86,
    hitboxOffsetY: -138,
    knockbackStrength: 370,
    hitstunMs: 400,
    blockstunMs: 230,
    animationKeyName: 'heavyKick',
    blockable: true,
  },
};

export function getAttackDefinition(id: AttackId): AttackDefinition {
  return ATTACK_REGISTRY[id];
}

export function getAllAttackDefinitions(): AttackDefinition[] {
  return Object.values(ATTACK_REGISTRY);
}

export function getAttackTotalDurationMs(attack: AttackDefinition): number {
  return attack.startupMs + attack.activeMs + attack.recoveryMs;
}
