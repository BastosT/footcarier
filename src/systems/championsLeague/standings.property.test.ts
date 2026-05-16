/**
 * Property-based tests pour le classement et la résolution de la phase de ligue.
 * Utilise fast-check avec vitest pour valider les propriétés universelles
 * du système de classement de la Ligue des Champions.
 */

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { updateStandings, resolveLeaguePhase, classifyPosition } from './standings';
import { CL_CONSTANTS } from './types';
import type {
  ChampionsLeagueState,
  CLMatchResult,
  CLStanding,
  CLParticipant,
} from './types';

const NUM_RUNS = 100;

// ─── Générateurs ─────────────────────────────────────────────────────────────

const countries = ['france', 'spain', 'england', 'italy', 'germany', 'portugal', 'netherlands'];

/**
 * Génère un CLParticipant valide avec un id basé sur l'index.
 */
function makeParticipant(index: number, name?: string, country?: string): CLParticipant {
  return {
    id: `team-${index}`,
    name: name ?? `Team ${index}`,
    country: country ?? countries[index % countries.length],
    averageRating: 70,
    isFiller: index >= 20,
  };
}

/**
 * Génère un ensemble de 50 participants pour la phase de ligue.
 */
function make50Participants(): CLParticipant[] {
  return Array.from({ length: 50 }, (_, i) => makeParticipant(i));
}

/**
 * Génère un état CL minimal avec 50 participants et aucun résultat existant.
 */
function makeEmptyState(participants: CLParticipant[]): ChampionsLeagueState {
  return {
    season: 1,
    participants,
    phase: 'league',
    currentMatchday: 1,
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
    playerParticipating: false,
    playerEliminated: false,
    playerClubId: null,
  };
}

/**
 * Générateur de résultats de matchs de phase de ligue entre les 50 participants.
 * Génère des matchs aléatoires entre des paires d'équipes distinctes.
 */
function arbLeagueMatchResults(participants: CLParticipant[]): fc.Arbitrary<CLMatchResult[]> {
  const teamIds = participants.map((p) => p.id);

  const arbSingleResult = fc.record({
    homeIndex: fc.integer({ min: 0, max: teamIds.length - 1 }),
    awayOffset: fc.integer({ min: 1, max: teamIds.length - 1 }),
    homeGoals: fc.integer({ min: 0, max: CL_CONSTANTS.MAX_GOALS_PER_TEAM }),
    awayGoals: fc.integer({ min: 0, max: CL_CONSTANTS.MAX_GOALS_PER_TEAM }),
    matchday: fc.integer({ min: 1, max: 8 }),
  }).map(({ homeIndex, awayOffset, homeGoals, awayGoals, matchday }) => {
    const awayIndex = (homeIndex + awayOffset) % teamIds.length;
    return {
      matchday,
      homeTeamId: teamIds[homeIndex],
      awayTeamId: teamIds[awayIndex],
      homeGoals,
      awayGoals,
      phase: 'league' as const,
    };
  });

  return fc.array(arbSingleResult, { minLength: 1, maxLength: 200 });
}

/**
 * Génère un CLStanding valide avec des statistiques cohérentes.
 */
function arbStanding(participantId: string, participantName: string, country: string): fc.Arbitrary<CLStanding> {
  return fc.record({
    played: fc.integer({ min: 0, max: 8 }),
    won: fc.integer({ min: 0, max: 8 }),
    drawn: fc.integer({ min: 0, max: 8 }),
    lost: fc.integer({ min: 0, max: 8 }),
    goalsFor: fc.integer({ min: 0, max: 40 }),
    goalsAgainst: fc.integer({ min: 0, max: 40 }),
    points: fc.integer({ min: 0, max: 24 }),
  }).map((stats) => ({
    participantId,
    participantName,
    country,
    played: stats.played,
    won: stats.won,
    drawn: stats.drawn,
    lost: stats.lost,
    goalsFor: stats.goalsFor,
    goalsAgainst: stats.goalsAgainst,
    points: stats.points,
    position: 0, // Will be assigned after sorting
  }));
}

/**
 * Génère un tableau de 50 standings triés (simulant un classement final).
 */
