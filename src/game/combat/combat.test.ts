import test from 'node:test';
import assert from 'node:assert/strict';
import {AttackController} from './AttackController';
import {
  ATTACK_REGISTRY,
  getAllAttackDefinitions,
  getAttackDefinition,
  getAttackTotalDurationMs,
  resolveAttackDefinition,
} from './AttackRegistry';
import {FighterCombatState} from './FighterCombatState';
import {evaluateBlockState} from './BlockingSystem';
import {CombatManager} from './CombatManager';
import {DEFAULT_COMBAT_CONFIG} from './combatConfig';
import type {CombatantActor, RectBox} from './combatTypes';
import {applyHealthChange, calculateAttackDamage, isHealthDepleted} from './DamageSystem';
import {computeAttackHitbox, HitboxManager, resolveGroundedPushbox} from './HitboxManager';
import {getCharacterConfig} from '../config/characterConfig';
import type {FighterInputSnapshot} from '../input/inputTypes';

test('AttackRegistry configures all four attacks with expected starting damage and timing', () => {
  const all = getAllAttackDefinitions();
  assert.equal(all.length, 4);

  assert.equal(getAttackDefinition('light-punch').damage, 40);
  assert.equal(getAttackDefinition('heavy-punch').damage, 90);
  assert.equal(getAttackDefinition('light-kick').damage, 55);
  assert.equal(getAttackDefinition('heavy-kick').damage, 110);

  for (const atk of all) {
    assert.ok(atk.startupMs > 0);
    assert.ok(atk.activeMs > 0);
    assert.ok(atk.recoveryMs > 0);
    assert.ok(atk.hitboxWidth > 0 && atk.hitboxHeight > 0);
    assert.ok(atk.knockbackStrength > 0);
  }
});

test('AttackController transitions cleanly through startup -> active -> recovery -> ready and prevents duplicate hits', () => {
  const controller = new AttackController();
  const lp = getAttackDefinition('light-punch');

  assert.equal(controller.canStartAttack(true), true);
  assert.equal(controller.canStartAttack(false), false);

  assert.equal(controller.startAttack(lp), true);
  assert.equal(controller.getSnapshot().phase, 'startup');
  assert.equal(controller.isHitboxActive(), false);

  // Cannot start another attack while active/busy
  assert.equal(controller.startAttack(lp), false);

  // Advance into active window
  controller.update(lp.startupMs);
  assert.equal(controller.getSnapshot().phase, 'active');
  assert.equal(controller.isHitboxActive(), true);

  // Mark target once per activation
  assert.equal(controller.hasHitTarget('dummy'), false);
  controller.markTargetHit('dummy');
  assert.equal(controller.hasHitTarget('dummy'), true);

  // Advance into recovery
  controller.update(lp.activeMs);
  assert.equal(controller.getSnapshot().phase, 'recovery');
  assert.equal(controller.isHitboxActive(), false);

  // Advance to completion -> ready
  controller.update(lp.recoveryMs + 10);
  assert.equal(controller.getSnapshot().phase, 'ready');
  assert.equal(controller.isHitboxActive(), false);
  assert.equal(controller.hasHitTarget('dummy'), false);
  assert.ok(getAttackTotalDurationMs(lp) === lp.startupMs + lp.activeMs + lp.recoveryMs);
});

test('HitboxManager projects directional hitboxes forward and rejects targets behind the attacker', () => {
  const manager = new HitboxManager();
  const hk = getAttackDefinition('heavy-kick');

  const rightBox = computeAttackHitbox(300, 472, 'right', hk);
  assert.ok(rightBox.x > 300);

  const leftBox = computeAttackHitbox(300, 472, 'left', hk);
  assert.ok(leftBox.x + leftBox.width < 300);

  const frontDummy: RectBox = {x: 360, y: 248, width: 96, height: 224};
  const rearDummy: RectBox = {x: 150, y: 248, width: 96, height: 224};

  const descriptor = {
    attackerId: 'p1',
    activationId: 1,
    attack: hk,
    facing: 'right' as const,
    attackerX: 300,
    box: rightBox,
  };

  assert.equal(manager.doesHitboxConnect(descriptor, frontDummy), true);
  assert.equal(manager.doesHitboxConnect(descriptor, rearDummy), false);
});

