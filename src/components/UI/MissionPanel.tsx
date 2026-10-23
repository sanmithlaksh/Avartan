// Mission Panel displaying operational targets, apparent observation status, and submission controls
import React from 'react';
import { useGame } from '../../context/GameContext';
import { PLANET_DEFINITIONS, ZODIAC_SECTORS } from '../../engine/astronomy';
import { PlanetId } from '../../engine/types';
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  RotateCcw,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  KeyRound,
  Lock,
  Flag
} from 'lucide-react';

export const MissionPanel: React.FC = () => {
  const {
    currentMission,
    planets,
    selectedPlanetId,
    selectPlanet,
    observationActive,
    toggleObservation,
    resetCurrentMission,
    setShowHintsModal,
    setShowCodeModal,
    codeTerminalUnlocked,
    codeUnlockSeconds,
    latestAttempt,
    endRoundOne,
    isDemoMode
  } = useGame();

  const unlockFormatted = `${Math.floor(codeUnlockSeconds / 60)
    .toString()
    .padStart(2, '0')}:${(codeUnlockSeconds % 60).toString().padStart(2, '0')}`;

  const handleEndRound = () => {
    const confirmed = window.confirm(
      'End Round 1 now? Your latest submitted PIN will be graded and the round will close.'
    );
    if (confirmed) endRoundOne();
  };

  return (
    <aside className="w-full lg:w-96 flex flex-col gap-3.5 p-4 bg-space-950/95 border-l border-cyan-500/20 overflow-y-auto max-h-full select-none z-20">
      {/* Mission Badge & Header */}
      <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-space-900/60 border border-cyan-500/20">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            {currentMission.codeName}
          </span>
          <span className="text-xs font-orbit text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            +{currentMission.pointsReward} PTS
          </span>
        </div>
        <h2 className="text-base font-orbit font-bold text-slate-100 tracking-wide mt-1">
          {currentMission.title}
        </h2>
        <p className="text-xs text-slate-400 font-sans leading-relaxed mt-0.5">
          {currentMission.briefing}
        </p>
      </div>

      {/* Planet Placement & Decryption Checklist */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-orbit uppercase tracking-widest text-slate-400">
            Planet Placement & Decryption
          </span>
          <span className="text-[10px] font-mono text-cyan-400">
            Earth Vantage Sightline
          </span>
        </div>

        {currentMission.type === 'REVERSE_IDENTIFICATION' ? (
          <div className="p-3 rounded-xl bg-space-900/40 border border-cyan-500/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Probe: {PLANET_DEFINITIONS[currentMission.reverseQuestion?.givenPlanetId || 'neptune'].name}
              </span>
              <span className="text-xs font-mono text-cyan-400">
                Node {currentMission.reverseQuestion?.givenNodeIndex} ({(currentMission.reverseQuestion?.givenNodeIndex || 0) * 30}°)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Trace the sightline from Earth through the probe to determine which sector it intersects.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {currentMission.targets.map(target => {
              const def = PLANET_DEFINITIONS[target.planetId];
              const pState = planets[target.planetId];
              const isSelected = selectedPlanetId === target.planetId;

              // This panel only ever reports where the world currently sits. It
              // never confirms whether that placement is the requested one — the
              // clearance terminal is the only thing that grades the code.
              const hasPlaced = !!pState && pState.selectedNode !== null;
              const observed = hasPlaced && pState.apparentSector !== null
                ? ZODIAC_SECTORS[pState.apparentSector]
                : null;

              return (
                <div
                  key={target.planetId}
                  onClick={() => selectPlanet(target.planetId)}
                  className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.15)]'
                      : 'bg-space-900/40 border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: def.color }}
                      />
                      <span className="text-sm font-semibold font-orbit text-slate-200">
                        {def.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasPlaced ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-700">
                          PLACED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-500 border border-slate-700">
                          UNPLACED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Observed sign and the digit it contributes to the code */}
                  <div className="text-xs pt-1 border-t border-cyan-500/10">
                    {hasPlaced && observed ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-200 font-orbit flex items-center gap-1.5">
                          <span className="text-base leading-none" style={{ color: observed.color }}>
                            {observed.symbol}
                          </span>
                          {observed.name}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-space-950 border border-cyan-500/50 text-cyan-200 font-orbit font-extrabold text-xs tracking-widest tabular-nums">
                          {observed.sectorNumber}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">
                        Select an orbit node to read this world&apos;s sign
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="mt-auto flex flex-col gap-2 pt-2 border-t border-cyan-500/20">
        {/* Code Terminal Button */}
        <button
          onClick={() => setShowCodeModal(true)}
          className={`w-full py-2.5 px-4 rounded-xl font-orbit font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 border transition-all ${
            codeTerminalUnlocked
              ? 'bg-space-900 hover:bg-cyan-950 border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.2)]'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}
        >
          {codeTerminalUnlocked ? (
            <KeyRound className="w-4 h-4 text-amber-400" />
          ) : (
            <Lock className="w-4 h-4 text-amber-300" />
          )}
          {codeTerminalUnlocked ? 'ENTER CLEARANCE CODE' : `PIN LOCKED • ${unlockFormatted}`}
        </button>
        <p className="text-[10px] text-slate-500 font-mono text-center leading-relaxed">
          {codeTerminalUnlocked
            ? 'Unlimited attempts. Only correct or incorrect is shown.'
            : 'The PIN terminal opens after the opening window.'}
        </p>

        {latestAttempt && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-space-950/70 border border-slate-700 text-[10px] font-mono">
            <span className="text-slate-400 uppercase tracking-wider">Latest PIN</span>
            <span className={latestAttempt.isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
              {latestAttempt.isCorrect ? 'CORRECT' : 'INCORRECT'} • try #{latestAttempt.attempts}
            </span>
          </div>
        )}

        <button
          onClick={handleEndRound}
          className="w-full py-2 px-4 rounded-xl font-orbit font-bold text-[11px] tracking-wider uppercase flex items-center justify-center gap-2 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 transition-all"
        >
          <Flag className="w-3.5 h-3.5" />
          {isDemoMode ? 'END DEMO & GRADE PIN' : 'END ROUND & GRADE PIN'}
        </button>

        {/* Sightline Observe Toggle */}
        <button
          onClick={toggleObservation}
          className={`w-full py-2 px-4 rounded-xl font-orbit font-semibold text-xs tracking-wider flex items-center justify-center gap-2 transition-all border ${
            observationActive
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,243,255,0.15)]'
              : 'bg-space-900 border-cyan-500/20 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {observationActive ? 'OBSERVATION RAY ACTIVE' : 'ENABLE OBSERVATION RAY'}
        </button>

        {/* Secondary Utility row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={resetCurrentMission}
            className="py-2 px-3 rounded-lg bg-space-900/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs font-orbit flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={() => setShowHintsModal(true)}
            className="py-2 px-3 rounded-lg bg-space-900/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 text-xs font-orbit flex items-center justify-center gap-1.5 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Request Hint
          </button>
        </div>
      </div>
    </aside>
  );
};
