// Round 3 host: embeds the standalone Marsfall mission and hands it the signed-in
// team's identity. The mission posts its score back when the run ends.
import React, { useEffect, useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { Satellite, ArrowLeft } from 'lucide-react';
import type { RoundThreeReport } from '../../engine/types';

interface EmbedsMessage extends Partial<RoundThreeReport> {
  type?: string;
}

export const RoundThreeGame: React.FC = () => {
  const { activeAccount, teamName, goToHub, completeRoundThree } = useGame();

  const src = useMemo(() => {
    const team = activeAccount?.['Team Name'] || teamName || 'Squad';
    const pass = activeAccount?.['Password'] || 'void';
    return `/round3/marsfall.html?embed=1&team=${encodeURIComponent(team)}&pw=${encodeURIComponent(pass)}`;
  }, [activeAccount, teamName]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<EmbedsMessage>) => {
      const data = event.data;
      if (!data || data.type !== 'vp:round3-complete') return;
      completeRoundThree({
        points: Number(data.points) || 0,
        usedSeconds: Number(data.usedSeconds) || 0,
        penalty: Number(data.penalty) || 0,
        won: !!data.won
      });
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [completeRoundThree]);

  return (
    <div className="w-screen h-screen flex flex-col bg-space-950 text-slate-100 select-none">
      <div className="h-10 shrink-0 px-4 flex items-center justify-between border-b border-purple-500/30 bg-space-950/95">
        <span className="flex items-center gap-2 text-[10px] font-orbit font-bold uppercase tracking-[0.2em] text-purple-300">
          <Satellite className="w-3.5 h-3.5" />
          Round 03 · Marsfall
        </span>
        <button
          type="button"
          onClick={goToHub}
          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Exit to mission cards
        </button>
      </div>
      <iframe
        title="Round 3 · Marsfall"
        src={src}
        className="flex-1 w-full border-0 bg-space-950"
        allow="fullscreen"
      />
    </div>
  );
};

export default RoundThreeGame;
