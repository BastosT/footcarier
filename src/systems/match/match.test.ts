import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateActionProbability } from './ActionResolver';

describe('MatchEngine - Property Tests', () => {
  it('Property 11: Action resolution is bounded [0.05, 0.95] and monotone', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 99 }),
        fc.integer({ min: 1, max: 99 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (attackerRating, defenderRating, fitness, morale) => {
          const prob = calculateActionProbability(attackerRating, defenderRating, fitness, morale);

          // Bounded
          expect(prob).toBeGreaterThanOrEqual(0.05);
          expect(prob).toBeLessThanOrEqual(0.95);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('Property 11b: Higher attacker rating increases probability (monotonicity)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 98 }),
        fc.integer({ min: 1, max: 99 }),
        fc.integer({ min: 50, max: 100 }),
        fc.integer({ min: 50, max: 100 }),
        (attackerRating, defenderRating, fitness, morale) => {
          const probLow = calculateActionProbability(attackerRating, defenderRating, fitness, morale);
          const probHigh = calculateActionProbability(attackerRating + 1, defenderRating, fitness, morale);

          // Higher attacker stat should give equal or higher probability
          expect(probHigh).toBeGreaterThanOrEqual(probLow);
        }
      ),
      { numRuns: 200 }
    );
  });
});
