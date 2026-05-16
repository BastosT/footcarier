import { describe, it, expect } from 'vitest';
import { updateTeamMorale, applyCoachInfluenceOnMorale, createInitialSocialState } from './SocialSystem';
import { createRNG } from '../../utils/random';
import type { SocialState } from '../../core/types';

function createSocialState(overrides: Partial<SocialState> = {}): SocialState {
  return {
    ...createInitialSocialState(),
    ...overrides,
  };
}

describe('Team Morale - updateTeamMorale', () => {
  it('should increase morale on win (between +3 and +8)', () => {
    const rng = createRNG(42);
    const state = createSocialState({ teamMorale: 50 });
    const result = updateTeamMorale(state, 'win', rng);
    expect(result.teamMorale).toBeGreaterThanOrEqual(53);
    expect(result.teamMorale).toBeLessThanOrEqual(58);
  });

  it('should decrease morale on loss (between -3 and -8)', () => {
    const rng = createRNG(42);
    const state = createSocialState({ teamMorale: 50 });
    const result = updateTeamMorale(state, 'loss', rng);
    expect(result.teamMorale).toBeGreaterThanOrEqual(42);
    expect(result.teamMorale).toBeLessThanOrEqual(47);
  });

  it('should adjust morale on draw (between -2 and +2)', () => {
    const rng = createRNG(42);
    const state = createSocialState({ teamMorale: 50 });
    const result = updateTeamMorale(state, 'draw', rng);
    expect(result.teamMorale).toBeGreaterThanOrEqual(48);
    expect(result.teamMorale).toBeLessThanOrEqual(52);
  });

  it('should clamp morale to 100 on win when already high', () => {
    const rng = createRNG(42);
    const state = createSocialState({ teamMorale: 98 });
    const result = updateTeamMorale(state, 'win', rng);
    expect(result.teamMorale).toBeLessThanOrEqual(100);
  });

  it('should clamp morale to 0 on loss when already low', () => {
    const rng = createRNG(42);
    const state = createSocialState({ teamMorale: 2 });
    const result = updateTeamMorale(state, 'loss', rng);
    expect(result.teamMorale).toBeGreaterThanOrEqual(0);
  });

  it('should not modify other social state fields', () => {
    const rng = createRNG(42);
    const state = createSocialState({ teamMorale: 50, popularity: 75, reputation: 60 });
    const result = updateTeamMorale(state, 'win', rng);
    expect(result.popularity).toBe(75);
    expect(result.reputation).toBe(60);
    expect(result.coachRelation).toBe(state.coachRelation);
    expect(result.teamRelation).toBe(state.teamRelation);
  });
});

describe('Team Morale - applyCoachInfluenceOnMorale', () => {
  it('should increase morale when coachRelation > 50', () => {
    const state = createSocialState({ teamMorale: 50, coachRelation: 80 });
    const result = applyCoachInfluenceOnMorale(state);
    // (80 - 50) * 0.05 = 1.5 → morale = 51.5
    expect(result.teamMorale).toBeCloseTo(51.5);
  });

  it('should decrease morale when coachRelation < 50', () => {
    const state = createSocialState({ teamMorale: 50, coachRelation: 20 });
    const result = applyCoachInfluenceOnMorale(state);
    // (20 - 50) * 0.05 = -1.5 → morale = 48.5
    expect(result.teamMorale).toBeCloseTo(48.5);
  });

  it('should not change morale when coachRelation is exactly 50', () => {
    const state = createSocialState({ teamMorale: 50, coachRelation: 50 });
    const result = applyCoachInfluenceOnMorale(state);
    expect(result.teamMorale).toBe(50);
  });

  it('should clamp morale to 100 with very high coach relation', () => {
    const state = createSocialState({ teamMorale: 99, coachRelation: 100 });
    const result = applyCoachInfluenceOnMorale(state);
    // (100 - 50) * 0.05 = 2.5 → 99 + 2.5 = 101.5 → clamped to 100
    expect(result.teamMorale).toBe(100);
  });

  it('should clamp morale to 0 with very low coach relation', () => {
    const state = createSocialState({ teamMorale: 1, coachRelation: 0 });
    const result = applyCoachInfluenceOnMorale(state);
    // (0 - 50) * 0.05 = -2.5 → 1 - 2.5 = -1.5 → clamped to 0
    expect(result.teamMorale).toBe(0);
  });

  it('should not modify other social state fields', () => {
    const state = createSocialState({ teamMorale: 50, coachRelation: 80, popularity: 75 });
    const result = applyCoachInfluenceOnMorale(state);
    expect(result.popularity).toBe(75);
    expect(result.coachRelation).toBe(80);
    expect(result.teamRelation).toBe(state.teamRelation);
  });
});