test('DamageSystem & BlockingSystem reduce blocked damage and clamp health between 0 and 1000', () => {
  const hp = getAttackDefinition('heavy-punch');

  const unblocked = calculateAttackDamage(hp, false, DEFAULT_COMBAT_CONFIG);
  assert.equal(unblocked.finalDamage, 90);
  assert.equal(unblocked.wasBlocked, false);

  const blocked = calculateAttackDamage(hp, true, DEFAULT_COMBAT_CONFIG);
  assert.equal(blocked.wasBlocked, true);
  assert.equal(blocked.finalDamage, 18); // 20% of 90
  assert.ok(blocked.knockbackStrength < unblocked.knockbackStrength);

  assert.equal(applyHealthChange(1000, 1000, 90), 910);
  assert.equal(applyHealthChange(40, 1000, 110), 0);
  assert.equal(isHealthDepleted(0), true);
  assert.equal(isHealthDepleted(1), false);

  const guardActive = evaluateBlockState({
    blockHeld: true,
    onGround: true,
    isAttacking: false,
    isInHitstun: false,
    isDefeated: false,
  });
  assert.equal(guardActive.isBlocking, true);
  assert.equal(guardActive.canStartAttack, false);
});

test('CombatManager hits target once per activation, applies knockback, and clears hitbox after recovery', () => {
  const combatManager = new CombatManager();
  const controller = new AttackController();
  const lp = getAttackDefinition('light-punch');

  let attackerFacing: 'left' | 'right' = 'right';
  let dummyHealth = 1000;
  let dummyBlocked = false;
  let lastKnockback = 0;

  const attacker: CombatantActor = {
    getCombatantId: () => 'player-1',
    getDisplayName: () => 'Player 1',
    getPosition: () => ({x: 340, y: 472}),
    getFacing: () => attackerFacing,
    getHurtbox: () => ({x: 288, y: 248, width: 104, height: 224}),
    getHealth: () => 1000,
    getMaxHealth: () => 1000,
    isBlocking: () => false,
    isDefeated: () => false,
    getActiveAttack: () =>
      controller.isHitboxActive() && controller.getCurrentAttack()
        ? {
            activationId: controller.getActivationId(),
            attack: controller.getCurrentAttack()!,
            hasHitTarget: (id) => controller.hasHitTarget(id),
            markTargetHit: (id) => controller.markTargetHit(id),
          }
        : null,
    applyCombatImpact: () => ({remainingHealth: 1000, defeated: false}),
  };

  const dummy: CombatantActor = {
    getCombatantId: () => 'training-dummy',
    getDisplayName: () => 'Training Dummy',
    getPosition: () => ({x: 430, y: 472}),
    getFacing: () => 'left',
    getHurtbox: () => ({x: 382, y: 248, width: 96, height: 224}),
    getHealth: () => dummyHealth,
    getMaxHealth: () => 1000,
    isBlocking: () => dummyBlocked,
    isDefeated: () => dummyHealth <= 0,
    getActiveAttack: () => null,
    applyCombatImpact: ({damage, knockbackVelocityX}) => {
      dummyHealth = applyHealthChange(dummyHealth, 1000, damage);
      lastKnockback = knockbackVelocityX;
      return {remainingHealth: dummyHealth, defeated: dummyHealth <= 0};
    },
  };

  combatManager.registerCombatant(attacker);
  combatManager.registerCombatant(dummy);

  controller.startAttack(lp);
  controller.update(lp.startupMs); // enters active window

  // Two consecutive ticks during same active window must only deal damage once
  combatManager.update();
  combatManager.update();
  assert.equal(dummyHealth, 960);
  assert.ok(lastKnockback > 0);
  assert.equal(combatManager.getActiveHitboxes().length, 1);

  // Recovery clears active hitbox
  controller.update(lp.activeMs);
  combatManager.update();
  assert.equal(combatManager.getActiveHitboxes().length, 0);

  // Blocked Heavy Kick deals reduced chip damage
  controller.update(lp.recoveryMs + 10);
  const hk = getAttackDefinition('heavy-kick');
  dummyBlocked = true;
  controller.startAttack(hk);
  controller.update(hk.startupMs);
  combatManager.update();
  assert.equal(dummyHealth, 960 - 22); // 20% of 110

  // Facing left misses dummy standing on the right
  controller.update(hk.activeMs + hk.recoveryMs + 10);
  attackerFacing = 'left';
  dummyBlocked = false;
  controller.startAttack(lp);
  controller.update(lp.startupMs);
  combatManager.update();
  assert.equal(dummyHealth, 938);

  combatManager.destroy();
});

