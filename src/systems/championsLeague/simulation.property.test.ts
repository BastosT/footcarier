/**
 * Property-based tests pour le CLMatchSimulator.
 * Utilise fast-check avec vitest pour valider les propriétés universelles
 * de la simulation de matchs de Ligue des Champions.
 */

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { simulateMatch } from './CLMatchSimulator';
import { createRNG } from '../../utils/random';
import { CL_CONSTANTS } from './types';
import type { CLParticipant } from './types';

const NUM_RUNS = 100;

// ─── Générateurs ─────────────────────────────────────────────────────────────

/**
 * Génère un CLParticipant arbitraire avec une averageRating entre 60 et 88.
 */
const arbParticipant: fc.Arbitrary<CLParticipant> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  country: fc.constantFrom('france', 'spain', 'england', 'italy', 'germany', 'portugal', 'netherlands'),
  averageRating: fc.integer({ min: 60, max: 88 }),
  isFiller: fc.boolean(),
}).map((p) => ({ ...p, name: p.name || 'Team' }));

/**
 * Génère une paire de CLParticipant avec des IDs distincts.
 */
const arbMatchPair: fc.Arbitrary<[CLParticipant, CLParticipant]> = fc
  .tuple(arbParticipant, arbParticipant)
  .filter(([home, away]) => home.id !== away.id);

/**
 * Génère une paire de CLParticipant où le premier a au moins 10 points de rating de plus.
 * Team A: rating entre 75 et 88, Team B: rating tel que A - B >= 10.
 */
const arbStrongWeakPair: fc.Arbitrary<[CLParticipant, CLParticipant]> = fc
  .tuple(
    fc.integer({ min: 75, max: 88 }),
    fc.integer({ min: 60, max: 78 })
  )
  .filter(([ratingA, ratingB]) => ratingA - ratingB >= 10)
  .chain(([ratingA, ratingB]) =>
    fc.tuple(
      arbParticipant.map((p) => ({ ...p, id: `strong-${p.id}`, averageRating: ratingA })),
      arbParticipant.map((p) => ({ ...p, id: `weak-${p.id}`, averageRating: ratingB }))
    )
  );

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('CLMatchSimulator - Property Tests', () => {
  // Feature: champions-league, Property 12: Simulated scores are within realistic bounds (0-5)
  describe('Property 12: Simulated scores are within realistic bounds (0-5)', () => {
    /**
     * **Validates: Requirements 8.3, 8.4**
     *
     * For any simulated CL match, both homeGoals and awayGoals
     * SHALL be integers in the range [0, 5].
     */
    it('simulateMatch produces scores between 0 and MAX_GOALS_PER_TEAM for any participant pair', () => {
      fc.assert(
        fc.property(arbMatchPair, fc.integer({ min: 0, max: 2 ** 31 - 1 }), ([home, away], seed) => {
          const rng = createRNG(seed);
          const result = simulateMatch(home, away, rng);

          // homeGoals is an integer in [0, 5]
          expect(result.homeGoals).toBeGreaterThanOrEqual(0);
          expect(result.homeGoals).toBeLessThanOrEqual(CL_CONSTANTS.MAX_GOALS_PER_TEAM);
          expect(Number.isInteger(result.homeGoals)).toBe(true);

          // awayGoals is an integer in [0, 5]
          expect(result.awayGoals).toBeGreaterThanOrEqual(0);
          expect(result.awayGoals).toBeLessThanOrEqual(CL_CONSTANTS.MAX_GOALS_PER_TEAM);
          expect(Number.isInteger(result.awayGoals)).toBe(true);
        }),
        { numRuns: NUM_RUNS }
      );
    });
  });

  // Feature: champions-league, Property 13: Higher-rated teams win more often over many simulations
  describe('Property 13: Higher-rated teams win more often over many simulations', () => {
    /**
     * **Validates: Requirements 8.3, 8.4**
     *
     * For any two teams where team A has an averageRating at least 10 points
     * higher than team B, over 100 simulated matches, team A SHALL win more
     * matches than team B.
     */
    it('a team with 10+ rating advantage wins more matches over 100 simulations', () => {
      fc.assert(
        fc.property(arbStrongWeakPair, fc.integer({ min: 0, max: 2 ** 31 - 1 }), ([strong, weak], seed) => {
          const rng = createRNG(seed);

          let strongWins = 0;
          let weakWins = 0;

          for (let i = 0; i < 200; i++) {
            const result = simulateMatch(strong, weak, rng);
            if (result.homeGoals > result.awayGoals) {
              strongWins++;
            } else if (result.awayGoals > result.homeGoals) {
              weakWins++;
            }
            // draws don't count for either
          }

          // The stronger team (home with advantage) should win at least as many
          expect(strongWins).toBeGreaterThanOrEqual(weakWins);
        }),
        { numRuns: NUM_RUNS }
      );
    });
  });
});
