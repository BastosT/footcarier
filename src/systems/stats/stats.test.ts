import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateOverallRating, getProgressionRate, applyAgingDecay } from './StatsSystem';
import { generateInitialStats, updateStatsAfterTraining } from './ProgressionEngine';
import { createRNG } from '../../utils/random';
import type { PlayerStats, Position, TrainingSession } from '../../core/types';

const positionArb = fc.constantFrom<Position>('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST');

const playerStatsArb = fc.record({
  pace: fc.integer({ min: 1, max: 99 }),
  shooting: fc.integer({ min: 1, max: 99 }),
  passing: fc.integer({ min: 1, max: 99 }),
  dribbling: fc.integer({ min: 1, max: 99 }),
  defending: fc.integer({ min: 1, max: 99 }),
  physical: fc.integer({ min: 1, max: 99 }),
});

describe('StatsSystem - Property Tests', () => {
  it('Property 25: calculateOverallRating always returns a value in [1, 99]', () => {
    fc.assert(
      fc.property(playerStatsArb, positionArb, (stats, position) => {
        const rating = calculateOverallRating(stats, position);
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(99);
        expect(Number.isInteger(rating)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('Property 3: Initial stats are weighted according to position', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 60, max: 95 }),
        fc.integer({ min: 1, max: 100000 }),
        (potential, seed) => {
          const rng = createRNG(seed);

          // Attacker: shooting > defending
          const stStats = generateInitialStats('ST', potential, rng);
          expect(stStats.shooting).toBeGreaterThan(stStats.defending);

          // Defender: defending > shooting
          const rng2 = createRNG(seed + 1);
          const cbStats = generateInitialStats('CB', potential, rng2);
          expect(cbStats.defending).toBeGreaterThan(cbStats.shooting);

          // Winger: pace and dribbling > defending
          const rng3 = createRNG(seed + 2);
          const lwStats = generateInitialStats('LW', potential, rng3);
          expect(lwStats.pace).toBeGreaterThan(lwStats.defending);
          expect(lwStats.dribbling).toBeGreaterThan(lwStats.defending);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4: Trained stat does not exceed potential after progression', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 99 }),
        fc.integer({ min: 1, max: 99 }),
        fc.constantFrom<'low' | 'medium' | 'high'>('low', 'medium', 'high'),
        fc.constantFrom<keyof PlayerStats>('pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'),
        (potential, overallRating, intensity, skill) => {
          // Start with stats that are below potential
          const stats: PlayerStats = {
            pace: Math.min(potential - 1, 50),
            shooting: Math.min(potential - 1, 50),
            passing: Math.min(potential - 1, 50),
            dribbling: Math.min(potential - 1, 50),
            defending: Math.min(potential - 1, 50),
            physical: Math.min(potential - 1, 50),
          };
          const session: TrainingSession = { skill, intensity, isRehabilitation: false };
          const newStats = updateStatsAfterTraining(stats, session, potential, overallRating);

          // The trained skill must not exceed potential
          expect(newStats[skill]).toBeLessThanOrEqual(potential);
          expect(newStats[skill]).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('Property 5: Progression slows down at 80% of potential', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 70, max: 99 }),
        (potential) => {
          // Player below 80% threshold
          const ratingBelow = Math.floor(potential * 0.7);
          const rateBelow = getProgressionRate(ratingBelow, potential);

          // Player at or above 80% threshold
          const ratingAbove = Math.floor(potential * 0.85);
          const rateAbove = getProgressionRate(ratingAbove, potential);

          expect(rateAbove).toBeLessThan(rateBelow);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6: Physical stats decay after age 30, proportional to (age - 30)', () => {
    fc.assert(
      fc.property(
        // Use stats high enough that decay won't hit the floor
        fc.record({
          pace: fc.integer({ min: 40, max: 99 }),
          shooting: fc.integer({ min: 1, max: 99 }),
          passing: fc.integer({ min: 1, max: 99 }),
          dribbling: fc.integer({ min: 1, max: 99 }),
          defending: fc.integer({ min: 1, max: 99 }),
          physical: fc.integer({ min: 40, max: 99 }),
        }),
        fc.integer({ min: 32, max: 38 }), // Start at 32 to ensure decay >= 1
        (stats, age) => {
          const decayed = applyAgingDecay(age, stats);

          // Pace and physical should decrease
          expect(decayed.pace).toBeLessThan(stats.pace);
          expect(decayed.physical).toBeLessThan(stats.physical);

          // Older players decay more
          const decayedOlder = applyAgingDecay(age + 1, stats);
          expect(decayedOlder.pace).toBeLessThanOrEqual(decayed.pace);
          expect(decayedOlder.physical).toBeLessThanOrEqual(decayed.physical);

          // Other stats unchanged
          expect(decayed.shooting).toBe(stats.shooting);
          expect(decayed.passing).toBe(stats.passing);
          expect(decayed.dribbling).toBe(stats.dribbling);
          expect(decayed.defending).toBe(stats.defending);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('No aging decay for players 30 or younger', () => {
    fc.assert(
      fc.property(
        playerStatsArb,
        fc.integer({ min: 16, max: 30 }),
        (stats, age) => {
          const result = applyAgingDecay(age, stats);
          expect(result).toEqual(stats);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 15: Training increases targeted skill proportional to intensity', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<keyof PlayerStats>('pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'),
        fc.integer({ min: 80, max: 99 }),
        (skill, potential) => {
          // Start with low stats so there's room to grow
          const stats: PlayerStats = { pace: 40, shooting: 40, passing: 40, dribbling: 40, defending: 40, physical: 40 };
          const overallRating = 40;

          const lowSession: TrainingSession = { skill, intensity: 'low', isRehabilitation: false };
          const highSession: TrainingSession = { skill, intensity: 'high', isRehabilitation: false };

          const afterLow = updateStatsAfterTraining(stats, lowSession, potential, overallRating);
          const afterHigh = updateStatsAfterTraining(stats, highSession, potential, overallRating);

          // High intensity should give more gain than low
          expect(afterHigh[skill]).toBeGreaterThanOrEqual(afterLow[skill]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
