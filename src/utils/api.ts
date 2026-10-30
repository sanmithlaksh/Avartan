// ─────────────────────────────────────────────────────────────────────────────
// Shared Supabase access layer for Void Paradigm.
//
// Levels 1-2 (this app) and Level 3 (the Marsfall page) read and write the SAME
// Supabase project. The `teams` table is NOT exposed to the publishable key, so
// every read/write goes through the project's RPC functions:
//
//   team_login(p_name, p_pass)            -> [{ id, team_name, l3_sec }]
//   save_l1 / save_l2 / save_l3           -> boolean   (save_l1/l2: see setup SQL)
//   public_scores()                       -> [{ id, name, p1..p3, d1..d3, cum }]
//   dash_data(p_pw)                       -> { set, teams }
//   get_config() / admin_save_config(pw)  -> level-3 config; also stores `vp` board
//   get_status() / set_hold(pw, target)   -> portal + scoreboard loading screens
// ─────────────────────────────────────────────────────────────────────────────

export const SB_URL = 'https://jbydaklyvepixtzrcgfp.supabase.co/rest/v1';
export const SB_KEY = 'sb_publishable_z-SnsaEpRt47cE7rOumIwA_DwY3tgJE';

/** Admin password configured for this event (validated server-side by the RPCs). */
export const ADMIN_PASSWORD = 'void2026';

/** sessionStorage key used to hand the signed-in team to the Level 3 iframe. */
export const SESSION_KEY = 'vp_session_v1';
/** localStorage key for L1/L2 scores that could not reach the server yet. */
const PENDING_KEY = 'vp_pending_scores_v1';

export interface TeamSession {
  /** Primary key of the row in the Supabase `teams` table. */
  id: number | string;
  name: string;
  /** Team password — needed by save_l1/save_l2/save_l3 to authorise the write. */
  pass: string;
}

export interface LevelSwitch {
  on: boolean;
  msg: string;
}

export interface Board {
  levels: { l1: LevelSwitch; l2: LevelSwitch; l3: LevelSwitch };
  /** Round 3 gate: players wait on the loading screen until this is on. */
  r3: LevelSwitch;
  /** Notice board shown on the loading screen and the scoreboard. */
  notice: { on: boolean; text: string };
  /** Level 1 tuning that the admin can change without touching the game files. */
  l1: {
    durationSeconds: number;
    maxAttempts: number;
    earthNode: number;
    /** Seconds the planet ↔ zodiac reference chart stays on screen. */
    chartSeconds: number;
    /** Level 1 scoring configuration */
    totalPoints?: number;
    wrongPenalty?: number;
    minPoints?: number;
  };
  /** Level 2 (Pattern Recognition) scoring configuration */
  l2?: {
    pointsPerBox: number;
    perfectBonus: number;
    /** Per-stage overrides (index 0-4) */
    stages?: Array<{ pointsPerBox?: number; perfectBonus?: number; totalPoints?: number }>;
  };
  updated?: string;
}

export interface ScoreRow {
  id: number;
  name: string;
  p1: number;
  p2: number;
  p3: number;
  cum: number;
  d1: boolean;
  d2: boolean;
  d3: boolean;
  s1?: number;
  s2?: number;
  s3?: number;
}

export const DEFAULT_BOARD: Board = {
  levels: {
    l1: { on: true, msg: 'Level 1 is live.' },
    l2: { on: true, msg: 'Level 2 is live.' },
    l3: { on: true, msg: 'Level 3 is live.' }
  },
  r3: { on: false, msg: 'Stand by — the next round will unlock shortly.' },
  notice: { on: false, text: '' },
  l1: { durationSeconds: 2100, maxAttempts: 3, earthNode: 1, chartSeconds: 30, totalPoints: 1000, wrongPenalty: 100, minPoints: 300 },
  l2: {
    pointsPerBox: 100,
    perfectBonus: 100,
    stages: [
      { pointsPerBox: 100, perfectBonus: 100 },
      { pointsPerBox: 100, perfectBonus: 100 },
      { pointsPerBox: 100, perfectBonus: 100 },
      { pointsPerBox: 100, perfectBonus: 100 },
      { pointsPerBox: 100, perfectBonus: 100 }
    ]
  }
};

export class RpcError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
  /** PostgREST reports an unknown function as 404 / PGRST202. */
  get isMissingFunction() {
    return this.status === 404;
  }
}

async function rpc<T>(fn: string, body: unknown = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${SB_URL}/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw new RpcError('Supabase is unreachable from this device.', 0);
  }
  if (!res.ok) {
    let msg = `Supabase returned HTTP ${res.status}`;
    try {
      const payload = await res.json();
      if (payload?.message) msg = String(payload.message);
    } catch {
      /* keep the status-only message */
    }
    throw new RpcError(msg, res.status);
  }
  return (await res.json()) as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Team authentication — identical call the Level 3 page uses.
