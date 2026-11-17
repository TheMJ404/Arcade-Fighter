import {OrientationOverlay} from './components/OrientationOverlay';
import {PhaserViewport} from './components/PhaserViewport';
import {TemporaryFighterSwitcher} from './components/TemporaryFighterSwitcher';
import {TouchControls} from './components/TouchControls';

export default function App() {
  return (
    <main className="relative flex h-dvh w-screen flex-col overflow-hidden bg-[#0b0d1f]">
      <TemporaryFighterSwitcher />
      <OrientationOverlay />
      <div className="relative min-h-0 w-full flex-1">
        <PhaserViewport />
      </div>
      <TouchControls />
    </main>
  );
}
