import Phaser from 'phaser';
import {
  FighterCombatState,
  type FighterCombatAnimationKey,
} from '../combat/FighterCombatState';
import type {
  AttackDefinition,
  AttackId,
  AttackPhase,
  CombatantActor,
  CombatState,
  RectBox,
} from '../combat/combatTypes';
import type {ArenaBounds, ArenaSpawnPoint} from '../config/arenaConfig';
import {
  computeCharacterGroundY,
  computePhysicsBodyOffset,
  type CharacterConfig,
} from '../config/characterConfig';
import type {FighterInputSnapshot} from '../input/inputTypes';
import {
  evaluateFighterMovement,
  type FighterMovementState,
} from './movementStateMachine';

export interface FighterBodySnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
  bottom: number;
  velocityX: number;
  velocityY: number;
  onGround: boolean;
  isCrouching: boolean;
  state: FighterMovementState;
  combatState: CombatState;
  attackPhase: AttackPhase;
  attackId: AttackId | null;
  isBlocking: boolean;
  isDefeated: boolean;
  health: number;
  maxHealth: number;
  facing: 'left' | 'right';
  animationKey: string;
}

/**
 * Arcade-physics fighter entity coordinating movement physics, standing/crouching
 * collision bodies, grounded shadow syncing, and modular CombatantActor integration.
 */
export class FighterEntity implements CombatantActor {
  private readonly scene: Phaser.Scene;
  private readonly config: CharacterConfig;
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly groundY: number;
  private readonly arenaBounds: ArenaBounds;
  private readonly combatState: FighterCombatState;

  private facing: 'left' | 'right';
  private movementState: FighterMovementState = 'idle';
  private isCrouching = false;
  private activeAnimKey = '';

  constructor(
    scene: Phaser.Scene,
    config: CharacterConfig,
    spawn: ArenaSpawnPoint,
    arenaBounds: ArenaBounds,
  ) {
    this.scene = scene;
    this.config = config;
    this.facing = spawn.facing;
    this.arenaBounds = arenaBounds;
    this.groundY = computeCharacterGroundY(spawn.y, config.render.footOffsetY);
    this.combatState = new FighterCombatState(config.stats.maxHealth);

    this.ensurePixelFiltering();
    this.registerAnimations();

    this.shadow = scene.add
      .ellipse(
        Math.round(spawn.x),
        this.groundY - 2,
        config.render.shadowWidth,
        config.render.shadowHeight,
        0x070512,
        0.42,
      )
      .setDepth(2);

    this.sprite = scene.physics.add
      .sprite(
        Math.round(spawn.x),
        this.groundY,
        config.sprite.textureKey,
        config.animations.idle.startFrame,
      )
      .setOrigin(config.render.originX, config.render.originY)
      .setScale(config.render.scale)
      .setFlipX(this.facing === 'left')
      .setDepth(3);

    const body = this.getArcadeBody();
    body.setCollideWorldBounds(true);
    body.setGravityY(config.physics.gravityY);
    body.setMaxVelocity(Math.max(config.stats.runSpeed, 800), 1200);
    body.setDragX(config.physics.groundDrag);

    this.applyCollisionBody(false);
    this.playAnimationKey(config.animations.idle.key);
  }

