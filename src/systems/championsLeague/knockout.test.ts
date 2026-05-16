/**
 * Unit tests for knockout.ts - Tours à élimination directe de la Ligue des Champions.
 * Teste le tirage au sort et la résolution des confrontations aller-retour.
 */

import { describe, it, expect } from 'vitest';
import { drawKnockoutRound, resolveKnockoutTie } from './knockout';
import { createRNG } from '../../utils/random';
import type { CLParticipant, CLMatchResult } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createParticipants(count: number): CLParticipant[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
    country: 'france',
    averageRating: 75,
    isFiller: false,
  }));
}

function createMatchResult(
  homeTeamId: string,
  awayTeamId: string,
  homeGoals: number,
  awayGoals: number
): CLMatchResult {
  return {
    matchday: 1,
    homeTeamId,
    awayTeamId,
    homeGoals,
    awayGoals,
    phase: 'round-of-16',
    leg: 1,
  };
}

// ─── drawKnockoutRound ──────────────────────────────────────────────────────

describe('knockout - drawKnockoutRound', () => {
  it('produit N/2 confrontations pour N équipes', () => {
    const rng = createRNG(42);
    const teams16 = createParticipants(16);
    const ties = drawKnockoutRound(teams16, 'round-of-16', rng);
    expect(ties).toHaveLength(8);

    const teams8 = createParticipants(8);
    const tiesQF = drawKnockoutRound(teams8, 'quarter-final', rng);
    expect(tiesQF).toHaveLength(4);

    const teams4 = createParticipants(4);
    const tiesSF = drawKnockoutRound(teams4, 'semi-final', rng);
    expect(tiesSF).toHaveLength(2);

    const teams2 = createParticipants(2);
    const tiesFinal = drawKnockoutRound(teams2, 'final', rng);
    expect(tiesFinal).toHaveLength(1);
  });

  it('chaque équipe apparaît exactement une fois', () => {
    const rng = createRNG(123);
    const teams = createParticipants(16);
    const ties = drawKnockoutRound(teams, 'round-of-16', rng);

    const allTeamIds = ties.flatMap(tie => [tie.homeTeam.id, tie.awayTeam.id]);
    const uniqueIds = new Set(allTeamIds);
    expect(uniqueIds.size).toBe(16);
    expect(allTeamIds).toHaveLength(16);
  });

  it('le tirage est aléatoire (différents seeds donnent différents résultats)', () => {
    const teams = createParticipants(8);
    const ties1 = drawKnockoutRound(teams, 'quarter-final', createRNG(1));
    const ties2 = drawKnockoutRound(teams, 'quarter-final', createRNG(999));

    // Les paires devraient être différentes avec des seeds différents
    const pairs1 = ties1.map(t => `${t.homeTeam.id}-${t.awayTeam.id}`).sort();
    const pairs2 = ties2.map(t => `${t.homeTeam.id}-${t.awayTeam.id}`).sort();
    // Il est statistiquement très improbable que les deux soient identiques
    expect(pairs1).not.toEqual(pairs2);
  });

  it('est reproductible avec le même seed', () => {
    const teams = createParticipants(16);
    const ties1 = drawKnockoutRound(teams, 'round-of-16', createRNG(42));
    const ties2 = drawKnockoutRound(teams, 'round-of-16', createRNG(42));

    expect(ties1.map(t => t.homeTeam.id)).toEqual(ties2.map(t => t.homeTeam.id));
    expect(ties1.map(t => t.awayTeam.id)).toEqual(ties2.map(t => t.awayTeam.id));
  });

  it('lance une erreur pour un nombre impair d\'équipes', () => {
    const teams = createParticipants(3);
    expect(() => drawKnockoutRound(teams, 'round-of-16')).toThrow();
  });

  it('lance une erreur pour moins de 2 équipes', () => {
    const teams = createParticipants(1);
    expect(() => drawKnockoutRound(teams, 'final')).toThrow();
  });
});

// ─── resolveKnockoutTie ─────────────────────────────────────────────────────

