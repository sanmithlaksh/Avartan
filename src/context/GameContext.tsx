// Central authoritative Game State and Context Provider
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  PlanetId,
  PlanetaryState,
  Mission,
  GameSettings,
  GamePhase,
  ViewMode,
  TeamAccount
} from '../engine/types';
import {
  PLANET_DEFINITIONS,
  calculateApparentObservation,
  verifyMissionSolution
} from '../engine/astronomy';
import { PRESET_MISSIONS } from '../engine/missions';
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
  submitValidation: () => boolean;
  advanceToNextMission: () => void;
  startMission: () => void;
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
}

const DEFAULT_SETTINGS: GameSettings = {
  earthStartingNode: 1, // Node 1 = 30 deg (Scorpio Solar Configuration)
  earthDateLabel: 'Scorpio Solar Configuration',
  missionDurationSeconds: 360,
  maxAttempts: 3,
  hintsEnabled: true,
  zodiacAngularOffsetDeg: 0,
  boundaryRadius: 40,
  soundEnabled: true,
  musicEnabled: true,
  graphicsQuality: 'high'
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [activeAccount, setActiveAccountState] = useState<TeamAccount | null>(() => backendService.getActiveAccount());
  const [teamName, setTeamNameState] = useState<string>(activeAccount?.['Team Name'] || 'Admin');
  const [phase, setPhase] = useState<GamePhase>(activeAccount ? 'intro' : 'welcome');
  const [currentMissionIndex, setCurrentMissionIndex] = useState<number>(0);
  const currentMission = PRESET_MISSIONS[currentMissionIndex] || PRESET_MISSIONS[0];

  const [selectedPlanetId, setSelectedPlanetId] = useState<PlanetId | null>('saturn');
  const [zodiacRevealed, setZodiacRevealed] = useState<boolean>(false);
  const [discoveryProgress, setDiscoveryProgress] = useState<number>(0);
  const [observationActive, setObservationActive] = useState<boolean>(true);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(settings.maxAttempts);
  const [score, setScore] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(settings.missionDurationSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [hintsUsedCount, setHintsUsedCount] = useState<number>(0);
  const [launchCode, setLaunchCode] = useState<string | null>(null);
  const [viewModeState, setViewModeState] = useState<ViewMode>('3d');
  const [validationFeedback, setValidationFeedback] = useState<ValidationFeedback | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals
  const [showIntroModal, setShowIntroModal] = useState<boolean>(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showHintsModal, setShowHintsModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [zodiacTableShown, setZodiacTableShown] = useState<boolean>(false);
  const [zodiacTableVisible, setZodiacTableVisible] = useState<boolean>(false);
  const [zodiacTableError, setZodiacTableError] = useState<boolean>(false);

  // Synchronize account on login
  const setActiveAccount = useCallback((account: TeamAccount | null) => {
    setActiveAccountState(account);
    backendService.setActiveAccount(account);
    if (account) {
      setTeamNameState(account['Team Name']);
      const level = account['Current level'] || 1;
      const targetIdx = Math.max(0, Math.min(PRESET_MISSIONS.length - 1, level - 1));
      setCurrentMissionIndex(targetIdx);
      setScore(account['total level points'] || 0);
    }
  }, []);

  const setTeamName = useCallback((name: string) => {
    setTeamNameState(name);
  }, []);

  const logoutTeam = useCallback(() => {
    backendService.setActiveAccount(null);
    setActiveAccountState(null);
    setIsTimerRunning(false);
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
        const obs = calculateApparentObservation(
          earthNode,
          PLANET_DEFINITIONS.earth.orbitalRadius,
          selectedNode,
          def.orbitalRadius,
          settings.zodiacAngularOffsetDeg
        );
        apparentSector = obs.sectorIndex;
        apparentAngleDeg = obs.apparentAngleDeg;
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
          const obs = calculateApparentObservation(
            settings.earthStartingNode,
            PLANET_DEFINITIONS.earth.orbitalRadius,
            next[pId].selectedNode!,
            next[pId].orbitalRadius,
            settings.zodiacAngularOffsetDeg
          );
          next[pId].apparentSector = obs.sectorIndex;
          next[pId].apparentAngleDeg = obs.apparentAngleDeg;
        }
      });
      return next;
    });
  }, [settings.earthStartingNode, settings.zodiacAngularOffsetDeg]);

  // Timer countdown hook
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setPhase('game_over');
            soundFx.playErrorTone();
            return 0;
          }
          if (prev <= 30 && prev % 2 === 0) {
            soundFx.playCountdownTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining]);

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
      const obs = calculateApparentObservation(
        earthNode,
        PLANET_DEFINITIONS.earth.orbitalRadius,
        nodeIndex,
        p.orbitalRadius,
        settings.zodiacAngularOffsetDeg
      );

      return {
        ...prev,
        [planetId]: {
          ...p,
          selectedNode: nodeIndex,
          apparentSector: obs.sectorIndex,
          apparentAngleDeg: obs.apparentAngleDeg
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

  const showZodiacTable = useCallback(() => {
    if (zodiacTableShown) {
      setZodiacTableError(true);
      soundFx.playErrorTone();
      return;
    }
    setZodiacTableShown(true);
    setZodiacTableVisible(true);
    soundFx.playZodiacRevelation();
  }, [zodiacTableShown]);

  const hideZodiacTable = useCallback(() => {
    setZodiacTableVisible(false);
  }, []);

  const dismissZodiacTableError = useCallback(() => {
    setZodiacTableError(false);
  }, []);

  // Submit celestial alignment solution
  const submitValidation = useCallback((): boolean => {
    if (phase !== 'positioning' && phase !== 'observing') return false;

    const verification = verifyMissionSolution(
      currentMission.targets,
      planets,
      settings.earthStartingNode,
      settings.zodiacAngularOffsetDeg
    );

    if (verification.isComplete) {
      const hintPenalty = hintsUsedCount * 50;
      const timeBonus = Math.max(0, Math.floor(timeRemaining * 1.5));
      const attemptBonus = attemptsRemaining * 50;
      const totalEarned = Math.max(100, currentMission.pointsReward + timeBonus + attemptBonus - hintPenalty);
      const newScore = score + totalEarned;

      setScore(newScore);
      setPhase('mission_success');
      setIsTimerRunning(false);

      const codeSuffix = Math.floor(1000 + Math.random() * 9000);
      const codeName = `ORBIT-${currentMission.codeName.replace('OP-', '')}-${codeSuffix}`;
      setLaunchCode(codeName);

      soundFx.playSuccessTone();
      setShowSuccessModal(true);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Update team points across level 1, 2, 3
      const lvl = currentMissionIndex + 1;
      const updatedAccount: TeamAccount = {
        ...(activeAccount || DEFAULT_TRIAL_ACCOUNT),
        'Team Name': teamName,
        'Current level': Math.min(3, lvl + 1),
        'levels completion': 0, // Remains 0 for testing phase as specified
        [`level ${lvl} points` as 'level 1 points']: totalEarned,
        'total level points': newScore
      };

      setActiveAccountState(updatedAccount);
      backendService.updateTeamAccount(updatedAccount);

      setValidationFeedback({
        isComplete: true,
        correctCount: verification.correctCount,
        totalRequired: verification.totalRequired,
        message: 'CELESTIAL ALIGNMENT CONFIRMED! Sightlines converge on designated celestial sectors.',
        details: verification.results
      });

      return true;
    } else {
      soundFx.playErrorTone();
      const newAttempts = attemptsRemaining - 1;
      setAttemptsRemaining(newAttempts);

      if (newAttempts <= 0) {
        setPhase('game_over');
        setIsTimerRunning(false);
        setValidationFeedback({
          isComplete: false,
          correctCount: verification.correctCount,
          totalRequired: verification.totalRequired,
          message: 'ALIGNMENT FAILED: Maximum attempts exhausted. Recalibration required.',
          details: verification.results
        });
      } else {
        setValidationFeedback({
          isComplete: false,
          correctCount: verification.correctCount,
          totalRequired: verification.totalRequired,
          message: `ALIGNMENT MISMATCH: ${verification.correctCount}/${verification.totalRequired} targets aligned. ${newAttempts} attempt${newAttempts > 1 ? 's' : ''} remaining.`,
          details: verification.results
        });
      }

      return false;
    }
  }, [
    phase,
    currentMission,
    settings,
    planets,
    hintsUsedCount,
    timeRemaining,
    score,
    teamName,
    attemptsRemaining,
    currentMissionIndex,
    activeAccount
  ]);

  const startMission = useCallback(() => {
    setShowIntroModal(false);
    setPhase('positioning');
    setIsTimerRunning(true);
    try {
      soundFx.startAmbient();
    } catch (err) {
      console.warn('Audio ambient deferred:', err);
    }
  }, []);

  const advanceToNextMission = useCallback(() => {
    setShowSuccessModal(false);
    const nextIdx = (currentMissionIndex + 1) % PRESET_MISSIONS.length;
    setCurrentMissionIndex(nextIdx);
    setAttemptsRemaining(settings.maxAttempts);
    setValidationFeedback(null);
    setHintsUsedCount(0);
    setPhase('positioning');
    setIsTimerRunning(true);
    setPlanets(initPlanets(settings.earthStartingNode));

    if (activeAccount) {
      const updated = {
        ...activeAccount,
        'Current level': nextIdx + 1
      };
      setActiveAccountState(updated);
      backendService.updateTeamAccount(updated);
    }
  }, [currentMissionIndex, settings.maxAttempts, settings.earthStartingNode, initPlanets, activeAccount]);

  // Allows editing Current Level during testing phase as requested
  const updateActiveTeamLevel = useCallback((level: number) => {
    const validLevel = Math.max(1, Math.min(PRESET_MISSIONS.length, level));
    const targetIdx = validLevel - 1;
    setCurrentMissionIndex(targetIdx);
    setAttemptsRemaining(settings.maxAttempts);
    setValidationFeedback(null);
    setHintsUsedCount(0);
    setPlanets(initPlanets(settings.earthStartingNode));

    if (activeAccount) {
      const updated = {
        ...activeAccount,
        'Current level': validLevel,
        'levels completion': 0 // As specified: in testing phase levels completion remains 0
      };
      setActiveAccountState(updated);
      backendService.updateTeamAccount(updated);
    }
  }, [settings.maxAttempts, settings.earthStartingNode, initPlanets, activeAccount]);

  const setMissionByIndex = useCallback((idx: number) => {
    if (idx >= 0 && idx < PRESET_MISSIONS.length) {
      setCurrentMissionIndex(idx);
      setAttemptsRemaining(settings.maxAttempts);
      setValidationFeedback(null);
      setHintsUsedCount(0);
      setPhase('positioning');
      setPlanets(initPlanets(settings.earthStartingNode));

      if (activeAccount) {
        const updated = {
          ...activeAccount,
          'Current level': idx + 1,
          'levels completion': 0
        };
        setActiveAccountState(updated);
        backendService.updateTeamAccount(updated);
      }
    }
  }, [settings.maxAttempts, settings.earthStartingNode, initPlanets, activeAccount]);

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
    setZodiacTableShown(false);
    setZodiacTableVisible(false);
    setZodiacTableError(false);
    setPhase('intro');
    setShowIntroModal(true);
    setPlanets(initPlanets(settings.earthStartingNode));
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
    submitValidation,
    advanceToNextMission,
    startMission,
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
    setShowCodeModal
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
    submitValidation,
    advanceToNextMission,
    startMission,
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
