/**
 * Unit tests for GameLoopOrchestrator — Champions League integration.
 * Tests advanceDay CL detection, simulateWeek CL blocking,
 * and post-match systems (fitness, morale) after CL match.
 *
 * Requirements: 5.1, 5.2, 5.5
 */

import { describe, it, expect } from 'vitest';
import { GameLoopOrchestrator } from './GameLoopOrchestrator';
import type { GameState, PlayerCharacter, Club, Division } from './types';
import { createRNG } from '../utils/random';
import { createInitialSocialState } from '../systems/social/SocialSystem';
import { createInitialFinanceState } from '../systems/finance/FinanceSystem';
import { createInitialTimeState } from '../systems/time/TimeSystem';
import type { ChampionsLeagueState, CLScheduledMatch, CLParticipant } from '../systems/championsLeague/types';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createTestPlayer(overrides?: Partial<PlayerCharacter>): PlayerCharacter {
  return {
    id: 'player-1',
    firstName: 'Test',
    lastName: 'Player',
    nationality: 'france',
    position: 'ST',
    appearance: { skinTone: 1, hairStyle: 1, hairColor: 1, height: 'medium' },
    age: 22,
    stats: { pace: 70, shooting: 75, passing: 65, dribbling: 70, defending: 40, physical: 68 },
    potential: 85,
    overallRating: 72,
    fitness: 80,
    morale: 70,
    injury: null,
    ...overrides,
  };
}

function createTestClub(id: string, name: string, country: 'france' | 'england' = 'france'): Club {
  const division: Division = { country, level: 1, name: 'Ligue 1' };
  return {
    id,
    name,
    country,
    division,
    tier: 'medium',
    squad: [
      { id: 'sq-1', name: 'GK', position: 'GK', age: 28, overallRating: 72, potential: 75, isPlayerCharacter: false },
      { id: 'sq-2', name: 'CB1', position: 'CB', age: 26, overallRating: 70, potential: 74, isPlayerCharacter: false },
      { id: 'sq-3', name: 'CB2', position: 'CB', age: 27, overallRating: 71, potential: 73, isPlayerCharacter: false },
      { id: 'sq-4', name: 'LB', position: 'LB', age: 24, overallRating: 69, potential: 76, isPlayerCharacter: false },
      { id: 'sq-5', name: 'RB', position: 'RB', age: 25, overallRating: 68, potential: 72, isPlayerCharacter: false },
      { id: 'sq-6', name: 'CM1', position: 'CM', age: 26, overallRating: 73, potential: 77, isPlayerCharacter: false },
      { id: 'sq-7', name: 'CM2', position: 'CM', age: 23, overallRating: 70, potential: 80, isPlayerCharacter: false },
      { id: 'sq-8', name: 'LW', position: 'LW', age: 22, overallRating: 74, potential: 82, isPlayerCharacter: false },
      { id: 'sq-9', name: 'RW', position: 'RW', age: 24, overallRating: 72, potential: 78, isPlayerCharacter: false },
      { id: 'sq-10', name: 'ST', position: 'ST', age: 27, overallRating: 76, potential: 78, isPlayerCharacter: false },
      { id: 'player-1', name: 'Test Player', position: 'ST', age: 22, overallRating: 72, potential: 85, isPlayerCharacter: true },
    ],
    finances: { budget: 50000000, wageBill: 2000000 },
    stadium: 'Test Stadium',
    colors: { primary: '#0000ff', secondary: '#ffffff' },
  };
}

function createCLParticipant(id: string, name: string, rating: number, isFiller = true): CLParticipant {
  return {
    id,
    name,
    country: 'france',
    averageRating: rating,
    isFiller,
    clubId: isFiller ? undefined : id,
  };
}

