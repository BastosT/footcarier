/**
 * SocialFeedGenerator - Génère des publications fictives pour le réseau social.
 */

import type { SocialPost, GameDate, MatchPerformance } from '../../core/types';
import { type RNG, defaultRNG } from '../../utils/random';

const FAN_POSITIVE_TEMPLATES = [
  'Quel match incroyable ! 🔥',
  'Notre joueur est en feu cette saison !',
  'Meilleur joueur du match, sans discussion.',
  'Continue comme ça, on est derrière toi ! 💪',
];

const FAN_NEGATIVE_TEMPLATES = [
  'Performance décevante aujourd\'hui...',
  'Il faut se remettre en question.',
  'On attend mieux de sa part.',
  'Pas au niveau ce soir. 😤',
];

const JOURNALIST_TEMPLATES = [
  'Analyse tactique : un joueur en pleine progression.',
  'Les statistiques parlent d\'elles-mêmes cette saison.',
  'Un talent qui attire les regards des grands clubs.',
];

/**
 * Génère des posts de réseau social après un match.
 */
export function generateMatchPosts(
  performance: MatchPerformance,
  playerName: string,
  currentDate: GameDate,
  rng: RNG = defaultRNG
): SocialPost[] {
  const posts: SocialPost[] = [];
  const numPosts = rng.randomInt(1, 3);

  for (let i = 0; i < numPosts; i++) {
    const isPositive = performance.rating >= 6;
    const templates = isPositive ? FAN_POSITIVE_TEMPLATES : FAN_NEGATIVE_TEMPLATES;

    posts.push({
      id: `post-match-${Date.now()}-${rng.randomInt(0, 9999)}`,
      author: `Fan_${rng.randomInt(1, 999)}`,
      authorType: 'fan',
      content: rng.randomChoice(templates),
      timestamp: currentDate,
      likes: rng.randomInt(10, isPositive ? 1000 : 200),
      sentiment: isPositive ? 'positive' : 'negative',
    });
  }

  // Journalist post for notable performances
  if (performance.rating >= 8 || performance.goals >= 2) {
    posts.push({
      id: `post-journalist-${Date.now()}-${rng.randomInt(0, 9999)}`,
      author: rng.randomChoice(['L\'Équipe', 'Marca', 'Sky Sports', 'Gazzetta']),
      authorType: 'journalist',
      content: rng.randomChoice(JOURNALIST_TEMPLATES),
      timestamp: currentDate,
      likes: rng.randomInt(200, 2000),
      sentiment: 'positive',
    });
  }

  return posts;
}

export const SocialFeedGenerator = {
  generateMatchPosts,
};
