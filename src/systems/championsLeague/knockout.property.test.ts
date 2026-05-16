/**
 * Property-based tests pour les tours à élimination directe de la Ligue des Champions.
 * Utilise fast-check avec vitest pour valider les propriétés universelles
 * du tirage au sort et de la résolution des confrontations aller-retour.
 */

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { drawKnockoutRound, resolveKnockoutTie } from './knockout';
import { createRNG } from '../../utils/random';
import type { CLParticipant, CLMatchResult, KnockoutRound } from './types';

const NUM_RUNS = 100;

// ─── Générateurs ─────────────────────────────────────────────────────────────

const countries = ['france', 'spain', 'england', 'italy', 'germany', 'portugal', 'netherlands'];

/**
 * Génère un CLParticipant valide avec un id unique basé sur l'index.
 */
function makeParticipant(index: number): CLParticipant {
  return {
    id: `team-${index}`,
    name: `Team ${index}`,
    country: countries[index % countries.length],
    averageRating: 70 + (index % 19), // 70-88
    isFiller: index >= 20,
  };
}

/**
 * Génère N participants uniques pour un tour éliminatoire.
 */
function makeTeams(n: number): CLParticipant[] {
  return Array.from({ length: n }, (_, i) => makeParticipant(i));
}

/**
 * Générateur pour le nombre d'équipes valide dans un tour éliminatoire.
 */
const arbKnockoutTeamCount = fc.constantFrom(16, 8, 4, 2);

/**
 * Générateur pour le type de tour éliminatoire.
 */
const arbKnockoutRound: fc.Arbitrary<KnockoutRound> = fc.constantFrom(
  'round-of-16' as KnockoutRound,
  'quarter-final' as KnockoutRound,
  'semi-final' as KnockoutRound,
  'final' as KnockoutRound
);

/**
 * Générateur pour un seed RNG.
 */
const arbSeed = fc.integer({ min: 1, max: 1_000_000 });

/**
 * Générateur pour un score de match (0-5 buts).
 */
const arbGoals = fc.integer({ min: 0, max: 5 });

/**
 * Générateur pour une paire de matchs aller-retour avec score cumulé à égalité.
 * homeGoals1 + awayGoals2 == awayGoals1 + homeGoals2
 * On génère 3 valeurs librement et on déduit la 4ème pour garantir l'égalité.
 */
const arbTiedAggregateLegResults = fc.tuple(
  arbGoals,
  arbGoals,
  arbGoals,
  arbSeed
).map(([homeGoals1, awayGoals1, homeGoals2, seed]) => {
  // Pour que le score cumulé soit à égalité :
  // aggregateHome = homeGoals1 + awayGoals2
  // aggregateAway = awayGoals1 + homeGoals2
  // On veut aggregateHome == aggregateAway
  // => homeGoals1 + awayGoals2 == awayGoals1 + homeGoals2
  // => awayGoals2 = awayGoals1 + homeGoals2 - homeGoals1
  const awayGoals2 = awayGoals1 + homeGoals2 - homeGoals1;

  // Vérifier que awayGoals2 est dans les bornes valides [0, 5]
  if (awayGoals2 < 0 || awayGoals2 > 5) {
    // Fallback : utiliser un cas simple d'égalité (1-1, 1-1)
    return {
      firstLeg: { homeGoals: 1, awayGoals: 1 },
      secondLeg: { homeGoals: 1, awayGoals: 1 },
      seed,
    };
  }

  return {
    firstLeg: { homeGoals: homeGoals1, awayGoals: awayGoals1 },
    secondLeg: { homeGoals: homeGoals2, awayGoals: awayGoals2 },
    seed,
  };
});

// ─── Property Tests ──────────────────────────────────────────────────────────

