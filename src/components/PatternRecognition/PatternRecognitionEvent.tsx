// Avartan Event: Pattern Recognition
//
// Five patterns are revealed one after another — the first is hidden before the
// second appears, and so on. The player then rebuilds them in the same order.
// The final round is a constellation match: memorise a star figure, then pick
// the same figure from four candidates.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { soundFx } from '../../utils/audio';
import {
  Grid3x3,
  Timer,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  X,
  Eye,
  Pencil,
  Satellite,
  Orbit,
  Sparkles,
  Star,
  Rocket,
  ChevronRight,
  Lock
} from 'lucide-react';

const GRID_SIZE = 5;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;
const STARS_PER_PATTERN = 9;
const TOTAL_ROUNDS = 5;
const MEMORIZE_MS = 2300;
const GRID_INPUT_SECONDS = 12;
const CONSTELLATION_INPUT_SECONDS = 15;
const FEEDBACK_MS = 1400;
const BEST_SCORE_KEY = 'avartan_pattern_recognition_best';

type Stage = 'memorize' | 'input' | 'feedback' | 'summary';

type ConstellationId = 'orion' | 'cassiopeia' | 'cygnus' | 'lyra' | 'scorpius' | 'ursa' | 'leo';

interface Constellation {
  id: ConstellationId;
  name: string;
  cells: number[];
  lines: Array<[number, number]>;
}

type Pattern =
  | { kind: 'grid'; cells: number[] }
  | { kind: 'constellation'; constellation: ConstellationId };

// Star figures laid out on the same 5×5 lattice the grid rounds use.
const CONSTELLATIONS: Constellation[] = [
  {
    id: 'orion',
    name: 'The Hunter',
    cells: [1, 3, 6, 11, 12, 13, 21, 23],
    lines: [[1, 6], [3, 6], [1, 11], [3, 13], [11, 12], [12, 13], [11, 21], [13, 23]]
  },
  {
    id: 'cassiopeia',
    name: 'The Queen',
    cells: [0, 5, 9, 13, 18],
    lines: [[0, 5], [5, 9], [9, 13], [13, 18]]
  },
  {
    id: 'cygnus',
    name: 'The Swan',
    cells: [2, 7, 11, 12, 13, 17, 22],
    lines: [[2, 12], [7, 12], [11, 12], [13, 12], [17, 12], [22, 12]]
  },
  {
    id: 'lyra',
    name: 'The Lyre',
    cells: [1, 5, 6, 7, 11, 16],
    lines: [[1, 6], [5, 6], [7, 6], [6, 11], [11, 16]]
  },
  {
    id: 'scorpius',
    name: 'The Scorpion',
    cells: [1, 6, 7, 12, 17, 22, 23, 24],
    lines: [[1, 6], [6, 7], [7, 12], [12, 17], [17, 22], [22, 23], [23, 24]]
  },
  {
    id: 'ursa',
    name: 'The Great Bear',
    cells: [1, 6, 11, 12, 13, 18, 23],
    lines: [[1, 6], [6, 11], [11, 12], [12, 13], [13, 18], [18, 23]]
  },
  {
    id: 'leo',
    name: 'The Lion',
    cells: [2, 7, 8, 12, 16, 21, 22],
    lines: [[2, 7], [7, 8], [8, 12], [12, 16], [16, 21], [21, 22]]
  }
];

const constellationById = (id: ConstellationId): Constellation =>
  CONSTELLATIONS.find(c => c.id === id) || CONSTELLATIONS[0];

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const createGridPattern = (): number[] => {
  const indices = Array.from({ length: CELL_COUNT }, (_, i) => i);
  return shuffle(indices).slice(0, STARS_PER_PATTERN).sort((a, b) => a - b);
};

