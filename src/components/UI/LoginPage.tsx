// Team Authentication and Registration Page
import React, { useState } from 'react';
import { InteractiveCosmicCanvas } from './InteractiveCosmicCanvas';
import { backendService, DEFAULT_TRIAL_ACCOUNT } from '../../utils/supabase';
import { TeamAccount } from '../../engine/types';
import {
  Lock,
  User,
  Users,
  Shield,
  KeyRound,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (team: TeamAccount) => void;
  onBackToWelcome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToWelcome }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
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
        setSuccessMessage('Access Granted. Teleporting to Orbital Command...');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !password.trim() || !name1.trim()) {
      setErrorMessage('Please provide Team Name, Password, and at least Name 1.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const newAccount: TeamAccount = {
      'Name 1': name1.trim(),
      'Name 2': name2.trim() || 'Co-Pilot',
      'Team Name': teamName.trim(),
      'Password': password.trim(),
      'Current level': 1,
      'levels completion': 0,
      'level 1 points': 0,
      'level 2 points': 0,
      'level 3 points': 0,
      'total level points': 0
    };

    try {
      const res = await backendService.registerTeam(newAccount);
      if (res.success && res.team) {
        setSuccessMessage('Squadron enrolled successfully. Entering simulation...');
        setTimeout(() => {
          onLoginSuccess(res.team!);
        }, 700);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillTrialCredentials = () => {
    setTeamName(DEFAULT_TRIAL_ACCOUNT['Team Name']);
    setPassword(DEFAULT_TRIAL_ACCOUNT['Password']);
    setName1(DEFAULT_TRIAL_ACCOUNT['Name 1']);
    setName2(DEFAULT_TRIAL_ACCOUNT['Name 2']);
    setErrorMessage(null);
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center overflow-hidden bg-space-950 text-slate-100 select-none p-4">
      {/* Interactive Cosmic Background */}
      <InteractiveCosmicCanvas />

      {/* Atmospheric Radial Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Back Button */}
      <button
        onClick={onBackToWelcome}
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-space-900/80 border border-cyan-500/30 text-cyan-400 hover:text-cyan-200 text-xs font-orbit uppercase tracking-wider backdrop-blur-md transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Welcome</span>
      </button>

      {/* Card Container */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-space-900/90 border border-cyan-500/40 p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,243,255,0.25)] flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col gap-1 text-center">
          <div className="inline-flex items-center justify-center self-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/50 shadow-[0_0_20px_rgba(0,243,255,0.3)] mb-2">
            <Lock className="w-6 h-6 text-cyan-300" />
          </div>
          <h2 className="text-xl md:text-2xl font-orbit font-extrabold text-slate-100 tracking-wide">
            {mode === 'login' ? 'MISSION ACCESS TERMINAL' : 'SQUADRON ENROLLMENT'}
          </h2>
          <span className="text-xs text-slate-400 font-sans">
            {mode === 'login'
              ? 'Authenticate team credentials to access orbital controls'
              : 'Register your 2-member team for tournament ranking'}
          </span>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-space-950/80 p-1 border border-cyan-500/20 text-xs font-orbit">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              mode === 'login'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Team Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              mode === 'register'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            New Registration
          </button>
        </div>

        {/* Trial Auto-Fill Pill */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] text-slate-300 font-mono">
              Trial: Team <strong className="text-cyan-300">Admin</strong> / Pass <strong className="text-cyan-300">Aryan</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={fillTrialCredentials}
            className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-orbit text-[10px] uppercase font-bold tracking-wider transition-all"
          >
            Auto-Fill
          </button>
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

        {/* Forms */}
        {mode === 'login' ? (
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
                placeholder="e.g. Admin or Stellar Phalanx"
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
              {isLoading ? 'AUTHENTICATING...' : 'ACCESS ORBITAL CONSOLE'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-orbit uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-cyan-400" />
                  Name 1
                </label>
                <input
                  type="text"
                  value={name1}
                  onChange={e => setName1(e.target.value)}
                  placeholder="Primary Pilot"
                  className="w-full px-3 py-2 rounded-xl bg-space-950 border border-cyan-500/30 text-cyan-200 font-sans text-xs placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-orbit uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-cyan-400" />
                  Name 2
                </label>
                <input
                  type="text"
                  value={name2}
                  onChange={e => setName2(e.target.value)}
                  placeholder="Co-Pilot (Optional)"
                  className="w-full px-3 py-2 rounded-xl bg-space-950 border border-cyan-500/30 text-cyan-200 font-sans text-xs placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-orbit uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" />
                Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Squadron Name"
                className="w-full px-3 py-2 rounded-xl bg-space-950 border border-cyan-500/30 text-cyan-200 font-orbit text-xs placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-orbit uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-cyan-400" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Squadron Access Password"
                className="w-full px-3 py-2 rounded-xl bg-space-950 border border-cyan-500/30 text-cyan-200 font-orbit text-xs placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 font-orbit font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'ENROLLING...' : 'REGISTER SQUADRON'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
