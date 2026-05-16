import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { serialize, deserialize, SerializationError, SCHEMA_VERSION } from './serializer';
import type { GameState } from '../core/types';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const gameDateArb = fc.record({
  day: fc.integer({ min: 1, max: 28 }),
  month: fc.integer({ min: 1, max: 12 }),
  year: fc.integer({ min: 2024, max: 2040 }),
});

const positionArb = fc.constantFrom('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST' as const);
const countryArb = fc.constantFrom('france', 'spain', 'england', 'italy', 'germany' as const);
const clubTierArb = fc.constantFrom('small', 'medium', 'big' as const);

const playerStatsArb = fc.record({
  pace: fc.integer({ min: 1, max: 99 }),
  shooting: fc.integer({ min: 1, max: 99 }),
  passing: fc.integer({ min: 1, max: 99 }),
  dribbling: fc.integer({ min: 1, max: 99 }),
  defending: fc.integer({ min: 1, max: 99 }),
  physical: fc.integer({ min: 1, max: 99 }),
});

const injuryStateArb = fc.record({
  type: fc.constantFrom('muscle', 'ligament', 'fracture', 'concussion', 'fatigue' as const),
  weeksRemaining: fc.integer({ min: 1, max: 20 }),
  severity: fc.constantFrom('minor', 'moderate', 'severe' as const),
});

const playerAppearanceArb = fc.record({
  skinTone: fc.integer({ min: 0, max: 10 }),
  hairStyle: fc.integer({ min: 0, max: 20 }),
  hairColor: fc.integer({ min: 0, max: 10 }),
  height: fc.constantFrom('short', 'medium', 'tall' as const),
});

const playerCharacterArb = fc.record({
  id: fc.uuid(),
  firstName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  lastName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  nationality: countryArb,
  position: positionArb,
  appearance: playerAppearanceArb,
  age: fc.integer({ min: 16, max: 40 }),
  stats: playerStatsArb,
  potential: fc.integer({ min: 50, max: 99 }),
  overallRating: fc.integer({ min: 1, max: 99 }),
  fitness: fc.integer({ min: 0, max: 100 }),
  morale: fc.integer({ min: 0, max: 100 }),
  injury: fc.option(injuryStateArb, { nil: null }),
});

const divisionArb = fc.record({
  country: countryArb,
  level: fc.integer({ min: 1, max: 2 }),
  name: fc.constantFrom('Ligue 1', 'La Liga', 'Premier League', 'Serie A', 'Bundesliga'),
});

const squadPlayerArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  position: positionArb,
  age: fc.integer({ min: 16, max: 40 }),
  overallRating: fc.integer({ min: 1, max: 99 }),
  potential: fc.integer({ min: 1, max: 99 }),
  isPlayerCharacter: fc.boolean(),
});

const clubArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
  country: countryArb,
  division: divisionArb,
  tier: clubTierArb,
  squad: fc.array(squadPlayerArb, { minLength: 1, maxLength: 5 }),
  finances: fc.record({ budget: fc.integer({ min: 0, max: 500000000 }), wageBill: fc.integer({ min: 0, max: 10000000 }) }),
  stadium: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
  colors: fc.record({ primary: fc.stringMatching(/^#[0-9a-f]{6}$/), secondary: fc.stringMatching(/^#[0-9a-f]{6}$/) }),
});

const contractArb = fc.record({
  clubId: fc.uuid(),
  weeklySalary: fc.integer({ min: 1000, max: 500000 }),
  bonusPerGoal: fc.integer({ min: 0, max: 50000 }),
  bonusPerAssist: fc.integer({ min: 0, max: 30000 }),
  duration: fc.integer({ min: 1, max: 5 }),
  seasonsRemaining: fc.integer({ min: 0, max: 5 }),
  signingBonus: fc.integer({ min: 0, max: 5000000 }),
});

const trophyArb = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('league', 'cup', 'top_scorer', 'best_player', 'golden_boot' as const),
  season: fc.integer({ min: 1, max: 20 }),
  competition: fc.constantFrom('Ligue 1', 'La Liga', 'Premier League'),
});

