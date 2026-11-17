import Phaser from 'phaser';
import {DEFAULT_COMBAT_CONFIG} from '../combat/combatConfig';
import type {AttackDefinition, CombatantActor, RectBox} from '../combat/combatTypes';
import {applyHealthChange, isHealthDepleted} from '../combat/DamageSystem';
import type {ArenaSpawnPoint} from '../config/arenaConfig';
import {computePhysicsBodyOffset} from '../config/characterConfig';

const DUMMY_TEXTURE_KEY = 'training-dummy-sheet';
const DUMMY_FRAME_SIZE = 144;

export interface TrainingDummySnapshot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bottom: number;
  velocityX: number;
  health: number;
  maxHealth: number;
  isBlocking: boolean;
  isDefeated: boolean;
  hitstunRemainingMs: number;
  facing: 'left' | 'right';
}

/**
 * Temporary stationary training opponent implementing CombatantActor so Player 1's
 * strikes, hitboxes, damage, knockback, blocking, and defeat handling can be verified
 * directly in-arena before Phase 6+ CPU fighters are introduced.
 */
export class TrainingDummyEntity implements CombatantActor {
  private readonly scene: Phaser.Scene;
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly healthLabel: Phaser.GameObjects.Text;
  private readonly groundY: number;

  private readonly id = DEFAULT_COMBAT_CONFIG.trainingOpponent.id;
  private readonly name = DEFAULT_COMBAT_CONFIG.trainingOpponent.name;
  private readonly maxHealth: number;
  private health: number;
  private facing: 'left' | 'right';
  private blocking = false;
  private stunRemainingMs = 0;
  private flashRemainingMs = 0;

  constructor(
    scene: Phaser.Scene,
    spawn: ArenaSpawnPoint,
    maxHealth: number = DEFAULT_COMBAT_CONFIG.trainingOpponent.maxHealth,
  ) {
    this.scene = scene;
    this.maxHealth = Math.max(1, maxHealth);
    this.health = this.maxHealth;
    this.facing = spawn.facing;
    this.groundY = Math.round(spawn.y);

    ensureTrainingDummyTexture(scene);

    this.shadow = scene.add
      .ellipse(Math.round(spawn.x), this.groundY - 2, 136, 20, 0x070512, 0.42)
      .setDepth(2);

    this.sprite = scene.physics.add
      .sprite(Math.round(spawn.x), this.groundY, DUMMY_TEXTURE_KEY, 0)
      .setOrigin(0.5, 1)
      .setScale(2)
      .setFlipX(this.facing === 'left')
      .setDepth(3);

    const body = this.getArcadeBody();
    body.setCollideWorldBounds(true);
    body.setGravityY(1650);
    body.setMaxVelocity(900, 1200);
    body.setDragX(DEFAULT_COMBAT_CONFIG.trainingOpponent.knockbackDragX);

    const unscaledW = DEFAULT_COMBAT_CONFIG.trainingOpponent.bodyWidth / 2;
    const unscaledH = DEFAULT_COMBAT_CONFIG.trainingOpponent.bodyHeight / 2;
    const {offsetX, offsetY} = computePhysicsBodyOffset(
      DUMMY_FRAME_SIZE,
      DUMMY_FRAME_SIZE,
      unscaledW,
      unscaledH,
    );
    body.setSize(unscaledW, unscaledH, false);
    body.setOffset(offsetX, offsetY);

    this.healthLabel = scene.add
      .text(Math.round(spawn.x), this.groundY - 246, this.formatLabel(), {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f4e8c1',
        backgroundColor: '#131636cc',
        padding: {x: 6, y: 3},
      })
      .setOrigin(0.5, 1)
      .setDepth(5);
  }

