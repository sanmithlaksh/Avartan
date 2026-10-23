// Administrator Game Configuration and Celestial Ephemeris Management Panel
import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { PRESET_MISSIONS, validateMissionSolvability } from '../../engine/missions';
import { PLANET_DEFINITIONS, ZODIAC_SECTORS } from '../../engine/astronomy';
import { backendService } from '../../utils/supabase';
import { TeamAccount } from '../../engine/types';
import {
  Settings,
  Shield,
  Clock,
  Compass,
  Database,
  RotateCcw,
  CheckCircle2,
  X,
  EyeOff,
  Users,
  Award,
  Layers,
  Edit3,
  RefreshCw,
  Trophy
} from 'lucide-react';

const EARTH_PRESETS = [
  { label: 'Vernal Equinox (March 21)', node: 0, deg: 0 },
  { label: 'Summer Solstice (June 21)', node: 3, deg: 90 },
  { label: 'Autumnal Equinox (Sept 23)', node: 6, deg: 180 },
  { label: 'Winter Solstice (Dec 21)', node: 9, deg: 270 }
];

export const AdminPanel: React.FC = () => {
  const {
    showAdminModal,
    setShowAdminModal,
    settings,
    updateSettings,
    currentMissionIndex,
    setMissionByIndex,
    currentMission,
    restartGame,
    activeAccount,
    updateActiveTeamLevel,
    startDemoRound
  } = useGame();

  const [supabaseUrl, setSupabaseUrl] = useState(backendService.getCredentials().url);
  const [supabaseKey, setSupabaseKey] = useState(backendService.getCredentials().key);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamAccount[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamAccount | null>(null);
  const [showDemoChoices, setShowDemoChoices] = useState(false);

  // Load the roster and keep it live while the console is open
  useEffect(() => {
    if (!showAdminModal) return;

    const load = () => {
      backendService.fetchAllTeams().then(list => {
        setTeams(list);
        if (activeAccount) {
          const found = list.find(t => t['Team Name'] === activeAccount['Team Name']);
          if (found) setSelectedTeam(found);
        }
      });
    };

    load();
    const interval = window.setInterval(load, 5000);
    return () => window.clearInterval(interval);
  }, [showAdminModal, activeAccount]);

  const rankedTeams = useMemo(
    () => [...teams].sort((a, b) => (b['total level points'] || 0) - (a['total level points'] || 0)),
    [teams]
  );

  if (!showAdminModal) return null;

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    backendService.setCredentials(supabaseUrl.trim(), supabaseKey.trim());
    setDbStatus('Supabase configuration saved. Synchronization active.');
    setTimeout(() => setDbStatus(null), 3500);
  };

  const handleUpdateTeamLevel = (team: TeamAccount, newLevel: number) => {
    const updated: TeamAccount = {
      ...team,
      'Current level': newLevel,
      'levels completion': team['levels completion'] || 0
    };
    backendService.updateTeamAccount(updated);
    setTeams(prev => prev.map(t => (t['Team Name'] === team['Team Name'] ? updated : t)));
    if (activeAccount && activeAccount['Team Name'] === team['Team Name']) {
      updateActiveTeamLevel(newLevel);
    }
  };

  const handleResetTeam = (team: TeamAccount) => {
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
    backendService.updateTeamAccount(updated);
    setTeams(prev => prev.map(t => (t['Team Name'] === team['Team Name'] ? updated : t)));
    if (activeAccount && activeAccount['Team Name'] === team['Team Name']) {
      // Reset active session state if it's the same team
      restartGame();
    }
  };

  const validation = validateMissionSolvability(currentMission, settings.earthStartingNode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/90 animate-fade-in select-none">
      <div className="relative w-full max-w-4xl rounded-2xl bg-space-900/95 border border-cyan-500/40 p-6 md:p-8 shadow-[0_0_60px_rgba(0,243,255,0.3)] flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setShowAdminModal(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-space-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
            <Settings className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-orbit font-extrabold text-slate-100 tracking-wide">
              ADMINISTRATIVE GAME & USER MANAGEMENT CONSOLE
            </h2>
            <span className="text-xs text-slate-400">
              Manage 45-50 Participating Squadrons, Testing Level Overrides, and Supabase Sync
            </span>
          </div>
        </div>

        {/* Section 1: Testing Level Controls & Active Level Override */}
        <div className="p-4 rounded-xl bg-space-950/70 border border-cyan-500/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-orbit uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-amber-400" />
              Testing Phase: Level Override for Active Squadron
            </span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              Round 2 scores saved automatically
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-300 font-sans">
              Switch active simulation level:
            </span>
            <div className="flex gap-2">
              {[1, 2, 3].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => updateActiveTeamLevel(lvl)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-orbit font-bold transition-all ${
                    currentMissionIndex + 1 === lvl
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                      : 'bg-space-900 border border-cyan-500/30 text-slate-300 hover:border-cyan-400'
                  }`}
                >
                  Level 0{lvl}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-300 font-sans">Demo Play:</span>
              <button
                type="button"
                onClick={() => setShowDemoChoices(v => !v)}
                className="px-3 py-1.5 rounded-lg text-xs font-orbit font-bold bg-purple-900/60 border border-purple-400/60 text-purple-200 hover:bg-purple-800/70 transition-all"
              >
                Demo {showDemoChoices ? '▾' : '▸'}
              </button>
              {showDemoChoices && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startDemoRound(1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-orbit font-bold bg-space-950 border border-cyan-400/50 text-cyan-200 hover:bg-cyan-950/60 transition-all"
                  >
                    Round 1
                  </button>
                  <button
                    type="button"
                    onClick={() => startDemoRound(2)}
                    className="px-3 py-1.5 rounded-lg text-xs font-orbit font-bold bg-space-950 border border-fuchsia-400/50 text-fuchsia-200 hover:bg-fuchsia-950/60 transition-all"
                  >
                    Round 2
                  </button>
                </div>
              )}
            </div>
            <span className="text-xs font-mono text-slate-400 ml-auto">
              Current Mission: <strong className="text-cyan-300 font-bold">{currentMission.title}</strong>
            </span>
          </div>
        </div>

        {/* Section 2: 45-50 User & Team Management Table */}
        <div className="p-4 rounded-xl bg-space-950/70 border border-cyan-500/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-orbit uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              Squadron Roster & Score Card ({teams.length} Teams Enrolled)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">
                Ranked by combined Round 1 + Round 2 score
              </span>
              <button
                type="button"
                onClick={() => backendService.fetchAllTeams().then(setTeams)}
                className="px-2 py-1 rounded-md border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 text-[10px] font-orbit uppercase tracking-wider flex items-center gap-1 transition-all duration-200 cursor-pointer"
                title="Refresh scores"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto rounded-lg border border-cyan-500/20 bg-space-900/50">
            <table className="w-full text-left text-xs">
              <thead className="bg-space-950 text-[10px] font-orbit uppercase tracking-wider text-slate-400 border-b border-cyan-500/20 sticky top-0">
                <tr>
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-3">Team Name</th>
                  <th className="py-2 px-3">Name 1 / Name 2</th>
                  <th className="py-2 px-2">Password</th>
                  <th className="py-2 px-2 text-center">Current Level</th>
                  <th className="py-2 px-2 text-center">Levels Compl.</th>
                  <th className="py-2 px-2 text-right">L1 Pts</th>
                  <th className="py-2 px-2 text-right">L2 Pts</th>
                  <th className="py-2 px-2 text-right">L3 Pts</th>
                  <th className="py-2 px-3 text-right">Total Pts</th>
                  <th className="py-2 px-2 text-center">Reset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/10 font-mono text-[11px]">
                {rankedTeams.map((t, idx) => (
                  <tr key={t.id || t['Team Name']} className="hover:bg-cyan-950/30 transition-colors">
                    <td className="py-2 px-2 font-bold text-slate-400">
                      {idx === 0 ? <Trophy className="w-3.5 h-3.5 text-amber-300" /> : idx + 1}
                    </td>
                    <td className="py-2 px-3 font-bold text-cyan-300 font-orbit">
                      {t['Team Name']}
                    </td>
                    <td className="py-2 px-3 text-slate-300 font-sans">
                      {t['Name 1'] || 'N/A'}{t['Name 2'] ? ` / ${t['Name 2']}` : ''}
                    </td>
                    <td className="py-2 px-2 text-slate-400">
                      {t['Password']}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <select
                        value={t['Current level']}
                        onChange={e => handleUpdateTeamLevel(t, parseInt(e.target.value))}
                        className="bg-space-950 border border-cyan-500/40 rounded px-1.5 py-0.5 text-amber-300 font-bold focus:outline-none"
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                      </select>
                    </td>
                    <td className="py-2 px-2 text-center text-slate-400 font-bold">
                      {t['levels completion'] || 0}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-300">
                      {t['level 1 points'] || 0}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-300">
                      {t['level 2 points'] || 0}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-300">
                      {t['level 3 points'] || 0}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-amber-400">
                      {t['total level points'] || 0}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => handleResetTeam(t)}
                        className="px-2 py-1 rounded-md bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-[10px] font-orbit uppercase tracking-wider flex items-center gap-1 mx-auto transition-all"
                        title="Reset scores and rounds"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Earth Vantage & Reference Position */}
        <div className="p-4 rounded-xl bg-space-950/70 border border-cyan-500/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-orbit uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              Earth Reference Vantage (Locked Pivot)
            </span>
            <span className="text-xs font-mono text-slate-300">
              Current: Node {settings.earthStartingNode} ({settings.earthStartingNode * 30}°)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EARTH_PRESETS.map((preset) => (
              <button
                key={preset.node}
                onClick={() => {
                  updateSettings({
                    earthStartingNode: preset.node,
                    earthDateLabel: preset.label
                  });
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  settings.earthStartingNode === preset.node
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.2)]'
                    : 'bg-space-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-[11px] font-orbit font-bold">{preset.label}</div>
                <div className="text-[9px] font-mono text-cyan-400">Node {preset.node} • {preset.deg}°</div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 4: Supabase Integration Settings */}
        <form onSubmit={handleSaveSupabase} className="p-4 rounded-xl bg-space-950/70 border border-cyan-500/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-orbit uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              Supabase REST Configuration
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Realtime Postgres Engine</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="https://xyz.supabase.co/rest/v1"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              className="p-2 rounded-lg bg-space-900 border border-cyan-500/30 text-xs font-mono text-slate-200 focus:outline-none"
            />
            <input
              type="password"
              placeholder="API Publishable Key"
              value={supabaseKey}
              onChange={e => setSupabaseKey(e.target.value)}
              className="p-2 rounded-lg bg-space-900 border border-cyan-500/30 text-xs font-mono text-slate-200 focus:outline-none"
            />
          </div>

          {dbStatus && (
            <span className="text-xs text-emerald-400 font-mono">{dbStatus}</span>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-orbit font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all cursor-pointer"
            >
              Update Supabase Credentials
            </button>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20">
          <button
            onClick={restartGame}
            className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 font-orbit font-bold text-xs uppercase tracking-wider hover:bg-rose-900/60 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart Simulation
          </button>

          <button
            onClick={() => setShowAdminModal(false)}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-orbit font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            Save & Exit
          </button>
        </div>
      </div>
    </div>
  );
};
