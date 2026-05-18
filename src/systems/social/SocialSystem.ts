/**
 * SocialSystem - Gère la popularité, réputation, relations et interactions sociales.
 * Inclut le système de moral d'équipe (teamMorale).
 */

import type { SocialState, MatchPerformance, InterviewAnswer, SocialPost, GameDate } from '../../core/types';
import { clamp } from '../../utils/math';
import { defaultRNG, type RNG } from '../../utils/random';

/** Match result type for morale updates */
export type MatchOutcome = 'win' | 'loss' | 'draw';

export interface SocialScoreUpdate {
  popularity?: number;
  reputation?: number;
  coachRelation?: number;
  teamRelation?: number;
}

/**
 * Applique des modifications aux scores sociaux en respectant les bornes [0, 100].
 */
export function updateSocialScores(state: SocialState, update: SocialScoreUpdate): SocialState {
  return {
    ...state,
    popularity: clamp(state.popularity + (update.popularity ?? 0), 0, 100),
    reputation: clamp(state.reputation + (update.reputation ?? 0), 0, 100),
    coachRelation: clamp(state.coachRelation + (update.coachRelation ?? 0), 0, 100),
    teamRelation: clamp(state.teamRelation + (update.teamRelation ?? 0), 0, 100),
  };
}

/**
 * Met à jour la popularité en fonction de la performance en match.
 * Note > 8 → augmente, Note < 4 → diminue.
 */
export function updatePopularityFromPerformance(
  state: SocialState,
  performance: MatchPerformance
): SocialState {
  let popularityChange = 0;

  if (performance.rating > 8) {
    popularityChange = Math.round((performance.rating - 8) * 3);
  } else if (performance.rating < 4) {
    popularityChange = -Math.round((4 - performance.rating) * 3);
  }

  return updateSocialScores(state, { popularity: popularityChange });
}

/**
 * Traite la réponse à une interview et applique les impacts.
 */
export function processInterviewAnswer(
  state: SocialState,
  answer: InterviewAnswer,
  currentDate: GameDate,
  rng: RNG = defaultRNG
): SocialState {
  let newState = updateSocialScores(state, answer.impacts);

  // Si réponse controversée, générer un post négatif
  if (answer.tone === 'controversial') {
    const negativePost: SocialPost = {
      id: `post-${Date.now()}-${rng.randomInt(0, 9999)}`,
      author: rng.randomChoice(['JournalSport', 'FanClub_Officiel', 'AnalysteFootball']),
      authorType: 'journalist',
      content: `Déclaration controversée du joueur qui fait réagir...`,
      timestamp: currentDate,
      likes: rng.randomInt(50, 500),
      sentiment: 'negative',
    };

    newState = {
      ...newState,
      socialFeed: [negativePost, ...newState.socialFeed].slice(0, 50),
    };
  }

  return newState;
}

/**
 * Crée un état social initial.
 */
export function createInitialSocialState(): SocialState {
  return {
    popularity: 20,
    reputation: 20,
    coachRelation: 50,
    teamRelation: 50,
    teamMorale: 50,
    teamAmbiance: 50,
    controversyCount: 0,
    scandalActive: false,
    socialFeed: [],
    pendingInterviews: [],
  };
}

// ─── Team Morale System ──────────────────────────────────────────────────────

/**
 * Met à jour le moral d'équipe en fonction du résultat d'un match.
 * - Victoire : +3 à +8
 * - Défaite : -3 à -8
 * - Nul : -2 à +2
 * Le moral est toujours borné entre [0, 100].
 */
export function updateTeamMorale(
  state: SocialState,
  outcome: MatchOutcome,
  rng: RNG = defaultRNG
): SocialState {
  let moraleChange: number;

  switch (outcome) {
    case 'win':
      moraleChange = rng.randomInt(3, 8);
      break;
    case 'loss':
      moraleChange = -rng.randomInt(3, 8);
      break;
    case 'draw':
      moraleChange = rng.randomInt(-2, 2);
      break;
  }

  const currentMorale = state.teamMorale ?? 50;
  const newMorale = clamp(currentMorale + moraleChange, 0, 100);

  return {
    ...state,
    teamMorale: newMorale,
  };
}

/**
 * Applique l'influence de la relation avec l'entraîneur sur le moral d'équipe.
 * Formule : teamMorale += (coachRelation - 50) * 0.05 par jour.
 * - Si coachRelation > 50 : influence positive
 * - Si coachRelation < 50 : influence négative
 * - Si coachRelation = 50 : pas d'influence
 * Le moral est toujours borné entre [0, 100].
 */
export function applyCoachInfluenceOnMorale(state: SocialState): SocialState {
  const currentMorale = state.teamMorale ?? 50;
  const coachInfluence = (state.coachRelation - 50) * 0.05;
  const newMorale = clamp(currentMorale + coachInfluence, 0, 100);

  return {
    ...state,
    teamMorale: newMorale,
  };
}

export const SocialSystem = {
  updateSocialScores,
  updatePopularityFromPerformance,
  processInterviewAnswer,
  createInitialSocialState,
  updateTeamMorale,
  applyCoachInfluenceOnMorale,
};
