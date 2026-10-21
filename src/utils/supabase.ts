// Supabase & Offline Leaderboard + Team User Management Integration
import { TeamScoreEntry, TeamAccount } from '../engine/types';

const STORAGE_KEY = 'the_hidden_orbit_leaderboard';
const TEAMS_STORAGE_KEY = 'avartan_teams_accounts';
const CURRENT_TEAM_KEY = 'avartan_active_team_account';
// Teams an administrator deliberately removed. Kept as tombstones so a stale
// cache or a remote roster can never resurrect them on the next sync.
const REMOVED_TEAMS_KEY = 'avartan_removed_teams';

// Default trial admin account requested by user
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

// Newly added team account (must always be available for login)
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

// Accounts that must exist even when a stale cache or remote roster is loaded
export const REQUIRED_TEAMS: TeamAccount[] = [MDS112_ACCOUNT];

// Seed team accounts for testing with up to 50 participants
export const SEED_TEAMS: TeamAccount[] = [
  DEFAULT_TRIAL_ACCOUNT,
  {
    id: 'team-02',
    'Name 1': 'Rohan',
    'Name 2': 'Priya',
    'Team Name': 'Apex Stellar',
    'Password': 'apex',
    'Current level': 1,
    'levels completion': 0,
    'level 1 points': 850,
    'level 2 points': 0,
    'level 3 points': 0,
    'total level points': 850
  },
  {
    id: 'team-03',
    'Name 1': 'Karthik',
    'Name 2': 'Ananya',
    'Team Name': 'Vanguard',
    'Password': 'orbit',
    'Current level': 1,
    'levels completion': 0,
    'level 1 points': 720,
    'level 2 points': 0,
    'level 3 points': 0,
    'total level points': 720
  },
  {
    id: 'team-04',
    'Name 1': 'Dev',
    'Name 2': 'Sneha',
    'Team Name': 'Cosmic Chronos',
    'Password': 'chronos',
    'Current level': 1,
    'levels completion': 0,
    'level 1 points': 640,
    'level 2 points': 0,
    'level 3 points': 0,
    'total level points': 640
  },
  MDS112_ACCOUNT
];

class BackendService {
  private supabaseUrl: string = 'https://jbydaklyvepixtzrcgfp.supabase.co/rest/v1';
  private supabaseAnonKey: string = 'sb_publishable_z-SnsaEpRt47cE7rOumIwA_DwY3tgJE';
  private tableName: string = 'teams';
  private listeners: Array<(entries: TeamScoreEntry[]) => void> = [];
  private teamListeners: Array<(teams: TeamAccount[]) => void> = [];

  constructor() {
    // Check saved credentials, default to user provided
    const savedUrl = localStorage.getItem('supabase_url');
    const savedKey = localStorage.getItem('supabase_anon_key');
    if (savedUrl) this.supabaseUrl = savedUrl;
    if (savedKey) this.supabaseAnonKey = savedKey;

    // Initialize local accounts cache and make sure required teams are present
    const storedTeams = this.readStoredTeams();
    localStorage.setItem(
      TEAMS_STORAGE_KEY,
      JSON.stringify(storedTeams ? this.withRequiredTeams(storedTeams) : SEED_TEAMS)
    );
  }

  private normalizeName(name: string): string {
    return String(name || '').trim().toLowerCase();
  }

