// Supabase & Offline Leaderboard + Team User Management Integration
import { TeamScoreEntry, TeamAccount } from '../engine/types';

const STORAGE_KEY = 'the_hidden_orbit_leaderboard';
const TEAMS_STORAGE_KEY = 'avartan_teams_accounts';
const CURRENT_TEAM_KEY = 'avartan_active_team_account';

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
  }
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

    // Initialize local accounts cache if empty
    if (!localStorage.getItem(TEAMS_STORAGE_KEY)) {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(SEED_TEAMS));
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
    try {
      const raw = localStorage.getItem(TEAMS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse local teams:', e);
    }
    return SEED_TEAMS;
  }

  public saveLocalTeams(teams: TeamAccount[]) {
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
    this.teamListeners.forEach(fn => fn(teams));
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
            this.saveLocalTeams(remoteTeams);
            return remoteTeams;
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
    localTeams.push(newAccount);
    this.saveLocalTeams(localTeams);
    this.setActiveAccount(newAccount);
    return { success: true, team: newAccount, message: 'Team registered successfully' };
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
        await fetch(`${this.supabaseUrl}/${this.tableName}?"Team Name"=eq.${encodeURIComponent(account['Team Name'])}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(account)
        });
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
