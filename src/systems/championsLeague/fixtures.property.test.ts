/**
 * Property-based test for CLScheduleGenerator fixture generation.
 * Feature: champions-league, Property 4: Fixture generation gives each team exactly 8 matches against 8 distinct opponents
 *
 * Validates: Requirements 2.2, 2.3
 */

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { generateLeaguePhaseFixtures } from './CLScheduleGenerator';
import { CL_CONSTANTS } from './types';
import type { CLParticipant } from './types';
import { createRNG } from '../../utils/random';

const NUM_RUNS = 100;

/**
 * Generates a valid set of 50 CLParticipant objects with unique IDs.
 */
const arb50Participants = fc
  .integer({ min: 0, max: 2 ** 31 - 1 })
  .map((seed): CLParticipant[] => {
    const participants: CLParticipant[] = [];
    for (let i = 0; i < CL_CONSTANTS.TOTAL_PARTICIPANTS; i++) {
      participants.push({
        id: `team-${i}-${seed}`,
        name: `Team ${i}`,
        country: ['france', 'spain', 'england', 'italy', 'germany', 'portugal', 'netherlands'][i % 7],
        averageRating: 60 + (i % 29),
        isFiller: i >= 20,
      });
    }
    return participants;
  });

describe('CLScheduleGenerator - Property 4: Fixture generation gives each team exactly 8 matches against 8 distinct opponents', () => {
  // Feature: champions-league, Property 4: Fixture generation gives each team exactly 8 matches against 8 distinct opponents

  it('for any set of exactly 50 participants, each team appears exactly 4 times as home and 4 times as away, with 8 distinct opponents', () => {
    fc.assert(
      fc.property(
        arb50Participants,
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        (participants, seed) => {
          const rng = createRNG(seed);
          const fixtures = generateLeaguePhaseFixtures(participants, rng);

          // Count home and away appearances for each team
          const homeCount = new Map<string, number>();
          const awayCount = new Map<string, number>();
          const opponents = new Map<string, Set<string>>();

          for (const p of participants) {
            homeCount.set(p.id, 0);
            awayCount.set(p.id, 0);
            opponents.set(p.id, new Set());
          }

          for (const fixture of fixtures) {
            homeCount.set(fixture.homeTeamId, (homeCount.get(fixture.homeTeamId) ?? 0) + 1);
            awayCount.set(fixture.awayTeamId, (awayCount.get(fixture.awayTeamId) ?? 0) + 1);
            opponents.get(fixture.homeTeamId)!.add(fixture.awayTeamId);
            opponents.get(fixture.awayTeamId)!.add(fixture.homeTeamId);
          }

          // Each team plays exactly 4 home matches
          for (const p of participants) {
            expect(homeCount.get(p.id)).toBe(CL_CONSTANTS.HOME_MATCHES);
          }

          // Each team plays exactly 4 away matches
          for (const p of participants) {
            expect(awayCount.get(p.id)).toBe(CL_CONSTANTS.AWAY_MATCHES);
          }

          // Each team has exactly 8 distinct opponents
          for (const p of participants) {
            expect(opponents.get(p.id)!.size).toBe(CL_CONSTANTS.MATCHES_PER_TEAM);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
