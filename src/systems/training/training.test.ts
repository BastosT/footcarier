import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateInjuryRisk, canTrain, canPlayMatch, INTENSIVE_THRESHOLD } from './TrainingSystem';
import type { PlayerCharacter, TrainingSession, InjuryState } from '../../core/types';

describe('TrainingSystem - Property Tests', () => {
  it('Property 16: Injury risk increases after 3+ consecutive intensive sessions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        (consecutiveSessions) => {
          const session: TrainingSession = { skill: 'pace', intensity: 'high', isRehabilitation: false };

          const riskBefore = calculateInjuryRisk(session, { consecutiveIntensiveSessions: Math.min(consecutiveSessions, INTENSIVE_THRESHOLD - 2) });
          const riskAfter = calculateInjuryRisk(session, { consecutiveIntensiveSessions: INTENSIVE_THRESHOLD });

          // Risk after threshold should be strictly higher
          expect(riskAfter).toBeGreaterThan(riskBefore);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 17: Injured player cannot play matches or train normally', () => {
    const injury: InjuryState = { type: 'muscle', weeksRemaining: 3, severity: 'moderate' };
    const player: PlayerCharacter = {
      id: 'test',
      firstName: 'Test',
      lastName: 'Player',
      nationality: 'france',
      position: 'ST',
      appearance: { skinTone: 1, hairStyle: 1, hairColor: 1, height: 'medium' },
      age: 25,
      stats: { pace: 70, shooting: 75, passing: 65, dribbling: 70, defending: 40, physical: 70 },
      potential: 85,
      overallRating: 70,
      fitness: 80,
      morale: 70,
      injury,
    };

    // Cannot play match
    expect(canPlayMatch(player)).toBe(false);

    // Cannot train normally
    const normalSession: TrainingSession = { skill: 'shooting', intensity: 'medium', isRehabilitation: false };
    expect(canTrain(player, normalSession)).toBe(false);

    // Can do rehabilitation
    const rehabSession: TrainingSession = { skill: 'physical', intensity: 'low', isRehabilitation: true };
    expect(canTrain(player, rehabSession)).toBe(true);
  });

  it('Healthy player can train and play', () => {
    const player: PlayerCharacter = {
      id: 'test',
      firstName: 'Test',
      lastName: 'Player',
      nationality: 'france',
      position: 'ST',
      appearance: { skinTone: 1, hairStyle: 1, hairColor: 1, height: 'medium' },
      age: 25,
      stats: { pace: 70, shooting: 75, passing: 65, dribbling: 70, defending: 40, physical: 70 },
      potential: 85,
      overallRating: 70,
      fitness: 80,
      morale: 70,
      injury: null,
    };

    expect(canPlayMatch(player)).toBe(true);

    const session: TrainingSession = { skill: 'shooting', intensity: 'high', isRehabilitation: false };
    expect(canTrain(player, session)).toBe(true);
  });
});
