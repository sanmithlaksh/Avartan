// Temporary end-of-demo score card. Nothing here is written to the tournament
// record — it exists only to show the admin what the run scored before exiting.
import React from 'react';
import { useGame } from '../../context/GameContext';
import { InteractiveCosmicCanvas } from '../UI/InteractiveCosmicCanvas';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Grid3x3,
  Rocket,
  Sparkles,
  Info
} from 'lucide-react';

export const DemoReport: React.FC = () => {
  const { roundOneReport, patternResult, exitDemo } = useGame();

  const isRoundTwo = !roundOneReport && !!patternResult;
  const points = roundOneReport?.points ?? patternResult?.points ?? 0;
  const correct = roundOneReport?.correct ?? patternResult?.correct ?? 0;
  const total = roundOneReport?.total ?? patternResult?.total ?? 0;
  const accuracy =
    roundOneReport && roundOneReport.total > 0
      ? Math.round((roundOneReport.correct / roundOneReport.total) * 100)
      : patternResult?.accuracy ?? 0;
  const perfect = isRoundTwo
    ? accuracy === 100
    : !!roundOneReport && !roundOneReport.timedOut && roundOneReport.correct === roundOneReport.total;

  return (
    <div className="relative w-screen h-screen overflow-y-auto bg-space-950 text-slate-100 flex items-center justify-center p-4 select-none">
      <InteractiveCosmicCanvas />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(168,85,247,0.16),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-space-900/92 border border-fuchsia-400/40 p-6 md:p-9 backdrop-blur-2xl shadow-[0_0_80px_rgba(217,70,239,0.25)] flex flex-col gap-5 animate-fade-in my-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                perfect
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-fuchsia-950/60 border-fuchsia-500/50 text-fuchsia-300'
              }`}
            >
              {perfect ? <Trophy className="w-7 h-7" /> : isRoundTwo ? <Grid3x3 className="w-7 h-7" /> : <Rocket className="w-7 h-7" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-fuchsia-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Demo complete • temporary score
              </span>
              <h1 className="text-2xl md:text-3xl font-orbit font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-sky-200 to-amber-200">
                {isRoundTwo ? 'ROUND 02 DEMO' : 'ROUND 01 DEMO'}
              </h1>
              <span className="text-xs text-slate-400">
                {isRoundTwo ? 'Pattern Recognition' : 'Celestial Alignment'} • nothing has been saved
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-orbit uppercase tracking-wider text-slate-400">Score</div>
            <div className="font-mono text-4xl font-black text-amber-300 tabular-nums">{points}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-space-950/70 border border-cyan-500/25">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Correct</div>
            <div className="font-mono text-xl font-bold text-emerald-300">
              {correct}/{total}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-space-950/70 border border-rose-500/25">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Wrong</div>
            <div className="font-mono text-xl font-bold text-rose-300">{Math.max(0, total - correct)}</div>
          </div>
          <div className="p-3 rounded-xl bg-space-950/70 border border-amber-500/25 col-span-2 sm:col-span-1">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Accuracy</div>
            <div className="font-mono text-xl font-bold text-amber-300">{accuracy}%</div>
          </div>
        </div>

        {roundOneReport && (
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-space-950/60 border border-cyan-500/20">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-slate-400">
              <span>{roundOneReport.timedOut ? 'Clock expired' : 'Latest PIN graded'}</span>
              <span className="text-cyan-300">expected {roundOneReport.expectedCode}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {roundOneReport.expectedCode.split('-').map((digit, idx) => {
                const entered = roundOneReport.enteredCode.split('-')[idx];
                const ok = entered === digit;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs ${
                      ok
                        ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {entered ?? '–'}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-fuchsia-950/25 border border-fuchsia-500/30 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-fuchsia-300 shrink-0 mt-0.5" />
          <span className="text-xs text-slate-300 leading-relaxed">
            This score is for the demo only. It was not written to the team record, the leaderboard or
            the database.
          </span>
        </div>

        <button
          type="button"
          data-testid="demo-exit"
          onClick={exitDemo}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_25px_rgba(217,70,239,0.35)] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit demo — back to admin login
        </button>
      </div>
    </div>
  );
};