describe('knockout - Property Tests', () => {
  // Feature: champions-league, Property 7: Knockout draw produces valid pairings where each team appears exactly once
  describe('Property 7: Knockout draw produces valid pairings where each team appears exactly once', () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.6**
     *
     * For any even number of teams N (where N ∈ {16, 8, 4, 2}), drawKnockoutRound()
     * SHALL produce exactly N/2 ties, and every input team SHALL appear exactly once
     * across all ties (either as home or away).
     */
    it('drawKnockoutRound() produces N/2 ties with each team appearing exactly once', () => {
      fc.assert(
        fc.property(arbKnockoutTeamCount, arbKnockoutRound, arbSeed, (teamCount, round, seed) => {
          const teams = makeTeams(teamCount);
          const rng = createRNG(seed);

          const ties = drawKnockoutRound(teams, round, rng);

          // Must produce exactly N/2 ties
          expect(ties).toHaveLength(teamCount / 2);

          // Collect all team ids that appear in the draw
          const allTeamIds: string[] = [];
          for (const tie of ties) {
            allTeamIds.push(tie.homeTeam.id);
            allTeamIds.push(tie.awayTeam.id);
          }

          // Every input team must appear exactly once
          expect(allTeamIds).toHaveLength(teamCount);

          const uniqueIds = new Set(allTeamIds);
          expect(uniqueIds.size).toBe(teamCount);

          // Verify that the ids match the input teams
          const inputIds = new Set(teams.map((t) => t.id));
          for (const id of uniqueIds) {
            expect(inputIds.has(id)).toBe(true);
          }

          // No team plays against itself
          for (const tie of ties) {
            expect(tie.homeTeam.id).not.toBe(tie.awayTeam.id);
          }
        }),
        { numRuns: NUM_RUNS }
      );
    });
  });

  // Feature: champions-league, Property 8: Tied aggregate in knockout is resolved by extra time or penalties
  describe('Property 8: Tied aggregate in knockout is resolved by extra time or penalties', () => {
    /**
     * **Validates: Requirements 3.5**
     *
     * For any two-legged knockout tie where the aggregate score is equal after both legs,
     * resolveKnockoutTie() SHALL produce a winner with decidedBy equal to either
     * 'extra-time' or 'penalties', never 'aggregate'.
     */
    it('resolveKnockoutTie() resolves tied aggregates with extra-time or penalties, never aggregate', () => {
      fc.assert(
        fc.property(arbTiedAggregateLegResults, ({ firstLeg, secondLeg, seed }) => {
          const rng = createRNG(seed);

          const firstLegResult: CLMatchResult = {
            matchday: 1,
            homeTeamId: 'team-home',
            awayTeamId: 'team-away',
            homeGoals: firstLeg.homeGoals,
            awayGoals: firstLeg.awayGoals,
            phase: 'round-of-16',
            leg: 1,
          };

          const secondLegResult: CLMatchResult = {
            matchday: 2,
            homeTeamId: 'team-away', // Away team hosts the second leg
            awayTeamId: 'team-home',
            homeGoals: secondLeg.homeGoals,
            awayGoals: secondLeg.awayGoals,
            phase: 'round-of-16',
            leg: 2,
          };

          // Verify the aggregate is indeed tied
          const aggregateHome = firstLegResult.homeGoals + secondLegResult.awayGoals;
          const aggregateAway = firstLegResult.awayGoals + secondLegResult.homeGoals;
          expect(aggregateHome).toBe(aggregateAway);

          const result = resolveKnockoutTie(firstLegResult, secondLegResult, rng);

          // decidedBy must be 'extra-time' or 'penalties', never 'aggregate'
          expect(result.decidedBy).not.toBe('aggregate');
          expect(['extra-time', 'penalties']).toContain(result.decidedBy);

          // Must produce a valid winner
          expect(['team-home', 'team-away']).toContain(result.winnerId);

          // Aggregate scores must match what we computed
          expect(result.aggregateHome).toBe(aggregateHome);
          expect(result.aggregateAway).toBe(aggregateAway);
        }),
        { numRuns: NUM_RUNS }
      );
    });
  });
});
