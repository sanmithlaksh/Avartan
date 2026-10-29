// Loading screen between Level 2 and Level 3.
//
// It polls the admin board in Supabase and only lets the team through once the
// organisers flip "Round 3 unlocked". Nothing on this screen can skip the gate —
// the Level 3 page enforces the same switch on load.
import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { InteractiveCosmicCanvas } from '../UI/InteractiveCosmicCanvas';
import { Megaphone, Lock, ShieldCheck, Satellite, LogOut } from 'lucide-react';

const POLL_MS = 5000;

export const RoundThreeWait: React.FC = () => {
  const { board, refreshBoard, enterRoundThree, roundThreeUnlocked, teamName, activeAccount, logoutTeam } =
    useGame();
  const [phaseLine, setPhaseLine] = useState(0);

  // Faster than the global poll: a team parked here should move within seconds.
  useEffect(() => {
    refreshBoard();
    const poll = window.setInterval(refreshBoard, POLL_MS);
    const lines = window.setInterval(() => setPhaseLine(n => (n + 1) % 4), 2400);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(lines);
    };
  }, [refreshBoard]);

  // Auto-enter Round 3 the moment the admin unlocks it.
  useEffect(() => {
    if (roundThreeUnlocked) {
      const t = window.setTimeout(enterRoundThree, 900);
      return () => window.clearTimeout(t);
    }
  }, [roundThreeUnlocked, enterRoundThree]);

  const lines = [
    'Calibrating thrusters',
    'Aligning orbit',
    'Stabilising signal',
    'Syncing mission data'
  ];
  const teamId = activeAccount?.id ?? '—';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-space-950 text-slate-100 flex items-center justify-center p-4 select-none">
      <InteractiveCosmicCanvas />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_45%,rgba(88,28,135,0.28),transparent_65%)]" />

      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-space-900/80 border border-cyan-400/25 p-8 md:p-10 text-center shadow-[0_0_60px_rgba(0,243,255,0.15)] backdrop-blur-md">
        <div className="text-[10px] font-orbit uppercase tracking-[0.4em] text-cyan-300/80">
          Void Paradigm // Standby
        </div>

        {/* Orbiting rocket mark */}
        <div className="relative mx-auto my-6 w-40 h-40">
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-label="Loading: a rocket orbiting a planet">
            <defs>
              <radialGradient id="pg" cx=".35" cy=".3" r=".9">
                <stop offset="0" stopColor="#a78bfa" />
                <stop offset=".6" stopColor="#5b3fd1" />
                <stop offset="1" stopColor="#1d2a7a" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="44" fill="url(#pg)" />
            <circle cx="100" cy="100" r="58" fill="none" stroke="#22d3ee" strokeOpacity=".45" strokeWidth="1" strokeDasharray="4 7">
              <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="18s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="100" r="72" fill="none" stroke="#a855f7" strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="1 9">
              <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="26s" repeatCount="indefinite" />
            </circle>
            <g>
              <path d="M-9,0 L-17,-3 L-14,0 L-17,3Z" fill="#fb923c" />
              <path d="M12,0 C8,-5 2,-5 -9,-4 L-9,4 C2,5 8,5 12,0Z" fill="#e6f4ff" />
              <circle cx="2" cy="0" r="2.3" fill="#22d3ee" />
              <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="7s" repeatCount="indefinite" />
            </g>
          </svg>
        </div>

        <h1 className="text-2xl md:text-3xl font-orbit font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200">
          Levels 1 &amp; 2 complete
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          {teamName || 'Your team'} ({teamId}) is being held at the staging ring. Round 3 unlocks when the
          organisers open it.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-200 text-xs font-orbit">
          <Lock className="w-3.5 h-3.5" />
          ROUND 3 LOCKED
        </div>

        <p className="mt-3 text-xs text-slate-400">{board.r3.msg}</p>

        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500">
          <Satellite className="w-3.5 h-3.5 text-cyan-500" />
          {lines[phaseLine]}…
        </div>

        {board.notice.on && board.notice.text.trim() !== '' && (
          <div className="mt-6 text-left rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-4">
            <div className="flex items-center gap-2 text-[10px] font-orbit uppercase tracking-[0.25em] text-fuchsia-300">
              <Megaphone className="w-3.5 h-3.5" />
              Notice board
            </div>
            <p className="mt-2 text-sm text-slate-200 whitespace-pre-wrap">{board.notice.text}</p>
          </div>
        )}

        <p className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
          Checking for the unlock signal every {POLL_MS / 1000} seconds
        </p>

        <button
          onClick={logoutTeam}
          className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-rose-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-3 h-3" /> Sign out
        </button>
      </div>
    </div>
  );
};
