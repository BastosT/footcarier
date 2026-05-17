/**
 * BallonDor — Système de classement Ballon d'Or et Meilleur Jeune.
 * Génère un classement de 30 joueurs basé sur les performances de la saison.
 * Le joueur est inclus s'il est dans le top 30.
 * Remise à la fin de la saison (à partir de la saison 3).
 */

import type { GameState, PlayerSeasonStats } from '../../core/types';
import { type RNG, defaultRNG } from '../../utils/random';

export interface BallonDorCandidate {
  id: string;
  name: string;
  club: string;
  country: string;
  age: number;
  goals: number;
  assists: number;
  rating: number;
  points: number; // score calculé pour le classement
  isPlayer: boolean;
}

// ─── Joueurs fictifs pour le classement ──────────────────────────────────────

const WORLD_STARS: Omit<BallonDorCandidate, 'points' | 'goals' | 'assists' | 'rating' | 'isPlayer'>[] = [
  { id: 'bdor-haaland', name: 'Erling Haaland', club: 'Manchester City', country: '🇳🇴', age: 24 },
  { id: 'bdor-mbappe', name: 'Kylian Mbappé', club: 'Real Madrid', country: '🇫🇷', age: 26 },
  { id: 'bdor-vinicius', name: 'Vinícius Jr', club: 'Real Madrid', country: '🇧🇷', age: 24 },
  { id: 'bdor-bellingham', name: 'Jude Bellingham', club: 'Real Madrid', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 21 },
  { id: 'bdor-salah', name: 'Mohamed Salah', club: 'Liverpool', country: '🇪🇬', age: 32 },
  { id: 'bdor-rodri', name: 'Rodri', club: 'Manchester City', country: '🇪🇸', age: 28 },
  { id: 'bdor-saka', name: 'Bukayo Saka', club: 'Arsenal', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 23 },
  { id: 'bdor-yamal', name: 'Lamine Yamal', club: 'FC Barcelona', country: '🇪🇸', age: 17 },
  { id: 'bdor-wirtz', name: 'Florian Wirtz', club: 'Bayer Leverkusen', country: '🇩🇪', age: 21 },
  { id: 'bdor-kane', name: 'Harry Kane', club: 'Bayern Munich', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 31 },
  { id: 'bdor-dembele', name: 'Ousmane Dembélé', club: 'PSG', country: '🇫🇷', age: 27 },
  { id: 'bdor-martinez', name: 'Lautaro Martínez', club: 'Inter Milan', country: '🇦🇷', age: 27 },
  { id: 'bdor-foden', name: 'Phil Foden', club: 'Manchester City', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 24 },
  { id: 'bdor-musiala', name: 'Jamal Musiala', club: 'Bayern Munich', country: '🇩🇪', age: 21 },
  { id: 'bdor-osimhen', name: 'Victor Osimhen', club: 'Napoli', country: '🇳🇬', age: 25 },
  { id: 'bdor-palmer', name: 'Cole Palmer', club: 'Chelsea', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 22 },
  { id: 'bdor-leao', name: 'Rafael Leão', club: 'AC Milan', country: '🇵🇹', age: 25 },
  { id: 'bdor-debruyne', name: 'Kevin De Bruyne', club: 'Manchester City', country: '🇧🇪', age: 33 },
  { id: 'bdor-kroos', name: 'Toni Kroos', club: 'Real Madrid', country: '🇩🇪', age: 34 },
  { id: 'bdor-rice', name: 'Declan Rice', club: 'Arsenal', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 25 },
  { id: 'bdor-hakimi', name: 'Achraf Hakimi', club: 'PSG', country: '🇲🇦', age: 26 },
  { id: 'bdor-gvardiol', name: 'Joško Gvardiol', club: 'Manchester City', country: '🇭🇷', age: 22 },
  { id: 'bdor-pedri', name: 'Pedri', club: 'FC Barcelona', country: '🇪🇸', age: 21 },
  { id: 'bdor-valverde', name: 'Federico Valverde', club: 'Real Madrid', country: '🇺🇾', age: 26 },
  { id: 'bdor-diaz', name: 'Luis Díaz', club: 'Liverpool', country: '🇨🇴', age: 27 },
  { id: 'bdor-watkins', name: 'Ollie Watkins', club: 'Aston Villa', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 28 },
  { id: 'bdor-barcola', name: 'Bradley Barcola', club: 'PSG', country: '🇫🇷', age: 22 },
  { id: 'bdor-szoboszlai', name: 'Dominik Szoboszlai', club: 'Liverpool', country: '🇭🇺', age: 24 },
  { id: 'bdor-nkunku', name: 'Christopher Nkunku', club: 'Chelsea', country: '🇫🇷', age: 27 },
  { id: 'bdor-olmo', name: 'Dani Olmo', club: 'FC Barcelona', country: '🇪🇸', age: 26 },
  { id: 'bdor-gyokeres', name: 'Viktor Gyökeres', club: 'Sporting CP', country: '🇸🇪', age: 26 },
  { id: 'bdor-williams', name: 'Nico Williams', club: 'Athletic Bilbao', country: '🇪🇸', age: 22 },
  { id: 'bdor-mainoo', name: 'Kobbie Mainoo', club: 'Manchester United', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', age: 19 },
  { id: 'bdor-zaire', name: 'Warren Zaïre-Emery', club: 'PSG', country: '🇫🇷', age: 18 },
];

/**
 * Génère le classement du Ballon d'Or pour la saison.
 * Inclut le joueur s'il est dans le top 30.
 */
export function generateBallonDorRanking(
  state: GameState,
  rng: RNG = defaultRNG
): BallonDorCandidate[] {
  const playerStats = state.playerCareerStats?.season ?? {
    matchesPlayed: 0, goals: 0, assists: 0, avgRating: 0, totalRating: 0,
  } as PlayerSeasonStats;

  const playerAge = state.player.age;
  const playerAvgRating = playerStats.matchesPlayed > 0
    ? playerStats.totalRating / playerStats.matchesPlayed
    : 0;

  // Generate random stats for AI candidates
  const aiCandidates: BallonDorCandidate[] = WORLD_STARS.map((star) => {
    const goals = rng.randomInt(8, 35);
    const assists = rng.randomInt(3, 18);
    const rating = 7.0 + rng.randomFloat(0, 1.5);
    // Points formula: goals * 3 + assists * 2 + rating * 10
    const points = goals * 3 + assists * 2 + Math.round(rating * 10);

    return {
      ...star,
      goals,
      assists,
      rating: Math.round(rating * 10) / 10,
      points,
      isPlayer: false,
    };
  });

  // Calculate player's points
  const playerPoints = playerStats.goals * 3 + playerStats.assists * 2 + Math.round(playerAvgRating * 10);

  const playerCandidate: BallonDorCandidate = {
    id: state.player.id,
    name: `${state.player.firstName} ${state.player.lastName}`,
    club: state.career.currentClub.name,
    country: getCountryFlag(state.player.nationality),
    age: playerAge,
    goals: playerStats.goals,
    assists: playerStats.assists,
    rating: Math.round(playerAvgRating * 10) / 10,
    points: playerPoints,
    isPlayer: true,
  };

  // Combine and sort by points
  const allCandidates = [...aiCandidates, playerCandidate];
  allCandidates.sort((a, b) => b.points - a.points);

  // Return top 30
  return allCandidates.slice(0, 30);
}

/**
 * Génère le classement du Meilleur Jeune (< 21 ans).
 */
export function generateBestYoungPlayer(
  state: GameState,
  rng: RNG = defaultRNG
): BallonDorCandidate[] {
  const playerStats = state.playerCareerStats?.season ?? {
    matchesPlayed: 0, goals: 0, assists: 0, avgRating: 0, totalRating: 0,
  } as PlayerSeasonStats;

  const playerAge = state.player.age;
  const playerAvgRating = playerStats.matchesPlayed > 0
    ? playerStats.totalRating / playerStats.matchesPlayed
    : 0;

  // Filter young stars (age <= 21)
  const youngStars = WORLD_STARS.filter((s) => s.age <= 21);

  const aiYoung: BallonDorCandidate[] = youngStars.map((star) => {
    const goals = rng.randomInt(5, 20);
    const assists = rng.randomInt(2, 12);
    const rating = 6.8 + rng.randomFloat(0, 1.5);
    const points = goals * 3 + assists * 2 + Math.round(rating * 10);

    return {
      ...star,
      goals,
      assists,
      rating: Math.round(rating * 10) / 10,
      points,
      isPlayer: false,
    };
  });

  // Add player if under 21
  const allYoung = [...aiYoung];
  if (playerAge <= 21) {
    const playerPoints = playerStats.goals * 3 + playerStats.assists * 2 + Math.round(playerAvgRating * 10);
    allYoung.push({
      id: state.player.id,
      name: `${state.player.firstName} ${state.player.lastName}`,
      club: state.career.currentClub.name,
      country: getCountryFlag(state.player.nationality),
      age: playerAge,
      goals: playerStats.goals,
      assists: playerStats.assists,
      rating: Math.round(playerAvgRating * 10) / 10,
      points: playerPoints,
      isPlayer: true,
    });
  }

  allYoung.sort((a, b) => b.points - a.points);
  return allYoung.slice(0, 10);
}

function getCountryFlag(country: string): string {
  switch (country) {
    case 'france': return '🇫🇷';
    case 'spain': return '🇪🇸';
    case 'england': return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
    case 'italy': return '🇮🇹';
    case 'germany': return '🇩🇪';
    default: return '🌍';
  }
}

export const BallonDorSystem = {
  generateBallonDorRanking,
  generateBestYoungPlayer,
};
