// Core Astronomical and Observation Calculation Engine
import { PlanetDefinition, PlanetId, ZodiacSector, MissionTarget, PlanetaryState } from './types';

// Predefined Planets: Sun -> Mercury -> Venus -> Earth -> Mars -> Jupiter -> Saturn -> Uranus -> Neptune
// Radii are visually scaled for optimal UI visibility while strictly preserving orbital order.
export const PLANET_DEFINITIONS: Record<PlanetId, PlanetDefinition> = {
  mercury: {
    id: 'mercury',
    name: 'Mercury',
    orbitalRadius: 5.5,
    size: 0.45,
    color: '#a3a3a3',
    glowColor: '#d4d4d8',
    description: 'Closest planet to the Sun. Cratered, airless, and heavily baked.',
    textureType: 'rocky'
  },
  venus: {
    id: 'venus',
    name: 'Venus',
    orbitalRadius: 8.2,
    size: 0.72,
    color: '#eab308',
    glowColor: '#fef08a',
    description: 'Enveloped in dense sulfuric acid clouds with intense runaway greenhouse heat.',
    textureType: 'dense_atmosphere'
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    orbitalRadius: 11.5,
    size: 0.85,
    color: '#38bdf8',
    glowColor: '#00f3ff',
    description: 'Locked Reference Horizon. The primary vantage point for celestial observation.',
    textureType: 'earth'
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    orbitalRadius: 15.0,
    size: 0.58,
    color: '#ef4444',
    glowColor: '#fca5a5',
    description: 'The Red Planet, rich in iron oxide minerals with ancient dry river valleys.',
    textureType: 'red_rock'
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    orbitalRadius: 19.5,
    size: 1.6,
    color: '#f59e0b',
    glowColor: '#fcd34d',
    description: 'Colossal gas giant with turbulent atmospheric bands and the Great Red Spot.',
    textureType: 'gas_giant_bands'
  },
  saturn: {
    id: 'saturn',
    name: 'Saturn',
    orbitalRadius: 24.5,
    size: 1.35,
    color: '#fed7aa',
    glowColor: '#ffedd5',
    description: 'Magnificent jewel with an expansive icy planetary ring system.',
    hasRings: true,
    ringInnerRadius: 1.8,
    ringOuterRadius: 3.2,
    ringColor: '#fed7aa',
    textureType: 'ringed_gas'
  },
  uranus: {
    id: 'uranus',
    name: 'Uranus',
    orbitalRadius: 29.5,
    size: 1.05,
    color: '#67e8f9',
    glowColor: '#a5f3fc',
    description: 'Tilted ice giant surrounded by methane haze and faint vertical rings.',
    hasRings: true,
    ringInnerRadius: 1.4,
    ringOuterRadius: 2.0,
    ringColor: '#67e8f9',
    textureType: 'ice_giant'
  },
  neptune: {
    id: 'neptune',
    name: 'Neptune',
    orbitalRadius: 34.0,
    size: 1.0,
    color: '#3b82f6',
    glowColor: '#93c5fd',
    description: 'Distant deep azure world lashed by supersonic supersonic winds and storms.',
    textureType: 'blue_ice'
  }
};

export const CELESTIAL_BOUNDARY_RADIUS = 40.0;

