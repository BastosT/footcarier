/**
 * Module de qualification pour la Ligue des Champions.
 * Extrait les 4 premières équipes de chaque ligue (5 ligues × 4 = 20 qualifiés),
 * génère 30 équipes filler, et retourne les 50 participants combinés.
 *
 * Requirements: 1.1, 1.2, 1.4, 1.5
 */

import type { LeagueState, LeagueStanding } from '../../core/types';
import type { CLParticipant } from './types';
import { CL_CONSTANTS } from './types';
import { FillerTeamGenerator } from './FillerTeamGenerator';
import { type RNG, defaultRNG } from '../../utils/random';
import { allClubs } from '../../data/clubs/index';

/**
 * Détermine les 50 participants à la Ligue des Champions pour une saison donnée.
 *
 * - Extrait les 4 premières équipes de chaque ligue (20 qualifiés)
 * - Génère 30 équipes filler via FillerTeamGenerator
 * - Retourne les 50 participants combinés
 *
 * @param leagues - Les états des 5 ligues avec leurs classements finaux
 * @param season - La saison pour laquelle on qualifie
 * @param rng - Générateur aléatoire optionnel pour la reproductibilité
 * @returns Les 50 participants à la Ligue des Champions
 */
export function qualify(
  leagues: LeagueState[],
  season: number,
  rng: RNG = defaultRNG
): CLParticipant[] {
  const qualified = extractQualifiedTeams(leagues);
  const fillers = FillerTeamGenerator.generate(rng);
  return [...qualified, ...fillers];
}

/**
 * Extrait les 4 premières équipes de chaque ligue pour la qualification CL.
 * Les équipes sont triées par position dans le classement.
 *
 * @param leagues - Les états des ligues avec classements finaux
 * @returns Les 20 équipes qualifiées (4 par ligue × 5 ligues)
 */
export function extractQualifiedTeams(leagues: LeagueState[]): CLParticipant[] {
  const qualified: CLParticipant[] = [];

  for (const league of leagues) {
    // Trier les standings par position (au cas où ils ne seraient pas déjà triés)
    const sortedStandings = [...league.standings].sort(
      (a, b) => a.position - b.position
    );

    // Prendre les 4 premières équipes
    const topTeams = sortedStandings.slice(0, CL_CONSTANTS.QUALIFIED_PER_LEAGUE);

    for (const standing of topTeams) {
      const averageRating = computeClubAverageRating(standing.clubId);

      qualified.push({
        id: `cl-qualified-${league.division.country}-${standing.position}`,
        name: standing.clubName,
        country: league.division.country,
        averageRating,
        isFiller: false,
        clubId: standing.clubId,
      });
    }
  }

  return qualified;
}

/**
 * Détermine si le club du joueur est qualifié pour la Ligue des Champions.
 * Le club est qualifié si sa position finale dans le classement est ≤ 4.
 *
 * @param leagues - Les états des ligues
 * @param playerClubId - L'identifiant du club du joueur
 * @returns true si le club du joueur est qualifié (position ≤ 4)
 */
export function isPlayerClubQualified(
  leagues: LeagueState[],
  playerClubId: string
): boolean {
  for (const league of leagues) {
    const standing = league.standings.find((s) => s.clubId === playerClubId);
    if (standing) {
      return standing.position <= CL_CONSTANTS.QUALIFIED_PER_LEAGUE;
    }
  }
  return false;
}

/**
 * Calcule la note moyenne de l'effectif d'un club à partir des données statiques.
 * Si le club n'est pas trouvé dans les données, retourne une note par défaut de 72.
 *
 * @param clubId - L'identifiant du club
 * @returns La note moyenne de l'effectif
 */
function computeClubAverageRating(clubId: string): number {
  const club = allClubs.find((c) => c.id === clubId);
  if (!club || club.squad.length === 0) {
    return 72; // Note par défaut si le club n'est pas trouvé
  }

  const totalRating = club.squad.reduce(
    (sum, player) => sum + player.overallRating,
    0
  );
  return Math.round(totalRating / club.squad.length);
}
