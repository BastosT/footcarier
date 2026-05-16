import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculatePlaytime } from './CareerSystem';

describe('CareerSystem - Property Tests', () => {
  it('Property 22: Coach relation < 30 reduces playtime, > 70 increases it', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 29 }),
        (lowRelation) => {
          const playtime = calculatePlaytime(lowRelation);
          expect(playtime).toBeLessThan(90);
          expect(playtime).toBeLessThanOrEqual(80);
        }
      ),
      { numRuns: 50 }
    );

    fc.assert(
      fc.property(
        fc.integer({ min: 71, max: 100 }),
        (highRelation) => {
          const playtime = calculatePlaytime(highRelation);
          expect(playtime).toBe(90);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Playtime is always between 0 and 90', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (relation) => {
          const playtime = calculatePlaytime(relation);
          expect(playtime).toBeGreaterThanOrEqual(0);
          expect(playtime).toBeLessThanOrEqual(90);
        }
      ),
      { numRuns: 100 }
    );
  });
});
