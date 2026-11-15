import test from 'node:test';
import assert from 'node:assert/strict';
import {AttackController} from './AttackController';
import {getAllAttackDefinitions, getAttackDefinition, getAttackTotalDurationMs} from './AttackRegistry';
import {FighterCombatState} from './FighterCombatState';
import {evaluateBlockState} from './BlockingSystem';
import {CombatManager} from './CombatManager';
import {DEFAULT_COMBAT_CONFIG} from './combatConfig';
import type {CombatantActor, RectBox} from './combatTypes';
import {applyHealthChange, calculateAttackDamage, isHealthDepleted} from './DamageSystem';
import {computeAttackHitbox, HitboxManager, resolveGroundedPushbox} from './HitboxManager';
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
