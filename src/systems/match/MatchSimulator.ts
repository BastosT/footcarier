/**
 * MatchSimulator - Simule les matchs interactifs avec le joueur.
 * Génère des actions clés et calcule les performances individuelles.
 *
 * Supporte deux modes :
 * - simulateMatch : mode legacy avec PlayerInput (timing-based)
 * - simulateInteractiveMatch : mode V2 avec choix easy/risky par action
 */

import type {
  MatchConfig, MatchResult, MatchPerformance, MatchAction,
  PlayerInput, ActionResult, SquadPlayer, PlayerCharacter, PlayerStats
} from '../../core/types';
import { resolveAction } from './ActionResolver';
import { getFitnessModifier, MATCH_FITNESS_LOSS } from './FitnessManager';
import { type RNG, defaultRNG } from '../../utils/random';
import { clamp } from '../../utils/math';

export interface MatchState {
  minute: number;
  homeGoals: number;
  awayGoals: number;
  actions: MatchActionRecord[];
  isFinished: boolean;
}

export interface MatchActionRecord {
  minute: number;
  action: MatchAction;
  result: ActionResult;
  playerInput?: PlayerInput;
}

// ─── Interactive Match V2 Types ──────────────────────────────────────────────

export type ActionDifficulty = 'easy' | 'risky';

export interface InteractiveActionChoice {
  type: 'shot' | 'pass' | 'dribble' | 'tackle';
  difficulty: ActionDifficulty;
  baseProbability: number;
  successProbability: number;
  description: string;
}

export interface InteractiveAction {
  minute: number;
  easy: InteractiveActionChoice;
  risky: InteractiveActionChoice;
}

export interface InteractiveActionResult {
  minute: number;
  chosenDifficulty: ActionDifficulty;
  action: InteractiveActionChoice;
  success: boolean;
  outcome: 'goal' | 'assist' | 'completed' | 'failed';
  fitnessAfter: number;
}