// ─────────────────────────────────────────────────────────────────────────────

export async function teamLogin(
  teamName: string,
  password: string
): Promise<{ session: TeamSession; l3Seconds: number } | null> {
  const rows = await rpc<Array<{ id: number; team_name: string; l3_sec: number }>>('team_login', {
    p_name: teamName.trim(),
    p_pass: password
  });
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const row = rows[0];
  return {
    session: { id: row.id, name: row.team_name, pass: password },
    l3Seconds: Number(row.l3_sec) || 0
  };
}

export function storeSession(session: TeamSession | null) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode */
  }
}

export function readSession(): TeamSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.id != null && parsed.name ? (parsed as TeamSession) : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin board (level switches, Round 3 gate, notice board, Level 1 settings)
// ─────────────────────────────────────────────────────────────────────────────

function normaliseBoard(raw: any): Board {
  const b = raw && typeof raw === 'object' ? raw : {};
  const level = (key: 'l1' | 'l2' | 'l3'): LevelSwitch => ({
    on: b.levels?.[key]?.on ?? DEFAULT_BOARD.levels[key].on,
    msg: typeof b.levels?.[key]?.msg === 'string' ? b.levels[key].msg : DEFAULT_BOARD.levels[key].msg
  });

  const defL2 = DEFAULT_BOARD.l2!;
  const l2 = b.l2 && typeof b.l2 === 'object' ? b.l2 : {};
  const stages = Array.isArray(l2.stages)
    ? l2.stages.slice(0, 5).map((s: any, idx: number) => ({
        pointsPerBox: Number.isFinite(Number(s?.pointsPerBox)) ? Number(s.pointsPerBox) : (defL2.stages![idx]?.pointsPerBox ?? defL2.pointsPerBox),
        perfectBonus: Number.isFinite(Number(s?.perfectBonus)) ? Number(s.perfectBonus) : (defL2.stages![idx]?.perfectBonus ?? defL2.perfectBonus),
        totalPoints: Number.isFinite(Number(s?.totalPoints)) ? Number(s.totalPoints) : undefined
      }))
    : defL2.stages;

  return {
    levels: { l1: level('l1'), l2: level('l2'), l3: level('l3') },
    r3: {
      on: !!b.r3?.on,
      msg: typeof b.r3?.msg === 'string' ? b.r3.msg : DEFAULT_BOARD.r3.msg
    },
    notice: {
      on: !!b.notice?.on,
      text: typeof b.notice?.text === 'string' ? b.notice.text : ''
    },
    l1: {
      durationSeconds: Math.max(10, Number(b.l1?.durationSeconds) || DEFAULT_BOARD.l1.durationSeconds),
      maxAttempts: Math.max(1, Number(b.l1?.maxAttempts) || DEFAULT_BOARD.l1.maxAttempts),
      earthNode: Number.isFinite(Number(b.l1?.earthNode)) ? Number(b.l1.earthNode) : 1,
      chartSeconds: Math.max(5, Number(b.l1?.chartSeconds) || DEFAULT_BOARD.l1.chartSeconds),
      totalPoints: Math.max(0, Number(b.l1?.totalPoints) ?? DEFAULT_BOARD.l1.totalPoints ?? 1000),
      wrongPenalty: Math.max(0, Number(b.l1?.wrongPenalty) ?? DEFAULT_BOARD.l1.wrongPenalty ?? 100),
      minPoints: Math.max(0, Number(b.l1?.minPoints) ?? DEFAULT_BOARD.l1.minPoints ?? 300)
    },
    l2: {
      pointsPerBox: Math.max(0, Number(l2.pointsPerBox) || defL2.pointsPerBox),
      perfectBonus: Math.max(0, Number(l2.perfectBonus) || defL2.perfectBonus),
      stages
    },
    updated: b.updated
  };
}

/** Public read — no password required, same call Level 3 makes. */
export async function fetchBoard(): Promise<Board> {
  const cfg = await rpc<any>('get_config');
  return normaliseBoard(cfg?.vp);
}

/** Raw config, needed by the admin dashboard to merge without dropping keys. */
export async function fetchConfig(): Promise<any> {
  return rpc<any>('get_config');
}

/** Admin-only write. Merges `vp` into the live config so Level 3 settings survive. */
export async function saveBoard(board: Board, password = ADMIN_PASSWORD): Promise<void> {
  const cfg = (await fetchConfig()) || {};
  const next = { ...cfg, vp: { ...board, updated: new Date().toISOString() } };
  const ok = await rpc<boolean>('admin_save_config', { p_pw: password, p_data: next });
  if (ok !== true) throw new RpcError('Server rejected the admin password.', 401);
}

