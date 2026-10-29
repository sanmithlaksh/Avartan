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
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-space-950/80 via-space-950/40 to-space-950/90 pointer-events-none" />
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-10">
        <img src="/assets/avartan_banner.png" alt="Ambient blur" className="w-[120vw] h-[120vh] object-cover filter blur-[80px] scale-110" />
      </div>

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
        <div className="mb-6 text-center">
          <div className="text-[10px] md:text-xs font-orbit tracking-[0.6em] uppercase text-cyan-300/70 mb-2">
            Gradient Presents
          </div>
          <div className="font-orbit font-black tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-white text-xl md:text-3xl drop-shadow-[0_0_40px_rgba(34,211,238,0.4)]">
            VOID PARADIGM
          </div>
        </div>
        <div className="relative group cursor-pointer" onClick={onEnterLogin}>
          <div className="absolute -inset-10 bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-purple-500/20 blur-3xl rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2rem] p-10 md:p-14 shadow-[0_0_80px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_100px_rgba(34,211,238,0.4)] transition-all duration-500 group-hover:scale-105">
            <img
              src="/assets/wave_gradient.png"
              alt="Void Paradigm Gradient Logo"
              className="h-32 md:h-48 object-contain drop-shadow-[0_0_60px_rgba(168,85,247,0.6)]"
            />
            <div className="mt-6 flex items-center justify-center gap-2 text-cyan-300/80 font-orbit text-xs tracking-[0.3em] uppercase">
              <span>Enter Mission Portal</span>
              <ChevronRight className="w-4 h-4 animate-pulse" />
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
