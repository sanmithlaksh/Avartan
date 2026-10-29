// Void Paradigm — Round 2: Pattern Recognition
//
// Five deep-space charts, one after another. Levels 1-3 are 5×5 planet fields:
// a fixed supply of Mercury, Earth and Jupiter must be rebuilt exactly where they
// appeared. Levels 4-5 are real constellations on an 8×8 star chart, drawn at
// random from the full catalogue. Each grid draws itself first, then holds for
// seven seconds, then the player rebuilds it in thirty.
// Scoring is 100 pts per perfectly rebuilt token plus a 100 pt perfect bonus.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  PATTERN_COUNT,
  PLANET_LABELS,
  PatternItemId,
  PatternPlacement,
  PatternSpec,
  PaletteEntry,
  countCorrectCells,
  generatePatternSet,
  totalPatternCells
} from '../../engine/patterns';
import { PlanetGlyph } from './PlanetGlyph';
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
  Star,
  MousePointerClick,
  Layers,
  Target
} from 'lucide-react';

const REVEAL_SECONDS = 7;
const INPUT_SECONDS = 30;
const REVEAL_STAGGER_MS = 420;
// The pattern finishes drawing before the memorise clock starts, so players get
// the full seven seconds with the complete chart on screen.
const DRAW_START_DELAY_MS = 220;
const DRAW_HOLD_MS = 650;
const POINTS_PER_BOX = 100;
const PERFECT_BONUS = 100;

type Stage = 'reveal' | 'ready' | 'input' | 'result' | 'summary';

interface PatternResult {
  correctCells: number;
  totalCells: number;
  points: number;
  perfect: boolean;
}

const itemLabel = (item: PatternItemId) => (item === 'star' ? 'Star' : PLANET_LABELS[item]);

