// Mission hub — the three round cards that gate the tournament progression.
// Round 1 unlocks Round 2, and a finished round can never be replayed.
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { InteractiveCosmicCanvas } from '../UI/InteractiveCosmicCanvas';
import { backendService } from '../../utils/supabase';
import {
  Rocket,
  Sparkles,
  Lock,
  CheckCircle2,
  Trophy,
  LogOut,
  Shield,
  Play,
  X,
  AlertTriangle,
  Clock,
  Grid3x3,
  Satellite,
  ChevronRight
} from 'lucide-react';

type PendingRound = 1 | 2 | 3 | null;

const cardStateClass = (state: 'active' | 'locked' | 'done') =>
  state === 'active'
    ? 'border-cyan-400/70 bg-space-900/80 shadow-[0_0_45px_rgba(0,243,255,0.28)]'
    : state === 'done'
    ? 'border-emerald-500/50 bg-space-900/55 shadow-[0_0_30px_rgba(16,185,129,0.16)]'
    : 'border-slate-700/60 bg-space-950/70 opacity-60 saturate-50';

export const RoundHub: React.FC = () => {
  const {
    teamName,
    activeAccount,
    roundOneDone,
    roundTwoDone,
    roundThreeDone,
    roundOnePoints,
    roundTwoPoints,
    roundThreePoints,
    totalPoints,
    startRoundOne,
    startRoundTwo,
    startRoundThreeBriefing,
    logoutTeam,
    isAdmin,
    setPhase,
    setShowAdminModal
  } = useGame();

  const [pending, setPending] = useState<PendingRound>(null);
  const [starting, setStarting] = useState(false);

  // Round 3 lights up once the first two rounds are cleared.
  const roundThreeUnlocked = roundTwoDone;

  const beginSelected = () => {
    setStarting(true);
    window.setTimeout(() => {
      setStarting(false);
      if (pending === 1) startRoundOne();
      else if (pending === 2) startRoundTwo();
      else if (pending === 3) startRoundThreeBriefing();
      setPending(null);
    }, 220);
  };

  const confirmCopy =
    pending === 1
      ? {
          title: 'START ROUND 01?',
          badge: 'CELESTIAL ALIGNMENT',
          warning:
            'A 35:00 countdown starts the moment you press OK. The clearance terminal stays sealed for the first 15:00.',
          notes: [
            'Study the sky and place each world on the sign that matches its sightline.',
            'The PIN terminal opens after 15 minutes — no memorisation table is provided.',
            'Unlimited PIN attempts; only correct or incorrect is shown. The latest PIN is graded when the round ends.'
          ]
        }
      : pending === 2
      ? {
          title: 'START ROUND 02?',
          badge: 'PATTERN RECOGNITION',
          warning:
            'Five charts. Each one draws itself, holds for 7s, then you get 30s to rebuild it on an empty grid.',
          notes: [
            'Levels 1-3 are randomised planet fields with a limited supply of each world.',
            'Levels 4-5 are real constellations drawn at random from the night-sky catalogue.',
            'Each correct token scores 100 pts, plus a 100 pt perfect bonus.'
          ]
        }
      : {
          title: 'START ROUND 03?',
          badge: 'MARSFALL · FINAL ROUND',
          warning:
            'A 30:00 mission clock starts the moment you press OK and never pauses. Wrong answers cut points and up to 30 seconds each.',
          notes: [
            'Five stages: landing site, power budget, site verification, descent maths, manual landing.',
            'Stages 1-4 score 20 pts each; Stage 5 scores 35 pts. Wrong answers lose 25% of that item.',
            'If the clock reaches zero the mission ends immediately and the score is final.'
          ]
        };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-space-950 text-slate-100 flex flex-col select-none">
      <InteractiveCosmicCanvas />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.12),transparent_60%)]" />

      {/* Top bar */}
      <header className="relative z-10 w-full px-5 md:px-8 py-4 flex items-center justify-between border-b border-cyan-500/20 backdrop-blur-md bg-space-950/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img
              src="/assets/wave_gradient.png"
              alt="Void Paradigm mark"
              className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.55)]"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-orbit font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-indigo-300">
              VOID PARADIGM
            </span>
            <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
              Mission Hub • {teamName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-space-900/70 border border-amber-500/30">
            <Trophy className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Total</span>
              <span className="text-sm font-mono font-bold text-amber-300">{totalPoints}</span>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              className="p-2 rounded-xl bg-space-900/70 border border-cyan-500/20 text-cyan-300 hover:border-cyan-400 transition-all duration-200 cursor-pointer"
              title="Admin console"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setPhase('welcome')}
            className="px-3 py-2 rounded-xl bg-space-900/70 border border-cyan-500/20 text-slate-300 hover:text-cyan-200 hover:border-cyan-400 text-[11px] font-orbit font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
          >
            Homepage
          </button>

          <button
            type="button"
            onClick={logoutTeam}
            className="p-2 rounded-xl bg-space-900/70 border border-rose-500/30 text-rose-400 hover:border-rose-400 transition-all duration-200 cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Cards */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-6 overflow-y-auto">
        <div className="w-full max-w-5xl flex flex-col items-center gap-6">
          <div className="flex flex-col items-center text-center gap-2">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 text-[11px] font-mono tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              SELECT YOUR OPERATION
            </span>
            <h1 className="text-2xl md:text-4xl font-orbit font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-fuchsia-300">
              MISSION CARDS
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl">
              Clear a round to unlock the next operation. Completed rounds stay sealed — your score for them is final.
            </p>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Round 01 */}
            <article
              className={`relative rounded-2xl border p-5 flex flex-col gap-3 backdrop-blur-xl transition-all duration-500 ease-out ${
                cardStateClass(roundOneDone ? 'done' : 'active')
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-[10px] font-orbit font-bold uppercase tracking-widest">
                  <Rocket className="w-3 h-3" />
                  Round 01
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-space-950/80 border border-cyan-500/20 text-slate-300">
                  {roundOneDone ? 'Complete' : 'Active'}
                </span>
              </div>

              <h2 className="text-lg font-orbit font-bold text-slate-100">Celestial Alignment</h2>
              <p className="text-xs text-slate-400 leading-relaxed flex-1">
                Align all seven worlds with their observed signs to recover the clearance code. The PIN terminal
                stays sealed for the first fifteen minutes. Thirty-five minutes on the clock.
              </p>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-cyan-400" /> 35:00</span>
                <span className="text-amber-300 font-bold">{roundOneDone ? `${roundOnePoints} pts` : '1000 pts'}</span>
              </div>

              <button
                type="button"
                data-testid="round-1-card"
                disabled={roundOneDone}
                onClick={() => setPending(1)}
                className={`w-full py-2.5 rounded-xl font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                  roundOneDone
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 cursor-default'
                    : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 hover:brightness-110 active:scale-95 shadow-[0_0_25px_rgba(0,243,255,0.35)] cursor-pointer'
                }`}
              >
                {roundOneDone ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {roundOneDone ? 'Round Complete' : 'Start Round 01'}
              </button>
            </article>

            {/* Round 02 */}
            <article
              className={`relative rounded-2xl border p-5 flex flex-col gap-3 backdrop-blur-xl transition-all duration-500 ease-out ${
                cardStateClass(roundTwoDone ? 'done' : roundOneDone ? 'active' : 'locked')
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-300 text-[10px] font-orbit font-bold uppercase tracking-widest">
                  <Grid3x3 className="w-3 h-3" />
                  Round 02
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-space-950/80 border border-fuchsia-500/20 text-slate-300">
                  {roundTwoDone ? 'Complete' : roundOneDone ? 'Unlocked' : 'Locked'}
                </span>
              </div>

              <h2 className="text-lg font-orbit font-bold text-slate-100">Pattern Recognition</h2>
              <p className="text-xs text-slate-400 leading-relaxed flex-1">
                Three random planet fields with finite supplies, then two real constellations drawn at random. Each
                chart draws itself, holds for seven seconds, then you rebuild it inside thirty seconds.
              </p>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5"><Grid3x3 className="w-3.5 h-3.5 text-fuchsia-400" /> 5 grids</span>
                <span className="text-amber-300 font-bold">{roundTwoDone ? `${roundTwoPoints} pts` : 'up to 4800 pts'}</span>
              </div>

              <button
                type="button"
                data-testid="round-2-card"
                disabled={!roundOneDone || roundTwoDone}
                onClick={() => setPending(2)}
                className={`w-full py-2.5 rounded-xl font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                  roundTwoDone
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 cursor-default'
                    : roundOneDone
                    ? 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-[0_0_25px_rgba(217,70,239,0.35)] cursor-pointer'
                    : 'bg-space-950/80 border border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {roundTwoDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : roundOneDone ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {roundTwoDone ? 'Round Complete' : roundOneDone ? 'Start Round 02' : 'Clear Round 01 first'}
              </button>
            </article>

            {/* Round 03 */}
            <article
              className={`relative rounded-2xl border p-5 flex flex-col gap-3 backdrop-blur-xl transition-all duration-500 ease-out ${cardStateClass(
                roundThreeDone ? 'done' : roundThreeUnlocked ? 'active' : 'locked'
              )}`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-400/40 text-purple-300 text-[10px] font-orbit font-bold uppercase tracking-widest">
                  <Satellite className="w-3 h-3" />
                  Round 03
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-space-950/80 border border-purple-500/20 text-slate-300">
                  {roundThreeDone ? 'Complete' : roundThreeUnlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>

              <h2 className="text-lg font-orbit font-bold text-slate-100">Marsfall</h2>
              <p className="text-xs text-slate-400 leading-relaxed flex-1">
                The final operation: pick a landing site, restore the ship's systems, verify your data, calculate
                the descent and fly the lander down by hand. Five stages on one unforgiving clock.
              </p>

              <div className={`flex items-center justify-between text-[11px] font-mono ${roundThreeUnlocked ? 'text-purple-300' : 'text-slate-500'}`}>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 30:00 · 5 stages</span>
                <span className="text-amber-300 font-bold">{roundThreeDone ? `${roundThreePoints} pts` : 'up to 115 pts'}</span>
              </div>

              <button
                type="button"
                data-testid="round-3-card"
                disabled={!roundTwoDone || roundThreeDone}
                onClick={() => setPending(3)}
                className={`w-full py-2.5 rounded-xl font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                  roundThreeDone
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 cursor-default'
                    : roundTwoDone
                    ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-[0_0_25px_rgba(168,85,247,0.35)] cursor-pointer'
                    : 'bg-space-950/80 border border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {roundThreeDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : roundTwoDone ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {roundThreeDone ? 'Round Complete' : roundTwoDone ? 'Start Round 03' : 'Clear Round 02 first'}
              </button>
            </article>
          </div>

          <p className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">
            Squad {activeAccount?.['Team Name'] || teamName} • Level {(activeAccount?.['Current level']) || 1} •
            {backendService.getCredentials().isConfigured ? ' Cloud sync active' : ' Local save'} ·{' '}
            {roundThreeDone
              ? 'All 3 rounds complete'
              : roundTwoDone
              ? 'Rounds 1 & 2 complete'
              : roundOneDone
              ? 'Round 1 complete'
              : 'Round 1 pending'}
          </p>
        </div>
      </main>

      {/* Start confirmation */}
      {pending !== null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-space-950/90 backdrop-blur-2xl animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-space-900/97 border border-cyan-400/60 p-6 md:p-7 flex flex-col gap-4 shadow-[0_0_70px_rgba(0,243,255,0.3)] overflow-hidden">
            <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

            <button
              type="button"
              onClick={() => setPending(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-space-800 transition-all duration-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  {confirmCopy.badge}
                </span>
                <h3 className="text-xl font-orbit font-black text-slate-100">{confirmCopy.title}</h3>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span className="text-xs text-amber-200 leading-relaxed">{confirmCopy.warning}</span>
            </div>

            <ul className="flex flex-col gap-2">
              {confirmCopy.notes.map(note => (
                <li key={note} className="flex items-start gap-2 text-xs text-slate-300">
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="flex-1 py-3 rounded-xl bg-space-950 border border-slate-700 text-slate-300 font-orbit font-bold text-xs uppercase tracking-wider hover:border-slate-500 transition-all duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-start-round"
                onClick={beginSelected}
                disabled={starting}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all duration-200 shadow-[0_0_25px_rgba(0,243,255,0.4)] cursor-pointer disabled:opacity-70"
              >
                <Play className="w-4 h-4" />
                {starting ? 'Launching…' : 'OK — Start'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
