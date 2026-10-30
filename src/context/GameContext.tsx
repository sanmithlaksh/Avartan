// Central authoritative Game State and Context Provider
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  PlanetId,
  PlanetaryState,
  Mission,
  GameSettings,
  GamePhase,
  ViewMode,
  TeamAccount,
  RoundOneReport,
  RoundOneAttempt
} from '../engine/types';
import {
  PLANET_DEFINITIONS,
  observePlanetNode
} from '../engine/astronomy';
import { PRESET_MISSIONS, generateRoundOneMission, loadRoundOneMission } from '../engine/missions';
import { Riddle, assignRiddles, matchesRiddleAnswer } from '../engine/riddles';
import { soundFx } from '../utils/audio';
import { backendService, DEFAULT_TRIAL_ACCOUNT } from '../utils/supabase';
import { Board, DEFAULT_BOARD, fetchBoard } from '../utils/api';
import confetti from 'canvas-confetti';

interface ValidationFeedback {
  isComplete: boolean;
  correctCount: number;
  totalRequired: number;
  message: string;
  details: Record<PlanetId, { targetSector: number; currentSector: number | null; isMatch: boolean }>;
}

interface GameContextType {
  // State
  phase: GamePhase;
  planets: Record<PlanetId, PlanetaryState>;
  selectedPlanetId: PlanetId | null;
  zodiacRevealed: boolean;
  observationActive: boolean;
  currentMission: Mission;
  currentMissionIndex: number;
  attemptsRemaining: number;
  score: number;
  timeRemaining: number;
  isTimerRunning: boolean;
  hintsUsedCount: number;
  launchCode: string | null;
  teamName: string;
  activeAccount: TeamAccount | null;
  viewMode: ViewMode;
  settings: GameSettings;
  discoveryProgress: number; // 0 to 100
  validationFeedback: ValidationFeedback | null;
  showIntroModal: boolean;
  showDiscoveryModal: boolean;
  showSuccessModal: boolean;
  showHintsModal: boolean;
  showLeaderboardModal: boolean;
  showAdminModal: boolean;
  showCodeModal: boolean;
  patternResult: { correct: number; total: number; accuracy: number; points: number } | null;
  isAdmin: boolean;
  isRoundOne: boolean;
  isDemoMode: boolean;

  // Shared admin board (Supabase-backed: level switches, Round 3 gate, notice board)
  board: Board;
  boardLoaded: boolean;
  refreshBoard: () => Promise<void>;
  lastSave: { saved: boolean; message: string } | null;
  enterRoundThree: () => void;
  continueFromScoreCard: () => void;

  // Round progression
  roundOneDone: boolean;
  roundTwoDone: boolean;
  roundThreeUnlocked: boolean;
  roundOneReport: RoundOneReport | null;
  roundOnePoints: number;
  roundTwoPoints: number;
  totalPoints: number;
  latestAttempt: RoundOneAttempt | null;
  codeTerminalUnlocked: boolean;
  codeUnlockSeconds: number;
  startRoundOne: () => void;
  startRoundTwo: () => void;
  beginRoundTwo: () => void;
  goToHub: () => void;
  submitRoundCode: (code: string) => RoundOneAttempt;
  endRoundOne: () => void;
  completePatternEvent: (points: number, correct: number, total: number) => void;
  startDemoRound: (level: number) => void;
  exitDemo: () => void;

  zodiacTableShown: boolean;
  zodiacTableVisible: boolean;
  zodiacTableError: boolean;
  showZodiacTable: () => void;
  hideZodiacTable: () => void;
  dismissZodiacTableError: () => void;

  // Round 1 riddle chain → one-time reference chart → per-planet code digits
  riddles: Record<PlanetId, Riddle> | null;
  riddleSolved: PlanetId[];
  riddleWrong: Record<string, number>;
  activeRiddlePlanet: PlanetId | null;
  allRiddlesSolved: boolean;
  openRiddle: (planetId: PlanetId) => void;
  closeRiddle: () => void;
  submitRiddleAnswer: (planetId: PlanetId, answer: string) => boolean;
  chartSeconds: number;
  chartUsed: boolean;
  emergencyRevealAvailable: boolean;
  emergencySecondsLeft: number;
  chartGateMsg: string | null;
  clearChartGateMsg: () => void;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setActiveAccount: (account: TeamAccount | null) => void;
  setTeamName: (name: string) => void;
  selectPlanet: (id: PlanetId | null) => void;
  setPlanetNode: (planetId: PlanetId, nodeIndex: number) => void;
  toggleObservation: () => void;
  setDiscoveryProgress: (progress: number) => void;
  triggerZodiacDiscovery: () => void;
  advanceToNextMission: () => void;
  startMission: () => void;
  restartRoundOne: () => void;
  revealNextHint: () => void;
  resetCurrentMission: () => void;
  restartGame: () => void;
  setViewMode: (mode: ViewMode) => void;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  setMissionByIndex: (index: number) => void;
  updateActiveTeamLevel: (level: number) => void;
  logoutTeam: () => void;
  toggleMute: () => void;
  isMuted: boolean;

  // Modals
  setShowIntroModal: (show: boolean) => void;
  setShowDiscoveryModal: (show: boolean) => void;
  setShowSuccessModal: (show: boolean) => void;
  setShowHintsModal: (show: boolean) => void;
  setShowLeaderboardModal: (show: boolean) => void;
  setShowAdminModal: (show: boolean) => void;
  setShowCodeModal: (show: boolean) => void;
  setShowPatternEvent: (show: boolean) => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  earthStartingNode: 1, // Node 1 = 30 deg (Scorpio Solar Configuration)
  earthDateLabel: 'Scorpio Solar Configuration',
  missionDurationSeconds: 2100,
  maxAttempts: 3,
  hintsEnabled: true,
  zodiacAngularOffsetDeg: 0,
  boundaryRadius: 40,
  soundEnabled: true,
  musicEnabled: true,
  graphicsQuality: 'high',
  demoCodeLockSeconds: 20,
  roundOneCodeLockSeconds: 15
};