// The 12 Zodiac Constellations in astronomical ecliptic sequence
export const ZODIAC_SECTORS: ZodiacSector[] = [
  {
    id: 0,
    sectorNumber: 1,
    name: 'Aries',
    symbol: '♈',
    displayBadge: '1', // Only Aries has stagnant number 1!
    constellationName: 'The Ram',
    startAngleDeg: 0,
    endAngleDeg: 30,
    element: 'Fire',
    color: '#ef4444',
    stars: [
      { x: 0.2, y: 0.3, brightness: 1.0 },
      { x: 0.45, y: 0.45, brightness: 0.8 },
      { x: 0.6, y: 0.55, brightness: 0.6 },
      { x: 0.75, y: 0.7, brightness: 0.5 }
    ]
  },
  {
    id: 1,
    sectorNumber: 2,
    name: 'Taurus',
    symbol: '♉',
    constellationName: 'The Bull',
    startAngleDeg: 30,
    endAngleDeg: 60,
    element: 'Earth',
    color: '#10b981',
    stars: [
      { x: 0.3, y: 0.4, brightness: 1.2 },
      { x: 0.5, y: 0.3, brightness: 0.7 },
      { x: 0.65, y: 0.5, brightness: 0.75 },
      { x: 0.4, y: 0.7, brightness: 0.6 },
      { x: 0.2, y: 0.8, brightness: 0.85 }
    ]
  },
  {
    id: 2,
    sectorNumber: 3,
    name: 'Gemini',
    symbol: '♊',
    constellationName: 'The Twins',
    startAngleDeg: 60,
    endAngleDeg: 90,
    element: 'Air',
    color: '#06b6d4',
    stars: [
      { x: 0.35, y: 0.2, brightness: 1.1 },
      { x: 0.65, y: 0.2, brightness: 1.0 },
      { x: 0.35, y: 0.5, brightness: 0.7 },
      { x: 0.65, y: 0.5, brightness: 0.7 },
      { x: 0.3, y: 0.8, brightness: 0.6 },
      { x: 0.7, y: 0.8, brightness: 0.6 }
    ]
  },
  {
    id: 3,
    sectorNumber: 4,
    name: 'Cancer',
    symbol: '♋',
    constellationName: 'The Crab',
    startAngleDeg: 90,
    endAngleDeg: 120,
    element: 'Water',
    color: '#3b82f6',
    stars: [
      { x: 0.5, y: 0.3, brightness: 0.7 },
      { x: 0.3, y: 0.5, brightness: 0.8 },
      { x: 0.7, y: 0.5, brightness: 0.8 },
      { x: 0.5, y: 0.65, brightness: 0.9 },
      { x: 0.5, y: 0.85, brightness: 0.6 }
    ]
  },
  {
    id: 4,
    sectorNumber: 5,
    name: 'Leo',
    symbol: '♌',
    constellationName: 'The Lion',
    startAngleDeg: 120,
    endAngleDeg: 150,
    element: 'Fire',
    color: '#f59e0b',
    stars: [
      { x: 0.2, y: 0.3, brightness: 1.2 },
      { x: 0.3, y: 0.55, brightness: 0.8 },
      { x: 0.5, y: 0.45, brightness: 0.75 },
      { x: 0.7, y: 0.35, brightness: 0.7 },
      { x: 0.85, y: 0.6, brightness: 0.9 }
    ]
  },
  {
    id: 5,
    sectorNumber: 6,
    name: 'Virgo',
    symbol: '♍',
    constellationName: 'The Maiden',
    startAngleDeg: 150,
    endAngleDeg: 180,
    element: 'Earth',
    color: '#84cc16',
    stars: [
      { x: 0.3, y: 0.3, brightness: 1.2 },
      { x: 0.5, y: 0.4, brightness: 0.7 },
      { x: 0.7, y: 0.45, brightness: 0.7 },
      { x: 0.4, y: 0.7, brightness: 0.65 },
      { x: 0.6, y: 0.8, brightness: 0.6 }
    ]
  },
  {
    id: 6,
    sectorNumber: 7,
    name: 'Libra',
    symbol: '♎',
    constellationName: 'The Scales',
    startAngleDeg: 180,
    endAngleDeg: 210,
    element: 'Air',
    color: '#a855f7',
    stars: [
      { x: 0.5, y: 0.25, brightness: 0.9 },
      { x: 0.25, y: 0.6, brightness: 0.85 },
      { x: 0.75, y: 0.6, brightness: 0.8 },
      { x: 0.5, y: 0.85, brightness: 0.6 }
    ]
  },
  {
    id: 7,
    sectorNumber: 8,
    name: 'Scorpio',
    symbol: '♏',
    constellationName: 'The Scorpion',
    startAngleDeg: 210,
    endAngleDeg: 240,
    element: 'Water',
    color: '#ec4899',
    stars: [
      { x: 0.25, y: 0.3, brightness: 1.3 },
      { x: 0.35, y: 0.5, brightness: 0.8 },
      { x: 0.5, y: 0.7, brightness: 0.8 },
      { x: 0.7, y: 0.75, brightness: 0.9 },
      { x: 0.8, y: 0.6, brightness: 0.7 }
    ]
  },
  {
    id: 8,
    sectorNumber: 9,
    name: 'Sagittarius',
    symbol: '♐',
    constellationName: 'The Archer',
    startAngleDeg: 240,
    endAngleDeg: 270,
    element: 'Fire',
    color: '#f97316',
    stars: [
      { x: 0.3, y: 0.4, brightness: 0.9 },
      { x: 0.5, y: 0.3, brightness: 0.85 },
      { x: 0.7, y: 0.4, brightness: 0.8 },
      { x: 0.5, y: 0.6, brightness: 0.7 },
      { x: 0.3, y: 0.75, brightness: 0.8 }
    ]
  },
  {
    id: 9,
    sectorNumber: 10,
    name: 'Capricorn',
    symbol: '♑',
    constellationName: 'The Sea-Goat',
    startAngleDeg: 270,
    endAngleDeg: 300,
    element: 'Earth',
    color: '#14b8a6',
    stars: [
      { x: 0.25, y: 0.3, brightness: 0.8 },
      { x: 0.4, y: 0.5, brightness: 0.7 },
      { x: 0.6, y: 0.6, brightness: 0.75 },
      { x: 0.8, y: 0.4, brightness: 0.9 }
    ]
  },
  {
    id: 10,
    sectorNumber: 11,
    name: 'Aquarius',
    symbol: '♒',
    constellationName: 'The Water-Bearer',
    startAngleDeg: 300,
    endAngleDeg: 330,
    element: 'Air',
    color: '#00f3ff',
    stars: [
      { x: 0.3, y: 0.25, brightness: 0.9 },
      { x: 0.6, y: 0.35, brightness: 0.85 },
      { x: 0.4, y: 0.6, brightness: 0.7 },
      { x: 0.7, y: 0.7, brightness: 0.7 },
      { x: 0.5, y: 0.85, brightness: 0.65 }
    ]
  },
  {
    id: 11,
    sectorNumber: 12,
    name: 'Pisces',
    symbol: '♓',
    constellationName: 'The Fishes',
    startAngleDeg: 330,
    endAngleDeg: 360,
    element: 'Water',
    color: '#818cf8',
    stars: [
      { x: 0.2, y: 0.3, brightness: 0.8 },
      { x: 0.35, y: 0.6, brightness: 0.7 },
      { x: 0.65, y: 0.7, brightness: 0.85 },
      { x: 0.8, y: 0.4, brightness: 0.75 }
    ]
  }
];

