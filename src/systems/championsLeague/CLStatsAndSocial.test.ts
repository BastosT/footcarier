/**
 * Tests unitaires pour CLStatsAndSocial.
 * Vérifie l'enregistrement des performances CL, le compteur de buts CL séparé,
 * la génération de posts sociaux après match CL, et le multiplicateur Instagram.
 *
 * Requirements: 6.1, 6.2, 6.5
 */

import { describe, it, expect } from 'vitest';
import {
  recordCLPerformance,
  generateCLMatchPosts,
  calculateBaseFollowersGain,
  calculateCLFollowersGain,
} from './CLStatsAndSocial';
import { createRNG } from '../../utils/random';
import type { MatchPerformance, PlayerCareerStats, GameDate } from '../../core/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makePerformance(overrides: Partial<MatchPerformance> = {}): MatchPerformance {
  return {
    rating: 7.0,
    goals: 1,
    assists: 0,
    minutesPlayed: 90,
    shots: 3,
    passAccuracy: 85,
    dribbles: 2,
    tackles: 1,
    ...overrides,
  };
}

function makeCareerStats(overrides: Partial<PlayerCareerStats> = {}): PlayerCareerStats {
  return {
    season: {
      matchesPlayed: 10,
      goals: 5,
      assists: 3,
      shots: 30,
      dribbles: 20,
      tackles: 10,
      avgRating: 7.2,
      totalRating: 72,
      cleanSheets: 0,
    },
    allTime: {
      matchesPlayed: 50,
      goals: 25,
      assists: 15,
      shots: 150,
      dribbles: 100,
      tackles: 50,
      avgRating: 7.0,
      totalRating: 350,
      cleanSheets: 0,
    },
    clGoals: 3,
    ...overrides,
  };
}

function makeGameDate(): GameDate {
  return { day: 15, month: 10, year: 2025 };
}

// ─── recordCLPerformance ─────────────────────────────────────────────────────

describe('CLStatsAndSocial.recordCLPerformance', () => {
  it('should update season and allTime stats correctly', () => {
    const stats = makeCareerStats();
    const performance = makePerformance({ goals: 2, assists: 1, rating: 8.5, shots: 4, dribbles: 3, tackles: 2 });

    const updated = recordCLPerformance(stats, performance);

    // Season stats
    expect(updated.season.matchesPlayed).toBe(11);
    expect(updated.season.goals).toBe(7); // 5 + 2
    expect(updated.season.assists).toBe(4); // 3 + 1
    expect(updated.season.shots).toBe(34); // 30 + 4
    expect(updated.season.dribbles).toBe(23); // 20 + 3
    expect(updated.season.tackles).toBe(12); // 10 + 2
    expect(updated.season.totalRating).toBe(80.5); // 72 + 8.5

    // AllTime stats
    expect(updated.allTime.matchesPlayed).toBe(51);
    expect(updated.allTime.goals).toBe(27); // 25 + 2
    expect(updated.allTime.assists).toBe(16); // 15 + 1
    expect(updated.allTime.shots).toBe(154); // 150 + 4
    expect(updated.allTime.dribbles).toBe(103); // 100 + 3
    expect(updated.allTime.tackles).toBe(52); // 50 + 2
    expect(updated.allTime.totalRating).toBe(358.5); // 350 + 8.5
  });

  it('should increment clGoals by the number of goals scored', () => {
    const stats = makeCareerStats({ clGoals: 5 });
    const performance = makePerformance({ goals: 3 });

    const updated = recordCLPerformance(stats, performance);

    expect(updated.clGoals).toBe(8); // 5 + 3
  });

  it('should handle zero goals (clGoals unchanged)', () => {
    const stats = makeCareerStats({ clGoals: 7 });
    const performance = makePerformance({ goals: 0 });

    const updated = recordCLPerformance(stats, performance);

    expect(updated.clGoals).toBe(7); // unchanged
  });
});

// ─── generateCLMatchPosts ────────────────────────────────────────────────────

describe('CLStatsAndSocial.generateCLMatchPosts', () => {
  it('should generate at least 1 post', () => {
    const rng = createRNG(42);
    const performance = makePerformance({ rating: 6.5, goals: 0 });

    const posts = generateCLMatchPosts(performance, 'Jean Dupont', makeGameDate(), rng);

    expect(posts.length).toBeGreaterThanOrEqual(1);
  });

  it('should generate journalist posts for high ratings (≥7.5)', () => {
    const rng = createRNG(42);
    const performance = makePerformance({ rating: 8.0, goals: 0 });

    const posts = generateCLMatchPosts(performance, 'Jean Dupont', makeGameDate(), rng);

    const journalistPosts = posts.filter(p => p.authorType === 'journalist');
    expect(journalistPosts.length).toBeGreaterThanOrEqual(1);
  });

  it('should generate journalist posts when player scores goals', () => {
    const rng = createRNG(42);
    const performance = makePerformance({ rating: 6.0, goals: 1 });

    const posts = generateCLMatchPosts(performance, 'Jean Dupont', makeGameDate(), rng);

    const journalistPosts = posts.filter(p => p.authorType === 'journalist');
    expect(journalistPosts.length).toBeGreaterThanOrEqual(1);
  });

  it('should generate posts with CL-specific content', () => {
    const rng = createRNG(42);
    const performance = makePerformance({ rating: 7.5, goals: 1 });

    const posts = generateCLMatchPosts(performance, 'Jean Dupont', makeGameDate(), rng);

    // At least one post should contain CL/European/Champions League related content
    const clKeywords = ['européenne', 'Champions League', 'Ligue des Champions', 'européen', 'international', 'grandes soirées'];
    const hasCLContent = posts.some(post =>
      clKeywords.some(keyword => post.content.toLowerCase().includes(keyword.toLowerCase()))
    );
    expect(hasCLContent).toBe(true);
  });
});

// ─── calculateCLFollowersGain ────────────────────────────────────────────────

describe('CLStatsAndSocial.calculateCLFollowersGain', () => {
  it('should be exactly 2× calculateBaseFollowersGain with same inputs', () => {
    const performance = makePerformance({ rating: 8.5, goals: 2, assists: 1 });
    const clubTier = 'big' as const;
    const rng1 = createRNG(42);
    const rng2 = createRNG(42);

    const baseGain = calculateBaseFollowersGain(performance, clubTier, rng1);
    const clGain = calculateCLFollowersGain(performance, clubTier, rng2);

    expect(clGain).toBe(baseGain * 2);
  });
});
