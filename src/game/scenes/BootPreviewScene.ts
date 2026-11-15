import Phaser from 'phaser';
import {ARENA_ASSETS, CHARACTER_ASSETS} from '../assets/assetManifest';
import {FighterEntity, type FighterBodySnapshot} from '../characters/FighterEntity';
import {
  TrainingDummyEntity,
  type TrainingDummySnapshot,
} from '../characters/TrainingDummyEntity';
import {CombatManager} from '../combat/CombatManager';
import {DEFAULT_COMBAT_CONFIG} from '../combat/combatConfig';
import type {ActiveHitboxDescriptor, HitImpactEvent} from '../combat/combatTypes';
import {resolveGroundedPushbox} from '../combat/HitboxManager';
import {
  type ArenaConfig,
  calculateCoverScale,
  getArenaConfig,
} from '../config/arenaConfig';
import {getCharacterConfig} from '../config/characterConfig';
import {GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS} from '../config/constants';
import {gameEvents} from '../events/gameEvents';
import {InputManager} from '../input/InputManager';

interface DriftingPetal {
  rect: Phaser.GameObjects.Rectangle;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
}

interface LanternPulse {
  glow: Phaser.GameObjects.Ellipse;
  baseAlpha: number;
  speed: number;
  phase: number;
}

/**
 * Primary fighting arena scene (Phase 5: Combat System).
 * Coordinates the Moonlit Temple arena, Player 1, temporary Training Dummy,
 * CombatManager hitboxes/damage/blocking, and temporary damage verification text.
 */
export class BootPreviewScene extends Phaser.Scene {
  private arenaConfig: ArenaConfig;
  private player1: FighterEntity | null = null;
  private trainingDummy: TrainingDummyEntity | null = null;
  private combatManager: CombatManager | null = null;
  private inputManager: InputManager | null = null;
  private tempHealthReadout: Phaser.GameObjects.Text | null = null;
  private unsubHitEvent: (() => void) | null = null;
  private petals: DriftingPetal[] = [];
  private lanternPulses: LanternPulse[] = [];
  private elapsedSeconds = 0;

  constructor() {
    super({key: SCENE_KEYS.BOOT_PREVIEW});
    this.arenaConfig = getArenaConfig('moonlit-temple');
  }

  getArenaConfig(): ArenaConfig {
    return this.arenaConfig;
  }

  getPlayer1Snapshot(): FighterBodySnapshot | null {
    return this.player1?.getBodySnapshot() ?? null;
  }

  getTrainingDummySnapshot(): TrainingDummySnapshot | null {
    return this.trainingDummy?.getSnapshot() ?? null;
  }

  getCombatDebugSnapshot(): {
    player1: FighterBodySnapshot | null;
    dummy: TrainingDummySnapshot | null;
    activeHitboxes: ActiveHitboxDescriptor[];
    lastHitEvent: HitImpactEvent | null;
  } {
    return {
      player1: this.getPlayer1Snapshot(),
      dummy: this.getTrainingDummySnapshot(),
      activeHitboxes: this.combatManager?.getActiveHitboxes() ?? [],
      lastHitEvent: this.combatManager?.getLastHitEvent() ?? null,
    };
  }

  setTrainingDummyBlocking(enabled: boolean): void {
    this.trainingDummy?.setBlocking(enabled);
  }

