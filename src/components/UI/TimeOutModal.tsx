// Round 1 failure prompt — shown when the mission clock expires or every
// attempt is exhausted. Offers a fresh run of the same puzzle.
import React from 'react';
import { useGame } from '../../context/GameContext';
import { RotateCcw, AlertTriangle, Clock, Crosshair } from 'lucide-react';

export const TimeOutModal: React.FC = () => {
  const {
    phase,
    timeRemaining,
    attemptsRemaining,
    teamName,
    currentMission,
    restartRoundOne
  } = useGame();

  if (phase !== 'game_over') return null;

  const isTimeout = timeRemaining <= 0;
  const title = isTimeout ? 'TIME RAN OUT' : 'MISSION FAILED';
  const subtitle = isTimeout
    ? 'The mission clock for Round 1 has expired.'
    : 'All three alignment attempts have been used.';
  const detail = isTimeout
    ? 'Your squad memorised the reference table before it disappeared. Start again — the same celestial code is still in effect.'
    : 'Every attempt was rejected by the clearance terminal. Start again and re-check each world against the sign you memorised.';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-space-950/92 backdrop-blur-2xl animate-fade-in select-none">
      <div className="relative w-full max-w-lg rounded-2xl bg-space-900/97 border border-rose-500/50 p-6 md:p-8 shadow-[0_0_70px_rgba(244,63,94,0.3)] flex flex-col gap-5 overflow-hidden animate-fade-in">
        {/* Ambient glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/70 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.35)]">
            <AlertTriangle className="w-7 h-7 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-orbit uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Round 1 • OP-AVARTAN
            </span>
            <h2 className="text-2xl md:text-3xl font-orbit font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-amber-200 to-slate-100">
              {title}
            </h2>
            <span className="text-xs text-slate-300 font-sans mt-0.5">{subtitle}</span>
          </div>
        </div>

        {/* Explanation */}
        <p className="text-sm text-slate-300 leading-relaxed border-l-4 border-rose-500/50 pl-3">
          {detail}
        </p>

        {/* Telemetry */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-xl bg-space-950/80 border border-rose-500/30">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-500">Clock</div>
            <div className="font-mono text-lg font-bold text-rose-300 tabular-nums">
              {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:
              {String(timeRemaining % 60).padStart(2, '0')}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-space-950/80 border border-amber-500/30">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-500">Attempts</div>
            <div className="font-mono text-lg font-bold text-amber-300">{attemptsRemaining}/{3}</div>
          </div>
          <div className="p-3 rounded-xl bg-space-950/80 border border-cyan-500/30">
            <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-500">Squadron</div>
            <div className="text-sm font-bold text-cyan-300 truncate">{teamName}</div>
          </div>
        </div>

        {/* Mission reminder */}
        <div className="p-3 rounded-xl bg-space-950/70 border border-cyan-500/20 flex items-center gap-2.5">
          <Crosshair className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-xs text-slate-300">
            Restoring: <strong className="text-cyan-300 font-orbit">{currentMission.title}</strong>
          </span>
        </div>

        {/* Restart action */}
        <button
          type="button"
          data-testid="restart-round"
          onClick={restartRoundOne}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-cyan-500 text-slate-950 font-orbit font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-200 shadow-[0_0_30px_rgba(244,63,94,0.35)] cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          START AGAIN
        </button>

        <p className="text-center text-[10px] font-mono text-slate-500">
          The clock and attempts reset. Your memorised celestial code is unchanged.
        </p>
      </div>
    </div>
  );
};