  update(deltaMs: number): void {
    const safeDelta = Math.max(0, deltaMs);

    if (this.flashRemainingMs > 0) {
      this.flashRemainingMs = Math.max(0, this.flashRemainingMs - safeDelta);
      if (this.flashRemainingMs === 0) {
        this.sprite.clearTint();
      }
    }

    if (this.stunRemainingMs > 0) {
      this.stunRemainingMs = Math.max(0, this.stunRemainingMs - safeDelta);
    }

    if (this.isDefeated()) {
      this.sprite.setFrame(1);
      this.sprite.setAlpha(0.68);
      this.sprite.setAngle(this.facing === 'left' ? 14 : -14);
    } else if (this.stunRemainingMs > 0) {
      this.sprite.setFrame(this.blocking ? 2 : 1);
      this.sprite.setAngle(this.blocking ? 0 : this.facing === 'left' ? 6 : -6);
    } else if (this.blocking) {
      this.sprite.setFrame(2);
      this.sprite.setAngle(0);
    } else {
      this.sprite.setFrame(0);
      this.sprite.setAngle(0);
    }

    this.shadow.setPosition(Math.round(this.sprite.x), this.groundY - 2);
    this.healthLabel.setPosition(Math.round(this.sprite.x), Math.round(this.sprite.y - 246));
  }

  setBlocking(enabled: boolean): void {
    if (this.isDefeated()) {
      this.blocking = false;
      return;
    }
    this.blocking = enabled;
  }

  resetToInitialState(spawn: ArenaSpawnPoint): void {
    this.health = this.maxHealth;
    this.blocking = false;
    this.stunRemainingMs = 0;
    this.flashRemainingMs = 0;
    this.facing = spawn.facing;

    this.sprite.clearTint();
    this.sprite.setAlpha(1);
    this.sprite.setAngle(0);
    this.sprite.setFrame(0);
    this.sprite.setFlipX(this.facing === 'left');
    this.sprite.setPosition(Math.round(spawn.x), this.groundY);

    const body = this.getArcadeBody();
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);

    this.shadow.setPosition(Math.round(this.sprite.x), this.groundY - 2);
    this.healthLabel.setPosition(Math.round(this.sprite.x), Math.round(this.sprite.y - 246));
    this.healthLabel.setColor('#f4e8c1');
    this.healthLabel.setText(this.formatLabel());
  }

  getCombatantId(): string {
    return this.id;
  }

  getDisplayName(): string {
    return this.name;
  }

  getPosition(): {x: number; y: number} {
    return {x: this.sprite.x, y: this.sprite.y};
  }

  setPositionX(x: number): void {
    this.sprite.setX(x);
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
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  isBlocking(): boolean {
    return this.blocking;
  }

  isDefeated(): boolean {
    return isHealthDepleted(this.health);
  }

  getActiveAttack(): {
    activationId: number;
    attack: AttackDefinition;
    hasHitTarget: (targetId: string) => boolean;
    markTargetHit: (targetId: string) => void;
  } | null {
    return null;
  }

  applyCombatImpact(impact: {
    damage: number;
    wasBlocked: boolean;
    knockbackVelocityX: number;
    stunDurationMs: number;
  }): {remainingHealth: number; defeated: boolean} {
    this.health = applyHealthChange(this.health, this.maxHealth, impact.damage);
    const defeated = isHealthDepleted(this.health);

    if (defeated) {
      this.blocking = false;
    }

    this.stunRemainingMs = Math.max(impact.stunDurationMs, 180);
    this.flashRemainingMs = 130;
    this.sprite.setTint(impact.wasBlocked ? 0x7dd3fc : 0xff7b7b);

    const body = this.getArcadeBody();
    body.setVelocityX(impact.knockbackVelocityX);

    this.healthLabel.setText(this.formatLabel());
    if (defeated) {
      this.healthLabel.setColor('#fca5a5');
    }

    return {remainingHealth: this.health, defeated};
  }

  getSnapshot(): TrainingDummySnapshot {
    const body = this.getArcadeBody();
    return {
      id: this.id,
      x: Math.round(this.sprite.x * 100) / 100,
      y: Math.round(this.sprite.y * 100) / 100,
      width: body.width,
      height: body.height,
      bottom: Math.round(body.bottom * 100) / 100,
      velocityX: Math.round(body.velocity.x * 100) / 100,
      health: this.health,
      maxHealth: this.maxHealth,
      isBlocking: this.blocking,
      isDefeated: this.isDefeated(),
      hitstunRemainingMs: Math.round(this.stunRemainingMs),
      facing: this.facing,
    };
  }

  destroy(): void {
    this.healthLabel.destroy();
    this.shadow.destroy();
    this.sprite.destroy();
  }

  private formatLabel(): string {
    if (this.isDefeated()) {
      return `DUMMY 0/${this.maxHealth} KO`;
    }
    return `DUMMY ${this.health}/${this.maxHealth}`;
  }

  private getArcadeBody(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }
}

function ensureTrainingDummyTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(DUMMY_TEXTURE_KEY)) {
    return;
  }

  const canvasTex = scene.textures.createCanvas(
    DUMMY_TEXTURE_KEY,
    DUMMY_FRAME_SIZE * 3,
    DUMMY_FRAME_SIZE,
  );
  if (!canvasTex) {
    return;
  }

  const ctx = canvasTex.getContext();
  ctx.imageSmoothingEnabled = false;

  drawDummyFrame(ctx, 0, 'idle');
  drawDummyFrame(ctx, DUMMY_FRAME_SIZE, 'hit');
  drawDummyFrame(ctx, DUMMY_FRAME_SIZE * 2, 'block');

  canvasTex.refresh();
  canvasTex.setFilter(Phaser.Textures.FilterMode.NEAREST);

  canvasTex.add(0, 0, 0, 0, DUMMY_FRAME_SIZE, DUMMY_FRAME_SIZE);
  canvasTex.add(1, 0, DUMMY_FRAME_SIZE, 0, DUMMY_FRAME_SIZE, DUMMY_FRAME_SIZE);
  canvasTex.add(2, 0, DUMMY_FRAME_SIZE * 2, 0, DUMMY_FRAME_SIZE, DUMMY_FRAME_SIZE);
}

function drawDummyFrame(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  pose: 'idle' | 'hit' | 'block',
): void {
  const cx = offsetX + 72;
  const lean = pose === 'hit' ? -8 : pose === 'block' ? 2 : 0;
  const drop = pose === 'hit' ? 2 : pose === 'block' ? 3 : 0;

  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  // Weighted stone & iron base anchored at y = 143
  px(cx - 22, 130, 44, 14, '#1b1726');
  px(cx - 20, 132, 40, 10, '#474359');
  px(cx - 18, 134, 36, 4, '#6b6782');

  // Lower wooden post
  px(cx - 8, 98, 16, 34, '#24140e');
  px(cx - 6, 98, 12, 34, '#6b3e26');
  px(cx - 4, 100, 4, 30, '#8c5334');

  // Torso body (leaning cleanly on hit)
  const tx = cx + lean;
  const ty = 46 + drop;
  px(tx - 16, ty, 32, 54, '#1b1218');
  px(tx - 14, ty + 2, 28, 50, '#7c3f24');
  // Padded crimson sparring vest
  px(tx - 14, ty + 6, 28, 34, '#8f1d2c');
  px(tx - 12, ty + 8, 24, 28, '#b91c1c');
  // Gold belt trim
  px(tx - 14, ty + 38, 28, 5, '#d97706');
  px(tx - 12, ty + 39, 24, 3, '#fbbf24');

  // Head / bamboo sparring helm
  const hx = tx + (pose === 'hit' ? -4 : 0);
  const hy = ty - 26;
  px(hx - 12, hy, 24, 24, '#1b1218');
  px(hx - 10, hy + 2, 20, 20, '#8c5334');
  px(hx - 8, hy + 4, 16, 14, '#b5744a');
  // Headband
  px(hx - 10, hy + 5, 20, 5, pose === 'block' ? '#38bdf8' : '#dc2626');
  // Target eye slits
  px(hx + 2, hy + 11, 5, 3, '#1b1218');

  // Wooden sparring arms (facing right inside frame; flipX mirrors for left)
  if (pose === 'block') {
    // Raised defensive wooden shield planks
    px(tx + 8, ty + 2, 12, 34, '#1b1218');
    px(tx + 10, ty + 4, 8, 30, '#38bdf8');
    px(tx + 12, ty + 6, 4, 26, '#bae6fd');
  } else if (pose === 'hit') {
    // Flung back sparring arms
    px(tx - 24, ty + 8, 12, 8, '#1b1218');
    px(tx - 22, ty + 10, 8, 4, '#a16207');
    px(tx + 14, ty + 14, 12, 8, '#1b1218');
    px(tx + 16, ty + 16, 8, 4, '#a16207');
  } else {
    // Forward & rear wooden Wing Chun peg arms
    px(tx + 12, ty + 12, 18, 8, '#1b1218');
    px(tx + 12, ty + 14, 16, 4, '#9a5b35');
    px(tx - 18, ty + 18, 10, 7, '#1b1218');
    px(tx - 16, ty + 20, 8, 3, '#7c3f24');
  }
}
