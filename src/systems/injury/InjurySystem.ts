/**
 * InjurySystem - Gère les blessures, la récupération et les restrictions.
 */

import type { PlayerCharacter, InjuryState, InjuryType, PlayerStats } from '../../core/types';
import { type RNG, defaultRNG } from '../../utils/random';
import { clamp } from '../../utils/math';

/**
 * Durées de blessure par type et sévérité (en semaines).
 */
const INJURY_DURATIONS: Record<InjuryType, Record<string, { min: number; max: number }>> = {
  muscle: { minor: { min: 1, max: 2 }, moderate: { min: 2, max: 4 }, severe: { min: 4, max: 8 } },
  ligament: { minor: { min: 2, max: 3 }, moderate: { min: 4, max: 8 }, severe: { min: 8, max: 24 } },
  fracture: { minor: { min: 3, max: 5 }, moderate: { min: 6, max: 12 }, severe: { min: 12, max: 24 } },
  concussion: { minor: { min: 1, max: 2 }, moderate: { min: 2, max: 4 }, severe: { min: 4, max: 8 } },
  fatigue: { minor: { min: 1, max: 1 }, moderate: { min: 1, max: 2 }, severe: { min: 2, max: 3 } },
};

/**
 * Poids des types de blessure.
 */
const INJURY_TYPE_WEIGHTS: Record<InjuryType, number> = {
  muscle: 35,
  ligament: 20,
  fracture: 10,
  concussion: 10,
  fatigue: 25,
};

/**
 * Évalue la probabilité de blessure post-match.
 * Basée sur la fatigue (fitness) et l'intensité du match.
 */
export function evaluatePostMatchInjuryRisk(
  player: PlayerCharacter,
  minutesPlayed: number
): number {
  const baseProbability = 0.05;
  const fatigueFactor = 1 - (player.fitness / 100); // Plus fatigué = plus de risque
  const minutesFactor = minutesPlayed / 90;

  return clamp(baseProbability + fatigueFactor * 0.1 * minutesFactor, 0, 0.3);
}

/**
 * Génère une blessure aléatoire.
 */
export function generateInjury(rng: RNG = defaultRNG): InjuryState {
  // Determine type
  const types = Object.keys(INJURY_TYPE_WEIGHTS) as InjuryType[];
  const weights = types.map(t => INJURY_TYPE_WEIGHTS[t]);
  const type = rng.randomWeighted(types, weights);

  // Determine severity
  const severityRoll = rng.random();
  const severity: InjuryState['severity'] = severityRoll < 0.5 ? 'minor' : severityRoll < 0.85 ? 'moderate' : 'severe';

  // Determine duration
  const duration = INJURY_DURATIONS[type][severity];
  const weeksRemaining = rng.randomInt(duration.min, duration.max);

  return { type, weeksRemaining, severity };
}

/**
 * Avance la récupération d'une semaine.
 * @returns null si le joueur est guéri, sinon l'état mis à jour.
 */
export function advanceRecovery(injury: InjuryState): InjuryState | null {
  const remaining = injury.weeksRemaining - 1;
  if (remaining <= 0) return null;
  return { ...injury, weeksRemaining: remaining };
}

/**
 * Applique une réduction temporaire des stats physiques au retour de blessure.
 * Le joueur revient avec -5 à -10 en pace et physical selon la sévérité.
 */
export function getReturnFromInjuryPenalty(injury: InjuryState): { pace: number; physical: number } {
  switch (injury.severity) {
    case 'minor': return { pace: -2, physical: -2 };
    case 'moderate': return { pace: -5, physical: -5 };
    case 'severe': return { pace: -10, physical: -8 };
  }
}

/**
 * Vérifie si un joueur est blessé.
 */
export function isInjured(player: PlayerCharacter): boolean {
  return player.injury !== null && player.injury.weeksRemaining > 0;
}

export const InjurySystem = {
  evaluatePostMatchInjuryRisk,
  generateInjury,
  advanceRecovery,
  getReturnFromInjuryPenalty,
  isInjured,
};
