// Mission Panel displaying operational targets, apparent observation status, and submission controls
import React from 'react';
import { useGame } from '../../context/GameContext';
import { PLANET_DEFINITIONS, ZODIAC_SECTORS } from '../../engine/astronomy';
import {
  CheckCircle2,
  Eye,
  RotateCcw,
  HelpCircle,
  KeyRound,
  Lock,
  Flag,
  ShieldQuestion,
  Sparkles,
  Timer
} from 'lucide-react';

const formatClock = (seconds: number) => {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

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
    isDemoMode,
    zodiacRevealed,
    riddleSolved,
    allRiddlesSolved,
    openRiddle,
    showZodiacTable,
    chartSeconds,
    chartUsed,
    emergencyRevealAvailable,
    emergencySecondsLeft,
    chartGateMsg,
    clearChartGateMsg
  } = useGame();

  const unlockFormatted = formatClock(codeUnlockSeconds);
  const totalTargets = currentMission.targets.length;
  const sealedCount = riddleSolved.length;
  const sealedPct = totalTargets > 0 ? Math.round((sealedCount / totalTargets) * 100) : 0;

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

      {/* Riddle chain → reference chart authorisation */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-space-900/50 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-orbit uppercase tracking-widest text-purple-200">
            Riddle Chain
          </span>
          <span className="text-[10px] font-mono text-purple-300 tabular-nums">
            {sealedCount}/{totalTargets} sealed
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-space-950 border border-purple-500/25 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-300"
            style={{ width: `${sealedPct}%` }}
          />
        </div>

        {chartUsed ? (
          <span className="text-[10px] font-mono text-slate-400 leading-relaxed">
            Reference chart spent. Read each world's sign off your notes and place it on that node.
          </span>
        ) : allRiddlesSolved ? (
          <>
            <button
              type="button"
              onClick={showZodiacTable}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-slate-950 font-orbit font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Display reference chart · {chartSeconds}s
            </button>
            <span className="text-[10px] font-mono text-slate-500 leading-relaxed">
              Opens once. The round clock pauses while it is on screen.
            </span>
          </>
        ) : (
          <div className="flex flex-col gap-1 text-[10px] font-mono leading-relaxed">
            <span className="text-slate-400">
              Answer each world's riddle to authorise the {chartSeconds}s reference chart.
            </span>
            {emergencyRevealAvailable ? (
              <span className="text-amber-300 flex items-center gap-1.5">
                <Timer className="w-3 h-3" /> Emergency reveal ready — hold the outer rim for 10s.
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1.5">
                <Timer className="w-3 h-3" /> Emergency reveal at 15:00 · {formatClock(emergencySecondsLeft)} left
              </span>
            )}
          </div>
        )}

        {chartGateMsg && (
          <button
            type="button"
            onClick={clearChartGateMsg}
            className="text-left text-[10px] font-mono leading-relaxed text-amber-200 bg-amber-950/50 border border-amber-500/40 rounded-lg px-2.5 py-2"
          >
            {chartGateMsg}
          </button>
        )}
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

              const hasPlaced = !!pState && pState.selectedNode !== null;
              const observed = hasPlaced && pState.apparentSector !== null
                ? ZODIAC_SECTORS[pState.apparentSector]
                : null;

              // A digit is only ever printed for a world that is sitting on the
              // sign the mission asked for. A wrong node reads as "no code".
              const isCorrect = !!pState && observed !== null && pState.apparentSector === target.targetSectorId;
              const riddleSealed = riddleSolved.includes(target.planetId);

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
                  <div className="flex items-center justify-between gap-2">
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
                      <button
                        type="button"
                        disabled={chartUsed || riddleSealed}
                        onClick={e => {
                          e.stopPropagation();
                          openRiddle(target.planetId);
                        }}
                        title={
                          chartUsed
                            ? 'The reference chart has been spent'
                            : riddleSealed
                              ? 'This riddle is already sealed'
                              : 'Open this world\'s riddle'
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 transition-all ${
                          riddleSealed
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : chartUsed
                              ? 'bg-space-950 border-slate-700 text-slate-500'
                              : 'bg-purple-950/60 border-purple-400/50 text-purple-200 hover:brightness-125 cursor-pointer'
                        }`}
                      >
                        {riddleSealed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> SEALED
                          </>
                        ) : (
                          <>
                            <ShieldQuestion className="w-3 h-3" /> RIDDLE
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Observed sign, and the digit — only once the sign is right */}
                  <div className="text-xs pt-1 border-t border-cyan-500/10">
                    {hasPlaced && observed && zodiacRevealed ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-200 font-orbit flex items-center gap-1.5">
                          <span className="text-base leading-none" style={{ color: observed.color }}>
                            {observed.symbol}
                          </span>
                          {observed.name}
                        </span>
                        {isCorrect ? (
                          <span className="px-2.5 py-0.5 rounded-lg bg-space-950 border border-emerald-400/60 text-emerald-200 font-orbit font-extrabold text-xs tracking-widest tabular-nums">
                            CODE {target.targetSectorId + 1}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-lg bg-space-950 border border-slate-700 text-slate-500 font-orbit font-extrabold text-xs tracking-widest">
                            — · NO CODE
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">
                        {zodiacRevealed
                          ? 'Select an orbit node to read this world\'s sign'
                          : 'Unlock signs to read the sky'}
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
          onClick={() => {
            if (!zodiacRevealed) {
              alert('Activate the outer celestial boundary first to decrypt the signs.');
              return;
            }
            setShowCodeModal(true);
          }}
          className={`w-full py-2.5 px-4 rounded-xl font-orbit font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 border transition-all ${
            !zodiacRevealed
              ? 'bg-space-950/80 border-slate-700 text-slate-500 cursor-not-allowed'
              : codeTerminalUnlocked
              ? 'bg-space-900 hover:bg-cyan-950 border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.2)]'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}
        >
          {!zodiacRevealed ? (
            <Lock className="w-4 h-4 text-slate-500" />
          ) : codeTerminalUnlocked ? (
            <KeyRound className="w-4 h-4 text-amber-400" />
          ) : (
            <Lock className="w-4 h-4 text-amber-300" />
          )}
          {!zodiacRevealed
            ? 'DECRYPT BOUNDARY FIRST'
            : codeTerminalUnlocked
            ? 'ENTER CLEARANCE CODE'
            : `PIN LOCKED • ${unlockFormatted}`}
        </button>
        <p className="text-[10px] text-slate-500 font-mono text-center leading-relaxed">
          {!zodiacRevealed
            ? 'Hold the outer rim for 10s to reveal the sky.'
            : codeTerminalUnlocked
            ? 'Digits unlock as each world reaches its sign.'
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
