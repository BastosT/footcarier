/**
 * TrophySystem - Gère l'attribution de trophées collectifs et individuels.
 */

import type { Trophy, TrophyType, LeagueState, MatchResult } from '../../core/types';
import { type RNG, defaultRNG } from '../../utils/random';

/**
 * Vérifie si le club du joueur a gagné le championnat.
 */
export function checkLeagueChampion(
  leagueState: LeagueState,
  playerClubId: string,
  season: number
): Trophy | null {
  if (leagueState.standings.length === 0) return null;

  const champion = leagueState.standings[0];
  if (champion.clubId !== playerClubId) return null;

  return {
    id: `trophy-league-${season}`,
    type: 'league',
    season,
    competition: leagueState.division.name,
  };
}

/**
 * Vérifie si le joueur est meilleur buteur de la saison.
 */
export function checkTopScorer(
  results: MatchResult[],
  playerClubId: string,
  season: number,
  competitionName: string
): Trophy | null {
  // Count player goals from match performances
  let playerGoals = 0;
  for (const result of results) {
    if (result.playerPerformance) {
      playerGoals += result.playerPerformance.goals;
    }
  }

  // Simple heuristic: if player scored 15+ goals, they're likely top scorer
  if (playerGoals >= 15) {
    return {
      id: `trophy-scorer-${season}`,
      type: 'top_scorer',
      season,
      competition: competitionName,
    };
  }

  return null;
}

/**
 * Vérifie si le joueur est meilleur joueur de la saison.
 * Basé sur la note moyenne.
 */
export function checkBestPlayer(
  results: MatchResult[],
  season: number,
  competitionName: string
): Trophy | null {
  const ratings: number[] = [];
  for (const result of results) {
    if (result.playerPerformance) {
      ratings.push(result.playerPerformance.rating);
    }
  }

  if (ratings.length === 0) return null;

  const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

  // Average rating > 7.5 = best player
  if (avgRating >= 7.5) {
    return {
      id: `trophy-best-${season}`,
      type: 'best_player',
      season,
      competition: competitionName,
    };
  }

  return null;
}

/**
 * Évalue tous les trophées possibles en fin de saison.
 */
export function evaluateEndOfSeasonTrophies(
  leagueState: LeagueState,
  playerClubId: string,
  season: number
): Trophy[] {
  const trophies: Trophy[] = [];

  const league = checkLeagueChampion(leagueState, playerClubId, season);
  if (league) trophies.push(league);

  const scorer = checkTopScorer(leagueState.results, playerClubId, season, leagueState.division.name);
  if (scorer) trophies.push(scorer);

  const best = checkBestPlayer(leagueState.results, season, leagueState.division.name);
  if (best) trophies.push(best);

  return trophies;
}

/**
 * Calcule le bonus de popularité pour un trophée obtenu.
 */
export function getTrophyPopularityBonus(type: TrophyType): number {
  switch (type) {
    case 'league': return 15;
    case 'cup': return 10;
    case 'top_scorer': return 12;
    case 'best_player': return 15;
    case 'golden_boot': return 20;
  }
}

export const TrophySystem = {
  checkLeagueChampion,
  checkTopScorer,
  checkBestPlayer,
  evaluateEndOfSeasonTrophies,
  getTrophyPopularityBonus,
};
