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
import { soundFx } from '../utils/audio';
import { backendService, DEFAULT_TRIAL_ACCOUNT } from '../utils/supabase';
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
  graphicsQuality: 'high'
};

const TOTAL_ROUND_ONE_POINTS = 1000;
const PER_WRONG_PENALTY = 100;
// The clearance terminal stays sealed for the first 15 minutes of the round.
// Demos use a short gate so the whole flow can be exercised quickly.
const ROUND_ONE_CODE_LOCK_SECONDS = 15 * 60;
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

  const roundOneDone = (activeAccount?.['levels completion'] || 0) >= 1;
  const roundTwoDone = (activeAccount?.['levels completion'] || 0) >= 2;
  const roundThreeUnlocked = roundTwoDone;
  const roundOnePoints = activeAccount?.['level 1 points'] || 0;
  const roundTwoPoints = activeAccount?.['level 2 points'] || 0;

  // Time left until the PIN terminal opens. Demos unlock almost immediately so
  // the admin can see the whole round without waiting a quarter of an hour.
  const codeUnlockSeconds = useMemo(() => {
    const elapsed = Math.max(0, settings.missionDurationSeconds - timeRemaining);
    const gate = isDemoMode ? DEMO_CODE_LOCK_SECONDS : ROUND_ONE_CODE_LOCK_SECONDS;
    return Math.max(0, gate - elapsed);
  }, [settings.missionDurationSeconds, timeRemaining, isDemoMode]);
  const codeTerminalUnlocked = codeUnlockSeconds <= 0;

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

    if (isDemoMode) {
      if (report.points >= TOTAL_ROUND_ONE_POINTS) {
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

    if (report.points >= TOTAL_ROUND_ONE_POINTS) {
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
    setPhase('round_report');
  }, [activeAccount, teamName, currentMission.codeName, isDemoMode]);

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
          let points = attempt?.points ?? 0;
          if (!attempt || attempt.correct === 0 || !attempt.code || attempt.code.trim() === '') {
            points = 300;
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
  }, [isTimerRunning, currentMission.targets]);

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
    if (zodiacTableShown) {
      setZodiacTableError(true);
      soundFx.playErrorTone();
      return;
    }
    setZodiacTableShown(true);
    setZodiacTableVisible(true);
    persistRefTableShown(teamName);
    setIsTimerRunning(false);
    soundFx.playZodiacRevelation();
  }, [zodiacTableShown, teamName]);

  const hideZodiacTable = useCallback(() => {
    setZodiacTableVisible(false);
    setIsTimerRunning(phaseRef.current === 'round_one' && timeRef.current > 0);
  }, []);

  const dismissZodiacTableError = useCallback(() => {
    setZodiacTableError(false);
  }, []);

  // ── Round 1 PIN attempts: unlimited tries, graded when the round ends ─────
  // The terminal only tells the squad whether the PIN is correct or wrong. It
  // never reveals which digits matched, and a submission does not close the
  // round — the last attempt is what counts at the end.
  const submitRoundCode = useCallback((code: string): RoundOneAttempt => {
    const expectedDigits = currentMission.targets.map(t => t.targetSectorId + 1);
    const enteredDigits = splitCode(code, expectedDigits);

    let correct = 0;
    expectedDigits.forEach((digit, idx) => {
      if (enteredDigits[idx] === digit) correct += 1;
    });

    const wrong = expectedDigits.length - correct;
    let points = Math.max(0, TOTAL_ROUND_ONE_POINTS - PER_WRONG_PENALTY * wrong);
    if (correct === 0 || enteredDigits.length === 0 || code.trim() === '') {
      points = 300;
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
  }, [currentMission.targets]);

  /** Closes Round 1 early. The latest submitted PIN is the one that is graded. */
  const endRoundOne = useCallback(() => {
    const attempt = latestAttemptRef.current;
    const expectedDigits = currentMission.targets.map(t => t.targetSectorId + 1);
    let points = attempt?.points ?? 0;
    if (!attempt || attempt.correct === 0 || !attempt.code || attempt.code.trim() === '') {
      points = 300;
    }
    finaliseRoundOne({
      points,
      correct: attempt?.correct ?? 0,
      total: expectedDigits.length,
      timedOut: false,
      expectedCode: expectedDigits.join('-'),
      enteredCode: attempt?.code ?? ''
    });
  }, [currentMission.targets, finaliseRoundOne]);

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
    setPhase('hub');
  }, [activeAccount, teamName, isDemoMode]);

  // ── Round progression ─────────────────────────────────────────────────────
  const startRoundOne = useCallback(() => {
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
    try {
      soundFx.startAmbient();
    } catch (err) {
      console.warn('Audio ambient deferred:', err);
    }
  }, [settings, initPlanets]);

  const startRoundTwo = useCallback(() => {
    setIsTimerRunning(false);
    setShowCodeModal(false);
    setCurrentMissionIndex(1);
    setPhase('round_two_briefing');
  }, []);

  const beginRoundTwo = useCallback(() => {
    setIsTimerRunning(false);
    setShowCodeModal(false);
    setCurrentMissionIndex(1);
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
  }, [settings, initPlanets]);

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

  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
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
