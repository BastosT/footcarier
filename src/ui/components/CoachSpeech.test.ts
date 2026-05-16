/**
 * Unit tests for CoachSpeech utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateImportance,
  selectTone,
  generateCoachSpeech,
  selectMessage,
} from './CoachSpeech';

describe('calculateImportance', () => {
  it('returns "crucial" when matchday > 30', () => {
    expect(calculateImportance(31, 10)).toBe('crucial');
    expect(calculateImportance(34, 1)).toBe('crucial');
    expect(calculateImportance(32, 5)).toBe('crucial');
  });

  it('returns "important" when position <= 3 and matchday <= 30', () => {
    expect(calculateImportance(15, 1)).toBe('important');
    expect(calculateImportance(1, 2)).toBe('important');
    expect(calculateImportance(30, 3)).toBe('important');
  });

  it('returns "normal" when matchday <= 30 and position > 3', () => {
    expect(calculateImportance(10, 4)).toBe('normal');
    expect(calculateImportance(1, 18)).toBe('normal');
    expect(calculateImportance(30, 10)).toBe('normal');
  });

  it('prioritizes matchday > 30 over position <= 3', () => {
    // Even if position is 1, matchday > 30 takes precedence
    expect(calculateImportance(31, 1)).toBe('crucial');
    expect(calculateImportance(34, 2)).toBe('crucial');
  });
});

describe('selectTone', () => {
  it('returns "encouraging" when coachRelation > 70', () => {
    expect(selectTone(71)).toBe('encouraging');
    expect(selectTone(85)).toBe('encouraging');
    expect(selectTone(100)).toBe('encouraging');
  });

  it('returns "neutral" when coachRelation is between 40 and 70 (inclusive)', () => {
    expect(selectTone(40)).toBe('neutral');
    expect(selectTone(55)).toBe('neutral');
    expect(selectTone(70)).toBe('neutral');
  });

  it('returns "cold" when coachRelation < 40', () => {
    expect(selectTone(39)).toBe('cold');
    expect(selectTone(20)).toBe('cold');
    expect(selectTone(0)).toBe('cold');
  });
});

describe('selectMessage', () => {
  it('returns a string from the correct template category', () => {
    const message = selectMessage('crucial', 'encouraging', 1);
    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  });

  it('varies message based on matchday', () => {
    const msg1 = selectMessage('normal', 'neutral', 0);
    const msg2 = selectMessage('normal', 'neutral', 1);
    const msg3 = selectMessage('normal', 'neutral', 2);
    // At least two of the three should differ (3 templates available)
    const unique = new Set([msg1, msg2, msg3]);
    expect(unique.size).toBeGreaterThanOrEqual(2);
  });
});

describe('generateCoachSpeech', () => {
  it('generates encouraging speech for high coach relation and important position', () => {
    const result = generateCoachSpeech({ matchday: 10, position: 2, coachRelation: 80 });
    expect(result.importance).toBe('important');
    expect(result.tone).toBe('encouraging');
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('generates cold speech for low coach relation', () => {
    const result = generateCoachSpeech({ matchday: 10, position: 10, coachRelation: 20 });
    expect(result.importance).toBe('normal');
    expect(result.tone).toBe('cold');
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('generates crucial speech for end-of-season matchday', () => {
    const result = generateCoachSpeech({ matchday: 33, position: 5, coachRelation: 55 });
    expect(result.importance).toBe('crucial');
    expect(result.tone).toBe('neutral');
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('returns consistent results for same inputs', () => {
    const params = { matchday: 15, position: 1, coachRelation: 75 };
    const result1 = generateCoachSpeech(params);
    const result2 = generateCoachSpeech(params);
    expect(result1).toEqual(result2);
  });
});
