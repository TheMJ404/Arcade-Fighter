import {
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import type {VirtualControlButton} from '../game/input/inputTypes';
import {virtualInputBridge} from '../game/input/virtualInputBridge';

function detectTouchControlsNeeded(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const coarsePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const hasTouchPoints =
    typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  return coarsePointer || hasTouchPoints || window.innerWidth < 1024;
}

function DirectionArrowIcon({
  direction,
}: {
  direction: 'left' | 'right' | 'up' | 'down';
}) {
  const pathByDirection = {
    left: 'M15 6L9 12L15 18V6Z',
    right: 'M9 6L15 12L9 18V6Z',
    up: 'M6 15L12 9L18 15H6Z',
    down: 'M6 9L12 15L18 9H6Z',
  } as const;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 fill-current"
    >
      <path d={pathByDirection[direction]} />
    </svg>
  );
}

interface ArcadeTouchButtonProps {
  control: VirtualControlButton;
  label: string;
  icon: ReactNode;
  testId: string;
  variant?: 'direction' | 'action';
}

function ArcadeTouchButton({
  control,
  label,
  icon,
  testId,
  variant = 'direction',
}: ArcadeTouchButtonProps) {
  const [pressed, setPressed] = useState(false);

  const release = () => {
    setPressed(false);
    virtualInputBridge.setButton(control, false);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointer events in headless browsers may not support capture
    }
    setPressed(true);
    virtualInputBridge.setButton(control, true);
  };

  const baseSize =
    variant === 'direction'
      ? 'h-14 w-14 sm:h-15 sm:w-15'
      : 'h-13 min-w-20 px-3.5 sm:h-14 sm:min-w-22';

  const activeStyles = pressed
    ? 'translate-y-0.5 border-[#fde68a] bg-[#3b2d6e]/90 text-[#fde68a] shadow-inner'
    : 'border-[#7c6ab8]/70 bg-[#131636]/75 text-[#f4e8c1] shadow-md';

  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      aria-pressed={pressed}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      className={`touch-none select-none flex items-center justify-center gap-1.5 rounded-lg border-2 font-bold tracking-wider uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fde68a] ${baseSize} ${activeStyles}`}
    >
      {icon}
      {variant === 'action' ? (
        <span className="text-[11px] leading-none">{label}</span>
      ) : null}
    </button>
  );
}

/**
 * Responsive virtual arcade touch controls for mobile and touch-capable browsers.
 * Writes directly to VirtualInputBridge so Phaser's InputManager reads simultaneous
 * directional + jump/crouch presses with zero frame lag or React render churn.
 */
export function TouchControls() {
  const [visible, setVisible] = useState<boolean>(() => detectTouchControlsNeeded());

  useEffect(() => {
    const syncVisibility = () => {
      const next = detectTouchControlsNeeded();
      setVisible(next);
      if (!next) {
        virtualInputBridge.reset();
      }
    };

    const handleReset = () => {
      virtualInputBridge.reset();
    };

    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)')
        : null;

    window.addEventListener('resize', syncVisibility);
    window.addEventListener('blur', handleReset);
    document.addEventListener('visibilitychange', handleReset);
    mediaQuery?.addEventListener('change', syncVisibility);

    return () => {
      virtualInputBridge.reset();
      window.removeEventListener('resize', syncVisibility);
      window.removeEventListener('blur', handleReset);
      document.removeEventListener('visibilitychange', handleReset);
      mediaQuery?.removeEventListener('change', syncVisibility);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      data-testid="touch-controls"
      aria-label="Mobile arcade controls"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-end justify-between px-3 pb-3 sm:px-5 sm:pb-4"
    >
      <div className="pointer-events-auto flex items-center gap-2.5">
        <ArcadeTouchButton
          control="left"
          label="Move Left"
          icon={<DirectionArrowIcon direction="left" />}
          testId="touch-left"
          variant="direction"
        />
        <ArcadeTouchButton
          control="right"
          label="Move Right"
          icon={<DirectionArrowIcon direction="right" />}
          testId="touch-right"
          variant="direction"
        />
      </div>

      <div className="pointer-events-auto flex flex-col items-end gap-2">
        <ArcadeTouchButton
          control="jump"
          label="Jump"
          icon={<DirectionArrowIcon direction="up" />}
          testId="touch-jump"
          variant="action"
        />
        <ArcadeTouchButton
          control="crouch"
          label="Crouch"
          icon={<DirectionArrowIcon direction="down" />}
          testId="touch-crouch"
          variant="action"
        />
      </div>
    </div>
  );
}
