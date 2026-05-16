/**
 * Types et constantes pour le système Ligue des Champions.
 * Définit les interfaces de données pour la phase de ligue, les tours éliminatoires,
 * et l'état global de la compétition.
 */

import type { GameDate, MatchPerformance } from '../../core/types';

// ─── Constantes ──────────────────────────────────────────────────────────────

export const CL_CONSTANTS = {
  TOTAL_PARTICIPANTS: 50,
  QUALIFIED_PER_LEAGUE: 4,
  NUM_LEAGUES: 5,
  TOTAL_QUALIFIED: 20,       // 5 × 4
  TOTAL_FILLERS: 30,         // 50 - 20
  MATCHES_PER_TEAM: 8,       // Phase de ligue
  HOME_MATCHES: 4,
  AWAY_MATCHES: 4,
  LEAGUE_PHASE_MATCHDAYS: 8,
  TOP_16_QUALIFY: 16,
  POINTS_WIN: 3,
  POINTS_DRAW: 1,
  POINTS_LOSS: 0,
  MAX_GOALS_PER_TEAM: 5,     // Score max en simulation
  INSTAGRAM_MULTIPLIER: 2,   // Multiplicateur prestige CL
  KNOCKOUT_ROUNDS: ['round-of-16', 'quarter-final', 'semi-final', 'final'] as const,
} as const;

// ─── Interfaces ──────────────────────────────────────────────────────────────

/** Participant à la Ligue des Champions (qualifié ou filler) */
export interface CLParticipant {
  id: string;
  name: string;
  country: string;
  averageRating: number;  // Note moyenne de l'effectif (60-88)
  isFiller: boolean;      // true pour les équipes fictives
  clubId?: string;        // Référence au Club réel si qualifié
}

/** Match planifié de la Ligue des Champions */
export interface CLScheduledMatch {
  date: GameDate;
  homeTeamId: string;     // CLParticipant.id
  awayTeamId: string;     // CLParticipant.id
  matchday: number;       // 1-8 pour phase de ligue
  phase: 'league' | 'round-of-16' | 'quarter-final' | 'semi-final' | 'final';
  leg?: 1 | 2;           // Pour les tours éliminatoires
}

/** Fixture de la phase de ligue (avant assignation de date) */
export interface CLFixture {
  homeTeamId: string;
  awayTeamId: string;
  matchday: number;       // 1-8
}

/** Résultat d'un match CL */
export interface CLMatchResult {
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  phase: CLScheduledMatch['phase'];
  leg?: 1 | 2;
  playerPerformance?: MatchPerformance;  // Si le joueur a participé
  extraTime?: boolean;
  penalties?: [number, number];  // Score des tirs au but [home, away]
}

/** Classement de la phase de ligue */
export interface CLStanding {
  participantId: string;
  participantName: string;
  country: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  position: number;
}

/** Tour éliminatoire */
export type KnockoutRound = 'round-of-16' | 'quarter-final' | 'semi-final' | 'final';

/** Confrontation aller-retour */
export interface CLKnockoutTie {
  homeTeam: CLParticipant;
  awayTeam: CLParticipant;
  firstLeg?: CLMatchResult;
  secondLeg?: CLMatchResult;
  winner?: string;  // participantId du vainqueur
}

/** Résultat d'une confrontation aller-retour */
export interface CLKnockoutTieResult {
  winnerId: string;
  aggregateHome: number;
  aggregateAway: number;
  decidedBy: 'aggregate' | 'extra-time' | 'penalties';
  extraTimeGoals?: [number, number];
  penaltyScore?: [number, number];
}

/** État complet de la Ligue des Champions pour une saison */
export interface ChampionsLeagueState {
  season: number;
  participants: CLParticipant[];
  phase: 'league' | 'knockout' | 'finished';
  currentMatchday: number;  // 1-8 en phase de ligue

  // Phase de ligue
  leagueSchedule: CLScheduledMatch[];
  leagueResults: CLMatchResult[];
  standings: CLStanding[];

  // Tours éliminatoires
  knockoutRound: KnockoutRound | null;
  knockoutBracket: {
    roundOf16: CLKnockoutTie[];
    quarterFinals: CLKnockoutTie[];
    semiFinals: CLKnockoutTie[];
    final: CLKnockoutTie | null;
  };

  // État du joueur
  playerParticipating: boolean;
  playerEliminated: boolean;
  playerClubId: string | null;
}
