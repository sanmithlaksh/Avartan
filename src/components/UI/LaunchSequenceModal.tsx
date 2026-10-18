// Mission Success and Rocket Launch Sequence Modal
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Rocket, Trophy, CheckCircle2, Copy, Check, ChevronRight, Award } from 'lucide-react';

export const LaunchSequenceModal: React.FC = () => {
  const {
    showSuccessModal,
    setShowSuccessModal,
    launchCode,
    score,
    teamName,
    advanceToNextMission,
    setShowLeaderboardModal
  } = useGame();

  const [copied, setCopied] = useState(false);

  if (!showSuccessModal) return null;

  const handleCopyCode = () => {
    if (launchCode) {
      navigator.clipboard.writeText(launchCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/90 backdrop-blur-2xl animate-fade-in select-none">
      <div className="relative w-full max-w-xl rounded-2xl bg-space-900/95 border border-cyan-400 p-6 md:p-8 shadow-[0_0_80px_rgba(0,243,255,0.4)] flex flex-col items-center text-center gap-6 overflow-hidden">
        {/* Glow backdrop effects */}
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        {/* Animated Rocket Launch Graphic */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ping opacity-75" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500/30 to-blue-600/30 border border-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(0,243,255,0.5)]">
            <Rocket className="w-10 h-10 text-cyan-300 transform -rotate-45 animate-bounce" />
          </div>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            ALIGNMENT PROTOCOL VERIFIED
          </span>

          <h2 className="text-xl md:text-2xl font-orbit font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-200">
            CELESTIAL ALIGNMENT RESTORED
          </h2>

          <p className="text-xs md:text-sm text-cyan-200/90 font-mono tracking-wider max-w-md mx-auto">
            NAVIGATION COORDINATES RECOVERED. ROCKET LAUNCH SEQUENCE ACTIVATED.
          </p>
        </div>

        {/* Cryptographic Launch Code Box */}
        <div className="w-full p-4 rounded-xl bg-space-950/80 border border-cyan-500/40 flex flex-col gap-2">
          <span className="text-[10px] font-orbit uppercase tracking-widest text-slate-400">
            Mission Launch Code (Round 1 Authentication)
          </span>

          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-space-900 border border-cyan-400/50">
            <span className="text-sm md:text-base font-mono font-extrabold text-cyan-300 tracking-widest">
              {launchCode || 'ORBIT-ALPHA-2026'}
            </span>

            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-md hover:bg-space-800 text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1 text-xs font-sans"
              title="Copy Launch Code"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-mono">COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-[10px] font-mono">COPY</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="p-3 rounded-xl bg-space-950/60 border border-cyan-500/20 flex flex-col items-center">
            <span className="text-[10px] font-orbit text-slate-400 uppercase">Assigned Team</span>
            <span className="text-sm font-bold text-slate-100 font-sans mt-0.5">{teamName}</span>
          </div>

          <div className="p-3 rounded-xl bg-space-950/60 border border-cyan-500/20 flex flex-col items-center">
            <span className="text-[10px] font-orbit text-slate-400 uppercase">Cumulative Score</span>
            <span className="text-sm font-bold text-amber-300 font-mono mt-0.5">{score} PTS</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => {
              setShowSuccessModal(false);
              setShowLeaderboardModal(true);
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-space-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 font-orbit font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            LEADERBOARD
          </button>

          <button
            onClick={advanceToNextMission}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-orbit font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)] flex items-center justify-center gap-2"
          >
            NEXT STAGE
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
