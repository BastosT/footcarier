/**
 * Sérialiseur/Désérialiseur d'état de jeu avec validation Zod.
 * Gère la conversion GameState <-> JSON avec validation de schéma.
 */

import { z } from 'zod';
import type { GameState } from '../core/types';

// ─── Version du schéma ───────────────────────────────────────────────────────

export const SCHEMA_VERSION = '1.0.0';

// ─── Schémas Zod ─────────────────────────────────────────────────────────────

const GameDateSchema = z.object({
  day: z.number().int().min(1).max(31),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2060),
});

const PositionSchema = z.enum(['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST']);

const CountrySchema = z.enum(['france', 'spain', 'england', 'italy', 'germany']);

const ClubTierSchema = z.enum(['small', 'medium', 'big']);

const DivisionSchema = z.object({
  country: CountrySchema,
  level: z.number().int().min(1).max(5),
  name: z.string().min(1),
});

const PlayerAppearanceSchema = z.object({
  skinTone: z.number().int().min(0),
  hairStyle: z.number().int().min(0),
  hairColor: z.number().int().min(0),
  height: z.enum(['short', 'medium', 'tall']),
});

const PlayerStatsSchema = z.object({
  pace: z.number().min(1).max(99),
  shooting: z.number().min(1).max(99),
  passing: z.number().min(1).max(99),
  dribbling: z.number().min(1).max(99),
  defending: z.number().min(1).max(99),
  physical: z.number().min(1).max(99),
});

const InjuryTypeSchema = z.enum(['muscle', 'ligament', 'fracture', 'concussion', 'fatigue']);

const InjuryStateSchema = z.object({
  type: InjuryTypeSchema,
  weeksRemaining: z.number().int().min(0),
  severity: z.enum(['minor', 'moderate', 'severe']),
});

const PlayerCharacterSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  nationality: CountrySchema,
  position: PositionSchema,
  appearance: PlayerAppearanceSchema,
  age: z.number().int().min(15).max(45),
  stats: PlayerStatsSchema,
  potential: z.number().min(1).max(99),
  overallRating: z.number().min(1).max(99),
  fitness: z.number().min(0).max(100),
  morale: z.number().min(0).max(100),
  injury: InjuryStateSchema.nullable(),
});

const SquadPlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  position: PositionSchema,
  age: z.number().int().min(15).max(45),
  overallRating: z.number().min(1).max(99),
  potential: z.number().min(1).max(99),
  isPlayerCharacter: z.boolean(),
});

const ClubFinancesSchema = z.object({
  budget: z.number(),
  wageBill: z.number(),
});

const ClubSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: CountrySchema,
  division: DivisionSchema,
  tier: ClubTierSchema,
  squad: z.array(SquadPlayerSchema).min(1),
  finances: ClubFinancesSchema,
  stadium: z.string().min(1),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
  }),
});

const ContractSchema = z.object({
  clubId: z.string().min(1),
  weeklySalary: z.number().min(0),
  bonusPerGoal: z.number().min(0),
  bonusPerAssist: z.number().min(0),
  duration: z.number().int().min(1),
  seasonsRemaining: z.number().int().min(0),
  signingBonus: z.number().min(0),
});

const TrophyTypeSchema = z.enum(['league', 'cup', 'champions_league', 'top_scorer', 'best_player', 'golden_boot']);

const TrophySchema = z.object({
  id: z.string().min(1),
  type: TrophyTypeSchema,
  season: z.number().int(),
  competition: z.string().min(1),
});

const TransferRecordSchema = z.object({
  fromClubId: z.string().min(1),
  toClubId: z.string().min(1),
  season: z.number().int(),
  fee: z.number().min(0),
});

const CareerStateSchema = z.object({
  currentClub: ClubSchema,
  contract: ContractSchema,
  season: z.number().int().min(1),
  matchday: z.number().int().min(0),
  trophies: z.array(TrophySchema),
  transferHistory: z.array(TransferRecordSchema),
});

const ScheduledMatchSchema = z.object({
  date: GameDateSchema,
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  competition: z.string().min(1),
  matchday: z.number().int().min(0),
});

const MatchScheduleSchema = z.object({
  nextMatch: ScheduledMatchSchema.nullable(),
  seasonMatches: z.array(ScheduledMatchSchema),
});

const TimeStateSchema = z.object({
  currentDate: GameDateSchema,
  season: z.number().int().min(1),
  weekday: z.number().int().min(0).max(6),
  eventsThisWeek: z.number().int().min(0).max(3),
  schedule: MatchScheduleSchema,
});

