/**
 * StatsSystem - Gère le calcul de la note globale, la progression et le vieillissement.
 */

import type { PlayerStats, Position } from '../../core/types';
import { clamp } from '../../utils/math';

/**
 * Poids des statistiques par poste pour le calcul de la note globale.
 */
const POSITION_WEIGHTS: Record<Position, Record<keyof PlayerStats, number>> = {
  GK: { pace: 0.05, shooting: 0.02, passing: 0.15, dribbling: 0.05, defending: 0.25, physical: 0.48 },
  CB: { pace: 0.10, shooting: 0.05, passing: 0.10, dribbling: 0.05, defending: 0.45, physical: 0.25 },
  LB: { pace: 0.20, shooting: 0.05, passing: 0.15, dribbling: 0.10, defending: 0.30, physical: 0.20 },
  RB: { pace: 0.20, shooting: 0.05, passing: 0.15, dribbling: 0.10, defending: 0.30, physical: 0.20 },
  CDM: { pace: 0.10, shooting: 0.08, passing: 0.20, dribbling: 0.10, defending: 0.32, physical: 0.20 },
  CM: { pace: 0.10, shooting: 0.15, passing: 0.25, dribbling: 0.15, defending: 0.15, physical: 0.20 },
  CAM: { pace: 0.10, shooting: 0.20, passing: 0.25, dribbling: 0.25, defending: 0.05, physical: 0.15 },
  LW: { pace: 0.25, shooting: 0.20, passing: 0.15, dribbling: 0.25, defending: 0.03, physical: 0.12 },
  RW: { pace: 0.25, shooting: 0.20, passing: 0.15, dribbling: 0.25, defending: 0.03, physical: 0.12 },
  ST: { pace: 0.20, shooting: 0.30, passing: 0.10, dribbling: 0.20, defending: 0.02, physical: 0.18 },
};

/**
 * Calcule la note globale d'un joueur en fonction de ses stats et de son poste.
 * @returns Un entier entre 1 et 99.
 */
export function calculateOverallRating(stats: PlayerStats, position: Position): number {
  const weights = POSITION_WEIGHTS[position];
  const weighted =
    stats.pace * weights.pace +
    stats.shooting * weights.shooting +
    stats.passing * weights.passing +
    stats.dribbling * weights.dribbling +
    stats.defending * weights.defending +
    stats.physical * weights.physical;

  return clamp(Math.round(weighted), 1, 99);
}

/**
 * Calcule le facteur de progression basé sur la note actuelle et le potentiel.
 * Ralentit significativement au-delà de 80% du potentiel.
 * @returns Un facteur entre 0 et 1.
 */
export function getProgressionRate(currentRating: number, potential: number): number {
  if (potential <= 0) return 0;
  const ratio = currentRating / potential;
  let factor = 1 - ratio * ratio;

  // Ralentissement à 80% du potentiel
  if (currentRating >= 0.8 * potential) {
    factor *= 0.3;
  }

  return clamp(factor, 0, 1);
}

/**
 * Applique la décroissance physique liée à l'âge (après 30 ans).
 * Seules les stats physiques (pace, physical) sont affectées.
 * @param age - Âge du joueur
 * @param stats - Stats actuelles
 * @returns Nouvelles stats avec décroissance appliquée
 */
export function applyAgingDecay(age: number, stats: PlayerStats): PlayerStats {
  if (age <= 30) return { ...stats };

  const decayFactor = (age - 30) * 0.5;

  return {
    ...stats,
    pace: clamp(Math.round(stats.pace - decayFactor), 1, 99),
    physical: clamp(Math.round(stats.physical - decayFactor), 1, 99),
  };
}

export const StatsSystem = {
  calculateOverallRating,
  getProgressionRate,
  applyAgingDecay,
};
