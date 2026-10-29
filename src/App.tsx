// Main Game Application Component
import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Header } from './components/UI/Header';
import { SolarSystem3D } from './components/3D/SolarSystem3D';
import { OrbitalMap2D } from './components/2D/OrbitalMap2D';
import { MissionPanel } from './components/UI/MissionPanel';
import { PlanetSelector } from './components/UI/PlanetSelector';
import { DiscoveryModal } from './components/UI/DiscoveryModal';
import { HintsModal } from './components/UI/HintsModal';
import { LeaderboardModal } from './components/Leaderboard/LeaderboardModal';
import { AdminPanel } from './components/Admin/AdminPanel';
import { CodeTerminalModal } from './components/UI/CodeTerminalModal';
import { RoundHub } from './components/Hub/RoundHub';
import { RoundReport } from './components/Hub/RoundReport';
import { DemoReport } from './components/Hub/DemoReport';
import { RoundTwoReport } from './components/Hub/RoundTwoReport';
import { RoundThreeBriefing } from './components/RoundThree/RoundThreeBriefing';
import { RoundThreeGame } from './components/RoundThree/RoundThreeGame';
import { RoundThreeReportCard } from './components/RoundThree/RoundThreeReport';
import { PatternRecognitionEvent } from './components/PatternRecognition/PatternRecognitionEvent';
import { RoundTwoBriefing } from './components/PatternRecognition/RoundTwoBriefing';
import { WelcomePage } from './components/UI/WelcomePage';
import { LoginPage } from './components/UI/LoginPage';
import { InteractiveCosmicCanvas } from './components/UI/InteractiveCosmicCanvas';

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

// Round 2 lives on its own stage: the solar system is unmounted and replaced by a
// plain deep-space starfield so the pattern grids have the whole screen.
const RoundTwoStage: React.FC = () => (
  <div className="relative w-screen h-screen overflow-hidden bg-[#030712] flex items-center justify-center p-3 animate-fade-in">
    <InteractiveCosmicCanvas />
    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_45%,rgba(88,28,135,0.28),transparent_65%)]" />
    <PatternRecognitionEvent />
  </div>
);

const GameRoot: React.FC = () => {
  const { phase, setPhase, setActiveAccount } = useGame();

  // 1. Homepage — always the first screen on launch
  if (phase === 'welcome') {
    return (
      <WelcomePage
        onEnterLogin={() => setPhase('login')}
        onQuickTrial={() => undefined}
      />
    );
  }

  // 2. Team login
  if (phase === 'login') {
    return (
      <LoginPage
        onLoginSuccess={(team) => {
          setActiveAccount(team);
          setPhase('hub');
        }}
        onBackToWelcome={() => setPhase('welcome')}
      />
    );
  }

  // 3. Mission cards (round hub)
  if (phase === 'hub') {
    return (
      <>
        <RoundHub />
        <LeaderboardModal />
        <AdminPanel />
      </>
    );
  }

  // 4. Round 1 score report
  if (phase === 'round_report') {
    return (
      <>
        <RoundReport />
        <LeaderboardModal />
        <AdminPanel />
      </>
    );
  }

  // 5. Temporary demo score card, shown before returning to the admin login
  if (phase === 'demo_report') {
    return <DemoReport />;
  }

  // 5b. Round 2 report — back to the hub or forward to the final round
  if (phase === 'round_two_report') {
    return (
      <>
        <RoundTwoReport />
        <LeaderboardModal />
        <AdminPanel />
      </>
    );
  }

  // 5c. Round 3 briefing — time limit, points and objectives warning
  if (phase === 'round_three_briefing') {
    return (
      <>
        <RoundThreeBriefing />
        <LeaderboardModal />
      </>
    );
  }

  // 5d. Round 3 — Marsfall embedded mission
  if (phase === 'round_three') {
    return <RoundThreeGame />;
  }

  // 5e. Round 3 report — back to the mission cards
  if (phase === 'round_three_report') {
    return (
      <>
        <RoundThreeReportCard />
        <LeaderboardModal />
      </>
    );
  }

  // 6. Round 2 briefing — confirm objective/limits before starting
  if (phase === 'round_two_briefing') {
    return (
      <>
        <RoundTwoBriefing />
        <LeaderboardModal />
      </>
    );
  }

  // 7. Round 2 — pattern recognition
  if (phase === 'round_two') {
    return (
      <>
        <RoundTwoStage />
        <LeaderboardModal />
      </>
    );
  }

  // 7. Round 1 — active game interface
  return (
    <div className="w-screen h-screen flex flex-col bg-space-950 text-slate-100 overflow-hidden font-sans">
      {/* Navigation & Status Header */}
      <Header />

      {/* Core Game Viewport & Mission Control */}
      <GameViewport />

      {/* Bottom Planet Selection & Node Calibration Bar */}
      <PlanetSelector />

      {/* Global Cinematic and Game State Modals */}
      <DiscoveryModal />
      <HintsModal />
      <LeaderboardModal />
      <AdminPanel />
      <CodeTerminalModal />
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