  update(input: FighterInputSnapshot, deltaMs: number = 16.67): void {
    const body = this.getArcadeBody();
    const onGround = body.blocked.down || body.touching.down || body.onFloor();

    const combatStep = this.combatState.step(deltaMs, input, onGround);

    if (combatStep.locksMovement) {
      if (this.isCrouching) {
        this.applyCollisionBody(false);
      }

      body.setAccelerationX(0);
      body.setMaxVelocity(Math.max(this.config.stats.runSpeed, 800), 1200);
      this.movementState = 'idle';

      const targetAnimKey = this.resolveCombatAnimationKey(combatStep.animationKeyName);
      if (targetAnimKey) {
        this.playAnimationKey(targetAnimKey);
      }

      this.syncShadow(false);
      return;
    }

    const decision = evaluateFighterMovement({
      input,
      onGround,
      currentFacing: this.facing,
      walkSpeed: this.config.stats.moveSpeed,
      runSpeed: this.config.stats.runSpeed,
      jumpVelocity: this.config.physics.jumpVelocity,
      autoFaceOpponent: this.config.facing.autoFaceOpponent,
    });

    if (decision.targetVelocityX !== 0) {
      const direction = Math.sign(decision.targetVelocityX);
      const targetSpeed = Math.abs(decision.targetVelocityX);

      // Snap opposing horizontal momentum on ground turnaround for crisp arcade responsiveness
      if (onGround && body.velocity.x !== 0 && Math.sign(body.velocity.x) !== direction) {
        body.setVelocityX(0);
      }

      body.setMaxVelocity(targetSpeed, 1200);
      const accel = onGround
        ? this.config.physics.groundAcceleration
        : this.config.physics.airAcceleration;
      body.setAccelerationX(direction * accel);
    } else {
      body.setAccelerationX(0);
      body.setMaxVelocity(Math.max(this.config.stats.runSpeed, 800), 1200);

      if (decision.isCrouching && onGround && Math.abs(body.velocity.x) < 30) {
        body.setVelocityX(0);
      }
    }

    if (decision.shouldJump) {
      body.setVelocityY(decision.jumpVelocityY);
    }

    if (decision.facing !== this.facing) {
      this.facing = decision.facing;
      this.sprite.setFlipX(this.facing === 'left');
    }

    if (decision.isCrouching !== this.isCrouching) {
      this.applyCollisionBody(decision.isCrouching);
    }

    const targetAnim = this.config.animations[decision.animationKeyName];
    if (
      decision.state !== this.movementState ||
      this.activeAnimKey !== targetAnim.key
    ) {
      this.playAnimationKey(targetAnim.key);
      this.movementState = decision.state;
    }

    this.syncShadow(decision.isCrouching);
  }

  getCombatantId(): string {
    return this.config.id;
  }

  getDisplayName(): string {
    return this.config.name;
  }

  getPosition(): {x: number; y: number} {
    return {x: this.sprite.x, y: this.sprite.y};
  }

  getFacing(): 'left' | 'right' {
    return this.facing;
  }

  getHurtbox(): RectBox {
    const body = this.getArcadeBody();
    return {
      x: body.x,
      y: body.y,
      width: body.width,
      height: body.height,
    };
  }

  getHealth(): number {
    return this.combatState.getHealth();
  }

  getMaxHealth(): number {
    return this.combatState.getMaxHealth();
  }

  isBlocking(): boolean {
    return this.combatState.isBlocking();
  }

  isDefeated(): boolean {
    return this.combatState.isDefeated();
  }

  getActiveAttack(): {
    activationId: number;
    attack: AttackDefinition;
    hasHitTarget: (targetId: string) => boolean;
    markTargetHit: (targetId: string) => void;
  } | null {
    const controller = this.combatState.getAttackController();
    const attack = controller.getCurrentAttack();
    if (!controller.isHitboxActive() || !attack) {
      return null;
    }
    return {
      activationId: controller.getActivationId(),
      attack,
      hasHitTarget: (id) => controller.hasHitTarget(id),
      markTargetHit: (id) => controller.markTargetHit(id),
    };
  }

  applyCombatImpact(impact: {
    damage: number;
    wasBlocked: boolean;
    knockbackVelocityX: number;
    stunDurationMs: number;
  }): {remainingHealth: number; defeated: boolean} {
    const result = this.combatState.applyImpact({
      damage: impact.damage,
      wasBlocked: impact.wasBlocked,
      stunDurationMs: impact.stunDurationMs,
    });

    const body = this.getArcadeBody();
    body.setMaxVelocity(Math.max(this.config.stats.runSpeed, 800), 1200);
    body.setAccelerationX(0);
    body.setVelocityX(impact.knockbackVelocityX);

    if (impact.wasBlocked) {
      this.playAnimationKey(this.config.animations.block.key);
    } else {
      this.playAnimationKey(this.config.animations.hit.key, true);
    }

    return result;
  }

  getConfig(): CharacterConfig {
    return this.config;
  }

  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  getMovementState(): FighterMovementState {
    return this.movementState;
  }

  isFighterCrouching(): boolean {
    return this.isCrouching;
  }

