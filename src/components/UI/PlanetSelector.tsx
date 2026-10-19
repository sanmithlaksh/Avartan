// Horizontal Planet Selector and Rapid Node Calibration Deck
import React from 'react';
import { useGame } from '../../context/GameContext';
import { PLANET_DEFINITIONS, ZODIAC_SECTORS, getReachableSectors } from '../../engine/astronomy';
import { PlanetId } from '../../engine/types';
import { ChevronLeft, ChevronRight, Lock, Orbit } from 'lucide-react';

export const PlanetSelector: React.FC = () => {
  const {
    planets,
    selectedPlanetId,
    selectPlanet,
    setPlanetNode,
    settings
  } = useGame();

  const planetList: PlanetId[] = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

  // Step only through signs the planet can actually lock onto
  const stepNode = (planetId: PlanetId, direction: 1 | -1) => {
    const nodes = getReachableSectors(
      planetId,
      settings.earthStartingNode,
      settings.zodiacAngularOffsetDeg
    );
    if (nodes.length === 0) return;

    const current = planets[planetId].selectedNode;
    const currentIdx = current === null ? -1 : nodes.indexOf(current);
    const nextIdx = currentIdx === -1
      ? (direction === 1 ? 0 : nodes.length - 1)
      : (currentIdx + direction + nodes.length) % nodes.length;
    setPlanetNode(planetId, nodes[nextIdx]);
  };

  return (
    <div className="h-16 px-4 bg-space-950/85 backdrop-blur-xl border-t border-cyan-500/20 flex items-center justify-between gap-2 overflow-x-auto select-none z-20">
      <div className="flex items-center gap-1.5 md:gap-2 mx-auto">
        {planetList.map(pId => {
          const def = PLANET_DEFINITIONS[pId];
          const pState = planets[pId];
          const isSelected = selectedPlanetId === pId;
          const isEarth = pId === 'earth';
          const hasPlacement = pState.selectedNode !== null;

          return (
            <div
              key={pId}
              onClick={() => selectPlanet(pId)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.25)] scale-105'
                  : 'bg-space-900/60 border-cyan-500/15 hover:border-cyan-500/40 text-slate-300'
              }`}
            >
              {/* Planet Color Orb */}
              <div
                className="w-3.5 h-3.5 rounded-full relative shadow-sm"
                style={{ backgroundColor: def.color }}
              >
                {isEarth && (
                  <div className="absolute -inset-1 rounded-full border border-sky-400 animate-ping opacity-60" />
                )}
              </div>

              {/* Name & Node Info */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-orbit font-bold tracking-wider">
                    {def.name}
                  </span>
                  {isEarth && <Lock className="w-2.5 h-2.5 text-sky-400" />}
                </div>

                <span className="text-[10px] font-mono text-slate-400">
                  {hasPlacement
                    ? isEarth
                      ? `Node ${pState.selectedNode} (${pState.selectedNode! * 30}°)`
                      : `${ZODIAC_SECTORS[pState.selectedNode!].symbol} ${ZODIAC_SECTORS[pState.selectedNode!].name}`
                    : 'Unplaced'}
                </span>
              </div>

              {/* Incremental Node Step Buttons on Selected Planet */}
              {isSelected && !isEarth && (
                <div className="flex items-center gap-0.5 ml-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stepNode(pId, -1);
                    }}
                    className="p-1 rounded bg-space-800 hover:bg-cyan-500/20 text-cyan-300"
                    title="Rotate Counter-Clockwise"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stepNode(pId, 1);
                    }}
                    className="p-1 rounded bg-space-800 hover:bg-cyan-500/20 text-cyan-300"
                    title="Rotate Clockwise"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