const SocialPostSchema = z.object({
  id: z.string().min(1),
  author: z.string().min(1),
  authorType: z.enum(['fan', 'journalist', 'player', 'self']),
  content: z.string(),
  timestamp: GameDateSchema,
  likes: z.number().int().min(0),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
});

const InterviewAnswerSchema = z.object({
  text: z.string().min(1),
  tone: z.enum(['humble', 'confident', 'controversial']),
  impacts: z.object({
    popularity: z.number(),
    reputation: z.number(),
    coachRelation: z.number(),
    teamRelation: z.number(),
  }),
});

const InterviewQuestionSchema = z.object({
  text: z.string().min(1),
  answers: z.tuple([InterviewAnswerSchema, InterviewAnswerSchema, InterviewAnswerSchema]),
});

const InterviewContextSchema = z.object({
  type: z.enum(['post_match', 'transfer', 'trophy', 'controversy', 'general']),
  relatedEvent: z.string().optional(),
});

const InterviewSchema = z.object({
  id: z.string().min(1),
  context: InterviewContextSchema,
  questions: z.array(InterviewQuestionSchema),
});

const SocialStateSchema = z.object({
  popularity: z.number().min(0).max(100),
  reputation: z.number().min(0).max(100),
  coachRelation: z.number().min(0).max(100),
  teamRelation: z.number().min(0).max(100),
  socialFeed: z.array(SocialPostSchema),
  pendingInterviews: z.array(InterviewSchema),
});

const TransactionTypeSchema = z.enum(['salary', 'bonus', 'signing_bonus', 'sponsorship', 'fine', 'event']);

const FinanceTransactionSchema = z.object({
  date: GameDateSchema,
  type: TransactionTypeSchema,
  amount: z.number(),
  description: z.string(),
});

const FinanceStateSchema = z.object({
  balance: z.number(),
  weeklyIncome: z.number(),
  history: z.array(FinanceTransactionSchema),
});

const MatchPerformanceSchema = z.object({
  rating: z.number().min(1).max(10),
  goals: z.number().int().min(0),
  assists: z.number().int().min(0),
  minutesPlayed: z.number().int().min(0).max(120),
  shots: z.number().int().min(0),
  passAccuracy: z.number().min(0).max(100),
  dribbles: z.number().int().min(0),
  tackles: z.number().int().min(0),
});

const MatchResultSchema = z.object({
  matchday: z.number().int().min(0),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  homeGoals: z.number().int().min(0),
  awayGoals: z.number().int().min(0),
  playerPerformance: MatchPerformanceSchema.optional(),
});

const LeagueStandingSchema = z.object({
  clubId: z.string().min(1),
  clubName: z.string().min(1),
  played: z.number().int().min(0),
  won: z.number().int().min(0),
  drawn: z.number().int().min(0),
  lost: z.number().int().min(0),
  goalsFor: z.number().int().min(0),
  goalsAgainst: z.number().int().min(0),
  points: z.number().int().min(0),
  position: z.number().int().min(1),
});

const TopScorerSchema = z.object({
  playerId: z.string().min(1),
  playerName: z.string().min(1),
  clubId: z.string().min(1),
  clubName: z.string().min(1),
  goals: z.number().int().min(0),
  assists: z.number().int().min(0),
  matchesPlayed: z.number().int().min(0),
});

const LeagueStateSchema = z.object({
  division: DivisionSchema,
  standings: z.array(LeagueStandingSchema),
  results: z.array(MatchResultSchema),
  season: z.number().int().min(1),
  topScorers: z.array(TopScorerSchema).default([]),
  schedule: z.array(ScheduledMatchSchema).default([]),
});

const SaveMetadataSchema = z.object({
  lastSaved: z.string(),
  slot: z.number().int().min(1).max(3),
});

// ─── Schémas Champions League ────────────────────────────────────────────────

const CLPhaseSchema = z.enum(['league', 'round-of-16', 'quarter-final', 'semi-final', 'final']);

const CLParticipantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string().min(1),
  averageRating: z.number().min(0).max(99),
  isFiller: z.boolean(),
  clubId: z.string().optional(),
});

const CLScheduledMatchSchema = z.object({
  date: GameDateSchema,
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  matchday: z.number().int().min(1),
  phase: CLPhaseSchema,
  leg: z.union([z.literal(1), z.literal(2)]).optional(),
});

const CLMatchResultSchema = z.object({
  matchday: z.number().int().min(0),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  homeGoals: z.number().int().min(0),
  awayGoals: z.number().int().min(0),
  phase: CLPhaseSchema,
  leg: z.union([z.literal(1), z.literal(2)]).optional(),
  playerPerformance: MatchPerformanceSchema.optional(),
  extraTime: z.boolean().optional(),
  penalties: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
});

