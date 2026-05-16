import { describe, it, expect } from 'vitest';
import { createRNG } from '../../utils/random';
import {
  applyMatchFatigue,
  applyDailyRecovery,
  clampFitness,
  getFitnessModifier,
  MATCH_FITNESS_LOSS,
  DAILY_RECOVERY,
  LOW_FITNESS_THRESHOLD,
} from './FitnessManager';

describe('FitnessManager', () => {
  describe('clampFitness', () => {
    it('returns the value unchanged when within [0, 100]', () => {
      expect(clampFitness(50)).toBe(50);
      expect(clampFitness(0)).toBe(0);
      expect(clampFitness(100)).toBe(100);
    });

    it('clamps values below 0 to 0', () => {
      expect(clampFitness(-10)).toBe(0);
      expect(clampFitness(-100)).toBe(0);
    });

    it('clamps values above 100 to 100', () => {
      expect(clampFitness(110)).toBe(100);
      expect(clampFitness(200)).toBe(100);
    });
  });

  describe('applyDailyRecovery', () => {
    it('increases fitness by 1 point', () => {
      expect(applyDailyRecovery(50)).toBe(51);
      expect(applyDailyRecovery(0)).toBe(1);
      expect(applyDailyRecovery(70)).toBe(71);
    });

    it('does not exceed 100', () => {
      expect(applyDailyRecovery(100)).toBe(100);
      expect(applyDailyRecovery(99)).toBe(100);
    });

    it('recovery constant is 1', () => {
      expect(DAILY_RECOVERY).toBe(1);
    });
  });

  describe('applyMatchFatigue', () => {
    it('reduces fitness by 15-30 points', () => {
      const rng = createRNG(42);
      const result = applyMatchFatigue(100, 1, rng);
      expect(result).toBeGreaterThanOrEqual(100 - MATCH_FITNESS_LOSS.max);
      expect(result).toBeLessThanOrEqual(100 - MATCH_FITNESS_LOSS.min);
    });

    it('never produces fitness below 0', () => {
      const rng = createRNG(123);
      const result = applyMatchFatigue(10, 1, rng);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('at minimum intensity, loss is exactly min (15)', () => {
      const rng = createRNG(42);
      const result = applyMatchFatigue(100, 0, rng);
      expect(result).toBe(100 - MATCH_FITNESS_LOSS.min);
    });

    it('loss bounds are 15 and 30', () => {
      expect(MATCH_FITNESS_LOSS.min).toBe(15);
      expect(MATCH_FITNESS_LOSS.max).toBe(30);
    });

    it('always results in lower fitness than before', () => {
      const rng = createRNG(99);
      const before = 80;
      const after = applyMatchFatigue(before, 0.5, rng);
      expect(after).toBeLessThan(before);
    });
  });

  describe('getFitnessModifier', () => {
    it('returns 1.0 when fitness >= 50', () => {
      expect(getFitnessModifier(50)).toBe(1.0);
      expect(getFitnessModifier(75)).toBe(1.0);
      expect(getFitnessModifier(100)).toBe(1.0);
    });

    it('returns reduced modifier when fitness < 50', () => {
      expect(getFitnessModifier(49)).toBeLessThan(1.0);
      expect(getFitnessModifier(25)).toBeLessThan(1.0);
      expect(getFitnessModifier(0)).toBeLessThan(1.0);
    });

    it('returns 0.5 when fitness is 0', () => {
      expect(getFitnessModifier(0)).toBe(0.5);
    });

    it('returns proportional values between 0.5 and 1.0 for fitness 0-50', () => {
      // At fitness 25 (halfway between 0 and 50), modifier should be 0.75
      expect(getFitnessModifier(25)).toBeCloseTo(0.75);
    });

    it('low fitness threshold is 50', () => {
      expect(LOW_FITNESS_THRESHOLD).toBe(50);
    });

    it('modifier is monotonically increasing with fitness', () => {
      const mod0 = getFitnessModifier(0);
      const mod10 = getFitnessModifier(10);
      const mod25 = getFitnessModifier(25);
      const mod49 = getFitnessModifier(49);
      const mod50 = getFitnessModifier(50);

      expect(mod10).toBeGreaterThan(mod0);
      expect(mod25).toBeGreaterThan(mod10);
      expect(mod49).toBeGreaterThan(mod25);
      expect(mod50).toBeGreaterThanOrEqual(mod49);
    });

    it('handles out-of-range fitness values gracefully', () => {
      // Negative fitness should be treated as 0
      expect(getFitnessModifier(-10)).toBe(0.5);
      // Above 100 should be treated as 100
      expect(getFitnessModifier(150)).toBe(1.0);
    });
  });
});
