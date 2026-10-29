// Team roster + leaderboard gateway for Levels 1-2.
//
// Everything here is a thin wrapper over `utils/api.ts`, which talks to the same
// Supabase project (and the same RPC functions) that the Level 3 Marsfall page
// uses. A localStorage mirror keeps the UI responsive and survives a refresh.
import { TeamScoreEntry, TeamAccount } from '../engine/types';
import {
  SB_KEY,
  SB_URL,
  ScoreRow,
  TeamSession,
  fetchBoard,
  publicScores,
  readSession,
  storeSession,
  submitScore,
  teamLogin,
  flushPendingScores,
  pendingScoreCount
} from './api';

const TEAMS_STORAGE_KEY = 'avartan_teams_accounts';
const CURRENT_TEAM_KEY = 'avartan_active_team_account';

// Account used for local demos and by the organisers. The real competition
// account list lives in Supabase and is fetched with public_scores().
export const DEFAULT_TRIAL_ACCOUNT: TeamAccount = {
  id: 'trial-admin-01',
  'Name 1': 'Admin',
  'Name 2': 'Co-Admin',
  'Team Name': 'Admin',
  'Password': 'Aryan',
  'Current level': 1,
  'levels completion': 0,
  'level 1 points': 0,
  'level 2 points': 0,
  'level 3 points': 0,
  'total level points': 0
};

export const MDS112_ACCOUNT: TeamAccount = {
  id: 'team-mds112',
  'Name 1': '',
  'Name 2': '',
  'Team Name': 'mds112',
  'Password': '2120',
  'Current level': 1,
  'levels completion': 0,
  'level 1 points': 0,
  'level 2 points': 0,
  'level 3 points': 0,
  'total level points': 0
};

export const REQUIRED_TEAMS: TeamAccount[] = [MDS112_ACCOUNT, DEFAULT_TRIAL_ACCOUNT];
export const SEED_TEAMS: TeamAccount[] = [DEFAULT_TRIAL_ACCOUNT, MDS112_ACCOUNT];

const rowToAccount = (row: ScoreRow): TeamAccount => ({
  id: String(row.id),
  'Name 1': '',
  'Name 2': '',
  'Team Name': row.name,
  'Password': '',
  'Current level': row.d3 ? 3 : row.d2 ? 2 : 1,
  'levels completion': (row.d1 ? 1 : 0) + (row.d2 ? 1 : 0) + (row.d3 ? 1 : 0),
  'level 1 points': Number(row.p1) || 0,
  'level 2 points': Number(row.p2) || 0,
  'level 3 points': Number(row.p3) || 0,
  'total level points': Number(row.cum) || 0
});

class BackendService {
  private listeners: Array<(entries: TeamScoreEntry[]) => void> = [];
  private teamListeners: Array<(teams: TeamAccount[]) => void> = [];

