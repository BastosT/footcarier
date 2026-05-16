/**
 * Module de classement et résolution de la phase de ligue de la Ligue des Champions.
 * Calcule les standings à partir des résultats de matchs, trie par points/différence de buts/buts marqués,
 * et détermine les 16 qualifiés pour les huitièmes de finale.
 *
 * Requirements: 2.4, 2.5, 2.6, 7.3
 */

import type {
  ChampionsLeagueState,
  CLMatchResult,
  CLStanding,
  CLParticipant,
} from './types';
import { CL_CONSTANTS } from './types';

/**
 * Met à jour le classement de la phase de ligue à partir de l'état actuel et des nouveaux résultats.
 * Combine les résultats existants avec les nouveaux, recalcule les statistiques de chaque participant,
 * puis trie par : points (desc), différence de buts (desc), buts marqués (desc).
 *
 * @param state - L'état actuel de la Ligue des Champions (participants + résultats existants)
 * @param results - Les nouveaux résultats de matchs à intégrer
 * @returns Le classement mis à jour et trié avec positions assignées
 */
export function updateStandings(
  state: ChampionsLeagueState,
  results: CLMatchResult[]
): CLStanding[] {
  // Combiner les résultats existants avec les nouveaux
  const allResults = [...state.leagueResults, ...results];

  // Initialiser les standings pour chaque participant
  const standingsMap = new Map<string, CLStanding>();

  for (const participant of state.participants) {
    standingsMap.set(participant.id, {
      participantId: participant.id,
      participantName: participant.name,
      country: participant.country,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      position: 0,
    });
  }

  // Calculer les statistiques à partir de tous les résultats de la phase de ligue
  for (const result of allResults) {
    if (result.phase !== 'league') continue;

    const homeStanding = standingsMap.get(result.homeTeamId);
    const awayStanding = standingsMap.get(result.awayTeamId);

    if (!homeStanding || !awayStanding) continue;

    // Mise à jour des matchs joués
    homeStanding.played += 1;
    awayStanding.played += 1;

    // Mise à jour des buts
    homeStanding.goalsFor += result.homeGoals;
    homeStanding.goalsAgainst += result.awayGoals;
    awayStanding.goalsFor += result.awayGoals;
    awayStanding.goalsAgainst += result.homeGoals;

    // Déterminer le résultat et attribuer les points
    if (result.homeGoals > result.awayGoals) {
      // Victoire domicile
      homeStanding.won += 1;
      homeStanding.points += CL_CONSTANTS.POINTS_WIN;
      awayStanding.lost += 1;
      awayStanding.points += CL_CONSTANTS.POINTS_LOSS;
    } else if (result.homeGoals < result.awayGoals) {
      // Victoire extérieur
      awayStanding.won += 1;
      awayStanding.points += CL_CONSTANTS.POINTS_WIN;
      homeStanding.lost += 1;
      homeStanding.points += CL_CONSTANTS.POINTS_LOSS;
    } else {
      // Match nul
      homeStanding.drawn += 1;
      homeStanding.points += CL_CONSTANTS.POINTS_DRAW;
      awayStanding.drawn += 1;
      awayStanding.points += CL_CONSTANTS.POINTS_DRAW;
    }
  }

  // Convertir en tableau et trier
  const standings = Array.from(standingsMap.values());
  standings.sort(compareStandings);

  // Assigner les positions (1-based)
  for (let i = 0; i < standings.length; i++) {
    standings[i].position = i + 1;
  }

  return standings;
}

/**
 * Fonction de comparaison pour le tri des standings.
 * Ordre de tri : points (desc), différence de buts (desc), buts marqués (desc).
 */
function compareStandings(a: CLStanding, b: CLStanding): number {
  // 1. Points (descendant)
  if (b.points !== a.points) {
    return b.points - a.points;
  }

  // 2. Différence de buts (descendant)
  const goalDiffA = a.goalsFor - a.goalsAgainst;
  const goalDiffB = b.goalsFor - b.goalsAgainst;
  if (goalDiffB !== goalDiffA) {
    return goalDiffB - goalDiffA;
  }

  // 3. Buts marqués (descendant)
  return b.goalsFor - a.goalsFor;
}

/**
 * Résout la phase de ligue en retournant les 16 premières équipes qualifiées
 * pour les huitièmes de finale.
 *
 * @param standings - Le classement final de la phase de ligue (trié)
 * @returns Les 16 participants qualifiés pour les huitièmes de finale
 */
export function resolveLeaguePhase(
  standings: CLStanding[],
  participants: CLParticipant[]
): CLParticipant[] {
  const top16Standings = standings.slice(0, CL_CONSTANTS.TOP_16_QUALIFY);

  // Créer un map des participants pour un accès rapide
  const participantsMap = new Map<string, CLParticipant>();
  for (const participant of participants) {
    participantsMap.set(participant.id, participant);
  }

  // Retourner les participants correspondant aux 16 premiers du classement
  const qualified: CLParticipant[] = [];
  for (const standing of top16Standings) {
    const participant = participantsMap.get(standing.participantId);
    if (participant) {
      qualified.push(participant);
    }
  }

  return qualified;
}

/**
 * Classifie une position dans le classement pour l'affichage UI.
 * Positions 1-16 : qualifié (surbrillance verte)
 * Positions 17-50 : éliminé (surbrillance rouge)
 *
 * @param position - La position dans le classement (1-based)
 * @returns 'qualified' si position ≤ 16, 'eliminated' sinon
 */
export function classifyPosition(
  position: number
): 'qualified' | 'eliminated' {
  return position <= CL_CONSTANTS.TOP_16_QUALIFY ? 'qualified' : 'eliminated';
}
