// 2D Synchronized Orbital Positioning Map (SVG)
// Provides a top-down orbital positioning radar with drag-and-drop snapping,
// 12 nodes per orbit, observation rays, and interactive hidden zodiac boundary.
import React, { useState, useRef, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import {
  PLANET_DEFINITIONS,
  ZODIAC_SECTORS,
  calculateSightlineFromPositions,
  getSectorRimGeometry,
  getHeliocentricPosition2D,
  getPlanetHeliocentricAngleForSector,
  getPlanetPositionForSector,
  getReachableSectors,
  getDefaultPlanetPosition2D
} from '../../engine/astronomy';
import { PlanetId } from '../../engine/types';
import { soundFx } from '../../utils/audio';

export const OrbitalMap2D: React.FC = () => {
  const {
    planets,
    selectedPlanetId,
    selectPlanet,
    setPlanetNode,
    observationActive,
    zodiacRevealed,
    triggerZodiacDiscovery,
    discoveryProgress,
    setDiscoveryProgress,
    showZodiacTable,
    zodiacTableShown,
    chartUsed,
    settings
  } = useGame();

  const svgRef = useRef<SVGSVGElement>(null);
  const [isHoldingBoundary, setIsHoldingBoundary] = useState(false);
  const holdTimerRef = useRef<any>(null);
  const [draggedPlanet, setDraggedPlanet] = useState<PlanetId | null>(null);
  // Progress (0–100) for the second hold that reveals the one-time zodiac reference table
  const [tableHoldProgress, setTableHoldProgress] = useState(0);

  // SVG Coordinate space: Center is (0,0), radius up to 480
  const viewBoxSize = 1000;
  const center = viewBoxSize / 2;
  const scale = 10.5; // Scaled to fit 40 unit boundary nicely in 1000x1000 viewBox (40 * 10.5 = 420)
  const boundaryRadiusPx = 40 * scale;

  // Handle snapping drag
  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggedPlanet || draggedPlanet === 'earth' || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert client coords to SVG coords relative to center
    const svgX = (clientX / rect.width) * viewBoxSize - center;
    const svgY = -((clientY / rect.height) * viewBoxSize - center); // Invert Y for Cartesian

    // Compute angle in degrees [0, 360)
    let angleDeg = (Math.atan2(svgY, svgX) * 180) / Math.PI;
    if (angleDeg < 0) angleDeg += 360;

    // Snap to the nearest reachable zodiac node (each node is one sign)
    const earthNode = settings.earthStartingNode;
    let nearestNode: number | null = null;
    let nearestDist = Infinity;
    for (const sector of getReachableSectors(draggedPlanet, earthNode, settings.zodiacAngularOffsetDeg)) {
      const nodeAngle = getPlanetHeliocentricAngleForSector(
        draggedPlanet,
        sector,
        earthNode,
        settings.zodiacAngularOffsetDeg
      );
      if (nodeAngle === null) continue;
      const dist = Math.abs(((angleDeg - nodeAngle + 540) % 360) - 180);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestNode = sector;
      }
    }
    if (nearestNode !== null && planets[draggedPlanet].selectedNode !== nearestNode) {
      setPlanetNode(draggedPlanet, nearestNode);
    }
  };

  const handlePointerUp = () => {
    setDraggedPlanet(null);
    if (isHoldingBoundary) {
      clearInterval(holdTimerRef.current);
      setIsHoldingBoundary(false);
      // Reset whichever progress bar was active
      if (!zodiacRevealed) setDiscoveryProgress(0);
      else setTableHoldProgress(0);
    }
  };

  // Outer boundary hold-to-discover (Hold for 10.0 seconds!)
  // Second hold after zodiac is revealed shows the one-time reference table
  const handleBoundaryPointerDown = () => {
    if (zodiacRevealed) {
      // Second hold: show the one-time zodiac reference table
      setIsHoldingBoundary(true);
      soundFx.playBoundaryCharging();

      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const prog = Math.min(100, Math.round((elapsed / 10000) * 100)); // 10 seconds to show table
        setTableHoldProgress(prog);
        if (prog >= 100) {
          clearInterval(interval);
          setIsHoldingBoundary(false);
          setTableHoldProgress(0);
          showZodiacTable();
        }
      }, 50);
      holdTimerRef.current = interval;
      return;
    }

    // Unlock the zodiac wheel (10 seconds)
    setIsHoldingBoundary(true);
    soundFx.playBoundaryCharging();

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const prog = Math.min(100, Math.round((elapsed / 10000) * 100)); // Exactly 10.0 seconds
      setDiscoveryProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setIsHoldingBoundary(false);
        triggerZodiacDiscovery();
      }
    }, 50);
    holdTimerRef.current = interval;
  };

  const earthNode = planets.earth.selectedNode ?? settings.earthStartingNode;
  const earthPos = getHeliocentricPosition2D(PLANET_DEFINITIONS.earth.orbitalRadius, earthNode, 0);

  // Position of a placed planet on its orbit (node = locked zodiac sign)
  const positionOf = (planetId: PlanetId, nodeIndex: number) => {
    if (planetId === 'earth') {
      return getHeliocentricPosition2D(PLANET_DEFINITIONS.earth.orbitalRadius, nodeIndex, 0);
    }
    return getPlanetPositionForSector(
      planetId,
      nodeIndex,
      earthNode,
      settings.zodiacAngularOffsetDeg
    );
  };

  // Active sightline calculations
  const activeSightline = (() => {
    if (!observationActive || !selectedPlanetId || selectedPlanetId === 'earth') return null;
    const pState = planets[selectedPlanetId];
    if (!pState || pState.selectedNode === null) return null;

    const pPos = positionOf(selectedPlanetId, pState.selectedNode);
    if (!pPos) return null;

    return calculateSightlineFromPositions(
      earthPos,
      pPos,
      40,
      settings.zodiacAngularOffsetDeg
    );
  })();

  const planetOrder: PlanetId[] = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2 select-none overflow-hidden bg-space-950">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full max-w-[850px] max-h-[850px] drop-shadow-2xl"
      >
        <defs>
          {/* Radial glow gradient for the Sun */}
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
            <stop offset="30%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>

          {/* Observation Ray Laser Gradient */}
          <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#00f3ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Dynamic Celestial Boundary Wheel */}
        <g
          className="cursor-pointer"
          onPointerDown={handleBoundaryPointerDown}
        >
          {/* Dynamic Flowing Energy Field (Not Stagnant!) */}
          <circle
            cx={center}
            cy={center}
            r={boundaryRadiusPx}
            fill="none"
            stroke="rgba(0, 243, 255, 0.15)"
            strokeWidth={32}
            className="animate-pulse"
          />
          {/* Counter-rotating particle stream ring */}
          <circle
            cx={center}
            cy={center}
            r={boundaryRadiusPx + 10}
            fill="none"
            stroke="rgba(56, 189, 248, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="4,8"
            className="animate-spin-very-slow"
          />
          <circle
            cx={center}
            cy={center}
            r={boundaryRadiusPx - 10}
            fill="none"
            stroke="rgba(168, 85, 247, 0.3)"
            strokeWidth="1.5"
            strokeDasharray="6,12"
            style={{ animation: 'spin 45s linear infinite reverse' }}
          />

          {/* 12 Celestial Sectors */}
          {ZODIAC_SECTORS.map((sector) => {
            // Rim positions come from the *observed* wheel: each sign sits where
            // a ray from Earth in that apparent direction meets the boundary, so
            // the observation ray terminates exactly on the glyph.
            const rim = getSectorRimGeometry(
              sector.id,
              earthNode,
              40,
              settings.zodiacAngularOffsetDeg
            );
            const lx = center + rim.center.x * scale;
            const ly = center - rim.center.y * scale;

            // Dividing tick at the leading edge of the sector, drawn inward
            const edgeX = center + rim.start.x * scale;
            const edgeY = center - rim.start.y * scale;
            const dirX = rim.start.x - rim.earth.x;
            const dirY = -(rim.start.y - rim.earth.y);
            const dirLen = Math.hypot(dirX, dirY) || 1;
            const tick = zodiacRevealed ? 16 : 8;
            const sx1 = edgeX - (dirX / dirLen) * tick;
            const sy1 = edgeY - (dirY / dirLen) * tick;
            const sx2 = edgeX;
            const sy2 = edgeY;

            const isCurrentIntersected = activeSightline && activeSightline.sectorIndex === sector.id;
            const isAries = sector.id === 0;

            return (
              <g key={sector.id}>
                {/* Spoke line */}
                <line
                  x1={sx1}
                  y1={sy1}
                  x2={sx2}
                  y2={sy2}
                  stroke={isCurrentIntersected ? '#00f3ff' : zodiacRevealed ? 'rgba(0, 243, 255, 0.4)' : 'rgba(0, 243, 255, 0.2)'}
                  strokeWidth={isCurrentIntersected ? '2.5' : '1.2'}
                />

                {/* Sector Content — SEEN ONLY AFTER 5s HOLD ACTIVATION */}
                {zodiacRevealed && (
                  <g className="transition-all duration-300">
                    {/* Active Sector Highlighting Wedge */}
                    {isCurrentIntersected && (
                      <circle
                        cx={lx}
                        cy={ly}
                        r="25"
                        fill="rgba(0, 243, 255, 0.25)"
                        stroke="#00f3ff"
                        strokeWidth="2"
                        filter="url(#neonGlow)"
                        className="animate-pulse"
                      />
                    )}

                    {/* Aries Stagnant '1' Indicator Badge - ONLY Aries has a number! */}
                    {isAries && (
                      <g transform={`translate(${lx}, ${ly - 22})`}>
                        <rect
                          x="-11"
                          y="-8"
                          width="22"
                          height="16"
                          rx="4"
                          fill="#0284c7"
                          stroke="#00f3ff"
                          strokeWidth="1.2"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                          className="font-mono"
                        >
                          1
                        </text>
                      </g>
                    )}

                    {/* Zodiac Symbol — centred exactly on the rim point so the
                        observation ray terminates on the glyph, not beside it */}
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isCurrentIntersected ? '#00f3ff' : '#f1f5f9'}
                      fontSize="19"
                      fontWeight="bold"
                      className="font-orbit"
                      filter={isCurrentIntersected ? 'url(#neonGlow)' : undefined}
                    >
                      {sector.symbol}
                    </text>

                    {/* Constellation Name in crisp font */}
                    <text
                      x={lx}
                      y={ly + 17}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isCurrentIntersected ? '#38bdf8' : 'rgba(148, 163, 184, 0.8)'}
                      fontSize="8.5"
                      fontWeight="700"
                      className="font-orbit tracking-wider uppercase"
                    >
                      {sector.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Holding Progress Feedback Overlay on 2D Ring */}
          {isHoldingBoundary && !zodiacRevealed && (
            <g>
              <circle
                cx={center}
                cy={center}
                r={boundaryRadiusPx}
                fill="none"
                stroke="#00f3ff"
                strokeWidth="5"
                strokeDasharray={`${(discoveryProgress / 100) * 2 * Math.PI * boundaryRadiusPx} 2000`}
                filter="url(#neonGlow)"
              />
              <text
                x={center}
                y={center - boundaryRadiusPx - 20}
                textAnchor="middle"
                fill="#00f3ff"
                fontSize="13"
                fontWeight="bold"
                className="font-orbit animate-pulse"
              >
                DECRYPTING CELESTIAL BOUNDARY... {discoveryProgress}% (HOLD 10s)
              </text>
            </g>
          )}
          {isHoldingBoundary && zodiacRevealed && (
            <g>
              <circle
                cx={center}
                cy={center}
                r={boundaryRadiusPx}
                fill="none"
                stroke="#a855f7"
                strokeWidth="5"
                strokeDasharray={`${(tableHoldProgress / 100) * 2 * Math.PI * boundaryRadiusPx} 2000`}
                filter="url(#neonGlow)"
              />
              <text
                x={center}
                y={center - boundaryRadiusPx - 20}
                textAnchor="middle"
                fill="#a855f7"
                fontSize="13"
                fontWeight="bold"
                className="font-orbit animate-pulse"
              >
                REQUESTING REFERENCE CHART... {tableHoldProgress}% (HOLD 10s)
              </text>
            </g>
          )}
        </g>

        {/* Orbital Rings & Nodes for Each Planet */}
        {planetOrder.map(planetId => {
          const def = PLANET_DEFINITIONS[planetId];
          const rPx = def.orbitalRadius * scale;
          const isSelected = planetId === selectedPlanetId;
          const isEarth = planetId === 'earth';
          const pState = planets[planetId];

          return (
            <g key={planetId}>
              {/* Circular Orbit Track */}
              <circle
                cx={center}
                cy={center}
                r={rPx}
                fill="none"
                stroke={isSelected ? '#00f3ff' : isEarth ? '#38bdf8' : 'rgba(71, 85, 105, 0.35)'}
                strokeWidth={isSelected ? '2.5' : isEarth ? '2' : '1.2'}
                strokeDasharray={isSelected ? '4,4' : undefined}
                className="transition-all duration-300"
              />

              {/* Orbital Nodes — one node per reachable zodiac sign */}
              {(isEarth
                ? Array.from({ length: 12 }, (_, n) => ({ node: n, angleDeg: n * 30 }))
                : getReachableSectors(planetId, earthNode, settings.zodiacAngularOffsetDeg)
                    .map(s => ({
                      node: s,
                      angleDeg: getPlanetHeliocentricAngleForSector(
                        planetId,
                        s,
                        earthNode,
                        settings.zodiacAngularOffsetDeg
                      )
                    }))
                    .filter(n => n.angleDeg !== null) as Array<{ node: number; angleDeg: number }>
              ).map(({ node: nodeIdx, angleDeg }) => {
                const angleRad = (angleDeg * Math.PI) / 180;
                const nx = center + rPx * Math.cos(angleRad);
                const ny = center - rPx * Math.sin(angleRad);
                const isPlanetHere = pState.selectedNode === nodeIdx;
                const isShowNode = isSelected || isEarth || isPlanetHere;

                if (!isShowNode) return null;

                return (
                  <g
                    key={nodeIdx}
                    onClick={() => {
                      if (!isEarth) {
                        selectPlanet(planetId);
                        setPlanetNode(planetId, nodeIdx);
                      }
                    }}
                    className={!isEarth ? 'cursor-pointer group' : ''}
                  >
                    <circle
                      cx={nx}
                      cy={ny}
                      r={isPlanetHere ? 8 : 4.5}
                      fill={isPlanetHere ? def.color : isEarth ? '#38bdf8' : 'rgba(148, 163, 184, 0.4)'}
                      stroke={isPlanetHere ? '#ffffff' : 'rgba(0, 243, 255, 0.6)'}
                      strokeWidth={isPlanetHere ? '2.5' : '1'}
                      filter={isPlanetHere ? 'url(#neonGlow)' : undefined}
                      className="transition-transform group-hover:scale-125"
                    />

                    {/* Zodiac sign label on the selected orbit */}
                    {isSelected && !isPlanetHere && (
                      <text
                        x={nx}
                        y={ny + 3}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="7"
                        className="font-mono pointer-events-none"
                      >
                        {isEarth ? nodeIdx : ZODIAC_SECTORS[nodeIdx].name.slice(0, 3).toUpperCase()}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Planet Draggable Icon / Marker — every world is always drawn.
                  An unplaced world parks at a neutral orbital angle with no
                  reading attached, so the array is never empty. */}
              {(() => {
                  const isPlaced = pState.selectedNode !== null;
                  const pos = isPlaced
                    ? positionOf(planetId, pState.selectedNode!)
                    : getDefaultPlanetPosition2D(planetId);
                  if (!pos) return null;
                  const px = center + pos.x * scale;
                  const py = center - pos.y * scale;

                  return (
                    <g
                      style={{
                        transform: `translate(${px}px, ${py}px)`,
                        transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
                        opacity: isPlaced || isEarth ? 1 : 0.6
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        selectPlanet(planetId);
                        if (!isEarth) setDraggedPlanet(planetId);
                      }}
                      className={isEarth ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
                    >
                      {/* Highlight Halo for Selected Planet */}
                      {isSelected && (
                        <circle
                          r={def.size * 9 + 6}
                          fill="none"
                          stroke="#00f3ff"
                          strokeWidth="2"
                          strokeDasharray="2,2"
                          filter="url(#neonGlow)"
                          className="animate-spin-very-slow"
                        />
                      )}

                      {/* Planet Disc */}
                      <circle
                        r={def.size * 9}
                        fill={def.color}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        filter="url(#neonGlow)"
                      />

                      {/* Earth Locked Badge Pin */}
                      {isEarth && (
                        <circle
                          r={def.size * 9 + 4}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                        />
                      )}

                      {/* Unplaced marker: dashed ring, no reading yet */}
                      {!isPlaced && !isEarth && (
                        <circle
                          r={def.size * 9 + 5}
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="1.2"
                          strokeDasharray="3,4"
                        />
                      )}

                      {/* Planet Label */}
                      <text
                        y={-(def.size * 9 + 7)}
                        textAnchor="middle"
                        fill={isSelected ? '#00f3ff' : isPlaced ? '#f1f5f9' : '#94a3b8'}
                        fontSize="11"
                        fontWeight="bold"
                        className="font-orbit uppercase tracking-wider pointer-events-none"
                      >
                        {def.name}
                      </text>
                    </g>
                  );
                })()}
            </g>
          );
        })}

        {/* Observation Ray Sightline (Earth -> Planet -> Celestial Boundary) */}
        {activeSightline && (
          <g>
            <line
              x1={center + activeSightline.earth2D.x * scale}
              y1={center - activeSightline.earth2D.y * scale}
              x2={center + activeSightline.boundary2D.x * scale}
              y2={center - activeSightline.boundary2D.y * scale}
              stroke="url(#laserGrad)"
              strokeWidth="3.5"
              filter="url(#neonGlow)"
              className="animate-pulse"
            />
            {/* Impact indicator at outer boundary */}
            <circle
              cx={center + activeSightline.boundary2D.x * scale}
              cy={center - activeSightline.boundary2D.y * scale}
              r="10"
              fill="rgba(0, 243, 255, 0.4)"
              stroke="#00f3ff"
              strokeWidth="2.5"
              filter="url(#neonGlow)"
            />
          </g>
        )}

        {/* Central Sun */}
        <g transform={`translate(${center}, ${center})`}>
          <circle r="42" fill="url(#sunGlow)" />
          <circle r="22" fill="#fbbf24" stroke="#fef08a" strokeWidth="2" filter="url(#neonGlow)" />
          <text
            y="4"
            textAnchor="middle"
            fill="#78350f"
            fontSize="10"
            fontWeight="bold"
            className="font-orbit"
          >
            SOL
          </text>
        </g>
      </svg>

      {/* Floating 2D Interaction Guide Overlay */}
      <div className="absolute top-4 right-4 pointer-events-none z-10 flex flex-col gap-1.5 text-right">
        <span className="text-[11px] font-orbit text-cyan-400 uppercase tracking-widest">
          2D Planetary Positioning Array
        </span>
        <span className="text-xs text-slate-400">
          Click or drag nodes to position • Click outer rim to scan
        </span>
        <span
          className={`text-[10px] font-mono ${
            chartUsed ? 'text-slate-500' : zodiacRevealed ? 'text-purple-300' : 'text-cyan-300'
          }`}
        >
          {chartUsed
            ? 'Reference chart spent this round'
            : zodiacRevealed
              ? 'Hold outer rim 10s → reference chart (riddles must be sealed)'
              : 'Hold outer rim 10s → decrypt the zodiac wheel'}
        </span>
      </div>
    </div>
  );
};
