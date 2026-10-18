// Supabase & Offline Leaderboard Integration
// Seamlessly operates in offline / local-storage mode, with optional live Supabase backend.
import { TeamScoreEntry } from '../engine/types';

const STORAGE_KEY = 'the_hidden_orbit_leaderboard';

const DEFAULT_SEEDED_SCORES: TeamScoreEntry[] = [
  {
    id: 'team-pulsar',
    teamName: 'Apex Stellar Dynamics',
    score: 850,
    timeRemainingSeconds: 215,
    timeElapsedSeconds: 145,
    attemptsUsed: 1,
    launchCode: 'ORBIT-VEGA-9021',
    completedAt: '2026-10-17T20:15:00Z',
    missionCompleted: true
  },
  {
    id: 'team-andromeda',
    teamName: 'Vanguard Voidrunners',
    score: 720,
    timeRemainingSeconds: 180,
    timeElapsedSeconds: 180,
    attemptsUsed: 2,
    launchCode: 'ORBIT-CYGNUS-4412',
    completedAt: '2026-10-17T21:40:00Z',
    missionCompleted: true
  },
  {
    id: 'team-nebula',
    teamName: 'Cosmic Chronos Crew',
    score: 640,
    timeRemainingSeconds: 95,
    timeElapsedSeconds: 265,
    attemptsUsed: 2,
    launchCode: 'ORBIT-DRACO-7833',
    completedAt: '2026-10-17T22:10:00Z',
    missionCompleted: true
  },
  {
    id: 'team-solaris',
    teamName: 'Heliocentric Phalanx',
    score: 510,
    timeRemainingSeconds: 40,
    timeElapsedSeconds: 320,
    attemptsUsed: 3,
    launchCode: 'ORBIT-ORION-1109',
    completedAt: '2026-10-17T22:50:00Z',
    missionCompleted: true
  }
];

class BackendService {
  private supabaseUrl: string = '';
  private supabaseAnonKey: string = '';
  private listeners: Array<(entries: TeamScoreEntry[]) => void> = [];

  constructor() {
    this.supabaseUrl = localStorage.getItem('supabase_url') || '';
    this.supabaseAnonKey = localStorage.getItem('supabase_anon_key') || '';
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEEDED_SCORES));
    }
  }

  public setCredentials(url: string, key: string) {
    this.supabaseUrl = url;
    this.supabaseAnonKey = key;
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_anon_key', key);
  }

  public getCredentials() {
    return {
      url: this.supabaseUrl,
      key: this.supabaseAnonKey,
      isConfigured: !!(this.supabaseUrl && this.supabaseAnonKey)
    };
  }

  public async getLeaderboard(): Promise<TeamScoreEntry[]> {
    // If Supabase configured, attempt fetching via REST API
    if (this.supabaseUrl && this.supabaseAnonKey) {
      try {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/leaderboard?select=*&order=score.desc,timeRemainingSeconds.desc`, {
          headers: {
            'apikey': this.supabaseAnonKey,
            'Authorization': `Bearer ${this.supabaseAnonKey}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const remoteData = await response.json();
          if (Array.isArray(remoteData) && remoteData.length > 0) {
            return remoteData;
          }
        }
      } catch (e) {
        console.warn('Supabase fetch failed, falling back to local database:', e);
      }
    }

    // Fallback: LocalStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list: TeamScoreEntry[] = JSON.parse(raw);
        return list.sort((a, b) => b.score - a.score || b.timeRemainingSeconds - a.timeRemainingSeconds);
      }
    } catch {}

    return DEFAULT_SEEDED_SCORES;
  }

  public async saveTeamScore(entry: TeamScoreEntry): Promise<void> {
    // Update local storage first
    let currentList = await this.getLeaderboard();
    const existingIdx = currentList.findIndex(e => e.id === entry.id || e.teamName === entry.teamName);
    if (existingIdx >= 0) {
      if (entry.score > currentList[existingIdx].score) {
        currentList[existingIdx] = entry;
      }
    } else {
      currentList.push(entry);
    }

    currentList = currentList.sort((a, b) => b.score - a.score || b.timeRemainingSeconds - a.timeRemainingSeconds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));

    // Try Supabase insert if configured
    if (this.supabaseUrl && this.supabaseAnonKey) {
      try {
        await fetch(`${this.supabaseUrl}/rest/v1/leaderboard`, {
          method: 'POST',
          headers: {
            'apikey': this.supabaseAnonKey,
            'Authorization': `Bearer ${this.supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(entry)
        });
      } catch (e) {
        console.warn('Failed to sync score to Supabase:', e);
      }
    }

    // Notify listeners
    this.listeners.forEach(fn => fn(currentList));
  }

  public subscribe(callback: (entries: TeamScoreEntry[]) => void): () => void {
    this.listeners.push(callback);
    this.getLeaderboard().then(callback);
    return () => {
      this.listeners = this.listeners.filter(fn => fn !== callback);
    };
  }

  public resetLeaderboard() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEEDED_SCORES));
    this.listeners.forEach(fn => fn(DEFAULT_SEEDED_SCORES));
  }
}

export const backendService = new BackendService();
