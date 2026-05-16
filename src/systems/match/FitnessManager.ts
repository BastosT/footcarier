/**
 * FitnessManager - Gestion de la condition physique du joueur.
 *
 * La fitness est bornée entre [0, 100] et impacte les performances en match.
 * - Diminue de 15-30 points après un match (selon l'intensité)
 * - Récupère de 1 point par jour de repos
 * - Réduit la probabilité de succès des actions quand < 50
 */

import { clamp } from '../../utils/math';
import { type RNG, defaultRNG } from '../../utils/random';

// ─── Constantes ──────────────────────────────────────────────────────────────

export const MATCH_FITNESS_LOSS = { min: 15, max: 30 } as const;
export const DAILY_RECOVERY = 1;
export const LOW_FITNESS_THRESHOLD = 50;

// ─── Fonctions ───────────────────────────────────────────────────────────────

/**
 * Applique la fatigue d'un match à la fitness du joueur.
 * La perte est comprise entre 15 et 30 points, modulée par l'intensité du match.
 *
 * @param fitness - Fitness actuelle du joueur (0-100)
 * @param matchIntensity - Intensité du match (0-1), où 1 = intensité maximale
 * @param rng - Générateur aléatoire (optionnel, pour la reproductibilité)
 * @returns Nouvelle fitness après fatigue, bornée à [0, 100]
 */
export function applyMatchFatigue(
  fitness: number,
  matchIntensity: number,
  rng: RNG = defaultRNG
): number {
  const clampedIntensity = clamp(matchIntensity, 0, 1);

  // La perte de base est un random entre min et max
  const baseLoss = rng.randomInt(MATCH_FITNESS_LOSS.min, MATCH_FITNESS_LOSS.max);

  // L'intensité module la perte : à intensité 0 on perd le min, à intensité 1 le max
  // On interpole entre min et la perte aléatoire selon l'intensité
  const loss = Math.round(
    MATCH_FITNESS_LOSS.min + (baseLoss - MATCH_FITNESS_LOSS.min) * clampedIntensity
  );

  return clampFitness(fitness - loss);
}

/**
 * Applique la récupération quotidienne de fitness.
 * Le joueur récupère 1 point par jour de repos (sans match).
 *
 * @param fitness - Fitness actuelle du joueur (0-100)
 * @returns Nouvelle fitness après récupération, bornée à [0, 100]
 */
export function applyDailyRecovery(fitness: number): number {
  return clampFitness(fitness + DAILY_RECOVERY);
}

/**
 * Borne la fitness entre 0 et 100.
 *
 * @param fitness - Valeur de fitness à borner
 * @returns Fitness bornée dans [0, 100]
 */
export function clampFitness(fitness: number): number {
  return clamp(fitness, 0, 100);
}

/**
 * Calcule le modificateur de probabilité basé sur la fitness.
 * Quand la fitness est >= 50, le modificateur est 1 (pas de pénalité).
 * Quand la fitness est < 50, la probabilité est réduite proportionnellement.
 *
 * Le modificateur varie linéairement de 0.5 (fitness = 0) à 1.0 (fitness = 50+).
 *
 * @param fitness - Fitness actuelle du joueur (0-100)
 * @returns Modificateur de probabilité dans [0.5, 1.0]
 */
export function getFitnessModifier(fitness: number): number {
  const clampedFitness = clampFitness(fitness);

  if (clampedFitness >= LOW_FITNESS_THRESHOLD) {
    return 1.0;
  }

  // Réduction proportionnelle : de 1.0 à 0.5 quand fitness passe de 50 à 0
  // modifier = 0.5 + (fitness / 50) * 0.5
  return 0.5 + (clampedFitness / LOW_FITNESS_THRESHOLD) * 0.5;
}

// ─── Interface exportée ──────────────────────────────────────────────────────

export const FitnessManager = {
  applyMatchFatigue,
  applyDailyRecovery,
  clampFitness,
  getFitnessModifier,
  MATCH_FITNESS_LOSS,
  DAILY_RECOVERY,
  LOW_FITNESS_THRESHOLD,
};
