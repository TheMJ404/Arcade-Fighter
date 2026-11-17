import {useEffect, useState} from 'react';
import {shouldRecommendLandscape} from '../game/utils/viewport';

/**
 * Non-blocking mobile orientation advisory displayed only on compact portrait screens.
 * Automatically hides when the viewport rotates to landscape or is dismissed by the user.
 */
export function OrientationOverlay() {
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? shouldRecommendLandscape(window.innerWidth, window.innerHeight)
      : false,
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const updateOrientation = () => {
      const recommend = shouldRecommendLandscape(window.innerWidth, window.innerHeight);
      setIsPortraitMobile(recommend);
      if (!recommend) {
        setDismissed(false);
      }
    };

    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  if (!isPortraitMobile || dismissed) {
    return null;
  }

  return (
    <aside
      role="status"
      aria-live="polite"
      data-testid="orientation-advisory"
      className="relative z-20 mx-auto mt-2 flex w-[calc(100%-1.5rem)] max-w-md shrink-0 items-center justify-between gap-3 rounded-lg border border-[#3f326b] bg-[#131636]/95 px-4 py-2 text-[#f4e8c1] shadow-lg"
    >
      <div className="flex items-center gap-3 min-w-0">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0 text-[#fde68a]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="4" y="7" width="16" height="10" rx="2" />
          <path d="M18 11v2" />
        </svg>
        <p className="text-xs leading-snug text-[#d8d4ec]">
          Rotate to landscape for the best 16:9 arcade view.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="min-h-11 shrink-0 rounded-md border border-[#51427a] bg-[#1f1c47] px-3 py-2 text-xs font-semibold text-[#f4e8c1] transition-colors hover:bg-[#2d2154] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fde68a]"
      >
        Dismiss
      </button>
    </aside>
  );
}
