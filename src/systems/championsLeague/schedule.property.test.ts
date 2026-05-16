/**
 * Property-based tests for CLScheduleGenerator date assignment.
 * Feature: champions-league, Property 9: CL schedule dates are exclusively Tuesday or Wednesday
 * Feature: champions-league, Property 10: No CL match conflicts with player's league match
 *
 * Validates: Requirements 4.2, 4.7
 */

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { generateLeaguePhaseFixtures, assignDates } from './CLScheduleGenerator';
import { CL_CONSTANTS } from './types';
import type { CLParticipant, CLFixture } from './types';
import type { GameDate, ScheduledMatch } from '../../core/types';
import { createRNG } from '../../utils/random';

const NUM_RUNS = 100;

/**
 * Helper: converts a GameDate to a JavaScript Date to check weekday.
 */
function gameDateToJSDate(date: GameDate): Date {
  return new Date(date.year, date.month - 1, date.day);
}

/**
 * Generates a valid set of 50 CLParticipant objects with unique IDs.
 */
function make50Participants(seed: number): CLParticipant[] {
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
}

/**
 * Generates a realistic player club schedule with weekend matches (Saturday/Sunday)
 * for a given season, to test conflict avoidance.
 */
function generatePlayerClubSchedule(season: number, clubId: string, seed: number): ScheduledMatch[] {
  const rng = createRNG(seed);
  const matches: ScheduledMatch[] = [];

  // Generate ~34 league matches on weekends (Saturday=6, Sunday=0) from August to May
  const months = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];
  let matchday = 1;

  for (const month of months) {
    const year = month >= 8 ? season : season + 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const jsDate = new Date(year, month - 1, day);
      const weekday = jsDate.getDay();
      // Saturday (6) or Sunday (0)
      if (weekday === 6 || weekday === 0) {
        if (rng.random() < 0.4 && matchday <= 38) {
          matches.push({
            date: { day, month, year },
            homeTeam: rng.random() < 0.5 ? clubId : 'opponent-club',
            awayTeam: rng.random() < 0.5 ? 'opponent-club' : clubId,
            competition: 'Ligue 1',
            matchday: matchday++,
          });
        }
      }
    }
  }

  return matches;
}

describe('CLScheduleGenerator - Property 9: CL schedule dates are exclusively Tuesday or Wednesday', () => {
  // Feature: champions-league, Property 9: CL schedule dates are exclusively Tuesday or Wednesday

  it('for any generated CL league phase schedule, every match date is a Tuesday (2) or Wednesday (3)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        fc.integer({ min: 2020, max: 2030 }),
        (seed, season) => {
          const participants = make50Participants(seed);
          const rng = createRNG(seed);
          const fixtures = generateLeaguePhaseFixtures(participants, rng);

          // Use an empty player schedule to avoid filtering out dates
          const scheduled = assignDates(fixtures, season, []);

          // Every scheduled match date must be Tuesday (2) or Wednesday (3)
          for (const match of scheduled) {
            const jsDate = gameDateToJSDate(match.date);
            const weekday = jsDate.getDay();
            // Tuesday = 2, Wednesday = 3
            expect(
              weekday === 2 || weekday === 3,
              `Match on ${match.date.day}/${match.date.month}/${match.date.year} is weekday ${weekday} (expected 2 or 3)`
            ).toBe(true);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});

describe('CLScheduleGenerator - Property 10: No CL match conflicts with player\'s league match', () => {
  // Feature: champions-league, Property 10: No CL match conflicts with player's league match

  it('for any generated CL schedule and player league schedule, no date has both a CL match and a league match for the player club', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        (seed, season, scheduleSeed) => {
          const playerClubId = 'team-0-' + seed;
          const participants = make50Participants(seed);
          const rng = createRNG(seed);
          const fixtures = generateLeaguePhaseFixtures(participants, rng);

          // Generate a player club schedule with some weekend matches
          const playerSchedule = generatePlayerClubSchedule(season, playerClubId, scheduleSeed);

          // Assign dates avoiding conflicts
          const scheduled = assignDates(fixtures, season, playerSchedule);

          // Build a set of player match dates
          const playerMatchDateKeys = new Set(
            playerSchedule.map((m) => `${m.date.year}-${m.date.month}-${m.date.day}`)
          );

          // Find CL matches involving the player's club
          const playerCLMatches = scheduled.filter(
            (m) => m.homeTeamId === playerClubId || m.awayTeamId === playerClubId
          );

          // No CL match for the player's club should fall on a league match day
          for (const clMatch of playerCLMatches) {
            const key = `${clMatch.date.year}-${clMatch.date.month}-${clMatch.date.day}`;
            expect(
              playerMatchDateKeys.has(key),
              `CL match on ${clMatch.date.day}/${clMatch.date.month}/${clMatch.date.year} conflicts with a league match`
            ).toBe(false);
          }
        }
      ),
      { numRuns: NUM_RUNS }
    );
  });
});