const BASE_COMBAT_INPUT: FighterInputSnapshot = {
  left: false,
  right: false,
  jumpHeld: false,
  jumpJustPressed: false,
  crouch: false,
  run: false,
  lightPunchJustPressed: false,
  heavyPunchJustPressed: false,
  lightKickJustPressed: false,
  heavyKickJustPressed: false,
  blockHeld: false,
};

test('FighterCombatState blocks airborne ground attacks, enforces block/attack exclusivity, and handles hitstun', () => {
  const state = new FighterCombatState(1000);

  // Airborne ground attack attempt must be ignored
  const airAttempt = state.step(16, {...BASE_COMBAT_INPUT, lightPunchJustPressed: true}, false);
  assert.equal(airAttempt.combatState, 'none');
  assert.equal(airAttempt.currentAttackId, null);

  // Holding block prevents attacking simultaneously
  const blockedAttempt = state.step(
    16,
    {...BASE_COMBAT_INPUT, blockHeld: true, heavyPunchJustPressed: true},
    true,
  );
  assert.equal(blockedAttempt.combatState, 'blocking');
  assert.equal(blockedAttempt.isBlocking, true);
  assert.equal(blockedAttempt.currentAttackId, null);

  // Releasing block immediately frees fighter and starts Light Kick
  const releaseAndKick = state.step(
    16,
    {...BASE_COMBAT_INPUT, blockHeld: false, lightKickJustPressed: true},
    true,
  );
  assert.equal(releaseAndKick.combatState, 'attacking');
  assert.equal(releaseAndKick.currentAttackId, 'light-kick');

  // Taking unblocked hit interrupts active attack into hitstun
  const impact = state.applyImpact({damage: 55, wasBlocked: false, stunDurationMs: 250});
  assert.equal(impact.remainingHealth, 945);
  assert.equal(impact.defeated, false);

  const duringStun = state.step(100, {...BASE_COMBAT_INPUT, heavyKickJustPressed: true}, true);
  assert.equal(duringStun.combatState, 'hitstun');
  assert.equal(duringStun.currentAttackId, null);

  const afterStun = state.step(200, BASE_COMBAT_INPUT, true);
  assert.equal(afterStun.combatState, 'none');
});

test('resolveGroundedPushbox keeps fighters separated without pushing past arena walls', () => {
  const openSep = resolveGroundedPushbox(500, 520, 88, 48, 912, 52, 48);
  assert.ok(Math.abs(openSep.bX - openSep.aX) >= 88);

  const cornerSep = resolveGroundedPushbox(840, 864, 88, 48, 912, 52, 48);
  assert.ok(cornerSep.bX <= 912 - 48);
  assert.ok(Math.abs(cornerSep.bX - cornerSep.aX) >= 87.99);
});