const transferRecordArb = fc.record({
  fromClubId: fc.uuid(),
  toClubId: fc.uuid(),
  season: fc.integer({ min: 1, max: 20 }),
  fee: fc.integer({ min: 0, max: 200000000 }),
});

const careerStateArb = fc.record({
  currentClub: clubArb,
  contract: contractArb,
  season: fc.integer({ min: 1, max: 20 }),
  matchday: fc.integer({ min: 0, max: 38 }),
  trophies: fc.array(trophyArb, { maxLength: 3 }),
  transferHistory: fc.array(transferRecordArb, { maxLength: 3 }),
});

const scheduledMatchArb = fc.record({
  date: gameDateArb,
  homeTeam: fc.uuid(),
  awayTeam: fc.uuid(),
  competition: fc.constantFrom('Ligue 1', 'La Liga', 'Premier League'),
  matchday: fc.integer({ min: 0, max: 38 }),
});

const timeStateArb = fc.record({
  currentDate: gameDateArb,
  season: fc.integer({ min: 1, max: 20 }),
  weekday: fc.integer({ min: 0, max: 6 }),
  eventsThisWeek: fc.integer({ min: 0, max: 3 }),
  schedule: fc.record({
    nextMatch: fc.option(scheduledMatchArb, { nil: null }),
    seasonMatches: fc.array(scheduledMatchArb, { maxLength: 3 }),
  }),
});

const interviewAnswerArb = fc.record({
  text: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  tone: fc.constantFrom('humble', 'confident', 'controversial' as const),
  impacts: fc.record({
    popularity: fc.integer({ min: -20, max: 20 }),
    reputation: fc.integer({ min: -20, max: 20 }),
    coachRelation: fc.integer({ min: -20, max: 20 }),
    teamRelation: fc.integer({ min: -20, max: 20 }),
  }),
});

const socialPostArb = fc.record({
  id: fc.uuid(),
  author: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  authorType: fc.constantFrom('fan', 'journalist', 'player', 'self' as const),
  content: fc.string({ maxLength: 100 }),
  timestamp: gameDateArb,
  likes: fc.integer({ min: 0, max: 10000 }),
  sentiment: fc.constantFrom('positive', 'neutral', 'negative' as const),
});

const interviewArb = fc.record({
  id: fc.uuid(),
  context: fc.record({
    type: fc.constantFrom('post_match', 'transfer', 'trophy', 'controversy', 'general' as const),
  }),
  questions: fc.array(
    fc.record({
      text: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
      answers: fc.tuple(interviewAnswerArb, interviewAnswerArb, interviewAnswerArb),
    }),
    { maxLength: 2 }
  ),
});

const socialStateArb = fc.record({
  popularity: fc.integer({ min: 0, max: 100 }),
  reputation: fc.integer({ min: 0, max: 100 }),
  coachRelation: fc.integer({ min: 0, max: 100 }),
  teamRelation: fc.integer({ min: 0, max: 100 }),
  socialFeed: fc.array(socialPostArb, { maxLength: 3 }),
  pendingInterviews: fc.array(interviewArb, { maxLength: 2 }),
});

const financeTransactionArb = fc.record({
  date: gameDateArb,
  type: fc.constantFrom('salary', 'bonus', 'signing_bonus', 'sponsorship', 'fine', 'event' as const),
  amount: fc.integer({ min: -100000, max: 500000 }),
  description: fc.string({ maxLength: 50 }),
});

const financeStateArb = fc.record({
  balance: fc.integer({ min: 0, max: 50000000 }),
  weeklyIncome: fc.integer({ min: 1000, max: 500000 }),
  history: fc.array(financeTransactionArb, { maxLength: 3 }),
});

