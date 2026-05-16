/**
 * Property-based tests d'intégration pour le ChampionsLeagueSystem.
 * Utilise fast-check avec vitest pour valider les propriétés universelles
 * du système principal de la Ligue des Champions.
 */

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { initSeason, simulateMatchday, checkTrophy } from './ChampionsLeagueSystem';
import { calculateBaseFollowersGain, calculateCLFollowersGain } from './CLStatsAndSocial';
import { createRNG } from '../../utils/random';
import type { CLParticipant, ChampionsLeagueState } from './types';
import type { MatchPerformance } from '../../core/types';
import { CL_CONSTANTS } from './types';

const NUM_RUNS = 100;

// ─── Générateurs ─────────────────────────────────────────────────────────────

/**
 * Génère un CLParticipant arbitraire avec une averageRating entre 60 et 88.
 */
const arbParticipant = (index: number): fc.Arbitrary<CLParticipant> =>
  fc.record({
    name: fc.string({ minLength: 1, maxLength: 20 }),
    country: fc.constantFrom('france', 'spain', 'england', 'italy', 'germany', 'portugal', 'netherlands'),
    averageRating: fc.integer({ min: 60, max: 88 }),
    isFiller: fc.boolean(),
  }).map((p) => ({
    ...p,
    id: `team-${index}`,
    name: p.name || `Team${index}`,
  }));

/**
 * Génère exactement 50 participants avec des IDs uniques.
 */
