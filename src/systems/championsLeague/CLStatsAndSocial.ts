/**
 * CLStatsAndSocial - Intégration des systèmes Stats, Social et Instagram
 * pour la Ligue des Champions.
 *
 * Ce module étend les systèmes existants pour :
 * - Enregistrer les performances CL dans les stats de carrière (Requirement 6.1)
 * - Maintenir un compteur de buts CL séparé (Requirement 6.5)
 * - Générer des posts sociaux après un match CL (Requirement 6.2)
 * - Appliquer le multiplicateur de prestige ×2 pour les gains Instagram (Requirements 6.3, 6.4)
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import type { MatchPerformance, PlayerCareerStats, PlayerSeasonStats, SocialPost, GameDate } from '../../core/types';
import { CL_CONSTANTS } from './types';
import { type RNG, defaultRNG } from '../../utils/random';

// ─── Stats CL ────────────────────────────────────────────────────────────────

/**
 * Met à jour les stats de carrière du joueur après un match de Ligue des Champions.
 * Enregistre la performance dans les stats de saison et all-time,
 * et incrémente le compteur de buts CL séparé.
 *
 * @param currentStats - Les stats de carrière actuelles du joueur
 * @param performance - La performance du joueur dans le match CL
 * @returns Les stats de carrière mises à jour
 */
export function recordCLPerformance(
  currentStats: PlayerCareerStats,
  performance: MatchPerformance
): PlayerCareerStats {
  const updatedSeason = addPerformanceToStats(currentStats.season, performance);
  const updatedAllTime = addPerformanceToStats(currentStats.allTime, performance);
  const updatedCLGoals = (currentStats.clGoals ?? 0) + performance.goals;

  return {
    season: updatedSeason,
    allTime: updatedAllTime,
    clGoals: updatedCLGoals,
  };
}

/**
 * Ajoute une performance de match aux stats d'une période (saison ou all-time).
 */
function addPerformanceToStats(
  stats: PlayerSeasonStats,
  performance: MatchPerformance
): PlayerSeasonStats {
  const newMatchesPlayed = stats.matchesPlayed + 1;
  const newTotalRating = stats.totalRating + performance.rating;

  return {
    matchesPlayed: newMatchesPlayed,
    goals: stats.goals + performance.goals,
    assists: stats.assists + performance.assists,
    shots: stats.shots + performance.shots,
    dribbles: stats.dribbles + performance.dribbles,
    tackles: stats.tackles + performance.tackles,
    avgRating: Math.round((newTotalRating / newMatchesPlayed) * 10) / 10,
    totalRating: newTotalRating,
    cleanSheets: stats.cleanSheets,
  };
}

// ─── Social CL ───────────────────────────────────────────────────────────────

const CL_FAN_POSITIVE_TEMPLATES = [
  'Soirée européenne magique ! ⭐',
  'La Ligue des Champions, c\'est un autre niveau ! 🏆',
  'Performance de classe mondiale ce soir !',
  'Il brille sur la scène européenne ! 🌟',
  'Quel match en Champions League ! 💫',
];

const CL_FAN_NEGATIVE_TEMPLATES = [
  'Soirée compliquée en Ligue des Champions...',
  'Le niveau européen est impitoyable.',
  'Pas à la hauteur de l\'événement ce soir. 😞',
  'La Champions League ne pardonne pas.',
];

const CL_JOURNALIST_TEMPLATES = [
  'Performance remarquée en Ligue des Champions. Les grands clubs observent.',
  'Une prestation européenne qui confirme son statut international.',
  'La scène de la Champions League lui réussit parfaitement.',
  'Analyse : un joueur taillé pour les grandes soirées européennes.',
];

/**
 * Génère des posts de réseau social après un match de Ligue des Champions.
 * Les posts sont spécifiques au contexte CL (contenu européen/prestige).
 *
 * @param performance - La performance du joueur dans le match CL
 * @param playerName - Le nom complet du joueur
 * @param currentDate - La date actuelle du jeu
 * @param rng - Générateur aléatoire optionnel
 * @returns Un tableau de posts sociaux générés
 */
