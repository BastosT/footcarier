import { describe, it, expect } from 'vitest';
import {
  getMoraleLevel,
  getMoraleColor,
  getMoraleTextColor,
  getMoraleLabel,
} from './MoraleIndicator';

describe('MoraleIndicator', () => {
  describe('getMoraleLevel', () => {
    it('returns high for morale > 70', () => {
      expect(getMoraleLevel(71)).toBe('high');
      expect(getMoraleLevel(85)).toBe('high');
      expect(getMoraleLevel(100)).toBe('high');
    });

    it('returns medium for morale between 50 and 70', () => {
      expect(getMoraleLevel(50)).toBe('medium');
      expect(getMoraleLevel(60)).toBe('medium');
      expect(getMoraleLevel(70)).toBe('medium');
    });

    it('returns low for morale < 50', () => {
      expect(getMoraleLevel(0)).toBe('low');
      expect(getMoraleLevel(25)).toBe('low');
      expect(getMoraleLevel(49)).toBe('low');
    });
  });

  describe('getMoraleColor', () => {
    it('returns green for high morale', () => {
      expect(getMoraleColor(80)).toBe('bg-green-500');
    });

    it('returns yellow for medium morale', () => {
      expect(getMoraleColor(60)).toBe('bg-yellow-500');
    });

    it('returns red for low morale', () => {
      expect(getMoraleColor(30)).toBe('bg-red-500');
    });
  });

  describe('getMoraleTextColor', () => {
    it('returns green text for high morale', () => {
      expect(getMoraleTextColor(80)).toBe('text-green-500');
    });

    it('returns yellow text for medium morale', () => {
      expect(getMoraleTextColor(60)).toBe('text-yellow-500');
    });

    it('returns red text for low morale', () => {
      expect(getMoraleTextColor(30)).toBe('text-red-500');
    });
  });

  describe('getMoraleLabel', () => {
    it('returns Excellent for high morale', () => {
      expect(getMoraleLabel(80)).toBe('Excellent');
    });

    it('returns Correct for medium morale', () => {
      expect(getMoraleLabel(60)).toBe('Correct');
    });

    it('returns Mauvais for low morale', () => {
      expect(getMoraleLabel(30)).toBe('Mauvais');
    });
  });
});