  private readRemovedTeams(): string[] {
    try {
      const raw = localStorage.getItem(REMOVED_TEAMS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }

  private markTeamRemoved(name: string) {
    try {
      const removed = new Set(this.readRemovedTeams());
      removed.add(this.normalizeName(name));
      localStorage.setItem(REMOVED_TEAMS_KEY, JSON.stringify([...removed]));
    } catch {
      // Storage can be unavailable; the in-memory roster is still updated.
    }
  }

  private unmarkTeamRemoved(name: string) {
    try {
      const removed = this.readRemovedTeams().filter(
        entry => entry !== this.normalizeName(name)
      );
      localStorage.setItem(REMOVED_TEAMS_KEY, JSON.stringify(removed));
    } catch {
      // Ignore storage failures.
    }
  }

  // Merge the mandatory team accounts into any roster (local cache or Supabase)
  // while keeping administrator removals final.
  private withRequiredTeams(teams: TeamAccount[]): TeamAccount[] {
    const removed = new Set(this.readRemovedTeams());
    const merged = teams.filter(team => !removed.has(this.normalizeName(team['Team Name'])));
    REQUIRED_TEAMS.forEach(required => {
      const key = this.normalizeName(required['Team Name']);
      const exists = merged.some(t => this.normalizeName(t['Team Name']) === key);
      if (!exists && !removed.has(key)) merged.push({ ...required });
    });
    return merged;
  }

  private readStoredTeams(): TeamAccount[] | null {
    try {
      const raw = localStorage.getItem(TEAMS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) {
      console.warn('Failed to parse local teams:', e);
      return null;
    }
  }

  public setCredentials(url: string, key: string) {
    this.supabaseUrl = url.replace(/\/+$/, '');
    this.supabaseAnonKey = key;
    localStorage.setItem('supabase_url', this.supabaseUrl);
    localStorage.setItem('supabase_anon_key', key);
  }

  public getCredentials() {
    return {
      url: this.supabaseUrl,
      key: this.supabaseAnonKey,
      isConfigured: !!(this.supabaseUrl && this.supabaseAnonKey)
    };
  }

  /**
   * Performs a real read against the teams table so the admin console can show
   * whether Supabase is actually reachable and writable with the current key,
   * instead of assuming that credentials in localStorage mean a live link.
   */
  public async checkConnection(): Promise<{ online: boolean; message: string }> {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      return { online: false, message: 'No Supabase credentials configured' };
    }
    try {
      const res = await fetch(`${this.supabaseUrl}/${this.tableName}?select=id&limit=1`, {
        headers: this.getHeaders()
      });
      if (res.ok) return { online: true, message: 'Supabase connected' };
      if (res.status === 401 || res.status === 403) {
        return {
          online: false,
          message: 'Supabase rejected the key — grant access on the teams table (RLS/GRANT)'
        };
      }
      return { online: false, message: `Supabase returned HTTP ${res.status}` };
    } catch {
      return { online: false, message: 'Supabase is unreachable from this device' };
    }
  }

  // Helper for Supabase requests
  private getHeaders() {
    return {
      'apikey': this.supabaseAnonKey,
      'Authorization': `Bearer ${this.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  // ========================
  // TEAM USER MANAGEMENT API
  // ========================

  public getLocalTeams(): TeamAccount[] {
    const stored = this.readStoredTeams();
    if (stored) return this.withRequiredTeams(stored);
    return this.withRequiredTeams(SEED_TEAMS);
  }

  public saveLocalTeams(teams: TeamAccount[]) {    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    this.teamListeners.forEach(fn => fn(teams));
  }

  // Remote rows and the local cache are kept in step without ever discarding
  // progress that a squadron earned while the connection was down. For any team
  // present in both, the further-progressed record wins (levels completed first,
  // then combined points).
  private mergeRosters(remote: TeamAccount[], local: TeamAccount[]): TeamAccount[] {
    const merged: TeamAccount[] = remote.map(t => ({ ...t }));
    const indexByName = new Map<string, number>();
    merged.forEach((t, idx) => {
      indexByName.set(String(t['Team Name'] || '').toLowerCase(), idx);
    });

    local.forEach(entry => {
      const name = String(entry['Team Name'] || '').toLowerCase();
      const existingIdx = indexByName.get(name);

      if (existingIdx === undefined) {
        indexByName.set(name, merged.length);
        merged.push({ ...entry });
        return;
      }

      const remoteRow = merged[existingIdx];
      const remoteCompleted = remoteRow['levels completion'] || 0;
      const localCompleted = entry['levels completion'] || 0;
      const remoteTotal = remoteRow['total level points'] || 0;
      const localTotal = entry['total level points'] || 0;

      if (localCompleted > remoteCompleted || (localCompleted === remoteCompleted && localTotal > remoteTotal)) {
        // Local is ahead: keep the remote identity so future PATCHes still match.
        merged[existingIdx] = { ...entry, id: remoteRow.id ?? entry.id };
      }
    });

    return this.withRequiredTeams(merged);
  }

  public async fetchAllTeams(): Promise<TeamAccount[]> {
    if (this.supabaseUrl && this.supabaseAnonKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/${this.tableName}?select=*&order="total level points".desc`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          const remoteTeams: TeamAccount[] = await res.json();
          if (Array.isArray(remoteTeams) && remoteTeams.length > 0) {
            const mergedTeams = this.mergeRosters(remoteTeams, this.getLocalTeams());
            this.saveLocalTeams(mergedTeams);
            return mergedTeams;
          }
        }
      } catch (e) {
        console.warn('Supabase fetchAllTeams failed, falling back to local storage:', e);
      }
    }

    return this.getLocalTeams();
  }

