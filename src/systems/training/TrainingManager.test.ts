import { describe, it, expect } from 'vitest';
import { isTrainingAvailable, executeWeeklyTraining, calculateSignificantGain, TRAINING_GAIN } from './TrainingManager';
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
    age: 22,
    stats: { pace: 70, shooting: 65, passing: 60, dribbling: 68, defending: 40, physical: 72 },
    potential: 85,
    overallRating: 65,
    fitness: 90,
    morale: 75,
    injury: null,
    ...overrides,
  };
}

describe('TrainingManager', () => {
  describe('isTrainingAvailable', () => {
    it('returns true when player has not trained this week', () => {
      expect(isTrainingAvailable(false)).toBe(true);
    });

    it('returns false when player has already trained this week', () => {
      expect(isTrainingAvailable(true)).toBe(false);
    });
  });

  describe('calculateSignificantGain', () => {
    it('returns 0 when stat is already at potential', () => {
      const gain = calculateSignificantGain(85, 85, createRNG(42));
      expect(gain).toBe(0);
    });

    it('returns 0 when stat exceeds potential', () => {
      const gain = calculateSignificantGain(90, 85, createRNG(42));
      expect(gain).toBe(0);
    });

    it('returns gain between 1 and 3 when stat is below potential', () => {
      const rng = createRNG(42);
      const gain = calculateSignificantGain(60, 85, rng);
      expect(gain).toBeGreaterThanOrEqual(TRAINING_GAIN.min);
      expect(gain).toBeLessThanOrEqual(TRAINING_GAIN.max);
    });

    it('does not exceed remaining gap to potential', () => {
      // stat is 84, potential is 85 → max gain is 1
      const gain = calculateSignificantGain(84, 85, createRNG(42));
      expect(gain).toBeLessThanOrEqual(1);
      expect(gain).toBeGreaterThanOrEqual(0);
    });

    it('higher remaining potential tends to give higher gains', () => {
      const rng1 = createRNG(100);
      const rng2 = createRNG(100);
      const gainFarFromPotential = calculateSignificantGain(30, 85, rng1);
      const gainCloseToPotenial = calculateSignificantGain(80, 85, rng2);
      expect(gainFarFromPotential).toBeGreaterThanOrEqual(gainCloseToPotenial);
    });
  });

  describe('executeWeeklyTraining', () => {
    it('increases the targeted skill', () => {
      const player = createTestPlayer();
      const rng = createRNG(42);
      const result = executeWeeklyTraining(player, 'shooting', rng);

      expect(result.skill).toBe('shooting');
      expect(result.previousValue).toBe(65);
      expect(result.newValue).toBeGreaterThan(result.previousValue);
      expect(result.gain).toBeGreaterThanOrEqual(TRAINING_GAIN.min);
      expect(result.gain).toBeLessThanOrEqual(TRAINING_GAIN.max);
    });

    it('throws error when player is injured', () => {
      const player = createTestPlayer({
        injury: { type: 'muscle', weeksRemaining: 2, severity: 'moderate' },
      });

      expect(() => executeWeeklyTraining(player, 'pace', createRNG(42))).toThrow(
        'Le joueur est blessé'
      );
    });

    it('does not increase stat beyond 99', () => {
      const player = createTestPlayer({
        stats: { pace: 98, shooting: 98, passing: 98, dribbling: 98, defending: 98, physical: 98 },
        potential: 99,
      });
      const rng = createRNG(42);
      const result = executeWeeklyTraining(player, 'pace', rng);

      expect(result.newValue).toBeLessThanOrEqual(99);
    });

    it('returns gain of 0 when stat is at potential', () => {
      const player = createTestPlayer({
        stats: { pace: 85, shooting: 85, passing: 85, dribbling: 85, defending: 85, physical: 85 },
        potential: 85,
      });
      const rng = createRNG(42);
      const result = executeWeeklyTraining(player, 'shooting', rng);

      expect(result.gain).toBe(0);
      expect(result.newValue).toBe(result.previousValue);
    });

    it('works with all training skills', () => {
      const player = createTestPlayer();
      const skills = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const;

      for (const skill of skills) {
        const rng = createRNG(42);
        const result = executeWeeklyTraining(player, skill, rng);
        expect(result.skill).toBe(skill);
        expect(result.gain).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
