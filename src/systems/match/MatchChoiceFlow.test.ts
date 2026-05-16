import { describe, it, expect } from 'vitest';
import { simulateQuickMatch } from './MatchChoiceFlow';
import { createRNG } from '../../utils/random';
import type { MatchConfig, PlayerCharacter, Club } from '../../core/types';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function createTestClub(overrides: Partial<Club> = {}): Club {
  return {
    id: 'club-1',
    name: 'Test FC',
    country: 'france',
    division: { country: 'france', level: 1, name: 'Ligue 1' },
    tier: 'medium',
    squad: Array.from({ length: 11 }, (_, i) => ({
      id: `player-${i}`,
      name: `Player ${i}`,
      position: i === 0 ? 'GK' : i < 5 ? 'CB' : i < 8 ? 'CM' : 'ST',
      age: 25,
      overallRating: 75,
      potential: 80,
      isPlayerCharacter: false,
    })),
    finances: { budget: 1000000, wageBill: 50000 },
    stadium: 'Test Stadium',
    colors: { primary: '#000', secondary: '#fff' },
    ...overrides,
  };
}

function createTestPlayer(overrides: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return {
    id: 'pc-1',
    firstName: 'Test',
    lastName: 'Player',
    nationality: 'france',
    position: 'ST',
    appearance: { skinTone: 1, hairStyle: 1, hairColor: 1, height: 'medium' },
    age: 22,
    stats: { pace: 75, shooting: 80, passing: 70, dribbling: 72, defending: 40, physical: 68 },
    potential: 88,
    overallRating: 78,
    fitness: 85,
    morale: 70,
    injury: null,
    ...overrides,
  };
}

function createTestMatchConfig(overrides: Partial<MatchConfig> = {}): MatchConfig {
  const homeTeam = createTestClub({ id: 'home-club', name: 'Home FC' });
  // Mark one player as the player character in the home team
  homeTeam.squad[10] = {
    ...homeTeam.squad[10],
    id: 'pc-1',
    isPlayerCharacter: true,
  };

  const awayTeam = createTestClub({ id: 'away-club', name: 'Away FC' });

  return {
    homeTeam,
    awayTeam,
    playerCharacter: createTestPlayer(),
    competition: 'Ligue 1',
    matchday: 5,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MatchChoiceFlow - simulateQuickMatch', () => {
  it('should return a valid match result with non-negative scores', () => {
    const rng = createRNG(42);
    const config = createTestMatchConfig();
    const player = createTestPlayer();

    const result = simulateQuickMatch(config, player, rng);

    expect(result.result.homeGoals).toBeGreaterThanOrEqual(0);
    expect(result.result.awayGoals).toBeGreaterThanOrEqual(0);
    expect(result.result.matchday).toBe(5);
    expect(result.result.homeTeamId).toBe('home-club');
    expect(result.result.awayTeamId).toBe('away-club');
  });

  it('should generate player performance with valid rating [1, 10]', () => {
    const rng = createRNG(123);
    const config = createTestMatchConfig();
    const player = createTestPlayer();

    const result = simulateQuickMatch(config, player, rng);

    expect(result.performance.rating).toBeGreaterThanOrEqual(1);
    expect(result.performance.rating).toBeLessThanOrEqual(10);
  });

  it('should apply fitness loss between 15 and 30 points', () => {
    const rng = createRNG(99);
    const config = createTestMatchConfig();
    const player = createTestPlayer({ fitness: 100 });

    const result = simulateQuickMatch(config, player, rng);

    expect(result.fitnessLoss).toBeGreaterThanOrEqual(15);
    expect(result.fitnessLoss).toBeLessThanOrEqual(30);
    expect(result.newFitness).toBe(100 - result.fitnessLoss);
  });

  it('should clamp new fitness to [0, 100]', () => {
    const rng = createRNG(7);
    const config = createTestMatchConfig();
    const player = createTestPlayer({ fitness: 10 });

    const result = simulateQuickMatch(config, player, rng);

    expect(result.newFitness).toBeGreaterThanOrEqual(0);
    expect(result.newFitness).toBeLessThanOrEqual(100);
  });

  it('should generate goals for attacking positions', () => {
    // Run multiple times with different seeds to check that attackers can score
    let totalGoals = 0;
    for (let seed = 0; seed < 50; seed++) {
      const rng = createRNG(seed);
      const config = createTestMatchConfig();
      const player = createTestPlayer({ position: 'ST', overallRating: 90, fitness: 100 });

      const result = simulateQuickMatch(config, player, rng);
      totalGoals += result.performance.goals;
    }
    // With a high-rated striker, we expect at least some goals over 50 simulations
    expect(totalGoals).toBeGreaterThan(0);
  });

  it('should not generate goals for goalkeepers', () => {
    // GK is not in the attacking positions list, so goals should be 0 most of the time
    let totalGoals = 0;
    for (let seed = 0; seed < 20; seed++) {
      const rng = createRNG(seed);
      const config = createTestMatchConfig();
      const player = createTestPlayer({ position: 'GK', overallRating: 75, fitness: 80 });

      const result = simulateQuickMatch(config, player, rng);
      totalGoals += result.performance.goals;
    }
    // GK should not score (goals lambda = 0 for non-attacking positions)
    expect(totalGoals).toBe(0);
  });

  it('should set minutesPlayed to 90', () => {
    const rng = createRNG(1);
    const config = createTestMatchConfig();
    const player = createTestPlayer();

    const result = simulateQuickMatch(config, player, rng);

    expect(result.performance.minutesPlayed).toBe(90);
  });

  it('should attach player performance to the match result', () => {
    const rng = createRNG(55);
    const config = createTestMatchConfig();
    const player = createTestPlayer();

    const result = simulateQuickMatch(config, player, rng);

    expect(result.result.playerPerformance).toBeDefined();
    expect(result.result.playerPerformance).toEqual(result.performance);
  });

  it('should produce deterministic results with the same seed', () => {
    const config = createTestMatchConfig();
    const player = createTestPlayer();

    const result1 = simulateQuickMatch(config, player, createRNG(42));
    const result2 = simulateQuickMatch(config, player, createRNG(42));

    expect(result1.result.homeGoals).toBe(result2.result.homeGoals);
    expect(result1.result.awayGoals).toBe(result2.result.awayGoals);
    expect(result1.performance.rating).toBe(result2.performance.rating);
    expect(result1.fitnessLoss).toBe(result2.fitnessLoss);
  });

  it('should generate lower performance rating when fitness is low', () => {
    const config = createTestMatchConfig();
    const player = createTestPlayer({ overallRating: 80 });

    // Collect average ratings for high vs low fitness
    let highFitnessRatingSum = 0;
    let lowFitnessRatingSum = 0;
    const runs = 100;

    for (let seed = 0; seed < runs; seed++) {
      const highFitnessResult = simulateQuickMatch(
        config,
        { ...player, fitness: 100 },
        createRNG(seed)
      );
      const lowFitnessResult = simulateQuickMatch(
        config,
        { ...player, fitness: 30 },
        createRNG(seed)
      );
      highFitnessRatingSum += highFitnessResult.performance.rating;
      lowFitnessRatingSum += lowFitnessResult.performance.rating;
    }

    // Higher fitness should produce higher average rating
    expect(highFitnessRatingSum / runs).toBeGreaterThan(lowFitnessRatingSum / runs);
  });
});