describe('knockout - resolveKnockoutTie', () => {
  it('résout par score cumulé quand une équipe mène', () => {
    // Aller : Home 2-1 Away | Retour : Away 1-0 Home → Cumulé : Home 2+0=2, Away 1+1=2... non
    // Aller : Home 3-1 Away | Retour : Away(home) 0-1 Home(away) → Cumulé : Home 3+1=4, Away 1+0=1
    const firstLeg = createMatchResult('team-A', 'team-B', 3, 1);
    const secondLeg = createMatchResult('team-B', 'team-A', 0, 1);

    const result = resolveKnockoutTie(firstLeg, secondLeg);

    expect(result.winnerId).toBe('team-A');
    expect(result.aggregateHome).toBe(4); // 3 (aller home) + 1 (retour away)
    expect(result.aggregateAway).toBe(1); // 1 (aller away) + 0 (retour home)
    expect(result.decidedBy).toBe('aggregate');
  });

  it('résout en faveur de l\'équipe extérieure si elle mène au cumulé', () => {
    // Aller : Home 0-2 Away | Retour : Away(home) 1-0 Home(away)
    // Cumulé : Home 0+0=0, Away 2+1=3
    const firstLeg = createMatchResult('team-A', 'team-B', 0, 2);
    const secondLeg = createMatchResult('team-B', 'team-A', 1, 0);

    const result = resolveKnockoutTie(firstLeg, secondLeg);

    expect(result.winnerId).toBe('team-B');
    expect(result.aggregateHome).toBe(0);
    expect(result.aggregateAway).toBe(3);
    expect(result.decidedBy).toBe('aggregate');
  });

  it('résout par prolongation ou tirs au but quand le cumulé est à égalité', () => {
    // Aller : Home 1-1 Away | Retour : Away(home) 2-2 Home(away)
    // Cumulé : Home 1+2=3, Away 1+2=3 → Égalité
    const firstLeg = createMatchResult('team-A', 'team-B', 1, 1);
    const secondLeg = createMatchResult('team-B', 'team-A', 2, 2);

    const rng = createRNG(42);
    const result = resolveKnockoutTie(firstLeg, secondLeg, rng);

    expect(result.aggregateHome).toBe(3);
    expect(result.aggregateAway).toBe(3);
    expect(['extra-time', 'penalties']).toContain(result.decidedBy);
    expect(result.winnerId).toMatch(/^team-[AB]$/);
    expect(result.extraTimeGoals).toBeDefined();
  });

  it('fonctionne pour la finale (match unique avec retour 0-0)', () => {
    // Finale : match unique. firstLeg = le match, secondLeg = 0-0 (pas de retour)
    // Si le match est 2-1, le vainqueur est clair
    const finalMatch = createMatchResult('team-A', 'team-B', 2, 1);
    const emptySecondLeg = createMatchResult('team-B', 'team-A', 0, 0);

    const result = resolveKnockoutTie(finalMatch, emptySecondLeg);

    expect(result.winnerId).toBe('team-A');
    expect(result.aggregateHome).toBe(2); // 2 + 0
    expect(result.aggregateAway).toBe(1); // 1 + 0
    expect(result.decidedBy).toBe('aggregate');
  });

  it('gère la finale à égalité (prolongation/tirs au but)', () => {
    // Finale : 1-1 → prolongation/tirs au but
    const finalMatch = createMatchResult('team-A', 'team-B', 1, 1);
    const emptySecondLeg = createMatchResult('team-B', 'team-A', 0, 0);

    const rng = createRNG(7);
    const result = resolveKnockoutTie(finalMatch, emptySecondLeg, rng);

    expect(result.aggregateHome).toBe(1);
    expect(result.aggregateAway).toBe(1);
    expect(['extra-time', 'penalties']).toContain(result.decidedBy);
    expect(result.winnerId).toMatch(/^team-[AB]$/);
  });

  it('produit toujours un vainqueur', () => {
    // Tester avec plusieurs seeds pour s'assurer qu'un vainqueur est toujours produit
    for (let seed = 0; seed < 20; seed++) {
      const firstLeg = createMatchResult('team-A', 'team-B', 1, 1);
      const secondLeg = createMatchResult('team-B', 'team-A', 1, 1);
      const rng = createRNG(seed);
      const result = resolveKnockoutTie(firstLeg, secondLeg, rng);

      expect(result.winnerId).toBeDefined();
      expect(['team-A', 'team-B']).toContain(result.winnerId);
    }
  });
});
