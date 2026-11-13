import {OrientationOverlay} from './components/OrientationOverlay';
import {PhaserViewport} from './components/PhaserViewport';

export default function App() {
  return (
    <main className="relative flex h-dvh w-screen items-center justify-center overflow-hidden bg-[#0b0d1f]">
      <PhaserViewport />
      <OrientationOverlay />
    </main>
  );
}