  preload(): void {
    if (!this.textures.exists(ARENA_ASSETS.moonlitTemple.key)) {
      this.load.image(ARENA_ASSETS.moonlitTemple.key, ARENA_ASSETS.moonlitTemple.url);
    }

    for (const asset of Object.values(CHARACTER_ASSETS)) {
      if (!this.textures.exists(asset.key)) {
        this.load.spritesheet(asset.key, asset.url, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight,
        });
      }
    }
  }

  create(): void {
    this.petals = [];
    this.lanternPulses = [];
    this.elapsedSeconds = 0;

    const {bounds} = this.arenaConfig;
    this.physics.world.setBounds(
      bounds.left,
      0,
      bounds.right - bounds.left,
      bounds.groundY,
    );

    this.renderArenaBackground();
    this.createAmbientLanternGlows();
    this.createSakuraPetals();
    this.inputManager = new InputManager(this);
    this.combatManager = new CombatManager(DEFAULT_COMBAT_CONFIG);
    this.spawnCharacters();
    this.createTemporaryHealthReadout();

    this.unsubHitEvent = gameEvents.on('combat:hit', (impact) => {
      this.spawnHitImpactFeedback(impact);
      this.refreshTemporaryHealthReadout();
    });

    this.scale.on('resize', this.handleScaleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleScaleResize, this);
      this.unsubHitEvent?.();
      this.unsubHitEvent = null;
      this.combatManager?.destroy();
      this.combatManager = null;
      this.inputManager?.destroy();
      this.inputManager = null;
      this.player1?.destroy();
      this.player1 = null;
      this.trainingDummy?.destroy();
      this.trainingDummy = null;
      this.tempHealthReadout?.destroy();
      this.tempHealthReadout = null;
    });

    const p1Sprite = this.player1?.getSprite();
    const p1Config = this.player1?.getConfig();

    gameEvents.emit('scene:ready', {
      sceneKey: SCENE_KEYS.BOOT_PREVIEW,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      arenaId: this.arenaConfig.id,
      groundY: this.arenaConfig.bounds.groundY,
      characters:
        p1Sprite && p1Config && this.player1
          ? [
              {
                id: p1Config.id,
                x: p1Sprite.x,
                y: p1Sprite.y,
                facing: this.player1.getFacing(),
                animationKey: p1Config.animations.idle.key,
              },
            ]
          : [],
    });
  }

  update(_time: number, delta: number): void {
    const dtMs = Math.min(delta, 50);
    const dt = dtMs / 1000;
    this.elapsedSeconds += dt;

    if (this.player1 && this.inputManager) {
      const inputSnapshot = this.inputManager.sample();
      this.player1.update(inputSnapshot, dtMs);
    }

    this.trainingDummy?.update(dtMs);

    if (this.player1 && this.trainingDummy && !this.trainingDummy.isDefeated()) {
      const p1Snap = this.player1.getBodySnapshot();
      const dummySnap = this.trainingDummy.getSnapshot();
      if (p1Snap.onGround && Math.abs(dummySnap.bottom - this.arenaConfig.bounds.groundY) < 4) {
        const separated = resolveGroundedPushbox(
          p1Snap.x,
          dummySnap.x,
          88,
          this.arenaConfig.bounds.left,
          this.arenaConfig.bounds.right,
          p1Snap.width / 2,
          dummySnap.width / 2,
        );
        if (separated.aX !== p1Snap.x) {
          this.player1.getSprite().setX(separated.aX);
        }
        if (separated.bX !== dummySnap.x) {
          this.trainingDummy.setPositionX(separated.bX);
        }
      }
    }

    this.combatManager?.update();

    for (let i = 0; i < this.lanternPulses.length; i += 1) {
      const pulse = this.lanternPulses[i];
      const wave = Math.sin(this.elapsedSeconds * pulse.speed + pulse.phase);
      pulse.glow.setAlpha(pulse.baseAlpha + wave * 0.05);
    }

    for (let i = 0; i < this.petals.length; i += 1) {
      const petal = this.petals[i];
      petal.x += petal.speedX * dt;
      petal.y += petal.speedY * dt;

      if (petal.y > this.arenaConfig.bounds.groundY + 18) {
        petal.y = -8 - (i % 5) * 14;
        petal.x = 60 + ((i * 73) % (GAME_WIDTH - 120));
      }
      if (petal.x > GAME_WIDTH + 12) {
        petal.x = -8;
      }

      const swayOffset = Math.sin(this.elapsedSeconds * petal.swayFreq + petal.phase) * petal.swayAmp;
      petal.rect.setPosition(Math.round(petal.x + swayOffset), Math.round(petal.y));
    }
  }

  private renderArenaBackground(): void {
    const textureKey = this.arenaConfig.textureKey;
    const texture = this.textures.get(textureKey);
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

    const sourceImage = texture.getSourceImage() as {width?: number; height?: number};
    const sourceWidth = sourceImage.width ?? GAME_WIDTH;
    const sourceHeight = sourceImage.height ?? GAME_HEIGHT;
    const cover = calculateCoverScale(sourceWidth, sourceHeight, GAME_WIDTH, GAME_HEIGHT);

    const backdrop = this.add.image(cover.x, cover.y, textureKey);
    backdrop.setDisplaySize(cover.width, cover.height);
    backdrop.setOrigin(0.5, 0.5);
    backdrop.setDepth(0);
  }

  private spawnCharacters(): void {
    const player1Config = getCharacterConfig('player-1');
    this.player1 = new FighterEntity(
      this,
      player1Config,
      this.arenaConfig.spawnPoints.player1,
      this.arenaConfig.bounds,
    );

    this.trainingDummy = new TrainingDummyEntity(
      this,
      this.arenaConfig.spawnPoints.player2,
      DEFAULT_COMBAT_CONFIG.trainingOpponent.maxHealth,
    );

    this.combatManager?.registerCombatant(this.player1);
    this.combatManager?.registerCombatant(this.trainingDummy);
  }

  private createTemporaryHealthReadout(): void {
    this.tempHealthReadout = this.add
      .text(14, 12, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f4e8c1',
        backgroundColor: '#0b0d1fcc',
        padding: {x: 8, y: 4},
      })
      .setDepth(6);
    this.refreshTemporaryHealthReadout();
  }

  private refreshTemporaryHealthReadout(): void {
    if (!this.tempHealthReadout || !this.player1 || !this.trainingDummy) {
      return;
    }
    const p1Hp = `${this.player1.getHealth()}/${this.player1.getMaxHealth()}`;
    const dummyHp = `${this.trainingDummy.getHealth()}/${this.trainingDummy.getMaxHealth()}`;
    this.tempHealthReadout.setText(`P1 HP: ${p1Hp}   |   DUMMY HP: ${dummyHp}`);
  }

  private spawnHitImpactFeedback(impact: HitImpactEvent): void {
    const sparkColor = impact.wasBlocked ? 0x60a5fa : 0xfbbf24;
    const spark = this.add
      .circle(impact.impactX, impact.impactY, impact.wasBlocked ? 14 : 18, sparkColor, 0.75)
      .setDepth(6);

    const damageLabel = impact.wasBlocked
      ? `BLOCKED -${impact.damageApplied}`
      : `-${impact.damageApplied}`;
    const popup = this.add
      .text(impact.impactX, impact.impactY - 22, damageLabel, {
        fontFamily: 'monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: impact.wasBlocked ? '#93c5fd' : '#fde047',
        stroke: '#0b0d1f',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(6);

    this.tweens.add({
      targets: spark,
      scale: 1.7,
      alpha: 0,
      duration: 180,
      onComplete: () => spark.destroy(),
    });

    this.tweens.add({
      targets: popup,
      y: impact.impactY - 56,
      alpha: 0,
      duration: 520,
      onComplete: () => popup.destroy(),
    });
  }

  private createAmbientLanternGlows(): void {
    const glowSpots = [
      {x: 200, y: 204, w: 94, h: 112, color: 0xff5a1f, baseAlpha: 0.12, speed: 3.1},
      {x: 686, y: 274, w: 36, h: 36, color: 0xffb347, baseAlpha: 0.11, speed: 2.6},
      {x: 866, y: 314, w: 64, h: 64, color: 0xffb347, baseAlpha: 0.13, speed: 2.8},
    ];

    for (let i = 0; i < glowSpots.length; i += 1) {
      const spot = glowSpots[i];
      const glow = this.add.ellipse(spot.x, spot.y, spot.w, spot.h, spot.color, spot.baseAlpha);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      glow.setDepth(1);
      this.lanternPulses.push({
        glow,
        baseAlpha: spot.baseAlpha,
        speed: spot.speed,
        phase: i * 1.4,
      });
    }
  }

  private createSakuraPetals(): void {
    const petalPalette = [0xf9a8d4, 0xfbcfe8, 0xf472b6];
    const count = 14;

    for (let i = 0; i < count; i += 1) {
      const startX = 40 + ((i * 69) % (GAME_WIDTH - 80));
      const startY = 24 + ((i * 37) % 340);
      const color = petalPalette[i % petalPalette.length];
      const width = i % 3 === 0 ? 3 : 2;
      const height = 2;

      const rect = this.add
        .rectangle(startX, startY, width, height, color, 0.85)
        .setDepth(i % 2 === 0 ? 1 : 4);
      this.petals.push({
        rect,
        x: startX,
        y: startY,
        speedX: 12 + (i % 4) * 4,
        speedY: 16 + (i % 3) * 5,
        swayAmp: 6 + (i % 3) * 3,
        swayFreq: 1.6 + (i % 4) * 0.35,
        phase: i * 0.9,
      });
    }
  }

  private handleScaleResize(gameSize: Phaser.Structs.Size): void {
    gameEvents.emit('viewport:resized', {
      width: Math.round(gameSize.width),
      height: Math.round(gameSize.height),
    });
  }
}
