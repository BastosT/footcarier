/**
 * Property-based tests pour la qualification à la Ligue des Champions.
 * Utilise fast-check avec vitest pour valider les propriétés universelles
 * du système de qualification.
 */

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { qualify, extractQualifiedTeams, isPlayerClubQualified } from './qualification';
import { createRNG } from '../../utils/random';
import { CL_CONSTANTS } from './types';
import type { LeagueState, LeagueStanding, Country, Division } from '../../core/types';

const NUM_RUNS = 100;

// ─── Générateurs ─────────────────────────────────────────────────────────────

const countries: Country[] = ['france', 'spain', 'england', 'italy', 'germany'];

/**
 * Génère un classement de ligue valide avec au moins `minTeams` équipes.
 * Chaque équipe a une position unique de 1 à N.
 */
function arbLeagueStandings(minTeams: number = 4): fc.Arbitrary<LeagueStanding[]> {
  return fc
    .integer({ min: minTeams, max: 20 })
    .chain((teamCount) =>
      fc
        .array(
          fc.record({
            played: fc.integer({ min: 30, max: 38 }),
            won: fc.integer({ min: 0, max: 38 }),
            drawn: fc.integer({ min: 0, max: 38 }),
            lost: fc.integer({ min: 0, max: 38 }),
            goalsFor: fc.integer({ min: 0, max: 120 }),
            goalsAgainst: fc.integer({ min: 0, max: 120 }),
            points: fc.integer({ min: 0, max: 114 }),
          }),
          { minLength: teamCount, maxLength: teamCount }
        )
        .map((stats) =>
          stats.map((s, i) => ({
            clubId: `club-${i + 1}`,
            clubName: `Club ${i + 1}`,
            played: s.played,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            points: s.points,
            position: i + 1,
          }))
        )
    );
}

/**
 * Génère un LeagueState valide pour un pays donné avec au moins 4 équipes.
 */
function arbLeagueState(country: Country): fc.Arbitrary<LeagueState> {
  return arbLeagueStandings(4).map((standings) => {
    // Prefix club IDs with country to ensure uniqueness across leagues
    const countryStandings = standings.map((s) => ({
      ...s,
      clubId: `${country}-${s.clubId}`,
      clubName: `${country} ${s.clubName}`,
    }));

    const division: Division = {
      country,
      level: 1,
      name: `${country} League`,
    };

    return {
      division,
      standings: countryStandings,
      results: [],
      season: 1,
      topScorers: [],
      schedule: [],
    };
  });
}

/**
 * Génère un ensemble de 5 LeagueState (un par pays) avec au moins 4 équipes chacun.
 */
const arbFiveLeagues: fc.Arbitrary<LeagueState[]> = fc.tuple(
  arbLeagueState('france'),
  arbLeagueState('spain'),
  arbLeagueState('england'),
  arbLeagueState('italy'),
  arbLeagueState('germany')
).map(([fr, sp, en, it, de]) => [fr, sp, en, it, de]);

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('qualification - Property Tests', () => {
  // Feature: champions-league, Property 1: Qualification produces exactly 20 teams from top 4 of each league
  describe('Property 1: Qualification produces exactly 20 teams from top 4 of each league', () => {
    /**
     * **Validates: Requirements 1.1, 1.2**
     *
     * For any set of 5 league standings (each with at least 4 teams),
     * the qualify() function SHALL return exactly 20 qualified teams (non-filler),
     * and for each league, the 4 returned teams SHALL be exactly the teams
     * at positions 1-4 in that league's standings.
     */
    it('qualify() returns exactly 20 qualified teams from top 4 of each league', () => {
      fc.assert(
        fc.property(arbFiveLeagues, fc.integer({ min: 1, max: 100 }), (leagues, seed) => {
          const rng = createRNG(seed);
          const participants = qualify(leagues, 1, rng);

          // Total participants = 50 (20 qualified + 30 fillers)
          expect(participants).toHaveLength(CL_CONSTANTS.TOTAL_PARTICIPANTS);

          // Exactly 20 non-filler teams
          const qualified = participants.filter((p) => !p.isFiller);
          expect(qualified).toHaveLength(CL_CONSTANTS.TOTAL_QUALIFIED);

          // For each league, exactly 4 qualified teams
          for (const league of leagues) {
            const country = league.division.country;
            const fromCountry = qualified.filter((p) => p.country === country);
            expect(fromCountry).toHaveLength(CL_CONSTANTS.QUALIFIED_PER_LEAGUE);

            // The 4 qualified teams must correspond to positions 1-4
            const top4ClubIds = [...league.standings]
              .sort((a, b) => a.position - b.position)
              .slice(0, 4)
              .map((s) => s.clubId);

            const qualifiedClubIds = fromCountry.map((p) => p.clubId);
            for (const clubId of top4ClubIds) {
              expect(qualifiedClubIds).toContain(clubId);
            }
          }
        }),
        { numRuns: NUM_RUNS }
      );
    });
  });

  // Feature: champions-league, Property 2: Player club qualification is determined by league position
  describe('Property 2: Player club qualification is determined by league position', () => {
    /**
     * **Validates: Requirements 1.4, 1.5**
     *
     * For any league standings and player club position, the player's club
     * SHALL be included in the qualified list if and only if its final position
     * is 1, 2, 3, or 4 in its league.
     */
    it('isPlayerClubQualified returns true iff position <= 4', () => {
      fc.assert(
        fc.property(
          arbFiveLeagues,
          fc.constantFrom(...countries),
          (leagues, targetCountry) => {
            const league = leagues.find((l) => l.division.country === targetCountry)!;
            const teamCount = league.standings.length;

            // Pick a random position in the league
            for (let position = 1; position <= teamCount; position++) {
              const standing = league.standings.find((s) => s.position === position)!;
              const playerClubId = standing.clubId;

              const isQualified = isPlayerClubQualified(leagues, playerClubId);

              if (position <= CL_CONSTANTS.QUALIFIED_PER_LEAGUE) {
                expect(isQualified).toBe(true);
              } else {
                expect(isQualified).toBe(false);
              }
            }
          }
        ),
        { numRuns: NUM_RUNS }
      );
    });

    it('player club not in any league returns false', () => {
      fc.assert(
        fc.property(arbFiveLeagues, (leagues) => {
          const result = isPlayerClubQualified(leagues, 'non-existent-club-xyz');
          expect(result).toBe(false);
        }),
        { numRuns: NUM_RUNS }
      );
    });
  });
});
