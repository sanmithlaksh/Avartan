// Astronaut Helmet Visor and 3D Flight Navigation HUD
import React from 'react';
import { useGame } from '../../context/GameContext';
import { PLANET_DEFINITIONS } from '../../engine/astronomy';
import { PlanetId } from '../../engine/types';
import {
  Compass,
  Crosshair,
  Eye,
  FastForward,
  Navigation,
  Move,
  Orbit,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2
} from 'lucide-react';

interface AstronautHUDProps {
  navMode: 'fly' | 'orbit';
  setNavMode: (mode: 'fly' | 'orbit') => void;
  flySpeed: number;
  setFlySpeed: (speed: number) => void;
  cameraCoords: { x: number; y: number; z: number };
  targetedObject: { type: 'planet' | 'node' | 'boundary' | null; name: string; distance: number } | null;
  onFlyTo: (target: 'sun' | 'earth' | PlanetId | 'reset') => void;
  onVirtualMove: (direction: 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down') => void;
}

export const AstronautHUD: React.FC<AstronautHUDProps> = ({
  navMode,
  setNavMode,
  flySpeed,
  setFlySpeed,
  cameraCoords,
  targetedObject,
  onFlyTo,
  onVirtualMove
}) => {
  const { selectedPlanetId, selectPlanet, planets, zodiacRevealed, discoveryProgress } = useGame();

  const selectedDef = selectedPlanetId ? PLANET_DEFINITIONS[selectedPlanetId] : null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-3 md:p-5">
      {/* 5-Second Barrier Decryption Progress HUD Gauge */}
      {discoveryProgress > 0 && !zodiacRevealed && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 px-5 py-3 rounded-2xl bg-space-950/95 border border-cyan-400 backdrop-blur-xl shadow-[0_0_35px_rgba(0,243,255,0.45)]">
          <div className="flex items-center gap-2 text-xs font-orbit font-extrabold text-cyan-300 tracking-wider">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>HOLDING TO DECRYPT CELESTIAL BOUNDARY...</span>
            <span className="font-mono text-cyan-200">{discoveryProgress}%</span>
          </div>
          <div className="w-72 h-2.5 bg-space-900 rounded-full overflow-hidden border border-cyan-500/50 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 rounded-full transition-all duration-75 shadow-[0_0_10px_#00f3ff]"
              style={{ width: `${discoveryProgress}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400">Continuous hold for 5 seconds required to unlock Zodiac</div>
        </div>
      )}

      {/* Top Left: Astronaut Telemetry & Flight Mode */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        {/* Navigation Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-space-950/85 backdrop-blur-md border border-cyan-500/30 w-fit shadow-lg">
          <button
            onClick={() => setNavMode('fly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-orbit font-bold flex items-center gap-1.5 transition-all ${
              navMode === 'fly'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Astronaut Jetpack (Free Walk)</span>
          </button>
          <button
            onClick={() => setNavMode('orbit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-orbit font-bold flex items-center gap-1.5 transition-all ${
              navMode === 'orbit'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            <span>Orbital Orbit View</span>
          </button>
        </div>

        {/* Spatial Coordinates & Telemetry */}
        <div className="px-3 py-2 rounded-xl bg-space-950/75 backdrop-blur-md border border-cyan-500/20 text-[11px] font-mono flex items-center gap-4 w-fit text-slate-300">
          <div>
            <span className="text-cyan-400 font-orbit font-bold">POS: </span>
            <span>X:{cameraCoords.x.toFixed(1)} Y:{cameraCoords.y.toFixed(1)} Z:{cameraCoords.z.toFixed(1)}</span>
          </div>

          {navMode === 'fly' && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500">|</span>
              <span className="text-cyan-400 font-orbit font-bold">THRUST: </span>
              <button
                onClick={() => setFlySpeed(flySpeed === 1 ? 2.5 : 1)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  flySpeed > 1
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-space-800 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {flySpeed > 1 ? '3.0x WARP' : '1.0x NORMAL'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center 3D Reticle & Crosshair (for Astronaut Mode) */}
      {navMode === 'fly' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* Center crosshair pip */}
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f3ff]" />
            {/* Targeting brackets */}
            <div className={`absolute inset-0 border border-cyan-400/40 rounded-full transition-all duration-200 ${
              targetedObject ? 'scale-125 border-cyan-300 shadow-[0_0_15px_#00f3ff]' : 'scale-100'
            }`} />
          </div>

          {/* Active Target Readout */}
          {targetedObject && (
            <div className="mt-3 px-3 py-1 rounded-lg bg-space-950/85 border border-cyan-400/50 backdrop-blur-md text-center shadow-lg animate-fade-in">
              <div className="text-[10px] font-orbit font-bold text-cyan-300 uppercase tracking-widest">
                {targetedObject.name}
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                Range: {targetedObject.distance.toFixed(1)} AU • Click to select / place
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fly-To Fast Travel Bar */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-space-950/80 backdrop-blur-md border border-cyan-500/20 max-w-xl">
          <span className="text-[10px] font-orbit uppercase tracking-widest text-slate-400 mr-1 flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            Fast Travel:
          </span>
          <button
            onClick={() => onFlyTo('earth')}
            className="px-2.5 py-1 rounded-lg bg-sky-950/70 border border-sky-400/50 text-sky-300 text-xs font-orbit hover:bg-sky-500/20 transition-all font-semibold"
          >
            Stand on Earth
          </button>
          <button
            onClick={() => onFlyTo('sun')}
            className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-400/50 text-amber-300 text-xs font-orbit hover:bg-amber-500/20 transition-all font-semibold"
          >
            Sun Core
          </button>
          {selectedPlanetId && selectedPlanetId !== 'earth' && (
            <button
              onClick={() => onFlyTo(selectedPlanetId)}
              className="px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-400/50 text-cyan-300 text-xs font-orbit hover:bg-cyan-500/20 transition-all font-semibold"
            >
              Ride {PLANET_DEFINITIONS[selectedPlanetId].name}
            </button>
          )}
          <button
            onClick={() => onFlyTo('reset')}
            className="px-2.5 py-1 rounded-lg bg-space-900 border border-slate-700 text-slate-300 text-xs font-orbit hover:text-slate-100 transition-all"
          >
            Wide Orbit
          </button>
        </div>

        {/* Keyboard Navigation Guide */}
        {navMode === 'fly' && (
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-slate-400 px-2">
            <span><strong className="text-cyan-400">WASD:</strong> Horizontal Pan (2D)</span>
            <span><strong className="text-cyan-400">LEFT-DRAG:</strong> 3D Look Around</span>
            <span><strong className="text-cyan-400">SCROLL:</strong> Zoom In / Out</span>
            <span><strong className="text-cyan-400">HOLD BARRIER (5s):</strong> Decrypt Zodiac</span>
          </div>
        )}
      </div>

      {/* Mobile / Tablet On-Screen Flight Thrusters (Shown on Touch or small screens) */}
      {navMode === 'fly' && (
        <div className="sm:hidden absolute bottom-20 left-4 pointer-events-auto flex flex-col gap-1.5 p-2 rounded-2xl bg-space-950/80 backdrop-blur-md border border-cyan-500/30">
          <div className="flex justify-center">
            <button
              onPointerDown={() => onVirtualMove('forward')}
              className="p-3 rounded-xl bg-space-900 border border-cyan-500/30 text-cyan-300 active:bg-cyan-500/40"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onPointerDown={() => onVirtualMove('left')}
              className="p-3 rounded-xl bg-space-900 border border-cyan-500/30 text-cyan-300 active:bg-cyan-500/40"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onPointerDown={() => onVirtualMove('backward')}
              className="p-3 rounded-xl bg-space-900 border border-cyan-500/30 text-cyan-300 active:bg-cyan-500/40"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              onPointerDown={() => onVirtualMove('right')}
              className="p-3 rounded-xl bg-space-900 border border-cyan-500/30 text-cyan-300 active:bg-cyan-500/40"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex justify-between gap-2 mt-1">
            <button
              onPointerDown={() => onVirtualMove('up')}
              className="flex-1 py-1 px-2 rounded-lg bg-space-900 border border-cyan-500/30 text-[10px] font-orbit text-cyan-300 text-center active:bg-cyan-500/40"
            >
              UP
            </button>
            <button
              onPointerDown={() => onVirtualMove('down')}
              className="flex-1 py-1 px-2 rounded-lg bg-space-900 border border-cyan-500/30 text-[10px] font-orbit text-cyan-300 text-center active:bg-cyan-500/40"
            >
              DOWN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
