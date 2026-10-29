// Riddle modal triggered by holding any planet in the 3D view.
// Solving all riddles unlocks a one-time reference table for 25 seconds.
import React, { useState, useEffect, useRef } from 'react';
import { Lock, CheckCircle, X, BookOpen, Timer, AlertTriangle, ArrowRight } from 'lucide-react';
import { PlanetRiddle } from '../../engine/types';
import { useGame } from '../../context/GameContext';

interface RiddleModalProps {
  riddleId: string;
  visible: boolean;
  answeredCorrectly: boolean;
  onDismiss: () => void;
  onAnswer: (answer: string) => boolean;
  onRevealReferenceTable: () => void;
  canReveal: boolean;
  solvedCount: number;
  totalCount: number;
}

export const RiddleModal: React.FC<RiddleModalProps> = ({
  riddleId,
  visible,
  answeredCorrectly,
  onDismiss,
  onAnswer,
  onRevealReferenceTable,
  canReveal,
  solvedCount,
  totalCount
}) => {
  const { zodiacTableShown, zodiacTableVisible } = useGame();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localAnswer, setLocalAnswer] = useState('');
  const [shake, setShake] = useState(false);
  const showSuccessRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      setLocalAnswer('');
      setShake(false);
      showSuccessRef.current = false;
      return;
    }
    setLocalAnswer('');
    setShake(false);
    showSuccessRef.current = false;
    window.setTimeout(() => inputRef.current?.select(), 0);
  }, [visible]);

  useEffect(() => {
    setShake(visible && !!localAnswer && !answeredCorrectly && shake === false);
  }, [visible, localAnswer, answeredCorrectly, shake]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!localAnswer.trim()) {
        setShake(true);
        return;
      }
      const ok = onAnswer(localAnswer);
      if (ok) {
        setLocalAnswer('');
        showSuccessRef.current = true;
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onDismiss();
    }
  };

  if (!visible) return null;

  const answered = answeredCorrectly || showSuccessRef.current;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 bg-space-950/95 backdrop-blur-xl animate-fade-in select-none"
      onPointerDown={e => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      <div
        className={`relative w-full max-w-lg rounded-3xl p-5 flex flex-col gap-4 overflow-hidden shadow-[0_0_70px_rgba(168,85,247,0.45)] border ${
          answered
            ? 'bg-emerald-950/98 border-emerald-400'
            : 'bg-space-900/98 border-purple-400/70'
        }`}
      >
        {/* ambient glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-purple-500/18 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-cyan-500/18 blur-3xl pointer-events-none" />

        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {answered ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <Lock className="w-5 h-5 text-purple-400 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="text-[10px] font-orbit tracking-widest uppercase text-slate-500">
                {answered ? 'Solved' : 'Hold scan · fragmented log'}
              </div>
              <div className="text-sm font-orbit font-bold text-slate-200 truncate">
                encrypted planetary dossier
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-space-800 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* riddle */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-cyan-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>one of {totalCount} fragmented logs recovered</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-200">
            {riddleId === 'mercury' && 'I race around the Sun in a frantic hurry, yet a single sunrise can take longer than an Earth year. Which smallest world endures the most extreme day-and-night swing?'}
            {riddleId === 'venus' && 'I am wrapped in acid clouds and spin the wrong way, so my day is longer than my year. Though I am our nearest neighbour, my surface is hot enough to soften lead. What world am I?'}
            {riddleId === 'mars' && 'I wear a rusty coat and keep ancient dry riverbeds like scars. Dust storms can hide me from view for weeks, and my thin breathless air cannot shield the radiation that reaches my ground. Where am I?'}
            {riddleId === 'jupiter' && 'I am the giant of this family, spinning so fast that my clouds stretch into belts and zones. A great red storm wider than your Earth has raged across my face for centuries. Which planet am I?'}
            {riddleId === 'saturn' && 'I am a ringed jewel, made of countless icy fragments dancing in narrow lanes. My rings are so wide they would stretch across much of this system, yet they are thinner than a whisper. What world is this?'}
            {riddleId === 'uranus' && 'I roll around the Sun on my side, so each pole basks in endless daylight for decades before sinking into equal darkness. Methane gives my cold upper air its blue-green tint. Who am I?'}
            {riddleId === 'neptune' && 'I am the far blue wind-world, where storms race at supersonic speed even though I receive almost no sunlight. My strongest gusts are the fastest measured anywhere in this system. Which distant planet is this?'}
          </p>
        </div>

        {/* input */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400/60" />
            decipher the world — type its name and submit
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              value={localAnswer}
              onChange={e => { setLocalAnswer(e.target.value); setShake(false); }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. mars, jupiter, saturn …"
              className={`w-full bg-space-950/95 border rounded-xl px-4 py-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-all ${
                shake
                  ? 'border-rose-400/80 bg-rose-950/40'
                  : answered
                    ? 'border-emerald-400/70'
                    : 'border-purple-400/50 hover:border-purple-300 focus:border-purple-300'
              }`}
            />
            {shake && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                <kbd className="px-1.5 py-0.5 rounded bg-space-800 border border-slate-700 text-[10px]">Enter</kbd>
                <span>submit</span>
                <kbd className="px-1.5 py-0.5 rounded bg-space-800 border border-slate-700 text-[10px] ml-2">Esc</kbd>
                <span>dismiss</span>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-mono ${answered ? 'border-emerald-400/60 text-emerald-300' : 'border-slate-700/60 text-slate-500'}`}>
              solved {solvedCount} / {totalCount}
              {answered && <CheckCircle className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* reference table unlock */}
        {answered && canReveal && !zodiacTableShown && !zodiacTableVisible && (
          <div className="flex flex-col gap-2 animate-fade-in">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-amber-400">
              <Timer className="w-3.5 h-3.5" />
              <span>decrypted chain complete — one-time reference available</span>
            </div>
            <button
              type="button"
              onClick={onRevealReferenceTable}
              className="group w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-space-950 font-orbit font-bold text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_24px_rgba(251,191,36,0.35)] cursor-pointer"
            >
              <Timer className="w-4 h-4" />
              <span>Open reference table for 25 seconds</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <div className="flex items-start gap-2 text-[10px] font-mono text-slate-500 leading-relaxed border-t border-amber-500/30 pt-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>This table can only be opened once this run. After it closes, the code digits and each planet's sign are gone from the interface for good — you must remember them or lose the mission.</span>
            </div>
          </div>
        )}

        {/* already shown once */}
        {answered && zodiacTableShown && (
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>reference table already revealed this run — it cannot be shown again</span>
          </div>
        )}
      </div>
    </div>
  );
};