  public async authenticateTeam(teamName: string, password: string): Promise<{ success: boolean; team?: TeamAccount; message: string }> {
    const cleanName = teamName.trim();
    const cleanPass = password.trim();

    // 1. Try remote Supabase verification first if online
    if (this.supabaseUrl && this.supabaseAnonKey) {
      try {
        const queryUrl = `${this.supabaseUrl}/${this.tableName}?"Team Name"=eq.${encodeURIComponent(cleanName)}&select=*`;
        const res = await fetch(queryUrl, { headers: this.getHeaders() });
        if (res.ok) {
          const rows: TeamAccount[] = await res.json();
          if (rows && rows.length > 0) {
            const found = rows[0];
            if (found['Password'] === cleanPass) {
              this.setActiveAccount(found);
              return { success: true, team: found, message: 'Authentication successful' };
            } else {
              return { success: false, message: 'Invalid password. Please check your credentials.' };
            }
          }
        }
      } catch (e) {
        console.warn('Supabase authentication check failed, trying local DB:', e);
      }
    }

    // 2. Fallback to Local Storage Database (Seamless offline & trail admin)
    const localTeams = this.getLocalTeams();
    const found = localTeams.find(t => t['Team Name'].toLowerCase() === cleanName.toLowerCase());
    if (found) {
      if (found['Password'] === cleanPass) {
        this.setActiveAccount(found);
        return { success: true, team: found, message: 'Authentication successful (Local Sync)' };
      }
      return { success: false, message: 'Invalid team password' };
    }

    return { success: false, message: 'Team not found. Please register or check team name.' };
  }