// Helper to compute expected code from target sectors (e.g. Pisces=12, Cancer=4, etc.)
export function computeExpectedMissionCode(targets: MissionTarget[]): string {
  return targets.map(t => (t.targetSectorId + 1).toString()).join('-');
}

// Helper to compute currently observed code from placed planets
export function computeCurrentObservedCode(
  targets: MissionTarget[],
  planets: Record<PlanetId, PlanetaryState>
): string {
  return targets
    .map(t => {
      const pState = planets[t.planetId];
      if (pState && pState.apparentSector !== null) {
        return (pState.apparentSector + 1).toString();
      }
      return '?';
    })
    .join('-');
}

// Helper to verify code input format (supports "12", "4-4", "12-5-4" or "1254")
export function verifyEnteredCode(entered: string, targets: MissionTarget[]): boolean {
  if (!entered || targets.length === 0) return false;
  const cleanEntered = entered.trim().replace(/[\s,]+/g, '-');
  const expectedDash = computeExpectedMissionCode(targets);
  const rawEntered = entered.trim().replace(/[\s,-]+/g, '');
  const expectedRaw = targets.map(t => (t.targetSectorId + 1).toString()).join('');

  return cleanEntered === expectedDash || rawEntered === expectedRaw;
}

// Helper: Angle in radians for a given node (0..11)
export function getNodeAngleRad(nodeIndex: number, offsetDeg = 0): number {
  const deg = (nodeIndex * 30 + offsetDeg) % 360;
  return (deg * Math.PI) / 180;
}

