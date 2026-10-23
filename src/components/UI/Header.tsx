// Top Navigation Header with Timer, Score, Attempts, View Toggle and Controls
import React from 'react';
import { useGame } from '../../context/GameContext';
import {
  Clock,
  Trophy,
  HelpCircle,
  Volume2,
  VolumeX,
  Settings,
  Layers,
  Box,
  Compass,
  AlertTriangle,
  KeyRound,
  Lock,
  Flag,
  LogOut
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    teamName,
    activeAccount,
    score,
    timeRemaining,
    attemptsRemaining,
    settings,
    viewMode,
    setViewMode,
    isMuted,
    toggleMute,
    setShowHintsModal,
    setShowLeaderboardModal,
    setShowAdminModal,
    setShowCodeModal,
    currentMissionIndex,
    isAdmin,
    logoutTeam,
    goToHub,
    codeTerminalUnlocked,
    codeUnlockSeconds,
    endRoundOne,
    isDemoMode
  } = useGame();

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isEmergency = timeRemaining <= 30 && timeRemaining > 0;
  const unlockMinutes = Math.floor(codeUnlockSeconds / 60);
  const unlockSeconds = codeUnlockSeconds % 60;
  const unlockFormatted = `${unlockMinutes.toString().padStart(2, '0')}:${unlockSeconds
    .toString()
    .padStart(2, '0')}`;

  const handleEndRound = () => {
    const confirmed = window.confirm(
      'End Round 1 now? Your latest submitted PIN will be graded and the round will close.'
    );
    if (confirmed) endRoundOne();
  };

  return (
    <header className="h-16 px-4 md:px-6 flex items-center justify-between bg-space-950/95 border-b border-cyan-500/20 z-30 select-none">
      {/* Left: Branding & Team Info */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-transparent border border-cyan-400/40 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
          <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse" />
          <div className="absolute inset-0 rounded-xl border border-cyan-400/20 animate-spin-very-slow" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-orbit font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300">
              AVARTAN
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              LEVEL 0{currentMissionIndex + 1}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-sans tracking-wide">
            Team: <strong className="text-slate-200 font-semibold">{teamName}</strong>
            {activeAccount && activeAccount['Name 1'] && (
              <span className="hidden md:inline text-slate-400 ml-1">
                ({activeAccount['Name 1']}{activeAccount['Name 2'] ? ` & ${activeAccount['Name 2']}` : ''})
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Center: Mission Timer, Score & Attempts */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Timer */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all ${
          isEmergency
            ? 'bg-rose-950/70 border-rose-500 animate-pulse text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
            : 'bg-space-900/60 border-cyan-500/20 text-cyan-300'
        }`}>
          {isEmergency ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <Clock className="w-4 h-4 text-cyan-400" />}
          <div className="flex flex-col">
            <span className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Countdown</span>
            <span className="text-sm md:text-base font-mono font-bold tracking-wider">{timeFormatted}</span>
          </div>
        </div>

        {/* Score */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-space-900/60 border border-cyan-500/20 text-amber-300">
          <Trophy className="w-4 h-4 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Score</span>
            <span className="text-sm md:text-base font-mono font-bold">{score}</span>
          </div>
        </div>

        {/* Round progress */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-space-900/60 border border-cyan-500/20">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Rounds</span>
            <div className="flex gap-1.5 mt-0.5">
              {[0, 1, 2].map(idx => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentMissionIndex
                      ? 'bg-cyan-400 shadow-[0_0_8px_#00f3ff]'
                      : 'bg-slate-700 opacity-40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: View Toggle & Utility Buttons */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-space-900/80 border border-cyan-500/20">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-2.5 py-1 rounded-lg text-xs font-orbit flex items-center gap-1.5 transition-all ${
              viewMode === '3d'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="3D Perspective"
          >
            <Box className="w-3.5 h-3.5" />
            <span className="hidden md:inline">3D</span>
          </button>
          <button
            onClick={() => setViewMode('2d')}
            className={`px-2.5 py-1 rounded-lg text-xs font-orbit flex items-center gap-1.5 transition-all ${
              viewMode === '2d'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="2D Top-Down Array"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden md:inline">2D</span>
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`hidden lg:flex px-2.5 py-1 rounded-lg text-xs font-orbit items-center gap-1.5 transition-all ${
              viewMode === 'split'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Dual Split View"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Split</span>
          </button>
        </div>

        {/* Back to mission cards */}
        <button
          onClick={goToHub}
          className="px-2.5 py-1.5 rounded-xl bg-space-900/60 border border-cyan-500/20 text-slate-300 hover:text-cyan-200 hover:border-cyan-400 transition-all duration-200 text-xs font-orbit font-bold flex items-center gap-1.5"
          title="Back to mission cards"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CARDS</span>
        </button>

        {/* Code Terminal Button — sealed for the opening window */}
        <button
          onClick={() => setShowCodeModal(true)}
          className={`px-2.5 py-1.5 rounded-xl border transition-all text-xs font-orbit font-bold flex items-center gap-1.5 ${
            codeTerminalUnlocked
              ? 'bg-cyan-950/80 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 shadow-[0_0_12px_rgba(0,243,255,0.25)]'
              : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
          }`}
          title={
            codeTerminalUnlocked
              ? 'Planetary Combination & Round Code Terminal'
              : `PIN terminal unlocks in ${unlockFormatted}`
          }
        >
          {codeTerminalUnlocked ? (
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-amber-300" />
          )}
          <span className="hidden sm:inline tabular-nums">
            {codeTerminalUnlocked ? 'ENTER CODE' : `LOCKED ${unlockFormatted}`}
          </span>
        </button>

        {/* End the round early — latest PIN is graded */}
        <button
          onClick={handleEndRound}
          className="px-2.5 py-1.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 hover:bg-rose-900/50 hover:border-rose-400 transition-all text-xs font-orbit font-bold flex items-center gap-1.5"
          title="End Round 1 and grade the latest submitted PIN"
        >
          <Flag className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{isDemoMode ? 'END DEMO' : 'END ROUND'}</span>
        </button>

        {/* Hints */}
        <button
          onClick={() => setShowHintsModal(true)}
          className="p-2 rounded-xl bg-space-900/60 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all"
          title="Intel Hints"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Audio Mute */}
        <button
          onClick={toggleMute}
          className="p-2 rounded-xl bg-space-900/60 border border-cyan-500/20 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Leaderboard */}
        <button
          onClick={() => setShowLeaderboardModal(true)}
          className="p-2 rounded-xl bg-space-900/60 border border-cyan-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 transition-all"
          title="Tournament Leaderboard"
        >
          <Trophy className="w-4 h-4" />
        </button>

        {/* Admin console — only the admin login can open it */}
        {isAdmin && (
          <button
            onClick={() => setShowAdminModal(true)}
            className="p-2 rounded-xl bg-space-900/60 border border-cyan-500/20 text-slate-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all duration-200"
            title="Admin Console — team scores & leaderboard"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        {/* Logout Button */}
        <button
          onClick={logoutTeam}
          className="p-2 rounded-xl bg-space-900/60 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:border-rose-400 transition-all"
          title="Switch Team / Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
