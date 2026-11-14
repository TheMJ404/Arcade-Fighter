import Phaser from 'phaser';
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
  facing: 'left' | 'right';
  animationKey: string;
}

/**
 * Arcade-physics fighter entity responsible for registering movement animations,
 * running the movement state machine, updating bottom-anchored standing/crouching
 * collision bodies, keeping grounded shadows synced, and enforcing arena bounds.
 */
export class FighterEntity {
  private readonly scene: Phaser.Scene;
  private readonly config: CharacterConfig;
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly groundY: number;
  private readonly arenaBounds: ArenaBounds;

  private facing: 'left' | 'right';
  private movementState: FighterMovementState = 'idle';
  private isCrouching = false;

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
    body.setMaxVelocity(config.stats.runSpeed, 1200);
    body.setDragX(config.physics.groundDrag);

    this.applyCollisionBody(false);
    this.sprite.play(config.animations.idle.key);
  }

  update(input: FighterInputSnapshot): void {
    const body = this.getArcadeBody();
    const onGround = body.blocked.down || body.touching.down || body.onFloor();

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
      body.setMaxVelocity(this.config.stats.runSpeed, 1200);

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
      this.sprite.anims.currentAnim?.key !== targetAnim.key
    ) {
      this.sprite.play(targetAnim.key, true);
      this.movementState = decision.state;
    }

    this.syncShadow(decision.isCrouching);
  }

  getConfig(): CharacterConfig {
    return this.config;
  }

  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  getFacing(): 'left' | 'right' {
    return this.facing;
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
      facing: this.facing,
      animationKey: this.sprite.anims.currentAnim?.key ?? '',
    };
  }

  destroy(): void {
    this.shadow.destroy();
    this.sprite.destroy();
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
