import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { updateSocialScores, updatePopularityFromPerformance, processInterviewAnswer, createInitialSocialState } from './SocialSystem';
import { generateInterview } from './InterviewGenerator';
import { createRNG } from '../../utils/random';
import type { SocialState, MatchPerformance, InterviewContext } from '../../core/types';

const socialStateArb: fc.Arbitrary<SocialState> = fc.record({
  popularity: fc.integer({ min: 0, max: 100 }),
  reputation: fc.integer({ min: 0, max: 100 }),
  coachRelation: fc.integer({ min: 0, max: 100 }),
  teamRelation: fc.integer({ min: 0, max: 100 }),
  socialFeed: fc.constant([]),
  pendingInterviews: fc.constant([]),
});

describe('SocialSystem - Property Tests', () => {
  it('Property 7: All social scores remain bounded between 0 and 100', () => {
    fc.assert(
      fc.property(
        socialStateArb,
        fc.record({
          popularity: fc.integer({ min: -200, max: 200 }),
          reputation: fc.integer({ min: -200, max: 200 }),
          coachRelation: fc.integer({ min: -200, max: 200 }),
          teamRelation: fc.integer({ min: -200, max: 200 }),
        }),
        (state, update) => {
          const result = updateSocialScores(state, update);
          expect(result.popularity).toBeGreaterThanOrEqual(0);
          expect(result.popularity).toBeLessThanOrEqual(100);
          expect(result.reputation).toBeGreaterThanOrEqual(0);
          expect(result.reputation).toBeLessThanOrEqual(100);
          expect(result.coachRelation).toBeGreaterThanOrEqual(0);
          expect(result.coachRelation).toBeLessThanOrEqual(100);
          expect(result.teamRelation).toBeGreaterThanOrEqual(0);
          expect(result.teamRelation).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('Property 8: Performance > 8 increases popularity, < 4 decreases it', () => {
    fc.assert(
      fc.property(
        socialStateArb.filter(s => s.popularity > 0 && s.popularity < 100),
        fc.double({ min: 8.1, max: 10, noNaN: true }),
        (state, rating) => {
          const performance: MatchPerformance = {
            rating,
            goals: 0, assists: 0, minutesPlayed: 90,
            shots: 0, passAccuracy: 70, dribbles: 0, tackles: 0,
          };
          const result = updatePopularityFromPerformance(state, performance);
          expect(result.popularity).toBeGreaterThanOrEqual(state.popularity);
        }
      ),
      { numRuns: 100 }
    );

    fc.assert(
      fc.property(
        socialStateArb.filter(s => s.popularity > 0 && s.popularity < 100),
        fc.double({ min: 1, max: 3.9, noNaN: true }),
        (state, rating) => {
          const performance: MatchPerformance = {
            rating,
            goals: 0, assists: 0, minutesPlayed: 90,
            shots: 0, passAccuracy: 70, dribbles: 0, tackles: 0,
          };
          const result = updatePopularityFromPerformance(state, performance);
          expect(result.popularity).toBeLessThanOrEqual(state.popularity);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 23: Interview generates exactly 3 answers per question', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<InterviewContext['type']>('post_match', 'transfer', 'trophy', 'controversy', 'general'),
        fc.integer({ min: 1, max: 100000 }),
        (contextType, seed) => {
          const rng = createRNG(seed);
          const interview = generateInterview({ type: contextType }, rng);

          expect(interview.questions.length).toBeGreaterThanOrEqual(1);
          for (const question of interview.questions) {
            expect(question.answers).toHaveLength(3);
            // Each answer has a distinct tone
            const tones = question.answers.map(a => a.tone);
            expect(tones).toContain('humble');
            expect(tones).toContain('confident');
            expect(tones).toContain('controversial');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 24: Controversial answer generates negative social post', () => {
    fc.assert(
      fc.property(
        socialStateArb,
        fc.integer({ min: 1, max: 100000 }),
        (state, seed) => {
          const rng = createRNG(seed);
          const interview = generateInterview({ type: 'post_match' }, rng);

          // Find the controversial answer
          const question = interview.questions[0];
          const controversialAnswer = question.answers.find(a => a.tone === 'controversial')!;

          const rng2 = createRNG(seed + 1);
          const result = processInterviewAnswer(
            state,
            controversialAnswer,
            { day: 1, month: 1, year: 2025 },
            rng2
          );

          // Should have at least one negative post
          const negativePosts = result.socialFeed.filter(p => p.sentiment === 'negative');
          expect(negativePosts.length).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 50 }
    );
  });
});
