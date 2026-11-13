import Phaser from 'phaser';
import type {ArenaSpawnPoint} from '../config/arenaConfig';
import {computeCharacterGroundY, type CharacterConfig} from '../config/characterConfig';

/**
 * Reusable Phaser character wrapper responsible for registering a fighter's
 * animations, rendering their grounded contact shadow, and spawning their sprite
 * aligned to the arena's floor plane.
 */
export class FighterEntity {
  private readonly scene: Phaser.Scene;
  private readonly config: CharacterConfig;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private facing: 'left' | 'right';

  constructor(scene: Phaser.Scene, config: CharacterConfig, spawn: ArenaSpawnPoint) {
    this.scene = scene;
    this.config = config;
    this.facing = spawn.facing;

    this.ensurePixelFiltering();
    this.registerAnimations();

    const groundY = computeCharacterGroundY(spawn.y, config.render.footOffsetY);

    this.shadow = scene.add
      .ellipse(
        Math.round(spawn.x),
        groundY - 2,
        config.render.shadowWidth,
        config.render.shadowHeight,
        0x070512,
        0.42,
      )
      .setDepth(2);

    this.sprite = scene.add
      .sprite(Math.round(spawn.x), groundY, config.sprite.textureKey, config.animations.idle.startFrame)
      .setOrigin(config.render.originX, config.render.originY)
      .setScale(config.render.scale)
      .setFlipX(this.facing === 'left')
      .setDepth(3);

    this.sprite.play(config.animations.idle.key);
  }

  getConfig(): CharacterConfig {
    return this.config;
  }

  getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  getFacing(): 'left' | 'right' {
    return this.facing;
  }

  destroy(): void {
    this.shadow.destroy();
    this.sprite.destroy();
  }

  private ensurePixelFiltering(): void {
    const textureKey = this.config.sprite.textureKey;
    if (this.scene.textures.exists(textureKey)) {
      this.scene.textures.get(textureKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }

  private registerAnimations(): void {
    const idle = this.config.animations.idle;
    if (this.scene.anims.exists(idle.key)) {
      return;
    }

    this.scene.anims.create({
      key: idle.key,
      frames: this.scene.anims.generateFrameNumbers(idle.textureKey, {
        start: idle.startFrame,
        end: idle.endFrame,
      }),
      frameRate: idle.frameRate,
      repeat: idle.repeat,
    });
  }
}
