// Round 2 pattern generation.
//
// Every team gets five fresh star maps: three 5x5 planet fields (each planet type
// comes with a finite supply) followed by two real constellations drawn on a
// larger 8x8 lattice. No signature is ever issued to the same team twice (history
// is kept per team on this device).
export const PATTERN_COUNT = 5;
export const PLANET_LEVELS = 3;

export const PLANET_GRID_SIZE = 5;
export const PLANET_CELL_COUNT = PLANET_GRID_SIZE * PLANET_GRID_SIZE;
export const PLANETS_PER_PATTERN = 9;

export const PLANET_SYMBOLS = ['mercury', 'earth', 'jupiter'] as const;
export type PlanetSymbol = typeof PLANET_SYMBOLS[number];
export type PatternItemId = PlanetSymbol | 'star';

export const PLANET_LABELS: Record<PlanetSymbol, string> = {
  mercury: 'Mercury',
  earth: 'Earth',
  jupiter: 'Jupiter'
};

export type PatternType = 'planets' | 'constellation';

/** One token sitting on the board — the answer for a cell. */
export interface PatternPlacement {
  cell: number;
  item: PatternItemId;
}

/** A supply chip under the grid, e.g. Jupiter ×3. */
export interface PaletteEntry {
  id: PatternItemId;
  count: number;
}

export interface PatternSpec {
  type: PatternType;
  /** Display name — "Planet Field" or the constellation's real name. */
  name: string;
  /** This level's lattice width (5 for planets, 8 for constellations). */
  gridSize: number;
  /** Lit cells, sorted ascending — the answer positions. */
  cells: number[];
  /** The order the cells light up during the reveal. */
  sequence: number[];
  /** The answer, including which planet belongs in each lit cell. */
  placements: PatternPlacement[];
  /** Constellation outlines as pairs of cell indices. */
  links: Array<[number, number]>;
  /** Finite supplies shown below the grid. */
  palette: PaletteEntry[];
}

const HISTORY_KEY = (team: string) => `avartan_pattern_history:${team.trim().toLowerCase()}`;
const HISTORY_LIMIT = 300;

const signatureOf = (pattern: PatternSpec) =>
  pattern.type === 'constellation'
    ? `${pattern.name}:${[...pattern.cells].sort((a, b) => a - b).join('.')}`
    : [...pattern.placements]
        .sort((a, b) => a.cell - b.cell)
        .map(p => `${p.cell}${p.item}`)
        .join('.');

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

// ── Planet fields ───────────────────────────────────────────────────────────

/** Balanced planet mix — always three types, never fewer than two of any. */
const buildPlanetSupply = (): PlanetSymbol[] => {
  const base = Math.random() < 0.55 ? [3, 3, 3] : shuffle([4, 3, 2]);
  const symbols = shuffle([...PLANET_SYMBOLS]);
  return symbols.flatMap((symbol, idx) =>
    Array.from({ length: base[idx] }, () => symbol as PlanetSymbol)
  );
};

const buildPlanetPattern = (): PatternSpec => {
  const cells = shuffle(Array.from({ length: PLANET_CELL_COUNT }, (_, i) => i)).slice(
    0,
    PLANETS_PER_PATTERN
  );
  const supply = shuffle(buildPlanetSupply());

  const placements: PatternPlacement[] = cells
    .map((cell, idx) => ({ cell, item: supply[idx] }))
    .sort((a, b) => a.cell - b.cell);

  const counts = new Map<PatternItemId, number>();
  placements.forEach(p => counts.set(p.item, (counts.get(p.item) || 0) + 1));

  return {
    type: 'planets',
    name: 'Planet Field',
    gridSize: PLANET_GRID_SIZE,
    cells: placements.map(p => p.cell),
    sequence: shuffle(placements.map(p => p.cell)),
    placements,
    links: [],
    palette: PLANET_SYMBOLS.filter(id => (counts.get(id) || 0) > 0).map(id => ({
      id,
      count: counts.get(id) || 0
    }))
  };
};

// ── Real constellations ─────────────────────────────────────────────────────
//
// Stars are authored as [column, row] pairs on an 8x8 lattice so the stick
// figures keep their real proportions. Links reference indices into `stars`.

interface ConstellationDef {
  name: string;
  /** Subtitle shown to the player, e.g. the common name. */
  common: string;
  stars: Array<[number, number]>;
  links: Array<[number, number]>;
  gridSize: number;
}

