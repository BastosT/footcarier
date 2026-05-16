/**
 * TrainingSystem - Gère les sessions d'entraînement et la rééducation.
 */

import type { PlayerCharacter, TrainingSession, TrainingResult, TrainingIntensity, TrainingSkill } from '../../core/types';
import { updateStatsAfterTraining } from '../stats/ProgressionEngine';
import { calculateOverallRating } from '../stats/StatsSystem';

/**
 * Nombre de sessions intensives consécutives qui augmentent le risque de blessure.
 */
export const INTENSIVE_THRESHOLD = 3;

/**
 * Probabilité de blessure de base après entraînement.
 */
const BASE_INJURY_RISK = 0.02;

/**
 * Multiplicateur de risque après 3+ sessions intensives.
 */
const INTENSIVE_RISK_MULTIPLIER = 3.0;

export interface TrainingContext {
  consecutiveIntensiveSessions: number;
}

/**
 * Exécute une session d'entraînement et retourne le résultat.
 * @returns Le résultat de la session avec les gains de stats.
 */
export function executeTraining(
  player: PlayerCharacter,
  session: TrainingSession
): TrainingResult {
  if (player.injury && !session.isRehabilitation) {
    throw new Error('Le joueur est blessé et ne peut pas s\'entraîner normalement.');
  }

  const skill = session.skill;
  const previousValue = player.stats[skill];
  const overallRating = calculateOverallRating(player.stats, player.position);

  const newStats = updateStatsAfterTraining(
    player.stats,
    session,
    player.potential,
    overallRating
  );

  return {
    skill,
    previousValue,
    newValue: newStats[skill],
    gain: newStats[skill] - previousValue,
  };
}

/**
 * Calcule le risque de blessure après un entraînement.
 * Le risque augmente significativement après 3 sessions intensives consécutives.
 */
export function calculateInjuryRisk(
  session: TrainingSession,
  context: TrainingContext
): number {
  if (session.intensity !== 'high') return BASE_INJURY_RISK;

  const consecutiveHigh = context.consecutiveIntensiveSessions + 1;

  if (consecutiveHigh >= INTENSIVE_THRESHOLD) {
    return BASE_INJURY_RISK * INTENSIVE_RISK_MULTIPLIER * (consecutiveHigh - INTENSIVE_THRESHOLD + 1);
  }

  return BASE_INJURY_RISK * 1.5;
}

/**
 * Vérifie si un joueur blessé peut s'entraîner (uniquement rééducation).
 */
export function canTrain(player: PlayerCharacter, session: TrainingSession): boolean {
  if (!player.injury) return true;
  return session.isRehabilitation;
}

/**
 * Vérifie si un joueur blessé peut jouer un match.
 */
export function canPlayMatch(player: PlayerCharacter): boolean {
  return player.injury === null;
}

export const TrainingSystem = {
  executeTraining,
  calculateInjuryRisk,
  canTrain,
  canPlayMatch,
};
