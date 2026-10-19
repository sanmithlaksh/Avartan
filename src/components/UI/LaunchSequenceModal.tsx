// Full Cinematic Rocket Launch Take-Off Modal for Level Completion
import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Trophy, CheckCircle2, Copy, Check, ChevronRight, Rocket, Flame, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const LaunchSequenceModal: React.FC = () => {
  const {
    showSuccessModal,
    setShowSuccessModal,
    launchCode,
    score,
    teamName,
    advanceToNextMission,
    beginPatternEvent,
    isRoundOne,
    setShowLeaderboardModal
  } = useGame();

  const [copied, setCopied] = useState(false);
  const [launchStage, setLaunchStage] = useState<'countdown' | 'liftoff' | 'cruising'>('countdown');
  const [countdown, setCountdown] = useState(3);

  // Trigger cinematic launch sequence
  useEffect(() => {
    if (!showSuccessModal) {
      setLaunchStage('countdown');
      setCountdown(3);
      return;
    }

    // 3-2-1 Countdown before blastoff
    const timer3 = setTimeout(() => setCountdown(2), 700);
    const timer2 = setTimeout(() => setCountdown(1), 1400);
    const timerBlast = setTimeout(() => {
      setLaunchStage('liftoff');
      // Confetti burst for rocket ignition
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.8 },
        colors: ['#f97316', '#eab308', '#00f3ff', '#38bdf8', '#ffffff']
      });
    }, 2100);

    const timerCruise = setTimeout(() => {
      setLaunchStage('cruising');
    }, 4200);

    return () => {
      clearTimeout(timer3);
      clearTimeout(timer2);
      clearTimeout(timerBlast);
      clearTimeout(timerCruise);
    };
  }, [showSuccessModal]);

  if (!showSuccessModal) return null;

  const handleCopyCode = () => {
    if (launchCode) {
      navigator.clipboard.writeText(launchCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/92 backdrop-blur-3xl animate-fade-in select-none">
      <div className="relative w-full max-w-xl rounded-3xl bg-space-900/95 border border-cyan-400 p-6 md:p-8 shadow-[0_0_90px_rgba(0,243,255,0.45)] flex flex-col items-center text-center gap-5 overflow-hidden">
        {/* Glow ambient background effects */}
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

        {/* ── CINEMATIC ROCKET LAUNCH STAGE ── */}
        <div className="relative w-full h-44 rounded-2xl bg-space-950/90 border border-cyan-500/30 overflow-hidden flex flex-col items-center justify-end p-4">
          {/* Animated Stars Streaming Downwards during flight */}
          <div className="absolute inset-0 pointer-events-none">
            <div className={`w-full h-full ${launchStage !== 'countdown' ? 'animate-pulse opacity-90' : 'opacity-40'}`}>
              <div className="absolute top-2 left-10 w-1 h-8 bg-cyan-400/50 rounded-full animate-bounce" />
              <div className="absolute top-6 right-16 w-1 h-12 bg-white/60 rounded-full animate-bounce" />
              <div className="absolute top-1 left-1/3 w-1 h-6 bg-cyan-300/40 rounded-full animate-bounce" />
              <div className="absolute top-8 right-1/3 w-1 h-10 bg-amber-400/50 rounded-full animate-bounce" />
            </div>
          </div>

          {/* Planetary Orbit Sphere in the Deep Distance */}
          <div className="absolute top-4 left-6 w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 via-sky-400 to-indigo-300 shadow-[0_0_20px_rgba(0,243,255,0.4)] opacity-80" />

          {/* Rocket Ship with Thruster Blast Animation */}
          <div
            className={`relative flex flex-col items-center transition-all duration-1000 ${
              launchStage === 'countdown'
                ? 'translate-y-2'
                : launchStage === 'liftoff'
                ? '-translate-y-16 scale-110'
                : '-translate-y-28 scale-90 opacity-95'
            }`}
          >
            {/* Rocket Body */}
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-300 to-white p-2.5 shadow-[0_0_35px_rgba(0,243,255,0.8)] border border-white">
              <Rocket className="w-10 h-10 text-space-950 transform -rotate-45" />
            </div>

            {/* Thruster Exhaust Flames & Particles */}
            {launchStage !== 'countdown' && (
              <div className="flex flex-col items-center -mt-1 animate-pulse">
                <Flame className="w-8 h-10 text-orange-500 animate-bounce" />
                <div className="w-4 h-12 bg-gradient-to-b from-orange-400 via-amber-300 to-transparent rounded-full blur-[1px]" />
                <div className="w-12 h-4 bg-orange-500/30 rounded-full blur-md" />
              </div>
            )}
          </div>

          {/* Launch Status Banner */}
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-2">
            {launchStage === 'countdown' ? (
              <span className="text-xs font-orbit font-extrabold text-amber-300 tracking-widest uppercase animate-pulse">
                ROCKET IGNITION IN T-{countdown}...
              </span>
            ) : launchStage === 'liftoff' ? (
              <span className="text-xs font-orbit font-black text-cyan-300 tracking-widest uppercase animate-bounce flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                BLAST OFF! TRANSLUNAR INJECTION CONFIRMED
              </span>
            ) : (
              <span className="text-xs font-orbit font-extrabold text-emerald-300 tracking-widest uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                CRUISING THROUGH PLANETARY SYSTEM
              </span>
            )}
          </div>
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {isRoundOne ? 'CLEARANCE CODE AUTHENTICATED' : 'PLANETARY ALIGNMENT VERIFIED'}
          </span>

          <h2 className="text-2xl md:text-3xl font-orbit font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-200">
            {isRoundOne ? 'ROUND 1 COMPLETE' : 'LEVEL COMPLETED!'}
          </h2>

          <p className="text-xs md:text-sm text-cyan-200/90 font-mono tracking-wider max-w-md mx-auto">
            {isRoundOne
              ? 'ROUND 2 — PATTERN RECOGNITION IS READY. PROCEED WHEN YOUR SQUAD IS SET.'
              : 'ALL SIGHTLINES SYNCHRONIZED. INTERPLANETARY TRIP VECTOR CLEAR.'}
          </p>
        </div>

        {/* Cryptographic Launch Code Box */}
        <div className="w-full p-3.5 rounded-xl bg-space-950/80 border border-cyan-500/40 flex flex-col gap-1.5">
          <span className="text-[10px] font-orbit uppercase tracking-widest text-slate-400">
            Authenticated Clearance Launch Code
          </span>

          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-space-900 border border-cyan-400/50">
            <span className="text-sm md:text-base font-mono font-extrabold text-cyan-300 tracking-widest">
              {launchCode || 'AVARTAN-ORBIT-2026'}
            </span>

            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-md hover:bg-space-800 text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1 text-xs font-sans cursor-pointer"
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
            <span className="text-[10px] font-orbit text-slate-400 uppercase">Squadron</span>
            <span className="text-sm font-bold text-slate-100 font-sans mt-0.5">{teamName}</span>
          </div>

          <div className="p-3 rounded-xl bg-space-950/60 border border-cyan-500/20 flex flex-col items-center">
            <span className="text-[10px] font-orbit text-slate-400 uppercase">Current Points</span>
            <span className="text-sm font-bold text-amber-300 font-mono mt-0.5">{score} PTS</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={() => {
              setShowSuccessModal(false);
              setShowLeaderboardModal(true);
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-space-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 font-orbit font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            STANDINGS LEADERBOARD
          </button>

          <button
            onClick={isRoundOne ? beginPatternEvent : advanceToNextMission}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,243,255,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {isRoundOne ? 'PROCEED TO ROUND 2' : 'ENTER NEXT LEVEL'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
