/**
 * TrainingManager - Gère l'entraînement hebdomadaire unique et significatif (V2).
 *
 * Contrairement au TrainingSystem existant qui gère les sessions avec intensité variable,
 * le TrainingManager implémente la logique de la session hebdomadaire unique avec un
 * impact fort (entre 1 et 3 points selon le potentiel restant).
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import type { PlayerCharacter, TrainingSkill, TrainingResult } from '../../core/types';
import { clamp } from '../../utils/math';
import { type RNG, defaultRNG } from '../../utils/random';

/** Gain d'entraînement significatif : entre 2 et 3 points */
export const TRAINING_GAIN = { min: 2, max: 3 };

/**
 * Vérifie si l'entraînement hebdomadaire est disponible.
 * Le joueur ne peut s'entraîner qu'une seule fois par semaine.
 *
 * @param trainedThisWeek - Indique si le joueur s'est déjà entraîné cette semaine
 * @returns true si l'entraînement est disponible, false sinon
 */
export function isTrainingAvailable(trainedThisWeek: boolean): boolean {
  return !trainedThisWeek;
}

/**
 * Calcule le gain significatif d'entraînement basé sur la stat actuelle et le potentiel.
 *
 * Le gain est entre 1 et 3 points :
 * - Plus le joueur est loin de son potentiel, plus le gain est élevé (proche de 3)
 * - Plus le joueur est proche de son potentiel, plus le gain est faible (proche de 1)
 * - Si la stat actuelle est déjà au potentiel, le gain est 0
 *
 * @param currentStat - Valeur actuelle de la compétence (1-99)
 * @param potential - Potentiel maximum du joueur (1-99)
 * @param rng - Générateur aléatoire (optionnel, pour la testabilité)
 * @returns Le gain en points (0 si déjà au potentiel, sinon entre 1 et 3)
 */
export function calculateSignificantGain(
  currentStat: number,
  potential: number,
  rng: RNG = defaultRNG
): number {
  // Si la stat est déjà au potentiel ou au-dessus, pas de gain
  if (currentStat >= potential) {
    return 0;
  }

  // Ratio de progression restante (0 = au potentiel, 1 = très loin)
  const remainingRatio = (potential - currentStat) / potential;

  // Le gain de base est influencé par le potentiel restant
  // remainingRatio élevé → gain tend vers max (3)
  // remainingRatio faible → gain tend vers min (1)
  const baseGain = TRAINING_GAIN.min + remainingRatio * (TRAINING_GAIN.max - TRAINING_GAIN.min);

  // Ajouter une petite variation aléatoire (±0.5)
  const variation = rng.randomFloat(-0.5, 0.5);
  const rawGain = baseGain + variation;

  // Borner entre min et max, arrondir à l'entier
  const gain = Math.round(clamp(rawGain, TRAINING_GAIN.min, TRAINING_GAIN.max));

  // Ne pas dépasser le potentiel
  return Math.min(gain, potential - currentStat);
}

/**
 * Exécute la session d'entraînement hebdomadaire unique.
 * Applique un gain significatif (1-3 points) sur la compétence ciblée.
 *
 * @param player - Le joueur personnage
 * @param skill - La compétence à entraîner (vitesse, tir, passe, dribble, défense, physique)
 * @param rng - Générateur aléatoire (optionnel, pour la testabilité)
 * @returns Le résultat de l'entraînement avec le gain appliqué
 * @throws Error si le joueur est blessé
 */
export function executeWeeklyTraining(
  player: PlayerCharacter,
  skill: TrainingSkill,
  rng: RNG = defaultRNG
): TrainingResult {
  if (player.injury) {
    throw new Error('Le joueur est blessé et ne peut pas s\'entraîner.');
  }

  const currentStat = player.stats[skill];
  const gain = calculateSignificantGain(currentStat, player.potential, rng);
  const newValue = clamp(currentStat + gain, 1, 99);

  return {
    skill,
    previousValue: currentStat,
    newValue,
    gain: newValue - currentStat,
  };
}

export const TrainingManager = {
  isTrainingAvailable,
  executeWeeklyTraining,
  calculateSignificantGain,
};
