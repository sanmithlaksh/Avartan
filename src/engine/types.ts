// Types for The Hidden Orbit - Celestial Alignment Game

export type PlanetId = 
  | 'mercury' 
  | 'venus' 
  | 'earth' 
  | 'mars' 
  | 'jupiter' 
  | 'saturn' 
  | 'uranus' 
  | 'neptune';

export interface PlanetDefinition {
  id: PlanetId;
  name: string;
  orbitalRadius: number; // Heliocentric distance in simulation units
  size: number;          // Visual radius
  color: string;
  glowColor: string;
  description: string;
  hasRings?: boolean;
  ringInnerRadius?: number;
  ringOuterRadius?: number;
  ringColor?: string;
  textureType: 'rocky' | 'dense_atmosphere' | 'earth' | 'red_rock' | 'gas_giant_bands' | 'ringed_gas' | 'ice_giant' | 'blue_ice';
}

export interface PlanetaryState {
  id: PlanetId;
  name: string;
  orbitalRadius: number;
  selectedNode: number | null; // 0 to 11 (each 30 degrees)
  isLocked: boolean;           // Earth is locked
  apparentSector: number | null; // 0 to 11 calculated from Earth
  apparentAngleDeg: number | null; // 0 to 360
}

export interface ZodiacSector {
  id: number;          // 0 to 11
  sectorNumber: number; // 1 to 12 (Aries=1, Taurus=2, etc.)
  name: string;
  symbol: string;      // Unicode zodiac glyph
  displayBadge?: string; // '1' exclusively for Aries, undefined for rest!
  constellationName: string;
  startAngleDeg: number; // 0, 30, 60...
  endAngleDeg: number;   // 30, 60, 90...
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  color: string;
  stars: Array<{ x: number; y: number; brightness: number }>; // Relative 2D constellation star pattern
}

export type MissionType = 
  | 'SINGLE_PLANET' 
  | 'MULTI_PLANET_SAME_SECTOR' 
  | 'MULTI_PLANET_MULTI_SECTOR' 
  | 'REVERSE_IDENTIFICATION' 
  | 'SYSTEM_RECOVERY';

export interface MissionTarget {
  planetId: PlanetId;
  targetSectorId: number; // 0 to 11
}

export interface Mission {
  id: string;
  type: MissionType;
  title: string;
  codeName: string;
  briefing: string;
  targets: MissionTarget[];
  expectedCode?: string; // e.g. "12" or "4-4" or "12-5-4"
  // For reverse identification:
  reverseQuestion?: {
    givenPlanetId: PlanetId;
    givenNodeIndex: number;
    correctSectorId: number;
  };
  hints: [string, string, string];
  pointsReward: number;
}

export interface TeamScoreEntry {
  id: string;
  teamName: string;
  score: number;
  timeRemainingSeconds: number;
  timeElapsedSeconds: number;
  attemptsUsed: number;
  launchCode: string;
  completedAt: string;
  missionCompleted: boolean;
}

// User & Team Account schema matching exact Supabase column specifications
export interface TeamAccount {
  id?: number | string;
  'Name 1': string;
  'Name 2': string;
  'Team Name': string;
  'Password': string;
  'Current level': number;
  'levels completion': number;
  'level 1 points': number;
  'level 2 points': number;
  'level 3 points': number;
  'total level points': number;
  created_at?: string;
  updated_at?: string;
}

export interface GameSettings {
  earthStartingNode: number; // 0-11 (default 3 = 90 deg / June Solstice)
  earthDateLabel: string;
  missionDurationSeconds: number; // default 360 (6 min)
  maxAttempts: number; // default 3
  hintsEnabled: boolean;
  zodiacAngularOffsetDeg: number; // default 0
  boundaryRadius: number; // default 36
  soundEnabled: boolean;
  musicEnabled: boolean;
  graphicsQuality: 'high' | 'medium' | 'low';
  demoCodeLockSeconds?: number; // override for demo/admin testing
  roundOneCodeLockSeconds?: number; // normal round lock
}

export type GamePhase =
  | 'welcome'
  | 'login'
  | 'hub'
  | 'round_one'
  | 'round_report'
  | 'demo_report'
  | 'round_two_briefing'
  | 'round_two'
  // Player score card shown after Level 2, then the gated waiting screen, then Level 3.
  | 'score_dashboard'
  | 'round_three_wait'
  | 'round_three';

// Result card shown the moment Round 1 ends (code graded or clock expired).
export interface RoundOneReport {
  points: number;
  correct: number;
  total: number;
  timedOut: boolean;
  expectedCode: string;
  enteredCode: string;
}

/** One PIN attempt. Round 1 keeps the latest one and grades it when the round ends. */
export interface RoundOneAttempt {
  code: string;
  correct: number;
  total: number;
  points: number;
  isCorrect: boolean;
  attempts: number;
}

export type ViewMode = '3d' | '2d' | 'split';
