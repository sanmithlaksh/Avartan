// Progressive Intelligence Hints Modal
import React from 'react';
import { useGame } from '../../context/GameContext';
import { HelpCircle, Lock, Unlock, X, Sparkles } from 'lucide-react';

export const HintsModal: React.FC = () => {
  const {
    showHintsModal,
    setShowHintsModal,
    currentMission,
    hintsUsedCount,
    revealNextHint
  } = useGame();

  if (!showHintsModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-lg rounded-2xl bg-space-900/95 border border-cyan-500/40 p-6 md:p-7 shadow-[0_0_50px_rgba(0,243,255,0.25)] flex flex-col gap-5">
        <button
          onClick={() => setShowHintsModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-space-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-cyan-400">
          <HelpCircle className="w-5 h-5" />
          <h2 className="text-base font-orbit font-bold uppercase tracking-wider text-slate-100">
            Navigation Tactical Intel
          </h2>
        </div>

        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          Tactical telemetry can assist in calibrating your sightline vectors. Revealing hints incurs zero penalty on placement score, but completing without hints grants a <strong>+50 PTS</strong> intuition bonus.
        </p>

        {/* Hints List */}
        <div className="flex flex-col gap-3">
          {currentMission.hints.map((hintText, idx) => {
            const isUnlocked = idx < hintsUsedCount;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-space-950/70 border-cyan-500/40 text-slate-200 shadow-sm'
                    : 'bg-space-950/30 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-orbit uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    {isUnlocked ? <Unlock className="w-3 h-3 text-cyan-400" /> : <Lock className="w-3 h-3 text-slate-600" />}
                    Intel Level 0{idx + 1}
                  </span>
                  {isUnlocked && (
                    <span className="text-[9px] font-mono text-emerald-400">DECRYPTED</span>
                  )}
                </div>

                <p className="text-xs font-sans leading-relaxed">
                  {isUnlocked ? hintText : 'Encrypted tactical frequency. Unlock to reveal observation telemetry.'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-2 pt-2 border-t border-cyan-500/20">
          {hintsUsedCount < 3 ? (
            <button
              onClick={revealNextHint}
              className="w-full py-2.5 rounded-xl bg-space-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-orbit font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              DECRYPT LEVEL 0{hintsUsedCount + 1} INTEL
            </button>
          ) : (
            <div className="text-center py-2 text-xs font-orbit text-cyan-400">
              All tactical intelligence unlocked for this stage.
            </div>
          )}

          <button
            onClick={() => setShowHintsModal(false)}
            className="w-full py-2 rounded-lg bg-space-950 text-slate-400 hover:text-slate-200 text-xs font-orbit"
          >
            Return to Mission
          </button>
        </div>
      </div>
    </div>
  );
};