const CLStandingSchema = z.object({
  participantId: z.string().min(1),
  participantName: z.string().min(1),
  country: z.string().min(1),
  played: z.number().int().min(0),
  won: z.number().int().min(0),
  drawn: z.number().int().min(0),
  lost: z.number().int().min(0),
  goalsFor: z.number().int().min(0),
  goalsAgainst: z.number().int().min(0),
  points: z.number().int().min(0),
  position: z.number().int().min(1),
});

const CLKnockoutTieSchema = z.object({
  homeTeam: CLParticipantSchema,
  awayTeam: CLParticipantSchema,
  firstLeg: CLMatchResultSchema.optional(),
  secondLeg: CLMatchResultSchema.optional(),
  winner: z.string().optional(),
});

const KnockoutRoundSchema = z.enum(['round-of-16', 'quarter-final', 'semi-final', 'final']);

const KnockoutBracketSchema = z.object({
  roundOf16: z.array(CLKnockoutTieSchema),
  quarterFinals: z.array(CLKnockoutTieSchema),
  semiFinals: z.array(CLKnockoutTieSchema),
  final: CLKnockoutTieSchema.nullable(),
});

export const ChampionsLeagueStateSchema = z.object({
  season: z.number().int().min(1),
  participants: z.array(CLParticipantSchema),
  phase: z.enum(['league', 'knockout', 'finished']),
  currentMatchday: z.number().int().min(0),
  leagueSchedule: z.array(CLScheduledMatchSchema),
  leagueResults: z.array(CLMatchResultSchema),
  standings: z.array(CLStandingSchema),
  knockoutRound: KnockoutRoundSchema.nullable(),
  knockoutBracket: KnockoutBracketSchema,
  playerParticipating: z.boolean(),
  playerEliminated: z.boolean(),
  playerClubId: z.string().nullable(),
});

// ─── Schéma principal ────────────────────────────────────────────────────────

export const GameStateSchema = z.object({
  version: z.string().min(1),
  player: PlayerCharacterSchema,
  career: CareerStateSchema,
  time: TimeStateSchema,
  social: SocialStateSchema,
  finance: FinanceStateSchema,
  leagues: z.array(LeagueStateSchema),
  saves: SaveMetadataSchema,
  championsLeague: ChampionsLeagueStateSchema.nullable().optional(),
});

// ─── Fonctions de sérialisation ──────────────────────────────────────────────

/**
 * Sérialise un GameState en chaîne JSON.
 * @param state - L'état de jeu à sérialiser
 * @returns La chaîne JSON représentant l'état
 */
export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

/**
 * Désérialise une chaîne JSON en GameState avec validation Zod.
 * @param json - La chaîne JSON à désérialiser
 * @returns L'état de jeu validé
 * @throws SerializationError si le JSON est invalide ou les données ne passent pas la validation
 */
export function deserialize(json: string): GameState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new SerializationError(
      'JSON invalide : impossible de parser la chaîne.',
      'INVALID_JSON',
      error instanceof Error ? error : undefined
    );
  }

  // Migration: add championsLeague field if missing (old saves)
  if (parsed && typeof parsed === 'object' && !('championsLeague' in (parsed as Record<string, unknown>))) {
    (parsed as Record<string, unknown>).championsLeague = null;
  }

  const result = GameStateSchema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new SerializationError(
      `Données corrompues : la validation du schéma a échoué. ${issues}`,
      'SCHEMA_VALIDATION_FAILED'
    );
  }

  // Check version compatibility
  const state = result.data as GameState;
  if (!isVersionCompatible(state.version)) {
    throw new SerializationError(
      `Version incompatible : la sauvegarde est en version ${state.version}, version actuelle ${SCHEMA_VERSION}.`,
      'INCOMPATIBLE_VERSION'
    );
  }

  return state;
}

// ─── Gestion des erreurs ─────────────────────────────────────────────────────

export type SerializationErrorCode =
  | 'INVALID_JSON'
  | 'SCHEMA_VALIDATION_FAILED'
  | 'INCOMPATIBLE_VERSION';

export class SerializationError extends Error {
  readonly code: SerializationErrorCode;
  readonly cause?: Error;

  constructor(message: string, code: SerializationErrorCode, cause?: Error) {
    super(message);
    this.name = 'SerializationError';
    this.code = code;
    this.cause = cause;
  }
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

/**
 * Vérifie la compatibilité de version (même version majeure).
 */
function isVersionCompatible(savedVersion: string): boolean {
  const [savedMajor] = savedVersion.split('.').map(Number);
  const [currentMajor] = SCHEMA_VERSION.split('.').map(Number);
  return savedMajor === currentMajor;
}
