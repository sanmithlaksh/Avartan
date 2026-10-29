// Level 3 host. The Marsfall mission is a self-contained page that talks to the
// same Supabase project; it is mounted only while the admin switch is on, so a
// team cannot land here before permission is granted.
import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { Lock } from 'lucide-react';

export const RoundThreeStage: React.FC = () => {
  const { board, setPhase, teamName, activeAccount, logoutTeam } = useGame();
  const unlocked = board.r3.on;

  // If the admin closes Round 3 mid-mission, drop straight back to the waiting ring.
  useEffect(() => {
    if (!unlocked) setPhase('round_three_wait');
  }, [unlocked, setPhase]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.type === 'round3_complete') {
        setPhase('welcome');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [setPhase]);

  if (!unlocked) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center gap-3 bg-space-950 text-slate-200 p-6 text-center">
        <Lock className="w-6 h-6 text-amber-400" />
        <h1 className="font-orbit font-bold text-lg">Round 3 is closed</h1>
        <p className="text-sm text-slate-400">
          {teamName || 'Your team'} has to wait for the organisers to reopen the round.
        </p>
        <button
          onClick={() => setPhase('round_three_wait')}
          className="mt-2 px-5 py-2.5 rounded-xl border border-cyan-400/40 text-cyan-300 text-xs font-orbit uppercase tracking-widest cursor-pointer"
        >
          Back to waiting area
        </button>
      </div>
    );
  }

  // Pass auth info to Level 3 via sessionStorage
  React.useEffect(() => {
    try {
      sessionStorage.setItem('void_team', JSON.stringify({
        team: (activeAccount as any)?.['Team Name'] || teamName || '',
        id: activeAccount?.id || '',
        pw: (activeAccount as any)?.['Password'] || ''
      }));
    } catch (e) {}
  }, [teamName, activeAccount]);

  return (
    <div className="relative w-screen h-screen bg-[#050914]">
      {/* Level 3 reads the signed-in team from sessionStorage (same origin). */}
      <iframe
        title="Void Paradigm · Round 3 · Marsfall"
        src={`${import.meta.env.BASE_URL}marsfall.html`}
        className="w-full h-full border-0"
        allow="fullscreen"
      />
      <button
        onClick={logoutTeam}
        className="absolute top-2 right-2 z-10 px-2.5 py-1 rounded-md bg-black/50 border border-white/15 text-[10px] font-mono text-slate-300 hover:text-rose-300"
        title={`${teamName} · ID ${activeAccount?.id ?? '—'}`}
      >
        {teamName || 'TEAM'} · ID {activeAccount?.id ?? '—'}
      </button>
    </div>
  );
};
