/**
 * PromotionEngine - Gère le championnat, le classement, les promotions et relégations.
 */

import type { LeagueState, LeagueStanding, MatchResult, Division, Country } from '../../core/types';

/**
 * Configuration des divisions par pays.
 */
export const DIVISION_CONFIG: Record<Country, { levels: number; promotionSlots: number; relegationSlots: number }> = {
  france: { levels: 2, promotionSlots: 3, relegationSlots: 3 },
  spain: { levels: 2, promotionSlots: 3, relegationSlots: 3 },
  england: { levels: 2, promotionSlots: 3, relegationSlots: 3 },
  italy: { levels: 2, promotionSlots: 3, relegationSlots: 3 },
  germany: { levels: 2, promotionSlots: 3, relegationSlots: 3 },
};

/**
 * Met à jour le classement après un résultat de match.
 */
export function updateStandings(standings: LeagueStanding[], result: MatchResult): LeagueStanding[] {
  const newStandings = standings.map(s => ({ ...s }));

  const home = newStandings.find(s => s.clubId === result.homeTeamId);
  const away = newStandings.find(s => s.clubId === result.awayTeamId);

  if (!home || !away) return newStandings;

  // Update matches played
  home.played++;
  away.played++;

  // Update goals
  home.goalsFor += result.homeGoals;
  home.goalsAgainst += result.awayGoals;
  away.goalsFor += result.awayGoals;
  away.goalsAgainst += result.homeGoals;

  // Update W/D/L and points
  if (result.homeGoals > result.awayGoals) {
    home.won++;
    home.points += 3;
    away.lost++;
  } else if (result.homeGoals < result.awayGoals) {
    away.won++;
    away.points += 3;
    home.lost++;
  } else {
    home.drawn++;
    away.drawn++;
    home.points += 1;
    away.points += 1;
  }

  // Sort standings
  return sortStandings(newStandings);
}

/**
 * Trie le classement par : points, différence de buts, buts marqués.
 */
export function sortStandings(standings: LeagueStanding[]): LeagueStanding[] {
  const sorted = [...standings].sort((a, b) => {
    // Points (descending)
    if (b.points !== a.points) return b.points - a.points;
    // Goal difference (descending)
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    // Goals scored (descending)
    return b.goalsFor - a.goalsFor;
  });

  // Update positions
  return sorted.map((s, i) => ({ ...s, position: i + 1 }));
}

/**
 * Détermine les clubs promus et relégués en fin de saison.
 */
export function getPromotionsAndRelegations(
  standings: LeagueStanding[],
  country: Country
): { promoted: string[]; relegated: string[] } {
  const config = DIVISION_CONFIG[country];
  const sorted = sortStandings(standings);

  const promoted = sorted
    .slice(0, config.promotionSlots)
    .map(s => s.clubId);

  const relegated = sorted
    .slice(-config.relegationSlots)
    .map(s => s.clubId);

  return { promoted, relegated };
}

/**
 * Crée un classement initial vide pour une liste de clubs.
 */
export function createInitialStandings(clubs: { id: string; name: string }[]): LeagueStanding[] {
  return clubs.map((club, index) => ({
    clubId: club.id,
    clubName: club.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    position: index + 1,
  }));
}

export const PromotionEngine = {
  updateStandings,
  sortStandings,
  getPromotionsAndRelegations,
  createInitialStandings,
};