const CONSTELLATIONS: ConstellationDef[] = [
  {
    name: 'Cassiopeia',
    common: 'The Queen',
    gridSize: 8,
    stars: [
      [0, 5],
      [2, 2],
      [4, 4],
      [6, 1],
      [7, 5]
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4]
    ]
  },
  {
    name: 'Cygnus',
    common: 'The Swan',
    gridSize: 8,
    stars: [
      [4, 0],
      [4, 3],
      [4, 7],
      [1, 4],
      [7, 3]
    ],
    links: [
      [0, 1],
      [1, 2],
      [1, 3],
      [1, 4]
    ]
  },
  {
    name: 'Ursa Major',
    common: 'The Big Dipper',
    gridSize: 8,
    stars: [
      [0, 7],
      [1, 6],
      [2, 5],
      [4, 4],
      [3, 2],
      [5, 1],
      [7, 3]
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3]
    ]
  },
  {
    name: 'Orion',
    common: 'The Hunter',
    gridSize: 8,
    stars: [
      [3, 0],
      [1, 2],
      [5, 2],
      [2, 5],
      [3, 5],
      [5, 5],
      [1, 7],
      [5, 7]
    ],
    links: [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 5],
      [3, 4],
      [4, 5],
      [3, 6],
      [5, 7]
    ]
  }
];

const EASY_CONSTELLATIONS = ['Cassiopeia', 'Cygnus'];
const HARD_CONSTELLATIONS = ['Ursa Major', 'Orion'];

const cellAt = (gridSize: number, [col, row]: [number, number]) => row * gridSize + col;

const buildConstellationPattern = (def: ConstellationDef): PatternSpec => {
  const cells = def.stars.map(star => cellAt(def.gridSize, star));
  const placements: PatternPlacement[] = cells.map(cell => ({ cell, item: 'star' as const }));

  return {
    type: 'constellation',
    name: def.name,
    gridSize: def.gridSize,
    cells: [...cells].sort((a, b) => a - b),
    // Constellation stars appear along the real stick figure, then the grid hides.
    sequence: [...cells],
    placements,
    links: def.links.map(([a, b]) => [cells[a], cells[b]] as [number, number]),
    palette: [{ id: 'star', count: cells.length }]
  };
};

const pickConstellation = (index: number, usedNames: string[]): ConstellationDef => {
  const preferred =
    index === PLANET_LEVELS ? EASY_CONSTELLATIONS : HARD_CONSTELLATIONS;
  const pool = CONSTELLATIONS.filter(
    c => preferred.includes(c.name) && !usedNames.includes(c.name)
  );
  const fallback = CONSTELLATIONS.filter(c => !usedNames.includes(c.name));
  const choices = pool.length > 0 ? pool : fallback.length > 0 ? fallback : CONSTELLATIONS;
  return choices[Math.floor(Math.random() * choices.length)];
};

/**
 * Five never-before-seen patterns for this team. Levels 1-3 are planet fields;
 * levels 4-5 are real constellations, getting larger and harder.
 */
export const generatePatternSet = (team: string, count = PATTERN_COUNT): PatternSpec[] => {
  const used = new Set(readHistory(team));
  const set: PatternSpec[] = [];
  const constellationNames: string[] = [];

  for (let i = 0; i < count; i++) {
    if (i < PLANET_LEVELS) {
      let candidate = buildPlanetPattern();
      let guard = 0;
      while (used.has(signatureOf(candidate)) && guard < 200) {
        candidate = buildPlanetPattern();
        guard += 1;
      }
      used.add(signatureOf(candidate));
      set.push(candidate);
      continue;
    }

    const def = pickConstellation(i, constellationNames);
    constellationNames.push(def.name);
    const candidate = buildConstellationPattern(def);
    used.add(signatureOf(candidate));
    set.push(candidate);
  }

  rememberHistory(team, set.map(signatureOf));
  return set;
};

/** Tokens the player got exactly right — position and planet type both match. */
export const countCorrectCells = (
  answer: PatternPlacement[],
  picks: PatternPlacement[]
): number => {
  const answerMap = new Map(answer.map(p => [p.cell, p.item]));
  return picks.reduce((hits, pick) => hits + (answerMap.get(pick.cell) === pick.item ? 1 : 0), 0);
};

/** Total lit cells across a set — the denominator for the round summary. */
export const totalPatternCells = (patterns: PatternSpec[]): number =>
  patterns.reduce((sum, pattern) => sum + pattern.cells.length, 0);