// Helper: Angle in degrees for a given node (0..11)
export function getNodeAngleDeg(nodeIndex: number, offsetDeg = 0): number {
  return (nodeIndex * 30 + offsetDeg) % 360;
}

// 2D Coordinates: X = R * cos(theta), Y = R * sin(theta)
export function getHeliocentricPosition2D(radius: number, nodeIndex: number, offsetDeg = 0): { x: number; y: number } {
  const rad = getNodeAngleRad(nodeIndex, offsetDeg);
  return {
    x: radius * Math.cos(rad),
    y: radius * Math.sin(rad)
  };
}

// 3D Coordinates: X = R * cos(theta), Y = 0 (orbital plane), Z = -R * sin(theta)
// Matches right-handed coordinate system where top-down looking down -Y has standard Cartesian +X to right, +Y to top
export function getHeliocentricPosition3D(radius: number, nodeIndex: number, offsetDeg = 0): { x: number; y: number; z: number } {
  const rad = getNodeAngleRad(nodeIndex, offsetDeg);
  return {
    x: radius * Math.cos(rad),
    y: 0,
    z: -radius * Math.sin(rad)
  };
}

export interface ApparentObservationResult {
  apparentAngleDeg: number;       // 0 to 360 deg
  sectorIndex: number;            // 0 to 11
  sector: ZodiacSector;
  dx: number;                     // x_planet - x_earth
  dy: number;                     // y_planet - y_earth
  distanceFromEarth: number;
}

/**
 * Core mathematical calculation:
 * Given Earth's position and Planet's position:
 * dx = x_planet - x_earth
 * dy = y_planet - y_earth
 * apparentAngle = atan2(dy, dx)
 * sector = floor(apparentAngle / 30) % 12
 */
export function calculateApparentObservation(
  earthNode: number,
  earthRadius: number,
  planetNode: number,
  planetRadius: number,
  zodiacOffsetDeg = 0
): ApparentObservationResult {
  const ePos = getHeliocentricPosition2D(earthRadius, earthNode, 0);
  const pPos = getHeliocentricPosition2D(planetRadius, planetNode, 0);

  const dx = pPos.x - ePos.x;
  const dy = pPos.y - ePos.y;

  // Apparent angle from Earth toward the planet
  let rawAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (rawAngleDeg < 0) {
    rawAngleDeg += 360;
  }

  // Adjust for any global zodiac wheel rotation offset
  const normalizedAngleDeg = (rawAngleDeg - zodiacOffsetDeg + 360) % 360;
  // Subtract a tiny epsilon before flooring so that an angle sitting exactly
  // on a sector boundary (e.g. 30.0000° between Aries and Taurus) is assigned
  // to the lower sector rather than being bumped into the next one by floating-
  // point rounding. The epsilon (1e-9°) is far too small to affect any valid
  // non-boundary placement.
  const sectorIndex = Math.floor((normalizedAngleDeg - 1e-9) / 30) % 12;

  return {
    apparentAngleDeg: normalizedAngleDeg,
    sectorIndex,
    sector: ZODIAC_SECTORS[sectorIndex],
    dx,
    dy,
    distanceFromEarth: Math.sqrt(dx * dx + dy * dy)
  };
}

export interface SightlineIntersection {
  earth2D: { x: number; y: number };
  planet2D: { x: number; y: number };
  boundary2D: { x: number; y: number };
  earth3D: { x: number; y: number; z: number };
  planet3D: { x: number; y: number; z: number };
  boundary3D: { x: number; y: number; z: number };
  apparentAngleDeg: number;
  sectorIndex: number;
}

/**
 * Calculates the exact line from Earth through the planet to where it intersects
 * the outer celestial boundary circle at radius R_boundary.
 */
