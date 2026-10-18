// Cinematic Mission Briefing and Team Registration Modal
import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Rocket, Shield, Sparkles, Orbit, Compass, Eye, ChevronRight } from 'lucide-react';

export const IntroModal: React.FC = () => {
  const {
    showIntroModal,
    teamName,
    setTeamName,
    startMission,
    settings
  } = useGame();

  const [inputName, setInputName] = useState(teamName);

  if (!showIntroModal) return null;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      setTeamName(inputName.trim());
    }
    startMission();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/85 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-2xl bg-space-900/90 border border-cyan-500/40 p-6 md:p-8 shadow-[0_0_50px_rgba(0,243,255,0.25)] flex flex-col gap-6 overflow-hidden">
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Orbit className="w-5 h-5 animate-spin-very-slow" />
            <span className="text-xs font-orbit tracking-widest uppercase">
              Classified Orbital Operation • Round 1
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-orbit font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300">
            THE HIDDEN ORBIT
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            An unidentified celestial system has been detected. Its navigation coordinates have disappeared.
            Earth remains the only stable reference point. Restore the planetary alignment to recover the lost
            navigation sequence.
          </p>
        </div>

        {/* Core Directives Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-space-950/60 border border-cyan-500/20 flex flex-col gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-xs font-orbit font-bold text-slate-200">1. Earth Vantage</span>
            <p className="text-[11px] text-slate-400 leading-tight">
              Earth is locked as your observation origin. Apparent positions depend strictly on Earth's sightline.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-space-950/60 border border-cyan-500/20 flex flex-col gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-xs font-orbit font-bold text-slate-200">2. 12-Node Calibrations</span>
            <p className="text-[11px] text-slate-400 leading-tight">
              Each movable world snaps to one of twelve orbital positions spaced at 30° increments.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-space-950/60 border border-cyan-500/20 flex flex-col gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <span className="text-xs font-orbit font-bold text-slate-200">3. Outer Anomaly</span>
            <p className="text-[11px] text-slate-400 leading-tight">
              A mysterious outer boundary surrounds the system. Investigate and scan the perimeter to discover the hidden zodiac.
            </p>
          </div>
        </div>

        {/* Team Registration Form */}
        <form onSubmit={handleStart} className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-cyan-500/20">
          <div className="flex-1">
            <label className="block text-[11px] font-orbit uppercase tracking-wider text-slate-400 mb-1">
              Team Call-Sign
            </label>
            <input
              type="text"
              value={inputName}
              onChange={e => setInputName(e.target.value)}
              placeholder="e.g. Apollo Vanguard"
              className="w-full px-4 py-2.5 rounded-xl bg-space-950 border border-cyan-500/30 text-cyan-300 font-orbit font-semibold placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleStart}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 font-orbit font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)] cursor-pointer"
            >
              INITIALIZE MISSION
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
