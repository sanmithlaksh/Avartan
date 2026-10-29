// Administrator password-gated scoreboard for the welcome page
import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { backendService } from '../../utils/supabase';
import { TeamAccount } from '../../engine/types';
import { soundFx } from '../../utils/audio';
import {
  Shield,
  X,
  Lock,
  Trophy,
  RefreshCw,
  AlertCircle,
  Medal,
  Users,
  Database,
  RotateCcw,
  Plus,
  Trash2,
  Gamepad2,
  ChevronDown,
  Rocket,
  Grid3x3,
  Satellite
} from 'lucide-react';

const ADMIN_PASSWORD = 'void2026';

interface AdminScoresModalProps {
  open: boolean;
  onClose: () => void;
}

export const AdminScoresModal: React.FC<AdminScoresModalProps> = ({ open, onClose }) => {
  const { startDemoRound } = useGame();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [teams, setTeams] = useState<TeamAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPass, setNewTeamPass] = useState('');
  const [newTeamName1, setNewTeamName1] = useState('');
  const [newTeamName2, setNewTeamName2] = useState('');
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [dbMessage, setDbMessage] = useState('');
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  // Reset the terminal every time the modal is reopened
  useEffect(() => {
    if (open) return;
    setPassword('');
    setError(null);
    setAuthenticated(false);
    setTeams([]);
    setShowDemoMenu(false);
  }, [open]);

  // Load the full team roster after a successful login
  useEffect(() => {
    if (!open || !authenticated) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    backendService
      .fetchAllTeams()
      .then(list => {
        if (cancelled) return;
        setTeams(
          [...list].sort(
            (a, b) => (b['total level points'] || 0) - (a['total level points'] || 0)
          )
        );
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load team scores. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, authenticated, refreshToken]);

  // Probe the database once the admin is signed in so the status chip reflects
  // the real link rather than just "credentials exist".
  useEffect(() => {
    if (!open || !authenticated) return;
    let cancelled = false;
    setDbStatus('checking');
    backendService.checkConnection().then(res => {
      if (cancelled) return;
      setDbStatus(res.online ? 'online' : 'offline');
      setDbMessage(res.message);
    });
    return () => {
      cancelled = true;
    };
  }, [open, authenticated, refreshToken]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD) {
      setPassword('');
      setError(null);
      setAuthenticated(true);
      soundFx.playSuccessTone();
    } else {
      setError('ACCESS DENIED — Invalid administrator password.');
      soundFx.playErrorTone();
    }
  };

  const handleResetTeam = async (team: TeamAccount) => {
    const confirmed = window.confirm(`Reset scores and progress for team "${team['Team Name']}"?`);
    if (!confirmed) return;
    const updated: TeamAccount = {
      ...team,
      'Current level': 1,
      'levels completion': 0,
      'level 1 points': 0,
      'level 2 points': 0,
      'level 3 points': 0,
      'total level points': 0
    };
    await backendService.updateTeamAccount(updated);
    setTeams(prev => prev.map(t => (t['Team Name'] === team['Team Name'] ? updated : t)));
    setRefreshToken(t => t + 1);
  };

  const handleDeleteTeam = async (team: TeamAccount) => {
    const confirmed = window.confirm(
      `Permanently remove team "${team['Team Name']}"? Their scores and login will be deleted.`
    );
    if (!confirmed) return;

    const res = await backendService.deleteTeam(team);
    if (!res.success) {
      setError(res.message || 'Failed to remove team');
      soundFx.playErrorTone();
      return;
    }

    setTeams(prev => prev.filter(t => t['Team Name'] !== team['Team Name']));
    setRefreshToken(t => t + 1);
    if (res.message !== 'Team removed.') setError(res.message);
    else setError(null);
    soundFx.playSuccessTone();
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamPass.trim()) {
      setError('Team name and password required');
      return;
    }
    const account: TeamAccount = {
      id: `team-${Date.now()}`,
      'Name 1': newTeamName1.trim(),
      'Name 2': newTeamName2.trim(),
      'Team Name': newTeamName.trim(),
      'Password': newTeamPass.trim(),
      'Current level': 1,
      'levels completion': 0,
      'level 1 points': 0,
      'level 2 points': 0,
      'level 3 points': 0,
      'total level points': 0
    };
    const res = await backendService.registerTeam(account);
    if (res.success) {
      setShowAddTeam(false);
      setNewTeamName('');
      setNewTeamPass('');
      setNewTeamName1('');
      setNewTeamName2('');
      setError(null);
      setRefreshToken(t => t + 1);
      soundFx.playSuccessTone();
    } else {
      setError(res.message || 'Failed to add team');
      soundFx.playErrorTone();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/95 animate-fade-in select-none">
      <div className="relative w-full max-w-6xl rounded-2xl bg-space-900/95 border border-cyan-500/40 p-6 md:p-10 shadow-[0_0_60px_rgba(0,243,255,0.25)] flex flex-col gap-5 max-h-[94vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-space-800 transition-all cursor-pointer"
          title="Close admin terminal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-10">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg md:text-xl font-orbit font-extrabold text-slate-100 tracking-wide">
              {authenticated ? 'ADMINISTRATOR SCOREBOARD' : 'ADMIN ACCESS TERMINAL'}
            </h2>
            <span className="text-[11px] text-slate-400 font-mono tracking-wider uppercase">
              {authenticated
                ? 'Official team standings • All enrolled teams'
                : 'Restricted console • Authorised personnel only'}
            </span>
          </div>
        </div>

        {!authenticated ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
            <div className="p-4 rounded-xl bg-space-950/70 border border-cyan-500/25 flex flex-col gap-3">
              <label className="text-[11px] font-orbit uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Administrator Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter administrator password"
                autoFocus
                data-testid="admin-password-input"
                className="w-full px-4 py-2.5 rounded-xl bg-space-950 border border-cyan-500/30 text-cyan-200 font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                data-testid="admin-authenticate"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 font-orbit font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,243,255,0.35)] cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                AUTHENTICATE
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-orbit uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Team Scores ({teams.length} {teams.length === 1 ? 'Team' : 'Teams'})
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {dbStatus === 'online' && (
                  <span
                    title={dbMessage || undefined}
                    className="px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 border bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
                  >
                    <Database className="w-3 h-3" />
                    Supabase Live Sync
                  </span>
                )}
                <button
                  onClick={() => setShowAddTeam(true)}
                  className="px-3 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 text-[11px] font-orbit font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Add team"
                >
                  <Plus className="w-4 h-4" />
                  Add Team
                </button>
                <button
                  onClick={() => setShowDemoMenu(v => !v)}
                  className="px-3 py-2 rounded-lg bg-purple-950/60 border border-purple-400/60 text-purple-200 hover:bg-purple-900/70 text-[11px] font-orbit font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Choose a demo round"
                  data-testid="demo-menu-toggle"
                >
                  <Gamepad2 className="w-4 h-4" />
                  Demo
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDemoMenu ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => setRefreshToken(t => t + 1)}
                  className="px-3 py-2 rounded-lg bg-space-950 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 text-[11px] font-orbit font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Refresh scores"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {showDemoMenu && (
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-orbit uppercase tracking-widest text-purple-200">
                    Choose a demo round
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Temporary scores • nothing is saved
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const totalInput = window.prompt('Demo Round 1 - Total time in seconds (e.g., 2100 for 35 min):', '300');
                      const lockInput = window.prompt('Demo Round 1 - PIN lock time in seconds (time until code terminal opens, e.g., 60 for 1 min):', '60');
                      const total = parseInt(totalInput || '300');
                      const lock = parseInt(lockInput || '60');
                      if (!isNaN(total) && !isNaN(lock)) {
                        // We need to pass these - but startDemoRound doesn't take params
                        // Store in localStorage temporarily
                        localStorage.setItem('demo_round1_total', total.toString());
                        localStorage.setItem('demo_round1_lock', lock.toString());
                      }
                      startDemoRound(1);
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-space-950/80 border border-cyan-500/40 text-left hover:border-cyan-300 hover:bg-cyan-950/30 transition-all cursor-pointer"
                  >
                    <span className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-300">
                      <Rocket className="w-5 h-5" />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-orbit font-bold text-sm text-slate-100">Demo Round 1 — Rerun</span>
                      <span className="text-[10px] text-slate-400">Celestial Alignment</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => startDemoRound(2)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-space-950/80 border border-fuchsia-500/40 text-left hover:border-fuchsia-300 hover:bg-fuchsia-950/30 transition-all cursor-pointer"
                  >
                    <span className="p-2 rounded-lg bg-fuchsia-500/15 border border-fuchsia-400/40 text-fuchsia-300">
                      <Grid3x3 className="w-5 h-5" />
                    </span>
                    <span className="flex flex-col">
                      <span className="font-orbit font-bold text-sm text-slate-100">Demo Round 2 — Rerun</span>
                      <span className="text-[10px] text-slate-400">Pattern Recognition</span>
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => startDemoRound(3)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-space-950/80 border border-purple-500/40 text-left hover:border-purple-300 hover:bg-purple-950/30 transition-all cursor-pointer"
                >
                  <span className="p-2 rounded-lg bg-purple-500/15 border border-purple-400/40 text-purple-300">
                    <Satellite className="w-5 h-5" />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-orbit font-bold text-sm text-slate-100">Demo Round 3</span>
                    <span className="text-[10px] text-slate-400">Marsfall • Final Round</span>
                  </span>
                </button>
              </div>
            )}

            <div className="overflow-y-auto rounded-xl border border-cyan-500/20 bg-space-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-space-900/80 text-[10px] font-orbit uppercase tracking-wider text-slate-400 border-b border-cyan-500/20 sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Team Name</th>
                    <th className="py-3 px-3">Members</th>
                    <th className="py-3 px-2 text-center">Level</th>
                    <th className="py-3 px-2 text-right">L1 Pts</th>
                    <th className="py-3 px-2 text-right">L2 Pts</th>
                    <th className="py-3 px-2 text-right">L3 Pts</th>
                    <th className="py-3 px-3 text-right">Total Points</th>
                    <th className="py-3 px-2 text-center">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10">
                  {teams.map((team, index) => {
                    const rankColor =
                      index === 0
                        ? 'text-amber-300'
                        : index === 1
                        ? 'text-slate-300'
                        : index === 2
                        ? 'text-amber-600'
                        : 'text-slate-400';

                    return (
                      <tr key={team.id || team['Team Name']} className="hover:bg-space-900/40 transition-colors">
                        <td className="py-3 px-3 font-orbit">
                          <div className="flex items-center gap-1.5">
                            {index < 3 ? <Medal className={`w-4 h-4 ${rankColor}`} /> : null}
                            <span className={`${rankColor} font-bold`}>#{index + 1}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-orbit font-bold text-cyan-300">
                          {team['Team Name']}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-sans">
                          {team['Name 1'] || team['Name 2']
                            ? `${team['Name 1'] || ''}${team['Name 2'] ? ` & ${team['Name 2']}` : ''}`
                            : '—'}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-cyan-400 font-bold">
                          L{team['Current level'] || 1}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-slate-300">
                          {team['level 1 points'] || 0}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-slate-300">
                          {team['level 2 points'] || 0}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-slate-300">
                          {team['level 3 points'] || 0}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                          {team['total level points'] || 0} PTS
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleResetTeam(team)}
                              className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition-all cursor-pointer"
                              title="Reset team scores"
                              data-testid={`team-reset-${team['Team Name']}`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team)}
                              className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 transition-all cursor-pointer"
                              title="Remove team"
                              data-testid={`team-delete-${team['Team Name']}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {teams.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-mono text-xs">
                        {loading ? 'SYNCING TEAM ROSTER...' : 'NO TEAMS FOUND'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {showAddTeam && (
              <div className="p-4 rounded-xl bg-space-950/80 border border-cyan-500/30 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-orbit uppercase tracking-wider text-cyan-400">Add New Team</span>
                  <button
                    onClick={() => setShowAddTeam(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleAddTeam} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Team Name"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-space-950 border border-cyan-500/30 text-sm text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="Password"
                    value={newTeamPass}
                    onChange={e => setNewTeamPass(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-space-950 border border-cyan-500/30 text-sm text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="Member 1"
                    value={newTeamName1}
                    onChange={e => setNewTeamName1(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-space-950 border border-cyan-500/30 text-sm text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="Member 2"
                    value={newTeamName2}
                    onChange={e => setNewTeamName2(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-space-950 border border-cyan-500/30 text-sm text-slate-200"
                  />
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-orbit uppercase tracking-wider"
                    >
                      Add Team
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20">
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                <Trophy className="w-3 h-3 text-amber-400" />
                Sorted by total level points
              </span>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-space-900 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 font-orbit font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
