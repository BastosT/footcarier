/**
 * Persistence-layer types for IndexedDB storage.
 * Re-exports core game types and defines persistence-specific types.
 */

// Re-export all core types used by persistence layer
export type {
  Position,
  Country,
  ClubTier,
  GameDate,
  Division,
  SquadPlayer,
  ClubFinances,
  Club,
  LeagueStanding,
  MatchResult,
  MatchPerformance,
  LeagueState,
  TopScorer,
  PlayerStats,
  PlayerAppearance,
  InjuryType,
  InjuryState,
  PlayerCharacter,
  Contract,
  Trophy,
  TrophyType,
  TransferRecord,
  CareerState,
  ScheduledMatch,
  MatchSchedule,
  TimeState,
  SocialPost,
  SocialState,
  Interview,
  InterviewContext,
  InterviewQuestion,
  InterviewAnswer,
  FinanceTransaction,
  TransactionType,
  FinanceState,
  GameState,
  SaveMetadata,
  SaveSlot,
} from '../core/types';

// ─── Persistence-specific types ──────────────────────────────────────────────

/**
 * SaveData represents a complete save stored in IndexedDB.
 * The slot field is auto-incremented by Dexie.
 */
export interface SaveData {
  slot?: number;
  playerName: string;
  clubName: string;
  season: number;
  date: import('../core/types').GameDate;
  lastSaved: Date;
  overallRating: number;
  gameState: import('../core/types').GameState;
}
