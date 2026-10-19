// Real-time Leaderboard & Tournament Standings Modal
import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { TeamAccount } from '../../engine/types';
import { backendService } from '../../utils/supabase';
import { Trophy, Medal, X, RefreshCw, Database, Users } from 'lucide-react';

export const LeaderboardModal: React.FC = () => {
  const {
    showLeaderboardModal,
    setShowLeaderboardModal,
    teamName
  } = useGame();

  const [teams, setTeams] = useState<TeamAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!showLeaderboardModal) return;
    setLoading(true);
    const unsubscribe = backendService.subscribeTeams((list) => {
      setTeams(list);
      setLoading(false);
    });
    // Keep standings live while the board is open, so scores saved by other
    // squads appear without closing the modal.
    const interval = window.setInterval(() => {
      backendService.fetchAllTeams().then(setTeams).catch(() => undefined);
    }, 5000);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [showLeaderboardModal]);

  const ranked = useMemo(
    () => [...teams].sort((a, b) => (b['total level points'] || 0) - (a['total level points'] || 0)),
    [teams]
  );

  if (!showLeaderboardModal) return null;

  const credentials = backendService.getCredentials();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/85 backdrop-blur-2xl animate-fade-in select-none">
      <div className="relative w-full max-w-4xl rounded-2xl bg-space-900/95 border border-cyan-500/40 p-6 md:p-8 shadow-[0_0_60px_rgba(0,243,255,0.3)] flex flex-col gap-5 max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={() => setShowLeaderboardModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-space-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-orbit font-extrabold text-slate-100 tracking-wide">
                CELESTIAL ALIGNMENT LEADERBOARD
              </h2>
              <span className="text-xs text-slate-400">
                Official Tournament Rankings • All Enrolled Squadrons (45-50 Teams)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 border ${
              credentials.isConfigured
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : 'bg-space-950 border-cyan-500/30 text-cyan-400'
            }`}>
              <Database className="w-3 h-3" />
              {credentials.isConfigured ? 'Supabase Live Sync' : 'Local Storage Mode'}
            </span>
          </div>
        </div>

        {/* Standings Table */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-cyan-500/20 bg-space-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-space-900/80 text-[10px] font-orbit uppercase tracking-wider text-slate-400 border-b border-cyan-500/20 sticky top-0 backdrop-blur-md">
              <tr>
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Team Name</th>
                <th className="py-3 px-3">Members (Name 1 / Name 2)</th>
                <th className="py-3 px-2 text-center">Current Level</th>
                <th className="py-3 px-2 text-center">Levels Compl.</th>
                <th className="py-3 px-2 text-right">L1 Pts</th>
                <th className="py-3 px-2 text-right">L2 Pts</th>
                <th className="py-3 px-2 text-right">L3 Pts</th>
                <th className="py-3 px-3 text-right">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/10">
              {ranked.map((entry, index) => {
                const isCurrentTeam = entry['Team Name'].toLowerCase() === teamName.toLowerCase();
                const rankColor =
                  index === 0
                    ? 'text-amber-300 font-bold'
                    : index === 1
                    ? 'text-slate-300 font-bold'
                    : index === 2
                    ? 'text-amber-600 font-bold'
                    : 'text-slate-400';

                return (
                  <tr
                    key={entry.id || index}
                    className={`transition-colors ${
                      isCurrentTeam ? 'bg-cyan-950/40 font-semibold text-cyan-200' : 'hover:bg-space-900/40'
                    }`}
                  >
                    <td className="py-3 px-3 font-orbit">
                      <div className="flex items-center gap-1.5">
                        {index < 3 ? <Medal className={`w-4 h-4 ${rankColor}`} /> : null}
                        <span className={rankColor}>#{index + 1}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-200 font-sans">
                      {entry['Team Name']}
                      {isCurrentTeam && (
                        <span className="ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          YOU
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-slate-400 font-sans">
                      {entry['Name 1']}{entry['Name 2'] ? ` & ${entry['Name 2']}` : ''}
                    </td>

                    <td className="py-3 px-2 text-center font-mono text-cyan-400 font-bold">
                      L{entry['Current level']}
                    </td>

                    <td className="py-3 px-2 text-center font-mono text-slate-400">
                      {entry['levels completion'] || 0}
                    </td>

                    <td className="py-3 px-2 text-right font-mono text-slate-300">
                      {entry['level 1 points'] || 0}
                    </td>

                    <td className="py-3 px-2 text-right font-mono text-slate-300">
                      {entry['level 2 points'] || 0}
                    </td>

                    <td className="py-3 px-2 text-right font-mono text-slate-300">
                      {entry['level 3 points'] || 0}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                      {entry['total level points'] || 0} PTS
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20 text-xs">
          <button
            onClick={() => backendService.fetchAllTeams().then(setTeams)}
            className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 font-orbit"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh Live Roster
          </button>

          <button
            onClick={() => setShowLeaderboardModal(false)}
            className="px-5 py-2 rounded-xl bg-space-900 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 font-orbit font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
