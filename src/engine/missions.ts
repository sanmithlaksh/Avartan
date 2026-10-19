// Mission Management and Generation Engine
import { Mission, PlanetId, MissionTarget } from './types';
import {
  findValidNodesForSector,
  getReachableSectors,
  computeExpectedMissionCode,
  ZODIAC_SECTORS,
  PLANET_DEFINITIONS
} from './astronomy';

// Codes already handed out on this device. Round 1 is regenerated until its
// clearance sequence has never been used before, so two teams (or two runs)
// never solve the same code.
const USED_CODES_KEY = 'avartan_used_round_codes';

const readUsedCodes = (): string[] => {
  try {
    const raw = localStorage.getItem(USED_CODES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === 'string') : [];
  } catch {
    return [];
  }
};

const rememberCode = (code: string) => {
  try {
    const used = [...readUsedCodes(), code].slice(-120);
    localStorage.setItem(USED_CODES_KEY, JSON.stringify(used));
  } catch {
    // Storage can be unavailable in private windows — the code is still unique within the session.
  }
};

const ACTIVE_MISSION_KEY = 'avartan_round_one_mission';

/** Restores the in-flight round-1 puzzle so a page reload cannot reshuffle it. */
export function loadRoundOneMission(): Mission | null {
  try {
    const raw = localStorage.getItem(ACTIVE_MISSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Mission;
    if (!parsed || !Array.isArray(parsed.targets) || parsed.targets.length !== ROUND_ONE_PLANETS.length) {
      return null;
    }
    return {
      ...PRESET_MISSIONS[0],
      ...parsed,
      expectedCode: computeExpectedMissionCode(parsed.targets)
    };
  } catch {
    return null;
  }
}

const persistMission = (mission: Mission) => {
  try {
    localStorage.setItem(ACTIVE_MISSION_KEY, JSON.stringify(mission));
  } catch {
    // Optional cache only.
  }
};

/** All seven movable worlds, in the order their digits appear in the code. */
export const ROUND_ONE_PLANETS: PlanetId[] = [
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune'
];

/**
 * Builds a fresh round-1 alignment puzzle.
 *
 * Each planet is dropped on a randomly chosen sign it can physically reach from
 * the locked Earth vantage, and the resulting clearance code is guaranteed to be
 * one that has never been issued before on this device.
 */
export function generateRoundOneMission(
  earthNode = 1,
  zodiacOffsetDeg = 0
): Mission {
  const base = PRESET_MISSIONS[0];
  const used = readUsedCodes();

  let targets: MissionTarget[] = base.targets;
  let code = computeExpectedMissionCode(targets);

  for (let attempt = 0; attempt < 80; attempt++) {
    const candidate: MissionTarget[] = ROUND_ONE_PLANETS.map(planetId => {
      const reachable = getReachableSectors(planetId, earthNode, zodiacOffsetDeg);
      const pool = reachable.length > 0 ? reachable : [0];
      return {
        planetId,
        targetSectorId: pool[Math.floor(Math.random() * pool.length)]
      };
    });
    const candidateCode = computeExpectedMissionCode(candidate);
    targets = candidate;
    code = candidateCode;
    if (!used.includes(candidateCode)) break;
  }

  rememberCode(code);

  const mission: Mission = {
    ...base,
    id: `mission-avartan-${code.replace(/-/g, '')}`,
    targets,
    expectedCode: code
  };
  persistMission(mission);
  return mission;
}

export const PRESET_MISSIONS: Mission[] = [
  {
    id: 'mission-avartan-master',
    type: 'SYSTEM_RECOVERY',
    title: 'AVARTAN: Celestial Restoration',
    codeName: 'OP-AVARTAN',
    briefing: 'Ancient stellar maps have been erased. Activate the outer boundary, reveal the celestial reference wheel, and restore all seven planetary alignments from memory to recover the lost navigation sequence.',
    targets: [
      { planetId: 'mercury', targetSectorId: 7 }, // Scorpio (code 8)
      { planetId: 'venus',   targetSectorId: 6 }, // Libra   (code 7)
      { planetId: 'mars',    targetSectorId: 4 }, // Leo     (code 5)
      { planetId: 'jupiter', targetSectorId: 4 }, // Leo     (code 5)
      { planetId: 'saturn',  targetSectorId: 0 }, // Aries   (code 1)
      { planetId: 'uranus',  targetSectorId: 2 }, // Gemini  (code 3)
      { planetId: 'neptune', targetSectorId: 0 }, // Aries   (code 1)
    ],
    expectedCode: '8-7-5-5-1-3-1',
    hints: [
      'Hold the outer celestial boundary ring for 15 seconds to activate the zodiac reference system.',
      'After activation, hold the boundary again for 10 seconds to reveal the planetary position table — memorise it! It only shows once.',
      'Place each planet on the correct orbital node so its sightline from Earth matches your memorised sector.'
    ],
    pointsReward: 1000
  },
  {
    id: 'mission-beta-2',
    type: 'MULTI_PLANET_SAME_SECTOR',
    title: 'The Great Cancer Conjunction',
    codeName: 'OP-CONJUNCTION-CANCER',
    briefing: 'Sensors detect a celestial resonance gateway that only unlocks when two worlds converge upon the same celestial sightline. Align both Jupiter and Mars so that both appear in Cancer simultaneously when observed from Earth.',
    targets: [
      { planetId: 'mars', targetSectorId: 3 },
      { planetId: 'jupiter', targetSectorId: 3 }
    ],
    expectedCode: '4-4',
    hints: [
      'Both planets can share the same apparent direction even while occupying vastly different distances from the Sun.',
      'Position Mars first along the Earth-to-Cancer line, then project the line outward to align Jupiter.',
      'Verify that Earth, Mars, Jupiter, and the Cancer celestial sector form an outward collinear sightline.'
    ],
    pointsReward: 300
  },
  {
    id: 'mission-gamma-3',
    type: 'MULTI_PLANET_MULTI_SECTOR',
    title: 'The Triad Triangulation',
    codeName: 'OP-TRIAD-ALIGNMENT',
    briefing: 'A high-level cryptographic lock requires a three-planet triangulation. Synchronize the solar system so that Saturn aligns with Pisces, Mars aligns with Leo, and Jupiter aligns with Cancer.',
    targets: [
      { planetId: 'saturn', targetSectorId: 11 },
      { planetId: 'mars', targetSectorId: 4 },
      { planetId: 'jupiter', targetSectorId: 3 }
    ],
    expectedCode: '12-5-4',
    hints: [
      'Break down the puzzle planet by planet. Earth remains your steadfast pivot for each calculation.',
      'Mars moves along a closer orbit, while Jupiter and Saturn sweep wide outer arcs.',
      'Observe each planet individually using the observation ray to ensure each intersects its designated sector.'
    ],
    pointsReward: 450
  }
];

/**
 * Validates that a mission is mathematically solvable for a given Earth node.
 */
export function validateMissionSolvability(
  mission: Mission,
  earthNode: number,
  zodiacOffsetDeg = 0
): { isSolvable: boolean; solutionMap: Record<PlanetId, number[]> } {
  const solutionMap: Record<PlanetId, number[]> = {} as any;

  if (mission.type === 'REVERSE_IDENTIFICATION' && mission.reverseQuestion) {
    return { isSolvable: true, solutionMap };
  }

  for (const target of mission.targets) {
    const validNodes = findValidNodesForSector(
      target.planetId,
      target.targetSectorId,
      earthNode,
      zodiacOffsetDeg
    );
    solutionMap[target.planetId] = validNodes;
    if (validNodes.length === 0) {
      return { isSolvable: false, solutionMap };
    }
  }

  return { isSolvable: true, solutionMap };
}

export function generateDynamicMission(
  earthNode: number,
  type: 'SINGLE_PLANET' | 'MULTI_PLANET_SAME_SECTOR' | 'MULTI_PLANET_MULTI_SECTOR',
  zodiacOffsetDeg = 0
): Mission {
  const movablePlanets: PlanetId[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

  if (type === 'SINGLE_PLANET') {
    const planetId = movablePlanets[Math.floor(Math.random() * movablePlanets.length)];
    const reachableSectors: number[] = [];
    for (let s = 0; s < 12; s++) {
      if (findValidNodesForSector(planetId, s, earthNode, zodiacOffsetDeg).length > 0) {
        reachableSectors.push(s);
      }
    }
    const targetSectorId = reachableSectors[Math.floor(Math.random() * reachableSectors.length)];
    const sector = ZODIAC_SECTORS[targetSectorId];
    const pDef = PLANET_DEFINITIONS[planetId];
    return {
      id: `dynamic-${Date.now()}`,
      type: 'SINGLE_PLANET',
      title: `Alignment Protocol: ${pDef.name} to ${sector.name}`,
      codeName: `DYN-${pDef.name.toUpperCase()}-${sector.name.toUpperCase()}`,
      briefing: `Position ${pDef.name} so it appears in ${sector.name} (${sector.symbol}) from Earth.`,
      targets: [{ planetId, targetSectorId }],
      hints: [
        'Select the planet and observe how the sightline moves as you rotate between the 12 orbital nodes.',
        `The target sector ${sector.name} lies between ${sector.startAngleDeg}° and ${sector.endAngleDeg}°.`,
        'Use the OBSERVE button to trace the sighting ray from Earth through the planet.'
      ],
      pointsReward: 150
    };
  } else {
    const p1: PlanetId = 'mars';
    const p2: PlanetId = 'jupiter';
    const p3: PlanetId = 'saturn';
    const s1 = (earthNode + 2) % 12;
    const s2 = (earthNode + 5) % 12;
    const s3 = (earthNode + 8) % 12;
    return {
      id: `dynamic-${Date.now()}`,
      type: 'MULTI_PLANET_MULTI_SECTOR',
      title: 'Orbital Triad Alignment Protocol',
      codeName: 'DYN-TRIAD-SEC',
      briefing: `Align Mars with ${ZODIAC_SECTORS[s1].name}, Jupiter with ${ZODIAC_SECTORS[s2].name}, Saturn with ${ZODIAC_SECTORS[s3].name}.`,
      targets: [
        { planetId: p1, targetSectorId: s1 },
        { planetId: p2, targetSectorId: s2 },
        { planetId: p3, targetSectorId: s3 }
      ],
      hints: ['Handle each body sequentially.', 'Earth is your fixed anchor.', 'Observe each planet individually.'],
      pointsReward: 450
    };
  }
}
