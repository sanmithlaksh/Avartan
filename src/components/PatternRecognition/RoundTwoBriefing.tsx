// Round 2 mission briefing. Every route into Pattern Recognition passes through
// this screen so squads see the objective, limits and scoring before the clock
// and the reveal animations begin.
import React from 'react';
import { useGame } from '../../context/GameContext';
import { InteractiveCosmicCanvas } from '../UI/InteractiveCosmicCanvas';
import {
  Grid3x3,
  Eye,
  Pencil,
  Trophy,
  Timer,
  Layers,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const RoundTwoBriefing: React.FC = () => {
  const { teamName, beginRoundTwo, goToHub, roundTwoDone, roundTwoPoints } = useGame();

  return (
    <div className="relative w-screen h-screen overflow-y-auto bg-space-950 text-slate-100 flex items-center justify-center p-4 select-none">
      <InteractiveCosmicCanvas />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(217,70,239,0.18),transparent_62%)]" />

      <div className="relative z-10 w-full max-w-3xl rounded-3xl bg-space-900/95 border border-fuchsia-400/40 p-6 md:p-9 shadow-[0_0_90px_rgba(217,70,239,0.28)] flex flex-col gap-5 animate-fade-in my-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-400/50 flex items-center justify-center text-fuchsia-300 shadow-[0_0_25px_rgba(217,70,239,0.3)]">
              <Grid3x3 className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-fuchsia-300 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Round 02 • Mission Briefing
              </span>
              <h1 className="text-2xl md:text-3xl font-orbit font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-sky-200 to-cyan-300">
                PATTERN RECOGNITION
              </h1>
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                Squad {teamName}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Round 02 points</span>
            <span className="font-mono text-2xl font-black text-amber-300 tabular-nums">
              {roundTwoDone ? roundTwoPoints : '—'}
            </span>
          </div>
        </div>

        {/* Objective */}
        <div className="p-4 rounded-xl bg-space-950/70 border border-fuchsia-500/25 flex flex-col gap-1.5">
          <span className="text-[10px] font-orbit uppercase tracking-widest text-fuchsia-300">
            Objective
          </span>
          <p className="text-sm text-slate-200 leading-relaxed">
            Five star charts appear one at a time. Watch each chart draw itself, memorise every
            token, then rebuild it on an empty grid before the timer runs out.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Charts 1–3 are randomised planet fields with a limited supply of Mercury, Earth and
            Jupiter. Charts 4–5 are real constellations, drawn at random from the night-sky catalogue.
          </p>
        </div>

        {/* Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3.5 rounded-xl bg-space-950/70 border border-cyan-500/25 flex items-start gap-2.5">
            <Eye className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Reveal</span>
              <span className="font-mono text-lg font-bold text-cyan-200">7 seconds</span>
              <span className="text-[10px] text-slate-500 leading-tight">
                Starts only after the chart finishes drawing.
              </span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-space-950/70 border border-fuchsia-500/25 flex items-start gap-2.5">
            <Pencil className="w-5 h-5 text-fuchsia-300 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Rebuild</span>
              <span className="font-mono text-lg font-bold text-fuchsia-200">30 seconds</span>
              <span className="text-[10px] text-slate-500 leading-tight">
                Per chart, on an empty grid.
              </span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-space-950/70 border border-amber-500/25 flex items-start gap-2.5">
            <Layers className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Charts</span>
              <span className="font-mono text-lg font-bold text-amber-200">5 total</span>
              <span className="text-[10px] text-slate-500 leading-tight">
                3 planet fields + 2 constellations.
              </span>
            </div>
          </div>
        </div>

        {/* Limits and scoring */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-4 rounded-xl bg-space-950/70 border border-cyan-500/20 flex flex-col gap-2">
            <span className="text-[10px] font-orbit uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Limits
            </span>
            <ul className="flex flex-col gap-1.5 text-[11px] text-slate-300">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                Each chart can be attempted once; there is no replay.
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                Planet supplies are finite — exhausted tokens cannot be placed twice.
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                The round clock pauses between charts, not inside the 30-second rebuild.
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-space-950/70 border border-amber-500/25 flex flex-col gap-2">
            <span className="text-[10px] font-orbit uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> Points
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black text-amber-300">100</span>
              <span className="text-[11px] text-slate-300">pts per correct token</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black text-emerald-300">+100</span>
              <span className="text-[11px] text-slate-300">perfect-chart bonus</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 border-t border-amber-500/20 text-[10px] font-mono text-slate-400">
              <Timer className="w-3.5 h-3.5 text-amber-400" />
              Maximum 4,800 points
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={goToHub}
            className="sm:flex-1 py-3.5 rounded-xl bg-space-950 border border-cyan-500/30 text-cyan-300 font-orbit font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:border-cyan-400 hover:bg-cyan-950/40 active:scale-[0.99] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to mission cards
          </button>

          <button
            type="button"
            data-testid="begin-round-two"
            onClick={beginRoundTwo}
            className="sm:flex-[1.4] py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_30px_rgba(217,70,239,0.4)] cursor-pointer"
          >
            <Grid3x3 className="w-4 h-4" />
            Start Round 02
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-[10px] font-mono text-slate-500">
          The first chart begins drawing immediately after you press start.
        </p>
      </div>
    </div>
  );
};
