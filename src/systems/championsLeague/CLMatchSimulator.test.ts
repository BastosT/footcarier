/**
 * Tests unitaires pour CLMatchSimulator.
 * Vérifie les scores réalistes, la pondération par rating, et la prolongation/tirs au but.
 */

import { describe, it, expect } from 'vitest';
import { simulateMatch, simulateExtraTimeAndPenalties } from './CLMatchSimulator';
import { createRNG } from '../../utils/random';
import { CL_CONSTANTS } from './types';
import type { CLParticipant } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeParticipant(overrides: Partial<CLParticipant> = {}): CLParticipant {
  return {
    id: 'team-1',
    name: 'Test FC',
    country: 'france',
    averageRating: 75,
    isFiller: false,
    ...overrides,
  };
}

// ─── simulateMatch ───────────────────────────────────────────────────────────

describe('CLMatchSimulator.simulateMatch', () => {
  it('should produce scores between 0 and MAX_GOALS_PER_TEAM', () => {
    const rng = createRNG(42);
    const home = makeParticipant({ id: 'home', averageRating: 80 });
    const away = makeParticipant({ id: 'away', averageRating: 70 });

    for (let i = 0; i < 100; i++) {
      const result = simulateMatch(home, away, rng);
      expect(result.homeGoals).toBeGreaterThanOrEqual(0);
      expect(result.homeGoals).toBeLessThanOrEqual(CL_CONSTANTS.MAX_GOALS_PER_TEAM);
      expect(result.awayGoals).toBeGreaterThanOrEqual(0);
      expect(result.awayGoals).toBeLessThanOrEqual(CL_CONSTANTS.MAX_GOALS_PER_TEAM);
    }
  });

  it('should produce integer scores', () => {
    const rng = createRNG(123);
    const home = makeParticipant({ id: 'home', averageRating: 75 });
    const away = makeParticipant({ id: 'away', averageRating: 75 });

    for (let i = 0; i < 50; i++) {
      const result = simulateMatch(home, away, rng);
      expect(Number.isInteger(result.homeGoals)).toBe(true);
      expect(Number.isInteger(result.awayGoals)).toBe(true);
    }
  });

  it('should return correct team IDs', () => {
    const rng = createRNG(1);
    const home = makeParticipant({ id: 'real-madrid' });
    const away = makeParticipant({ id: 'psg' });

    const result = simulateMatch(home, away, rng);
    expect(result.homeTeamId).toBe('real-madrid');
    expect(result.awayTeamId).toBe('psg');
  });

  it('should be reproducible with the same seed', () => {
    const home = makeParticipant({ id: 'home', averageRating: 80 });
    const away = makeParticipant({ id: 'away', averageRating: 72 });

    const result1 = simulateMatch(home, away, createRNG(999));
    const result2 = simulateMatch(home, away, createRNG(999));

    expect(result1.homeGoals).toBe(result2.homeGoals);
    expect(result1.awayGoals).toBe(result2.awayGoals);
  });

  it('should favor higher-rated teams over many simulations', () => {
    const rng = createRNG(7);
    const strongTeam = makeParticipant({ id: 'strong', averageRating: 85 });
    const weakTeam = makeParticipant({ id: 'weak', averageRating: 65 });

    let strongWins = 0;
    let weakWins = 0;
    const numMatches = 200;

    for (let i = 0; i < numMatches; i++) {
      const result = simulateMatch(strongTeam, weakTeam, rng);
      if (result.homeGoals > result.awayGoals) strongWins++;
      else if (result.awayGoals > result.homeGoals) weakWins++;
    }

    // Strong team (rating 85) should win more than weak team (rating 65)
    expect(strongWins).toBeGreaterThan(weakWins);
  });
});

// ─── simulateExtraTimeAndPenalties ───────────────────────────────────────────

describe('CLMatchSimulator.simulateExtraTimeAndPenalties', () => {
  it('should always produce a winner', () => {
    const rng = createRNG(42);
    const home = makeParticipant({ id: 'home', averageRating: 78 });
    const away = makeParticipant({ id: 'away', averageRating: 76 });

    for (let i = 0; i < 50; i++) {
      const result = simulateExtraTimeAndPenalties(2, 2, home, away, rng);
      expect(typeof result.winnerIsHome).toBe('boolean');
    }
  });

  it('should produce extra time goals between 0 and 2', () => {
    const rng = createRNG(100);
    const home = makeParticipant({ id: 'home', averageRating: 80 });
    const away = makeParticipant({ id: 'away', averageRating: 75 });

    for (let i = 0; i < 100; i++) {
      const result = simulateExtraTimeAndPenalties(1, 1, home, away, rng);
      expect(result.extraTimeGoals[0]).toBeGreaterThanOrEqual(0);
      expect(result.extraTimeGoals[0]).toBeLessThanOrEqual(2);
      expect(result.extraTimeGoals[1]).toBeGreaterThanOrEqual(0);
      expect(result.extraTimeGoals[1]).toBeLessThanOrEqual(2);
    }
  });

  it('should not have penalties if extra time decides the tie', () => {
    // Use a seed that produces different extra time goals
    const rng = createRNG(55);
    const home = makeParticipant({ id: 'home', averageRating: 80 });
    const away = makeParticipant({ id: 'away', averageRating: 70 });

    let foundDecidedInExtraTime = false;
    for (let i = 0; i < 100; i++) {
      const result = simulateExtraTimeAndPenalties(2, 2, home, away, rng);
      if (result.extraTimeGoals[0] !== result.extraTimeGoals[1]) {
        // Extra time decided it — no penalties
        expect(result.penalties).toBeUndefined();
        foundDecidedInExtraTime = true;
        break;
      }
    }
    expect(foundDecidedInExtraTime).toBe(true);
  });

  it('should have penalties when extra time is still tied', () => {
    const rng = createRNG(42);
    const home = makeParticipant({ id: 'home', averageRating: 75 });
    const away = makeParticipant({ id: 'away', averageRating: 75 });

    let foundPenalties = false;
    for (let i = 0; i < 200; i++) {
      const result = simulateExtraTimeAndPenalties(1, 1, home, away, rng);
      if (result.penalties) {
        foundPenalties = true;
        // Winner score should be higher than loser score
        const [homePen, awayPen] = result.penalties;
        if (result.winnerIsHome) {
          expect(homePen).toBeGreaterThan(awayPen);
        } else {
          expect(awayPen).toBeGreaterThan(homePen);
        }
        break;
      }
    }
    expect(foundPenalties).toBe(true);
  });

  it('should be reproducible with the same seed', () => {
    const home = makeParticipant({ id: 'home', averageRating: 78 });
    const away = makeParticipant({ id: 'away', averageRating: 74 });

    const result1 = simulateExtraTimeAndPenalties(3, 3, home, away, createRNG(42));
    const result2 = simulateExtraTimeAndPenalties(3, 3, home, away, createRNG(42));

    expect(result1.winnerIsHome).toBe(result2.winnerIsHome);
    expect(result1.extraTimeGoals).toEqual(result2.extraTimeGoals);
    expect(result1.penalties).toEqual(result2.penalties);
  });
});
