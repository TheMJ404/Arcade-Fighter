import {useEffect, useState, type MouseEvent} from 'react';
import {
  CHARACTER_REGISTRY,
  resolveFighterIdFromSearch,
  type CharacterId,
} from '../game/config/characterConfig';
import {gameEvents} from '../game/events/gameEvents';

export interface TemporaryFighterOption {
  id: CharacterId;
  shortName: string;
  descriptor: string;
  buttonLabel: string;
  selectedLabel: string;
}

const FIGHTER_DESCRIPTORS: Record<CharacterId, string> = {
  'player-1': 'Original Fighter',
  'player-2': 'White Shirt Fighter',
  'player-3': 'Black Shirt Fighter',
};

export const TEMPORARY_FIGHTER_OPTIONS: readonly TemporaryFighterOption[] = (
  ['player-1', 'player-2', 'player-3'] as const
).map((id) => {
  const config = CHARACTER_REGISTRY[id];
  const descriptor = FIGHTER_DESCRIPTORS[id];
  return {
    id,
    shortName: config.name,
    descriptor,
    buttonLabel: `${config.name.toUpperCase()} – ${descriptor}`,
    selectedLabel: `${config.name} – ${descriptor}`,
  };
});

export function getInitialFighterSelection(): CharacterId {
  if (typeof window === 'undefined') {
    return 'player-1';
  }
  return resolveFighterIdFromSearch(window.location.search);
}

/**
 * Temporary development/testing bar for live switching between Player 1,
 * Player 2, and Player 3 inside the preview without manual URL edits.
 * Designed as a self-contained module to be cleanly removed in Phase 9.
 */
export function TemporaryFighterSwitcher() {
  const [selectedFighterId, setSelectedFighterId] = useState<CharacterId>(
    getInitialFighterSelection,
  );

  useEffect(() => {
    const unsubscribe = gameEvents.on('fighter:changed', ({fighterId}) => {
      setSelectedFighterId(fighterId);
    });
    return unsubscribe;
  }, []);

  const activeOption =
    TEMPORARY_FIGHTER_OPTIONS.find((option) => option.id === selectedFighterId) ??
    TEMPORARY_FIGHTER_OPTIONS[0];

  const handleSelectFighter = (
    fighterId: CharacterId,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    // Return keyboard focus to the document after pointer clicks so Space/WASD/attack
    // keys immediately control the fighter instead of re-triggering the HTML button.
    if (event.detail !== 0) {
      event.currentTarget.blur();
    }

    if (fighterId === selectedFighterId) {
      return;
    }

    setSelectedFighterId(fighterId);
    gameEvents.emit('fighter:switchRequested', {fighterId});
  };

  return (
    <section
      data-testid="temporary-fighter-switcher"
      aria-label="Fighter test selector"
      className="relative z-20 w-full shrink-0 border-b-2 border-[#352b63] bg-[#0e1029] px-3 py-1.5 shadow-[0_2px_0_#060714] lg:px-4 lg:py-2"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex flex-col gap-0.5 md:flex-row md:items-baseline md:justify-between lg:flex-col lg:justify-center">
          <h1 className="font-mono text-[11px] font-bold tracking-[0.14em] whitespace-nowrap text-[#fde68a] uppercase">
            FIGHTER TEST SELECTOR
          </h1>
          <p
            data-testid="selected-fighter-label"
            className="font-mono text-[11px] font-medium whitespace-nowrap text-[#d8d4ec] tabular-nums"
          >
            Selected: <span className="font-bold text-[#f4e8c1]">{activeOption.selectedLabel}</span>
          </p>
        </div>

        <div
          role="group"
          aria-label="Playable test fighters"
          className="grid grid-cols-1 gap-1 md:grid-cols-3 md:gap-1.5 lg:flex lg:flex-nowrap lg:items-center lg:gap-2"
        >
          {TEMPORARY_FIGHTER_OPTIONS.map((option) => {
            const isSelected = option.id === selectedFighterId;
            return (
              <button
                key={option.id}
                type="button"
                data-testid={`switch-fighter-${option.id}`}
                aria-pressed={isSelected}
                onClick={(event) => handleSelectFighter(option.id, event)}
                className={`min-h-8 cursor-pointer border-2 px-2.5 py-1 text-left font-mono text-[11px] font-bold tracking-tight whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fde68a] md:text-center lg:min-h-9 lg:px-3.5 lg:py-1.5 lg:text-xs ${
                  isSelected
                    ? 'border-[#fde68a] bg-[#36286b] text-[#fde68a] shadow-[inset_0_1px_0_rgba(254,240,138,0.28),0_2px_0_#060714]'
                    : 'border-[#473a75] bg-[#16193b] text-[#e5dec9] shadow-[0_2px_0_#060714] hover:border-[#8a78c9] hover:bg-[#222757] hover:text-[#ffffff]'
                }`}
              >
                {option.buttonLabel}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
