// Mesmerizing Space Welcome Page featuring Void Paradigm
import React, { useState } from 'react';
import { InteractiveCosmicCanvas } from './InteractiveCosmicCanvas';
import { AdminScoresModal } from '../Admin/AdminScoresModal';
import { KeyRound, ChevronRight, Calendar, Sparkles, Shield } from 'lucide-react';

interface WelcomePageProps {
  onEnterLogin: () => void;
  onQuickTrial: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onEnterLogin }) => {
  const [showAdminTerminal, setShowAdminTerminal] = useState(false);

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-between overflow-hidden bg-space-950 text-slate-100 select-none">
      {/* 1. Stagnant Galaxy / Cosmic Starfield Background with Cursor-Responsive Stars */}
      <InteractiveCosmicCanvas />

      {/* 2. Subtle ambient backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-20">
        <div className="w-[110vw] h-[110vh] bg-gradient-to-br from-purple-900/30 via-cyan-900/20 to-blue-900/30 filter blur-[60px] scale-110 pointer-events-none" />
      </div>

      {/* 3. Subtle dark vignette overlay for crisp contrast */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-space-950/75 via-space-950/30 to-space-950/85 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 py-5 flex items-center justify-between border-b border-cyan-500/20 bg-space-950/60">
        <div className="flex items-center gap-3">
          <img
            src="/assets/purple_logo.png"
            alt="Void Paradigm Logo"
            className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.7)]"
          />
          <div className="flex flex-col">
            <span className="font-orbit font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-indigo-300 text-lg">
              VOID PARADIGM
            </span>
            <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
              Pentagram Week 2026 • 30th October
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowAdminTerminal(true)}
          data-testid="admin-login-terminal"
          className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/20 text-xs font-orbit font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Admin Login</span>
        </button>
      </header>

      {/* Main Body: Glassmorphism Box with High-Impact Presentation */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto w-full">
        <div className="relative w-full max-w-3xl rounded-3xl bg-space-900/70 border border-cyan-400/30 p-8 md:p-12 shadow-[0_0_60px_rgba(0,243,255,0.18)] flex flex-col items-center text-center overflow-hidden transition-all duration-500">
          
          {/* Subtle neon glow orbs inside glass box */}
          <div className="absolute -top-20 -left-20 w-52 h-52 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-52 h-52 rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none" />

          {/* Top Tag Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 text-xs font-mono tracking-wider mb-6 shadow-[0_0_20px_rgba(0,243,255,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold">PENTAGRAM WEEK 2026</span>
          </div>

          {/* Centred announcement: mark, presenter, title, date */}
          <div className="w-full flex flex-col items-center justify-center text-center gap-3 my-1">
            <img
              src="/assets/purple_logo.png"
              alt="Void Paradigm Logo"
              className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-[0_0_30px_rgba(168,85,247,0.85)] mb-2"
            />
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-orbit font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-cyan-300 drop-shadow-[0_0_40px_rgba(0,243,255,0.6)] max-w-full text-center">
              VOID PARADIGM
            </h1>

            <p className="text-xs sm:text-sm text-slate-300/80 font-mono tracking-wider max-w-md text-center">
              A three-round deep-space navigation challenge.
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xl bg-space-950/80 border border-cyan-500/30 text-slate-200 font-mono text-xs sm:text-sm shadow-inner">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="tracking-wide">30th October 2026</span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onEnterLogin}
            className="mt-8 px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 font-orbit font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_40px_rgba(0,243,255,0.5)] cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-slate-950" />
            <span>ENTER MISSION PORTAL</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full px-6 py-4 flex items-center justify-center text-xs text-slate-500 font-mono border-t border-cyan-500/10 backdrop-blur-sm bg-space-950/40 text-center">
        <div>
          <span>VOID PARADIGM • PENTAGRAM WEEK 2026 • 30th October 2026</span>
        </div>
      </footer>

      {/* Administrator password terminal & team scoreboard */}
      <AdminScoresModal
        open={showAdminTerminal}
        onClose={() => setShowAdminTerminal(false)}
      />
    </div>
  );
};