export interface InteractiveMatchResult {
  result: MatchResult;
  performance: MatchPerformance;
  actions: InteractiveActionResult[];
  fitnessLoss: number;
  finalFitness: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Nombre d'actions clés par match pour le joueur (legacy mode).
 */
const ACTIONS_PER_MATCH = { min: 4, max: 8 };

/**
 * Nombre d'actions interactives par match (V2 mode).
 */
export const INTERACTIVE_ACTIONS_PER_MATCH = { min: 6, max: 12 };

/**
 * Probabilités de base pour les choix easy/risky.
 */
export const EASY_PROBABILITY_RANGE = { min: 0.7, max: 0.9 };
export const RISKY_PROBABILITY_RANGE = { min: 0.2, max: 0.5 };

/**
 * Bornes de probabilité après application des modificateurs.
 */
export const PROBABILITY_BOUNDS = { min: 0.05, max: 0.95 };

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Génère les minutes auxquelles des actions clés se produisent.
 */
function generateActionMinutes(count: number, rng: RNG): number[] {
  const minutes: number[] = [];
  for (let i = 0; i < count; i++) {
    minutes.push(rng.randomInt(1, 90));
  }
  return minutes.sort((a, b) => a - b);
}

/**
 * Retourne la stat pertinente du joueur pour un type d'action donné.
 */
function getRelevantStat(actionType: string, stats: PlayerStats): number {
  switch (actionType) {
    case 'shot': return stats.shooting;
    case 'pass': return stats.passing;
    case 'dribble': return stats.dribbling;
    case 'tackle': return stats.defending;
    default: return stats.physical;
  }
}

type ActionType = 'shot' | 'pass' | 'dribble' | 'tackle';

/**
 * Returns weighted action pools based on player position.
 * Attackers get more shots, midfielders more passes, defenders more tackles.
 * Items repeated = higher probability of being picked.
 */
function getActionPoolsForPosition(position?: string): { easyPool: ActionType[]; riskyPool: ActionType[] } {
  switch (position) {
    case 'ST':
    case 'LW':
    case 'RW':
      // Attackers: lots of shots and dribbles
      return {
        easyPool: ['pass', 'dribble', 'dribble', 'pass'],
        riskyPool: ['shot', 'shot', 'shot', 'dribble', 'pass'],
      };
    case 'CAM':
    case 'CM':
    case 'CDM':
      // Midfielders: balanced with more passes
      return {
        easyPool: ['pass', 'pass', 'pass', 'dribble', 'tackle'],
        riskyPool: ['pass', 'shot', 'dribble', 'shot'],
      };
    case 'CB':
    case 'LB':
    case 'RB':
      // Defenders: lots of tackles
      return {
        easyPool: ['tackle', 'tackle', 'tackle', 'pass', 'pass'],
        riskyPool: ['tackle', 'pass', 'dribble', 'pass'],
      };
    case 'GK':
      // Goalkeeper: mostly passes and tackles (saves)
      return {
        easyPool: ['pass', 'pass', 'tackle', 'tackle', 'tackle'],
        riskyPool: ['pass', 'tackle', 'tackle'],
      };
    default:
      // Default balanced
      return {
        easyPool: ['pass', 'dribble', 'tackle'],
        riskyPool: ['shot', 'pass', 'dribble'],
      };
  }
}

/**
 * Calcule la probabilité de succès d'une action interactive.
 * Formula: base_probability * getFitnessModifier(fitness) * (relevant_stat / 100)
 * Clamped to [0.05, 0.95]
 */
export function calculateInteractiveActionProbability(
  baseProbability: number,
  fitness: number,
  relevantStat: number
): number {
  const fitnessModifier = getFitnessModifier(fitness);
  const statModifier = relevantStat / 100;
  const probability = baseProbability * fitnessModifier * statModifier;
  return clamp(probability, PROBABILITY_BOUNDS.min, PROBABILITY_BOUNDS.max);
}

/**
 * Calcule la perte de fitness progressive pendant un match.
 * La perte totale est répartie sur toutes les actions.
 */
function calculateProgressiveFitnessLoss(
  totalLoss: number,
  actionIndex: number,
  totalActions: number
): number {
  // Distribute fitness loss evenly across actions
  return totalLoss / totalActions;
}

// ─── Interactive Match Simulation (V2) ───────────────────────────────────────

/**
 * Génère les actions interactives pour un match.
 * Chaque action propose un choix easy (haute probabilité, faible récompense)
 * vs risky (basse probabilité, haute récompense).
 */
export function generateInteractiveActions(
  playerStats: PlayerStats,
  fitness: number,
  totalActions: number,
  totalFitnessLoss: number,
  rng: RNG = defaultRNG,
  position?: string
): InteractiveAction[] {
  const actionMinutes = generateActionMinutes(totalActions, rng);
  const actions: InteractiveAction[] = [];

  let currentFitness = fitness;

  // Position-based action type weights
  const { easyPool, riskyPool } = getActionPoolsForPosition(position);

  for (let i = 0; i < totalActions; i++) {
    const minute = actionMinutes[i];

    // Pick action types weighted by position
    const easyType = rng.randomChoice(easyPool);
    const riskyType = rng.randomChoice(riskyPool);

    // Generate base probabilities within ranges
    const easyBaseProbability = rng.randomFloat(EASY_PROBABILITY_RANGE.min, EASY_PROBABILITY_RANGE.max);
    const riskyBaseProbability = rng.randomFloat(RISKY_PROBABILITY_RANGE.min, RISKY_PROBABILITY_RANGE.max);

    // Calculate actual success probabilities
    const easyRelevantStat = getRelevantStat(easyType, playerStats);
    const riskyRelevantStat = getRelevantStat(riskyType, playerStats);

    const easySuccessProbability = calculateInteractiveActionProbability(
      easyBaseProbability, currentFitness, easyRelevantStat
    );
    const riskySuccessProbability = calculateInteractiveActionProbability(
      riskyBaseProbability, currentFitness, riskyRelevantStat
    );

    actions.push({
      minute,
      easy: {
        type: easyType,
        difficulty: 'easy',
        baseProbability: easyBaseProbability,
        successProbability: easySuccessProbability,
        description: `Safe ${easyType}`,
      },
      risky: {
        type: riskyType,
        difficulty: 'risky',
        baseProbability: riskyBaseProbability,
        successProbability: riskySuccessProbability,
        description: `Risky ${riskyType}`,
      },
    });

    // Apply progressive fitness decrease
    const fitnessLossThisAction = calculateProgressiveFitnessLoss(totalFitnessLoss, i, totalActions);
    currentFitness = clamp(currentFitness - fitnessLossThisAction, 0, 100);
  }

  return actions;
}

/**
 * Résout une action interactive choisie par le joueur.
 */
export function resolveInteractiveAction(
  choice: InteractiveActionChoice,
  rng: RNG = defaultRNG
): { success: boolean; outcome: 'goal' | 'assist' | 'completed' | 'failed' } {
  const success = rng.random() < choice.successProbability;

  if (!success) {
    return { success: false, outcome: 'failed' };
  }

  // Determine outcome based on action type
  if (choice.type === 'shot') {
    return { success: true, outcome: 'goal' };
  }

  if (choice.type === 'pass') {
    return { success: true, outcome: 'assist' };
  }

  return { success: true, outcome: 'completed' };
}

/**
 * Simule un match interactif complet avec le système de choix easy/risky.
 *
 * @param config - Configuration du match
 * @param playerChoices - Tableau de choix du joueur ('easy' | 'risky') pour chaque action
 * @param rng - Générateur aléatoire
 * @returns Résultat complet du match interactif
 */
export function simulateInteractiveMatch(
  config: MatchConfig,
  playerChoices: ActionDifficulty[],
  rng: RNG = defaultRNG
): InteractiveMatchResult {
  const player = config.playerCharacter;
  const initialFitness = player.fitness;

  // Determine number of actions (6-12)
  const numActions = rng.randomInt(INTERACTIVE_ACTIONS_PER_MATCH.min, INTERACTIVE_ACTIONS_PER_MATCH.max);

  // Determine total fitness loss for this match (15-30)
  const totalFitnessLoss = rng.randomInt(MATCH_FITNESS_LOSS.min, MATCH_FITNESS_LOSS.max);

  // Generate all interactive actions
  const interactiveActions = generateInteractiveActions(
    player.stats,
    initialFitness,
    numActions,
    totalFitnessLoss,
    rng
  );

  // Resolve each action based on player choices
  const actionResults: InteractiveActionResult[] = [];
  let currentFitness = initialFitness;
  let homeGoals = 0;
  let awayGoals = 0;
  let playerGoals = 0;
  let playerAssists = 0;
  let playerShots = 0;
  let playerDribbles = 0;
  let playerTackles = 0;
  let successfulActions = 0;

  const isPlayerHome = config.homeTeam.squad.some(p => p.isPlayerCharacter);

  for (let i = 0; i < numActions; i++) {
    const interactiveAction = interactiveActions[i];
    const chosenDifficulty = playerChoices[i] ?? 'easy';
    const chosenAction = chosenDifficulty === 'risky' ? interactiveAction.risky : interactiveAction.easy;

    // Resolve the action
    const resolution = resolveInteractiveAction(chosenAction, rng);

    // Apply progressive fitness loss
    const fitnessLossThisAction = totalFitnessLoss / numActions;
    currentFitness = clamp(currentFitness - fitnessLossThisAction, 0, 100);

    // Track stats
    if (chosenAction.type === 'shot') playerShots++;
    if (chosenAction.type === 'dribble') playerDribbles++;
    if (chosenAction.type === 'tackle') playerTackles++;

    if (resolution.success) {
      successfulActions++;

      if (resolution.outcome === 'goal') {
        playerGoals++;
        if (isPlayerHome) homeGoals++;
        else awayGoals++;
      }

      if (resolution.outcome === 'assist') {
        playerAssists++;
        // An assist leads to a goal by a teammate
        if (isPlayerHome) homeGoals++;
        else awayGoals++;
      }
    }

    actionResults.push({
      minute: interactiveAction.minute,
      chosenDifficulty,
      action: chosenAction,
      success: resolution.success,
      outcome: resolution.outcome,
      fitnessAfter: currentFitness,
    });
  }

  // Simulate remaining goals from AI teammates/opponents
  const aiHomeGoals = rng.randomInt(0, 2);
  const aiAwayGoals = rng.randomInt(0, 2);
  homeGoals += aiHomeGoals;
  awayGoals += aiAwayGoals;

  // Calculate player rating (1-10)
  const baseRating = numActions > 0 ? 5 + (successfulActions / numActions) * 3 : 5;
  const goalBonus = playerGoals * 0.8;
  const assistBonus = playerAssists * 0.5;
  const rating = clamp(Math.round((baseRating + goalBonus + assistBonus) * 10) / 10, 1, 10);

  const performance: MatchPerformance = {
    rating,
    goals: playerGoals,
    assists: playerAssists,
    minutesPlayed: 90,
    shots: playerShots,
    passAccuracy: numActions > 0 ? Math.round((successfulActions / numActions) * 100) : 0,
    dribbles: playerDribbles,
    tackles: playerTackles,
  };

  const matchResult: MatchResult = {
    matchday: config.matchday,
    homeTeamId: config.homeTeam.id,
    awayTeamId: config.awayTeam.id,
    homeGoals,
    awayGoals,
    playerPerformance: performance,
  };

  const actualFitnessLoss = initialFitness - currentFitness;

  return {
    result: matchResult,
    performance,
    actions: actionResults,
    fitnessLoss: actualFitnessLoss,
    finalFitness: currentFitness,
  };
}

// ─── Legacy Match Simulation ─────────────────────────────────────────────────

/**
 * Simule un match complet et retourne le résultat avec la performance du joueur.
 * (Mode legacy avec PlayerInput timing-based)
 */
export function simulateMatch(
  config: MatchConfig,
  playerInputs: PlayerInput[],
  rng: RNG = defaultRNG
): { result: MatchResult; performance: MatchPerformance; actions: MatchActionRecord[] } {
  const numActions = rng.randomInt(ACTIONS_PER_MATCH.min, ACTIONS_PER_MATCH.max);
  const actionMinutes = generateActionMinutes(numActions, rng);

  let homeGoals = 0;
  let awayGoals = 0;
  let playerGoals = 0;
  let playerAssists = 0;
  let playerShots = 0;
  let playerDribbles = 0;
  let playerTackles = 0;
  let successfulActions = 0;
  const actions: MatchActionRecord[] = [];

  const isPlayerHome = config.homeTeam.squad.some(p => p.isPlayerCharacter);

  for (let i = 0; i < numActions; i++) {
    const minute = actionMinutes[i];
    const actionType = rng.randomChoice(['shot', 'pass', 'dribble', 'tackle'] as const);

    // Pick opponent
    const opponentTeam = isPlayerHome ? config.awayTeam : config.homeTeam;
    const defender = opponentTeam.squad.length > 0
      ? rng.randomChoice(opponentTeam.squad)
      : { id: 'generic-def', name: 'Défenseur', position: 'CB' as const, age: 25, overallRating: 70, potential: 72, isPlayerCharacter: false };

    // Create player squad entry
    const playerSquad: SquadPlayer = {
      id: config.playerCharacter.id,
      name: `${config.playerCharacter.firstName} ${config.playerCharacter.lastName}`,
      position: config.playerCharacter.position,
      age: config.playerCharacter.age,
      overallRating: config.playerCharacter.overallRating,
      potential: config.playerCharacter.potential,
      isPlayerCharacter: true,
    };

    const action: MatchAction = {
      type: actionType,
      attacker: playerSquad,
      defender,
      context: {
        minute,
        score: { home: homeGoals, away: awayGoals },
        isHomeTeam: isPlayerHome,
      },
    };

    const playerInput = playerInputs[i] ?? { timing: 'good' as const };
    const result = resolveAction(
      action,
      playerInput,
      config.playerCharacter.fitness,
      config.playerCharacter.morale,
      rng
    );

    actions.push({ minute, action, result, playerInput });

    // Track stats
    if (actionType === 'shot') playerShots++;
    if (actionType === 'dribble') playerDribbles++;
    if (actionType === 'tackle') playerTackles++;

    if (result.success) {
      successfulActions++;
      if (actionType === 'shot' && result.outcome === 'goal') {
        playerGoals++;
        if (isPlayerHome) homeGoals++;
        else awayGoals++;
      }
      if (actionType === 'pass' && result.outcome === 'completed') {
        // Chance of assist leading to goal
        if (rng.random() < 0.3) {
          playerAssists++;
          if (isPlayerHome) homeGoals++;
          else awayGoals++;
        }
      }
    }
  }

  // Simulate remaining goals from AI teammates/opponents
  const aiHomeGoals = rng.randomInt(0, 2);
  const aiAwayGoals = rng.randomInt(0, 2);
  homeGoals += aiHomeGoals;
  awayGoals += aiAwayGoals;

  // Calculate player rating (1-10)
  const baseRating = 5 + (successfulActions / numActions) * 3;
  const goalBonus = playerGoals * 0.8;
  const assistBonus = playerAssists * 0.5;
  const rating = clamp(Math.round((baseRating + goalBonus + assistBonus) * 10) / 10, 1, 10);

  const performance: MatchPerformance = {
    rating,
    goals: playerGoals,
    assists: playerAssists,
    minutesPlayed: 90,
    shots: playerShots,
    passAccuracy: numActions > 0 ? Math.round((successfulActions / numActions) * 100) : 0,
    dribbles: playerDribbles,
    tackles: playerTackles,
  };

  const matchResult: MatchResult = {
    matchday: config.matchday,
    homeTeamId: config.homeTeam.id,
    awayTeamId: config.awayTeam.id,
    homeGoals,
    awayGoals,
    playerPerformance: performance,
  };

  return { result: matchResult, performance, actions };
}

export const MatchSimulator = {
  simulateMatch,
  simulateInteractiveMatch,
  generateInteractiveActions,
  resolveInteractiveAction,
  calculateInteractiveActionProbability,
  INTERACTIVE_ACTIONS_PER_MATCH,
  EASY_PROBABILITY_RANGE,
  RISKY_PROBABILITY_RANGE,
  PROBABILITY_BOUNDS,
};
