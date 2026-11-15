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

type ButtonTheme = 'move' | 'punch' | 'kick' | 'block';

const THEME_CLASSES: Record<ButtonTheme, {idle: string; pressed: string}> = {
  move: {
    idle: 'border-[#7c6ab8]/70 bg-[#131636]/75 text-[#f4e8c1]',
    pressed: 'border-[#fde68a] bg-[#3b2d6e]/90 text-[#fde68a]',
  },
  punch: {
    idle: 'border-[#f59e0b]/75 bg-[#2a1b0e]/80 text-[#fde68a]',
    pressed: 'border-[#fef08a] bg-[#78350f]/90 text-[#ffffff]',
  },
  kick: {
    idle: 'border-[#ef4444]/75 bg-[#2d1219]/80 text-[#fecaca]',
    pressed: 'border-[#fca5a5] bg-[#7f1d1d]/90 text-[#ffffff]',
  },
  block: {
    idle: 'border-[#38bdf8]/75 bg-[#0f2236]/80 text-[#bae6fd]',
    pressed: 'border-[#e0f2fe] bg-[#075985]/90 text-[#ffffff]',
  },
};

interface ArcadeTouchButtonProps {
  control: VirtualControlButton;
  label: string;
  shortTag?: string;
  icon?: ReactNode;
  testId: string;
  theme?: ButtonTheme;
  sizeClass?: string;
}

function ArcadeTouchButton({
  control,
  label,
  shortTag,
  icon,
  testId,
  theme = 'move',
  sizeClass = 'h-12 w-12',
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

  const palette = THEME_CLASSES[theme];
  const activeStyles = pressed
    ? `translate-y-0.5 shadow-inner ${palette.pressed}`
    : `shadow-md ${palette.idle}`;

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
      className={`touch-none select-none flex flex-col items-center justify-center rounded-lg border-2 font-bold tracking-wider uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fde68a] ${sizeClass} ${activeStyles}`}
    >
      {icon}
      {shortTag ? <span className="text-[11px] leading-none">{shortTag}</span> : null}
    </button>
  );
}

/**
 * Responsive virtual arcade touch controls for mobile and touch-capable browsers.
 * Combines directional movement (Left, Right, Jump, Crouch) with the five Phase 5
 * combat controls (Light Punch, Heavy Punch, Light Kick, Heavy Kick, Block).
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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-end justify-between px-2.5 pb-2.5 sm:px-4 sm:pb-3.5"
    >
      {/* Left-hand movement cluster: Jump above, Left / Crouch / Right below */}
      <div className="pointer-events-auto flex flex-col items-center gap-1.5">
        <ArcadeTouchButton
          control="jump"
          label="Jump"
          icon={<DirectionArrowIcon direction="up" />}
          testId="touch-jump"
          theme="move"
          sizeClass="h-12 w-12"
        />
        <div className="flex items-center gap-1.5">
          <ArcadeTouchButton
            control="left"
            label="Move Left"
            icon={<DirectionArrowIcon direction="left" />}
            testId="touch-left"
            theme="move"
            sizeClass="h-12 w-12"
          />
          <ArcadeTouchButton
            control="crouch"
            label="Crouch"
            icon={<DirectionArrowIcon direction="down" />}
            testId="touch-crouch"
            theme="move"
            sizeClass="h-12 w-12"
          />
          <ArcadeTouchButton
            control="right"
            label="Move Right"
            icon={<DirectionArrowIcon direction="right" />}
            testId="touch-right"
            theme="move"
            sizeClass="h-12 w-12"
          />
        </div>
      </div>

      {/* Right-hand 5-button combat cluster: Block + LP/HP (top) & LK/HK (bottom) */}
      <div className="pointer-events-auto flex items-end gap-1.5">
        <ArcadeTouchButton
          control="block"
          label="Block"
          shortTag="BLK"
          testId="touch-block"
          theme="block"
          sizeClass="h-25.5 w-12"
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <ArcadeTouchButton
              control="lightPunch"
              label="Light Punch"
              shortTag="LP"
              testId="touch-light-punch"
              theme="punch"
              sizeClass="h-12 w-12"
            />
            <ArcadeTouchButton
              control="heavyPunch"
              label="Heavy Punch"
              shortTag="HP"
              testId="touch-heavy-punch"
              theme="punch"
              sizeClass="h-12 w-12"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <ArcadeTouchButton
              control="lightKick"
              label="Light Kick"
              shortTag="LK"
              testId="touch-light-kick"
              theme="kick"
              sizeClass="h-12 w-12"
            />
            <ArcadeTouchButton
              control="heavyKick"
              label="Heavy Kick"
              shortTag="HK"
              testId="touch-heavy-kick"
              theme="kick"
              sizeClass="h-12 w-12"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
