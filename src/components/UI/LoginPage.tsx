// Team Authentication Terminal Page
import React, { useState } from 'react';
import { InteractiveCosmicCanvas } from './InteractiveCosmicCanvas';
import { backendService } from '../../utils/supabase';
import { TeamAccount } from '../../engine/types';
import {
  Users,
  KeyRound,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (team: TeamAccount) => void;
  onBackToWelcome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToWelcome }) => {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !password.trim()) {
      setErrorMessage('Please enter both Team Name and Password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await backendService.authenticateTeam(teamName, password);
      if (res.success && res.team) {
        setSuccessMessage('Access Granted. Entering Avartan...');
        setTimeout(() => {
          onLoginSuccess(res.team!);
        }, 600);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden bg-space-950 text-slate-100 select-none p-4">
      {/* Interactive Cosmic Background with stagnant starfield and cursor reactive stars */}
      <InteractiveCosmicCanvas />

      {/* Atmospheric Radial Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Back Button */}
      <button
        onClick={onBackToWelcome}
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-space-900/80 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200 text-xs font-orbit uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Welcome</span>
      </button>

      {/* Card Container */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-space-900/90 border border-cyan-500/40 p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,243,255,0.25)] flex flex-col gap-6">
        {/* Header with Pentagram Logo & Gradient Logo */}
        <div className="flex flex-col gap-2 text-center items-center">
          <div className="flex items-center gap-4 mb-1">
            <img
              src="/assets/pentagram_logo.png"
              alt="Pentagram Logo"
              className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
            />
            <div className="w-px h-8 bg-cyan-500/30" />
            <img
              src="/assets/wave_gradient.png"
              alt="Gradient Logo"
              className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(236,72,153,0.4)]"
            />
          </div>

          <h2 className="text-xl md:text-2xl font-orbit font-extrabold text-slate-100 tracking-wide">
            MISSION ACCESS TERMINAL
          </h2>
          <span className="text-xs text-slate-400 font-sans">
            Enter your Team Name and Password to enter Avartan
          </span>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-orbit uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Team Name
            </label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="Enter your team name"
              className="w-full px-4 py-2.5 rounded-xl bg-space-950 border border-cyan-500/30 text-cyan-200 font-orbit text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-orbit uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2.5 rounded-xl bg-space-950 border border-cyan-500/30 text-cyan-200 font-orbit text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 font-orbit font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(0,243,255,0.4)] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'AUTHENTICATING...' : 'ACCESS MISSION PORTAL'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
