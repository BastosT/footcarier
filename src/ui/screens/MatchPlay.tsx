/**
 * MatchPlay — Écran de match interactif en temps accéléré.
 *
 * Simule 90 minutes de match en moins de 5 minutes réelles.
 * Génère 6-12 actions pour le joueur, chacune proposant un choix :
 * - Facile (probabilité élevée, gain faible)
 * - Risqué (probabilité basse, gain élevé)
 *
 * Met à jour le score et la fitness en temps réel.
 *
 * Requirements: 8.1, 8.2, 8.3
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameStore } from '../../store/gameStore';
import { FitnessBar } from '../components/FitnessBar';
import {
  generateInteractiveActions,
  resolveInteractiveAction,
  INTERACTIVE_ACTIONS_PER_MATCH,
  type InteractiveAction,
  type InteractiveActionResult,
  type ActionDifficulty,
} from '../../systems/match/MatchSimulator';
import { MATCH_FITNESS_LOSS } from '../../systems/match/FitnessManager';
import { createRNG } from '../../utils/random';
import { clamp } from '../../utils/math';
import { updateCareerStatsFromMatch } from '../../utils/updateCareerStats';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Real-time duration for the full 90 min match (in ms). Target: ~45s real. */
const MATCH_DURATION_MS = 45_000; // 45 seconds real time
/** Simulated match duration in minutes. */
const MATCH_MINUTES = 90;
/** Interval for the match clock tick (ms). */
const TICK_INTERVAL_MS = 80;
/** Minutes advanced per tick. */
const MINUTES_PER_TICK = MATCH_MINUTES / (MATCH_DURATION_MS / TICK_INTERVAL_MS);

// ─── Types ───────────────────────────────────────────────────────────────────

