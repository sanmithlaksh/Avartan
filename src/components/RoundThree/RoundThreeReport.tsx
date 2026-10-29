// End-of-round-3 report. Marsfall posts its score to the host, the host saves it
// on the team record, and this card sends the squad back to the mission cards.
import React from 'react';
import { useGame } from '../../context/GameContext';
import { InteractiveCosmicCanvas } from '../UI/InteractiveCosmicCanvas';
import {
  Satellite,
  Trophy,
  AlertTriangle,
  Target,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const fmt = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export const RoundThreeReportCard: React.FC = () => {
  const { roundThreeReport, roundThreePoints, totalPoints, teamName, goToHub } = useGame();

  if (!roundThreeReport) return null;

  const { points, usedSeconds, penalty, won } = roundThreeReport;
  const displayPoints = points || roundThreePoints;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-space-950 text-slate-100 flex items-center justify-center p-4 select-none">
      <InteractiveCosmicCanvas />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(168,85,247,0.18),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-space-900/92 border border-purple-400/40 p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_80px_rgba(168,85,247,0.25)] flex flex-col gap-5 animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                won
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
              }`}
            >
              {won ? <Trophy className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Round 03 • Mission Report
              </span>
              <h1 className="text-2xl md:text-3xl font-orbit font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-200 to-amber-200">
                {won ? 'TOUCHDOWN ON MARS' : 'SIGNAL LOST'}
              </h1>
              <span className="text-xs text-slate-400">
                Squad {teamName} • {won ? 'all five stages cleared' : 'mission ended before completion'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-orbit uppercase tracking-wider text-slate-400">Round 3 pts</div>
            <div className="font-mono text-3xl font-black text-amber-300 tabular-nums">{displayPoints}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-space-950/70 border border-cyan-500/25">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Time used</div>
            <div className="font-mono text-xl font-bold text-cyan-300">{fmt(usedSeconds)}</div>
          </div>
          <div className="p-3 rounded-xl bg-space-950/70 border border-rose-500/25">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Wrong answers</div>
            <div className="font-mono text-xl font-bold text-rose-300">{penalty}</div>
          </div>
          <div className="p-3 rounded-xl bg-space-950/70 border border-amber-500/25">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Total standing</div>
            <div className="font-mono text-xl font-bold text-amber-300">{totalPoints}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-space-950/60 border border-purple-500/20 flex items-start gap-2.5">
          <Target className="w-4 h-4 text-purple-300 shrink-0 mt-0.5" />
          <span className="text-xs text-slate-300 leading-relaxed">
            {won
              ? 'The lander is down, the site is stable and the science team has a green light. '
              : 'The mission clock or the descent got the better of this run. '}
            Round 3 points are saved to the tournament record.
            {penalty > 0 ? ` ${penalty} wrong answer${penalty === 1 ? '' : 's'} cost time on the clock.` : ''}
          </span>
        </div>

        <div className="flex flex-col gap-2.5 pt-1 border-t border-purple-500/20">
          <button
            type="button"
            data-testid="round-3-report-back"
            onClick={goToHub}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Mission Cards
          </button>
        </div>

        <p className="text-center text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
          <Clock className="w-3 h-3" />
          All three rounds are now sealed. Final standings are on the leaderboard.
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        </p>
      </div>
    </div>
  );
};

export default RoundThreeReportCard;
