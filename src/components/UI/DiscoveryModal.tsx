// Hidden Zodiac Discovery Revelation Modal
import React from 'react';
import { useGame } from '../../context/GameContext';
import { ZODIAC_SECTORS } from '../../engine/astronomy';
import { Sparkles, Compass, CheckCircle2, X } from 'lucide-react';

export const DiscoveryModal: React.FC = () => {
  const {
    showDiscoveryModal,
    setShowDiscoveryModal
  } = useGame();

  if (!showDiscoveryModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-xl rounded-2xl bg-space-900/95 border border-cyan-400 p-6 md:p-8 shadow-[0_0_60px_rgba(0,243,255,0.35)] flex flex-col gap-5 overflow-hidden">
        {/* Glow ambient background accent */}
        <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => setShowDiscoveryModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-space-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Discovery Badge */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-400/50 flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,243,255,0.3)]">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
              SECRET MECHANISM UNLOCKED • +100 PTS
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-orbit font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300">
            CELESTIAL REFERENCE WHEEL REVEALED
          </h2>

          <blockquote className="p-3 rounded-xl bg-space-950/70 border-l-4 border-cyan-400 text-xs md:text-sm text-cyan-100 font-sans italic leading-relaxed">
            "The celestial reference system has been discovered. The positions of distant planets are revealed through the perspective of the observer."
          </blockquote>
        </div>

        {/* The 12 Illuminated Zodiac Constellations */}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 py-2">
          {ZODIAC_SECTORS.map((sector) => (
            <div
              key={sector.id}
              className="p-2 rounded-lg bg-space-950/80 border border-cyan-500/30 flex flex-col items-center justify-center gap-1 hover:border-cyan-400 transition-all shadow-sm"
            >
              <span className="text-xl font-bold text-cyan-300 font-orbit">
                {sector.symbol}
              </span>
              <span className="text-[10px] font-medium text-slate-300 font-orbit tracking-wider">
                {sector.name}
              </span>
              <span className="text-[8px] font-mono text-slate-500">
                {sector.startAngleDeg}°
              </span>
            </div>
          ))}
        </div>

        {/* Gameplay Hint */}
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          Now that the celestial sectors are visible, use the <strong>OBSERVE</strong> sightline ray to trace direct vectors from Earth through your positioned worlds to identify their apparent constellations.
        </p>

        {/* Confirmation Button */}
        <button
          onClick={() => setShowDiscoveryModal(false)}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-orbit font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)]"
        >
          RESUME MISSION
        </button>
      </div>
    </div>
  );
};