interface MatchPlayState {
  minute: number;
  homeGoals: number;
  awayGoals: number;
  fitness: number;
  actions: InteractiveAction[];
  results: InteractiveActionResult[];
  currentActionIndex: number;
  isPaused: boolean;
  isFinished: boolean;
  isHalftime: boolean;
  isSubstituted: boolean;
  opponentGoalMinutes: number[];
  opponentGoalsScored: number;
  isPlayerHome: boolean;
  /** Brief goal celebration animation */
  goalAnimation: 'player' | 'opponent' | null;
  /** Player starts on bench (enters at ~60') if coachRelation < 40 */
  startsOnBench: boolean;
  /** Minute the player enters the match (0 if starting) */
  entryMinute: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MatchPlay() {
  const { goToScreen } = useNavigation();
  const { playMatch } = useGameLoop();
  const gameState = useGameStore((s) => s.gameState);
  const pendingMatchConfig = useGameStore((s) => s.ui.pendingMatchConfig);
  const setPendingMatchConfig = useGameStore((s) => s.setPendingMatchConfig);

  const rngRef = useRef(createRNG(Date.now()));

  const [matchState, setMatchState] = useState<MatchPlayState | null>(null);

  // Initialize match on mount
  useEffect(() => {
    if (!gameState) return;

    const rng = rngRef.current;
    const player = gameState.player;
    const teamMorale = gameState.social.teamMorale ?? 50;
    const coachRelation = gameState.social.coachRelation ?? 50;

    // Determine if player starts on bench (coachRelation < 40)
    const startsOnBench = coachRelation < 40;
    const entryMinute = startsOnBench ? 55 + rng.randomInt(0, 10) : 0; // enters between 55'-65'

    // Fewer actions if coming off the bench (only ~30 min to play)
    const numActions = startsOnBench ? rng.randomInt(3, 5) : rng.randomInt(6, 10);
    const totalFitnessLoss = startsOnBench
      ? rng.randomInt(Math.round(MATCH_FITNESS_LOSS.min * 0.4), Math.round(MATCH_FITNESS_LOSS.max * 0.4))
      : rng.randomInt(MATCH_FITNESS_LOSS.min, MATCH_FITNESS_LOSS.max);

    // Morale boosts effective fitness for action probability calculation
    const moraleBoost = (teamMorale - 50) / 10;
    const effectiveFitness = Math.min(100, Math.max(0, player.fitness + moraleBoost));

    const actions = generateInteractiveActions(
      player.stats,
      effectiveFitness,
      numActions,
      totalFitnessLoss,
      rng,
      player.position
    );

    // Generate opponent goals based on opponent strength
    const pendingConfig = useGameStore.getState().ui.pendingMatchConfig;
    const playerClubId = gameState.career.currentClub.id;
    const isPlayerHome = pendingConfig ? pendingConfig.homeTeam.id === playerClubId : true;

    // Get opponent strength from their club tier
    const opponentClub = isPlayerHome ? pendingConfig?.awayTeam : pendingConfig?.homeTeam;
    const opponentTier = opponentClub?.tier ?? 'medium';
    const tierRating: Record<string, number> = { big: 82, medium: 72, small: 63 };
    const opponentRating = tierRating[opponentTier] ?? 72;

    // Player's team strength
    const playerTeamTier = gameState.career.currentClub.tier;
    const playerTeamRating = tierRating[playerTeamTier] ?? 72;

    // Team morale influences match outcome
    // Morale modifier: high morale (80+) = -0.08 opponent chance, low morale (20-) = +0.08
    const moraleModifier = (50 - teamMorale) / 625; // range: -0.08 to +0.08

    // Opponent goals based on relative strength (stronger opponent = more goals)
    // Also factor in home advantage and team morale
    const strengthDiff = opponentRating - playerTeamRating;
    const baseGoalChance = 0.25 + (strengthDiff / 100);
    const homeModifier = isPlayerHome ? -0.05 : 0.05;
    const adjustedChance = Math.max(0.05, Math.min(0.6, baseGoalChance + homeModifier + moraleModifier));

    let opponentGoals = 0;
    for (let i = 0; i < 4; i++) {
      if (rng.random() < adjustedChance) opponentGoals++;
    }

    // Generate random minutes when opponent scores (distributed across the match)
    const opponentGoalMinutes: number[] = [];
    for (let i = 0; i < opponentGoals; i++) {
      opponentGoalMinutes.push(rng.randomInt(5, 85));
    }
    opponentGoalMinutes.sort((a, b) => a - b);

    // If starting on bench, shift action minutes to after entry
    if (startsOnBench) {
      const availableMinutes = 90 - entryMinute;
      actions.forEach((action, i) => {
        action.minute = entryMinute + Math.round(((i + 1) / (actions.length + 1)) * availableMinutes);
      });
    }

    setMatchState({
      minute: 0,
      homeGoals: 0,
      awayGoals: 0,
      fitness: player.fitness,
      actions,
      results: [],
      currentActionIndex: 0,
      isPaused: startsOnBench, // pause at start to show bench message
      isFinished: false,
      isHalftime: false,
      isSubstituted: false,
      opponentGoalMinutes,
      opponentGoalsScored: 0,
      isPlayerHome,
      goalAnimation: null,
      startsOnBench,
      entryMinute,
    });
  }, [gameState]);

  // Match clock ticker
  useEffect(() => {
    if (!matchState || matchState.isPaused || matchState.isFinished || matchState.isHalftime) return;

    const interval = setInterval(() => {
      setMatchState((prev) => {
        if (!prev || prev.isPaused || prev.isFinished || prev.isHalftime) return prev;

        const newMinute = prev.minute + MINUTES_PER_TICK;

        // Check if match is over
        if (newMinute >= MATCH_MINUTES) {
          return { ...prev, minute: MATCH_MINUTES, isFinished: true };
        }

        // Check halftime at 45
        if (prev.minute < 45 && newMinute >= 45) {
          return { ...prev, minute: 45, isHalftime: true, isPaused: true };
        }

        // Check if player is exhausted (fitness <= 0) → substituted
        if (Math.round(prev.fitness) <= 0 && !prev.isSubstituted) {
          return { ...prev, minute: newMinute, isFinished: true, isSubstituted: true };
        }

        // Check if opponent scores at this minute
        let homeGoals = prev.homeGoals;
        let awayGoals = prev.awayGoals;
        let opponentGoalsScored = prev.opponentGoalsScored;

        const nextOpponentGoalMinute = prev.opponentGoalMinutes[opponentGoalsScored];
        if (nextOpponentGoalMinute !== undefined && newMinute >= nextOpponentGoalMinute) {
          // Opponent scores! Show animation
          if (prev.isPlayerHome) {
            awayGoals++;
          } else {
            homeGoals++;
          }
          opponentGoalsScored++;
          return { ...prev, minute: newMinute, homeGoals, awayGoals, opponentGoalsScored, goalAnimation: 'opponent' as const, isPaused: true };
        }

        // Check if we've reached the next action's minute and should pause
        const nextAction = prev.actions[prev.currentActionIndex];
        if (nextAction && newMinute >= nextAction.minute) {
          return { ...prev, minute: nextAction.minute, isPaused: true, homeGoals, awayGoals, opponentGoalsScored };
        }

        return { ...prev, minute: newMinute, homeGoals, awayGoals, opponentGoalsScored };
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [matchState?.isPaused, matchState?.isFinished, matchState?.isHalftime, matchState?.currentActionIndex]);

  // Goal animation is dismissed manually via button click (no auto-dismiss)

  // Handle player choice (easy or risky)
  const handleChoice = useCallback(
    (difficulty: ActionDifficulty) => {
      if (!matchState || !gameState) return;

      const rng = rngRef.current;
      const action = matchState.actions[matchState.currentActionIndex];
      if (!action) return;

      const chosenAction = difficulty === 'risky' ? action.risky : action.easy;
      const resolution = resolveInteractiveAction(chosenAction, rng);

      // Calculate progressive fitness loss for this action
      // Total loss is distributed evenly across all actions
      const totalMatchFitnessLoss = MATCH_FITNESS_LOSS.min +
        (MATCH_FITNESS_LOSS.max - MATCH_FITNESS_LOSS.min) / 2; // average loss
      const fitnessLossPerAction = totalMatchFitnessLoss / matchState.actions.length;
      const newFitness = clamp(matchState.fitness - fitnessLossPerAction, 0, 100);

      // Determine if this action scored
      const isPlayerHome = matchState.isPlayerHome;
      let homeGoals = matchState.homeGoals;
      let awayGoals = matchState.awayGoals;

      if (resolution.success) {
        if (resolution.outcome === 'goal' || resolution.outcome === 'assist') {
          if (isPlayerHome) homeGoals++;
          else awayGoals++;
        }
      }

      const result: InteractiveActionResult = {
        minute: action.minute,
        chosenDifficulty: difficulty,
        action: chosenAction,
        success: resolution.success,
        outcome: resolution.outcome,
        fitnessAfter: newFitness,
      };

      const scored = resolution.success && (resolution.outcome === 'goal' || resolution.outcome === 'assist');

      setMatchState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          homeGoals,
          awayGoals,
          fitness: newFitness,
          results: [...prev.results, result],
          currentActionIndex: prev.currentActionIndex + 1,
          isPaused: scored, // pause briefly on goal
          goalAnimation: scored ? 'player' : null,
        };
      });
    },
    [matchState, gameState]
  );

  // Handle match end — call orchestrator playMatch to update standings/morale, then navigate to post-match
  const handleMatchEnd = useCallback(() => {
    if (!matchState || !gameState) return;

    // Calculate player stats from the interactive match
    const playerGoals = matchState.results.filter(
      (r) => r.success && r.outcome === 'goal'
    ).length;
    const playerAssists = matchState.results.filter(
      (r) => r.success && r.outcome === 'assist'
    ).length;
    const playerShots = matchState.results.filter(
      (r) => r.action.type === 'shot'
    ).length;
    const playerDribbles = matchState.results.filter(
      (r) => r.action.type === 'dribble' && r.success
    ).length;
    const playerTackles = matchState.results.filter(
      (r) => r.action.type === 'tackle' && r.success
    ).length;
    const totalActions = matchState.results.length;
    const successfulActions = matchState.results.filter((r) => r.success).length;
    const passAccuracy = totalActions > 0 ? Math.round((successfulActions / totalActions) * 100) : 70;

    // Calculate match rating (more realistic)
    // Determine if player's team won
    const isHome = matchState.isPlayerHome;
    const playerTeamGoals = isHome ? matchState.homeGoals : matchState.awayGoals;
    const opponentTeamGoals = isHome ? matchState.awayGoals : matchState.homeGoals;
    const won = playerTeamGoals > opponentTeamGoals;
    const draw = playerTeamGoals === opponentTeamGoals;

    // Base rating: win=6.5, draw=6.0, loss=5.0
    let rating = won ? 6.5 : draw ? 6.0 : 5.0;

    // Bonuses
    rating += playerGoals * 1.0;       // +1.0 per goal
    rating += playerAssists * 0.5;     // +0.5 per assist
    rating += (successfulActions / Math.max(1, totalActions)) * 1.5; // up to +1.5 for success rate

    // Small bonus for clean sheet (no goals conceded)
    if (opponentTeamGoals === 0 && won) rating += 0.3;

    // Cap between 3.0 and 10.0
    rating = Math.min(10, Math.max(3, rating));
    rating = Math.round(rating * 10) / 10;

    // Store match summary for PostMatch screen
    const homeTeamName = pendingMatchConfig?.homeTeam.name ?? gameState.career.currentClub.name;
    const awayTeamName = pendingMatchConfig?.awayTeam.name ?? 'Adversaire';

    const matchSummary = {
      homeTeamName,
      awayTeamName,
      homeGoals: matchState.homeGoals,
      awayGoals: matchState.awayGoals,
      isPlayerHome: matchState.isPlayerHome,
      playerGoals,
      playerAssists,
      playerRating: Math.round(rating * 10) / 10,
      playerShots,
      playerDribbles,
      playerTackles,
      playerPassAccuracy: passAccuracy,
      minutesPlayed: matchState.startsOnBench
        ? Math.max(0, Math.floor(matchState.minute) - matchState.entryMinute)
        : Math.floor(matchState.minute),
    };

    useGameStore.getState().setLastMatchSummary(matchSummary);

    // Map interactive action choices to PlayerInput timing
    const playerInputs = matchState.results.map((r) => ({
      timing: (r.chosenDifficulty === 'risky' ? 'perfect' : 'good') as 'perfect' | 'good' | 'miss',
    }));

    // Use the pending match config to run the orchestrator's playMatch
    if (pendingMatchConfig) {
      playMatch(pendingMatchConfig, playerInputs);
      setPendingMatchConfig(null);
    } else {
      const updatedPlayer = {
        ...gameState.player,
        fitness: matchState.fitness,
      };
      useGameStore.setState({
        gameState: {
          ...gameState,
          player: updatedPlayer,
        },
      });
    }

    // Update career stats AFTER playMatch so we read the fresh state
    updateCareerStatsFromMatch(matchSummary);

    goToScreen('post-match');
  }, [matchState, gameState, pendingMatchConfig, playMatch, setPendingMatchConfig, goToScreen]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (!gameState || !matchState) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-text-muted">Chargement du match...</p>
      </div>
    );
  }

  const nextMatch = gameState.time.schedule.nextMatch;
  const playerClubName = gameState.career.currentClub.name;
  // Use matchState.isPlayerHome (set during init from pendingConfig) for consistency
  const renderIsPlayerHome = matchState.isPlayerHome;
  const opponentName = findClubName(gameState.leagues, renderIsPlayerHome ? nextMatch?.awayTeam : nextMatch?.homeTeam)
    ?? (pendingMatchConfig ? (renderIsPlayerHome ? pendingMatchConfig.awayTeam.name : pendingMatchConfig.homeTeam.name) : 'Adversaire');

  const homeTeamName = renderIsPlayerHome ? playerClubName : opponentName;
  const awayTeamName = renderIsPlayerHome ? opponentName : playerClubName;

  const currentAction = matchState.isPaused
    ? matchState.actions[matchState.currentActionIndex]
    : null;

  const progressPercent = (matchState.minute / MATCH_MINUTES) * 100;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Match header: Score + Time */}
      <header className="bg-surface p-4 border-b border-surface-light">
        {/* Match time bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>0&apos;</span>
            <span className="text-sm font-bold text-text">{Math.floor(matchState.minute)}&apos;</span>
            <span>90&apos;</span>
          </div>
          <div className="h-2 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-light rounded-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={Math.floor(matchState.minute)}
              aria-valuemin={0}
              aria-valuemax={90}
              aria-label={`Minute ${Math.floor(matchState.minute)}`}
            />
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-sm font-semibold text-text truncate">{homeTeamName}</p>
          </div>
          <div className="flex items-center gap-3 mx-4">
            <span className="text-3xl font-bold text-text">{matchState.homeGoals}</span>
            <span className="text-xl text-text-muted">-</span>
            <span className="text-3xl font-bold text-text">{matchState.awayGoals}</span>
          </div>
          <div className="text-center flex-1">
            <p className="text-sm font-semibold text-text truncate">{awayTeamName}</p>
          </div>
        </div>
      </header>

      {/* Fitness bar */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-muted">🏃 Forme</span>
          <div className="flex-1">
            <FitnessBar fitness={Math.round(matchState.fitness)} compact />
          </div>
          <span className="text-xs font-bold text-text">{Math.round(matchState.fitness)}%</span>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {matchState.startsOnBench && matchState.minute < matchState.entryMinute && matchState.isPaused ? (
          /* Bench state — waiting to enter */
          <div className="text-center">
            <p className="text-5xl mb-4">🪑</p>
            <p className="text-2xl font-bold text-text mb-2">Sur le banc</p>
            <p className="text-text-muted text-sm mb-2">
              Le coach ne te fait pas confiance (relation : {gameState.social.coachRelation}/100)
            </p>
            <p className="text-text-muted text-sm mb-6">
              Tu entres à la <span className="text-primary-light font-bold">{matchState.entryMinute}'</span>
            </p>
            <button
              onClick={() => setMatchState((prev) => prev ? {
                ...prev,
                minute: prev.entryMinute,
                isPaused: false,
                // Simulate opponent goals that happened before entry
                homeGoals: prev.opponentGoalMinutes.filter((m) => m < prev.entryMinute && !prev.isPlayerHome).length,
                awayGoals: prev.opponentGoalMinutes.filter((m) => m < prev.entryMinute && prev.isPlayerHome).length,
                opponentGoalsScored: prev.opponentGoalMinutes.filter((m) => m < prev.entryMinute).length,
              } : prev)}
              className="py-3 px-8 bg-primary text-white font-semibold rounded-xl active:scale-95 transition-all"
            >
              Avancer à la {matchState.entryMinute}' →
            </button>
          </div>
        ) : matchState.goalAnimation ? (
          /* Goal celebration popup */
          <div className="text-center">
            <p className="text-5xl mb-4">
              {matchState.goalAnimation === 'player' ? '⚽🎉' : '⚽😤'}
            </p>
            <p className="text-2xl font-bold text-text mb-2">
              {matchState.goalAnimation === 'player' ? 'BUUUUT !' : 'But adverse...'}
            </p>
            <p className="text-lg text-text-muted mb-2">
              {Math.floor(matchState.minute)}&apos;
            </p>
            <p className="text-3xl font-bold text-text mb-6">
              {matchState.homeGoals} - {matchState.awayGoals}
            </p>
            <button
              onClick={() => setMatchState((prev) => prev ? { ...prev, goalAnimation: null, isPaused: false } : prev)}
              className="py-3 px-8 bg-primary text-white font-semibold rounded-xl
                         hover:bg-primary-light active:scale-95 transition-all"
            >
              Continuer
            </button>
          </div>
        ) : matchState.isFinished ? (
          /* Match finished */
          <div className="text-center">
            <p className="text-2xl font-bold text-text mb-2">
              {matchState.isSubstituted ? '🔄 Remplacé !' : 'Coup de sifflet final !'}
            </p>
            {matchState.isSubstituted && (
              <p className="text-sm text-text-muted mb-2">Épuisé — sorti à la {Math.floor(matchState.minute)}&apos;</p>
            )}
            <p className="text-text-muted mb-6">
              {matchState.homeGoals} - {matchState.awayGoals}
            </p>
            <button
              onClick={handleMatchEnd}
              className="py-3 px-8 bg-secondary text-white font-semibold rounded-xl
                         hover:bg-secondary-light active:scale-95 transition-all"
            >
              Voir le résumé →
            </button>
          </div>
        ) : matchState.isHalftime ? (
          /* Halftime */
          <div className="text-center">
            <p className="text-2xl font-bold text-text mb-2">⏸️ Mi-temps</p>
            <p className="text-text-muted mb-2">
              {matchState.homeGoals} - {matchState.awayGoals}
            </p>
            <p className="text-xs text-text-muted mb-6">Forme : {Math.round(matchState.fitness)}%</p>
            <button
              onClick={() => setMatchState((prev) => prev ? { ...prev, isHalftime: false, isPaused: false } : prev)}
              className="py-3 px-8 bg-primary text-white font-semibold rounded-xl
                         hover:bg-primary-light active:scale-95 transition-all"
            >
              Reprendre →
            </button>
          </div>
        ) : currentAction ? (
          /* Action choice */
          <ActionChoicePanel
            action={currentAction}
            minute={matchState.minute}
            onChoice={handleChoice}
          />
        ) : (
          /* Match running - show live commentary */
          <MatchRunning
            minute={matchState.minute}
            results={matchState.results}
          />
        )}
      </div>

      {/* Action history */}
      {matchState.results.length > 0 && (
        <div className="px-4 pb-4 max-h-40 overflow-y-auto">
          <div className="space-y-1">
            {matchState.results
              .slice()
              .reverse()
              .map((result, i) => (
                <ActionResultRow key={i} result={result} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ActionChoicePanelProps {
  action: InteractiveAction;
  minute: number;
  onChoice: (difficulty: ActionDifficulty) => void;
}

function ActionChoicePanel({ action, minute, onChoice }: ActionChoicePanelProps) {
  return (
    <div className="w-full max-w-sm">
      <p className="text-center text-sm text-text-muted mb-2">
        {Math.floor(minute)}&apos; — Action !
      </p>
      <p className="text-center text-lg font-bold text-text mb-6">
        Choisissez votre action
      </p>

      <div className="space-y-3">
        {/* Easy choice */}
        <button
          onClick={() => onChoice('easy')}
          className="w-full p-4 bg-surface rounded-xl border-2 border-green-500/30
                     hover:border-green-500 active:scale-95 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-green-400">
              🛡️ {action.easy.description}
            </span>
            <span className="text-xs font-bold text-green-400">
              {Math.round(action.easy.successProbability * 100)}%
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Probabilité élevée, gain modéré
          </p>
        </button>

        {/* Risky choice */}
        <button
          onClick={() => onChoice('risky')}
          className="w-full p-4 bg-surface rounded-xl border-2 border-red-500/30
                     hover:border-red-500 active:scale-95 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-red-400">
              ⚡ {action.risky.description}
            </span>
            <span className="text-xs font-bold text-red-400">
              {Math.round(action.risky.successProbability * 100)}%
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Probabilité basse, gain élevé
          </p>
        </button>
      </div>
    </div>
  );
}

interface MatchRunningProps {
  minute: number;
  results: InteractiveActionResult[];
}

function MatchRunning({ minute, results }: MatchRunningProps) {
  const lastResult = results[results.length - 1];

  return (
    <div className="text-center">
      <div className="text-6xl mb-4 animate-pulse">⚽</div>
      <p className="text-lg text-text-muted">
        Match en cours...
      </p>
      {lastResult && (
        <p className="text-sm text-text-muted mt-2">
          {lastResult.success ? '✅' : '❌'}{' '}
          {getOutcomeText(lastResult)}
        </p>
      )}
    </div>
  );
}

interface ActionResultRowProps {
  result: InteractiveActionResult;
}

function ActionResultRow({ result }: ActionResultRowProps) {
  const icon = result.success ? '✅' : '❌';
  const outcomeText = getOutcomeText(result);

  return (
    <div className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-surface">
      <span className="text-text-muted font-mono w-8">{result.minute}&apos;</span>
      <span>{icon}</span>
      <span className="text-text flex-1">{outcomeText}</span>
      <span className="text-text-muted">
        {result.chosenDifficulty === 'risky' ? '⚡' : '🛡️'}
      </span>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOutcomeText(result: InteractiveActionResult): string {
  const actionLabel = getActionLabel(result.action.type);

  switch (result.outcome) {
    case 'goal':
      return `But ! ${actionLabel} réussi`;
    case 'assist':
      return `Passe décisive ! ${actionLabel} réussi`;
    case 'completed':
      return `${actionLabel} réussi`;
    case 'failed':
      return `${actionLabel} raté`;
    default:
      return actionLabel;
  }
}

function getActionLabel(type: string): string {
  switch (type) {
    case 'shot': return 'Tir';
    case 'pass': return 'Passe';
    case 'dribble': return 'Dribble';
    case 'tackle': return 'Tacle';
    default: return 'Action';
  }
}

/**
 * Finds a club name by ID from the league standings data.
 */
function findClubName(
  leagues: { standings: { clubId: string; clubName: string }[] }[],
  clubId: string | undefined
): string | undefined {
  if (!clubId) return undefined;
  for (const league of leagues) {
    const standing = league.standings.find((s) => s.clubId === clubId);
    if (standing) return standing.clubName;
  }
  return undefined;
}