const DEFAULT_TOTAL_ROUND_ONE_POINTS = 1000;
const DEFAULT_PER_WRONG_PENALTY = 100;
const DEFAULT_MIN_ROUND_ONE_POINTS = 300;
// The clearance terminal stays sealed for the first 15 seconds of the round.
// Demos use a short gate so the whole flow can be exercised quickly.
const ROUND_ONE_CODE_LOCK_SECONDS = 15;
const DEMO_CODE_LOCK_SECONDS = 20;

const refTableKey = (team: string) => `avartan_ref_table_shown:${team.trim().toLowerCase()}`;

const readRefTableShown = (team: string): boolean => {
  try {
    return localStorage.getItem(refTableKey(team)) === '1';
  } catch {
    return false;
  }
};

const persistRefTableShown = (team: string) => {
  try {
    localStorage.setItem(refTableKey(team), '1');
  } catch {
    // Optional cache only — the table stays one-time within the session.
  }
};

/** Reference-chart viewing window used when the admin has not set one. */
export const DEFAULT_CHART_SECONDS = 30;
/** After 15:00 of round time a squad that is stuck gets one emergency chart reveal. */
export const ROUND_ONE_EMERGENCY_SECONDS = 15 * 60;

interface StoredRiddleState {
  sessionId: string;
  assignment: Record<PlanetId, Riddle>;
  solved: PlanetId[];
  chartUsed: boolean;
}

const riddleStateKey = (team: string) =>
  `avartan_round1_riddles:${(team || 'guest').trim().toLowerCase()}`;

/**
 * Riddle progress is cached per team so a page reload cannot reshuffle the hand
 * mid-round. A new mission id re-deals everything, which is what makes the
 * riddles different on every fresh login.
 */
const readRiddleState = (team: string): StoredRiddleState | null => {
  try {
    const raw = localStorage.getItem(riddleStateKey(team));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRiddleState;
    if (!parsed || typeof parsed.sessionId !== 'string' || !parsed.assignment) return null;
    return {
      sessionId: parsed.sessionId,
      assignment: parsed.assignment,
      solved: Array.isArray(parsed.solved) ? parsed.solved : [],
      chartUsed: !!parsed.chartUsed
    };
  } catch {
    return null;
  }
};

const writeRiddleState = (team: string, state: StoredRiddleState) => {
  try {
    localStorage.setItem(riddleStateKey(team), JSON.stringify(state));
  } catch {
    // Private windows: the chain simply restarts on reload.
  }
};

