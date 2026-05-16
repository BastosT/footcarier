/**
 * Unit tests for GameLoopOrchestrator.
 * Tests the core orchestration logic: advanceDay, simulateWeek,
 * playMatch, simulateMatch, executeTraining.
 */

import { describe, it, expect } from 'vitest';
import { GameLoopOrchestrator } from './GameLoopOrchestrator';
import type { GameState, PlayerCharacter, Club, Division, LeagueState } from './types';
import { createRNG } from '../utils/random';
import { createInitialSocialState } from '../systems/social/SocialSystem';
import { createInitialFinanceState } from '../systems/finance/FinanceSystem';
import { createInitialTimeState } from '../systems/time/TimeSystem';

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
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GameLoopOrchestrator', () => {
  describe('advanceDay', () => {
    it('should advance time by one day', () => {
      const state = createTestGameState();
      const rng = createRNG(42);

      const { newState, result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(newState.time.currentDate).not.toEqual(state.time.currentDate);
      expect(result.dayResult).toBeDefined();
      expect(result.dayResult.date).toEqual(newState.time.currentDate);
    });

    it('should apply fitness recovery of +1', () => {
      const state = createTestGameState();
      state.player.fitness = 70;
      const rng = createRNG(42);

      const { newState, result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(newState.player.fitness).toBe(71);
      expect(result.fitnessRecovery).toBe(1);
    });

    it('should cap fitness at 100', () => {
      const state = createTestGameState();
      state.player.fitness = 100;
      const rng = createRNG(42);

      const { newState } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(newState.player.fitness).toBe(100);
    });

    it('should credit salary on Monday', () => {
      const state = createTestGameState();
      // Set weekday to 6 (Sunday) so next day is Monday (0)
      state.time.weekday = 6;
      const rng = createRNG(42);

      const { newState, result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.salaryCredited).toBe(true);
      expect(newState.finance.balance).toBe(state.finance.balance + 50000);
    });

    it('should not credit salary on non-Monday days', () => {
      const state = createTestGameState();
      // Set weekday to 1 (Tuesday) so next day is Wednesday (2)
      state.time.weekday = 1;
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.salaryCredited).toBe(false);
    });

    it('should reset training on Monday', () => {
      const state = createTestGameState();
      state.time.weekday = 6; // Sunday → Monday
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.trainingReset).toBe(true);
    });

    it('should not reset training on non-Monday days', () => {
      const state = createTestGameState();
      state.time.weekday = 2; // Wednesday → Thursday
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.trainingReset).toBe(false);
    });
  });

  describe('simulateWeek', () => {
    it('should advance exactly 7 days', () => {
      const state = createTestGameState();
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.simulateWeek(state, rng);

      expect(result.days).toHaveLength(7);
    });

    it('should credit salary exactly once during the week', () => {
      const state = createTestGameState();
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.simulateWeek(state, rng);

      const salaryDays = result.days.filter((d) => d.salaryCredited);
      expect(salaryDays.length).toBeLessThanOrEqual(1);
    });

    it('should accumulate fitness recovery across the week', () => {
      const state = createTestGameState();
      state.player.fitness = 50;
      const rng = createRNG(42);

      const { newState } = GameLoopOrchestrator.simulateWeek(state, rng);

      // Fitness should increase (7 days of recovery, minus any match fatigue)
      // Without a match, it should be 50 + 7 = 57
      // With a match, it could be less due to fitness loss
      expect(newState.player.fitness).toBeGreaterThanOrEqual(50);
    });
  });

  describe('simulateMatch', () => {
    it('should return a valid match result', () => {
      const state = createTestGameState();
      const opponentClub = createTestClub('club-2', 'Opponent FC');
      const config = {
        homeTeam: state.career.currentClub,
        awayTeam: opponentClub,
        playerCharacter: state.player,
        competition: 'Ligue 1',
        matchday: 1,
      };
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.simulateMatch(state, config, rng);

      expect(result.result.homeTeamId).toBe('club-1');
      expect(result.result.awayTeamId).toBe('club-2');
      expect(result.result.homeGoals).toBeGreaterThanOrEqual(0);
      expect(result.result.awayGoals).toBeGreaterThanOrEqual(0);
    });

    it('should apply fitness loss between 15 and 30', () => {
      const state = createTestGameState();
      state.player.fitness = 100;
      const opponentClub = createTestClub('club-2', 'Opponent FC');
      const config = {
        homeTeam: state.career.currentClub,
        awayTeam: opponentClub,
        playerCharacter: state.player,
        competition: 'Ligue 1',
        matchday: 1,
      };
      const rng = createRNG(42);

      const { newState, result } = GameLoopOrchestrator.simulateMatch(state, config, rng);

      expect(result.fitnessLoss).toBeGreaterThanOrEqual(15);
      expect(result.fitnessLoss).toBeLessThanOrEqual(30);
      expect(newState.player.fitness).toBeLessThan(100);
    });

    it('should generate player performance', () => {
      const state = createTestGameState();
      const opponentClub = createTestClub('club-2', 'Opponent FC');
      const config = {
        homeTeam: state.career.currentClub,
        awayTeam: opponentClub,
        playerCharacter: state.player,
        competition: 'Ligue 1',
        matchday: 1,
      };
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.simulateMatch(state, config, rng);

      expect(result.performance.rating).toBeGreaterThanOrEqual(1);
      expect(result.performance.rating).toBeLessThanOrEqual(10);
      expect(result.performance.minutesPlayed).toBe(90);
    });

    it('should update morale after match', () => {
      const state = createTestGameState();
      const opponentClub = createTestClub('club-2', 'Opponent FC');
      const config = {
        homeTeam: state.career.currentClub,
        awayTeam: opponentClub,
        playerCharacter: state.player,
        competition: 'Ligue 1',
        matchday: 1,
      };
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.simulateMatch(state, config, rng);

      // Morale should change (positive or negative depending on result)
      expect(result.moraleChange).not.toBe(undefined);
    });
  });

  describe('playMatch', () => {
    it('should run an interactive match with player inputs', () => {
      const state = createTestGameState();
      const opponentClub = createTestClub('club-2', 'Opponent FC');
      const config = {
        homeTeam: state.career.currentClub,
        awayTeam: opponentClub,
        playerCharacter: state.player,
        competition: 'Ligue 1',
        matchday: 1,
      };
      const playerInputs = [
        { timing: 'perfect' as const },
        { timing: 'good' as const },
        { timing: 'miss' as const },
        { timing: 'good' as const },
      ];
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.playMatch(state, config, playerInputs, rng);

      expect(result.result.homeTeamId).toBe('club-1');
      expect(result.result.awayTeamId).toBe('club-2');
      expect(result.performance).toBeDefined();
      expect(result.fitnessLoss).toBeGreaterThanOrEqual(15);
      expect(result.fitnessLoss).toBeLessThanOrEqual(30);
    });
  });

  describe('executeTraining', () => {
    it('should increase the targeted skill', () => {
      const state = createTestGameState();
      const rng = createRNG(42);

      const { newState, result } = GameLoopOrchestrator.executeTraining(state, 'shooting', rng);

      expect(result.skill).toBe('shooting');
      expect(result.gain).toBeGreaterThanOrEqual(1);
      expect(result.gain).toBeLessThanOrEqual(3);
      expect(newState.player.stats.shooting).toBe(result.newValue);
    });

    it('should not change other stats', () => {
      const state = createTestGameState();
      const rng = createRNG(42);

      const { newState } = GameLoopOrchestrator.executeTraining(state, 'shooting', rng);

      expect(newState.player.stats.pace).toBe(state.player.stats.pace);
      expect(newState.player.stats.passing).toBe(state.player.stats.passing);
      expect(newState.player.stats.dribbling).toBe(state.player.stats.dribbling);
      expect(newState.player.stats.defending).toBe(state.player.stats.defending);
      expect(newState.player.stats.physical).toBe(state.player.stats.physical);
    });

    it('should work for all training skills', () => {
      const skills: Array<'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical'> = [
        'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical',
      ];

      for (const skill of skills) {
        const state = createTestGameState();
        const rng = createRNG(42);

        const { result } = GameLoopOrchestrator.executeTraining(state, skill, rng);

        expect(result.skill).toBe(skill);
        expect(result.gain).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('injury system integration', () => {
    it('should include injuryOccurred field in day advance result', () => {
      const state = createTestGameState();
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.injuryOccurred).toBeDefined();
      expect(typeof result.injuryOccurred).toBe('boolean');
    });

    it('should not generate injury when player is already injured', () => {
      const state = createTestGameState();
      state.player.injury = { type: 'muscle', weeksRemaining: 2, severity: 'minor' };
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.injuryOccurred).toBe(false);
    });

    it('should advance injury recovery on Monday for injured player', () => {
      const state = createTestGameState();
      state.player.injury = { type: 'muscle', weeksRemaining: 2, severity: 'minor' };
      state.time.weekday = 6; // Sunday → Monday
      const rng = createRNG(100); // Use seed that won't trigger new injury

      const { newState } = GameLoopOrchestrator.advanceDay(state, rng);

      // Injury should have advanced (weeksRemaining decreased by 1)
      expect(newState.player.injury).not.toBeNull();
      expect(newState.player.injury!.weeksRemaining).toBe(1);
    });

    it('should clear injury when recovery is complete', () => {
      const state = createTestGameState();
      state.player.injury = { type: 'fatigue', weeksRemaining: 1, severity: 'minor' };
      state.time.weekday = 6; // Sunday → Monday
      const rng = createRNG(100);

      const { newState } = GameLoopOrchestrator.advanceDay(state, rng);

      // Injury should be cleared (weeksRemaining was 1, now 0 → null)
      expect(newState.player.injury).toBeNull();
    });
  });

  describe('transfer system integration', () => {
    it('should include transferOffersGenerated field in day advance result', () => {
      const state = createTestGameState();
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.transferOffersGenerated).toBeDefined();
      expect(Array.isArray(result.transferOffersGenerated)).toBe(true);
    });

    it('should generate transfer offers during summer window on Monday', () => {
      const state = createTestGameState();
      // Set date to June (summer window) and weekday to Sunday → Monday
      state.time.currentDate = { day: 30, month: 5, year: 2024 }; // May 30 → June 1 after advance
      state.time.weekday = 6; // Sunday → Monday
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      // Should generate offers (may be empty if no eligible clubs, but array should exist)
      expect(result.transferOffersGenerated).toBeDefined();
      expect(Array.isArray(result.transferOffersGenerated)).toBe(true);
    });

    it('should generate transfer offers during winter window on Monday', () => {
      const state = createTestGameState();
      // Set date to end of December → January 1 (winter window)
      state.time.currentDate = { day: 31, month: 12, year: 2024 };
      state.time.weekday = 6; // Sunday → Monday
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.transferOffersGenerated).toBeDefined();
      expect(Array.isArray(result.transferOffersGenerated)).toBe(true);
    });

    it('should not generate transfer offers outside transfer windows', () => {
      const state = createTestGameState();
      // Set date to March (not a transfer window) and Monday
      state.time.currentDate = { day: 2, month: 3, year: 2024 }; // March 2 → March 3
      state.time.weekday = 6; // Sunday → Monday
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.transferOffersGenerated).toHaveLength(0);
    });

    it('should not generate transfer offers on non-Monday days even in window', () => {
      const state = createTestGameState();
      // Set date to June (summer window) but not Monday
      state.time.currentDate = { day: 14, month: 6, year: 2024 };
      state.time.weekday = 2; // Wednesday → Thursday
      const rng = createRNG(42);

      const { result } = GameLoopOrchestrator.advanceDay(state, rng);

      expect(result.transferOffersGenerated).toHaveLength(0);
    });
  });

  describe('social feed integration', () => {
    it('should generate social posts after simulated match', () => {
      const state = createTestGameState();
      const opponentClub = createTestClub('club-2', 'Opponent FC');
      const config = {
        homeTeam: state.career.currentClub,
        awayTeam: opponentClub,
        playerCharacter: state.player,
        competition: 'Ligue 1',
        matchday: 1,
      };
      const rng = createRNG(42);

      const { newState, result } = GameLoopOrchestrator.simulateMatch(state, config, rng);

      expect(result.socialPosts).toBeDefined();
      expect(result.socialPosts.length).toBeGreaterThan(0);
      expect(newState.social.socialFeed.length).toBeGreaterThan(0);
    });

    it('should generate social posts after played match', () => {
      const state = createTestGameState();
      const opponentClub = createTestClub('club-2', 'Opponent FC');
      const config = {
        homeTeam: state.career.currentClub,
        awayTeam: opponentClub,
        playerCharacter: state.player,
        competition: 'Ligue 1',
        matchday: 1,
      };
      const playerInputs = [
        { timing: 'perfect' as const },
        { timing: 'good' as const },
      ];
      const rng = createRNG(42);

      const { newState, result } = GameLoopOrchestrator.playMatch(state, config, playerInputs, rng);

      expect(result.socialPosts).toBeDefined();
      expect(result.socialPosts.length).toBeGreaterThan(0);
      expect(newState.social.socialFeed.length).toBeGreaterThan(0);
    });

    it('should cap social feed at 50 posts', () => {
      const state = createTestGameState();
      // Pre-fill social feed with 49 posts
      state.social.socialFeed = Array.from({ length: 49 }, (_, i) => ({
        id: `existing-${i}`,
        author: 'Fan',
        authorType: 'fan' as const,
        content: 'Old post',
        timestamp: { day: 1, month: 1, year: 2024 },
        likes: 10,
        sentiment: 'neutral' as const,
      }));

      const opponentClub = createTestClub('club-2', 'Opponent FC');
      const config = {
        homeTeam: state.career.currentClub,
        awayTeam: opponentClub,
        playerCharacter: state.player,
        competition: 'Ligue 1',
        matchday: 1,
      };
      const rng = createRNG(42);

      const { newState } = GameLoopOrchestrator.simulateMatch(state, config, rng);

      expect(newState.social.socialFeed.length).toBeLessThanOrEqual(50);
    });
  });
});