const matchPerformanceArb = fc.record({
  rating: fc.double({ min: 1, max: 10, noNaN: true }),
  goals: fc.integer({ min: 0, max: 5 }),
  assists: fc.integer({ min: 0, max: 5 }),
  minutesPlayed: fc.integer({ min: 0, max: 90 }),
  shots: fc.integer({ min: 0, max: 10 }),
  passAccuracy: fc.double({ min: 0, max: 100, noNaN: true }),
  dribbles: fc.integer({ min: 0, max: 10 }),
  tackles: fc.integer({ min: 0, max: 10 }),
});

const matchResultArb = fc.record({
  matchday: fc.integer({ min: 0, max: 38 }),
  homeTeamId: fc.uuid(),
  awayTeamId: fc.uuid(),
  homeGoals: fc.integer({ min: 0, max: 10 }),
  awayGoals: fc.integer({ min: 0, max: 10 }),
  playerPerformance: fc.option(matchPerformanceArb, { nil: undefined }),
});

const leagueStandingArb = fc.record({
  clubId: fc.uuid(),
  clubName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  played: fc.integer({ min: 0, max: 38 }),
  won: fc.integer({ min: 0, max: 38 }),
  drawn: fc.integer({ min: 0, max: 38 }),
  lost: fc.integer({ min: 0, max: 38 }),
  goalsFor: fc.integer({ min: 0, max: 150 }),
  goalsAgainst: fc.integer({ min: 0, max: 150 }),
  points: fc.integer({ min: 0, max: 114 }),
  position: fc.integer({ min: 1, max: 20 }),
});

const topScorerArb = fc.record({
  playerId: fc.uuid(),
  playerName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  clubId: fc.uuid(),
  clubName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  goals: fc.integer({ min: 0, max: 50 }),
  assists: fc.integer({ min: 0, max: 30 }),
  matchesPlayed: fc.integer({ min: 0, max: 38 }),
});

const leagueStateArb = fc.record({
  division: divisionArb,
  standings: fc.array(leagueStandingArb, { minLength: 1, maxLength: 5 }),
  results: fc.array(matchResultArb, { maxLength: 3 }),
  season: fc.integer({ min: 1, max: 20 }),
  topScorers: fc.array(topScorerArb, { maxLength: 3 }),
  schedule: fc.array(scheduledMatchArb, { maxLength: 3 }),
});

const gameStateArb: fc.Arbitrary<GameState> = fc.record({
  version: fc.constant(SCHEMA_VERSION),
  player: playerCharacterArb,
  career: careerStateArb,
  time: timeStateArb,
  social: socialStateArb,
  finance: financeStateArb,
  leagues: fc.array(leagueStateArb, { minLength: 1, maxLength: 2 }),
  saves: fc.record({
    lastSaved: fc.constant('2025-01-15T10:30:00.000Z'),
    slot: fc.integer({ min: 1, max: 3 }),
  }),
  championsLeague: fc.constant(null),
}) as fc.Arbitrary<GameState>;

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('Serializer - Property Tests', () => {
  it('Property 1: Round-trip serialization preserves data', () => {
    fc.assert(
      fc.property(gameStateArb, (state) => {
        const serialized1 = serialize(state);
        const deserialized = deserialize(serialized1);
        const serialized2 = serialize(deserialized);
        expect(serialized1).toBe(serialized2);
      }),
      { numRuns: 50 }
    );
  });

  it('deserialize rejects invalid JSON', () => {
    expect(() => deserialize('not json')).toThrow(SerializationError);
    expect(() => deserialize('not json')).toThrow('JSON invalide');
  });

  it('deserialize rejects corrupted data', () => {
    expect(() => deserialize('{"version":"1.0.0"}')).toThrow(SerializationError);
    expect(() => deserialize('{"version":"1.0.0"}')).toThrow('Données corrompues');
  });

  it('deserialize rejects incompatible version', () => {
    fc.assert(
      fc.property(gameStateArb, (state) => {
        const modified = { ...state, version: '2.0.0' };
        const json = JSON.stringify(modified);
        expect(() => deserialize(json)).toThrow(SerializationError);
        expect(() => deserialize(json)).toThrow('Version incompatible');
      }),
      { numRuns: 5 }
    );
  });
});
