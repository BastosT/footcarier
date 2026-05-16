/**
 * ProgressionEngine - Gère la génération de stats initiales et la progression du joueur.
 */

import type { PlayerStats, Position, TrainingSession, MatchPerformance } from '../../core/types';
import { clamp } from '../../utils/math';
import { type RNG, defaultRNG } from '../../utils/random';
import { getProgressionRate } from './StatsSystem';

/**
 * Profils de stats initiales par poste.
 * Les valeurs représentent les poids relatifs pour la distribution des points.
 */
const POSITION_PROFILES: Record<Position, Record<keyof PlayerStats, number>> = {
  GK: { pace: 0.4, shooting: 0.2, passing: 0.5, dribbling: 0.3, defending: 0.7, physical: 0.8 },
  CB: { pace: 0.5, shooting: 0.3, passing: 0.4, dribbling: 0.3, defending: 0.9, physical: 0.7 },
  LB: { pace: 0.8, shooting: 0.3, passing: 0.6, dribbling: 0.5, defending: 0.7, physical: 0.6 },
  RB: { pace: 0.8, shooting: 0.3, passing: 0.6, dribbling: 0.5, defending: 0.7, physical: 0.6 },
  CDM: { pace: 0.5, shooting: 0.4, passing: 0.7, dribbling: 0.5, defending: 0.8, physical: 0.7 },
  CM: { pace: 0.6, shooting: 0.6, passing: 0.8, dribbling: 0.6, defending: 0.5, physical: 0.6 },
  CAM: { pace: 0.6, shooting: 0.7, passing: 0.8, dribbling: 0.8, defending: 0.3, physical: 0.5 },
  LW: { pace: 0.9, shooting: 0.7, passing: 0.6, dribbling: 0.9, defending: 0.2, physical: 0.5 },
  RW: { pace: 0.9, shooting: 0.7, passing: 0.6, dribbling: 0.9, defending: 0.2, physical: 0.5 },
  ST: { pace: 0.7, shooting: 0.9, passing: 0.5, dribbling: 0.7, defending: 0.2, physical: 0.6 },
};

/**
 * Génère les statistiques initiales d'un joueur en fonction de son poste et de son potentiel.
 * Les stats sont pondérées selon le profil du poste.
 * @param position - Poste du joueur
 * @param potential - Potentiel du joueur (1-99)
 * @param rng - Générateur aléatoire (optionnel)
 * @returns Stats initiales cohérentes avec le poste
 */
export function generateInitialStats(
  position: Position,
  potential: number,
  rng: RNG = defaultRNG
): PlayerStats {
  const profile = POSITION_PROFILES[position];
  // Base rating is 40-60% of potential for a young player
  const baseRating = potential * (0.4 + rng.random() * 0.2);

  const stats: PlayerStats = {
    pace: 0,
    shooting: 0,
    passing: 0,
    dribbling: 0,
    defending: 0,
    physical: 0,
  };

  for (const key of Object.keys(profile) as (keyof PlayerStats)[]) {
    const weight = profile[key];
    // Higher weight = higher stat relative to base
    const variation = rng.randomFloat(-3, 3);
    const value = baseRating * weight + variation;
    stats[key] = clamp(Math.round(value), 1, Math.min(potential, 99));
  }

  return stats;
}

/**
 * Intensité d'entraînement → facteur de gain.
 */
const INTENSITY_FACTOR: Record<string, number> = {
  low: 0.3,
  medium: 0.6,
  high: 1.0,
};

/**
 * Met à jour les stats après une session d'entraînement.
 * @param stats - Stats actuelles
 * @param session - Session d'entraînement
 * @param potential - Potentiel du joueur
 * @param overallRating - Note globale actuelle
 * @returns Nouvelles stats après entraînement
 */
export function updateStatsAfterTraining(
  stats: PlayerStats,
  session: TrainingSession,
  potential: number,
  overallRating: number
): PlayerStats {
  const newStats = { ...stats };
  const skill = session.skill as keyof PlayerStats;
  const intensityFactor = INTENSITY_FACTOR[session.intensity] ?? 0.6;

  // Gain de base : 0.5 à 1.5 points selon l'intensité
  const baseGain = 0.5 + intensityFactor;

  // Facteur de progression (ralentit près du potentiel)
  const progressionRate = getProgressionRate(overallRating, potential);

  const gain = baseGain * progressionRate;
  newStats[skill] = clamp(Math.round(newStats[skill] + gain), 1, potential);

  return newStats;
}

/**
 * Met à jour les stats après un match basé sur la performance.
 * @param stats - Stats actuelles
 * @param performance - Performance du match
 * @param potential - Potentiel du joueur
 * @param overallRating - Note globale actuelle
 * @returns Nouvelles stats après match
 */
export function updateStatsAfterMatch(
  stats: PlayerStats,
  performance: MatchPerformance,
  potential: number,
  overallRating: number
): PlayerStats {
  const newStats = { ...stats };
  const progressionRate = getProgressionRate(overallRating, potential);

  // Gain basé sur la note du match (1-10)
  // Note >= 7 : progression positive, Note < 5 : pas de progression
  if (performance.rating < 5) return newStats;

  const matchGain = (performance.rating - 5) * 0.2 * progressionRate;

  // Distribuer le gain sur les stats pertinentes
  if (performance.goals > 0) {
    newStats.shooting = clamp(Math.round(newStats.shooting + matchGain), 1, potential);
  }
  if (performance.assists > 0) {
    newStats.passing = clamp(Math.round(newStats.passing + matchGain), 1, potential);
  }
  if (performance.dribbles > 2) {
    newStats.dribbling = clamp(Math.round(newStats.dribbling + matchGain * 0.5), 1, potential);
  }
  if (performance.tackles > 3) {
    newStats.defending = clamp(Math.round(newStats.defending + matchGain * 0.5), 1, potential);
  }

  return newStats;
}

export const ProgressionEngine = {
  generateInitialStats,
  updateStatsAfterTraining,
  updateStatsAfterMatch,
};
