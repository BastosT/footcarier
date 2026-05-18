/**
 * DomesticCup — Système de Coupe nationale (Coupe de France, FA Cup, Copa del Rey, etc.)
 * Tirage au sort, matchs à élimination directe (32èmes → Finale).
 * Le joueur entre en 16èmes de finale (clubs de D1).
 */

import type { Country } from '../../core/types';
import { type RNG, defaultRNG } from '../../utils/random';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CupRound = '16th' | '8th' | 'quarter' | 'semi' | 'final';

export interface CupMatch {
  round: CupRound;
  opponent: string;
  opponentTier: 'small' | 'medium' | 'big';
  teamGoals: number | null;
  opponentGoals: number | null;
  played: boolean;
  won: boolean | null;
}

export interface DomesticCupState {
  cupName: string;
  season: number;
  currentRound: CupRound | null;  // null = eliminated or not started
  matches: CupMatch[];
  eliminated: boolean;
  wonCup: boolean;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const CUP_NAMES: Record<Country, string> = {
  france: 'Coupe de France',
  england: 'FA Cup',
  spain: 'Copa del Rey',
  italy: 'Coppa Italia',
  germany: 'DFB-Pokal',
};

const ROUND_ORDER: CupRound[] = ['16th', '8th', 'quarter', 'semi', 'final'];

const ROUND_LABELS: Record<CupRound, string> = {
  '16th': '16èmes de finale',
  '8th': '8èmes de finale',
  'quarter': 'Quarts de finale',
  'semi': 'Demi-finales',
  'final': 'Finale',
};

// Opponents pool by round (earlier rounds = weaker opponents possible)
const SMALL_CLUBS = [
  'FC Lorient', 'AJ Auxerre', 'Clermont Foot', 'Troyes', 'Angers SCO',
  'Guingamp', 'Niort', 'Rodez', 'Pau FC', 'Dunkerque',
  'Quevilly', 'Bergerac', 'Versailles', 'Sète', 'Concarneau',
  'Burton Albion', 'Crawley Town', 'Accrington', 'Harrogate',
  'Elche', 'Huesca', 'Tenerife', 'Cartagena',
  'Cremonese', 'Cittadella', 'Südtirol', 'Feralpisalò',
  'Sandhausen', 'Elversberg', 'Wehen Wiesbaden', 'Osnabrück',
];

const MEDIUM_CLUBS = [
  'RC Lens', 'OGC Nice', 'Stade Rennais', 'Montpellier', 'FC Nantes',
  'Wolverhampton', 'West Ham', 'Crystal Palace', 'Everton', 'Leicester',
  'Real Betis', 'Villarreal', 'Real Sociedad', 'Celta Vigo',
  'Fiorentina', 'Roma', 'Lazio', 'Atalanta',
  'Wolfsburg', 'Freiburg', 'Union Berlin', 'Hoffenheim',
];

const BIG_CLUBS = [
  'PSG', 'Olympique de Marseille', 'Olympique Lyonnais', 'AS Monaco',
  'Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Manchester United',
  'Real Madrid', 'FC Barcelona', 'Atlético Madrid',
  'Juventus', 'Inter Milan', 'AC Milan', 'Napoli',
  'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
];

// ─── Fonctions ───────────────────────────────────────────────────────────────

/**
 * Initialise la coupe nationale pour la saison.
 */
export function initDomesticCup(country: Country, season: number): DomesticCupState {
  return {
    cupName: CUP_NAMES[country],
    season,
    currentRound: '16th',
    matches: [],
    eliminated: false,
    wonCup: false,
  };
}

/**
 * Tire au sort l'adversaire pour le tour actuel.
 */
export function drawOpponent(
  state: DomesticCupState,
  playerClubName: string,
  rng: RNG = defaultRNG
): string {
  const round = state.currentRound;
  if (!round) return 'Inconnu';

  let pool: string[];
  switch (round) {
    case '16th':
      // Mix of small and medium clubs
      pool = [...SMALL_CLUBS, ...MEDIUM_CLUBS.slice(0, 8)];
      break;
    case '8th':
      // Medium clubs mostly
      pool = [...MEDIUM_CLUBS, ...SMALL_CLUBS.slice(0, 5)];
      break;
    case 'quarter':
      // Medium and some big clubs
      pool = [...MEDIUM_CLUBS, ...BIG_CLUBS.slice(0, 6)];
      break;
    case 'semi':
      // Big clubs
      pool = [...BIG_CLUBS, ...MEDIUM_CLUBS.slice(0, 4)];
      break;
    case 'final':
      // Big clubs only
      pool = BIG_CLUBS;
      break;
    default:
      pool = MEDIUM_CLUBS;
  }

  // Exclude player's club
  const filtered = pool.filter((c) => c !== playerClubName);
  return rng.randomChoice(filtered);
}

/**
 * Simule un match de coupe.
 */
export function simulateCupMatch(
  playerClubTier: 'small' | 'medium' | 'big',
  opponentTier: 'small' | 'medium' | 'big',
  playerOVR: number,
  round: CupRound,
  rng: RNG = defaultRNG
): { teamGoals: number; opponentGoals: number } {
  const tierRating: Record<string, number> = { big: 80, medium: 70, small: 60 };
  const playerTeamRating = tierRating[playerClubTier];
  const oppRating = tierRating[opponentTier];

  // Cup matches are more unpredictable (upsets happen)
  const diff = playerTeamRating - oppRating;
  const baseChance = 0.35 + diff / 150; // less predictable than league

  let teamGoals = 0;
  for (let i = 0; i < 4; i++) {
    if (rng.random() < Math.max(0.15, Math.min(0.65, baseChance))) teamGoals++;
  }

  // Player contribution bonus
  const playerBonus = (playerOVR - 60) / 200;
  if (rng.random() < playerBonus) teamGoals++;

  let opponentGoals = 0;
  const oppChance = 0.35 - diff / 150;
  for (let i = 0; i < 4; i++) {
    if (rng.random() < Math.max(0.1, Math.min(0.55, oppChance))) opponentGoals++;
  }

  // In case of draw, mark as draw (penalties will be handled by UI)
  if (teamGoals === opponentGoals) {
    // Add 1 to the team with slight advantage (simplified for auto-sim)
    if (rng.random() < 0.55) teamGoals++;
    else opponentGoals++;
  }

  return { teamGoals, opponentGoals };
}

/**
 * Joue le tour actuel et avance au suivant (ou élimine).
 */
export function playCupRound(
  state: DomesticCupState,
  playerClubName: string,
  playerClubTier: 'small' | 'medium' | 'big',
  playerOVR: number,
  rng: RNG = defaultRNG
): DomesticCupState {
  if (!state.currentRound || state.eliminated) return state;

  const opponent = drawOpponent(state, playerClubName, rng);
  const opponentTier = getOpponentTier(opponent);

  const { teamGoals, opponentGoals } = simulateCupMatch(
    playerClubTier, opponentTier, playerOVR, state.currentRound, rng
  );

  const won = teamGoals > opponentGoals;

  const match: CupMatch = {
    round: state.currentRound,
    opponent,
    opponentTier,
    teamGoals,
    opponentGoals,
    played: true,
    won,
  };

  const newMatches = [...state.matches, match];

  if (!won) {
    return { ...state, matches: newMatches, eliminated: true, currentRound: null };
  }

  // Advance to next round
  const currentIdx = ROUND_ORDER.indexOf(state.currentRound);
  if (currentIdx >= ROUND_ORDER.length - 1) {
    // Won the final!
    return { ...state, matches: newMatches, wonCup: true, currentRound: null };
  }

  return { ...state, matches: newMatches, currentRound: ROUND_ORDER[currentIdx + 1] };
}

/**
 * Simule toute la coupe d'un coup.
 */
export function simulateFullCup(
  country: Country,
  season: number,
  playerClubName: string,
  playerClubTier: 'small' | 'medium' | 'big',
  playerOVR: number,
  rng: RNG = defaultRNG
): DomesticCupState {
  let state = initDomesticCup(country, season);

  while (state.currentRound && !state.eliminated && !state.wonCup) {
    state = playCupRound(state, playerClubName, playerClubTier, playerOVR, rng);
  }

  return state;
}

function getOpponentTier(name: string): 'small' | 'medium' | 'big' {
  if (BIG_CLUBS.includes(name)) return 'big';
  if (MEDIUM_CLUBS.includes(name)) return 'medium';
  return 'small';
}

export { CUP_NAMES, ROUND_LABELS, ROUND_ORDER };

export const DomesticCupSystem = {
  initDomesticCup,
  drawOpponent,
  simulateCupMatch,
  playCupRound,
  simulateFullCup,
  CUP_NAMES,
  ROUND_LABELS,
};
