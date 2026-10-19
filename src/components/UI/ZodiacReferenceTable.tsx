// Zodiac Planetary Reference Table — shows once for 30 seconds then disappears forever
import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { PLANET_DEFINITIONS, ZODIAC_SECTORS } from '../../engine/astronomy';
import { Eye, Timer, AlertTriangle } from 'lucide-react';

export const ZodiacReferenceTable: React.FC = () => {
  const {
    zodiacTableVisible,
    hideZodiacTable,
    currentMission,
  } = useGame();

  const [secondsLeft, setSecondsLeft] = useState(30);

  useEffect(() => {
    if (!zodiacTableVisible) {
      setSecondsLeft(30);
      return;
    }
    setSecondsLeft(30);
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          hideZodiacTable();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [zodiacTableVisible, hideZodiacTable]);

  if (!zodiacTableVisible) return null;

  const urgency = secondsLeft <= 10;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-space-950/90 backdrop-blur-xl animate-fade-in select-none">
      <div className={`relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-4 overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.5)] border ${
        urgency ? 'bg-rose-950/95 border-rose-400' : 'bg-space-900/98 border-purple-400'
      }`}>
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-purple-300">
              <Eye className="w-4 h-4" />
              <span className="text-[10px] font-orbit tracking-widest uppercase">Classified Reference • One-Time View</span>
            </div>
            <h2 className="text-lg font-orbit font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300">
              CELESTIAL POSITION REFERENCE
            </h2>
          </div>

          {/* Countdown */}
          <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${
            urgency ? 'bg-rose-900/80 border-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-purple-950/80 border-purple-500'
          }`}>
            <Timer className={`w-4 h-4 ${urgency ? 'text-rose-400 animate-bounce' : 'text-purple-400'}`} />
            <span className={`text-2xl font-orbit font-extrabold ${urgency ? 'text-rose-300' : 'text-purple-200'}`}>
              {secondsLeft}s
            </span>
          </div>
        </div>

        {urgency && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-900/60 border border-rose-500/50">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="text-xs font-orbit text-rose-300 font-bold tracking-wide">MEMORISE QUICKLY — TABLE DISAPPEARS FOREVER IN {secondsLeft} SECONDS</span>
          </div>
        )}

        {/* Instruction */}
        <p className="text-xs text-slate-300 font-sans leading-relaxed border-l-4 border-purple-500/50 pl-3">
          Write down or memorise <strong className="text-purple-200">which sign each world belongs to</strong>. This table can{' '}
          <strong className="text-rose-300">never be displayed again</strong>. No code is shown here — the digits
          unlock only as you place each planet on its remembered sign in Mission Control.
        </p>

        {/* Table */}
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-3 gap-2 px-2 py-1">
            <span className="text-[10px] font-orbit tracking-wider text-slate-500 uppercase">Planet</span>
            <span className="text-[10px] font-orbit tracking-wider text-slate-500 uppercase col-span-2">Position Sector</span>
          </div>
          <div className="flex flex-col gap-1">
            {currentMission.targets.map(target => {
              const def = PLANET_DEFINITIONS[target.planetId];
              const sector = ZODIAC_SECTORS[target.targetSectorId];
              return (
                <div
                  key={target.planetId}
                  className="grid grid-cols-3 gap-2 px-3 py-2 rounded-lg bg-space-950/70 border border-purple-500/20"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: def.color }} />
                    <span className="text-xs font-orbit font-bold text-slate-200">{def.name}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-lg" style={{ color: sector.color }}>{sector.symbol}</span>
                    <span className="text-xs font-orbit text-slate-100 font-semibold">{sector.name}</span>
                    <span className="ml-auto text-[9px] font-mono uppercase tracking-wider text-slate-500">
                      code locked
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-space-900 rounded-full overflow-hidden border border-purple-500/30">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              urgency ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 'bg-gradient-to-r from-purple-500 to-pink-400'
            }`}
            style={{ width: `${(secondsLeft / 30) * 100}%` }}
          />
        </div>

        <p className="text-center text-[10px] font-mono text-slate-500">
          This window will close automatically. It cannot be reopened.
        </p>
      </div>
    </div>
  );
};
