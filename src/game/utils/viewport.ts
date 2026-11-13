import {GAME_ASPECT_RATIO, GAME_HEIGHT, GAME_WIDTH} from '../config/constants';

export interface FittedCanvasDimensions {
  width: number;
  height: number;
  scale: number;
}

/**
 * Computes the largest 16:9 pixel-rounded dimensions that fit cleanly inside
 * a container without cropping or stretching.
 */
export function calculateFittedCanvasSize(
  containerWidth: number,
  containerHeight: number,
  logicalWidth: number = GAME_WIDTH,
  logicalHeight: number = GAME_HEIGHT,
): FittedCanvasDimensions {
  if (containerWidth <= 0 || containerHeight <= 0 || logicalWidth <= 0 || logicalHeight <= 0) {
    return {width: 0, height: 0, scale: 0};
  }

  const targetAspect = logicalWidth / logicalHeight;
  const containerAspect = containerWidth / containerHeight;

  let width: number;
  let height: number;

  if (containerAspect > targetAspect) {
    height = Math.floor(containerHeight);
    width = Math.floor(height * targetAspect);
  } else {
    width = Math.floor(containerWidth);
    height = Math.floor(width / targetAspect);
  }

  return {
    width,
    height,
    scale: width / logicalWidth,
  };
}

/**
 * Recommends landscape orientation on portrait mobile / narrow viewports.
 * Desktop viewports in portrait-ish split windows above 900px wide are excluded.
 */
export function shouldRecommendLandscape(viewportWidth: number, viewportHeight: number): boolean {
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    return false;
  }

  const isPortrait = viewportHeight > viewportWidth;
  const isCompactViewport = viewportWidth < 900;

  return isPortrait && isCompactViewport;
}

export function isLandscapeAspect(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) {
    return false;
  }
  return width / height >= 1 && GAME_ASPECT_RATIO > 1;
}