  getBodySnapshot(): FighterBodySnapshot {
    const body = this.getArcadeBody();
    const onGround = body.blocked.down || body.touching.down || body.onFloor();
    const attackSnap = this.combatState.getAttackController().getSnapshot();

    let combatState: CombatState = 'none';
    if (this.combatState.isDefeated()) {
      combatState = 'defeated';
    } else if (attackSnap.phase !== 'ready') {
      combatState = 'attacking';
    } else if (this.combatState.isBlocking()) {
      combatState = 'blocking';
    } else if (this.activeAnimKey === this.config.animations.hit.key) {
      combatState = 'hitstun';
    }

    return {
      x: Math.round(this.sprite.x * 100) / 100,
      y: Math.round(this.sprite.y * 100) / 100,
      width: body.width,
      height: body.height,
      bottom: Math.round(body.bottom * 100) / 100,
      velocityX: Math.round(body.velocity.x * 100) / 100,
      velocityY: Math.round(body.velocity.y * 100) / 100,
      onGround,
      isCrouching: this.isCrouching,
      state: this.movementState,
      combatState,
      attackPhase: attackSnap.phase,
      attackId: attackSnap.attackId,
      isBlocking: this.combatState.isBlocking(),
      isDefeated: this.combatState.isDefeated(),
      health: this.combatState.getHealth(),
      maxHealth: this.combatState.getMaxHealth(),
      facing: this.facing,
      animationKey: this.sprite.anims.currentAnim?.key ?? '',
    };
  }

  destroy(): void {
    this.shadow.destroy();
    this.sprite.destroy();
  }

  private resolveCombatAnimationKey(keyName: FighterCombatAnimationKey): string | null {
    if (!keyName) {
      return null;
    }
    return this.config.animations[keyName].key;
  }

  private playAnimationKey(key: string, forceRestart: boolean = false): void {
    if (!forceRestart && this.activeAnimKey === key && this.sprite.anims.currentAnim?.key === key) {
      return;
    }
    this.activeAnimKey = key;
    this.sprite.play(key, !forceRestart);
  }

  private getArcadeBody(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  private applyCollisionBody(crouching: boolean): void {
    this.isCrouching = crouching;
    const body = this.getArcadeBody();
    const size = crouching
      ? this.config.physics.crouchingBody
      : this.config.physics.standingBody;

    const {offsetX, offsetY} = computePhysicsBodyOffset(
      this.config.sprite.frameWidth,
      this.config.sprite.frameHeight,
      size.width,
      size.height,
    );

    body.setSize(size.width, size.height, false);
    body.setOffset(offsetX, offsetY);

    // Keep body cleanly inside horizontal arena bounds when body width changes near a wall
    const scaledHalfWidth = (size.width * this.config.render.scale) / 2;
    const minX = this.arenaBounds.left + scaledHalfWidth;
    const maxX = this.arenaBounds.right - scaledHalfWidth;
    if (this.sprite.x < minX) {
      this.sprite.setX(minX);
    } else if (this.sprite.x > maxX) {
      this.sprite.setX(maxX);
    }
  }

  private syncShadow(crouching: boolean): void {
    const elevation = Math.max(0, this.groundY - this.sprite.y);
    const heightRatio = Math.max(0.45, 1 - elevation / 260);
    const widthScale = crouching ? 1.08 : heightRatio;

    this.shadow.setPosition(Math.round(this.sprite.x), this.groundY - 2);
    this.shadow.setScale(widthScale, heightRatio);
    this.shadow.setAlpha(0.42 * heightRatio);
  }

  private ensurePixelFiltering(): void {
    const textureKeys = new Set<string>([
      this.config.sprite.textureKey,
      ...Object.values(this.config.animations).map((anim) => anim.textureKey),
    ]);

    for (const textureKey of textureKeys) {
      if (this.scene.textures.exists(textureKey)) {
        this.scene.textures.get(textureKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }
  }

  private registerAnimations(): void {
    for (const anim of Object.values(this.config.animations)) {
      if (this.scene.anims.exists(anim.key)) {
        continue;
      }

      this.scene.anims.create({
        key: anim.key,
        frames: this.scene.anims.generateFrameNumbers(anim.textureKey, {
          start: anim.startFrame,
          end: anim.endFrame,
        }),
        frameRate: anim.frameRate,
        repeat: anim.repeat,
      });
    }
  }
}
