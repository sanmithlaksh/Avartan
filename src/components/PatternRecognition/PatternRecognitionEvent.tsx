// Avartan — Round 2: Pattern Recognition
//
// Five deep-space grids, one after another. Each grid lights up cell by cell for
// ten seconds, then the player must rebuild it on an empty lattice in fifteen
// seconds. Scoring is 100 pts per correct box plus a 100 pt perfect bonus.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  PATTERN_COUNT,
  PATTERN_GRID_SIZE,
  PATTERN_LIT_CELLS,
  PatternSpec,
  countCorrectCells,
  generatePatternSet
} from '../../engine/patterns';
import { soundFx } from '../../utils/audio';
import {
  Grid3x3,
  Timer,
  Eye,
  Pencil,
  CheckCircle2,
  XCircle,
  Trophy,
  ChevronRight,
  Sparkles,
  Lock,
  ArrowLeft,
  Star
} from 'lucide-react';

const REVEAL_SECONDS = 10;
const INPUT_SECONDS = 15;
const REVEAL_STAGGER_MS = 480;
const POINTS_PER_BOX = 100;
const PERFECT_BONUS = 100;

type Stage = 'reveal' | 'ready' | 'input' | 'result' | 'summary';

interface PatternResult {
  correctCells: number;
  points: number;
  perfect: boolean;
}

