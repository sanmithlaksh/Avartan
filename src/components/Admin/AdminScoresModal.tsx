// Administrator password-gated scoreboard for the welcome page
import React, { useEffect, useState } from 'react';
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
  Database
} from 'lucide-react';

const ADMIN_PASSWORD = 'avartan';

interface AdminScoresModalProps {
  open: boolean;
  onClose: () => void;
}

export const AdminScoresModal: React.FC<AdminScoresModalProps> = ({ open, onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [teams, setTeams] = useState<TeamAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  // Reset the terminal every time the modal is reopened
  useEffect(() => {
    if (open) return;
    setPassword('');
    setError(null);
    setAuthenticated(false);
    setTeams([]);
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

  const credentials = backendService.getCredentials();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/90 backdrop-blur-2xl animate-fade-in select-none">
      <div className="relative w-full max-w-4xl rounded-2xl bg-space-900/95 border border-cyan-500/40 p-6 md:p-8 shadow-[0_0_60px_rgba(0,243,255,0.25)] flex flex-col gap-5 max-h-[90vh]">
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
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 border ${
                    credentials.isConfigured
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                      : 'bg-space-950 border-cyan-500/30 text-cyan-400'
                  }`}
                >
                  <Database className="w-3 h-3" />
                  {credentials.isConfigured ? 'Supabase Live Sync' : 'Local Storage Mode'}
                </span>
                <button
                  onClick={() => setRefreshToken(t => t + 1)}
                  className="px-2.5 py-1.5 rounded-lg bg-space-950 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 text-[10px] font-orbit font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                  title="Refresh scores"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

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
                      </tr>
                    );
                  })}
                  {teams.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-mono text-xs">
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
