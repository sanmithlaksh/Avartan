// Avartan — Round 2: Pattern Recognition
//
// Five deep-space charts, one after another. Levels 1-3 are 5×5 planet fields:
// a fixed supply of Mercury, Earth and Jupiter must be rebuilt exactly where they
// appeared. Levels 4-5 are real constellations on an 8×8 star chart. Each grid
// lights up for ten seconds, then the player rebuilds it in fifteen.
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
  ArrowLeft,
  Star,
  MousePointerClick
} from 'lucide-react';

const REVEAL_SECONDS = 10;
const INPUT_SECONDS = 15;
const REVEAL_STAGGER_MS = 460;
// The pattern finishes drawing before the memorise clock starts, so players get
// the full ten seconds with the complete chart on screen.
const DRAW_START_DELAY_MS = 240;
const DRAW_HOLD_MS = 700;
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
  <div className="flex flex-wrap items-center justify-center gap-2">
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
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-200 ${
            active
              ? 'border-cyan-300 bg-cyan-500/20 shadow-[0_0_18px_rgba(34,211,238,0.35)] scale-[1.03]'
              : empty
              ? 'border-space-700/60 bg-space-950/50 opacity-45'
              : 'border-white/10 bg-space-950/80 hover:border-cyan-400/60 hover:bg-cyan-950/30'
          } ${disabled || empty ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
        >
          <span className="w-8 h-8 shrink-0">
            <PlanetGlyph item={entry.id} muted={empty} />
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
              {itemLabel(entry.id)}
            </span>
            <span
              className={`font-mono text-sm font-bold tabular-nums ${
                empty ? 'text-slate-500' : 'text-cyan-200'
              }`}
            >
              ×{left}
            </span>
          </span>
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
                stroke="rgba(186,230,253,0.55)"
                strokeWidth="0.45"
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
                showItem
                  ? `Grid node ${cell + 1}, ${itemLabel(showItem)}`
                  : `Grid node ${cell + 1}`
              }
              className={`relative aspect-square rounded-lg border transition-all duration-300 ease-out flex items-center justify-center ${
                showItem || revealed ? 'scale-100' : 'scale-[0.96]'
              } ${litLook} ${
                interactive
                  ? 'cursor-pointer hover:border-cyan-400/80 hover:bg-cyan-950/40 active:scale-95'
                  : 'cursor-default'
              }`}
              style={{
                animation: revealed && revealCount !== undefined
                  ? 'starReveal 320ms ease-out both'
                  : undefined
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

  // ── Reveal: tokens light up one after another, then the 10s clock starts ───
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
  const isUrgent = stage === 'input' && timeLeft <= 3;
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

  return (
    <div className="relative z-10 w-full max-w-2xl max-h-[94vh] overflow-y-auto rounded-2xl bg-space-900/92 border border-fuchsia-500/40 p-5 md:p-7 shadow-[0_0_70px_rgba(217,70,239,0.22)] flex flex-col gap-4 backdrop-blur-xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
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

        <div className="text-right shrink-0">
          <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
            {isConstellation ? 'Constellation chart' : 'Planet field'}
          </div>
          <div className={`font-orbit font-bold text-sm ${isConstellation ? 'text-sky-300' : 'text-cyan-300'}`}>
            {isConstellation ? pattern.name : `${pattern.gridSize}×${pattern.gridSize} grid`}
          </div>
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
              {isConstellation ? `Memorise ${pattern.name}` : `Memorise planet field #${index + 1}`}
            </>
          )}
          {stage === 'ready' && (
            <>
              <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
              {isConstellation ? `${pattern.name} hidden` : `Pattern #${index + 1} hidden`} — ready to rebuild
            </>
          )}
          {stage === 'input' && (
            <>
              <Pencil className="w-4 h-4 text-cyan-300 shrink-0" />
              {isConstellation ? `Rebuild ${pattern.name}` : 'Rebuild the planet field'}
            </>
          )}
          {stage === 'result' && (
            <>
              {currentResult?.perfect ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-300 shrink-0" />
              )}
              {isConstellation ? pattern.name : `Pattern #${index + 1}`} scored{' '}
              {currentResult?.points ?? 0} pts
            </>
          )}
          {stage === 'summary' && (
            <>
              <Trophy className="w-4 h-4 text-amber-300 shrink-0" />
              Round 02 complete — {totalPoints} pts
            </>
          )}
        </div>

        {drawing && (
          <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-fuchsia-300 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Revealing…
          </div>
        )}

        {(stage === 'input' || (stage === 'reveal' && !drawing)) && (
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
      <div className="w-full max-w-[440px] mx-auto">
        {stage === 'reveal' && (
          <div className="animate-fade-in">
            <PatternGrid
              pattern={pattern}
              revealCount={revealCount}
              showLinks={isConstellation}
            />
            <p className="mt-2 text-center text-[10px] font-mono uppercase tracking-widest text-slate-500">
              {isConstellation
                ? `${pattern.cells.length} stars • ${pattern.name}`
                : `${pattern.cells.length} worlds • ${pattern.palette
                    .map(entry => `${itemLabel(entry.id)} ×${entry.count}`)
                    .join(' · ')}`}
            </p>
            <p className="mt-1 text-center text-[10px] font-mono text-cyan-400/80">
              {drawing ? 'Watch the chart fill in…' : '10-second memorise clock running'}
            </p>
          </div>
        )}

        {stage === 'ready' && (
          <div className="animate-fade-in flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <Lock className="w-7 h-7" />
            </div>
            <div className="text-center flex flex-col gap-1">
              <span className="font-orbit font-bold text-slate-100">
                {isConstellation ? `${pattern.name} locked away` : `Pattern #${index + 1} locked away`}
              </span>
              <span className="text-xs text-slate-400 max-w-sm">
                You get <strong className="text-cyan-300">15 seconds</strong> on an empty grid.{' '}
                {isConstellation
                  ? `Tap the ${pattern.cells.length} boxes where the stars sat.`
                  : `Place all ${pattern.cells.length} worlds — each planet has a limited supply.`}
              </span>
            </div>
            <button
              type="button"
              data-testid="pattern-begin-input"
              onClick={beginInput}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-slate-950 font-orbit font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all duration-200 shadow-[0_0_25px_rgba(0,243,255,0.3)] cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              {isConstellation ? 'Trace the constellation' : 'Reconstruct the pattern'}
            </button>
          </div>
        )}

        {stage === 'input' && (
          <div className="animate-fade-in flex flex-col gap-2.5">
            <PatternGrid
              pattern={pattern}
              picks={picks}
              interactive
              onToggle={toggleCell}
            />

            <PaletteTray
              entries={pattern.palette}
              remaining={remaining}
              selected={selectedItem}
              disabled={stage !== 'input'}
              onSelect={selectItem}
            />

            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-500">
              <MousePointerClick className="w-3 h-3" />
              {picks.length}/{pattern.cells.length} placed
              {pattern.type === 'planets' && ' • tap a placed world to return it'}
            </div>
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
                {currentResult?.perfect
                  ? 'Perfect reconstruction'
                  : `${currentResult?.correctCells}/${pattern.cells.length} tokens correct`}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                +{currentResult?.points ?? 0} pts
              </span>
            </div>

            <PatternGrid
              pattern={pattern}
              picks={picks}
              showVerdicts
              showLinks={isConstellation}
            />

            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-400/70" /> matched
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500/70" /> wrong token
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded ring-1 ring-amber-300/70 bg-space-950" /> missed
              </span>
            </div>
          </div>
        )}

        {stage === 'summary' && (
          <div className="animate-fade-in flex flex-col gap-3">
            <div className="flex flex-col items-center gap-1 py-1">
              <Trophy className="w-9 h-9 text-amber-300" />
              <span className="font-orbit font-black text-3xl text-slate-100 tabular-nums">
                {totalPoints}
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
                Round 02 points
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-space-950/70 border border-cyan-500/25">
                <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">
                  Tokens
                </div>
                <div className="font-mono text-lg font-bold text-cyan-300">
                  {totalCorrectBoxes}/{possibleCells}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-space-950/70 border border-emerald-500/25">
                <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">
                  Perfect
                </div>
                <div className="font-mono text-lg font-bold text-emerald-300">
                  {perfectCount}/{PATTERN_COUNT}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-space-950/70 border border-amber-500/25">
                <div className="text-[9px] font-orbit uppercase tracking-wider text-slate-400">
                  Bonus
                </div>
                <div className="font-mono text-lg font-bold text-amber-300">
                  {perfectCount * PERFECT_BONUS}
                </div>
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
          Lock in pattern ({picks.length}/{pattern.cells.length})
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
            {isDemoMode ? 'Exit demo — back to admin login' : 'Save score & return to cards'}
          </button>
        </div>
      )}

      <p className="text-center text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
        <ArrowLeft className="w-3 h-3" />
        Each grid is scored on its own: 100 pts per correct token, +100 for a perfect grid.
      </p>
    </div>
  );
};
