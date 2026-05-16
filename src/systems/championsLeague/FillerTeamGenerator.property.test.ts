/**
 * Property-based test for FillerTeamGenerator.
 * Feature: champions-league, Property 3: Filler generation produces exactly 30 valid teams
 *
 * Validates: Requirements 1.3
 */

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { FillerTeamGenerator } from './FillerTeamGenerator';
import { CL_CONSTANTS } from './types';
import { createRNG } from '../../utils/random';

const NUM_RUNS = 100;

const MAIN_LEAGUE_COUNTRIES = ['france', 'england', 'spain', 'italy', 'germany'];

describe('FillerTeamGenerator - Property 3: Filler generation produces exactly 30 valid teams', () => {
  // Feature: champions-league, Property 3: Filler generation produces exactly 30 valid teams

  it('for any RNG seed, generateFillers() returns exactly 30 participants with valid properties', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        (seed) => {
          const rng = createRNG(seed);
          const fillers = FillerTeamGenerator.generate(rng);

          // Exactly 30 participants
          expect(fillers).toHaveLength(CL_CONSTANTS.TOTAL_FILLERS);

          // Each participant has valid properties
          for (const filler of fillers) {
            // Non-empty name
            expect(filler.name.length).toBeGreaterThan(0);

            // Non-empty country
            expect(filler.country.length).toBeGreaterThan(0);

            // averageRating between 60 and 80
            expect(filler.averageRating).toBeGreaterThanOrEqual(60);
            expect(filler.averageRating).toBeLessThanOrEqual(80);

            // isFiller set to true
            expect(filler.isFiller).toBe(true);

            // Country must NOT be from the 5 main leagues
            expect(MAIN_LEAGUE_COUNTRIES).not.toContain(filler.country.toLowerCase());
          }

          // All names must be unique within a single generation
          const names = fillers.map((f) => f.name);
          const uniqueNames = new Set(names);
          expect(uniqueNames.size).toBe(CL_CONSTANTS.TOTAL_FILLERS);
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