test('Character attack overrides apply timing & knockback once while preserving immutable ATTACK_REGISTRY for Player 1', () => {
  const p1 = getCharacterConfig('player-1');
  const p2 = getCharacterConfig('player-2');
  const p3 = getCharacterConfig('player-3');

  const baseLP = ATTACK_REGISTRY['light-punch'];
  const p1LP = resolveAttackDefinition('light-punch', p1.attackOverrides);
  const p2LP = resolveAttackDefinition('light-punch', p2.attackOverrides);
  const p3LP = resolveAttackDefinition('light-punch', p3.attackOverrides);

  // Player 1 keeps exact immutable baseline reference
  assert.equal(p1LP, baseLP);
  assert.equal(p1LP.damage, 40);
  assert.equal(p1LP.startupMs, 80);

  // Player 2 is faster with lighter knockback; Player 3 is slower with heavier knockback
  assert.ok(p2LP.startupMs < p1LP.startupMs);
  assert.ok(p2LP.recoveryMs < p1LP.recoveryMs);
  assert.ok(p2LP.knockbackStrength < p1LP.knockbackStrength);

  assert.ok(p3LP.startupMs > p1LP.startupMs);
  assert.ok(p3LP.recoveryMs > p1LP.recoveryMs);
  assert.ok(p3LP.knockbackStrength > p1LP.knockbackStrength);
  assert.ok(p3LP.hitstunMs > p1LP.hitstunMs);

  // Attack overrides must not mutate ATTACK_REGISTRY or pre-bake attackPower damage scaling
  assert.equal(p2LP.damage, baseLP.damage);
  assert.equal(p3LP.damage, baseLP.damage);
  assert.equal(ATTACK_REGISTRY['light-punch'].startupMs, 80);

  // FighterCombatState steps with distinct per-character attack durations
  const p2Combat = new FighterCombatState(p2.stats.maxHealth, p2.attackOverrides);
  const p3Combat = new FighterCombatState(p3.stats.maxHealth, p3.attackOverrides);
  p2Combat.step(16, {...BASE_COMBAT_INPUT, lightPunchJustPressed: true}, true);
  p3Combat.step(16, {...BASE_COMBAT_INPUT, lightPunchJustPressed: true}, true);

  assert.equal(p2Combat.getAttackController().getSnapshot().totalDurationMs, getAttackTotalDurationMs(p2LP));
  assert.equal(p3Combat.getAttackController().getSnapshot().totalDurationMs, getAttackTotalDurationMs(p3LP));
  assert.ok(
    p2Combat.getAttackController().getSnapshot().totalDurationMs <
      p3Combat.getAttackController().getSnapshot().totalDurationMs,
  );
});

test('DamageSystem & CombatManager scale attackPower/100 and 100/defense exactly once without double-applying modifiers', () => {
  const p1 = getCharacterConfig('player-1');
  const p2 = getCharacterConfig('player-2');
  const p3 = getCharacterConfig('player-3');

  const lp = resolveAttackDefinition('light-punch', p2.attackOverrides);
  // P2 (attackPower=95) vs Training Dummy default (defense=100) => Math.round(40 * 0.95 * 1.0) = 38
  const p2VsDummy = calculateAttackDamage(lp, false, DEFAULT_COMBAT_CONFIG, {
    attackerAttackPower: p2.stats.attackPower,
    defenderDefense: 100,
  });
  assert.equal(p2VsDummy.finalDamage, 38);

  // P3 (attackPower=118) vs Training Dummy default (defense=100) => Math.round(40 * 1.18 * 1.0) = 47
  const p3LP = resolveAttackDefinition('light-punch', p3.attackOverrides);
  const p3VsDummy = calculateAttackDamage(p3LP, false, DEFAULT_COMBAT_CONFIG, {
    attackerAttackPower: p3.stats.attackPower,
    defenderDefense: 100,
  });
  assert.equal(p3VsDummy.finalDamage, 47);

  // P3 (attackPower=118) vs P2 (defense=95) => Math.round(40 * (118/100) * (100/95)) = 50
  const p3VsP2 = calculateAttackDamage(p3LP, false, DEFAULT_COMBAT_CONFIG, {
    attackerAttackPower: p3.stats.attackPower,
    defenderDefense: p2.stats.defense,
  });
  assert.equal(p3VsP2.finalDamage, 50);

  // P2 (attackPower=95) vs P3 (defense=115) => Math.round(40 * (95/100) * (100/115)) = 33
  const p2VsP3 = calculateAttackDamage(lp, false, DEFAULT_COMBAT_CONFIG, {
    attackerAttackPower: p2.stats.attackPower,
    defenderDefense: p3.stats.defense,
  });
  assert.equal(p2VsP3.finalDamage, 33);

  // P1 (100/100) vs Dummy (100) remains strictly 40
  const p1VsDummy = calculateAttackDamage(
    resolveAttackDefinition('light-punch', p1.attackOverrides),
    false,
    DEFAULT_COMBAT_CONFIG,
    {attackerAttackPower: p1.stats.attackPower, defenderDefense: 100},
  );
  assert.equal(p1VsDummy.finalDamage, 40);

  // Verify CombatManager passes attackPower & defense cleanly once end-to-end
  const combatManager = new CombatManager();
  const p3Ctrl = new AttackController();
  let defenderHealth = p2.stats.maxHealth;

  const p3Actor: CombatantActor = {
    getCombatantId: () => p3.id,
    getDisplayName: () => p3.name,
    getPosition: () => ({x: 340, y: 472}),
    getFacing: () => 'right',
    getHurtbox: () => ({x: 284, y: 244, width: 112, height: 228}),
    getHealth: () => p3.stats.maxHealth,
    getMaxHealth: () => p3.stats.maxHealth,
    getAttackPower: () => p3.stats.attackPower,
    getDefense: () => p3.stats.defense,
    isBlocking: () => false,
    isDefeated: () => false,
    getActiveAttack: () =>
      p3Ctrl.isHitboxActive() && p3Ctrl.getCurrentAttack()
        ? {
            activationId: p3Ctrl.getActivationId(),
            attack: p3Ctrl.getCurrentAttack()!,
            hasHitTarget: (id) => p3Ctrl.hasHitTarget(id),
            markTargetHit: (id) => p3Ctrl.markTargetHit(id),
          }
        : null,
    applyCombatImpact: () => ({remainingHealth: p3.stats.maxHealth, defeated: false}),
  };

  const p2Defender: CombatantActor = {
    getCombatantId: () => p2.id,
    getDisplayName: () => p2.name,
    getPosition: () => ({x: 430, y: 472}),
    getFacing: () => 'left',
    getHurtbox: () => ({x: 380, y: 248, width: 100, height: 224}),
    getHealth: () => defenderHealth,
    getMaxHealth: () => p2.stats.maxHealth,
    getAttackPower: () => p2.stats.attackPower,
    getDefense: () => p2.stats.defense,
    isBlocking: () => false,
    isDefeated: () => defenderHealth <= 0,
    getActiveAttack: () => null,
    applyCombatImpact: ({damage}) => {
      defenderHealth = applyHealthChange(defenderHealth, p2.stats.maxHealth, damage);
      return {remainingHealth: defenderHealth, defeated: defenderHealth <= 0};
    },
  };

  combatManager.registerCombatant(p3Actor);
  combatManager.registerCombatant(p2Defender);

  p3Ctrl.startAttack(p3LP);
  p3Ctrl.update(p3LP.startupMs);
  combatManager.update();

  assert.equal(defenderHealth, p2.stats.maxHealth - 50);
  assert.equal(combatManager.getLastHitEvent()?.damageApplied, 50);
  combatManager.destroy();
});