function createMinimalCLState(
  playerClubId: string,
  leagueSchedule: CLScheduledMatch[]
): ChampionsLeagueState {
  // Create 50 participants (player club + 49 fillers)
  const participants: CLParticipant[] = [
    createCLParticipant(playerClubId, 'Test FC', 75, false),
    ...Array.from({ length: 49 }, (_, i) =>
      createCLParticipant(`filler-${i}`, `Filler Team ${i}`, 65 + (i % 20))
    ),
  ];

  return {
    season: 1,
    participants,
    phase: 'league',
    currentMatchday: 0,
    leagueSchedule,
    leagueResults: [],
    standings: participants.map((p, i) => ({
      participantId: p.id,
      participantName: p.name,
      country: p.country,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      position: i + 1,
    })),
    knockoutRound: null,
    knockoutBracket: {
      roundOf16: [],
      quarterFinals: [],
      semiFinals: [],
      final: null,
    },
    playerParticipating: true,
    playerEliminated: false,
    playerClubId,
  };
}

function createTestGameState(overrides?: Partial<GameState>): GameState {
  const club = createTestClub('club-1', 'Test FC');
  const player = createTestPlayer();

  return {
    version: '1.0.0',
    player,
    career: {
      currentClub: club,
      contract: {
        clubId: club.id,
        weeklySalary: 50000,
        bonusPerGoal: 5000,
        bonusPerAssist: 2500,
        duration: 3,
        seasonsRemaining: 3,
        signingBonus: 100000,
      },
      season: 1,
      matchday: 0,
      trophies: [],
      transferHistory: [],
    },
    time: createInitialTimeState(1),
    social: createInitialSocialState(),
    finance: createInitialFinanceState(50000),
    leagues: [],
    saves: { lastSaved: new Date().toISOString(), slot: 1 },
    playerCareerStats: {
      season: { matchesPlayed: 0, goals: 0, assists: 0, shots: 0, dribbles: 0, tackles: 0, avgRating: 0, totalRating: 0, cleanSheets: 0 },
      allTime: { matchesPlayed: 0, goals: 0, assists: 0, shots: 0, dribbles: 0, tackles: 0, avgRating: 0, totalRating: 0, cleanSheets: 0 },
      clGoals: 0,
    },
    lifestyle: {
      possessions: [],
      investments: [],
      instagram: { followers: 1000, posts: [], weeklyPostDone: false },
    },
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GameLoopOrchestrator — Champions League Integration', () => {
  describe('advanceDay detects CL match (Requirement 5.1)', () => {
    it('should return isCLMatchDay: true when a CL match is scheduled for the current date', () => {
      // The time system starts at Aug 8, 2024 (Thursday, weekday 3).
      // After advanceDay, the date becomes Aug 9, 2024 (Friday, weekday 4).
      // We schedule a CL match on Aug 9 for the player's club.
      const clMatch: CLScheduledMatch = {
        date: { day: 9, month: 8, year: 2024 },
        homeTeamId: 'club-1',
        awayTeamId: 'filler-0',
        matchday: 1,
        phase: 'league',
      };

      const clState = createMinimalCLState('club-1', [clMatch]);
      const state = createTestGameState({ championsLeague: clState });
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.isCLMatchDay).toBe(true);
      expect(result.clMatchConfig).toBeDefined();
      expect(result.clMatchConfig!.homeTeamId).toBe('club-1');
      expect(result.clMatchConfig!.awayTeamId).toBe('filler-0');
      expect(result.clMatchConfig!.matchday).toBe(1);
      expect(result.clMatchConfig!.phase).toBe('league');
    });

    it('should return isCLMatchDay: false when no CL match is scheduled for the current date', () => {
      // Schedule a CL match on a different date (Sep 15)
      const clMatch: CLScheduledMatch = {
        date: { day: 15, month: 9, year: 2024 },
        homeTeamId: 'club-1',
        awayTeamId: 'filler-0',
        matchday: 1,
        phase: 'league',
      };

      const clState = createMinimalCLState('club-1', [clMatch]);
      const state = createTestGameState({ championsLeague: clState });
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.isCLMatchDay).toBe(false);
      expect(result.clMatchConfig).toBeUndefined();
    });

    it('should return isCLMatchDay: false when player is eliminated from CL', () => {
      const clMatch: CLScheduledMatch = {
        date: { day: 9, month: 8, year: 2024 },
        homeTeamId: 'club-1',
        awayTeamId: 'filler-0',
        matchday: 1,
        phase: 'league',
      };

      const clState = createMinimalCLState('club-1', [clMatch]);
      clState.playerEliminated = true;
      const state = createTestGameState({ championsLeague: clState });
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.isCLMatchDay).toBe(false);
      expect(result.clMatchConfig).toBeUndefined();
    });

    it('should return isCLMatchDay: false when championsLeague state is null', () => {
      const state = createTestGameState({ championsLeague: null });
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.isCLMatchDay).toBe(false);
      expect(result.clMatchConfig).toBeUndefined();
    });

    it('should return clMatchConfig with correct match details when player is away team', () => {
      const clMatch: CLScheduledMatch = {
        date: { day: 9, month: 8, year: 2024 },
        homeTeamId: 'filler-0',
        awayTeamId: 'club-1',
        matchday: 3,
        phase: 'league',
      };

      const clState = createMinimalCLState('club-1', [clMatch]);
      const state = createTestGameState({ championsLeague: clState });
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.isCLMatchDay).toBe(true);
      expect(result.clMatchConfig).toBeDefined();
      expect(result.clMatchConfig!.awayTeamId).toBe('club-1');
      expect(result.clMatchConfig!.homeTeamId).toBe('filler-0');
    });
  });

  describe('simulateWeek blocks on CL match (Requirement 5.2)', () => {
    it('should return blockedByCLMatch: true when a CL match is within the next 7 days', () => {
      // Current date is Aug 8. A CL match on Aug 10 (within 7 days) should block.
      const clMatch: CLScheduledMatch = {
        date: { day: 10, month: 8, year: 2024 },
        homeTeamId: 'club-1',
        awayTeamId: 'filler-0',
        matchday: 1,
        phase: 'league',
      };

      const clState = createMinimalCLState('club-1', [clMatch]);
      const state = createTestGameState({ championsLeague: clState });
      const rng = createRNG(42);

      const { newState, result } = GameLoopOrchestrator.simulateWeek(state, rng);

      expect(result.blockedByCLMatch).toBe(true);
      expect(result.clMatchConfig).toBeDefined();
      expect(result.clMatchConfig!.matchday).toBe(1);
      // State should not have changed
      expect(newState.time.currentDate).toEqual(state.time.currentDate);
      expect(result.days).toHaveLength(0);
    });

    it('should return blockedByCLMatch: false when no CL match is within the next 7 days', () => {
      // Current date is Aug 8. A CL match on Sep 20 (far away) should not block.
      const clMatch: CLScheduledMatch = {
        date: { day: 20, month: 9, year: 2024 },
        homeTeamId: 'club-1',
        awayTeamId: 'filler-0',
        matchday: 1,
        phase: 'league',
      };

      const clState = createMinimalCLState('club-1', [clMatch]);
      const state = createTestGameState({ championsLeague: clState });
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.simulateWeek(state, rng);

      expect(result.blockedByCLMatch).toBe(false);
      expect(result.days).toHaveLength(7);
    });

    it('should return blockedByCLMatch: false when player is eliminated', () => {
      // CL match within 7 days but player is eliminated — should not block
      const clMatch: CLScheduledMatch = {
        date: { day: 10, month: 8, year: 2024 },
        homeTeamId: 'club-1',
        awayTeamId: 'filler-0',
        matchday: 1,
        phase: 'league',
      };

      const clState = createMinimalCLState('club-1', [clMatch]);
      clState.playerEliminated = true;
      const state = createTestGameState({ championsLeague: clState });
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.simulateWeek(state, rng);

      expect(result.blockedByCLMatch).toBe(false);
      expect(result.days).toHaveLength(7);
    });

    it('should return the blocking CL match config in the result', () => {
      const clMatch: CLScheduledMatch = {
        date: { day: 12, month: 8, year: 2024 },
        homeTeamId: 'filler-5',
        awayTeamId: 'club-1',
        matchday: 2,
        phase: 'league',
      };

      const clState = createMinimalCLState('club-1', [clMatch]);
      const state = createTestGameState({ championsLeague: clState });
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.simulateWeek(state, rng);

      expect(result.blockedByCLMatch).toBe(true);
      expect(result.clMatchConfig).toEqual(clMatch);
    });
  });

  describe('Post-CL match systems: fitness and morale (Requirement 5.5)', () => {
    it('should reduce player fitness after simulateCLMatch', () => {
      const clMatch: CLScheduledMatch = {
        date: { day: 9, month: 8, year: 2024 },
        homeTeamId: 'club-1',
        awayTeamId: 'filler-0',
        matchday: 1,
        phase: 'league',
      };

      const clState = createMinimalCLState('club-1', [clMatch]);
      const state = createTestGameState({
        championsLeague: clState,
        player: createTestPlayer({ fitness: 100 }),
      });
      const rng = createRNG(42);

      const { newState, result } = GameLoopOrchestrator.simulateCLMatch(state, clMatch, rng);

      // Fitness should be reduced (loss between 15 and 30)
      expect(result.fitnessLoss).toBeGreaterThanOrEqual(15);
      expect(result.fitnessLoss).toBeLessThanOrEqual(30);
      expect(newState.player.fitness).toBeLessThan(100);
      expect(newState.player.fitness).toBe(100 - result.fitnessLoss);
    });

    it('should update morale after simulateCLMatch based on match result', () => {
      const clMatch: CLScheduledMatch = {
        date: { day: 9, month: 8, year: 2024 },
        homeTeamId: 'club-1',
        awayTeamId: 'filler-0',
        matchday: 1,
        phase: 'league',
      };

      const clState = createMinimalCLState('club-1', [clMatch]);
      const state = createTestGameState({ championsLeague: clState });
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.simulateCLMatch(state, clMatch, rng);

      // moraleChange should be defined (positive for win, negative for loss, 0 for draw)
      expect(result.moraleChange).toBeDefined();
      expect(typeof result.moraleChange).toBe('number');
    });

    it('should reduce player fitness after playCLMatch', () => {
      const clMatch: CLScheduledMatch = {
        date: { day: 9, month: 8, year: 2024 },
        homeTeamId: 'club-1',
        awayTeamId: 'filler-0',
        matchday: 1,
        phase: 'league',
      };

      const clState = createMinimalCLState('club-1', [clMatch]);
      const state = createTestGameState({
        championsLeague: clState,
        player: createTestPlayer({ fitness: 95 }),
      });
      const playerInputs = [
        { timing: 'perfect' as const },
        { timing: 'good' as const },
      ];
      const rng = createRNG(42);

      const { newState, result } = GameLoopOrchestrator.playCLMatch(state, clMatch, playerInputs, rng);

      expect(result.fitnessLoss).toBeGreaterThanOrEqual(15);
      expect(result.fitnessLoss).toBeLessThanOrEqual(30);
      expect(newState.player.fitness).toBeLessThan(95);
    });

    it('should update morale after playCLMatch based on match result', () => {
      const clMatch: CLScheduledMatch = {
        date: { day: 9, month: 8, year: 2024 },
        homeTeamId: 'club-1',
        awayTeamId: 'filler-0',
        matchday: 1,
        phase: 'league',
      };

      const clState = createMinimalCLState('club-1', [clMatch]);
      const state = createTestGameState({ championsLeague: clState });
      const playerInputs = [
        { timing: 'perfect' as const },
        { timing: 'good' as const },
        { timing: 'good' as const },
      ];
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.playCLMatch(state, clMatch, playerInputs, rng);

      expect(result.moraleChange).toBeDefined();
      expect(typeof result.moraleChange).toBe('number');
    });

    it('should apply same fitness loss range as league matches (15-30)', () => {
      // Run multiple simulations to verify the range
      const clMatch: CLScheduledMatch = {
        date: { day: 9, month: 8, year: 2024 },
        homeTeamId: 'club-1',
        awayTeamId: 'filler-0',
        matchday: 1,
        phase: 'league',
      };

      const fitnessLosses: number[] = [];
      for (let seed = 1; seed <= 20; seed++) {
        const clState = createMinimalCLState('club-1', [clMatch]);
        const state = createTestGameState({
          championsLeague: clState,
          player: createTestPlayer({ fitness: 100 }),
        });
        const rng = createRNG(seed);
        const { result } = GameLoopOrchestrator.simulateCLMatch(state, clMatch, rng);
        fitnessLosses.push(result.fitnessLoss);
      }

      // All fitness losses should be in the valid range
      for (const loss of fitnessLosses) {
        expect(loss).toBeGreaterThanOrEqual(15);
        expect(loss).toBeLessThanOrEqual(30);
      }
    });
  });
});