const PaletteTray: React.FC<{
  entries: PaletteEntry[];
  remaining: Map<PatternItemId, number>;
  selected: PatternItemId | null;
  disabled: boolean;
  onSelect: (item: PatternItemId) => void;
}> = ({ entries, remaining, selected, disabled, onSelect }) => (
  <div className="flex flex-col gap-2 w-full">
    {entries.map(entry => {
      const left = remaining.get(entry.id) ?? 0;
      const empty = left <= 0;
      const active = selected === entry.id;
      return (
        <button
          key={entry.id}
          type="button"
          data-testid={`pattern-palette-${entry.id}`}
          onClick={() => onSelect(entry.id)}
          disabled={disabled || empty}
          aria-pressed={active}
          aria-label={`${itemLabel(entry.id)}, ${left} left`}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl border transition-all duration-200 ${
            active
              ? 'border-cyan-300 bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.35)]'
              : empty
              ? 'border-space-700/60 bg-space-950/50 opacity-45'
              : 'border-white/10 bg-space-950/80 hover:border-cyan-400/60 hover:bg-cyan-950/30'
          } ${disabled || empty ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
        >
          <span className="w-11 h-11 shrink-0">
            <PlanetGlyph item={entry.id} muted={empty} />
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              {itemLabel(entry.id)}
            </span>
            <span
              className={`font-mono text-xl font-bold tabular-nums ${
                empty ? 'text-slate-500' : 'text-cyan-200'
              }`}
            >
              ×{left}
            </span>
          </span>
          {active && <span className="ml-auto text-[9px] font-mono text-cyan-300">SELECTED</span>}
        </button>
      );
    })}
  </div>
);

const PatternGrid: React.FC<{
  pattern: PatternSpec;
  order?: number[];
  revealCount?: number;
  interactive?: boolean;
  picks?: PatternPlacement[];
  onToggle?: (cell: number) => void;
  showVerdicts?: boolean;
  showLinks?: boolean;
}> = ({
  pattern,
  order,
  revealCount,
  interactive = false,
  picks = [],
  onToggle,
  showVerdicts = false,
  showLinks = false
}) => {
  const { gridSize } = pattern;
  const answerMap = useMemo(
    () => new Map(pattern.placements.map(p => [p.cell, p.item])),
    [pattern]
  );
  const pickMap = useMemo(() => new Map(picks.map(p => [p.cell, p.item])), [picks]);
  const revealIndex = useMemo(() => {
    const map = new Map<number, number>();
    (order || pattern.sequence).forEach((cell, idx) => map.set(cell, idx));
    return map;
  }, [order, pattern]);

  const isRevealed = (cell: number) => {
    if (revealCount === undefined) return true;
    const idx = revealIndex.get(cell);
    return idx !== undefined && idx < revealCount;
  };

  const centerOf = (cell: number): [number, number] => {
    const col = cell % gridSize;
    const row = Math.floor(cell / gridSize);
    return [((col + 0.5) / gridSize) * 100, ((row + 0.5) / gridSize) * 100];
  };

  return (
    <div className="relative w-full">
      {showLinks && pattern.links.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {pattern.links.map(([a, b], idx) => {
            const [x1, y1] = centerOf(a);
            const [x2, y2] = centerOf(b);
            const visible = isRevealed(a) && isRevealed(b);
            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(186,230,253,0.6)"
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeDasharray="2 1.4"
                style={{ opacity: visible ? 1 : 0, transition: 'opacity 400ms ease-out' }}
              />
            );
          })}
        </svg>
      )}

      <div
        className="relative grid w-full"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gap: pattern.type === 'constellation' ? 4 : 6
        }}
      >
        {Array.from({ length: gridSize * gridSize }, (_, cell) => {
          const answerItem = answerMap.get(cell);
          const pickedItem = pickMap.get(cell);
          // Answer glyphs only belong on screen during the reveal — once the
          // grid is hidden the player rebuilds from memory.
          const revealing = revealCount !== undefined && !showVerdicts;
          const revealed = revealing && answerItem !== undefined && isRevealed(cell);

          const verdictCorrect = showVerdicts && !!pickedItem && pickedItem === answerItem;
          const verdictWrong =
            showVerdicts && !!pickedItem && (answerItem === undefined || pickedItem !== answerItem);
          const verdictMissed = showVerdicts && !pickedItem && answerItem !== undefined;

          const showItem =
            pickedItem ??
            (showVerdicts && verdictMissed ? answerItem : undefined) ??
            (revealed ? answerItem : undefined);

          const litLook = verdictCorrect
            ? 'border-emerald-400/80 bg-emerald-500/15 shadow-[0_0_16px_rgba(16,185,129,0.35)]'
            : verdictWrong
            ? 'border-rose-400/80 bg-rose-500/15 shadow-[0_0_14px_rgba(244,63,94,0.28)]'
            : verdictMissed
            ? 'border-amber-300/60 border-dashed bg-amber-500/10'
            : pickedItem
            ? 'border-cyan-300/80 bg-cyan-500/15 shadow-[0_0_14px_rgba(34,211,238,0.3)]'
            : revealed
            ? 'border-fuchsia-300/70 bg-fuchsia-500/20 shadow-[0_0_16px_rgba(217,70,239,0.3)]'
            : pattern.type === 'constellation'
            ? 'border-white/5 bg-space-950/45'
            : 'border-space-700/60 bg-space-950/80';

          return (
            <button
              key={cell}
              type="button"
              data-testid={`pattern-cell-${cell}`}
              disabled={!interactive}
              onClick={() => interactive && onToggle?.(cell)}
              aria-label={
                showItem ? `Grid node ${cell + 1}, ${itemLabel(showItem)}` : `Grid node ${cell + 1}`
              }
              className={`relative aspect-square rounded-lg border transition-all duration-300 ease-out flex items-center justify-center ${
                showItem || revealed ? 'scale-100' : 'scale-[0.96]'
              } ${litLook} ${
                interactive
                  ? 'cursor-pointer hover:border-cyan-400/80 hover:bg-cyan-950/40 active:scale-95'
                  : 'cursor-default'
              }`}
              style={{
                animation:
                  revealed && revealCount !== undefined ? 'starReveal 320ms ease-out both' : undefined
              }}
            >
              {showItem && (
                <span
                  className={`w-[82%] h-[82%] flex items-center justify-center ${
                    verdictMissed ? 'opacity-50' : ''
                  }`}
                >
                  <PlanetGlyph item={showItem} />
                </span>
              )}

              {!showItem && interactive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300/25" />
              )}

              {showVerdicts && (verdictCorrect || verdictWrong) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-space-950 border border-white/20 flex items-center justify-center">
                  {verdictCorrect ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  ) : (
                    <XCircle className="w-3 h-3 text-rose-300" />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const PatternRecognitionEvent: React.FC = () => {
  const { teamName, completePatternEvent, isDemoMode } = useGame();

  const [patterns, setPatterns] = useState<PatternSpec[]>([]);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>('reveal');
  const [picks, setPicks] = useState<PatternPlacement[]>([]);
  const [selectedItem, setSelectedItem] = useState<PatternItemId | null>(null);
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

  // Finite supply per planet: palette count minus what is already on the board.
  const remaining = useMemo(() => {
    const map = new Map<PatternItemId, number>();
    pattern?.palette.forEach(entry => map.set(entry.id, entry.count));
    picks.forEach(pick => map.set(pick.item, (map.get(pick.item) ?? 0) - 1));
    // A supply can never be negative, even mid-update.
    map.forEach((count, id) => map.set(id, Math.max(0, count)));
    return map;
  }, [pattern, picks]);

  // Keep a valid planet selected: once the current token runs out, jump to the
  // next chip that still has stock instead of silently ignoring taps.
  useEffect(() => {
    if (stage !== 'input' || !pattern) return;
    if (selectedItem && (remaining.get(selectedItem) ?? 0) > 0) return;
    const next = pattern.palette.find(entry => (remaining.get(entry.id) ?? 0) > 0);
    if ((next?.id ?? null) !== selectedItem) setSelectedItem(next ? next.id : null);
  }, [stage, pattern, selectedItem, remaining]);

  // ── Reveal: tokens light up one after another, then the 7s clock starts ───
  useEffect(() => {
    if (stage !== 'reveal' || !pattern) return;

    setRevealCount(0);
    setTimeLeft(REVEAL_SECONDS);

    const cellTimers = pattern.sequence.map((_, idx) =>
      window.setTimeout(
        () => setRevealCount(idx + 1),
        DRAW_START_DELAY_MS + idx * REVEAL_STAGGER_MS
      )
    );

    const drawMs =
      DRAW_START_DELAY_MS + Math.max(0, pattern.sequence.length - 1) * REVEAL_STAGGER_MS;
    const clockStart = drawMs + DRAW_HOLD_MS;

    let countdown: number | undefined;
    const startClock = window.setTimeout(() => {
      countdown = window.setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }, clockStart);
    const finish = window.setTimeout(
      () => setStage('ready'),
      clockStart + REVEAL_SECONDS * 1000
    );

    return () => {
      cellTimers.forEach(window.clearTimeout);
      window.clearTimeout(startClock);
      if (countdown !== undefined) window.clearInterval(countdown);
      window.clearTimeout(finish);
    };
  }, [stage, index, pattern]);

  // The clock only starts once the player commits to rebuilding — setting the
  // remaining time in the same render keeps the countdown from evaluating a grid
  // with a stale zero left over from the previous pattern.
  const beginInput = useCallback(() => {
    if (!pattern) return;
    setPicks([]);
    setTimeLeft(INPUT_SECONDS);
    setStage('input');
    setSelectedItem(pattern.palette[0]?.id ?? null);
  }, [pattern]);

  const evaluate = useCallback(() => {
    if (!pattern) return;
    const correctCells = countCorrectCells(pattern.placements, picks);
    const perfect =
      correctCells === pattern.cells.length && picks.length === pattern.cells.length;
    const points = correctCells * POINTS_PER_BOX + (perfect ? PERFECT_BONUS : 0);

    setResults(prev => [...prev, { correctCells, totalCells: pattern.cells.length, points, perfect }]);
    setStage('result');

    if (perfect) soundFx.playSuccessTone();
    else if (correctCells > 0) soundFx.playNodeSnap();
    else soundFx.playErrorTone();
  }, [pattern, picks]);

  // Kept in a ref so placing planets never resets the countdown tick.
  const evaluateRef = useRef(evaluate);
  useEffect(() => {
    evaluateRef.current = evaluate;
  }, [evaluate]);

  // Countdown for the input stage, evaluated once it hits zero
  useEffect(() => {
    if (stage !== 'input') return;
    if (timeLeft <= 0) {
      evaluateRef.current();
      return;
    }
    if (timeLeft <= 3) soundFx.playCountdownTick();
    const id = window.setTimeout(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [stage, timeLeft]);

  const openNext = () => {
    if (index + 1 >= patterns.length) {
      setStage('summary');
      return;
    }
    setIndex(i => i + 1);
    setPicks([]);
    setSelectedItem(null);
    setRevealCount(0);
    setTimeLeft(REVEAL_SECONDS);
    setStage('reveal');
  };

  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
  const totalCorrectBoxes = results.reduce((sum, r) => sum + r.correctCells, 0);
  const perfectCount = results.filter(r => r.perfect).length;
  const possibleCells = useMemo(
    () => (patterns.length > 0 ? totalPatternCells(patterns) : 0),
    [patterns]
  );

  const finishRound = () => {
    if (savedRef.current) return;
    savedRef.current = true;
    setSaving(true);
    completePatternEvent(totalPoints, totalCorrectBoxes, possibleCells);
  };

  const selectItem = (item: PatternItemId) => {
    if ((remaining.get(item) ?? 0) <= 0) return;
    setSelectedItem(item);
  };

  const toggleCell = (cell: number) => {
    if (stage !== 'input' || !pattern) return;

    const existing = picks.find(p => p.cell === cell);
    if (existing) {
      // Sending a placed token back to the tray restores its count immediately
      // because the tray is derived from `picks`.
      setPicks(prev => prev.filter(p => p.cell !== cell));
      setSelectedItem(prev => prev ?? existing.item);
      soundFx.playNodeSnap();
      return;
    }

    if (!selectedItem) return;
    const supply = pattern.palette.find(entry => entry.id === selectedItem)?.count ?? 0;
    if ((remaining.get(selectedItem) ?? 0) <= 0) return;

    setPicks(prev => {
      // Re-check against the freshest board state so quick taps can never push a
      // planet past its supply.
      if (prev.some(p => p.cell === cell)) return prev;
      const used = prev.filter(p => p.item === selectedItem).length;
      if (used >= supply) return prev;
      return [...prev, { cell, item: selectedItem }];
    });
    soundFx.playNodeSnap();
  };

  const currentResult = results[index];
  const timerTotal = stage === 'reveal' ? REVEAL_SECONDS : INPUT_SECONDS;
  const timerPct = Math.max(0, Math.min(100, (timeLeft / timerTotal) * 100));
  const isUrgent = stage === 'input' && timeLeft <= 5;
  const isConstellation = pattern?.type === 'constellation';
  // While the tokens are still appearing the memorise clock has not started yet.
  const drawing = !!pattern && stage === 'reveal' && revealCount < pattern.cells.length;

  if (!pattern) {
    return (
      <div className="flex items-center justify-center text-slate-400 font-mono text-sm">
        Generating star maps…
      </div>
    );
  }

  const stageTitle =
    stage === 'reveal'
      ? drawing
        ? 'CHART INBOUND'
        : `MEMORISE — ${REVEAL_SECONDS}s`
      : stage === 'ready'
      ? 'CHART HIDDEN'
      : stage === 'input'
      ? isConstellation
        ? `REBUILD ${pattern.name.toUpperCase()}`
        : 'REBUILD THE FIELD'
      : stage === 'result'
      ? currentResult?.perfect
        ? 'PERFECT RECONSTRUCTION'
        : 'CHART SCORED'
      : 'ROUND COMPLETE';

  return (
    <div className="relative z-10 w-full h-full max-w-[1680px] rounded-2xl bg-space-900/97 border border-fuchsia-500/40 shadow-[0_0_70px_rgba(217,70,239,0.22)] flex flex-col overflow-y-auto lg:overflow-hidden animate-fade-in">
      {/* Top bar: identity, chart pips, timer */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-3 border-b border-fuchsia-500/20 bg-space-950/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-[0_0_15px_rgba(217,70,239,0.25)]">
            <Grid3x3 className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-base md:text-lg font-orbit font-extrabold text-slate-100 tracking-wide truncate">
              PATTERN RECOGNITION
            </h2>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase truncate">
              Round 02 • Squad {teamName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 order-3 sm:order-2 w-full sm:w-auto sm:flex-1 sm:max-w-md">
          <div className="flex items-center gap-1.5 flex-1">
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
          </div>
          <span className="text-[10px] font-mono text-slate-500 tabular-nums shrink-0">
            {Math.min(stage === 'summary' ? PATTERN_COUNT : index + 1, PATTERN_COUNT)}/{PATTERN_COUNT}
          </span>
        </div>

        <div className="flex items-center gap-2 order-2 sm:order-3 shrink-0">
          <span
            className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-wider ${
              isConstellation
                ? 'border-sky-400/40 bg-sky-950/50 text-sky-300'
                : 'border-cyan-400/40 bg-cyan-950/50 text-cyan-300'
            }`}
          >
            {isConstellation ? pattern.name : `${pattern.gridSize}×${pattern.gridSize} field`}
          </span>
          {(stage === 'input' || (stage === 'reveal' && !drawing)) && (
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-sm font-bold tabular-nums ${
                isUrgent
                  ? 'border-rose-500/60 bg-rose-950/60 text-rose-300'
                  : 'border-cyan-500/30 bg-space-950/80 text-cyan-200'
              }`}
            >
              <Timer className="w-4 h-4" />
              {String(timeLeft).padStart(2, '0')}s
            </span>
          )}
          {drawing && (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-fuchsia-500/40 bg-fuchsia-950/40 text-fuchsia-200 font-mono text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Revealing
            </span>
          )}
        </div>
      </header>

      {/* Main stage: info rail | board | control rail */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(210px,0.85fr)_minmax(0,2fr)_minmax(240px,1fr)] gap-3 md:gap-4 p-3 md:p-4">
        {/* Left rail — current objective and scoring */}
        <aside className="flex flex-col gap-3 min-h-0">
          <div className="rounded-xl border border-fuchsia-500/25 bg-space-950/65 p-3.5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-fuchsia-300">
              {stage === 'reveal' && <Eye className="w-4 h-4" />}
              {stage === 'ready' && <Lock className="w-4 h-4" />}
              {stage === 'input' && <Pencil className="w-4 h-4" />}
              {stage === 'result' && <Target className="w-4 h-4" />}
              {stage === 'summary' && <Trophy className="w-4 h-4" />}
              {stage === 'summary' ? 'Final result' : `Chart ${index + 1} of ${PATTERN_COUNT}`}
            </div>
            <h3 className="text-lg xl:text-xl font-orbit font-black text-slate-100 leading-tight">
              {stageTitle}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {stage === 'reveal' &&
                (drawing
                  ? 'The chart is drawing itself. The memorise clock starts once every token is visible.'
                  : `Every token is on screen. Hold it in mind — in ${timeLeft}s the chart vanishes.`)}
              {stage === 'ready' &&
                `You get ${INPUT_SECONDS} seconds on the empty grid. Tap a token, then tap a box to place it.`}
              {stage === 'input' &&
                (isConstellation
                  ? `Recreate the ${pattern.cells.length}-star figure. Tap the star chip, then each box where a star sat.`
                  : `Place all ${pattern.cells.length} worlds. Each planet has a limited supply; tap a placed world to return it.`)}
              {stage === 'result' &&
                `${currentResult?.correctCells ?? 0} of ${pattern.cells.length} tokens matched the chart.`}
              {stage === 'summary' &&
                `All ${PATTERN_COUNT} charts rebuilt. ${totalCorrectBoxes} of ${possibleCells} tokens matched.`}
            </p>

            {stage === 'reveal' && (
              <div className="w-full h-1.5 rounded-full bg-space-950 border border-fuchsia-500/20 overflow-hidden mt-1">
                <div
                  className="h-full transition-all duration-1000 ease-linear bg-gradient-to-r from-fuchsia-500 to-cyan-400"
                  style={{ width: `${timerPct}%` }}
                />
              </div>
            )}
            {stage === 'input' && (
              <div className="w-full h-1.5 rounded-full bg-space-950 border border-cyan-500/20 overflow-hidden mt-1">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${
                    isUrgent ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-400 to-fuchsia-500'
                  }`}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
            )}
          </div>

          {/* Scoring legend */}
          <div className="rounded-xl border border-cyan-500/20 bg-space-950/50 p-3 flex flex-col gap-1.5 text-[10px] font-mono text-slate-400">
            <span className="text-[9px] uppercase tracking-widest text-cyan-400">Scoring</span>
            <span>100 pts per correct token</span>
            <span>+100 perfect-chart bonus</span>
            {stage === 'input' && (
              <span className="text-cyan-300 mt-1">
                {picks.length}/{pattern.cells.length} placed
              </span>
            )}
          </div>

          <div className="mt-auto hidden lg:flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-600">
            <Layers className="w-3 h-3" />
            {isDemoMode ? 'Demo session • scores not saved' : 'Tournament chart'}
          </div>
        </aside>

        {/* Centre — the chart itself */}
        <div className="min-h-0 flex flex-col items-center justify-center gap-2">
          <div
            className="w-full max-w-full aspect-square mx-auto"
            style={{ maxWidth: 'min(100%, calc(100dvh - 220px))' }}
          >
            {stage === 'reveal' && (
              <PatternGrid
                pattern={pattern}
                revealCount={revealCount}
                showLinks={isConstellation}
              />
            )}

            {stage === 'input' && (
              <PatternGrid
                pattern={pattern}
                picks={picks}
                interactive
                onToggle={toggleCell}
              />
            )}

            {stage === 'result' && (
              <PatternGrid
                pattern={pattern}
                picks={picks}
                showVerdicts
                showLinks={isConstellation}
              />
            )}

            {stage === 'ready' && (
              <div className="w-full h-full rounded-xl border border-cyan-500/20 bg-space-950/50 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                  <Lock className="w-7 h-7" />
                </div>
                <span className="font-orbit font-bold text-slate-100">
                  {isConstellation ? `${pattern.name} locked away` : `Chart #${index + 1} locked away`}
                </span>
                <span className="text-xs text-slate-400 max-w-xs">
                  {pattern.type === 'constellation'
                    ? `${pattern.cells.length} stars to trace on a fresh chart.`
                    : `${pattern.cells.length} worlds to place from a limited supply.`}
                </span>
              </div>
            )}

            {stage === 'summary' && (
              <div className="w-full h-full rounded-xl border border-amber-500/30 bg-space-950/60 flex flex-col items-center justify-center gap-3 text-center p-6">
                <Trophy className="w-12 h-12 text-amber-300" />
                <span className="font-orbit font-black text-6xl text-slate-100 tabular-nums">
                  {totalPoints}
                </span>
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                  Round 02 points
                </span>
                <div className="grid grid-cols-3 gap-2 w-full max-w-md mt-2 text-center">
                  <div className="p-2.5 rounded-lg bg-space-950/70 border border-cyan-500/25">
                    <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Tokens</div>
                    <div className="font-mono text-lg font-bold text-cyan-300">
                      {totalCorrectBoxes}/{possibleCells}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-space-950/70 border border-emerald-500/25">
                    <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Perfect</div>
                    <div className="font-mono text-lg font-bold text-emerald-300">
                      {perfectCount}/{PATTERN_COUNT}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-space-950/70 border border-amber-500/25">
                    <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">Bonus</div>
                    <div className="font-mono text-lg font-bold text-amber-300">
                      {perfectCount * PERFECT_BONUS}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 w-full max-w-md">
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

          {stage === 'reveal' && (
            <p className="text-center text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {isConstellation
                ? `${pattern.cells.length} stars • real constellation`
                : `${pattern.cells.length} worlds • ${pattern.palette
                    .map(entry => `${itemLabel(entry.id)} ×${entry.count}`)
                    .join(' · ')}`}
            </p>
          )}
        </div>

        {/* Right rail — tokens and the action for this stage */}
        <aside className="flex flex-col gap-2.5 min-h-0">
          {stage === 'ready' && (
            <button
              type="button"
              data-testid="pattern-begin-input"
              onClick={beginInput}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-200 shadow-[0_0_25px_rgba(0,243,255,0.3)] cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              {isConstellation ? 'Trace the constellation' : 'Reconstruct the pattern'}
            </button>
          )}

          {stage === 'input' && (
            <>
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  {isConstellation ? 'Star supply' : 'Planet supply'}
                </span>
                <span className="text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                  <MousePointerClick className="w-3 h-3" />
                  {picks.length}/{pattern.cells.length}
                </span>
              </div>
              <PaletteTray
                entries={pattern.palette}
                remaining={remaining}
                selected={selectedItem}
                disabled={stage !== 'input'}
                onSelect={selectItem}
              />
              <button
                type="button"
                data-testid="pattern-lock"
                onClick={evaluate}
                className="mt-auto w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-200 shadow-[0_0_24px_rgba(0,243,255,0.3)] cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Lock in pattern
              </button>
            </>
          )}

          {stage === 'reveal' && (
            <div className="rounded-xl border border-fuchsia-500/25 bg-space-950/60 p-3.5 flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-fuchsia-300">
                Watch closely
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                {drawing
                  ? 'Tokens are appearing one by one. The clock has not started yet.'
                  : 'The complete chart is on screen. Study positions and token types.'}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <Eye className="w-3.5 h-3.5" /> {pattern.cells.length} tokens
              </div>
            </div>
          )}

          {stage === 'result' && (
            <>
              <div className="rounded-xl border border-cyan-500/25 bg-space-950/60 p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    Score
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    +{currentResult?.points ?? 0}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-400/70" /> matched
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500/70" /> wrong token
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded ring-1 ring-amber-300/70 bg-space-950" /> missed
                  </span>
                </div>
              </div>
              <button
                type="button"
                data-testid="pattern-open-next"
                onClick={openNext}
                className="mt-auto w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-200 shadow-[0_0_24px_rgba(217,70,239,0.3)] cursor-pointer"
              >
                {index + 1 >= PATTERN_COUNT ? (
                  <>
                    <Trophy className="w-3.5 h-3.5" />
                    See round summary
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    Open chart #{index + 2}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          )}

          {stage === 'summary' && (
            <button
              type="button"
              data-testid="pattern-continue"
              onClick={finishRound}
              disabled={saving}
              className="mt-auto w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all duration-200 shadow-[0_0_24px_rgba(217,70,239,0.35)] cursor-pointer disabled:opacity-60"
            >
              <Trophy className="w-3.5 h-3.5" />
              {isDemoMode ? 'Finish demo — view score' : 'Save score & return to cards'}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
};
