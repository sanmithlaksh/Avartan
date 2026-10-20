// Round 2 pattern generation.
//
// Every team gets five fresh 5×5 star maps. Each map is stored with the order its
// cells must appear in, and no signature is ever issued to the same team twice
// (history is kept per team on this device).
export const PATTERN_GRID_SIZE = 5;
export const PATTERN_CELL_COUNT = PATTERN_GRID_SIZE * PATTERN_GRID_SIZE;
export const PATTERN_LIT_CELLS = 9;
export const PATTERN_COUNT = 5;

export interface PatternSpec {
  /** Lit cells, sorted ascending — this is the answer. */
  cells: number[];
  /** The order the cells light up during the reveal. */
  sequence: number[];
}

const HISTORY_KEY = (team: string) => `avartan_pattern_history:${team.trim().toLowerCase()}`;
const HISTORY_LIMIT = 300;

const signatureOf = (cells: number[]) => [...cells].sort((a, b) => a - b).join('.');

const readHistory = (team: string): string[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY(team));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

const rememberHistory = (team: string, signatures: string[]) => {
  try {
    const merged = [...readHistory(team), ...signatures].slice(-HISTORY_LIMIT);
    localStorage.setItem(HISTORY_KEY(team), JSON.stringify(merged));
  } catch {
    // Storage can be unavailable — the set is still unique within this run.
  }
};

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildPattern = (): PatternSpec => {
  const pool = shuffle(Array.from({ length: PATTERN_CELL_COUNT }, (_, i) => i));
  const cells = pool.slice(0, PATTERN_LIT_CELLS).sort((a, b) => a - b);
  return {
    cells,
    sequence: shuffle(cells)
  };
};

/**
 * Five never-before-seen patterns for this team, and never two identical maps in
 * the same run.
 */
export const generatePatternSet = (team: string, count = PATTERN_COUNT): PatternSpec[] => {
  const used = new Set(readHistory(team));
  const set: PatternSpec[] = [];

  for (let i = 0; i < count; i++) {
    let candidate = buildPattern();
    let guard = 0;
    while (used.has(signatureOf(candidate.cells)) && guard < 200) {
      candidate = buildPattern();
      guard += 1;
    }
    used.add(signatureOf(candidate.cells));
    set.push(candidate);
  }

  rememberHistory(team, set.map(p => signatureOf(p.cells)));
  return set;
};

/** Boxes the player got right — the only thing Round 2 scores. */
export const countCorrectCells = (answer: number[], selected: number[]): number => {
  const answerSet = new Set(answer);
  let hits = 0;
  selected.forEach(cell => {
    if (answerSet.has(cell)) hits += 1;
  });
  return hits;
};
