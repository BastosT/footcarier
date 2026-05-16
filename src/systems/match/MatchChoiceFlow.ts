/**
 * MatchChoiceFlow - Gère le flux de choix de match (simuler ou jouer).
 *
 * Contient la logique de simulation rapide (quick match) qui :
 * - Calcule le résultat en favorisant l'équipe la plus forte
 * - Génère une performance automatique pour le joueur
 * - Applique la perte de fitness
 */

import type {
  MatchConfig,
  MatchResult,
  MatchPerformance,
  PlayerCharacter,
} from '../../core/types';
import { simulateAIMatch } from './AIMatchSimulator';
import { applyMatchFatigue, MATCH_FITNESS_LOSS } from './FitnessManager';
import { average, poissonRandom, clamp } from '../../utils/math';
import { type RNG, defaultRNG } from '../../utils/random';

/**
 * Interface for the complete result of a quick match simulation.
 */
export interface QuickMatchResult {
  result: MatchResult;
  performance: MatchPerformance;
  fitnessLoss: number;
  newFitness: number;
}

/**
 * Simulates a quick match (when the player chooses "Simuler le match").
 *
 * Algorithm:
 * 1. Calculate force_home = average(ratings_home), force_away = average(ratings_away)
 * 2. Result = AIMatchSimulator.simulateAIMatch(home, away, matchday)
 * 3. Player performance:
 *    - rating = (overallRating / 10) * (fitness / 100) + random(-1, 1)
 *    - goals = poisson(lambda = rating * 0.15) if attacker/midfielder
 *    - assists = poisson(lambda = rating * 0.1)
 * 4. fitnessLoss = randomInt(15, 30)
 *
 * @param config - Match configuration with both teams and player info
 * @param player - The player character
 * @param rng - Random number generator (for testability)
 * @returns QuickMatchResult with match result, performance, and fitness changes
 */
export function simulateQuickMatch(
  config: MatchConfig,
  player: PlayerCharacter,
  rng: RNG = defaultRNG
): QuickMatchResult {
  // 1-2. Simulate the match result using AIMatchSimulator
  const matchResult = simulateAIMatch(
    config.homeTeam,
    config.awayTeam,
    config.matchday,
    rng
  );

  // 3. Generate automatic player performance
  const performance = generatePlayerPerformance(
    player,
    config,
    matchResult,
    rng
  );

  // 4. Apply fitness loss (15-30 points)
  const fitnessLoss = rng.randomInt(MATCH_FITNESS_LOSS.min, MATCH_FITNESS_LOSS.max);
  const newFitness = clamp(player.fitness - fitnessLoss, 0, 100);

  // Attach player performance to the match result
  const resultWithPerformance: MatchResult = {
    ...matchResult,
    playerPerformance: performance,
  };

  return {
    result: resultWithPerformance,
    performance,
    fitnessLoss,
    newFitness,
  };
}

/**
 * Generates automatic player performance based on overall rating and fitness.
 *
 * Formula:
 * - rating = (overallRating / 10) * (fitness / 100) + random(-1, 1)
 * - goals = poisson(lambda = rating * 0.15) if attacker/midfielder
 * - assists = poisson(lambda = rating * 0.1)
 */
function generatePlayerPerformance(
  player: PlayerCharacter,
  config: MatchConfig,
  matchResult: MatchResult,
  rng: RNG
): MatchPerformance {
  // Calculate base rating from overall rating and fitness
  const baseRating = (player.overallRating / 10) * (player.fitness / 100);
  const randomVariation = rng.randomFloat(-1, 1);
  const rating = clamp(Math.round((baseRating + randomVariation) * 10) / 10, 1, 10);

  // Determine if player is in an attacking/midfield position (can score goals)
  const attackingPositions: string[] = ['ST', 'LW', 'RW', 'CAM', 'CM', 'CDM'];
  const isAttackingPosition = attackingPositions.includes(player.position);

  // Generate goals and assists using Poisson distribution
  let goals = 0;
  let assists = 0;

  if (isAttackingPosition) {
    const goalsLambda = Math.max(0, rating * 0.15);
    goals = poissonRandom(goalsLambda, rng);
  }

  const assistsLambda = Math.max(0, rating * 0.1);
  assists = poissonRandom(assistsLambda, rng);

  // Adjust match result to account for player goals
  // The player's goals should be reflected in their team's score
  const isPlayerHome = config.homeTeam.squad.some(p => p.isPlayerCharacter);
  if (isPlayerHome) {
    // Ensure home goals are at least player goals
    if (matchResult.homeGoals < goals) {
      matchResult.homeGoals = goals;
    }
  } else {
    // Ensure away goals are at least player goals
    if (matchResult.awayGoals < goals) {
      matchResult.awayGoals = goals;
    }
  }

  // Generate other stats based on rating
  const shots = isAttackingPosition ? rng.randomInt(1, Math.max(1, Math.round(rating / 2))) : rng.randomInt(0, 1);
  const passAccuracy = clamp(Math.round(50 + rating * 5 + rng.randomInt(-5, 5)), 30, 99);
  const dribbles = rng.randomInt(0, Math.max(0, Math.round(rating / 3)));
  const tackles = player.position === 'CB' || player.position === 'CDM' || player.position === 'LB' || player.position === 'RB'
    ? rng.randomInt(1, Math.max(1, Math.round(rating / 2)))
    : rng.randomInt(0, 2);

  return {
    rating,
    goals,
    assists,
    minutesPlayed: 90,
    shots,
    passAccuracy,
    dribbles,
    tackles,
  };
}

export const MatchChoiceFlow = {
  simulateQuickMatch,
};
