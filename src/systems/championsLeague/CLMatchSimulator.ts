/**
 * CLMatchSimulator - Simule les matchs de Ligue des Champions entre deux participants.
 * Utilise la distribution de Poisson pondérée par la note moyenne de l'effectif.
 * Produit des scores réalistes entre 0 et 5 buts par équipe.
 * Gère la prolongation et les tirs au but pour les matchs à élimination directe.
 */

import type { CLParticipant, CLMatchResult } from './types';
import { CL_CONSTANTS } from './types';
import { type RNG, defaultRNG } from '../../utils/random';
import { poissonRandom, clamp } from '../../utils/math';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Avantage à domicile (multiplicateur de force) */
const HOME_ADVANTAGE_FACTOR = 1.10;

/** Buts totaux attendus par match (réaliste CL : ~2.7) */
const BASE_TOTAL_EXPECTED_GOALS = 2.7;

/** Variance sur les buts totaux attendus */
const EXPECTED_GOALS_VARIANCE = 0.4;

/** Maximum de buts en prolongation par équipe */
const MAX_EXTRA_TIME_GOALS = 2;

/** Lambda pour la prolongation (faible : peu de buts) */
const EXTRA_TIME_LAMBDA = 0.4;

// ─── Interface ───────────────────────────────────────────────────────────────

export interface ICLMatchSimulator {
  /** Simule un match CL entre deux participants */
  simulateMatch(
    home: CLParticipant,
    away: CLParticipant,
    rng?: RNG
  ): CLMatchResult;

  /** Simule une prolongation + tirs au but si nécessaire */
  simulateExtraTimeAndPenalties(
    aggregateHome: number,
    aggregateAway: number,
    homeTeam: CLParticipant,
    awayTeam: CLParticipant,
    rng?: RNG
  ): { winnerIsHome: boolean; extraTimeGoals: [number, number]; penalties?: [number, number] };
}

// ─── Implementation ──────────────────────────────────────────────────────────

/**
 * Simule un match CL entre deux participants.
 * La note moyenne de l'effectif pondère les probabilités de victoire.
 * Les scores sont bornés entre 0 et CL_CONSTANTS.MAX_GOALS_PER_TEAM (5).
 */
export function simulateMatch(
  home: CLParticipant,
  away: CLParticipant,
  rng: RNG = defaultRNG
): CLMatchResult {
  const homeStrength = home.averageRating * HOME_ADVANTAGE_FACTOR;
  const awayStrength = away.averageRating;

  // Calculer la part de chaque équipe dans les buts attendus
  const totalStrength = homeStrength + awayStrength;
  const homeShare = homeStrength / totalStrength;
  const awayShare = awayStrength / totalStrength;

  // Buts totaux attendus avec légère variance
  const totalExpectedGoals = BASE_TOTAL_EXPECTED_GOALS + (rng.random() - 0.5) * EXPECTED_GOALS_VARIANCE * 2;

  // Lambda pour chaque équipe (distribution de Poisson)
  const lambdaHome = totalExpectedGoals * homeShare * 1.05; // léger boost domicile supplémentaire
  const lambdaAway = totalExpectedGoals * awayShare * 0.95;

  // Générer les buts via distribution de Poisson
  let homeGoals = poissonRandom(lambdaHome, rng);
  let awayGoals = poissonRandom(lambdaAway, rng);

  // Borner les scores entre 0 et MAX_GOALS_PER_TEAM
  homeGoals = clamp(homeGoals, 0, CL_CONSTANTS.MAX_GOALS_PER_TEAM);
  awayGoals = clamp(awayGoals, 0, CL_CONSTANTS.MAX_GOALS_PER_TEAM);

  return {
    matchday: 0, // Sera défini par l'appelant
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeGoals,
    awayGoals,
    phase: 'league', // Sera défini par l'appelant
  };
}

/**
 * Simule une prolongation et éventuellement des tirs au but.
 * Utilisé quand un match aller-retour est à égalité au score cumulé.
 *
 * Prolongation : chaque équipe peut marquer 0-2 buts (Poisson avec lambda faible).
 * Si toujours à égalité après prolongation : tirs au but (50/50 ajusté par rating).
 */
export function simulateExtraTimeAndPenalties(
  aggregateHome: number,
  aggregateAway: number,
  homeTeam: CLParticipant,
  awayTeam: CLParticipant,
  rng: RNG = defaultRNG
): { winnerIsHome: boolean; extraTimeGoals: [number, number]; penalties?: [number, number] } {
  // Simuler la prolongation
  const homeStrength = homeTeam.averageRating;
  const awayStrength = awayTeam.averageRating;
  const totalStrength = homeStrength + awayStrength;

  // Lambda ajusté par la force relative (prolongation = peu de buts)
  const homeLambda = EXTRA_TIME_LAMBDA * (homeStrength / totalStrength) * 2;
  const awayLambda = EXTRA_TIME_LAMBDA * (awayStrength / totalStrength) * 2;

  let extraHomeGoals = poissonRandom(homeLambda, rng);
  let extraAwayGoals = poissonRandom(awayLambda, rng);

  // Borner les buts de prolongation
  extraHomeGoals = clamp(extraHomeGoals, 0, MAX_EXTRA_TIME_GOALS);
  extraAwayGoals = clamp(extraAwayGoals, 0, MAX_EXTRA_TIME_GOALS);

  const extraTimeGoals: [number, number] = [extraHomeGoals, extraAwayGoals];

  // Vérifier si la prolongation a départagé les équipes
  const newAggregateHome = aggregateHome + extraHomeGoals;
  const newAggregateAway = aggregateAway + extraAwayGoals;

  if (newAggregateHome !== newAggregateAway) {
    return {
      winnerIsHome: newAggregateHome > newAggregateAway,
      extraTimeGoals,
    };
  }

  // Tirs au but : 50/50 ajusté par la différence de rating
  // Un écart de 10 points de rating donne ~60/40
  const ratingDiff = homeStrength - awayStrength;
  const homeWinProbability = clamp(0.5 + ratingDiff / 100, 0.3, 0.7);

  const homeWinsPenalties = rng.random() < homeWinProbability;

  // Générer un score de tirs au but réaliste (entre 3-5 pour le gagnant, 1-4 pour le perdant)
  const winnerScore = rng.randomInt(4, 5);
  const loserScore = rng.randomInt(2, winnerScore - 1);

  const penalties: [number, number] = homeWinsPenalties
    ? [winnerScore, loserScore]
    : [loserScore, winnerScore];

  return {
    winnerIsHome: homeWinsPenalties,
    extraTimeGoals,
    penalties,
  };
}

/** Objet exporté regroupant les fonctions du simulateur CL */
export const CLMatchSimulator: ICLMatchSimulator = {
  simulateMatch,
  simulateExtraTimeAndPenalties,
};