/** Admin-only write of the whole Level 3 configuration object. */
export async function saveL3Config(config: any, password = ADMIN_PASSWORD): Promise<void> {
  const cfg = (await fetchConfig()) || {};
  const next = { ...config, vp: cfg.vp };
  const ok = await rpc<boolean>('admin_save_config', { p_pw: password, p_data: next });
  if (ok !== true) throw new RpcError('Server rejected the admin password.', 401);
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring. Levels 1-2 use save_l1/save_l2 (created by supabase/void_paradigm_setup.sql).
// If those functions are not installed yet the score is queued locally and retried,
// so nothing a team earns is ever lost.
// ─────────────────────────────────────────────────────────────────────────────

export type SaveOutcome = { status: 'saved' } | { status: 'queued'; reason: string };

type Pending = { level: 1 | 2; id: number | string; pass: string; sec: number; pts: number; at: string };

function readPending(): Pending[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePending(list: Pending[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota/privacy errors */
  }
}

function queue(item: Pending) {
  const list = readPending().filter(
    p => !(p.id === item.id && p.level === item.level)
  );
  list.push(item);
  writePending(list);
}

export function pendingScoreCount(): number {
  return readPending().length;
}

export async function submitScore(
  level: 1 | 2,
  session: TeamSession,
  seconds: number,
  points: number
): Promise<SaveOutcome> {
  const fn = level === 1 ? 'save_l1' : 'save_l2';
  try {
    const ok = await rpc<boolean>(fn, {
      p_id: session.id,
      p_pass: session.pass,
      p_sec: Math.max(0, Math.round(seconds)),
      p_pts: Math.max(0, Math.round(points))
    });
    if (ok === true) return { status: 'saved' };
    return { status: 'queued', reason: 'The server did not accept this score yet.' };
  } catch (err) {
    const reason =
      err instanceof RpcError && err.isMissingFunction
        ? `Server scoring for Level ${level} is not installed yet.`
        : err instanceof Error
          ? err.message
          : 'Unknown error';
    queue({ level, id: session.id, pass: session.pass, sec: seconds, pts: points, at: new Date().toISOString() });
    return { status: 'queued', reason };
  }
}

/** Retries every queued Level 1/2 score. Safe to call on boot and after login. */
export async function flushPendingScores(): Promise<number> {
  const list = readPending();
  if (list.length === 0) return 0;
  const remaining: Pending[] = [];
  let saved = 0;
  for (const item of list) {
    const fn = item.level === 1 ? 'save_l1' : 'save_l2';
    try {
      const ok = await rpc<boolean>(fn, {
        p_id: item.id,
        p_pass: item.pass,
        p_sec: item.sec,
        p_pts: item.pts
      });
      if (ok === true) saved += 1;
      else remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }
  writePending(remaining);
  return saved;
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard / admin data
// ─────────────────────────────────────────────────────────────────────────────

export async function publicScores(): Promise<ScoreRow[]> {
  const rows = await rpc<ScoreRow[]>('public_scores');
  return Array.isArray(rows) ? rows : [];
}

export async function dashData(password: string): Promise<{
  set: { l1_top: number; l2_top: number; winners: number };
  teams: Array<ScoreRow & { s1: number; s2: number; s3: number }>;
} | null> {
  const data = await rpc<any>('dash_data', { p_pw: password });
  if (!data) return null;
  return {
    set: data.set || { l1_top: 15, l2_top: 10, winners: 3 },
    teams: Array.isArray(data.teams) ? data.teams : []
  };
}

export async function saveDashRules(
  password: string,
  l1: number,
  l2: number,
  winners: number
): Promise<boolean> {
  return rpc<boolean>('dash_set', { p_pw: password, p_l1: l1, p_l2: l2, p_win: winners });
}

export async function getStatus(): Promise<{
  game?: { on: boolean; message: string };
  score?: { on: boolean; message: string };
}> {
  return rpc<any>('get_status');
}

export async function setHold(
  password: string,
  target: 'game' | 'score',
  on: boolean,
  message: string
): Promise<boolean> {
  return rpc<boolean>('set_hold', { p_pw: password, p_target: target, p_on: on, p_msg: message });
}

/** Level 3 page: reports the team's Marsfall result. */
export async function saveL3(
  session: TeamSession,
  seconds: number,
  points: number
): Promise<boolean> {
  return rpc<boolean>('save_l3', {
    p_id: session.id,
    p_pass: session.pass,
    p_sec: Math.round(seconds),
    p_pts: Math.round(points)
  });
}
