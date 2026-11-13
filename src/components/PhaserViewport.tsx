import type Phaser from 'phaser';
import {useEffect, useRef} from 'react';
import {createArcadeFighterGame, destroyArcadeFighterGame} from '../game/createGame';
import {gameEvents} from '../game/events/gameEvents';

/**
 * Dedicated React host component for the Phaser game canvas.
 * Handles single-instance mounting (including React Strict Mode),
 * responsive resizing without recreation, and complete cleanup on unmount.
 */
export function PhaserViewport() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || gameRef.current) {
      return;
    }

    const game = createArcadeFighterGame(container);
    gameRef.current = game;

    const unsubscribeReady = gameEvents.on('scene:ready', () => {
      document.body.dataset.state = 'preview';
    });

    let resizeRafId: number | null = null;
    const handleResize = () => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = requestAnimationFrame(() => {
        resizeRafId = null;
        if (gameRef.current) {
          gameRef.current.scale.refresh();
        }
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      unsubscribeReady();
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);

      const activeGame = gameRef.current;
      gameRef.current = null;
      destroyArcadeFighterGame(activeGame);
      delete document.body.dataset.state;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="phaser-container"
      aria-label="Arcade Fighter game viewport"
      className="h-full w-full overflow-hidden select-none"
    />
  );
}
