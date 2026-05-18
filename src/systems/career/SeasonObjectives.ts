/**
 * SeasonObjectives — Objectifs fixés par le coach en début de saison.
 * Basés sur le niveau du joueur et le tier du club.
 */

import type { SeasonObjective, SeasonObjectivesState, ClubTier } from '../../core/types';
import { type RNG, defaultRNG } from '../../utils/random';

/**
 * Génère les objectifs de saison basés sur le niveau du joueur.
 */
export function generateSeasonObjectives(
  overallRating: number,
  clubTier: ClubTier,
  rng: RNG = defaultRNG
): SeasonObjectivesState {
  const objectives: SeasonObjective[] = [];

  // Goal objective — scaled by rating
  const goalTarget = overallRating >= 80 ? rng.randomInt(12, 20)
    : overallRating >= 70 ? rng.randomInt(8, 14)
    : overallRating >= 60 ? rng.randomInt(5, 10)
    : rng.randomInt(3, 6);

  const goalReward = goalTarget * (clubTier === 'big' ? 5000 : clubTier === 'medium' ? 3000 : 1500);

  objectives.push({
    id: 'obj-goals',
    description: `Marquer ${goalTarget} buts en championnat`,
    type: 'goals',
    target: goalTarget,
    reward: goalReward,
    completed: false,
  });

  // Assist objective
  const assistTarget = overallRating >= 75 ? rng.randomInt(6, 12)
    : overallRating >= 65 ? rng.randomInt(4, 8)
    : rng.randomInt(2, 5);

  const assistReward = assistTarget * (clubTier === 'big' ? 4000 : clubTier === 'medium' ? 2500 : 1200);

  objectives.push({
    id: 'obj-assists',
    description: `Délivrer ${assistTarget} passes décisives`,
    type: 'assists',
    target: assistTarget,
    reward: assistReward,
    completed: false,
  });

  // Rating objective
  const ratingTarget = overallRating >= 80 ? 7.5
    : overallRating >= 70 ? 7.0
    : overallRating >= 60 ? 6.5
    : 6.0;

  const ratingReward = clubTier === 'big' ? 50000 : clubTier === 'medium' ? 30000 : 15000;

  objectives.push({
    id: 'obj-rating',
    description: `Maintenir une note moyenne de ${ratingTarget}+`,
    type: 'rating',
    target: ratingTarget,
    reward: ratingReward,
    completed: false,
  });

  // Matches played objective
  const matchTarget = rng.randomInt(25, 32);
  const matchReward = clubTier === 'big' ? 20000 : clubTier === 'medium' ? 12000 : 8000;

  objectives.push({
    id: 'obj-matches',
    description: `Jouer au moins ${matchTarget} matchs`,
    type: 'matches',
    target: matchTarget,
    reward: matchReward,
    completed: false,
  });

  return { objectives, bonusEarned: 0 };
}

/**
 * Vérifie les objectifs et marque ceux qui sont complétés.
 */
export function checkObjectives(
  state: SeasonObjectivesState,
  goals: number,
  assists: number,
  avgRating: number,
  matchesPlayed: number
): SeasonObjectivesState {
  const updated = state.objectives.map((obj) => {
    if (obj.completed) return obj;

    let achieved = false;
    switch (obj.type) {
      case 'goals': achieved = goals >= obj.target; break;
      case 'assists': achieved = assists >= obj.target; break;
      case 'rating': achieved = avgRating >= obj.target; break;
      case 'matches': achieved = matchesPlayed >= obj.target; break;
    }

    return achieved ? { ...obj, completed: true } : obj;
  });

  const newBonusEarned = updated
    .filter((o) => o.completed)
    .reduce((sum, o) => sum + o.reward, 0);

  return { objectives: updated, bonusEarned: newBonusEarned };
}

export const SeasonObjectivesSystem = {
  generateSeasonObjectives,
  checkObjectives,
};
