/**
 * StandingsCalculator — Calcule et trie les classements de championnat.
 *
 * Règles de tri :
 * 1. Points (décroissant)
 * 2. Différence de buts (décroissant)
 * 3. Buts marqués (décroissant)
 * 4. Nom du club (alphabétique, pour stabilité)
 *
 * Points : 3 pour une victoire, 1 pour un nul, 0 pour une défaite.
 */

import type { Club, LeagueStanding, MatchResult } from '../../core/types';

export interface IStandingsCalculator {
  calculateFromResults(results: MatchResult[], clubs: Club[]): LeagueStanding[];
  sortStandings(standings: LeagueStanding[]): LeagueStanding[];
  getPosition(clubId: string, standings: LeagueStanding[]): number;
}

/**
 * Calculates league standings from a list of match results and clubs.
 * Each club starts with zeroed stats, then results are accumulated.
 * The returned standings are sorted according to league rules.
 */
export function calculateFromResults(results: MatchResult[], clubs: Club[]): LeagueStanding[] {
  // Initialize standings map for all clubs
  const standingsMap = new Map<string, LeagueStanding>();

  for (const club of clubs) {
    standingsMap.set(club.id, {
      clubId: club.id,
      clubName: club.name,
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

  // Accumulate results
  for (const result of results) {
    const home = standingsMap.get(result.homeTeamId);
    const away = standingsMap.get(result.awayTeamId);

    if (home) {
      home.played += 1;
      home.goalsFor += result.homeGoals;
      home.goalsAgainst += result.awayGoals;

      if (result.homeGoals > result.awayGoals) {
        home.won += 1;
        home.points += 3;
      } else if (result.homeGoals === result.awayGoals) {
        home.drawn += 1;
        home.points += 1;
      } else {
        home.lost += 1;
      }
    }

    if (away) {
      away.played += 1;
      away.goalsFor += result.awayGoals;
      away.goalsAgainst += result.homeGoals;

      if (result.awayGoals > result.homeGoals) {
        away.won += 1;
        away.points += 3;
      } else if (result.awayGoals === result.homeGoals) {
        away.drawn += 1;
        away.points += 1;
      } else {
        away.lost += 1;
      }
    }
  }

  // Convert to array and sort
  const standings = Array.from(standingsMap.values());
  return sortStandings(standings);
}

/**
 * Sorts standings according to league rules:
 * 1. Points descending
 * 2. Goal difference descending
 * 3. Goals for descending
 * 4. Club name alphabetical (for stability)
 *
 * After sorting, assigns position numbers (1-based).
 */
export function sortStandings(standings: LeagueStanding[]): LeagueStanding[] {
  const sorted = [...standings].sort((a, b) => {
    // 1. Points descending
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    // 2. Goal difference descending
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) {
      return gdB - gdA;
    }

    // 3. Goals for descending
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }

    // 4. Club name alphabetical (ascending) for stability
    return a.clubName.localeCompare(b.clubName);
  });

  // Assign positions (1-based)
  return sorted.map((standing, index) => ({
    ...standing,
    position: index + 1,
  }));
}

/**
 * Returns the 1-based position of a club in the standings.
 * Returns -1 if the club is not found.
 */
export function getPosition(clubId: string, standings: LeagueStanding[]): number {
  const sorted = sortStandings(standings);
  const index = sorted.findIndex((s) => s.clubId === clubId);
  return index === -1 ? -1 : sorted[index].position;
}

export const StandingsCalculator: IStandingsCalculator = {
  calculateFromResults,
  sortStandings,
  getPosition,
};
