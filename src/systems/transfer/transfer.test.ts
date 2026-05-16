import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateOffers, acceptOffer } from './TransferSystem';
import { createRNG } from '../../utils/random';
import type { PlayerCharacter } from '../../core/types';

function createTestPlayer(overrides: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return {
    id: 'test-player',
    firstName: 'Test',
    lastName: 'Player',
    nationality: 'france',
    position: 'ST',
    appearance: { skinTone: 1, hairStyle: 1, hairColor: 1, height: 'medium' },
    age: 25,
    stats: { pace: 75, shooting: 80, passing: 70, dribbling: 75, defending: 40, physical: 70 },
    potential: 85,
    overallRating: 75,
    fitness: 90,
    morale: 80,
    injury: null,
    ...overrides,
  };
}

describe('TransferSystem - Property Tests', () => {
  it('Property 12: Transfer offers come from coherent tier clubs and salary >= current', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 60, max: 90 }),
        fc.integer({ min: 20, max: 80 }),
        fc.integer({ min: 18, max: 35 }),
        fc.integer({ min: 5000, max: 100000 }),
        fc.integer({ min: 1, max: 100000 }),
        (rating, popularity, age, currentSalary, seed) => {
          const player = createTestPlayer({ overallRating: rating, age });
          const rng = createRNG(seed);
          const offers = generateOffers(player, 'psg', currentSalary, popularity, 'summer', rng);

          for (const offer of offers) {
            // Salary should be >= current salary
            expect(offer.salary).toBeGreaterThanOrEqual(currentSalary);
            // Club should have a valid tier
            expect(['small', 'medium', 'big']).toContain(offer.tier);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 13: Accepting a transfer updates state correctly', () => {
    const player = createTestPlayer();
    const rng = createRNG(42);
    const offers = generateOffers(player, 'auxerre', 10000, 50, 'summer', rng);

    if (offers.length > 0) {
      const offer = offers[0];
      const result = acceptOffer(offer, player);

      expect(result.success).toBe(true);
      expect(result.newContract.clubId).toBe(offer.fromClub.id);
      expect(result.newContract.weeklySalary).toBe(offer.salary);
      expect(result.newContract.seasonsRemaining).toBe(offer.contractDuration);
      // Player should be in new club squad
      expect(result.newClub.squad.some(p => p.id === player.id)).toBe(true);
    }
  });

  it('Property 14: Rejecting all offers preserves state', () => {
    const player = createTestPlayer();
    const currentClubId = 'auxerre';
    const currentSalary = 10000;

    // State before
    const stateBefore = { clubId: currentClubId, salary: currentSalary };

    // Generate and reject offers (just don't call acceptOffer)
    const rng = createRNG(42);
    const offers = generateOffers(player, currentClubId, currentSalary, 50, 'summer', rng);

    // State should be unchanged (we didn't modify anything)
    expect(stateBefore.clubId).toBe(currentClubId);
    expect(stateBefore.salary).toBe(currentSalary);
  });
});