  private readStoredTeams(): TeamAccount[] | null {
    try {
      const raw = localStorage.getItem(TEAMS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private readStoredWelcome(): Record<string, string> {
    return {};
  }

  public setCredentials(_url: string, _key: string) {
    // Kept for the in-game admin console: the project endpoint is fixed.
  }

  public getCredentials() {
    return { url: SB_URL, key: SB_KEY, isConfigured: true };
  }

  /** Real read against the teams table through RPC, so "connected" means connected. */
  public async checkConnection(): Promise<{ online: boolean; message: string }> {
    try {
      const board = await fetchBoard();
      return {
        online: true,
        message: `Connected — Round 3 is ${board.r3.on ? 'open' : 'locked'}`
      };
    } catch (err) {
      return {
        online: false,
        message: err instanceof Error ? err.message : 'Supabase is unreachable from this device'
      };
    }
  }

  public getLocalTeams(): TeamAccount[] {
    return this.readStoredTeams() || SEED_TEAMS;
  }

  public saveLocalTeams(teams: TeamAccount[]) {
    try {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    } catch {
      /* ignore */
    }
    this.teamListeners.forEach(fn => fn(teams));
  }

  /** Roster + scores from Supabase, mirrored into localStorage. */
  public async fetchAllTeams(): Promise<TeamAccount[]> {
    try {
      const rows = await publicScores();
      const fresh = rows.map(rowToAccount);
      this.saveLocalTeams(fresh);
      return fresh;
    } catch {
      return this.getLocalTeams();
    }
  }

  /**
   * Team login. Uses the same `team_login` RPC as Level 3, so a team has one
   * identity (and one primary key) across all three levels.
   */
  public async authenticateTeam(
    teamName: string,
    password: string
  ): Promise<{ success: boolean; team?: TeamAccount; message: string }> {
    const cleanName = teamName.trim();
    const cleanPass = password.trim();
    if (!cleanName || !cleanPass) {
      return { success: false, message: 'Enter your team name and password.' };
    }

    try {
      const result = await teamLogin(cleanName, cleanPass);
      if (!result) return { success: false, message: 'Team name or password is wrong.' };

      const { session } = result;
      storeSession(session);

      // Pull the team's live score row so the hub reflects Supabase immediately.
      const rows = await publicScores().catch(() => [] as ScoreRow[]);
      const row = rows.find(r => String(r.id) === String(session.id));
      const account: TeamAccount = row
        ? { ...rowToAccount(row), 'Team Name': session.name }
        : {
            id: String(session.id),
            'Name 1': '',
            'Name 2': '',
            'Team Name': session.name,
            'Password': '',
            'Current level': 1,
            'levels completion': 0,
            'level 1 points': 0,
            'level 2 points': 0,
            'level 3 points': 0,
            'total level points': 0
          };

      this.setActiveAccount({ ...account, 'Password': session.pass });

      // Any score stuck offline is retried the moment the team is back online.
      const synced = await flushPendingScores().catch(() => 0);

      const pending = pendingScoreCount();
      const note =
        synced > 0
          ? ` · ${synced} offline score${synced > 1 ? 's' : ''} synced`
          : pending > 0
            ? ' · a previous score is still waiting to sync'
            : '';

      return {
        success: true,
        team: { ...account, 'Password': session.pass },
        message: `Authenticated as ${session.name} · ID ${session.id}${note}`
      };
    } catch (err) {
      // Only the organisers' demo account works without a connection.
      const local = this.getLocalTeams().find(
        t => t['Team Name'].toLowerCase() === cleanName.toLowerCase()
      );
      if (local && local['Team Name'].toLowerCase() === 'admin' && local['Password'] === cleanPass) {
        this.setActiveAccount(local);
        return { success: true, team: local, message: 'Offline organiser login' };
      }
      return {
        success: false,
        message:
          err instanceof Error
            ? `Could not reach the server: ${err.message}`
            : 'Could not reach the server. Check this device’s connection.'
      };
    }
  }

  /**
   * Team accounts are created by the organisers in Supabase (the publishable key
   * cannot insert rows), so registration happens outside the game.
   */
  public async registerTeam(
    _account: TeamAccount
  ): Promise<{ success: boolean; team?: TeamAccount; message: string }> {
    return {
      success: false,
      message: 'Team logins are issued by the organisers. Ask them for your team name and password.'
    };
  }

  public async deleteTeam(_account: TeamAccount): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Teams are managed in Supabase by the organisers.' };
  }

  /** Persists a finished round to Supabase (or queues it until it can be). */
  public async saveRoundScore(
    level: 1 | 2,
    seconds: number,
    points: number
  ): Promise<{ saved: boolean; message: string }> {
    const session = readSession();
    if (!session) {
      return { saved: false, message: 'No active team session — score kept in this browser only.' };
    }
    const outcome = await submitScore(level, session, seconds, points);
    return outcome.status === 'saved'
      ? { saved: true, message: `Level ${level} score saved to Supabase.` }
      : { saved: false, message: outcome.reason };
  }

  /** Local mirror update; scoring itself goes through saveRoundScore(). */
  public async updateTeamAccount(account: TeamAccount): Promise<boolean> {
    const teams = this.getLocalTeams();
    const idx = teams.findIndex(
      t => t['Team Name'].toLowerCase() === account['Team Name'].toLowerCase()
    );
    if (idx >= 0) teams[idx] = { ...teams[idx], ...account };
    else teams.push(account);
    this.saveLocalTeams(teams);

    const current = this.getActiveAccount();
    if (current && current['Team Name'].toLowerCase() === account['Team Name'].toLowerCase()) {
      this.setActiveAccount({ ...current, ...account });
    }
    return true;
  }

  public getActiveAccount(): TeamAccount | null {
    try {
      const raw = localStorage.getItem(CURRENT_TEAM_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return null;
  }

  public setActiveAccount(account: TeamAccount | null) {
    try {
      if (account) localStorage.setItem(CURRENT_TEAM_KEY, JSON.stringify(account));
      else localStorage.removeItem(CURRENT_TEAM_KEY);
    } catch {
      /* ignore */
    }
  }

  public currentSession(): TeamSession | null {
    return readSession();
  }

  // ── Leaderboard adapter ────────────────────────────────────────────────────

  public async getLeaderboard(): Promise<TeamScoreEntry[]> {
    const teams = await this.fetchAllTeams();
    return teams
      .map(t => ({
        id: String(t.id || t['Team Name']),
        teamName: t['Team Name'],
        score: t['total level points'] || 0,
        timeRemainingSeconds: 0,
        timeElapsedSeconds: 0,
        attemptsUsed: 1,
        launchCode: `STAGE-${t['Current level']}`,
        completedAt: new Date().toISOString(),
        missionCompleted: (t['levels completion'] || 0) > 0
      }))
      .sort((a, b) => b.score - a.score);
  }

  public subscribe(callback: (entries: TeamScoreEntry[]) => void): () => void {
    this.listeners.push(callback);
    this.getLeaderboard().then(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }

  public subscribeTeams(callback: (teams: TeamAccount[]) => void): () => void {
    this.teamListeners.push(callback);
    this.fetchAllTeams().then(callback);
    return () => {
      this.teamListeners = this.teamListeners.filter(fn => fn !== callback);
    };
  }
}

export const backendService = new BackendService();
