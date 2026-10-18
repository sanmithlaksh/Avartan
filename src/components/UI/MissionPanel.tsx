// Mission Panel displaying operational targets, apparent observation status, and submission controls
import React from 'react';
import { useGame } from '../../context/GameContext';
import { PLANET_DEFINITIONS, ZODIAC_SECTORS } from '../../engine/astronomy';
import { PlanetId } from '../../engine/types';
import {
  Crosshair,
  CheckCircle2,
  AlertCircle,
  Eye,
  RotateCcw,
  Send,
  HelpCircle,
  ShieldAlert,
  Sparkles,
  KeyRound
} from 'lucide-react';

export const MissionPanel: React.FC = () => {
  const {
    currentMission,
    planets,
    selectedPlanetId,
    selectPlanet,
    observationActive,
    toggleObservation,
    submitValidation,
    resetCurrentMission,
    validationFeedback,
    zodiacRevealed,
    setShowHintsModal,
    setShowCodeModal,
    phase
  } = useGame();

  return (
    <aside className="w-full lg:w-96 flex flex-col gap-3.5 p-4 bg-space-950/85 backdrop-blur-xl border-l border-cyan-500/20 overflow-y-auto max-h-full select-none z-20">
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
              const targetSector = ZODIAC_SECTORS[target.targetSectorId];
              const isSelected = selectedPlanetId === target.planetId;

              // Current apparent status
              const hasPlaced = pState && pState.selectedNode !== null;
              const currentSector = hasPlaced && pState.apparentSector !== null ? ZODIAC_SECTORS[pState.apparentSector] : null;
              const isAligned = hasPlaced && pState.apparentSector === target.targetSectorId;

              return (
                <div
                  key={target.planetId}
                  onClick={() => selectPlanet(target.planetId)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isAligned
                      ? 'bg-emerald-950/30 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                      : isSelected
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

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      {isAligned ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> LOCKED
                        </span>
                      ) : hasPlaced ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/70 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                          <Crosshair className="w-3 h-3" /> CALIBRATING
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-700">
                          UNPLACED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Alignment Sightline and Code Reveal */}
                  <div className="text-xs pt-1 border-t border-cyan-500/10">
                    {isAligned ? (
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-300 font-orbit font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {currentSector?.symbol} {currentSector?.name} (#{currentSector?.sectorNumber})
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-900/80 border border-emerald-400 text-emerald-200 font-orbit font-extrabold text-xs tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                          CODE: {targetSector.sectorNumber}
                        </span>
                      </div>
                    ) : hasPlaced && currentSector ? (
                      <span className="text-slate-400 font-orbit">
                        Observed: Position #{currentSector.sectorNumber} ({currentSector.symbol} {currentSector.name})
                      </span>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">Select orbit node to calibrate sightline</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Validation Feedback Banner */}
      {validationFeedback && (
        <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
          validationFeedback.isComplete
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
            : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
        }`}>
          {validationFeedback.isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex flex-col gap-0.5">
            <span className="font-orbit font-bold">
              {validationFeedback.isComplete ? 'ALIGNMENT SUCCESSFUL' : 'ALIGNMENT DISCREPANCY'}
            </span>
            <span>{validationFeedback.message}</span>
          </div>
        </div>
      )}

      {/* Action Controls */}
      <div className="mt-auto flex flex-col gap-2 pt-2 border-t border-cyan-500/20">
        {/* Code Terminal Button */}
        <button
          onClick={() => setShowCodeModal(true)}
          className="w-full py-2.5 px-4 rounded-xl font-orbit font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 bg-space-900 hover:bg-cyan-950 border border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all"
        >
          <KeyRound className="w-4 h-4 text-amber-400" />
          CHECK COMBINATION & ENTER CODE
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

        {/* Submit Configuration */}
        <button
          onClick={submitValidation}
          disabled={phase === 'mission_success' || phase === 'game_over'}
          className="w-full py-3 px-4 rounded-xl font-orbit font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          SUBMIT SIGHTLINE ALIGNMENT
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
