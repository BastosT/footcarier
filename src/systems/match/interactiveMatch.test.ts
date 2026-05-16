import { describe, it, expect } from 'vitest';
import { createRNG } from '../../utils/random';
import {
  simulateInteractiveMatch,
  generateInteractiveActions,
  resolveInteractiveAction,
  calculateInteractiveActionProbability,
  INTERACTIVE_ACTIONS_PER_MATCH,
  EASY_PROBABILITY_RANGE,
  RISKY_PROBABILITY_RANGE,
  PROBABILITY_BOUNDS,
} from './MatchSimulator';
import type { MatchConfig, PlayerCharacter, Club, PlayerStats } from '../../core/types';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createTestPlayer(overrides: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return {
    id: 'player-1',
    firstName: 'Test',
    lastName: 'Player',
    nationality: 'france',
    position: 'ST',
    appearance: { skinTone: 1, hairStyle: 1, hairColor: 1, height: 'medium' },
    age: 25,
    stats: {
      pace: 75,
      shooting: 80,
      passing: 70,
      dribbling: 72,
      defending: 40,
      physical: 68,
    },
    potential: 85,
    overallRating: 75,
    fitness: 90,
    morale: 80,
    injury: null,
    ...overrides,
  };
}

function createTestClub(id: string, name: string, includePlayer = false): Club {
  const squad = Array.from({ length: 11 }, (_, i) => ({
    id: includePlayer && i === 0 ? 'player-1' : `${id}-player-${i}`,
    name: `Player ${i}`,
    position: 'CM' as const,
    age: 25,
    overallRating: 70,
    potential: 75,
    isPlayerCharacter: includePlayer && i === 0,
  }));

  return {
    id,
    name,
    country: 'france',
    division: { country: 'france', level: 1, name: 'Ligue 1' },
    tier: 'medium',
    squad,
    finances: { budget: 1000000, wageBill: 50000 },
    stadium: 'Test Stadium',
    colors: { primary: '#000', secondary: '#fff' },
  };
}