const arb50Participants: fc.Arbitrary<CLParticipant[]> = fc
  .tuple(...Array.from({ length: 50 }, (_, i) => arbParticipant(i)))
  .map((participants) => participants);

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('ChampionsLeagueSystem - Integration Property Tests', () => {
  // Feature: champions-league, Property 11: All matchday fixtures produce results when simulated
  describe('Property 11: All matchday fixtures produce results when simulated', () => {
    /**
     * **Validates: Requirements 5.3, 8.1**
     *
     * For any CL matchday with N scheduled fixtures, simulateMatchday() SHALL produce
     * exactly N match results, one for each fixture (minus the player's match if applicable).
     */
    it('simulateMatchday produces exactly N results for N fixtures (minus player match if applicable)', () => {
      fc.assert(
        fc.property(
          arb50Participants,
          fc.integer({ min: 1, max: 2 ** 31 - 1 }),
          fc.integer({ min: 1, max: CL_CONSTANTS.LEAGUE_PHASE_MATCHDAYS }),
          (participants, seed, matchday) => {
            const rng = createRNG(seed);
            const state = initSeason(participants, 2024, rng);

            // Simulate without a player club (all matches simulated)
            const rngSim = createRNG(seed + 1);
            const result = simulateMatchday(state, matchday, null, rngSim);

            // Count expected fixtures for this matchday
            const expectedFixtures = state.leagueSchedule.filter(
              (m) => m.matchday === matchday && m.phase === 'league'
            );

            // All fixtures should produce results (no player match to exclude)
            expect(result.results.length).toBe(expectedFixtures.length);
            expect(result.playerMatchScheduled).toBe(false);

            // Each result should correspond to a fixture
            for (const res of result.results) {
              expect(res.matchday).toBe(matchday);
              expect(res.phase).toBe('league');
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    it('simulateMatchday excludes exactly the player match when playerClubId is provided', () => {
      fc.assert(
        fc.property(
          arb50Participants,
          fc.integer({ min: 1, max: 2 ** 31 - 1 }),
          fc.integer({ min: 1, max: CL_CONSTANTS.LEAGUE_PHASE_MATCHDAYS }),
          (participants, seed, matchday) => {
            const rng = createRNG(seed);
            const state = initSeason(participants, 2024, rng);

            // Pick the first participant as the player's club
            const playerClubId = participants[0].id;

            const rngSim = createRNG(seed + 1);
            const result = simulateMatchday(state, matchday, playerClubId, rngSim);

            // Count expected fixtures for this matchday
            const allFixtures = state.leagueSchedule.filter(
              (m) => m.matchday === matchday && m.phase === 'league'
            );

            // Check if the player has a match this matchday
            const playerFixture = allFixtures.find(
              (m) => m.homeTeamId === playerClubId || m.awayTeamId === playerClubId
            );

            if (playerFixture) {
              // Player match excluded: results = total fixtures - 1
              expect(result.results.length).toBe(allFixtures.length - 1);
              expect(result.playerMatchScheduled).toBe(true);

              // Verify player's match is NOT in results
              const playerInResults = result.results.some(
                (r) => r.homeTeamId === playerClubId || r.awayTeamId === playerClubId
              );
              expect(playerInResults).toBe(false);
            } else {
              // Player has no match this matchday: all fixtures simulated
              expect(result.results.length).toBe(allFixtures.length);
              expect(result.playerMatchScheduled).toBe(false);
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });

  // Feature: champions-league, Property 14: Instagram prestige multiplier is exactly 2× for CL matches
  describe('Property 14: Instagram prestige multiplier is exactly 2× for CL matches', () => {
    /**
     * **Validates: Requirements 6.4**
     *
     * For any player performance, the Instagram follower gain from a CL match SHALL be
     * exactly 2 times the gain that the same performance would produce in a league match.
     */

    const arbMatchPerformance: fc.Arbitrary<MatchPerformance> = fc.record({
      rating: fc.integer({ min: 1, max: 10 }),
      goals: fc.integer({ min: 0, max: 5 }),
      assists: fc.integer({ min: 0, max: 5 }),
      minutesPlayed: fc.integer({ min: 1, max: 90 }),
      shots: fc.integer({ min: 0, max: 10 }),
      passAccuracy: fc.integer({ min: 0, max: 100 }),
      dribbles: fc.integer({ min: 0, max: 10 }),
      tackles: fc.integer({ min: 0, max: 10 }),
    });

    const arbClubTier = fc.constantFrom<'small' | 'medium' | 'big'>('small', 'medium', 'big');

    it('calculateCLFollowersGain is exactly 2× calculateBaseFollowersGain for same performance and RNG seed', () => {
      fc.assert(
        fc.property(
          arbMatchPerformance,
          arbClubTier,
          fc.integer({ min: 1, max: 2 ** 31 - 1 }),
          (performance, clubTier, seed) => {
            // Use the same RNG seed for both calls so internal randomness is identical
            const rngBase = createRNG(seed);
            const rngCL = createRNG(seed);

            const baseGain = calculateBaseFollowersGain(performance, clubTier, rngBase);
            const clGain = calculateCLFollowersGain(performance, clubTier, rngCL);

            expect(clGain).toBe(baseGain * 2);
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });

  // Feature: champions-league, Property 15: Trophy is awarded if and only if player's club wins the final
  describe('Property 15: Trophy is awarded if and only if player\'s club wins the final', () => {
    /**
     * **Validates: Requirements 9.1**
     *
     * For any final match result, checkTrophy() SHALL return a valid Champions League
     * trophy if and only if the player's club is the winner of the final.
     */
    it('checkTrophy returns a trophy iff the player club is the final winner', () => {
      fc.assert(
        fc.property(
          arb50Participants,
          fc.integer({ min: 0, max: 49 }),
          fc.integer({ min: 0, max: 49 }),
          fc.integer({ min: 0, max: 49 }),
          fc.integer({ min: 2020, max: 2040 }),
          (participants, playerIdx, winnerIdx, loserIdx, season) => {
            // Ensure winner and loser are different
            const actualLoserIdx = loserIdx === winnerIdx ? (winnerIdx + 1) % 50 : loserIdx;
            const playerClubId = participants[playerIdx].id;
            const winnerId = participants[winnerIdx].id;
            const loserId = participants[actualLoserIdx].id;

            // Create a state where the final has been played with a winner
            const state: ChampionsLeagueState = {
              season,
              participants,
              phase: 'finished',
              currentMatchday: 8,
              leagueSchedule: [],
              leagueResults: [],
              standings: [],
              knockoutRound: 'final',
              knockoutBracket: {
                roundOf16: [],
                quarterFinals: [],
                semiFinals: [],
                final: {
                  homeTeam: participants[winnerIdx],
                  awayTeam: participants[actualLoserIdx],
                  firstLeg: {
                    matchday: 0,
                    homeTeamId: winnerId,
                    awayTeamId: loserId,
                    homeGoals: 2,
                    awayGoals: 1,
                    phase: 'final',
                  },
                  winner: winnerId,
                },
              },
              playerParticipating: true,
              playerEliminated: false,
              playerClubId,
            };

            const trophy = checkTrophy(state, playerClubId, season);

            if (playerClubId === winnerId) {
              // Player's club won → trophy should be awarded
              expect(trophy).not.toBeNull();
              expect(trophy!.type).toBe('champions_league');
              expect(trophy!.season).toBe(season);
              expect(trophy!.competition).toBe('Ligue des Champions');
            } else {
              // Player's club did NOT win → no trophy
              expect(trophy).toBeNull();
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    it('checkTrophy returns null when the final has not been played yet', () => {
      fc.assert(
        fc.property(
          arb50Participants,
          fc.integer({ min: 2020, max: 2040 }),
          (participants, season) => {
            const playerClubId = participants[0].id;

            // State where final has no winner yet
            const state: ChampionsLeagueState = {
              season,
              participants,
              phase: 'knockout',
              currentMatchday: 8,
              leagueSchedule: [],
              leagueResults: [],
              standings: [],
              knockoutRound: 'final',
              knockoutBracket: {
                roundOf16: [],
                quarterFinals: [],
                semiFinals: [],
                final: {
                  homeTeam: participants[0],
                  awayTeam: participants[1],
                  // No firstLeg, no winner
                },
              },
              playerParticipating: true,
              playerEliminated: false,
              playerClubId,
            };

            const trophy = checkTrophy(state, playerClubId, season);
            expect(trophy).toBeNull();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    it('checkTrophy returns null when there is no final at all', () => {
      fc.assert(
        fc.property(
          arb50Participants,
          fc.integer({ min: 2020, max: 2040 }),
          (participants, season) => {
            const playerClubId = participants[0].id;

            // State where final is null
            const state: ChampionsLeagueState = {
              season,
              participants,
              phase: 'league',
              currentMatchday: 4,
              leagueSchedule: [],
              leagueResults: [],
              standings: [],
              knockoutRound: null,
              knockoutBracket: {
                roundOf16: [],
                quarterFinals: [],
                semiFinals: [],
                final: null,
              },
              playerParticipating: true,
              playerEliminated: false,
              playerClubId,
            };

            const trophy = checkTrophy(state, playerClubId, season);
            expect(trophy).toBeNull();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });
  });
});
