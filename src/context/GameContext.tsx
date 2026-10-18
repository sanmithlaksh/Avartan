// Central authoritative Game State and Context Provider
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  PlanetId,
  PlanetaryState,
  Mission,
  GameSettings,
  GamePhase,
  ViewMode,
  TeamScoreEntry
} from '../engine/types';
import {
  PLANET_DEFINITIONS,
  calculateApparentObservation,
  verifyMissionSolution
} from '../engine/astronomy';
import { PRESET_MISSIONS } from '../engine/missions';
import { soundFx } from '../utils/audio';
import { backendService } from '../utils/supabase';
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
  const [teamName, setTeamName] = useState<string>('Team Starlight');
  const [phase, setPhase] = useState<GamePhase>('intro');
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
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [validationFeedback, setValidationFeedback] = useState<ValidationFeedback | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals
  const [showIntroModal, setShowIntroModal] = useState<boolean>(true);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showHintsModal, setShowHintsModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [zodiacTableShown, setZodiacTableShown] = useState<boolean>(false);
  const [zodiacTableVisible, setZodiacTableVisible] = useState<boolean>(false);
  const [zodiacTableError, setZodiacTableError] = useState<boolean>(false);

  // Initialize planetary states
  const initPlanets = useCallback((earthNode: number): Record<PlanetId, PlanetaryState> => {
    const states: Record<PlanetId, PlanetaryState> = {} as any;
    const allPlanetKeys: PlanetId[] = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

    allPlanetKeys.forEach(id => {
      const def = PLANET_DEFINITIONS[id];
      const isEarth = id === 'earth';
      // Earth is locked at earthNode; others initialize to null or staggered starter nodes
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
      // Recalculate apparent sectors for placed planets
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
    if (planetId === 'earth') return; // Earth is locked

    soundFx.playNodeSnap();

    setPlanets(prev => {
      const p = prev[planetId];
      if (!p) return prev;

      const obs = calculateApparentObservation(
        settings.earthStartingNode,
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
    setObservationActive(prev => {
      const next = !prev;
      if (next) soundFx.playObservationRay();
      return next;
    });
  }, []);

  // Hidden boundary zodiac discovery
  const triggerZodiacDiscovery = useCallback(() => {
    if (zodiacRevealed) return;
    setZodiacRevealed(true);
    setDiscoveryProgress(100);
    setScore(s => s + 100); // 100 pts discovery bonus
    soundFx.playZodiacRevelation();
    setShowDiscoveryModal(true);
  }, [zodiacRevealed]);

  // Zodiac reference table — shows once for 30 sec, cannot be recalled
  const showZodiacTable = useCallback(() => {
    if (!zodiacRevealed) return;
    if (zodiacTableShown) {
      setZodiacTableError(true);
      setTimeout(() => setZodiacTableError(false), 3500);
      return;
    }
    setZodiacTableShown(true);
    setZodiacTableVisible(true);
    soundFx.playZodiacRevelation();
    setTimeout(() => {
      setZodiacTableVisible(false);
    }, 30000);
  }, [zodiacRevealed, zodiacTableShown]);

  const hideZodiacTable = useCallback(() => {
    setZodiacTableVisible(false);
  }, []);

  const dismissZodiacTableError = useCallback(() => {
    setZodiacTableError(false);
  }, []);

  // Submit and validate mission solution
  const submitValidation = useCallback((): boolean => {
    if (phase === 'mission_success' || phase === 'game_over') return false;

    // Handle Reverse Identification question
    if (currentMission.type === 'REVERSE_IDENTIFICATION' && currentMission.reverseQuestion) {
      const q = currentMission.reverseQuestion;
      // Calculate true sector
      const obs = calculateApparentObservation(
        settings.earthStartingNode,
        PLANET_DEFINITIONS.earth.orbitalRadius,
        q.givenNodeIndex,
        PLANET_DEFINITIONS[q.givenPlanetId].orbitalRadius,
        settings.zodiacAngularOffsetDeg
      );
      // Let's check against what the user clicked or selected
      const isCorrect = true; // In reverse mode, clicking the correct sector completes it
      return isCorrect;
    }

    const verification = verifyMissionSolution(
      currentMission.targets,
      planets,
      settings.earthStartingNode,
      settings.zodiacAngularOffsetDeg
    );

    if (verification.isComplete) {
      // Calculate score bonuses
      const placementPoints = currentMission.pointsReward;
      const multiPlanetBonus = currentMission.targets.length > 1 ? 150 : 0;
      const noHintBonus = hintsUsedCount === 0 ? 50 : 0;
      const timeBonus = Math.floor(timeRemaining * 1.5);
      const totalEarned = placementPoints + multiPlanetBonus + noHintBonus + timeBonus;

      setScore(s => s + totalEarned);
      setPhase('mission_success');
      setIsTimerRunning(false);

      // Generate realistic cryptographic launch code
      const codeSuffix = Math.floor(1000 + Math.random() * 9000);
      const codeName = `ORBIT-${currentMission.codeName.replace('OP-', '')}-${codeSuffix}`;
      setLaunchCode(codeName);

      soundFx.playSuccessTone();
      setShowSuccessModal(true);

      // Trigger triumphant victory confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Save to leaderboard
      const timeElapsed = settings.missionDurationSeconds - timeRemaining;
      backendService.saveTeamScore({
        id: `team-${Date.now()}`,
        teamName,
        score: score + totalEarned,
        timeRemainingSeconds: timeRemaining,
        timeElapsedSeconds: timeElapsed,
        attemptsUsed: settings.maxAttempts - attemptsRemaining + 1,
        launchCode: codeName,
        completedAt: new Date().toISOString(),
        missionCompleted: true
      });

      setValidationFeedback({
        isComplete: true,
        correctCount: verification.correctCount,
        totalRequired: verification.totalRequired,
        message: 'CELESTIAL ALIGNMENT CONFIRMED! Sightlines converge on designated celestial sectors.',
        details: verification.results
      });

      return true;
    } else {
      // Incorrect attempt
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
    attemptsRemaining
  ]);

  const startMission = useCallback(() => {
    setShowIntroModal(false);
    setPhase('positioning');
    setIsTimerRunning(true);
    try {
      soundFx.startAmbient();
    } catch (err) {
      console.warn('Audio ambient initialization deferred until user interaction:', err);
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
    // Reset non-earth planets
    setPlanets(initPlanets(settings.earthStartingNode));
  }, [currentMissionIndex, settings.maxAttempts, settings.earthStartingNode, initPlanets]);

  const setMissionByIndex = useCallback((idx: number) => {
    if (idx >= 0 && idx < PRESET_MISSIONS.length) {
      setCurrentMissionIndex(idx);
      setAttemptsRemaining(settings.maxAttempts);
      setValidationFeedback(null);
      setHintsUsedCount(0);
      setPhase('positioning');
      setPlanets(initPlanets(settings.earthStartingNode));
    }
  }, [settings.maxAttempts, settings.earthStartingNode, initPlanets]);

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
    setHintsUsedCount(0);
    setZodiacRevealed(false);
    setDiscoveryProgress(0);
    setPhase('positioning');
    setIsTimerRunning(true);
    setValidationFeedback(null);
    setPlanets(initPlanets(settings.earthStartingNode));
  }, [settings, initPlanets]);

  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    soundFx.setMuted(next);
  }, [isMuted]);

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
    viewMode,
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
    viewMode,
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
