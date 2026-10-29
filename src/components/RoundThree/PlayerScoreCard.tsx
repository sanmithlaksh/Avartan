// Player score card shown the moment Level 2 is submitted.
// It shows only this team's own results, then hands over to the waiting screen.
import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { InteractiveCosmicCanvas } from '../UI/InteractiveCosmicCanvas';
import { Trophy, CheckCircle2, ChevronRight, CloudUpload, CloudOff, User } from 'lucide-react';

const AUTO_CONTINUE_SECONDS = 12;

export const PlayerScoreCard: React.FC = () => {
  const { activeAccount, teamName, lastSave, continueFromScoreCard, board } = useGame();
  const [remaining, setRemaining] = useState(AUTO_CONTINUE_SECONDS);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          window.clearInterval(timer);
          continueFromScoreCard();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [continueFromScoreCard]);

  const l1 = activeAccount?.['level 1 points'] ?? 0;
  const l2 = activeAccount?.['level 2 points'] ?? 0;
  const total = l1 + l2;
  const teamId = activeAccount?.id ?? '—';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-space-950 text-slate-100 flex items-center justify-center p-4 select-none">
      <InteractiveCosmicCanvas />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.14),transparent_62%)]" />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-space-900/80 border border-cyan-400/30 p-7 md:p-10 shadow-[0_0_60px_rgba(0,243,255,0.18)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="text-[11px] font-orbit uppercase tracking-[0.3em] text-cyan-300">
              Levels 1 &amp; 2 complete
            </span>
            <h1 className="mt-2 text-2xl md:text-4xl font-orbit font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-indigo-300">
              MISSION SCORECARD
            </h1>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-space-950/70 border border-cyan-500/30">
            <User className="w-4 h-4 text-cyan-400" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-orbit font-bold text-slate-100">
                {teamName || activeAccount?.['Team Name'] || 'Team'}
              </span>
              <span className="text-[11px] font-mono text-cyan-300">TEAM ID {teamId}</span>
            </div>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-cyan-500/25 bg-space-950/60 p-5">
            <span className="text-[10px] font-orbit uppercase tracking-widest text-slate-400">Level 1</span>
            <div className="mt-1 text-3xl font-orbit font-black text-cyan-300 tabular-nums">{l1}</div>
            <span className="text-[11px] text-slate-500">Aligning the solar array</span>
          </div>
          <div className="rounded-2xl border border-cyan-500/25 bg-space-950/60 p-5">
            <span className="text-[10px] font-orbit uppercase tracking-widest text-slate-400">Level 2</span>
            <div className="mt-1 text-3xl font-orbit font-black text-cyan-300 tabular-nums">{l2}</div>
            <span className="text-[11px] text-slate-500">Pattern recognition</span>
          </div>
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-5">
            <span className="text-[10px] font-orbit uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
              <Trophy className="w-3 h-3" /> Total
            </span>
            <div className="mt-1 text-3xl font-orbit font-black text-amber-300 tabular-nums">{total}</div>
            <span className="text-[11px] text-amber-200/70">Levels 1 + 2 combined</span>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-2 text-xs rounded-xl px-3.5 py-3 border bg-space-950/60 border-cyan-500/20">
          {lastSave?.saved ? (
            <>
              <CloudUpload className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-emerald-300">{lastSave.message}</span>
            </>
          ) : (
            <>
              <CloudOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="text-amber-200">
                {lastSave?.message || 'Score recorded on this device.'} It will be retried automatically.
              </span>
            </>
          )}
        </div>

        <p className="mt-5 text-sm text-slate-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          You have cleared both rounds. Round 3 opens on the organisers&apos; signal —
          {board.notice.on && board.notice.text ? ' read the notice board there.' : ' the next screen will unlock automatically.'}
        </p>

        <button
          onClick={continueFromScoreCard}
          className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
        >
          Continue to the waiting area
          <ChevronRight className="w-4 h-4" />
        </button>
        <p className="mt-2 text-center text-[11px] text-slate-500 font-mono">
          Continuing automatically in {remaining}s
        </p>
      </div>
    </div>
  );
};