const createEventPatterns = (): Pattern[] => {
  const rounds: Pattern[] = [];
  for (let i = 0; i < TOTAL_ROUNDS - 1; i++) {
    rounds.push({ kind: 'grid', cells: createGridPattern() });
  }
  const constellation = CONSTELLATIONS[Math.floor(Math.random() * CONSTELLATIONS.length)];
  rounds.push({ kind: 'constellation', constellation: constellation.id });
  return rounds;
};

const sameSet = (a: number[], b: number[]) =>
  a.length === b.length && [...a].sort((x, y) => x - y).every((value, idx) => value === [...b].sort((x, y) => x - y)[idx]);

const cellCenter = (cell: number): { x: number; y: number } => ({
  x: (cell % GRID_SIZE) + 0.5,
  y: Math.floor(cell / GRID_SIZE) + 0.5
});

const MOTIFS = [Satellite, Orbit, Sparkles, Star];

const MotifIcon: React.FC<{ cell: number; className: string }> = ({ cell, className }) => {
  const Icon = MOTIFS[cell % MOTIFS.length];
  return <Icon className={className} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// Star lattice — the shared visual for memory, input and answer options.
// ─────────────────────────────────────────────────────────────────────────────
interface LatticeProps {
  lit: number[];
  lines?: Array<[number, number]>;
  interactive?: boolean;
  onToggle?: (cell: number) => void;
  onPick?: (cell: number) => void;
  accent?: 'fuchsia' | 'cyan' | 'emerald';
  compact?: boolean;
  dim?: boolean;
}

const StarLattice: React.FC<LatticeProps> = ({
  lit,
  lines,
  interactive = false,
  onToggle,
  onPick,
  accent = 'fuchsia',
  compact = false,
  dim = false
}) => {
  const litSet = useMemo(() => new Set(lit), [lit]);

  const accentClasses =
    accent === 'cyan'
      ? {
          cell: 'border-cyan-400/70 bg-cyan-500/15 shadow-[0_0_18px_rgba(0,243,255,0.35)]',
          glyph: 'text-cyan-200',
          line: '#22d3ee'
        }
      : accent === 'emerald'
      ? {
          cell: 'border-emerald-300/70 bg-emerald-500/20 shadow-[0_0_18px_rgba(16,185,129,0.45)]',
          glyph: 'text-emerald-100',
          line: '#34d399'
        }
      : {
          cell: 'border-fuchsia-300/70 bg-fuchsia-500/20 shadow-[0_0_20px_rgba(217,70,239,0.45)]',
          glyph: 'text-fuchsia-100',
          line: '#e879f9'
        };

  return (
    <div className={`relative w-full ${dim ? 'opacity-70' : ''}`}>
      {/* Constellation connectors — one straight line per pair */}
      {lines && lines.length > 0 && (
        <svg
          viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {lines.map(([a, b], idx) => {
            const start = cellCenter(a);
            const end = cellCenter(b);
            return (
              <line
                key={`${a}-${b}-${idx}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={accentClasses.line}
                strokeWidth={0.035}
                strokeOpacity={0.55}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-opacity 400ms ease',
                  animation: `patternLine 520ms ${idx * 40}ms ease-out both`
                }}
              />
            );
          })}
        </svg>
      )}

      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: CELL_COUNT }, (_, cell) => {
          const isLit = litSet.has(cell);
          return (
            <div key={cell} className={compact ? 'p-[3px]' : 'p-1 md:p-1.5'}>
              <button
                type="button"
                data-testid={`pattern-cell-${cell}`}
                onClick={() => {
                  if (!interactive) return;
                  soundFx.playNodeSnap();
                  onToggle ? onToggle(cell) : onPick?.(cell);
                }}
                disabled={!interactive}
                aria-label={`Grid node ${cell + 1}`}
                className={`relative w-full aspect-square rounded-lg border flex items-center justify-center overflow-hidden ${
                  compact ? '' : 'transition-all duration-300 ease-out'
                } ${
                  isLit
                    ? `${accentClasses.cell} ${compact ? '' : 'scale-100'}`
                    : `border-space-700/60 bg-space-950/80 ${
                        interactive ? 'hover:border-cyan-400/60 hover:bg-cyan-950/30 cursor-pointer' : ''
                      }`
                }`}
                style={
                  isLit && !compact
                    ? { animation: `starReveal 360ms ${cell * 12}ms cubic-bezier(0.16, 1, 0.3, 1) both` }
                    : undefined
                }
              >
                {/* Faint starfield inside every node */}
                <span className="absolute w-[2px] h-[2px] rounded-full bg-white/25 top-1 left-1" />
                <span className="absolute w-[1.5px] h-[1.5px] rounded-full bg-white/20 bottom-1 right-1.5" />

                {isLit && (
                  <>
                    <span className="absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.28),transparent_70%)]" />
                    <MotifIcon
                      cell={cell}
                      className={`relative ${compact ? 'w-3 h-3' : 'w-4 h-4 md:w-5 md:h-5'} ${accentClasses.glyph} drop-shadow-[0_0_6px_currentColor]`}
                    />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const PatternRecognitionEvent: React.FC = () => {
  const {
    showPatternEvent,
    setShowPatternEvent,
    teamName,
    completePatternEvent
  } = useGame();

  const [stage, setStage] = useState<Stage>('memorize');
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [memorizeIdx, setMemorizeIdx] = useState<number>(0);
  const [inputIdx, setInputIdx] = useState<number>(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [choice, setChoice] = useState<ConstellationId | null>(null);
  const [options, setOptions] = useState<ConstellationId[]>([]);
  const [results, setResults] = useState<boolean[]>([]);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(GRID_INPUT_SECONDS);
  const [bestScore, setBestScore] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const finishedRef = useRef(false);
  const bestScoreKey = `${BEST_SCORE_KEY}:${teamName}`;

  const startEvent = useCallback(() => {
    const next = createEventPatterns();
    setPatterns(next);
    setMemorizeIdx(0);
    setInputIdx(0);
    setSelected([]);
    setChoice(null);
    setOptions([]);
    setResults([]);
    setLastCorrect(null);
    setTimeLeft(GRID_INPUT_SECONDS);
    setStage('memorize');
    setSubmitting(false);
    finishedRef.current = false;
  }, []);

  // A fresh event every time the stage opens
  useEffect(() => {
    if (!showPatternEvent) return;
    startEvent();
    const saved = parseInt(localStorage.getItem(bestScoreKey) || '0', 10);
    setBestScore(Number.isFinite(saved) ? saved : 0);
  }, [showPatternEvent, startEvent, bestScoreKey]);

  const current = patterns[inputIdx];
  const isConstellationRound = current?.kind === 'constellation';
  const activePattern = patterns[memorizeIdx];

  const secondsFor = (pattern: Pattern | undefined) =>
    pattern?.kind === 'constellation' ? CONSTELLATION_INPUT_SECONDS : GRID_INPUT_SECONDS;

  // Build the four answer options once the constellation round begins
  useEffect(() => {
    if (!showPatternEvent || !current || current.kind !== 'constellation') return;
    const target = current.constellation;
    const others = shuffle(CONSTELLATIONS.filter(c => c.id !== target).map(c => c.id)).slice(0, 3);
    setOptions(shuffle([target, ...others]));
    setChoice(null);
    setTimeLeft(CONSTELLATION_INPUT_SECONDS);
  }, [showPatternEvent, current]);

  // ── Memorise: reveal each pattern in turn, hiding the previous one ─────────
  useEffect(() => {
    if (!showPatternEvent || stage !== 'memorize') return;

    if (memorizeIdx >= patterns.length) {
      if (patterns.length > 0) {
        setStage('input');
        setInputIdx(0);
        setTimeLeft(secondsFor(patterns[0]));
      }
      return;
    }

    const id = window.setTimeout(() => setMemorizeIdx(idx => idx + 1), MEMORIZE_MS);
    return () => window.clearTimeout(id);
  }, [showPatternEvent, stage, memorizeIdx, patterns]);

  const evaluateStep = useCallback(() => {
    if (!current) return;
    const correct =
      current.kind === 'grid'
        ? sameSet(selected, current.cells)
        : choice === current.constellation;

    setResults(prev => [...prev, correct]);
    setLastCorrect(correct);
    setStage('feedback');
    if (correct) soundFx.playSuccessTone();
    else soundFx.playErrorTone();
  }, [current, selected, choice]);

  // Keep the latest evaluator in a ref so ticking does not restart on cell taps
  const evaluateRef = useRef(evaluateStep);
  useEffect(() => {
    evaluateRef.current = evaluateStep;
  }, [evaluateStep]);

  // ── Input countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showPatternEvent || stage !== 'input') return;
    if (timeLeft <= 0) {
      evaluateRef.current();
      return;
    }
    if (timeLeft <= 3) soundFx.playCountdownTick();
    const id = window.setTimeout(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [showPatternEvent, stage, timeLeft]);

  // ── Feedback: brief verdict, then the next pattern in sequence ─────────────
  useEffect(() => {
    if (!showPatternEvent || stage !== 'feedback') return;
    const id = window.setTimeout(() => {
      const nextIdx = inputIdx + 1;
      if (nextIdx >= patterns.length) {
        setStage('summary');
        return;
      }
      setInputIdx(nextIdx);
      setSelected([]);
      setChoice(null);
      setLastCorrect(null);
      setTimeLeft(secondsFor(patterns[nextIdx]));
      setStage('input');
    }, FEEDBACK_MS);
    return () => window.clearTimeout(id);
  }, [showPatternEvent, stage, inputIdx, patterns]);

  const correctCount = results.filter(Boolean).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  const points = correctCount * 120 + (results.length === TOTAL_ROUNDS && correctCount === TOTAL_ROUNDS ? 100 : 0);

  useEffect(() => {
    if (stage !== 'summary') return;
    if (accuracy > bestScore) {
      setBestScore(accuracy);
      try {
        localStorage.setItem(bestScoreKey, String(accuracy));
      } catch {
        // Storage is optional; the score still counts for the team record.
      }
    }
  }, [stage, accuracy, bestScore, bestScoreKey]);

  const finishEvent = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setSubmitting(true);
    completePatternEvent(correctCount, TOTAL_ROUNDS);
  }, [completePatternEvent, correctCount]);

  const toggleCell = (cell: number) => {
    if (stage !== 'input' || isConstellationRound) return;
    setSelected(prev =>
      prev.includes(cell) ? prev.filter(c => c !== cell) : [...prev, cell]
    );
  };

  if (!showPatternEvent) return null;

  const timerTotal = isConstellationRound ? CONSTELLATION_INPUT_SECONDS : GRID_INPUT_SECONDS;
  const timerPct = Math.max(0, Math.min(100, (timeLeft / timerTotal) * 100));
  const isUrgent = stage === 'input' && timeLeft <= 3;
  const targetConstellation = current?.kind === 'constellation' ? constellationById(current.constellation) : null;
  const memorizeConstellation = activePattern?.kind === 'constellation'
    ? constellationById(activePattern.constellation)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-space-950/45 animate-fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-2xl bg-space-900/95 border border-fuchsia-500/40 p-5 md:p-7 shadow-[0_0_60px_rgba(217,70,239,0.25)] flex flex-col gap-4 max-h-[94vh] overflow-y-auto">

        {/* End event */}
        <button
          onClick={finishEvent}
          disabled={submitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-space-800 transition-all duration-200 cursor-pointer disabled:opacity-40"
          title="End event and save score"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-10">
          <div className="p-2.5 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-[0_0_15px_rgba(217,70,239,0.25)]">
            <Grid3x3 className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg md:text-xl font-orbit font-extrabold text-slate-100 tracking-wide">
              PATTERN RECOGNITION
            </h2>
            <span className="text-[11px] text-slate-400 font-mono tracking-wider uppercase">
              Round 2 • Deep-Space Memory Protocol • Team {teamName}
            </span>
          </div>
        </div>

        {/* Round pips */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
            const done = i < results.length;
            const active = stage !== 'summary' && i === (stage === 'memorize' ? memorizeIdx : inputIdx);
            return (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  done
                    ? results[i]
                      ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                      : 'bg-rose-500/80'
                    : active
                    ? 'bg-fuchsia-400/80'
                    : 'bg-space-800'
                }`}
              />
            );
          })}
          <span className="ml-1 text-[10px] font-mono text-slate-500 tabular-nums shrink-0">
            {Math.min(results.length + (stage === 'summary' ? 0 : 1), TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
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
            {stage === 'memorize' && (
              <>
                <Eye className="w-4 h-4 text-fuchsia-300 shrink-0" />
                {memorizeConstellation ? 'Memorise the constellation' : 'Memorise the star pattern'}
              </>
            )}
            {stage === 'input' && (
              <>
                <Pencil className="w-4 h-4 text-cyan-300 shrink-0" />
                {isConstellationRound ? 'Match the constellation you saw' : 'Rebuild the star pattern'}
              </>
            )}
            {stage === 'feedback' && (
              <>
                {lastCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-300 shrink-0" />
                )}
                {lastCorrect ? 'Pattern confirmed' : 'Pattern mismatch'}
              </>
            )}
            {stage === 'summary' && (
              <>
                <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
                Sequence complete — {correctCount}/{TOTAL_ROUNDS} patterns
              </>
            )}
          </div>

          {(stage === 'memorize' || stage === 'input') && (
            <div className="flex items-center gap-1.5 font-mono text-sm md:text-base font-bold tabular-nums shrink-0">
              <Timer className="w-4 h-4" />
              {stage === 'memorize'
                ? `${memorizeIdx + 1}/${TOTAL_ROUNDS}`
                : `${String(timeLeft).padStart(2, '0')}s`}
            </div>
          )}
        </div>

        {(stage === 'memorize' || stage === 'input') && (
          <div className="w-full h-1.5 rounded-full bg-space-950 border border-cyan-500/20 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                isUrgent ? 'bg-rose-500' : 'bg-gradient-to-r from-fuchsia-500 to-cyan-400'
              }`}
              style={{ width: `${stage === 'memorize' ? 100 : timerPct}%` }}
            />
          </div>
        )}

        {/* Main stage */}
        <div className="relative w-full max-w-[420px] mx-auto">
          {stage === 'memorize' && activePattern && (
            <div key={`memorize-${memorizeIdx}`} className="animate-fade-in">
              <StarLattice
                lit={activePattern.kind === 'grid' ? activePattern.cells : memorizeConstellation!.cells}
                lines={activePattern.kind === 'constellation' ? memorizeConstellation!.lines : undefined}
                accent="fuchsia"
              />
            </div>
          )}

          {stage === 'input' && current && current.kind === 'grid' && (
            <StarLattice lit={selected} accent="cyan" interactive onToggle={toggleCell} />
          )}

          {stage === 'input' && isConstellationRound && targetConstellation && (
            <div className="grid grid-cols-2 gap-2.5">
              {options.map(id => {
                const constellation = constellationById(id);
                const isChosen = choice === id;
                return (
                  <button
                    key={id}
                    type="button"
                    data-testid={`constellation-option-${id}`}
                    onClick={() => {
                      soundFx.playNodeSnap();
                      setChoice(id);
                    }}
                    className={`p-2 rounded-xl border transition-all duration-300 ease-out ${
                      isChosen
                        ? 'border-cyan-300 bg-cyan-500/15 shadow-[0_0_22px_rgba(0,243,255,0.35)] scale-[1.01]'
                        : 'border-cyan-500/20 bg-space-950/70 hover:border-cyan-400/50'
                    }`}
                    aria-label={`Constellation option ${id}`}
                  >
                    <StarLattice lit={constellation.cells} accent={isChosen ? 'cyan' : 'fuchsia'} compact dim={!isChosen} />
                  </button>
                );
              })}
            </div>
          )}

          {stage === 'feedback' && current && (
            <div
              className={`animate-fade-in rounded-xl border p-4 flex flex-col gap-3 ${
                lastCorrect ? 'border-emerald-500/50 bg-emerald-950/30' : 'border-rose-500/50 bg-rose-950/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-orbit font-bold text-sm uppercase tracking-wider ${
                  lastCorrect ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {lastCorrect ? 'Captured' : 'Sequence lost'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Pattern {inputIdx + 1}/{TOTAL_ROUNDS}
                </span>
              </div>
              <StarLattice
                lit={current.kind === 'grid' ? current.cells : constellationById(current.constellation).cells}
                lines={current.kind === 'constellation' ? constellationById(current.constellation).lines : undefined}
                accent={lastCorrect ? 'emerald' : 'fuchsia'}
                dim={!lastCorrect}
              />
            </div>
          )}

          {stage === 'summary' && (
            <div className="animate-fade-in flex flex-col gap-3">
              <div className="flex flex-col items-center gap-1 py-2">
                <Trophy className="w-8 h-8 text-amber-300" />
                <span className="font-orbit font-black text-2xl text-slate-100 tabular-nums">
                  {correctCount}/{TOTAL_ROUNDS}
                </span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                  Patterns reconstructed
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-space-950/70 border border-cyan-500/25">
                  <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Accuracy</div>
                  <div className="font-mono text-lg font-bold text-cyan-300">{accuracy}%</div>
                </div>
                <div className="p-2.5 rounded-lg bg-space-950/70 border border-amber-500/25">
                  <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Round 2 pts</div>
                  <div className="font-mono text-lg font-bold text-amber-300">{points}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-space-950/70 border border-fuchsia-500/25">
                  <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Personal best</div>
                  <div className="font-mono text-lg font-bold text-fuchsia-300">{Math.max(bestScore, accuracy)}%</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {results.map((ok, idx) => (
                  <span
                    key={idx}
                    className={`flex-1 h-8 rounded-lg flex items-center justify-center gap-1 text-[10px] font-mono border ${
                      ok
                        ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {idx + 1}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={startEvent}
                  className="px-4 py-2 rounded-xl bg-space-900 border border-cyan-500/30 text-slate-300 hover:border-cyan-400 text-xs font-orbit font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Replay event
                </button>
                <button
                  type="button"
                  data-testid="pattern-continue"
                  onClick={finishEvent}
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-slate-950 text-xs font-orbit font-black uppercase tracking-wider flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all duration-200 shadow-[0_0_20px_rgba(217,70,239,0.35)] cursor-pointer disabled:opacity-60"
                >
                  Save score & continue
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {stage === 'input' && !isConstellationRound && (
          <button
            type="button"
            data-testid="pattern-lock"
            onClick={evaluateStep}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-200 shadow-[0_0_24px_rgba(0,243,255,0.3)] cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            Lock in pattern ({selected.length}/{STARS_PER_PATTERN})
          </button>
        )}

        {stage === 'input' && isConstellationRound && (
          <button
            type="button"
            onClick={evaluateStep}
            disabled={!choice}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-200 shadow-[0_0_24px_rgba(0,243,255,0.3)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Rocket className="w-3.5 h-3.5" />
            Confirm constellation
          </button>
        )}

        {stage === 'memorize' && (
          <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            <Play className="w-3 h-3 text-fuchsia-400" />
            Each pattern is hidden before the next one is revealed
          </div>
        )}
      </div>
    </div>
  );
};
