import { describe, it, expect } from 'vitest';
import { getFitnessColor, getFitnessTextColor } from './FitnessBar';

describe('FitnessBar', () => {
  describe('getFitnessColor', () => {
    it('returns green for fitness > 70', () => {
      expect(getFitnessColor(71)).toBe('bg-green-500');
      expect(getFitnessColor(85)).toBe('bg-green-500');
      expect(getFitnessColor(100)).toBe('bg-green-500');
    });

    it('returns yellow for fitness between 50 and 70', () => {
      expect(getFitnessColor(50)).toBe('bg-yellow-500');
      expect(getFitnessColor(60)).toBe('bg-yellow-500');
      expect(getFitnessColor(70)).toBe('bg-yellow-500');
    });

    it('returns red for fitness < 50', () => {
      expect(getFitnessColor(0)).toBe('bg-red-500');
      expect(getFitnessColor(25)).toBe('bg-red-500');
      expect(getFitnessColor(49)).toBe('bg-red-500');
    });
  });

  describe('getFitnessTextColor', () => {
    it('returns green text for fitness > 70', () => {
      expect(getFitnessTextColor(80)).toBe('text-green-500');
    });

    it('returns yellow text for fitness between 50 and 70', () => {
      expect(getFitnessTextColor(60)).toBe('text-yellow-500');
    });

    it('returns red text for fitness < 50', () => {
      expect(getFitnessTextColor(30)).toBe('text-red-500');
    });
  });
});
