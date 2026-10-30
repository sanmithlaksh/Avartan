// Mesmerizing Space Welcome Page
import React, { useState } from 'react';
import { InteractiveCosmicCanvas } from './InteractiveCosmicCanvas';
import { AdminScoresModal } from '../Admin/AdminScoresModal';
import { ChevronRight, Shield } from 'lucide-react';

interface WelcomePageProps {
  onEnterLogin: () => void;
  onQuickTrial?: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onEnterLogin }) => {
  const [showAdminTerminal, setShowAdminTerminal] = useState(false);

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-between overflow-hidden bg-space-950 text-slate-100 select-none">
      <InteractiveCosmicCanvas />

      {/* Vignette only: the canvas paints the galaxy and nebulae, so the page
          just darkens the edges enough to keep the text legible. */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_50%_42%,rgba(2,6,23,0.02)_0%,rgba(2,6,23,0.28)_55%,rgba(1,3,10,0.60)_100%)]" />

      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between backdrop-blur-xl bg-space-950/40 border-b border-cyan-400/20">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-orbit font-extrabold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-fuchsia-300 text-sm md:text-base">
              VOID PARADIGM
            </span>
            <span className="text-[9px] text-cyan-400/80 font-mono tracking-[0.4em] uppercase">
              AVARTAN • PRESENTS
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowAdminTerminal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border border-cyan-400/40 text-cyan-300 hover:text-white hover:border-cyan-300/60 text-xs font-orbit font-bold uppercase tracking-wider flex items-center gap-2 transition-all backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.15)]"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Admin Login</span>
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 w-full">
        <div className="relative group cursor-pointer w-full max-w-5xl" onClick={onEnterLogin}>
          <div className="absolute -inset-10 bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-purple-500/20 blur-3xl rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2rem] px-8 py-10 md:px-14 md:py-12 shadow-[0_0_80px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_100px_rgba(34,211,238,0.4)] transition-all duration-500 group-hover:scale-[1.02]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">

              {/* Left: title block */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 min-w-0">
                <div className="text-[11px] md:text-sm font-orbit tracking-[0.6em] uppercase text-cyan-300/70 mb-3">
                  Gradient Presents
                </div>
                <div className="font-orbit font-black tracking-[0.28em] md:tracking-[0.38em] leading-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-white text-3xl md:text-[2.75rem] drop-shadow-[0_0_40px_rgba(34,211,238,0.4)]">
                  VOID PARADIGM
                </div>
                <div className="mt-7 flex items-center justify-center md:justify-start gap-2 text-cyan-300/80 font-orbit text-xs md:text-sm tracking-[0.3em] uppercase">
                  <span>Enter Mission Portal</span>
                  <ChevronRight className="w-4 h-4 animate-pulse" />
                </div>
              </div>

              {/* Right: Gradient logo on a dark space disc */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.16)_0%,rgba(2,6,23,0)_70%)] blur-xl" />
                <div className="relative flex items-center justify-center w-40 h-40 md:w-52 md:h-52 rounded-full bg-[radial-gradient(circle_at_50%_32%,#0f172e_0%,#070c1a_58%,#03060f_100%)] ring-1 ring-inset ring-cyan-400/25 shadow-[inset_0_0_60px_rgba(2,6,23,0.95),0_0_50px_rgba(34,211,238,0.10)]">
                  <img
                    src="/assets/wave_gradient.png"
                    alt="Gradient logo"
                    className="h-24 md:h-32 lg:h-36 object-contain drop-shadow-[0_0_45px_rgba(168,85,247,0.55)] transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full px-6 py-3 flex items-center justify-center text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase backdrop-blur-xl bg-space-950/40 border-t border-cyan-400/10">
        <span>VOID PARADIGM • MISSION CONTROL</span>
      </footer>

      <AdminScoresModal open={showAdminTerminal} onClose={() => setShowAdminTerminal(false)} />
    </div>
  );
};

export default WelcomePage;
