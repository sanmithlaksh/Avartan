// Administrator Game Configuration and Celestial Ephemeris Management Panel
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { PRESET_MISSIONS, generateDynamicMission, validateMissionSolvability } from '../../engine/missions';
import { PLANET_DEFINITIONS, ZODIAC_SECTORS } from '../../engine/astronomy';
import { backendService } from '../../utils/supabase';
import {
  Settings,
  Shield,
  Clock,
  Compass,
  Database,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  X,
  Shuffle,
  EyeOff
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
    restartGame
  } = useGame();

  const [supabaseUrl, setSupabaseUrl] = useState(backendService.getCredentials().url);
  const [supabaseKey, setSupabaseKey] = useState(backendService.getCredentials().key);
  const [dbStatus, setDbStatus] = useState<string | null>(null);

  if (!showAdminModal) return null;

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    backendService.setCredentials(supabaseUrl.trim(), supabaseKey.trim());
    setDbStatus('Supabase configuration saved. Synchronization active.');
    setTimeout(() => setDbStatus(null), 3500);
  };

  // Inspect valid solutions for administrator
  const validation = validateMissionSolvability(currentMission, settings.earthStartingNode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/85 backdrop-blur-2xl animate-fade-in select-none">
      <div className="relative w-full max-w-3xl rounded-2xl bg-space-900/95 border border-cyan-500/40 p-6 md:p-8 shadow-[0_0_60px_rgba(0,243,255,0.3)] flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
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
              ADMINISTRATIVE GAME CALIBRATION
            </h2>
            <span className="text-xs text-slate-400">
              Configure Earth Ephemeris, Mission Sequences, Timer, and Backend Database
            </span>
          </div>
        </div>

        {/* Section 1: Earth Vantage & Reference Position */}
        <div className="p-4 rounded-xl bg-space-950/70 border border-cyan-500/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-orbit uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              Earth Reference Position (Locked Observer)
            </span>
            <span className="text-xs font-mono text-slate-300">
              Current: Node {settings.earthStartingNode} ({settings.earthStartingNode * 30}°)
            </span>
          </div>

          <p className="text-xs text-slate-400 font-sans">
            A calendar month alone does not define an exact astronomical coordinate. Select a defined astronomical epoch or orbital node.
          </p>

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

        {/* Section 2: Mission Stages & Math Verification */}
        <div className="p-4 rounded-xl bg-space-950/70 border border-cyan-500/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-orbit uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Active Mission Selection & Math Solver
            </span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {validation.isSolvable ? 'Mathematically Verified' : 'Unsolvable'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_MISSIONS.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => setMissionByIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-orbit transition-all ${
                  currentMissionIndex === idx
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'bg-space-900 border border-cyan-500/20 text-slate-300 hover:border-cyan-400'
                }`}
              >
                Stage 0{idx + 1}: {m.title.split(':')[0]}
              </button>
            ))}
          </div>

          {/* Admin Solution Inspector */}
          <div className="p-3 rounded-lg bg-space-900/60 border border-cyan-500/10 flex flex-col gap-1.5">
            <span className="text-[10px] font-orbit uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              Authoritative Solution Key (Admin Eyes Only)
            </span>
            <div className="text-xs font-mono text-slate-300 flex flex-col gap-1">
              {currentMission.targets.map(t => {
                const validNodes = validation.solutionMap[t.planetId] || [];
                const pName = PLANET_DEFINITIONS[t.planetId].name;
                const sName = ZODIAC_SECTORS[t.targetSectorId].name;
                return (
                  <div key={t.planetId} className="flex items-center gap-2">
                    <span className="text-cyan-300 font-semibold">{pName}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-amber-300">{sName}</span>:
                    <span className="text-emerald-400 font-bold">
                      {validNodes.length > 0
                        ? `Valid Nodes: [${validNodes.map(n => `Node ${n} (${n * 30}°)`).join(', ')}]`
                        : 'No valid node for this configuration!'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 3: Game Parameters (Timer, Attempts, Hints) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Timer Duration */}
          <div className="p-3.5 rounded-xl bg-space-950/70 border border-cyan-500/20 flex flex-col gap-2">
            <span className="text-[11px] font-orbit uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Timer Duration
            </span>
            <select
              value={settings.missionDurationSeconds}
              onChange={e => updateSettings({ missionDurationSeconds: parseInt(e.target.value) })}
              className="p-2 rounded-lg bg-space-900 border border-cyan-500/30 text-xs font-mono text-slate-200 focus:outline-none"
            >
              <option value={300}>5 Minutes (300s)</option>
              <option value={360}>6 Minutes (360s - Recommended)</option>
              <option value={420}>7 Minutes (420s)</option>
              <option value={600}>10 Minutes (600s)</option>
            </select>
          </div>

          {/* Max Attempts */}
          <div className="p-3.5 rounded-xl bg-space-950/70 border border-cyan-500/20 flex flex-col gap-2">
            <span className="text-[11px] font-orbit uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Max Attempts
            </span>
            <select
              value={settings.maxAttempts}
              onChange={e => updateSettings({ maxAttempts: parseInt(e.target.value) })}
              className="p-2 rounded-lg bg-space-900 border border-cyan-500/30 text-xs font-mono text-slate-200 focus:outline-none"
            >
              <option value={2}>2 Attempts (Hard)</option>
              <option value={3}>3 Attempts (Standard)</option>
              <option value={5}>5 Attempts (Relaxed)</option>
            </select>
          </div>

          {/* Hints Enabled */}
          <div className="p-3.5 rounded-xl bg-space-950/70 border border-cyan-500/20 flex flex-col justify-between">
            <span className="text-[11px] font-orbit uppercase tracking-wider text-slate-400">
              Tactical Hints
            </span>
            <label className="flex items-center gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={settings.hintsEnabled}
                onChange={e => updateSettings({ hintsEnabled: e.target.checked })}
                className="rounded bg-space-900 border-cyan-500 text-cyan-500 focus:ring-0"
              />
              <span className="text-xs text-slate-300 font-orbit">Enable In-Game Hints</span>
            </label>
          </div>
        </div>

        {/* Section 4: Supabase PostgreSQL Integration */}
        <form onSubmit={handleSaveSupabase} className="p-4 rounded-xl bg-space-950/70 border border-cyan-500/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-orbit uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              Supabase Backend Credentials (Optional)
            </span>
            <span className="text-[10px] text-slate-400">Offline fallback works automatically</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              className="p-2 rounded-lg bg-space-900 border border-cyan-500/30 text-xs font-mono text-slate-200 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Supabase Anon Public API Key"
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
              className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-orbit font-bold uppercase tracking-wider hover:bg-cyan-500/30 transition-all"
            >
              Update Supabase Credentials
            </button>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-cyan-500/20">
          <button
            onClick={restartGame}
            className="px-4 py-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 font-orbit font-bold text-xs uppercase tracking-wider hover:bg-rose-900/60 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart Simulation
          </button>

          <button
            onClick={() => setShowAdminModal(false)}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-orbit font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md"
          >
            Save & Exit
          </button>
        </div>
      </div>
    </div>
  );
};
