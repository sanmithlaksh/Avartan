// Round 3 mission briefing. Every route into Marsfall passes through this
// warning screen so squads see the clock, the scoring and the objectives first.
import React from 'react';
import { useGame } from '../../context/GameContext';
import { InteractiveCosmicCanvas } from '../UI/InteractiveCosmicCanvas';
import {
  Satellite,
  Clock,
  Trophy,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Gauge,
  Map,
  Calculator,
  Flame,
  Rocket
} from 'lucide-react';

export const RoundThreeBriefing: React.FC = () => {
  const { teamName, roundThreePoints, roundThreeDone, goToHub, beginRoundThree } = useGame();

  return (
    <div className="relative w-screen h-screen overflow-y-auto bg-space-950 text-slate-100 flex items-center justify-center p-4 select-none">
      <InteractiveCosmicCanvas />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(168,85,247,0.18),transparent_62%)]" />

      <div className="relative z-10 w-full max-w-[96vw] md:max-w-[920px] lg:max-w-[1100px] xl:max-w-[1180px] rounded-3xl bg-space-900/95 border border-purple-400/40 p-6 md:p-9 shadow-[0_0_90px_rgba(168,85,247,0.28)] flex flex-col gap-4 animate-fade-in my-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-400/50 flex items-center justify-center text-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
              <Satellite className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300">
                Round 03 • Mission Briefing
              </span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-300">MARSFALL</span>
              </h1>
              <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
                Squad {teamName} • Blackout Protocol
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end sm:hidden md:flex">
            <span className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Round 03 points</span>
            <span className="font-mono text-2xl font-black text-amber-300 tabular-nums">
              {roundThreeDone ? roundThreePoints : '—'}
            </span>
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-orbit uppercase tracking-widest text-amber-300">
              Read before you launch
            </span>
            <span className="text-xs text-amber-100 leading-relaxed">
              One continuous 30:00 mission clock covers all five stages. It never pauses, not even between
              stages. Wrong answers cost points and cut up to 30 seconds off the clock. If the timer reaches
              zero, the mission ends and whatever you have scored is final.
            </span>
          </div>
        </div>

        {/* Objective */}
        <div className="p-4 rounded-xl bg-space-950/70 border border-purple-500/25 flex flex-col gap-1.5">
          <span className="text-[10px] font-orbit uppercase tracking-widest text-purple-300">Objective</span>
          <p className="text-sm text-slate-200 leading-relaxed">
            Fly the final operation: choose a safe landing site on Mars, restore the ship's systems, verify
            your site data in the descent simulator, calculate the descent, then fly the lander down by hand.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
            <span className="flex items-start gap-2 text-[11px] text-slate-300">
              <Map className="w-3.5 h-3.5 text-purple-300 shrink-0 mt-0.5" />
              Stage 1 — pick the best of 25 landing sites
            </span>
            <span className="flex items-start gap-2 text-[11px] text-slate-300">
              <Gauge className="w-3.5 h-3.5 text-purple-300 shrink-0 mt-0.5" />
              Stage 2 — balance the ship's power budget
            </span>
            <span className="flex items-start gap-2 text-[11px] text-slate-300">
              <Calculator className="w-3.5 h-3.5 text-purple-300 shrink-0 mt-0.5" />
              Stage 3 — verify the site, then simulate
            </span>
            <span className="flex items-start gap-2 text-[11px] text-slate-300">
              <Flame className="w-3.5 h-3.5 text-purple-300 shrink-0 mt-0.5" />
              Stage 4 — calculate the descent
            </span>
            <span className="flex items-start gap-2 text-[11px] text-slate-300 sm:col-span-2">
              <Rocket className="w-3.5 h-3.5 text-purple-300 shrink-0 mt-0.5" />
              Stage 5 — fly the lander to touchdown inside the zone
            </span>
          </div>
        </div>        <div className="grid grid-cols-1 gap-2.5">
          <div className="p-4 rounded-xl bg-space-950/70 border border-cyan-500/20 flex flex-col gap-2">
            <span className="text-[10px] font-orbit uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Time limit
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black text-cyan-200">30:00</span>
              <span className="text-[11px] text-slate-300">mission clock</span>
            </div>
            <ul className="flex flex-col gap-1.5 text-[11px] text-slate-300">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                Every wrong answer costs up to 30 seconds.
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                Running out of time ends the mission immediately.
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-space-950/70 border border-amber-500/25 flex flex-col gap-2">
            <span className="text-[10px] font-orbit uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> Points scheme
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black text-amber-300">115</span>
              <span className="text-[11px] text-slate-300">points across 5 stages</span>
            </div>
            <ul className="flex flex-col gap-1.5 text-[11px] text-slate-300">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                Stages 1–4: 20 points each; Stage 5: 35 points.
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                Wrong answers lose 25% of that item's marks.
              </li>
            </ul>
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
            data-testid="begin-round-three"
            onClick={beginRoundThree}
            className="sm:flex-[1.4] py-3.5 rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] cursor-pointer"
          >
            <Rocket className="w-4 h-4" />
            Start Round 03
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-[10px] font-mono text-slate-500">
          The mission clock starts the moment you press start.
        </p>
      </div>
    </div>
  );
};

export default RoundThreeBriefing;
