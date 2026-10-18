// Main Game Application Component
import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Header } from './components/UI/Header';
import { SolarSystem3D } from './components/3D/SolarSystem3D';
import { OrbitalMap2D } from './components/2D/OrbitalMap2D';
import { MissionPanel } from './components/UI/MissionPanel';
import { PlanetSelector } from './components/UI/PlanetSelector';
import { IntroModal } from './components/UI/IntroModal';
import { DiscoveryModal } from './components/UI/DiscoveryModal';
import { LaunchSequenceModal } from './components/UI/LaunchSequenceModal';
import { HintsModal } from './components/UI/HintsModal';
import { LeaderboardModal } from './components/Leaderboard/LeaderboardModal';
import { AdminPanel } from './components/Admin/AdminPanel';
import { CodeTerminalModal } from './components/UI/CodeTerminalModal';
import { ZodiacReferenceTable } from './components/UI/ZodiacReferenceTable';
import { WelcomePage } from './components/UI/WelcomePage';
import { LoginPage } from './components/UI/LoginPage';
import { DEFAULT_TRIAL_ACCOUNT } from './utils/supabase';

const GameViewport: React.FC = () => {
  const { viewMode } = useGame();

  return (
    <div className="flex-1 relative flex flex-col lg:flex-row overflow-hidden">
      {/* Central Interactive Solar System Viewport */}
      <div className="flex-1 relative overflow-hidden bg-space-950 flex">
        {viewMode === '3d' && <SolarSystem3D />}
        {viewMode === '2d' && <OrbitalMap2D />}
        {viewMode === 'split' && (
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-cyan-500/20">
            <div className="w-full h-full relative">
              <SolarSystem3D />
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-space-950/80 border border-cyan-500/30 text-[10px] font-orbit text-cyan-400">
                3D Perspective View
              </div>
            </div>
            <div className="w-full h-full relative">
              <OrbitalMap2D />
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-space-950/80 border border-cyan-500/30 text-[10px] font-orbit text-cyan-400">
                2D Heliocentric Array
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Mission Control Sidebar */}
      <MissionPanel />
    </div>
  );
};

const GameRoot: React.FC = () => {
  const { phase, setPhase, setActiveAccount } = useGame();

  // If in welcome phase, render the interactive celestial welcome page
  if (phase === 'welcome') {
    return (
      <WelcomePage
        onEnterLogin={() => setPhase('login')}
        onQuickTrial={() => {
          setActiveAccount(DEFAULT_TRIAL_ACCOUNT);
          setPhase('intro');
        }}
      />
    );
  }

  // If in login phase, render login and registration page
  if (phase === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(team) => {
          setActiveAccount(team);
          setPhase('intro');
        }}
        onBackToWelcome={() => setPhase('welcome')}
      />
    );
  }

  // Active Game Interface
  return (
    <div className="w-screen h-screen flex flex-col bg-space-950 text-slate-100 overflow-hidden font-sans">
      {/* Navigation & Status Header */}
      <Header />

      {/* Core Game Viewport & Mission Control */}
      <GameViewport />

      {/* Bottom Planet Selection & Node Calibration Bar */}
      <PlanetSelector />

      {/* Global Cinematic and Game State Modals */}
      <IntroModal />
      <DiscoveryModal />
      <LaunchSequenceModal />
      <HintsModal />
      <LeaderboardModal />
      <AdminPanel />
      <CodeTerminalModal />
      <ZodiacReferenceTable />
    </div>
  );
};

export function App() {
  return (
    <GameProvider>
      <GameRoot />
    </GameProvider>
  );
}

export default App;