const PatternGrid: React.FC<{
  lit: number[];
  order?: number[];
  revealCount?: number;
  interactive?: boolean;
  selected?: number[];
  onToggle?: (cell: number) => void;
  answer?: number[];
  showVerdicts?: boolean;
  accent?: 'fuchsia' | 'cyan';
}> = ({
  lit,
  order,
  revealCount,
  interactive = false,
  selected = [],
  onToggle,
  answer,
  showVerdicts = false,
  accent = 'fuchsia'
}) => {
  const litSet = useMemo(() => new Set(lit), [lit]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const answerSet = useMemo(() => new Set(answer || []), [answer]);

  const visibleCount = revealCount === undefined ? Number.MAX_SAFE_INTEGER : revealCount;
  const revealIndex = useMemo(() => {
    const map = new Map<number, number>();
    (order || []).forEach((cell, idx) => map.set(cell, idx));
    return map;
  }, [order]);

  const accentCell =
    accent === 'cyan'
      ? 'border-cyan-300 bg-cyan-500/25 shadow-[0_0_20px_rgba(0,243,255,0.32)]'
      : 'border-fuchsia-300 bg-fuchsia-500/25 shadow-[0_0_20px_rgba(217,70,239,0.32)]';

  return (
    <div
      className="grid gap-1.5 w-full"
      style={{ gridTemplateColumns: `repeat(${PATTERN_GRID_SIZE}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: PATTERN_GRID_SIZE * PATTERN_GRID_SIZE }, (_, cell) => {
        const orderIdx = revealIndex.get(cell);
        const revealed = litSet.has(cell) && (orderIdx === undefined || orderIdx < visibleCount);
        const picked = selectedSet.has(cell);
        const isAnswer = answerSet.has(cell);
        const showLit = showVerdicts ? isAnswer || picked : revealed || picked;
        const verdictCorrect = showVerdicts && isAnswer && picked;
        const verdictWrong = showVerdicts && picked && !isAnswer;
        const verdictMissed = showVerdicts && isAnswer && !picked;

        return (
          <button
            key={cell}
            type="button"
            data-testid={`pattern-cell-${cell}`}
            disabled={!interactive}
            onClick={() => interactive && onToggle?.(cell)}
            aria-label={`Grid node ${cell + 1}`}
            className={`relative aspect-square rounded-lg border transition-all duration-300 ease-out ${
              showLit
                ? verdictWrong
                  ? 'border-rose-400 bg-rose-500/25'
                  : verdictCorrect
                  ? 'border-emerald-300 bg-emerald-500/30 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
                  : accentCell
                : 'border-space-700/60 bg-space-950/80'
            } ${
              verdictMissed
                ? 'ring-1 ring-amber-300/70'
                : ''
            } ${
              interactive
                ? 'cursor-pointer hover:border-cyan-400/70 hover:bg-cyan-950/40 active:scale-95'
                : 'cursor-default'
            }`}
            style={{
              opacity: showLit ? 1 : 1,
              transform: showLit ? 'scale(1)' : 'scale(0.96)'
            }}
          >
            {showLit && (
              <span className="absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.22),transparent_70%)]" />
            )}
            {showVerdicts && (verdictCorrect || verdictWrong) && (
              <span className="absolute inset-0 flex items-center justify-center">
                {verdictCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100/90" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-100/90" />
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export const PatternRecognitionEvent: React.FC = () => {
  const { teamName, completePatternEvent } = useGame();

  const [patterns, setPatterns] = useState<PatternSpec[]>([]);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('reveal');
  const [selected, setSelected] = useState<number[]>([]);
  const [revealCount, setRevealCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(REVEAL_SECONDS);
  const [results, setResults] = useState<PatternResult[]>([]);
  const [saving, setSaving] = useState(false);

  const savedRef = useRef(false);
  const pattern = patterns[index];

  // Fresh pattern set on mount (per team, never repeated)
  useEffect(() => {
    setPatterns(generatePatternSet(teamName || 'squad'));
  }, [teamName]);

  // ── Reveal: cells light up one after another, then the grid vanishes ───────
  useEffect(() => {
    if (stage !== 'reveal' || !pattern) return;

    setRevealCount(0);
    setTimeLeft(REVEAL_SECONDS);

    const cellTimers = pattern.sequence.map((_, idx) =>
      window.setTimeout(() => setRevealCount(idx + 1), 240 + idx * REVEAL_STAGGER_MS)
    );
    const countdown = window.setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    const finish = window.setTimeout(() => setStage('ready'), REVEAL_SECONDS * 1000);

    return () => {
      cellTimers.forEach(window.clearTimeout);
      window.clearInterval(countdown);
      window.clearTimeout(finish);
    };
  }, [stage, index, pattern]);

  // The clock only starts once the player commits to rebuilding — setting the
  // remaining time in the same render keeps the countdown from evaluating a grid
  // with a stale zero left over from the previous pattern.
  const beginInput = useCallback(() => {
    setSelected([]);
    setTimeLeft(INPUT_SECONDS);
    setStage('input');
  }, []);

  const evaluate = useCallback(() => {
    if (!pattern) return;
    const correctCells = countCorrectCells(pattern.cells, selected);
    const perfect = correctCells === PATTERN_LIT_CELLS;
    const points = correctCells * POINTS_PER_BOX + (perfect ? PERFECT_BONUS : 0);

    setResults(prev => [...prev, { correctCells, points, perfect }]);
    setStage('result');

    if (perfect) soundFx.playSuccessTone();
    else if (correctCells > 0) soundFx.playNodeSnap();
    else soundFx.playErrorTone();
  }, [pattern, selected]);

  // Countdown for the input stage, evaluated once it hits zero
  useEffect(() => {
    if (stage !== 'input') return;
    if (timeLeft <= 0) {
      evaluate();
      return;
    }
    if (timeLeft <= 3) soundFx.playCountdownTick();
    const id = window.setTimeout(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [stage, timeLeft, evaluate]);

  const openNext = () => {
    if (index + 1 >= patterns.length) {
      setStage('summary');
      return;
    }
    setIndex(i => i + 1);
    setSelected([]);
    setRevealCount(0);
    setTimeLeft(REVEAL_SECONDS);
    setStage('reveal');
  };

  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
  const totalCorrectBoxes = results.reduce((sum, r) => sum + r.correctCells, 0);
  const perfectCount = results.filter(r => r.perfect).length;

  const finishRound = () => {
    if (savedRef.current) return;
    savedRef.current = true;
    setSaving(true);
    completePatternEvent(totalPoints, totalCorrectBoxes, PATTERN_COUNT * PATTERN_LIT_CELLS);
  };

  const toggleCell = (cell: number) => {
    if (stage !== 'input') return;
    soundFx.playNodeSnap();
    setSelected(prev => (prev.includes(cell) ? prev.filter(c => c !== cell) : [...prev, cell]));
  };

  const currentResult = results[index];
  const timerTotal = stage === 'reveal' ? REVEAL_SECONDS : INPUT_SECONDS;
  const timerPct = Math.max(0, Math.min(100, (timeLeft / timerTotal) * 100));
  const isUrgent = stage === 'input' && timeLeft <= 3;

  if (!pattern) {
    return (
      <div className="flex items-center justify-center text-slate-400 font-mono text-sm">
        Generating star maps…
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-2xl max-h-[94vh] overflow-y-auto rounded-2xl bg-space-900/92 border border-fuchsia-500/40 p-5 md:p-7 shadow-[0_0_70px_rgba(217,70,239,0.22)] flex flex-col gap-4 backdrop-blur-xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-[0_0_15px_rgba(217,70,239,0.25)]">
          <Grid3x3 className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg md:text-xl font-orbit font-extrabold text-slate-100 tracking-wide">
            PATTERN RECOGNITION
          </h2>
          <span className="text-[11px] text-slate-400 font-mono tracking-wider uppercase">
            Round 02 • Squad {teamName}
          </span>
        </div>
      </div>

      {/* Pips */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: PATTERN_COUNT }, (_, i) => {
          const done = i < results.length;
          const active = i === index && stage !== 'summary';
          return (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                done
                  ? results[i]?.perfect
                    ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                    : 'bg-fuchsia-400/70'
                  : active
                  ? 'bg-cyan-400'
                  : 'bg-space-800'
              }`}
            />
          );
        })}
        <span className="ml-1 text-[10px] font-mono text-slate-500 tabular-nums shrink-0">
          {Math.min(stage === 'summary' ? PATTERN_COUNT : index + 1, PATTERN_COUNT)}/{PATTERN_COUNT}
        </span>
      </div>

      {/* Status banner */}
      <div
        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors duration-300 ${
          isUrgent
            ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            : 'bg-space-950/70 border-fuchsia-500/25 text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 text-xs md:text-sm font-orbit font-bold uppercase tracking-wide">
          {stage === 'reveal' && (
            <>
              <Eye className="w-4 h-4 text-fuchsia-300 shrink-0" />
              Memorise the pattern #{index + 1}
            </>
          )}
          {stage === 'ready' && (
            <>
              <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
              Pattern #{index + 1} hidden — ready to rebuild
            </>
          )}
          {stage === 'input' && (
            <>
              <Pencil className="w-4 h-4 text-cyan-300 shrink-0" />
              Rebuild the grid — tap the boxes
            </>
          )}
          {stage === 'result' && (
            <>
              {currentResult?.perfect ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-300 shrink-0" />
              )}
              Pattern #{index + 1} scored {currentResult?.points ?? 0} pts
            </>
          )}
          {stage === 'summary' && (
            <>
              <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
              Round 02 complete — {totalPoints} pts
            </>
          )}
        </div>

        {(stage === 'reveal' || stage === 'input') && (
          <div className="flex items-center gap-1.5 font-mono text-sm md:text-base font-bold tabular-nums shrink-0">
            <Timer className="w-4 h-4" />
            {String(timeLeft).padStart(2, '0')}s
          </div>
        )}
      </div>

      {(stage === 'reveal' || stage === 'input') && (
        <div className="w-full h-1.5 rounded-full bg-space-950 border border-cyan-500/20 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isUrgent ? 'bg-rose-500' : 'bg-gradient-to-r from-fuchsia-500 to-cyan-400'
            }`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      )}

      {/* Stage body */}
      <div className="w-full max-w-[420px] mx-auto">
        {stage === 'reveal' && (
          <div className="animate-fade-in">
            <PatternGrid
              lit={pattern.cells}
              order={pattern.sequence}
              revealCount={revealCount}
              accent="fuchsia"
            />
            <p className="mt-2 text-center text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Cells appear one by one • {PATTERN_LIT_CELLS} boxes lit
            </p>
          </div>
        )}

        {stage === 'ready' && (
          <div className="animate-fade-in flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <Lock className="w-7 h-7" />
            </div>
            <div className="text-center flex flex-col gap-1">
              <span className="font-orbit font-bold text-slate-100">Pattern #{index + 1} locked away</span>
              <span className="text-xs text-slate-400 max-w-sm">
                You get <strong className="text-cyan-300">15 seconds</strong> on an empty grid. Tap the boxes that were
                lit, then lock in ({PATTERN_LIT_CELLS} boxes were lit).
              </span>
            </div>
            <button
              type="button"
              data-testid="pattern-begin-input"
              onClick={beginInput}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all duration-200 shadow-[0_0_25px_rgba(0,243,255,0.3)] cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              Reconstruct the pattern
            </button>
          </div>
        )}

        {stage === 'input' && (
          <div className="animate-fade-in flex flex-col gap-2">
            <PatternGrid lit={[]} selected={selected} interactive onToggle={toggleCell} accent="cyan" />
            <span className="text-center text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {selected.length}/{PATTERN_LIT_CELLS} boxes selected
            </span>
          </div>
        )}

        {stage === 'result' && (
          <div
            className={`animate-fade-in rounded-xl border p-3.5 flex flex-col gap-2.5 ${
              currentResult?.perfect
                ? 'border-emerald-500/50 bg-emerald-950/25'
                : 'border-amber-500/40 bg-amber-950/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`font-orbit font-bold text-sm uppercase tracking-wider ${
                  currentResult?.perfect ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {currentResult?.perfect ? 'Perfect reconstruction' : `${currentResult?.correctCells}/${PATTERN_LIT_CELLS} boxes correct`}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                +{currentResult?.points ?? 0} pts
              </span>
            </div>

            <PatternGrid
              lit={pattern.cells}
              answer={pattern.cells}
              selected={selected}
              showVerdicts
              accent="fuchsia"
            />

            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-400/70" /> matched</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/70" /> wrong box</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded ring-1 ring-amber-300/70 bg-space-950" /> missed</span>
            </div>
          </div>
        )}

        {stage === 'summary' && (
          <div className="animate-fade-in flex flex-col gap-3">
            <div className="flex flex-col items-center gap-1 py-1">
              <Trophy className="w-9 h-9 text-amber-300" />
              <span className="font-orbit font-black text-3xl text-slate-100 tabular-nums">{totalPoints}</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                Round 02 points
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-space-950/70 border border-cyan-500/25">
                <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Boxes</div>
                <div className="font-mono text-lg font-bold text-cyan-300">
                  {totalCorrectBoxes}/{PATTERN_COUNT * PATTERN_LIT_CELLS}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-space-950/70 border border-emerald-500/25">
                <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Perfect</div>
                <div className="font-mono text-lg font-bold text-emerald-300">{perfectCount}/{PATTERN_COUNT}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-space-950/70 border border-amber-500/25">
                <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Bonus</div>
                <div className="font-mono text-lg font-bold text-amber-300">{perfectCount * PERFECT_BONUS}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {results.map((r, i) => (
                <span
                  key={i}
                  className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1 text-[10px] font-mono border ${
                    r.perfect
                      ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                      : r.correctCells > 0
                      ? 'bg-fuchsia-950/40 border-fuchsia-500/40 text-fuchsia-200'
                      : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {r.perfect && <Star className="w-3 h-3" />}
                  {r.points}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {stage === 'input' && (
        <button
          type="button"
          data-testid="pattern-lock"
          onClick={evaluate}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-200 shadow-[0_0_24px_rgba(0,243,255,0.3)] cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5" />
          Lock in pattern ({selected.length}/{PATTERN_LIT_CELLS})
        </button>
      )}

      {stage === 'result' && (
        <button
          type="button"
          data-testid="pattern-open-next"
          onClick={openNext}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-200 shadow-[0_0_24px_rgba(217,70,239,0.3)] cursor-pointer"
        >
          {index + 1 >= PATTERN_COUNT ? (
            <>
              <Trophy className="w-3.5 h-3.5" />
              See round summary
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              Open pattern #{index + 2}
              <ChevronRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}

      {stage === 'summary' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            data-testid="pattern-continue"
            onClick={finishRound}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-200 shadow-[0_0_24px_rgba(217,70,239,0.35)] cursor-pointer disabled:opacity-60"
          >
            <Trophy className="w-3.5 h-3.5" />
            Save score & return to cards
          </button>
        </div>
      )}

      <p className="text-center text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
        <ArrowLeft className="w-3 h-3" />
        Each grid is scored on its own: 100 pts per correct box, +100 for a perfect grid.
      </p>
    </div>
  );
};