export function calculateSightlineIntersection(
  earthNode: number,
  earthRadius: number,
  planetNode: number,
  planetRadius: number,
  boundaryRadius = CELESTIAL_BOUNDARY_RADIUS,
  zodiacOffsetDeg = 0
): SightlineIntersection {
  const ePos = getHeliocentricPosition2D(earthRadius, earthNode, 0);
  const pPos = getHeliocentricPosition2D(planetRadius, planetNode, 0);

  const dx = pPos.x - ePos.x;
  const dy = pPos.y - ePos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Unit vector from Earth to planet
  const ux = dx / (dist || 1);
  const uy = dy / (dist || 1);

  // Ray equation: P(t) = E + t * U
  // |P(t)|^2 = R_b^2 => |E + t * U|^2 = R_b^2
  // t^2 + 2*(E dot U)*t + (|E|^2 - R_b^2) = 0
  const edotu = ePos.x * ux + ePos.y * uy;
  const eSq = ePos.x * ePos.x + ePos.y * ePos.y;
  const disc = edotu * edotu - (eSq - boundaryRadius * boundaryRadius);

  let t = 0;
  if (disc >= 0) {
    t = -edotu + Math.sqrt(disc);
  } else {
    t = boundaryRadius; // Fallback
  }

  const bx = ePos.x + t * ux;
  const by = ePos.y + t * uy;

  const obs = calculateApparentObservation(earthNode, earthRadius, planetNode, planetRadius, zodiacOffsetDeg);

  return {
    earth2D: ePos,
    planet2D: pPos,
    boundary2D: { x: bx, y: by },
    earth3D: { x: ePos.x, y: 0, z: -ePos.y },
    planet3D: { x: pPos.x, y: 0, z: -pPos.y },
    boundary3D: { x: bx, y: 0, z: -by },
    apparentAngleDeg: obs.apparentAngleDeg,
    sectorIndex: obs.sectorIndex
  };
}

/**
 * Solves and returns all valid orbital nodes [0..11] for a given planet that satisfy
 * appearing in targetSectorId when viewed from Earth at earthNode.
 */
export function findValidNodesForSector(
  planetId: PlanetId,
  targetSectorId: number,
  earthNode: number,
  zodiacOffsetDeg = 0
): number[] {
  const pDef = PLANET_DEFINITIONS[planetId];
  const eDef = PLANET_DEFINITIONS.earth;
  const validNodes: number[] = [];

  for (let candidateNode = 0; candidateNode < 12; candidateNode++) {
    const obs = calculateApparentObservation(
      earthNode,
      eDef.orbitalRadius,
      candidateNode,
      pDef.orbitalRadius,
      zodiacOffsetDeg
    );
    if (obs.sectorIndex === targetSectorId) {
      validNodes.push(candidateNode);
    }
  }

  return validNodes;
}

/**
 * Mission Validator: Verifies whether the player's current planetary placement
 * satisfies the mission requirements.
 */
export function verifyMissionSolution(
  targets: MissionTarget[],
  planets: Record<PlanetId, PlanetaryState>,
  earthNode: number,
  zodiacOffsetDeg = 0
): {
  isComplete: boolean;
  correctCount: number;
  totalRequired: number;
  results: Record<PlanetId, { targetSector: number; currentSector: number | null; isMatch: boolean }>;
} {
  const eDef = PLANET_DEFINITIONS.earth;
  const results: Record<PlanetId, { targetSector: number; currentSector: number | null; isMatch: boolean }> = {} as any;

  let correctCount = 0;

  for (const target of targets) {
    const planetState = planets[target.planetId];
    if (planetState && planetState.selectedNode !== null) {
      const obs = calculateApparentObservation(
        earthNode,
        eDef.orbitalRadius,
        planetState.selectedNode,
        planetState.orbitalRadius,
        zodiacOffsetDeg
      );
      const isMatch = obs.sectorIndex === target.targetSectorId;
      results[target.planetId] = {
        targetSector: target.targetSectorId,
        currentSector: obs.sectorIndex,
        isMatch
      };
      if (isMatch) correctCount++;
    } else {
      results[target.planetId] = {
        targetSector: target.targetSectorId,
        currentSector: null,
        isMatch: false
      };
    }
  }

  return {
    isComplete: correctCount === targets.length,
    correctCount,
    totalRequired: targets.length,
    results
  };
}