function createTestMatchConfig(player: PlayerCharacter): MatchConfig {
  return {
    homeTeam: createTestClub('home-team', 'Home FC', true),
    awayTeam: createTestClub('away-team', 'Away FC', false),
    playerCharacter: player,
    competition: 'Ligue 1',
    matchday: 10,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Interactive Match Action Generation', () => {
  describe('calculateInteractiveActionProbability', () => {
    it('should clamp probability to minimum 0.05', () => {
      // Very low stat + low fitness + low base probability
      const prob = calculateInteractiveActionProbability(0.1, 10, 10);
      expect(prob).toBeGreaterThanOrEqual(PROBABILITY_BOUNDS.min);
    });

    it('should clamp probability to maximum 0.95', () => {
      // High base probability + high stat + high fitness
      const prob = calculateInteractiveActionProbability(0.95, 100, 99);
      expect(prob).toBeLessThanOrEqual(PROBABILITY_BOUNDS.max);
    });

    it('should apply fitness modifier when fitness < 50', () => {
      const probHighFitness = calculateInteractiveActionProbability(0.8, 80, 75);
      const probLowFitness = calculateInteractiveActionProbability(0.8, 30, 75);
      expect(probHighFitness).toBeGreaterThan(probLowFitness);
    });

    it('should increase probability with higher stats', () => {
      const probLowStat = calculateInteractiveActionProbability(0.8, 80, 50);
      const probHighStat = calculateInteractiveActionProbability(0.8, 80, 90);
      expect(probHighStat).toBeGreaterThan(probLowStat);
    });

    it('should not penalize fitness when >= 50', () => {
      const prob60 = calculateInteractiveActionProbability(0.8, 60, 75);
      const prob100 = calculateInteractiveActionProbability(0.8, 100, 75);
      // Both should have fitness modifier = 1.0
      expect(prob60).toBe(prob100);
    });
  });

  describe('generateInteractiveActions', () => {
    it('should generate the correct number of actions', () => {
      const rng = createRNG(42);
      const stats: PlayerStats = {
        pace: 75, shooting: 80, passing: 70,
        dribbling: 72, defending: 40, physical: 68,
      };

      const actions = generateInteractiveActions(stats, 90, 8, 20, rng);
      expect(actions).toHaveLength(8);
    });

    it('should have actions sorted by minute', () => {
      const rng = createRNG(123);
      const stats: PlayerStats = {
        pace: 75, shooting: 80, passing: 70,
        dribbling: 72, defending: 40, physical: 68,
      };

      const actions = generateInteractiveActions(stats, 90, 10, 25, rng);
      for (let i = 1; i < actions.length; i++) {
        expect(actions[i].minute).toBeGreaterThanOrEqual(actions[i - 1].minute);
      }
    });

    it('should provide both easy and risky choices for each action', () => {
      const rng = createRNG(99);
      const stats: PlayerStats = {
        pace: 75, shooting: 80, passing: 70,
        dribbling: 72, defending: 40, physical: 68,
      };

      const actions = generateInteractiveActions(stats, 85, 6, 18, rng);
      for (const action of actions) {
        expect(action.easy).toBeDefined();
        expect(action.risky).toBeDefined();
        expect(action.easy.difficulty).toBe('easy');
        expect(action.risky.difficulty).toBe('risky');
      }
    });

    it('should have easy probability higher than risky probability on average', () => {
      const rng = createRNG(77);
      const stats: PlayerStats = {
        pace: 75, shooting: 80, passing: 70,
        dribbling: 72, defending: 40, physical: 68,
      };

      const actions = generateInteractiveActions(stats, 80, 12, 20, rng);
      let easyHigherCount = 0;
      for (const action of actions) {
        if (action.easy.successProbability > action.risky.successProbability) {
          easyHigherCount++;
        }
      }
      // Easy should be higher in most cases (not necessarily all due to stat differences)
      expect(easyHigherCount).toBeGreaterThan(actions.length / 2);
    });
  });

  describe('resolveInteractiveAction', () => {
    it('should return goal outcome for successful shot', () => {
      // Use a RNG that always returns 0 (success guaranteed with any probability > 0)
      const rng = createRNG(0);
      const choice = {
        type: 'shot' as const,
        difficulty: 'risky' as const,
        baseProbability: 0.5,
        successProbability: 0.95, // Very high probability to ensure success
        description: 'Risky shot',
      };

      // Try multiple seeds to find one that succeeds
      for (let seed = 0; seed < 100; seed++) {
        const testRng = createRNG(seed);
        const result = resolveInteractiveAction(choice, testRng);
        if (result.success) {
          expect(result.outcome).toBe('goal');
          return;
        }
      }
      // If we get here with 0.95 probability, something is very wrong
      expect(true).toBe(false);
    });

    it('should return assist outcome for successful pass', () => {
      const choice = {
        type: 'pass' as const,
        difficulty: 'easy' as const,
        baseProbability: 0.8,
        successProbability: 0.95,
        description: 'Safe pass',
      };

      for (let seed = 0; seed < 100; seed++) {
        const testRng = createRNG(seed);
        const result = resolveInteractiveAction(choice, testRng);
        if (result.success) {
          expect(result.outcome).toBe('assist');
          return;
        }
      }
      expect(true).toBe(false);
    });

    it('should return failed outcome for unsuccessful action', () => {
      const choice = {
        type: 'shot' as const,
        difficulty: 'risky' as const,
        baseProbability: 0.2,
        successProbability: 0.05, // Very low probability to ensure failure
        description: 'Risky shot',
      };

      for (let seed = 0; seed < 100; seed++) {
        const testRng = createRNG(seed);
        const result = resolveInteractiveAction(choice, testRng);
        if (!result.success) {
          expect(result.outcome).toBe('failed');
          return;
        }
      }
      expect(true).toBe(false);
    });
  });

  describe('simulateInteractiveMatch', () => {
    it('should generate between 6 and 12 actions', () => {
      const player = createTestPlayer();
      const config = createTestMatchConfig(player);

      for (let seed = 0; seed < 20; seed++) {
        const rng = createRNG(seed);
        const result = simulateInteractiveMatch(config, [], rng);
        expect(result.actions.length).toBeGreaterThanOrEqual(INTERACTIVE_ACTIONS_PER_MATCH.min);
        expect(result.actions.length).toBeLessThanOrEqual(INTERACTIVE_ACTIONS_PER_MATCH.max);
      }
    });

    it('should decrease fitness progressively during match', () => {
      const player = createTestPlayer({ fitness: 90 });
      const config = createTestMatchConfig(player);
      const rng = createRNG(42);

      const result = simulateInteractiveMatch(config, [], rng);

      // Fitness should decrease
      expect(result.finalFitness).toBeLessThan(90);
      // Fitness loss should be between 15 and 30
      expect(result.fitnessLoss).toBeGreaterThanOrEqual(15);
      expect(result.fitnessLoss).toBeLessThanOrEqual(30);
    });

    it('should count goals correctly when shot succeeds', () => {
      const player = createTestPlayer({
        stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 },
        fitness: 100,
      });
      const config = createTestMatchConfig(player);

      // Use all risky choices to maximize shot attempts
      const choices = Array(12).fill('risky' as const);

      // Run multiple seeds to find one with goals
      let foundGoal = false;
      for (let seed = 0; seed < 50; seed++) {
        const rng = createRNG(seed);
        const result = simulateInteractiveMatch(config, choices, rng);
        const goalActions = result.actions.filter(a => a.outcome === 'goal');
        if (goalActions.length > 0) {
          expect(result.performance.goals).toBeGreaterThanOrEqual(goalActions.length);
          foundGoal = true;
          break;
        }
      }
      expect(foundGoal).toBe(true);
    });

    it('should count assists correctly when pass succeeds', () => {
      const player = createTestPlayer({
        stats: { pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 },
        fitness: 100,
      });
      const config = createTestMatchConfig(player);

      // Use all easy choices to maximize pass attempts
      const choices = Array(12).fill('easy' as const);

      let foundAssist = false;
      for (let seed = 0; seed < 50; seed++) {
        const rng = createRNG(seed);
        const result = simulateInteractiveMatch(config, choices, rng);
        const assistActions = result.actions.filter(a => a.outcome === 'assist');
        if (assistActions.length > 0) {
          expect(result.performance.assists).toBeGreaterThanOrEqual(assistActions.length);
          foundAssist = true;
          break;
        }
      }
      expect(foundAssist).toBe(true);
    });

    it('should produce valid match result with non-negative scores', () => {
      const player = createTestPlayer();
      const config = createTestMatchConfig(player);
      const rng = createRNG(42);

      const result = simulateInteractiveMatch(config, [], rng);

      expect(result.result.homeGoals).toBeGreaterThanOrEqual(0);
      expect(result.result.awayGoals).toBeGreaterThanOrEqual(0);
      expect(result.result.matchday).toBe(10);
      expect(result.result.homeTeamId).toBe('home-team');
      expect(result.result.awayTeamId).toBe('away-team');
    });

    it('should produce valid performance metrics', () => {
      const player = createTestPlayer();
      const config = createTestMatchConfig(player);
      const rng = createRNG(42);

      const result = simulateInteractiveMatch(config, [], rng);

      expect(result.performance.rating).toBeGreaterThanOrEqual(1);
      expect(result.performance.rating).toBeLessThanOrEqual(10);
      expect(result.performance.minutesPlayed).toBe(90);
      expect(result.performance.passAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.performance.passAccuracy).toBeLessThanOrEqual(100);
    });

    it('should respect player choices (easy vs risky)', () => {
      const player = createTestPlayer();
      const config = createTestMatchConfig(player);
      const rng = createRNG(42);

      const allEasy = Array(12).fill('easy' as const);
      const result = simulateInteractiveMatch(config, allEasy, rng);

      for (const action of result.actions) {
        expect(action.chosenDifficulty).toBe('easy');
      }
    });

    it('should default to easy when no choice provided', () => {
      const player = createTestPlayer();
      const config = createTestMatchConfig(player);
      const rng = createRNG(42);

      const result = simulateInteractiveMatch(config, [], rng);

      for (const action of result.actions) {
        expect(action.chosenDifficulty).toBe('easy');
      }
    });
  });
});
