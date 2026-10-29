// Per-planet riddle terminal.
//
// Each target world hides a space riddle. Answering every one of them is what
// authorises the one-time planet ↔ zodiac reference chart; a squad that cannot
// clear them has to wait for the 15:00 emergency reveal instead.
import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { PLANET_DEFINITIONS } from '../../engine/astronomy';
import { CheckCircle2, HelpCircle, Lock, ShieldQuestion, Sparkles, Timer, X } from 'lucide-react';

export const RiddleModal: React.FC = () => {
  const {
    phase,
    activeRiddlePlanet,
    closeRiddle,
    riddles,
    riddleSolved,
    riddleWrong,
    submitRiddleAnswer,
    currentMission,
    chartUsed,
    chartSeconds
  } = useGame();

  const [answer, setAnswer] = useState('');
  const [wrongHere, setWrongHere] = useState(0);
  const [justSolved, setJustSolved] = useState(false);

  const planetId = activeRiddlePlanet;

  // Fresh input every time a different world is opened.
  useEffect(() => {
    setAnswer('');
    setWrongHere(0);
    setJustSolved(false);
  }, [planetId]);

  // Close automatically a moment after a correct answer so the squad sees the
  // confirmation, then can move straight to the next world.
  useEffect(() => {
    if (!justSolved) return;
    const timer = window.setTimeout(() => closeRiddle(), 1100);
    return () => window.clearTimeout(timer);
  }, [justSolved, closeRiddle]);

  if (phase !== 'round_one') return null;
  if (!planetId || !riddles) return null;

  const riddle = riddles[planetId];
  if (!riddle) return null;

  const def = PLANET_DEFINITIONS[planetId];
  const solvedCount = riddleSolved.length;
  const total = currentMission.targets.length;
  const alreadyTried = riddleWrong[planetId] ?? 0;
  const showClue = !justSolved && alreadyTried + wrongHere >= 3;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || justSolved) return;
    const ok = submitRiddleAnswer(planetId, answer);
    if (ok) {
      setJustSolved(true);
    } else {
      setWrongHere(prev => prev + 1);
      setAnswer('');
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-space-950/88 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-lg rounded-2xl bg-space-900/97 border border-cyan-400/70 p-6 flex flex-col gap-4 overflow-hidden shadow-[0_0_70px_rgba(0,243,255,0.35)]">
        <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={closeRiddle}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-space-800 transition-all cursor-pointer"
          title="Close the riddle"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{ backgroundColor: `${def.color}22`, borderColor: `${def.color}66` }}
          >
            <ShieldQuestion className="w-5 h-5" style={{ color: def.color }} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">
              Sealed world · {def.name}
            </span>
            <h2 className="text-base font-orbit font-extrabold text-slate-100 tracking-wide">
              CELESTIAL RIDDLE
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-space-950/80 border border-cyan-500/25 text-[10px] font-mono">
          <span className="text-slate-400 uppercase tracking-wider">Riddles sealed</span>
          <span className="text-cyan-300 font-bold tabular-nums">
            {solvedCount} / {total}
          </span>
        </div>

        {justSolved ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <span className="font-orbit font-black text-lg text-emerald-300 tracking-wide">
              SEAL BROKEN
            </span>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">{riddle.fact}</p>
            {solvedCount >= total ? (
              <p className="text-[11px] font-orbit text-amber-300 uppercase tracking-wider">
                All riddles sealed — the reference chart is authorised
              </p>
            ) : (
              <p className="text-[11px] font-mono text-slate-500">
                {total - solvedCount} riddle{total - solvedCount === 1 ? '' : 's'} left
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-200 leading-relaxed font-sans border-l-4 border-cyan-500/50 pl-3">
              {riddle.prompt}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <label className="text-[10px] font-orbit uppercase tracking-widest text-slate-400">
                Your answer
              </label>
              <input
                autoFocus
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type the answer…"
                className="w-full px-4 py-2.5 rounded-xl bg-space-950 border-2 border-cyan-500/40 text-cyan-100 text-sm font-mono focus:outline-none focus:border-cyan-400"
              />

              {showClue && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-950/50 border border-amber-500/40 text-[11px] text-amber-200">
                  <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    Stuck? The answer is a single word starting with{' '}
                    <strong className="font-mono text-amber-100">
                      “{riddle.answers[0].charAt(0).toUpperCase()}”
                    </strong>
                    .
                  </span>
                </div>
              )}

              {wrongHere > 0 && (
                <span className="text-[11px] font-mono text-rose-300">
                  Not it — {wrongHere} wrong {wrongHere === 1 ? 'answer' : 'answers'} on this world.
                </span>
              )}

              <button
                type="submit"
                disabled={!answer.trim()}
                className="mt-1 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Submit answer
              </button>
            </form>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-space-950/70 border border-slate-700/70 text-[10px] font-mono text-slate-400 leading-relaxed">
              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-500" />
              <span>
                Seal all {total} riddles to authorise the {chartSeconds}s reference chart.
                {chartUsed
                  ? ' The chart has already been spent — use your notes.'
                  : ' If the chain stalls, one emergency reveal opens at 15:00.'}
                <span className="inline-flex items-center gap-1 ml-1 text-slate-500">
                  <Timer className="w-3 h-3" /> clock keeps running.
                </span>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