function arb50SortedStandings(): fc.Arbitrary<CLStanding[]> {
  const participants = make50Participants();

  return fc.tuple(
    ...participants.map((p) => arbStanding(p.id, p.name, p.country))
  ).map((standings) => {
    // Sort by points desc, then goal diff desc, then goals scored desc
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      return b.goalsFor - a.goalsFor;
    });
    // Assign positions
    for (let i = 0; i < standings.length; i++) {
      standings[i].position = i + 1;
    }
    return standings;
  });
}

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('standings - Property Tests', () => {
  // Feature: champions-league, Property 5: Standings are sorted by points, then goal difference, then goals scored
  describe('Property 5: Standings are sorted by points, then goal difference, then goals scored', () => {
    /**
     * **Validates: Requirements 2.4**
     *
     * For any set of CL match results, updateStandings() SHALL produce standings
     * sorted in descending order by: (1) points, (2) goal difference (goalsFor - goalsAgainst),
     * (3) goals scored. No two adjacent entries shall violate this ordering.
     */
    it('updateStandings() produces standings sorted by points, goal difference, then goals scored', () => {
      const participants = make50Participants();
      const state = makeEmptyState(participants);

      fc.assert(
        fc.property(arbLeagueMatchResults(participants), (results) => {
          const standings = updateStandings(state, results);

          // Verify sorting invariant: no adjacent pair violates the ordering
          for (let i = 0; i < standings.length - 1; i++) {
            const current = standings[i];
            const next = standings[i + 1];

            const currentGD = current.goalsFor - current.goalsAgainst;
            const nextGD = next.goalsFor - next.goalsAgainst;

            // Points must be >= next
            if (current.points > next.points) continue;
            expect(current.points).toBeGreaterThanOrEqual(next.points);

            // If points are equal, goal difference must be >= next
            if (current.points === next.points) {
              if (currentGD > nextGD) continue;
              expect(currentGD).toBeGreaterThanOrEqual(nextGD);

              // If goal difference is also equal, goals scored must be >= next
              if (currentGD === nextGD) {
                expect(current.goalsFor).toBeGreaterThanOrEqual(next.goalsFor);
              }
            }
          }

          // Verify positions are assigned correctly (1-based, sequential)
          for (let i = 0; i < standings.length; i++) {
            expect(standings[i].position).toBe(i + 1);
          }
        }),
        { numRuns: NUM_RUNS }
      );
    });
  });

  // Feature: champions-league, Property 6: League phase resolution qualifies exactly the top 16
  describe('Property 6: League phase resolution qualifies exactly the top 16', () => {
    /**
     * **Validates: Requirements 2.5, 2.6**
     *
     * For any valid standings of 50 teams, resolveLeaguePhase() SHALL return
     * exactly 16 participants corresponding to positions 1-16 in the standings.
     */
    it('resolveLeaguePhase() returns exactly 16 participants from positions 1-16', () => {
      const participants = make50Participants();

      fc.assert(
        fc.property(arb50SortedStandings(), (standings) => {
          const qualified = resolveLeaguePhase(standings, participants);

          // Exactly 16 qualified
          expect(qualified).toHaveLength(CL_CONSTANTS.TOP_16_QUALIFY);

          // The qualified participants must correspond to positions 1-16
          const top16Ids = standings
            .slice(0, CL_CONSTANTS.TOP_16_QUALIFY)
            .map((s) => s.participantId);

          const qualifiedIds = qualified.map((p) => p.id);

          for (const id of top16Ids) {
            expect(qualifiedIds).toContain(id);
          }

          // No team from positions 17-50 should be qualified
          const eliminatedIds = standings
            .slice(CL_CONSTANTS.TOP_16_QUALIFY)
            .map((s) => s.participantId);

          for (const id of eliminatedIds) {
            expect(qualifiedIds).not.toContain(id);
          }
        }),
        { numRuns: NUM_RUNS }
      );
    });
  });

  // Feature: champions-league, Property 16: Position classification for UI highlighting
  describe('Property 16: Position classification for UI highlighting', () => {
    /**
     * **Validates: Requirements 7.3**
     *
     * For any position P in range [1, 50], the classification function SHALL return
     * 'qualified' if P ≤ 16 and 'eliminated' if P > 16.
     */
    it('classifyPosition() returns qualified for positions 1-16 and eliminated for 17-50', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 50 }), (position) => {
          const result = classifyPosition(position);

          if (position <= CL_CONSTANTS.TOP_16_QUALIFY) {
            expect(result).toBe('qualified');
          } else {
            expect(result).toBe('eliminated');
          }
        }),
        { numRuns: NUM_RUNS }
      );
    });
  });
});
