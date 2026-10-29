// End-of-round-2 report. Shows the pattern-recognition score and is the bridge
// to the Round 3 briefing or back to the mission cards.
import React from 'react';
import { useGame } from '../../context/GameContext';
import { InteractiveCosmicCanvas } from '../UI/InteractiveCosmicCanvas';
import {
  Grid3x3,
  Trophy,
  Target,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Sparkles
} from 'lucide-react';

export const RoundTwoReport: React.FC = () => {
  const { patternResult, roundTwoPoints, totalPoints, teamName, goToHub, startRoundThreeBriefing } =
    useGame();

  const points = patternResult?.points ?? roundTwoPoints ?? 0;
  const correct = patternResult?.correct ?? 0;
  const total = patternResult?.total ?? 0;
  const accuracy = patternResult?.accuracy ?? (total > 0 ? Math.round((correct / total) * 100) : 0);
  const perfect = total > 0 && correct === total;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-space-950 text-slate-100 flex items-center justify-center p-4 select-none">
      <InteractiveCosmicCanvas />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(217,70,239,0.16),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-space-900/92 border border-fuchsia-400/40 p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_80px_rgba(217,70,239,0.22)] flex flex-col gap-5 animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                perfect
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-fuchsia-950/60 border-fuchsia-500/50 text-fuchsia-300'
              }`}
            >
              {perfect ? <Trophy className="w-7 h-7" /> : <Grid3x3 className="w-7 h-7" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-fuchsia-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Round 02 • Mission Report
              </span>
              <h1 className="text-2xl md:text-3xl font-orbit font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-sky-200 to-cyan-300">
                {perfect ? 'PERFECT RECALL' : 'CHARTS CLOSED'}
              </h1>
              <span className="text-xs text-slate-400">
                Squad {teamName} • results saved to the tournament record
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-orbit uppercase tracking-wider text-slate-400">Round 2 pts</div>
            <div className="font-mono text-3xl font-black text-amber-300 tabular-nums">{points}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-space-950/70 border border-emerald-500/25">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Correct tokens</div>
            <div className="font-mono text-xl font-bold text-emerald-300">
              {correct}/{total}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-space-950/70 border border-rose-500/25">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Missed</div>
            <div className="font-mono text-xl font-bold text-rose-300">{Math.max(0, total - correct)}</div>
          </div>
          <div className="p-3 rounded-xl bg-space-950/70 border border-amber-500/25">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Total standing</div>
            <div className="font-mono text-xl font-bold text-amber-300">{totalPoints}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-space-950/60 border border-fuchsia-500/20 flex items-start gap-2.5">
          <Target className="w-4 h-4 text-fuchsia-300 shrink-0 mt-0.5" />
          <span className="text-xs text-slate-300 leading-relaxed">
            Accuracy <strong className="text-fuchsia-200">{accuracy}%</strong> across five charts.
            {perfect
              ? ' Every token landed in the right cell — a clean sweep.'
              : ' The next operation is the final round, and its clock is much less forgiving.'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1 border-t border-fuchsia-500/20">
          <button
            type="button"
            data-testid="round-2-report-back"
            onClick={goToHub}
            className="flex-1 py-3 rounded-xl bg-space-950 border border-cyan-500/30 text-cyan-300 font-orbit font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:border-cyan-400 hover:bg-cyan-950/40 active:scale-[0.99] transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Mission Cards
          </button>

          <button
            type="button"
            data-testid="round-2-report-next"
            onClick={startRoundThreeBriefing}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-200 shadow-[0_0_25px_rgba(168,85,247,0.35)] cursor-pointer"
          >
            Proceed to Round 03
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-[10px] font-mono text-slate-500">
          Round 2 is sealed. Your score of {points} points is saved to the tournament record.
        </p>
      </div>
    </div>
  );
};

export default RoundTwoReport;