const splitCode = (code: string, expected?: number[]): number[] => {
  if (!code) return [];
  const nonDigitStripped = code.replace(/\D/g, '');
  if (nonDigitStripped && expected && expected.length > 0) {
    const expectedStr = expected.map(String);
    let result: number[] = [];
    let idx = 0;
    for (let i = 0; i < expectedStr.length && idx < nonDigitStripped.length; i++) {
      const len = expectedStr[i].length;
      const take = nonDigitStripped.substr(idx, len);
      if (take) {
        result.push(parseInt(take, 10));
        idx += len;
      } else {
        break;
      }
    }
    if (result.length === expected.length) {
      return result;
    }
  }
  const matches = code.match(/\d+/g);
  return matches ? matches.map(Number) : [];
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [activeAccount, setActiveAccountState] = useState<TeamAccount | null>(() => backendService.getActiveAccount());
  const [teamName, setTeamNameState] = useState<string>(activeAccount?.['Team Name'] || 'Admin');

  // Every launch lands on the welcome page. A stored session is still kept so the
  // login terminal can restore progress, but it never skips the homepage.
  const [phase, setPhase] = useState<GamePhase>('welcome');
  const [currentMissionIndex, setCurrentMissionIndex] = useState<number>(0);

  // Round 1 is generated per team/session: every planet gets a random reachable
  // sign and the resulting clearance code has never been used before.
  const [roundOneMission, setRoundOneMission] = useState<Mission>(() =>
    loadRoundOneMission() ??
    generateRoundOneMission(DEFAULT_SETTINGS.earthStartingNode, DEFAULT_SETTINGS.zodiacAngularOffsetDeg)
  );
  const missions = useMemo<Mission[]>(() => {
    const list = [...PRESET_MISSIONS];
    list[0] = roundOneMission;
    return list;
  }, [roundOneMission]);
  const currentMission = missions[currentMissionIndex] || missions[0];
  const isRoundOne = currentMissionIndex === 0;

  const [selectedPlanetId, setSelectedPlanetId] = useState<PlanetId | null>('saturn');
  const [zodiacRevealed, setZodiacRevealed] = useState<boolean>(false);
  const [discoveryProgress, setDiscoveryProgress] = useState<number>(0);
  const [observationActive, setObservationActive] = useState<boolean>(true);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(settings.maxAttempts);
  const [score, setScore] = useState<number>(activeAccount?.['total level points'] || 0);
  const [timeRemaining, setTimeRemaining] = useState<number>(settings.missionDurationSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [hintsUsedCount, setHintsUsedCount] = useState<number>(0);
  const [launchCode, setLaunchCode] = useState<string | null>(null);
  const [viewModeState, setViewModeState] = useState<ViewMode>('3d');
  const [validationFeedback, setValidationFeedback] = useState<ValidationFeedback | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [roundOneReport, setRoundOneReport] = useState<RoundOneReport | null>(null);
  const [latestAttempt, setLatestAttempt] = useState<RoundOneAttempt | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [board, setBoard] = useState<Board>(DEFAULT_BOARD);
  const [boardLoaded, setBoardLoaded] = useState<boolean>(false);
  const [lastSave, setLastSave] = useState<{ saved: boolean; message: string } | null>(null);
  const roundTwoStartRef = useRef<number>(0);

  // The admin board lives in Supabase (the Level 3 config object), so every device
  // sees the same switches. Polled so an unlock lands without a page reload.
  const refreshBoard = useCallback(async () => {
    try {
      const fresh = await fetchBoard();
      setBoard(fresh);
    } catch {
      // Offline: keep the last known board so play can continue.
    } finally {
      setBoardLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshBoard();
    const timer = window.setInterval(refreshBoard, 10000);
    return () => window.clearInterval(timer);
  }, [refreshBoard]);

  // Track round 2 start time when entering round_two phase
  useEffect(() => {
    if (phase === 'round_two' && roundTwoStartRef.current === 0) {
      roundTwoStartRef.current = Date.now();
    }
  }, [phase]);

  // Modals — the hub (round cards) replaced the old auto-opening briefing.
  const [showIntroModal, setShowIntroModal] = useState<boolean>(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showHintsModal, setShowHintsModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [patternResult, setPatternResult] = useState<{
    correct: number;
    total: number;
    accuracy: number;
    points: number;
  } | null>(null);
  const [zodiacTableShown, setZodiacTableShown] = useState<boolean>(() =>
    readRefTableShown(activeAccount?.['Team Name'] || '')
  );
  const [zodiacTableVisible, setZodiacTableVisible] = useState<boolean>(false);
  const [zodiacTableError, setZodiacTableError] = useState<boolean>(false);

  // ── Round 1 riddle chain ──────────────────────────────────────────────────
  const [riddles, setRiddles] = useState<Record<PlanetId, Riddle> | null>(null);
  const [riddleSolved, setRiddleSolved] = useState<PlanetId[]>([]);
  const [riddleWrong, setRiddleWrong] = useState<Record<string, number>>({});
  const [activeRiddlePlanet, setActiveRiddlePlanet] = useState<PlanetId | null>(null);
  const [chartUsed, setChartUsed] = useState<boolean>(false);
  const [chartGateMsg, setChartGateMsg] = useState<string | null>(null);

  // Restore this team's hand for the mission in flight, or deal a fresh one.
  useEffect(() => {
    const stored = readRiddleState(teamName);
    if (stored && stored.sessionId === roundOneMission.id) {
      setRiddles(stored.assignment);
      setRiddleSolved(stored.solved);
      setChartUsed(stored.chartUsed);
      return;
    }
    const fresh = assignRiddles();
    setRiddles(fresh);
    setRiddleSolved([]);
    setRiddleWrong({});
    setChartUsed(false);
    setChartGateMsg(null);
  }, [roundOneMission.id, teamName]);

  // Mirror the chain so a reload keeps the same riddles and the spent chart.
  useEffect(() => {
    if (!riddles) return;
    writeRiddleState(teamName, {
      sessionId: roundOneMission.id,
      assignment: riddles,
      solved: riddleSolved,
      chartUsed
    });
  }, [riddles, riddleSolved, chartUsed, roundOneMission.id, teamName]);

  const roundOneDone = ((activeAccount?.['levels completion'] || 0) >= 1) && ((activeAccount?.['level 1 points'] || 0) > 0 || (activeAccount?.['levels completion'] || 0) >= 2);
  const roundTwoDone = ((activeAccount?.['levels completion'] || 0) >= 2) && ((activeAccount?.['level 2 points'] || 0) > 0);
  // Round 3 stays closed until the admin explicitly flips the switch, even for a
  // team that has already finished Levels 1 and 2.
  const roundThreeUnlocked = roundTwoDone && board.r3.on;
  const roundOnePoints = activeAccount?.['level 1 points'] || 0;
  const roundTwoPoints = activeAccount?.['level 2 points'] || 0;

  // Time left until the PIN terminal opens. Demos unlock almost immediately so
  // the admin can see the whole round without waiting a quarter of an hour.
  const codeUnlockSeconds = useMemo(() => {
    const elapsed = Math.max(0, settings.missionDurationSeconds - timeRemaining);
    const gate = isDemoMode
      ? (settings.demoCodeLockSeconds ?? DEMO_CODE_LOCK_SECONDS)
      : (settings.roundOneCodeLockSeconds ?? ROUND_ONE_CODE_LOCK_SECONDS);
    return Math.max(0, gate - elapsed);
  }, [settings.missionDurationSeconds, timeRemaining, isDemoMode, settings.demoCodeLockSeconds, settings.roundOneCodeLockSeconds]);
  const codeTerminalUnlocked = codeUnlockSeconds <= 0;

  const roundElapsedSeconds = Math.max(0, settings.missionDurationSeconds - timeRemaining);
  const allRiddlesSolved = riddleSolved.length >= currentMission.targets.length;
  const emergencySecondsLeft = Math.max(0, ROUND_ONE_EMERGENCY_SECONDS - roundElapsedSeconds);
  const emergencyRevealAvailable =
    !chartUsed && !allRiddlesSolved && emergencySecondsLeft <= 0 && isRoundOne;
  // Admin-tunable viewing window for the planet ↔ zodiac reference chart.
  const chartSeconds = Math.max(1, Number(board.l1?.chartSeconds) || DEFAULT_CHART_SECONDS);

  const totalPoints = useMemo(() => {
    if (!activeAccount) return 0;
    return (
      (activeAccount['level 1 points'] || 0) +
      (activeAccount['level 2 points'] || 0) +
      (activeAccount['level 3 points'] || 0)
    );
  }, [activeAccount]);

  // Synchronize account on login
  const setActiveAccount = useCallback((account: TeamAccount | null) => {
    setActiveAccountState(account);
    backendService.setActiveAccount(account);
    if (account) {
      setTeamNameState(account['Team Name']);
      setScore(account['total level points'] || 0);
      setZodiacTableShown(readRefTableShown(account['Team Name']));
    }
  }, []);
  const isAdmin = !!activeAccount && activeAccount['Team Name'].trim().toLowerCase() === 'admin';

  const setTeamName = useCallback((name: string) => {
    setTeamNameState(name);
  }, []);

  const logoutTeam = useCallback(() => {
    backendService.setActiveAccount(null);
    setActiveAccountState(null);
    setIsTimerRunning(false);
    setShowCodeModal(false);
    setRoundOneReport(null);
    setLatestAttempt(null);
    setPatternResult(null);
    setIsDemoMode(false);
    setLastSave(null);
    setPhase('welcome');
  }, []);

  // Initialize planetary states
  const initPlanets = useCallback((earthNode: number): Record<PlanetId, PlanetaryState> => {
    const states: Record<PlanetId, PlanetaryState> = {} as any;
    const allPlanetKeys: PlanetId[] = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

    allPlanetKeys.forEach(id => {
      const def = PLANET_DEFINITIONS[id];
      const isEarth = id === 'earth';
      const selectedNode = isEarth ? earthNode : null;
      let apparentSector: number | null = null;
      let apparentAngleDeg: number | null = null;

      if (selectedNode !== null && !isEarth) {
        const obs = observePlanetNode(
          id,
          selectedNode,
          earthNode,
          settings.zodiacAngularOffsetDeg
        );
        if (obs) {
          apparentSector = obs.sectorIndex;
          apparentAngleDeg = obs.apparentAngleDeg;
        }
      }

      states[id] = {
        id,
        name: def.name,
        orbitalRadius: def.orbitalRadius,
        selectedNode,
        isLocked: isEarth,
        apparentSector,
        apparentAngleDeg
      };
    });

    return states;
  }, [settings.zodiacAngularOffsetDeg]);

  const [planets, setPlanets] = useState<Record<PlanetId, PlanetaryState>>(() =>
    initPlanets(DEFAULT_SETTINGS.earthStartingNode)
  );

  // Update planets if Earth node changes via settings
  useEffect(() => {
    setPlanets(prev => {
      const next = { ...prev };
      next.earth = {
        ...next.earth,
        selectedNode: settings.earthStartingNode,
        isLocked: true
      };
      Object.keys(next).forEach(k => {
        const pId = k as PlanetId;
        if (pId !== 'earth' && next[pId].selectedNode !== null) {
          const obs = observePlanetNode(
            pId,
            next[pId].selectedNode!,
            settings.earthStartingNode,
            settings.zodiacAngularOffsetDeg
          );
          next[pId].apparentSector = obs ? obs.sectorIndex : null;
          next[pId].apparentAngleDeg = obs ? obs.apparentAngleDeg : null;
        }
      });
      return next;
    });
  }, [settings.earthStartingNode, settings.zodiacAngularOffsetDeg]);

  // ── Round 1 finalisation ───────────────────────────────────────────────────
  // Persists the score card for the round, unlocks Round 2 and shows the report.
  const finaliseRoundOne = useCallback((report: RoundOneReport) => {
    setIsTimerRunning(false);
    setShowCodeModal(false);
    setActiveRiddlePlanet(null);

    const l1Cfg = board?.l1 || {};
    const totalPointsL1 = Math.max(0, Number(l1Cfg.totalPoints) ?? DEFAULT_TOTAL_ROUND_ONE_POINTS);

    if (isDemoMode) {
      if (report.points >= totalPointsL1) {
        const codeSuffix = Math.floor(1000 + Math.random() * 9000);
        setLaunchCode(`ORBIT-${currentMission.codeName.replace('OP-', '')}-${codeSuffix}`);
        soundFx.playSuccessTone();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } else {
        soundFx.playErrorTone();
      }
      setRoundOneReport(report);
      // Demo scores are temporary: show them before returning to the portal.
      setPhase('demo_report');
      return;
    }

    const base = activeAccount || DEFAULT_TRIAL_ACCOUNT;
    const updated: TeamAccount = {
      ...base,
      'Team Name': teamName,
      'Current level': Math.max(2, base['Current level'] || 1),
      'levels completion': Math.max(1, base['levels completion'] || 0),
      'level 1 points': report.points,
      'total level points':
        report.points + (base['level 2 points'] || 0) + (base['level 3 points'] || 0)
    };

    if (report.points >= totalPointsL1) {
      const codeSuffix = Math.floor(1000 + Math.random() * 9000);
      setLaunchCode(`ORBIT-${currentMission.codeName.replace('OP-', '')}-${codeSuffix}`);
      soundFx.playSuccessTone();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } else {
      soundFx.playErrorTone();
    }

    setRoundOneReport(report);
    setScore(updated['total level points']);
    setActiveAccountState(updated);
    backendService.updateTeamAccount(updated);
    // Mirror the score into the shared Supabase project (queued if it is offline).
    const elapsed = Math.max(0, settings.missionDurationSeconds - timeRemaining);
    backendService.saveRoundScore(1, elapsed, report.points).then(setLastSave);
    setPhase('round_report');
  }, [activeAccount, teamName, currentMission.codeName, isDemoMode, settings.missionDurationSeconds, timeRemaining, board]);

  // Kept in a ref so the ticking effect can finalise without restarting.
  const finaliseRoundOneRef = useRef(finaliseRoundOne);
  useEffect(() => {
    finaliseRoundOneRef.current = finaliseRoundOne;
  }, [finaliseRoundOne]);

  // The latest PIN attempt is mirrored in a ref so the ticking countdown can
  // grade it without re-registering the interval on every submission.
  const latestAttemptRef = useRef<RoundOneAttempt | null>(null);
  useEffect(() => {
    latestAttemptRef.current = latestAttempt;
  }, [latestAttempt]);

  // Round 1 countdown. When it hits zero the latest submitted PIN is graded;
  // with no submission at all the round closes on zero points.
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = window.setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          window.clearInterval(interval);
          soundFx.playErrorTone();
          const attempt = latestAttemptRef.current;
          const l1Cfg = board?.l1 || {};
          const minPoints = Math.max(0, Number(l1Cfg.minPoints) ?? DEFAULT_MIN_ROUND_ONE_POINTS);
          let points = attempt?.points ?? 0;
          if (!attempt || attempt.correct === 0 || !attempt.code || attempt.code.trim() === '') {
            points = minPoints;
          }
          finaliseRoundOneRef.current({
            points,
            correct: attempt?.correct ?? 0,
            total: currentMission.targets.length,
            timedOut: true,
            expectedCode: currentMission.targets.map(t => t.targetSectorId + 1).join('-'),
            enteredCode: attempt?.code ?? ''
          });
          return 0;
        }
        if (prev <= 30 && prev % 2 === 0) {
          soundFx.playCountdownTick();
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isTimerRunning, currentMission.targets, board]);

  // Planet selection
  const selectPlanet = useCallback((id: PlanetId | null) => {
    setSelectedPlanetId(id);
    if (id) {
      soundFx.playPlanetSelect();
    }
  }, []);

  // Set orbital node for a planet
  const setPlanetNode = useCallback((planetId: PlanetId, nodeIndex: number) => {
    if (planetId === 'earth') return;

    soundFx.playNodeSnap();

    setPlanets(prev => {
      const p = prev[planetId];
      if (!p) return prev;

      const earthNode = settings.earthStartingNode;
      const obs = observePlanetNode(
        planetId,
        nodeIndex,
        earthNode,
        settings.zodiacAngularOffsetDeg
      );

      return {
        ...prev,
        [planetId]: {
          ...p,
          selectedNode: nodeIndex,
          apparentSector: obs ? obs.sectorIndex : null,
          apparentAngleDeg: obs ? obs.apparentAngleDeg : null
        }
      };
    });
  }, [settings.earthStartingNode, settings.zodiacAngularOffsetDeg]);

  const toggleObservation = useCallback(() => {
    setObservationActive(prev => !prev);
  }, []);

  const triggerZodiacDiscovery = useCallback(() => {
    if (!zodiacRevealed) {
      setZodiacRevealed(true);
      setShowDiscoveryModal(true);
      soundFx.playZodiacRevelation();
    }
  }, [zodiacRevealed]);

  // The one-time reference table pauses the round clock while it is on screen.
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const timeRef = useRef(timeRemaining);
  timeRef.current = timeRemaining;

  const showZodiacTable = useCallback(() => {
    if (chartUsed) {
      setChartGateMsg('The reference chart has already been spent this round.');
      soundFx.playErrorTone();
      return;
    }

    const total = currentMission.targets.length;
    const sealed = riddleSolved.length >= total;
    const elapsed = Math.max(0, settings.missionDurationSeconds - timeRef.current);
    const remaining = Math.max(0, ROUND_ONE_EMERGENCY_SECONDS - elapsed);

    // The chart is the reward for the riddle chain. If the squad is stuck, the
    // 15:00 mark opens one emergency viewing instead — never both.
    if (!sealed && remaining > 0) {
      const mins = Math.floor(remaining / 60);
      const secs = String(remaining % 60).padStart(2, '0');
      setChartGateMsg(
        `Sealed riddles ${riddleSolved.length}/${total}. The chart opens once every riddle is answered — or hold the rim again at 15:00 for one emergency reveal (${mins}:${secs} away).`
      );
      soundFx.playErrorTone();
      return;
    }

    setChartUsed(true);
    setChartGateMsg(null);
    setZodiacTableShown(true);
    setZodiacTableVisible(true);
    setIsTimerRunning(false);
    soundFx.playZodiacRevelation();
  }, [chartUsed, currentMission.targets.length, riddleSolved.length, settings.missionDurationSeconds]);

  const hideZodiacTable = useCallback(() => {
    setZodiacTableVisible(false);
    setIsTimerRunning(phaseRef.current === 'round_one' && timeRef.current > 0);
  }, []);

  const dismissZodiacTableError = useCallback(() => {
    setZodiacTableError(false);
  }, []);

  // ── Riddle chain ─────────────────────────────────────────────────────────
  const openRiddle = useCallback((planetId: PlanetId) => {
    if (!zodiacRevealed) {
      setChartGateMsg('Decrypt the outer boundary first — hold the rim for 10 seconds.');
      return;
    }
    if (chartUsed) {
      setChartGateMsg('The reference chart is spent. Place your worlds and read their code digits.');
      return;
    }
    if (riddleSolved.includes(planetId)) return;
    setActiveRiddlePlanet(planetId);
  }, [zodiacRevealed, chartUsed, riddleSolved]);

  const closeRiddle = useCallback(() => {
    setActiveRiddlePlanet(null);
  }, []);

  const submitRiddleAnswer = useCallback((planetId: PlanetId, answer: string): boolean => {
    const riddle = riddles?.[planetId];
    if (!riddle) return false;
    if (matchesRiddleAnswer(riddle, answer)) {
      setRiddleSolved(prev => (prev.includes(planetId) ? prev : [...prev, planetId]));
      soundFx.playSuccessTone();
      return true;
    }
    setRiddleWrong(prev => ({ ...prev, [planetId]: (prev[planetId] ?? 0) + 1 }));
    soundFx.playErrorTone();
    return false;
  }, [riddles]);

  const clearChartGateMsg = useCallback(() => setChartGateMsg(null), []);

  // ── Round 1 PIN attempts: unlimited tries, graded when the round ends ─────
  // The terminal only tells the squad whether the PIN is correct or wrong. It
  // never reveals which digits matched, and a submission does not close the
  // round — the last attempt is what counts at the end.
  const submitRoundCode = useCallback((code: string): RoundOneAttempt => {
    const expectedDigits = currentMission.targets.map(t => t.targetSectorId + 1);
    const enteredDigits = splitCode(code, expectedDigits);

    const l1Cfg = board?.l1 || {};
    const totalPointsL1 = Math.max(0, Number(l1Cfg.totalPoints) ?? DEFAULT_TOTAL_ROUND_ONE_POINTS);
    const wrongPenalty = Math.max(0, Number(l1Cfg.wrongPenalty) ?? DEFAULT_PER_WRONG_PENALTY);
    const minPoints = Math.max(0, Number(l1Cfg.minPoints) ?? DEFAULT_MIN_ROUND_ONE_POINTS);

    let correct = 0;
    expectedDigits.forEach((digit, idx) => {
      if (enteredDigits[idx] === digit) correct += 1;
    });

    const wrong = expectedDigits.length - correct;
    let points = Math.max(0, totalPointsL1 - wrongPenalty * wrong);
    if (correct === 0 || enteredDigits.length === 0 || code.trim() === '') {
      points = minPoints;
    }
    const attempts = (latestAttemptRef.current?.attempts ?? 0) + 1;

    const attempt: RoundOneAttempt = {
      code: enteredDigits.length > 0 ? enteredDigits.join('-') : code.trim(),
      correct,
      total: expectedDigits.length,
      points,
      isCorrect: wrong === 0,
      attempts
    };

    setLatestAttempt(attempt);
    latestAttemptRef.current = attempt;
    setValidationFeedback({
      isComplete: wrong === 0,
      correctCount: correct,
      totalRequired: expectedDigits.length,
      message: wrong === 0 ? 'PIN CORRECT' : 'PIN INCORRECT',
      details: {} as ValidationFeedback['details']
    });

    return attempt;
  }, [currentMission.targets, board]);

  /** Closes Round 1 early. The latest submitted PIN is the one that is graded. */
  const endRoundOne = useCallback(() => {
    const attempt = latestAttemptRef.current;
    const expectedDigits = currentMission.targets.map(t => t.targetSectorId + 1);
    const l1Cfg = board?.l1 || {};
    const minPoints = Math.max(0, Number(l1Cfg.minPoints) ?? DEFAULT_MIN_ROUND_ONE_POINTS);
    let points = attempt?.points ?? 0;
    if (!attempt || attempt.correct === 0 || !attempt.code || attempt.code.trim() === '') {
      points = minPoints;
    }
    finaliseRoundOne({
      points,
      correct: attempt?.correct ?? 0,
      total: expectedDigits.length,
      timedOut: false,
      expectedCode: expectedDigits.join('-'),
      enteredCode: attempt?.code ?? ''
    });
  }, [currentMission.targets, finaliseRoundOne, board]);

  /**
   * Persists the round-2 result for this team: level-2 points, levels completed
   * and the combined total used by the leaderboard and the admin console.
   */
  const completePatternEvent = useCallback((points: number, correct: number, total: number) => {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    if (isDemoMode) {
      setPatternResult({ correct, total, accuracy, points });
      // Keep demo mode on so the temporary score card knows not to save anything.
      setPhase('demo_report');
      return;
    }

    const base = activeAccount || DEFAULT_TRIAL_ACCOUNT;
    const totalLevelPoints =
      (base['level 1 points'] || 0) + points + (base['level 3 points'] || 0);

    const updated: TeamAccount = {
      ...base,
      'Team Name': teamName,
      'Current level': Math.max(3, base['Current level'] || 1),
      'levels completion': Math.max(2, base['levels completion'] || 0),
      'level 2 points': points,
      'total level points': totalLevelPoints
    };

    setPatternResult({ correct, total, accuracy, points });
    setScore(totalLevelPoints);
    setActiveAccountState(updated);
    backendService.updateTeamAccount(updated);
    // Save Level 2, then show this team their own score card (not the hub).
    const elapsedSec = roundTwoStartRef.current > 0 ? Math.max(0, Math.floor((Date.now() - roundTwoStartRef.current) / 1000)) : 0;
    backendService
      .saveRoundScore(2, elapsedSec, points)
      .then(setLastSave)
      .finally(() => {
        roundTwoStartRef.current = 0;
        setPhase('score_dashboard');
      });
  }, [activeAccount, teamName, isDemoMode]);

  /** Leaves the score card for the waiting screen that is gated by the admin. */
  const continueFromScoreCard = useCallback(() => {
    setPhase('round_three_wait');
  }, []);

  /** Only reachable when the admin has unlocked Round 3. */
  const enterRoundThree = useCallback(() => {
    if (!board.r3.on) return;
    // Redirect to beginning login screen instead of going directly to round three
    setPhase('login');
  }, [board.r3.on]);

  // ── Round progression ─────────────────────────────────────────────────────
  const startRoundOne = useCallback(() => {
    // The admin can close a level without shipping new game files.
    if (!board.levels.l1.on) return;
    const fresh = generateRoundOneMission(
      settings.earthStartingNode,
      settings.zodiacAngularOffsetDeg
    );
    setRoundOneMission(fresh);
    setCurrentMissionIndex(0);
    setTimeRemaining(settings.missionDurationSeconds);
    setAttemptsRemaining(settings.maxAttempts);
    setPlanets(initPlanets(settings.earthStartingNode));
    setSelectedPlanetId('saturn');
    setValidationFeedback(null);
    setHintsUsedCount(0);
    setRoundOneReport(null);
    setLatestAttempt(null);
    setLaunchCode(null);
    setShowCodeModal(false);
    setZodiacTableVisible(false);
    setZodiacTableError(false);
    setPhase('round_one');
    setIsTimerRunning(true);
    setActiveRiddlePlanet(null);
    setChartGateMsg(null);
    try {
      soundFx.startAmbient();
    } catch (err) {
      console.warn('Audio ambient deferred:', err);
    }
  }, [settings, initPlanets]);

  const startRoundTwo = useCallback(() => {
    if (!board.levels.l2.on) return;
    setIsTimerRunning(false);
    setShowCodeModal(false);
    setCurrentMissionIndex(1);
    setPhase('round_two_briefing');
  }, []);

  const beginRoundTwo = useCallback(() => {
    setIsTimerRunning(false);
    setShowCodeModal(false);
    setCurrentMissionIndex(1);
    roundTwoStartRef.current = Date.now();
    setPhase('round_two');
  }, []);

  const goToHub = useCallback(() => {
    setIsTimerRunning(false);
    setShowCodeModal(false);
    setShowSuccessModal(false);
    // Leaving a demo round drops the admin back on the login portal, not on the
    // team mission cards.
    if (isDemoMode) {
      setIsDemoMode(false);
      setPhase('welcome');
      return;
    }
    setPhase('hub');
  }, [isDemoMode]);

  const startMission = startRoundOne;

  const restartRoundOne = useCallback(() => {
    setTimeRemaining(settings.missionDurationSeconds);
    setAttemptsRemaining(settings.maxAttempts);
    setValidationFeedback(null);
    setLatestAttempt(null);
    setHintsUsedCount(0);
    setSelectedPlanetId('saturn');
    setPlanets(initPlanets(settings.earthStartingNode));
    setPhase('round_one');
    setIsTimerRunning(true);
  }, [settings, initPlanets]);

  const advanceToNextMission = useCallback(() => {
    setShowSuccessModal(false);
    startRoundTwo();
  }, [startRoundTwo]);

  // Admin override — jumps straight into the chosen round.
  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateActiveTeamLevel = useCallback((level: number) => {
    setShowAdminModal(false);
    setIsDemoMode(false);
    if (level === 1) startRoundOne();
    else if (level === 2) startRoundTwo();
    else setPhase('hub');
  }, [startRoundOne, startRoundTwo]);

  const startDemoRound = useCallback((level: number) => {
    setShowAdminModal(false);
    setIsDemoMode(true);
    if (level === 1) {
      const fresh = generateRoundOneMission(
        settings.earthStartingNode,
        settings.zodiacAngularOffsetDeg
      );
      setRoundOneMission(fresh);
      setCurrentMissionIndex(0);
      let demoTotal = settings.missionDurationSeconds;
      let demoLock = settings.demoCodeLockSeconds ?? DEMO_CODE_LOCK_SECONDS;
      try {
        const t = localStorage.getItem('demo_round1_total');
        const l = localStorage.getItem('demo_round1_lock');
        if (t) demoTotal = parseInt(t);
        if (l) demoLock = parseInt(l);
        localStorage.removeItem('demo_round1_total');
        localStorage.removeItem('demo_round1_lock');
      } catch {}
      updateSettings({ missionDurationSeconds: demoTotal, demoCodeLockSeconds: demoLock });
      setTimeRemaining(demoTotal);
      setAttemptsRemaining(settings.maxAttempts);
      setPlanets(initPlanets(settings.earthStartingNode));
      setSelectedPlanetId('saturn');
      setValidationFeedback(null);
      setHintsUsedCount(0);
      setRoundOneReport(null);
      setLatestAttempt(null);
      setLaunchCode(null);
      setShowCodeModal(false);
      setZodiacTableVisible(false);
      setZodiacTableError(false);
      setPhase('round_one');
      setIsTimerRunning(true);
      try {
        soundFx.startAmbient();
      } catch (err) {
        console.warn('Audio ambient deferred:', err);
      }
    } else if (level === 2) {
      setIsTimerRunning(false);
      setShowCodeModal(false);
      setCurrentMissionIndex(1);
      setPhase('round_two');
    } else {
      setIsTimerRunning(false);
      setShowCodeModal(false);
      setPhase('hub');
    }
  }, [settings, initPlanets, updateSettings]);

  /** Leaves a demo (and its temporary score card) for the admin login portal. */
  const exitDemo = useCallback(() => {
    setIsDemoMode(false);
    setRoundOneReport(null);
    setPatternResult(null);
    setLatestAttempt(null);
    setShowCodeModal(false);
    setIsTimerRunning(false);
    setPhase('welcome');
  }, []);

  const setMissionByIndex = useCallback((idx: number) => {
    setCurrentMissionIndex(idx);
    setValidationFeedback(null);
    setHintsUsedCount(0);
    setPlanets(initPlanets(settings.earthStartingNode));
  }, [settings.earthStartingNode, initPlanets]);

  const revealNextHint = useCallback(() => {
    if (hintsUsedCount < 3) {
      setHintsUsedCount(c => c + 1);
    }
  }, [hintsUsedCount]);

  const resetCurrentMission = useCallback(() => {
    setPlanets(initPlanets(settings.earthStartingNode));
    setValidationFeedback(null);
    setSelectedPlanetId('saturn');
  }, [initPlanets, settings.earthStartingNode]);

  const restartGame = useCallback(() => {
    setScore(0);
    setTimeRemaining(settings.missionDurationSeconds);
    setAttemptsRemaining(settings.maxAttempts);
    setZodiacRevealed(false);
    setDiscoveryProgress(0);
    setValidationFeedback(null);
    setHintsUsedCount(0);
    setLaunchCode(null);
    setZodiacTableVisible(false);
    setZodiacTableError(false);
    setPatternResult(null);
    setRoundOneReport(null);
    setLatestAttempt(null);
    setCurrentMissionIndex(0);
    setShowAdminModal(false);
    setRoundOneMission(generateRoundOneMission(
      settings.earthStartingNode,
      settings.zodiacAngularOffsetDeg
    ));
    setPlanets(initPlanets(settings.earthStartingNode));
    setPhase('hub');
  }, [settings, initPlanets]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      soundFx.setMuted(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    phase,
    planets,
    selectedPlanetId,
    zodiacRevealed,
    observationActive,
    currentMission,
    currentMissionIndex,
    attemptsRemaining,
    score,
    timeRemaining,
    isTimerRunning,
    hintsUsedCount,
    launchCode,
    teamName,
    activeAccount,
    viewMode: viewModeState,
    settings,
    discoveryProgress,
    validationFeedback,
    showIntroModal,
    showDiscoveryModal,
    showSuccessModal,
    showHintsModal,
    showLeaderboardModal,
    showAdminModal,
    showCodeModal,
    patternResult,
    isAdmin,
    isRoundOne,
    isDemoMode,
    board,
    boardLoaded,
    refreshBoard,
    lastSave,
    enterRoundThree,
    continueFromScoreCard,
    roundOneDone,
    roundTwoDone,
    roundThreeUnlocked,
    roundOneReport,
    roundOnePoints,
    roundTwoPoints,
    totalPoints,
    latestAttempt,
    codeTerminalUnlocked,
    codeUnlockSeconds,
    startRoundOne,
    startRoundTwo,
    beginRoundTwo,
    goToHub,
    submitRoundCode,
    endRoundOne,
    completePatternEvent,
    startDemoRound,
    exitDemo,
    zodiacTableShown,
    zodiacTableVisible,
    zodiacTableError,
    showZodiacTable,
    hideZodiacTable,
    dismissZodiacTableError,

    riddles,
    riddleSolved,
    riddleWrong,
    activeRiddlePlanet,
    allRiddlesSolved,
    openRiddle,
    closeRiddle,
    submitRiddleAnswer,
    chartSeconds,
    chartUsed,
    emergencyRevealAvailable,
    emergencySecondsLeft,
    chartGateMsg,
    clearChartGateMsg,

    setPhase,
    setActiveAccount,
    setTeamName,
    selectPlanet,
    setPlanetNode,
    toggleObservation,
    setDiscoveryProgress,
    triggerZodiacDiscovery,
    advanceToNextMission,
    startMission,
    restartRoundOne,
    revealNextHint,
    resetCurrentMission,
    restartGame,
    setViewMode,
    updateSettings,
    setMissionByIndex,
    updateActiveTeamLevel,
    logoutTeam,
    toggleMute,
    isMuted,

    setShowIntroModal,
    setShowDiscoveryModal,
    setShowSuccessModal,
    setShowHintsModal,
    setShowLeaderboardModal,
    setShowAdminModal,
    setShowCodeModal,
    setShowPatternEvent: () => undefined
  }), [
    phase,
    planets,
    selectedPlanetId,
    zodiacRevealed,
    observationActive,
    currentMission,
    currentMissionIndex,
    attemptsRemaining,
    score,
    timeRemaining,
    isTimerRunning,
    hintsUsedCount,
    launchCode,
    teamName,
    activeAccount,
    viewModeState,
    settings,
    discoveryProgress,
    validationFeedback,
    showIntroModal,
    showDiscoveryModal,
    showSuccessModal,
    showHintsModal,
    showLeaderboardModal,
    showAdminModal,
    showCodeModal,
    patternResult,
    isAdmin,
    isRoundOne,
    isDemoMode,
    board,
    boardLoaded,
    refreshBoard,
    lastSave,
    enterRoundThree,
    continueFromScoreCard,
    roundOneDone,
    roundTwoDone,
    roundThreeUnlocked,
    roundOneReport,
    roundOnePoints,
    roundTwoPoints,
    totalPoints,
    latestAttempt,
    codeTerminalUnlocked,
    codeUnlockSeconds,
    startRoundOne,
    startRoundTwo,
    beginRoundTwo,
    goToHub,
    submitRoundCode,
    endRoundOne,
    completePatternEvent,
    startDemoRound,
    exitDemo,
    zodiacTableShown,
    zodiacTableVisible,
    zodiacTableError,
    showZodiacTable,
    hideZodiacTable,
    dismissZodiacTableError,
    riddles,
    riddleSolved,
    riddleWrong,
    activeRiddlePlanet,
    allRiddlesSolved,
    openRiddle,
    closeRiddle,
    submitRiddleAnswer,
    chartSeconds,
    chartUsed,
    emergencyRevealAvailable,
    emergencySecondsLeft,
    chartGateMsg,
    clearChartGateMsg,
    setPhase,
    setActiveAccount,
    setTeamName,
    selectPlanet,
    setPlanetNode,
    toggleObservation,
    setDiscoveryProgress,
    triggerZodiacDiscovery,
    advanceToNextMission,
    startMission,
    restartRoundOne,
    revealNextHint,
    resetCurrentMission,
    restartGame,
    setViewMode,
    updateSettings,
    setMissionByIndex,
    updateActiveTeamLevel,
    logoutTeam,
    toggleMute,
    isMuted
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