  public async registerTeam(account: TeamAccount): Promise<{ success: boolean; team?: TeamAccount; message: string }> {
    const localTeams = this.getLocalTeams();
    const existing = localTeams.find(t => t['Team Name'].toLowerCase() === account['Team Name'].toLowerCase());
    if (existing) {
      return { success: false, message: 'A team with this Team Name already exists.' };
    }

    // Attempt Supabase insert
    if (this.supabaseUrl && this.supabaseAnonKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/${this.tableName}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(account)
        });
        if (res.ok) {
          const inserted = await res.json();
          const savedAccount = Array.isArray(inserted) && inserted.length > 0 ? inserted[0] : account;
          this.unmarkTeamRemoved(savedAccount['Team Name']);
          localTeams.push(savedAccount);
          this.saveLocalTeams(localTeams);
          this.setActiveAccount(savedAccount);
          return { success: true, team: savedAccount, message: 'Team successfully registered on Supabase' };
        }
      } catch (e) {
        console.warn('Supabase insert failed, saving to local store:', e);
      }
    }

    // Local save
    const newAccount: TeamAccount = { ...account, id: account.id || `team-${Date.now()}` };
    this.unmarkTeamRemoved(newAccount['Team Name']);
    localTeams.push(newAccount);
    this.saveLocalTeams(localTeams);
    this.setActiveAccount(newAccount);
    return { success: true, team: newAccount, message: 'Team registered successfully' };
  }

  /**
   * Permanently removes a team from the local roster and from Supabase. A
   * tombstone stops stale caches or remote rows from bringing it back, and a
   * re-registration of the same name clears the tombstone again.
   */
  public async deleteTeam(
    account: TeamAccount
  ): Promise<{ success: boolean; message: string }> {
    const name = account['Team Name'];
    if (!name) return { success: false, message: 'Team name is missing.' };

    try {
      const remaining = this.getLocalTeams().filter(
        team => this.normalizeName(team['Team Name']) !== this.normalizeName(name)
      );
      this.saveLocalTeams(remaining);
      this.markTeamRemoved(name);

      const current = this.getActiveAccount();
      if (current && this.normalizeName(current['Team Name']) === this.normalizeName(name)) {
        this.setActiveAccount(null);
      }
    } catch {
      return { success: false, message: 'Could not update the local team roster.' };
    }

    if (this.supabaseUrl && this.supabaseAnonKey) {
      try {
        const res = await fetch(
          `${this.supabaseUrl}/${this.tableName}?"Team Name"=eq.${encodeURIComponent(name)}`,
          { method: 'DELETE', headers: this.getHeaders() }
        );
        if (!res.ok) {
          return {
            success: true,
            message: 'Removed from this device, but Supabase rejected the delete (check table permissions).'
          };
        }
      } catch {
        return {
          success: true,
          message: 'Removed from this device, but Supabase could not be reached.'
        };
      }
    }

    return { success: true, message: 'Team removed.' };
  }

  public async updateTeamAccount(account: TeamAccount): Promise<boolean> {
    // Update local cache
    const localTeams = this.getLocalTeams();
    const idx = localTeams.findIndex(t => t['Team Name'].toLowerCase() === account['Team Name'].toLowerCase());
    if (idx >= 0) {
      localTeams[idx] = { ...localTeams[idx], ...account };
    } else {
      localTeams.push(account);
    }
    this.saveLocalTeams(localTeams);

    // Update active account if it matches
    const current = this.getActiveAccount();
    if (current && current['Team Name'].toLowerCase() === account['Team Name'].toLowerCase()) {
      this.setActiveAccount({ ...current, ...account });
    }

    // Sync to Supabase
    if (this.supabaseUrl && this.supabaseAnonKey) {
      try {
        const res = await fetch(`${this.supabaseUrl}/${this.tableName}?"Team Name"=eq.${encodeURIComponent(account['Team Name'])}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(account)
        });

        if (res.ok) {
          // An empty representation means no remote row carried that team name,
          // so the score would be thrown away by the next roster sync. Create it.
          const updated: TeamAccount[] = await res.json().catch(() => []);
          if (Array.isArray(updated) && updated.length === 0) {
            const insert = await fetch(`${this.supabaseUrl}/${this.tableName}`, {
              method: 'POST',
              headers: this.getHeaders(),
              body: JSON.stringify({
                ...account,
                id: account.id ?? `team-${Date.now()}`
              })
            });
            if (!insert.ok) {
              console.warn('Supabase insert for new team failed:', insert.status);
            }
          }
        } else {
          console.warn('Supabase patch returned', res.status);
        }
        return true;
      } catch (e) {
        console.warn('Failed to patch team to Supabase:', e);
      }
    }
    return true;
  }

  public getActiveAccount(): TeamAccount | null {
    try {
      const raw = localStorage.getItem(CURRENT_TEAM_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  public setActiveAccount(account: TeamAccount | null) {
    if (account) {
      localStorage.setItem(CURRENT_TEAM_KEY, JSON.stringify(account));
    } else {
      localStorage.removeItem(CURRENT_TEAM_KEY);
    }
  }

  // ========================
  // LEADERBOARD ADAPTER
  // ========================

  public async getLeaderboard(): Promise<TeamScoreEntry[]> {
    const teams = await this.fetchAllTeams();
    return teams.map(t => ({
      id: String(t.id || t['Team Name']),
      teamName: t['Team Name'],
      score: t['total level points'] || 0,
      timeRemainingSeconds: 200,
      timeElapsedSeconds: 160,
      attemptsUsed: 1,
      launchCode: `STAGE-${t['Current level']}`,
      completedAt: new Date().toISOString(),
      missionCompleted: (t['levels completion'] || 0) > 0
    })).sort((a, b) => b.score - a.score);
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
