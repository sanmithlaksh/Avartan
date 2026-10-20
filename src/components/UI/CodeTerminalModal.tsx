// Planetary Combination Checker and Round Code Terminal Modal
import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import {
  PLANET_DEFINITIONS,
  ZODIAC_SECTORS,
  computeCurrentObservedCode
} from '../../engine/astronomy';
import { soundFx } from '../../utils/audio';
import {
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  Compass,
  Sparkles,
  HelpCircle,
  Delete,
  Terminal
} from 'lucide-react';

interface CodeTerminalModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CodeTerminalModal: React.FC<CodeTerminalModalProps> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const {
    currentMission,
    planets,
    submitRoundCode,
    showCodeModal,
    setShowCodeModal
  } = useGame();

  const isOpen = propIsOpen !== undefined ? propIsOpen : showCodeModal;
  const onClose = propOnClose || (() => setShowCodeModal(false));

  const [enteredCode, setEnteredCode] = useState<string>('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmArmed, setConfirmArmed] = useState<boolean>(false);

  // The code the player's own placements currently read out
  const currentObservedCode = computeCurrentObservedCode(currentMission.targets, planets);

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setConfirmArmed(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Keypad button press
  const handleKeyPress = (val: string) => {
    soundFx.playNodeSnap();
    setEnteredCode(prev => prev + val);
    setFeedback(null);
  };

  const handleBackspace = () => {
    soundFx.playNodeSnap();
    setEnteredCode(prev => prev.slice(0, -1));
    setFeedback(null);
  };

  const handleClear = () => {
    soundFx.playNodeSnap();
    setEnteredCode('');
    setFeedback(null);
  };

  // Check Current Planetary Combinations
  const handleCheckCombination = () => {
    soundFx.playObservationRay();
    setEnteredCode(currentObservedCode.replace(/\?/g, '0'));

    const allPlaced = currentMission.targets.every(t => planets[t.planetId]?.selectedNode !== null);
    if (!allPlaced) {
      setFeedback({
        success: false,
        message: 'Some target planets have not been placed on the orbital rings yet.'
      });
      return;
    }

    setFeedback({
      success: true,
      message: `Observed readings loaded: ${currentObservedCode}. Authenticate the sequence to test it.`
    });
  };

  // Submit and grade the entered code. One submission only: the round closes and
  // the score card explains which digits matched.
  const handleSubmitCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!enteredCode.trim()) return;

    if (!confirmArmed) {
      setConfirmArmed(true);
      setFeedback({
        success: false,
        message: 'This is your only submission — the round closes as soon as you authenticate. Press again to confirm.'
      });
      return;
    }

    setConfirmArmed(false);
    soundFx.playSuccessTone();
    submitRoundCode(enteredCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/85 backdrop-blur-2xl animate-fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-2xl bg-space-900/95 border border-cyan-400 p-6 md:p-8 shadow-[0_0_60px_rgba(0,243,255,0.35)] flex flex-col gap-5 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-space-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
            <Terminal className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-orbit font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-amber-200">
              PLANETARY COMBINATION & CLEARANCE TERMINAL
            </h2>
            <span className="text-xs text-slate-400 font-sans">
              Readings unlock as each world is placed on a sign.
            </span>
          </div>
        </div>

        {/* Combination Telemetry Status Box */}
        <div className="p-4 rounded-xl bg-space-950/80 border border-cyan-500/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-orbit font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              Observed Readings
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Sightline Origin: Earth
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {currentMission.targets.map(target => {
              const def = PLANET_DEFINITIONS[target.planetId];
              const pState = planets[target.planetId];
              const currentSector = pState && pState.apparentSector !== null ? ZODIAC_SECTORS[pState.apparentSector] : null;

              return (
                <div
                  key={target.planetId}
                  className="p-3 rounded-lg border flex flex-col gap-1.5 bg-space-900/60 border-cyan-500/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-orbit font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: def.color }} />
                      {def.name}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-space-950 text-slate-500 border border-slate-700">
                      {currentSector ? `digit ${currentSector.sectorNumber}` : 'no reading'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Current sightline:</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {currentSector ? `${currentSector.symbol} ${currentSector.name}` : 'Unplaced'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-cyan-500/20">
            <div className="text-xs font-mono text-slate-300">
              <span>Readings: </span>
              <strong className="text-amber-300 font-bold tracking-widest">{currentObservedCode}</strong>
            </div>

            <button
              onClick={handleCheckCombination}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900/80 border border-cyan-400/50 text-cyan-300 text-xs font-orbit font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Observed Readings
            </button>
          </div>
        </div>

        {/* Code Input & Interactive Keypad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Input display & submit */}
          <div className="flex flex-col gap-3 justify-between">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-orbit uppercase tracking-wider text-slate-400">
                Enter Planetary Position Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={enteredCode}
                  onChange={e => setEnteredCode(e.target.value)}
                  placeholder="Recovered sequence"
                  className="w-full px-4 py-3 rounded-xl bg-space-950 border-2 border-cyan-500/40 text-cyan-300 text-lg font-mono font-bold tracking-widest text-center focus:outline-none focus:border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-sans">
                Enter the digits in planet order, separated by dashes.
              </span>
            </div>

            {/* Feedback message */}
            {feedback && (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                feedback.success
                  ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                  : 'bg-rose-950/70 border-rose-500/60 text-rose-200'
              }`}>
                {feedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <button
              onClick={() => handleSubmitCode()}
              disabled={!enteredCode.trim()}
              className={`w-full py-3 rounded-xl font-orbit font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                confirmArmed
                  ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-slate-950 shadow-[0_0_22px_rgba(251,191,36,0.4)]'
                  : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 shadow-[0_0_20px_rgba(0,243,255,0.3)]'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              {confirmArmed ? 'CONFIRM — LOCK IN THIS CODE' : 'AUTHENTICATE CODE'}
            </button>

            <p className="text-[10px] font-mono text-amber-300/80 text-center leading-relaxed">
              One submission: 1000 pts, minus 100 per wrong digit. The next screen shows your score.
            </p>
          </div>

          {/* Right: Sci-Fi Touch Keypad */}
          <div className="p-3 rounded-xl bg-space-950/80 border border-cyan-500/30 flex flex-col gap-2">
            <span className="text-[10px] font-orbit uppercase tracking-widest text-slate-400 text-center">
              Numeric Decryption Keypad
            </span>

            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0'].map(val => (
                <button
                  key={val}
                  onClick={() => handleKeyPress(val)}
                  className="py-3 rounded-lg bg-space-900 border border-cyan-500/30 text-cyan-300 font-mono text-base font-bold hover:bg-cyan-500/20 hover:border-cyan-400 active:scale-95 transition-all shadow-sm"
                >
                  {val}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="py-3 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold hover:bg-rose-900/50 active:scale-95 transition-all flex items-center justify-center"
                title="Backspace"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleClear}
              className="w-full py-1.5 rounded-lg bg-space-900 text-slate-400 hover:text-slate-200 text-xs font-orbit uppercase tracking-wider"
            >
              Clear Input
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
