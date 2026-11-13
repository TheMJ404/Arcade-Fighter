import test from 'node:test';
import assert from 'node:assert/strict';
import {GAME_HEIGHT, GAME_WIDTH} from '../config/constants';
import {calculateFittedCanvasSize, shouldRecommendLandscape} from './viewport';

test('logical game resolution is 960x540 (16:9)', () => {
  assert.equal(GAME_WIDTH, 960);
  assert.equal(GAME_HEIGHT, 540);
  assert.equal(Math.round((GAME_WIDTH / GAME_HEIGHT) * 1000), 1778);
});

test('calculateFittedCanvasSize fits within wide desktop viewport while preserving 16:9', () => {
  const fitted = calculateFittedCanvasSize(1440, 900);
  assert.equal(fitted.width, 1440);
  assert.equal(fitted.height, 810);
  assert.equal(fitted.scale, 1.5);
});

test('calculateFittedCanvasSize fits within mobile landscape viewport (844x390)', () => {
  const fitted = calculateFittedCanvasSize(844, 390);
  assert.equal(fitted.height, 390);
  assert.equal(fitted.width, 693);
});

test('calculateFittedCanvasSize fits within mobile portrait viewport (390x844)', () => {
  const fitted = calculateFittedCanvasSize(390, 844);
  assert.equal(fitted.width, 390);
  assert.equal(fitted.height, 219);
});

test('calculateFittedCanvasSize returns zeros on invalid dimensions', () => {
  assert.deepEqual(calculateFittedCanvasSize(0, 500), {width: 0, height: 0, scale: 0});
  assert.deepEqual(calculateFittedCanvasSize(500, -10), {width: 0, height: 0, scale: 0});
});

test('shouldRecommendLandscape flags compact portrait viewports and ignores landscape/desktop', () => {
  assert.equal(shouldRecommendLandscape(390, 844), true);
  assert.equal(shouldRecommendLandscape(768, 1024), true);
  assert.equal(shouldRecommendLandscape(844, 390), false);
  assert.equal(shouldRecommendLandscape(1440, 900), false);
  assert.equal(shouldRecommendLandscape(1000, 1200), false);
});
