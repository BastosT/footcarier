/**
 * knockout.ts - Gestion des tours à élimination directe de la Ligue des Champions.
 * Implémente le tirage au sort des confrontations et la résolution des matchs aller-retour.
 * Gère les huitièmes (16→8), quarts (8→4), demi-finales (4→2) et la finale (match unique).
 * Résout les égalités par prolongation puis tirs au but.
 */

import type { CLParticipant, CLKnockoutTie, CLKnockoutTieResult, CLMatchResult, KnockoutRound } from './types';
import { type RNG, defaultRNG } from '../../utils/random';
import { simulateExtraTimeAndPenalties } from './CLMatchSimulator';

// ─── Draw ────────────────────────────────────────────────────────────────────

/**
 * Effectue le tirage au sort d'un tour éliminatoire.
 * Prend N équipes (16, 8, 4 ou 2) et produit N/2 confrontations.
 * Chaque équipe apparaît exactement une fois (soit à domicile, soit à l'extérieur).
 * Le tirage est aléatoire via le RNG fourni.
 *
 * @param teams - Les équipes participant au tour (16, 8, 4 ou 2)
 * @param round - Le tour éliminatoire concerné
 * @param rng - Générateur de nombres aléatoires (optionnel)
 * @returns Un tableau de CLKnockoutTie représentant les confrontations
 */
export function drawKnockoutRound(
  teams: CLParticipant[],
  round: KnockoutRound,
  rng: RNG = defaultRNG
): CLKnockoutTie[] {
  if (teams.length < 2 || teams.length % 2 !== 0) {
    throw new Error(`Invalid number of teams for knockout draw: ${teams.length}. Must be even and >= 2.`);
  }

  // Mélanger les équipes aléatoirement (Fisher-Yates shuffle)
  const shuffled = [...teams];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.randomInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Former les paires : les équipes consécutives forment une confrontation
  const ties: CLKnockoutTie[] = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    ties.push({
      homeTeam: shuffled[i],
      awayTeam: shuffled[i + 1],
    });
  }

  return ties;
}

// ─── Resolve ─────────────────────────────────────────────────────────────────

/**
 * Résout une confrontation aller-retour (ou un match unique pour la finale).
 * Calcule le score cumulé sur les deux matchs.
 * Si le score cumulé est à égalité, simule une prolongation puis des tirs au but.
 *
 * Pour la finale (match unique), le secondLeg peut avoir des scores à 0-0
 * et le firstLeg représente le match de finale. Si le firstLeg est à égalité,
 * la prolongation et les tirs au but sont simulés.
 *
 * @param firstLeg - Résultat du match aller
 * @param secondLeg - Résultat du match retour (ou match vide pour la finale)
 * @param rng - Générateur de nombres aléatoires (optionnel)
 * @returns Le résultat de la confrontation avec le vainqueur et la méthode de décision
 */
export function resolveKnockoutTie(
  firstLeg: CLMatchResult,
  secondLeg: CLMatchResult,
  rng: RNG = defaultRNG
): CLKnockoutTieResult {
  // Le "home team" de la confrontation est l'équipe à domicile du match aller
  const tieHomeTeamId = firstLeg.homeTeamId;
  const tieAwayTeamId = firstLeg.awayTeamId;

  // Score cumulé : buts marqués par chaque équipe sur les deux matchs
  // Match aller : homeTeam joue à domicile → homeGoals pour homeTeam, awayGoals pour awayTeam
  // Match retour : awayTeam joue à domicile → homeGoals pour awayTeam, awayGoals pour homeTeam
  const aggregateHome = firstLeg.homeGoals + secondLeg.awayGoals;
  const aggregateAway = firstLeg.awayGoals + secondLeg.homeGoals;

  // Si un côté a un avantage clair au score cumulé
  if (aggregateHome !== aggregateAway) {
    return {
      winnerId: aggregateHome > aggregateAway ? tieHomeTeamId : tieAwayTeamId,
      aggregateHome,
      aggregateAway,
      decidedBy: 'aggregate',
    };
  }

  // Score cumulé à égalité → prolongation puis tirs au but
  // Créer des participants minimaux pour la simulation
  const homeParticipant: CLParticipant = {
    id: tieHomeTeamId,
    name: '',
    country: '',
    averageRating: 75, // Valeur par défaut si pas d'info
    isFiller: false,
  };
  const awayParticipant: CLParticipant = {
    id: tieAwayTeamId,
    name: '',
    country: '',
    averageRating: 75,
    isFiller: false,
  };

  const extraTimeResult = simulateExtraTimeAndPenalties(
    aggregateHome,
    aggregateAway,
    homeParticipant,
    awayParticipant,
    rng
  );

  if (extraTimeResult.penalties) {
    // Décidé aux tirs au but
    return {
      winnerId: extraTimeResult.winnerIsHome ? tieHomeTeamId : tieAwayTeamId,
      aggregateHome,
      aggregateAway,
      decidedBy: 'penalties',
      extraTimeGoals: extraTimeResult.extraTimeGoals,
      penaltyScore: extraTimeResult.penalties,
    };
  }

  // Décidé en prolongation
  return {
    winnerId: extraTimeResult.winnerIsHome ? tieHomeTeamId : tieAwayTeamId,
    aggregateHome,
    aggregateAway,
    decidedBy: 'extra-time',
    extraTimeGoals: extraTimeResult.extraTimeGoals,
  };
}
