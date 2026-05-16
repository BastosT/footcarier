/**
 * ActionResolver - Résout les actions de match avec probabilités bornées.
 */

import type { MatchAction, PlayerInput, ActionResult } from '../../core/types';
import { clamp } from '../../utils/math';
import { type RNG, defaultRNG } from '../../utils/random';

const TIMING_BONUS: Record<string, number> = {
  perfect: 0.15,
  good: 0.05,
  miss: 0,
};

/**
 * Résout une action de match.
 * Probabilité = stat_joueur / (stat_joueur + stat_adversaire) * modificateurs
 * Bornée entre [0.05, 0.95].
 */
export function resolveAction(
  action: MatchAction,
  playerInput: PlayerInput | undefined,
  fitness: number,
  morale: number,
  rng: RNG = defaultRNG
): ActionResult {
  // Get relevant stats based on action type
  const attackerStat = getRelevantStat(action.type, action.attacker.overallRating);
  const defenderStat = getRelevantStat(getDefensiveAction(action.type), action.defender.overallRating);

  // Base probability
  let probability = attackerStat / (attackerStat + defenderStat);

  // Apply modifiers
  const fitnessMod = fitness / 100;
  const moraleMod = morale / 100;
  probability *= fitnessMod * moraleMod;

  // Apply player timing bonus
  if (playerInput) {
    probability += TIMING_BONUS[playerInput.timing] ?? 0;
  }

  // Clamp to [0.05, 0.95]
  probability = clamp(probability, 0.05, 0.95);

  // Resolve
  const success = rng.random() < probability;

  return {
    success,
    outcome: getOutcome(action.type, success),
    xpGained: success ? 10 : 3,
    ratingImpact: success ? 0.3 : -0.1,
  };
}

function getRelevantStat(actionType: string, overallRating: number): number {
  // Simplified: use overall rating as proxy
  // In full implementation, would use specific stats
  return overallRating;
}

function getDefensiveAction(attackType: string): string {
  switch (attackType) {
    case 'shot': return 'save';
    case 'dribble': return 'tackle';
    case 'pass': return 'intercept';
    default: return 'defend';
  }
}

function getOutcome(actionType: string, success: boolean): ActionResult['outcome'] {
  if (!success) {
    switch (actionType) {
      case 'shot': return 'save';
      case 'dribble': return 'intercept';
      case 'pass': return 'intercept';
      case 'tackle': return 'foul';
      default: return 'miss';
    }
  }
  switch (actionType) {
    case 'shot': return 'goal';
    case 'pass': return 'completed';
    case 'dribble': return 'completed';
    case 'tackle': return 'completed';
    default: return 'completed';
  }
}

/**
 * Calcule la probabilité de succès d'une action (pour les tests).
 * Exposé séparément pour permettre la vérification de la monotonie.
 */
export function calculateActionProbability(
  attackerRating: number,
  defenderRating: number,
  fitness: number,
  morale: number,
  timing?: 'perfect' | 'good' | 'miss'
): number {
  let probability = attackerRating / (attackerRating + defenderRating);
  probability *= (fitness / 100) * (morale / 100);
  if (timing) {
    probability += TIMING_BONUS[timing] ?? 0;
  }
  return clamp(probability, 0.05, 0.95);
}

export const ActionResolver = {
  resolveAction,
  calculateActionProbability,
};
