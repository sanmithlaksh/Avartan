// Mesmerizing Space Welcome Page with Interactive Cursor Canvas & Navigation
import React from 'react';
import { InteractiveCosmicCanvas } from './InteractiveCosmicCanvas';
import { Orbit, Sparkles, Shield, ChevronRight, Users, Play, KeyRound } from 'lucide-react';

interface WelcomePageProps {
  onEnterLogin: () => void;
  onQuickTrial: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onEnterLogin, onQuickTrial }) => {
  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-between overflow-hidden bg-space-950 text-slate-100 select-none">
      {/* Background Interactive Cosmic Physics Canvas */}
      <InteractiveCosmicCanvas />

      {/* Atmospheric Ambient Radial Highlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-b from-cyan-500/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-[450px] h-[450px] rounded-full bg-fuchsia-600/10 blur-3xl pointer-events-none" />

      {/* Top Banner Navigation */}
      <header className="relative z-10 w-full px-6 py-5 flex items-center justify-between border-b border-cyan-500/20 backdrop-blur-md bg-space-950/40">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/20 border border-cyan-400/50 shadow-[0_0_20px_rgba(0,243,255,0.3)]">
            <Orbit className="w-5 h-5 text-cyan-300 animate-spin-very-slow" />
          </div>
          <div className="flex flex-col">
            <span className="font-orbit font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 text-lg">
              AVARTAN
            </span>
            <span className="text-[10px] text-cyan-400/80 font-mono tracking-widest uppercase">
              The Hidden Orbit • Synchronized Orbital Operations
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onQuickTrial}
            className="px-3.5 py-1.5 rounded-xl border border-cyan-500/40 bg-space-900/60 hover:bg-cyan-500/10 text-cyan-300 text-xs font-orbit tracking-wider flex items-center gap-1.5 transition-all"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Trial Mode (Admin)</span>
          </button>
        </div>
      </header>

      {/* Hero Body Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 text-xs font-mono mb-6 shadow-[0_0_20px_rgba(0,243,255,0.2)] animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>INTERSTELLAR RECONNAISSANCE TOURNAMENT • 45-50 TEAMS ACTIVE</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-orbit font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_0_40px_rgba(0,243,255,0.35)]">
          THE HIDDEN ORBIT
        </h1>

        <p className="text-base sm:text-xl text-slate-300 font-sans max-w-2xl mb-8 leading-relaxed">
          Traverse an uncharted multi-planetary system. Synchronize heliocentric nodes from Earth's locked vantage,
          decrypt cosmic boundaries, and restore navigation vectors for your squadron.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={onEnterLogin}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 font-orbit font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_35px_rgba(0,243,255,0.45)] cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-slate-950" />
            <span>ENTER MISSION PORTAL</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onQuickTrial}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-space-900/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 font-orbit font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <Play className="w-4 h-4 text-emerald-400" />
            <span>LAUNCH TRIAL ACCOUNT (ADMIN)</span>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full max-w-3xl text-left">
          <div className="p-4 rounded-xl bg-space-900/40 border border-cyan-500/20 backdrop-blur-md">
            <span className="text-[11px] font-orbit font-bold text-cyan-400 uppercase tracking-wider block mb-1">
              01. Heliocentric Calibration
            </span>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Snap 8 orbital worlds into 12 30-degree nodes mapped through high-precision observation sightlines.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-space-900/40 border border-cyan-500/20 backdrop-blur-md">
            <span className="text-[11px] font-orbit font-bold text-amber-400 uppercase tracking-wider block mb-1">
              02. 3-Stage Mission Progression
            </span>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Real-time score accounting across Level 1, 2, and 3 with testing level overrides for administrators.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-space-900/40 border border-cyan-500/20 backdrop-blur-md">
            <span className="text-[11px] font-orbit font-bold text-purple-400 uppercase tracking-wider block mb-1">
              03. Supabase Cloud Sync
            </span>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Robust multi-team synchronization built for 45-50 concurrent participants with instant offline fallback.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-4 flex items-center justify-between text-xs text-slate-500 font-mono border-t border-cyan-500/10 backdrop-blur-sm bg-space-950/40">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>Avartan Orbital Control System</span>
        </div>
        <div className="text-right">
          <span>Move cursor to interact with galactic starfields</span>
        </div>
      </footer>
    </div>
  );
};
