/**
 * AIMatchSimulator - Simule les matchs IA vs IA avec distribution de Poisson.
 * Résultats réalistes basés sur la force des clubs (tier + squad rating).
 */

import type { Club, MatchResult, ClubTier } from '../../core/types';
import { average } from '../../utils/math';
import { poissonRandom } from '../../utils/math';
import { type RNG, defaultRNG } from '../../utils/random';

const HOME_ADVANTAGE_FACTOR = 1.12;

/**
 * Returns a realistic strength rating for a club based on tier and squad.
 * Big clubs: 78-85, Medium: 68-75, Small: 58-65
 */
function getClubStrength(club: Club, rng: RNG): number {
  // If squad has ratings, use them
  if (club.squad && club.squad.length > 0) {
    const avgRating = average(club.squad.map(p => p.overallRating));
    if (avgRating > 0) return avgRating;
  }

  // Fallback: use tier-based strength with some randomness
  const tierStrength: Record<ClubTier, { base: number; variance: number }> = {
    big: { base: 82, variance: 3 },
    medium: { base: 72, variance: 4 },
    small: { base: 63, variance: 5 },
  };

  const tier = club.tier ?? 'medium';
  const config = tierStrength[tier];
  return config.base + (rng.random() - 0.5) * config.variance;
}

/**
 * Simule un match entre deux équipes IA.
 * Utilise la distribution de Poisson basée sur les forces relatives.
 * Résultats réalistes : les gros clubs gagnent plus souvent.
 */
export function simulateAIMatch(
  homeTeam: Club,
  awayTeam: Club,
  matchday: number,
  rng: RNG = defaultRNG
): MatchResult {
  const homeStrength = getClubStrength(homeTeam, rng) * HOME_ADVANTAGE_FACTOR;
  const awayStrength = getClubStrength(awayTeam, rng);

  // Convert strength to expected goals (realistic: 1.0 - 2.5 goals per team)
  // Stronger team gets higher lambda
  const totalStrength = homeStrength + awayStrength;
  const homeShare = homeStrength / totalStrength;
  const awayShare = awayStrength / totalStrength;

  // Base expected goals per match: ~2.7 total (realistic for top leagues)
  const totalExpectedGoals = 2.5 + rng.random() * 0.5;

  const lambdaHome = totalExpectedGoals * homeShare * 1.1; // slight home boost
  const lambdaAway = totalExpectedGoals * awayShare * 0.9;

  let homeGoals = poissonRandom(lambdaHome, rng);
  let awayGoals = poissonRandom(lambdaAway, rng);

  // Cap at realistic values (max 6 goals per team, very rare)
  homeGoals = Math.min(homeGoals, 6);
  awayGoals = Math.min(awayGoals, 6);

  return {
    matchday,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeGoals,
    awayGoals,
  };
}

export const AIMatchSimulator = {
  simulateAIMatch,
};
