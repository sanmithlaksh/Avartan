// End-of-round-1 report. Always shown once the round closes, whether the code
// was graded or the six-minute clock ran out, and it is the only bridge to
// Round 2 or back to the mission cards.
import React from 'react';
import { useGame } from '../../context/GameContext';
import { InteractiveCosmicCanvas } from '../UI/InteractiveCosmicCanvas';
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ChevronRight,
  Rocket,
  Target,
  AlertTriangle
} from 'lucide-react';

export const RoundReport: React.FC = () => {
  const {
    roundOneReport,
    teamName,
    goToHub,
    startRoundTwo,
    totalPoints
  } = useGame();

  if (!roundOneReport) return null;

  const { points, correct, total, timedOut, expectedCode, enteredCode } = roundOneReport;
  const wrong = total - correct;
  const perfect = !timedOut && wrong === 0;

  const expectedDigits = expectedCode ? expectedCode.split('-') : [];
  const enteredDigits = enteredCode ? enteredCode.split('-') : [];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-space-950 text-slate-100 flex items-center justify-center p-4 select-none">
      <InteractiveCosmicCanvas />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.12),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-space-900/92 border border-cyan-400/40 p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,243,255,0.22)] flex flex-col gap-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                timedOut
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                  : perfect
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-cyan-950/60 border-cyan-400/50 text-cyan-300'
              }`}
            >
              {timedOut ? <AlertTriangle className="w-7 h-7" /> : perfect ? <Trophy className="w-7 h-7" /> : <Target className="w-7 h-7" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                Round 01 • Mission Report
              </span>
              <h1 className="text-2xl md:text-3xl font-orbit font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-200">
                {timedOut ? 'TIME RAN OUT' : perfect ? 'CODE RECOVERED' : 'ROUND CLOSED'}
              </h1>
              <span className="text-xs text-slate-400">
                Squad {teamName} • {timedOut ? 'clock expired before a code was entered' : 'clearance code graded'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-orbit uppercase tracking-wider text-slate-400">Round 1 pts</div>
            <div className="font-mono text-3xl font-black text-amber-300 tabular-nums">{points}</div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-space-950/70 border border-cyan-500/25">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Correct digits</div>
            <div className="font-mono text-xl font-bold text-emerald-300">{timedOut ? '—' : `${correct}/${total}`}</div>
          </div>
          <div className="p-3 rounded-xl bg-space-950/70 border border-rose-500/25">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Wrong digits</div>
            <div className="font-mono text-xl font-bold text-rose-300">{timedOut ? '—' : wrong}</div>
          </div>
          <div className="p-3 rounded-xl bg-space-950/70 border border-amber-500/25">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Total standing</div>
            <div className="font-mono text-xl font-bold text-amber-300">{totalPoints}</div>
          </div>
        </div>

        {/* Scoring explanation */}
        <div className="p-3.5 rounded-xl bg-space-950/60 border border-cyan-500/20 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span className="text-xs text-slate-300 leading-relaxed">
            {timedOut ? (
              <>The clock expired before a code was entered, so the round awards the <strong className="text-amber-300">300 point</strong> time-out consolation.</>
            ) : (
              <>
                Base <strong className="text-slate-100">1000</strong> points, minus <strong className="text-rose-300">100</strong> for
                each wrong digit ({wrong} × 100 = {wrong * 100}) →{' '}
                <strong className="text-amber-300">{points} points</strong>.{perfect ? ' Perfect sequence!' : ''}
              </>
            )}
          </span>
        </div>

        {/* Digit-by-digit comparison */}
        {!timedOut && expectedDigits.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-orbit uppercase tracking-widest text-slate-400">
              Digit breakdown
            </span>
            <div className="flex flex-wrap gap-1.5">
              {expectedDigits.map((digit, idx) => {
                const ok = enteredDigits[idx] === digit;
                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg border min-w-[46px] ${
                      ok
                        ? 'bg-emerald-950/50 border-emerald-500/50'
                        : 'bg-rose-950/50 border-rose-500/50'
                    }`}
                  >
                    <span className={`font-mono text-sm font-bold ${ok ? 'text-emerald-200' : 'text-rose-200'}`}>
                      {enteredDigits[idx] ?? '–'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">want {digit}</span>
                    {ok ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5" />
                    ) : (
                      <XCircle className="w-3 h-3 text-rose-400 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1 border-t border-cyan-500/20">
          <button
            type="button"
            data-testid="report-back-to-hub"
            onClick={goToHub}
            className="flex-1 py-3 rounded-xl bg-space-950 border border-cyan-500/30 text-cyan-300 font-orbit font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:border-cyan-400 hover:bg-cyan-950/40 active:scale-[0.99] transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Mission Cards
          </button>

          <button
            type="button"
            data-testid="report-to-round-2"
            onClick={startRoundTwo}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-200 shadow-[0_0_25px_rgba(217,70,239,0.35)] cursor-pointer"
          >
            <Rocket className="w-4 h-4" />
            Enter Round 02
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-[10px] font-mono text-slate-500">
          Round 1 is sealed. Your score of {points} points is saved to the tournament record.
        </p>
      </div>
    </div>
  );
};