export function generateCLMatchPosts(
  performance: MatchPerformance,
  playerName: string,
  currentDate: GameDate,
  rng: RNG = defaultRNG
): SocialPost[] {
  const posts: SocialPost[] = [];
  const numPosts = rng.randomInt(1, 4); // Slightly more posts for CL (more visibility)

  for (let i = 0; i < numPosts; i++) {
    const isPositive = performance.rating >= 6;
    const templates = isPositive ? CL_FAN_POSITIVE_TEMPLATES : CL_FAN_NEGATIVE_TEMPLATES;

    posts.push({
      id: `post-cl-${Date.now()}-${rng.randomInt(0, 9999)}`,
      author: `Fan_${rng.randomInt(1, 999)}`,
      authorType: 'fan',
      content: rng.randomChoice(templates),
      timestamp: currentDate,
      likes: rng.randomInt(50, isPositive ? 2000 : 400), // Higher engagement for CL
      sentiment: isPositive ? 'positive' : 'negative',
    });
  }

  // Journalist post for notable CL performances (lower threshold than league)
  if (performance.rating >= 7.5 || performance.goals >= 1) {
    posts.push({
      id: `post-cl-journalist-${Date.now()}-${rng.randomInt(0, 9999)}`,
      author: rng.randomChoice(['L\'Équipe', 'Marca', 'Sky Sports', 'Gazzetta', 'UEFA.com']),
      authorType: 'journalist',
      content: rng.randomChoice(CL_JOURNALIST_TEMPLATES),
      timestamp: currentDate,
      likes: rng.randomInt(500, 5000),
      sentiment: 'positive',
    });
  }

  return posts;
}

// ─── Instagram CL ────────────────────────────────────────────────────────────

/**
 * Calcule le gain de base d'abonnés Instagram pour une performance de match.
 * Cette fonction retourne le gain AVANT application du multiplicateur de compétition.
 *
 * @param performance - La performance du joueur
 * @param clubTier - Le tier du club du joueur ('small' | 'medium' | 'big')
 * @param rng - Générateur aléatoire optionnel
 * @returns Le gain de base d'abonnés
 */
export function calculateBaseFollowersGain(
  performance: MatchPerformance,
  clubTier: 'small' | 'medium' | 'big',
  rng: RNG = defaultRNG
): number {
  let followersGain = 10 + rng.randomInt(0, 20); // base 10-30 per match
  followersGain += performance.goals * 50;       // +50 per goal
  followersGain += performance.assists * 25;     // +25 per assist
  if (performance.rating >= 8) followersGain += 100; // great performance bonus
  if (performance.rating >= 9) followersGain += 200; // exceptional bonus

  // Club tier bonus
  if (clubTier === 'big') followersGain *= 3;
  else if (clubTier === 'medium') followersGain *= 1.5;

  return Math.round(followersGain);
}

/**
 * Calcule le gain d'abonnés Instagram pour un match de Ligue des Champions.
 * Applique le multiplicateur de prestige CL (CL_CONSTANTS.INSTAGRAM_MULTIPLIER = 2).
 *
 * @param performance - La performance du joueur
 * @param clubTier - Le tier du club du joueur
 * @param rng - Générateur aléatoire optionnel
 * @returns Le gain d'abonnés avec multiplicateur CL appliqué
 */
export function calculateCLFollowersGain(
  performance: MatchPerformance,
  clubTier: 'small' | 'medium' | 'big',
  rng: RNG = defaultRNG
): number {
  const baseGain = calculateBaseFollowersGain(performance, clubTier, rng);
  return baseGain * CL_CONSTANTS.INSTAGRAM_MULTIPLIER;
}

// ─── Export ──────────────────────────────────────────────────────────────────

export const CLStatsAndSocial = {
  recordCLPerformance,
  generateCLMatchPosts,
  calculateBaseFollowersGain,
  calculateCLFollowersGain,
};
