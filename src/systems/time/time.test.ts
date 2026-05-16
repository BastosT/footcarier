import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { advanceDay, simulateWeek, createInitialTimeState } from './TimeSystem';
import { evaluateDay, applyEventEffects, MAX_EVENTS_PER_WEEK } from './RandomEventEngine';
import { createRNG } from '../../utils/random';
import type { TimeState, EventEffects } from '../../core/types';

describe('TimeSystem - Property Tests', () => {
  it('Property 18: Maximum 3 random events per calendar week', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        (seed) => {
          const rng = createRNG(seed);
          let state = createInitialTimeState(1);

          // Simulate 7 days and track events per calendar week
          let eventsInCurrentWeek = 0;

          for (let i = 0; i < 7; i++) {
            const result = advanceDay(state, rng);
            state = result.newState;

            // If Monday, reset counter
            if (state.weekday === 0) {
              eventsInCurrentWeek = 0;
            }

            eventsInCurrentWeek += result.dayResult.events.length;
            // At no point should we exceed 3 in a calendar week
            expect(state.eventsThisWeek).toBeLessThanOrEqual(MAX_EVENTS_PER_WEEK);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 19: Event effects are applied correctly (respecting bounds)', () => {
    fc.assert(
      fc.property(
        fc.record({
          money: fc.integer({ min: -10000, max: 10000 }),
          fitness: fc.integer({ min: -20, max: 20 }),
          popularity: fc.integer({ min: -20, max: 20 }),
          coachRelation: fc.integer({ min: -20, max: 20 }),
          teamRelation: fc.integer({ min: -20, max: 20 }),
        }),
        fc.record({
          popularity: fc.integer({ min: 0, max: 100 }),
          coachRelation: fc.integer({ min: 0, max: 100 }),
          teamRelation: fc.integer({ min: 0, max: 100 }),
          fitness: fc.integer({ min: 0, max: 100 }),
          balance: fc.integer({ min: 0, max: 1000000 }),
        }),
        (effects: EventEffects, currentState) => {
          const result = applyEventEffects(effects, currentState);

          // All bounded values stay in [0, 100]
          expect(result.popularity).toBeGreaterThanOrEqual(0);
          expect(result.popularity).toBeLessThanOrEqual(100);
          expect(result.coachRelation).toBeGreaterThanOrEqual(0);
          expect(result.coachRelation).toBeLessThanOrEqual(100);
          expect(result.teamRelation).toBeGreaterThanOrEqual(0);
          expect(result.teamRelation).toBeLessThanOrEqual(100);
          expect(result.fitness).toBeGreaterThanOrEqual(0);
          expect(result.fitness).toBeLessThanOrEqual(100);

          // Balance changes exactly by money amount
          expect(result.balance).toBe(currentState.balance + (effects.money ?? 0));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 20: Day-by-day and week simulation produce consistent results', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        (seed) => {
          // Simulate day by day
          const rng1 = createRNG(seed);
          let state1 = createInitialTimeState(1);
          let dayByDayEvents = 0;

          for (let i = 0; i < 7; i++) {
            const result = advanceDay(state1, rng1);
            state1 = result.newState;
            dayByDayEvents += result.dayResult.events.length;
          }

          // Simulate week (same seed = same RNG sequence = same results)
          const rng2 = createRNG(seed);
          const state2 = createInitialTimeState(1);
          const weekResult = simulateWeek(state2, rng2);

          // Both should produce same number of events (same seed, same logic)
          expect(weekResult.summary.events.length).toBe(dayByDayEvents);

          // Final dates should match
          expect(state1.currentDate).toEqual(weekResult.newState.currentDate);
        }
      ),
      { numRuns: 50 }
    );
  });
});