test('CombatManager unregisterCombatant and resetCombatState prevent stale hitboxes and duplicate fighters across swaps', () => {
  const combatManager = new CombatManager();
  const ctrl1 = new AttackController();
  const lp = getAttackDefinition('light-punch');

  const createStaticActor = (id: string, activeCtrl: AttackController | null): CombatantActor => ({
    getCombatantId: () => id,
    getDisplayName: () => id,
    getPosition: () => ({x: 340, y: 472}),
    getFacing: () => 'right',
    getHurtbox: () => ({x: 300, y: 248, width: 80, height: 224}),
    getHealth: () => 1000,
    getMaxHealth: () => 1000,
    isBlocking: () => false,
    isDefeated: () => false,
    getActiveAttack: () =>
      activeCtrl && activeCtrl.isHitboxActive() && activeCtrl.getCurrentAttack()
        ? {
            activationId: activeCtrl.getActivationId(),
            attack: activeCtrl.getCurrentAttack()!,
            hasHitTarget: (targetId) => activeCtrl.hasHitTarget(targetId),
            markTargetHit: (targetId) => activeCtrl.markTargetHit(targetId),
          }
        : null,
    applyCombatImpact: () => ({remainingHealth: 1000, defeated: false}),
  });

  const dummy = createStaticActor('training-dummy', null);
  const p1 = createStaticActor('player-1', ctrl1);
  combatManager.registerCombatant(p1);
  combatManager.registerCombatant(dummy);

  ctrl1.startAttack(lp);
  ctrl1.update(lp.startupMs);
  combatManager.update();
  assert.equal(combatManager.getActiveHitboxes().length, 1);
  assert.ok(combatManager.getLastHitEvent() !== null);

  // Simulate mid-attack fighter swap
  combatManager.unregisterCombatant('player-1');
  combatManager.resetCombatState();
  const p2 = createStaticActor('player-2', new AttackController());
  combatManager.registerCombatant(p2);

  assert.deepEqual(combatManager.getCombatantIds().sort(), ['player-2', 'training-dummy']);
  assert.equal(combatManager.getActiveHitboxes().length, 0);
  assert.equal(combatManager.getLastHitEvent(), null);
  combatManager.destroy();
});
