/**
 * Unit tests for FillerTeamGenerator.
 * Validates that the generator produces exactly 30 valid filler teams.
 */

import { describe, it, expect } from 'vitest';
import { FillerTeamGenerator } from './FillerTeamGenerator';
import { CL_CONSTANTS } from './types';
import { createRNG } from '../../utils/random';

const MAIN_LEAGUE_COUNTRIES = ['france', 'england', 'spain', 'italy', 'germany'];

describe('FillerTeamGenerator', () => {
  it('should generate exactly 30 teams', () => {
    const rng = createRNG(42);
    const teams = FillerTeamGenerator.generate(rng);
    expect(teams).toHaveLength(CL_CONSTANTS.TOTAL_FILLERS);
  });

  it('should mark all teams as filler', () => {
    const rng = createRNG(42);
    const teams = FillerTeamGenerator.generate(rng);
    for (const team of teams) {
      expect(team.isFiller).toBe(true);
    }
  });

  it('should generate unique names for all teams', () => {
    const rng = createRNG(42);
    const teams = FillerTeamGenerator.generate(rng);
    const names = teams.map(t => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(CL_CONSTANTS.TOTAL_FILLERS);
  });

  it('should generate averageRating between 60 and 80 for all teams', () => {
    const rng = createRNG(42);
    const teams = FillerTeamGenerator.generate(rng);
    for (const team of teams) {
      expect(team.averageRating).toBeGreaterThanOrEqual(60);
      expect(team.averageRating).toBeLessThanOrEqual(80);
    }
  });

  it('should not use countries from the 5 main leagues', () => {
    const rng = createRNG(42);
    const teams = FillerTeamGenerator.generate(rng);
    for (const team of teams) {
      expect(MAIN_LEAGUE_COUNTRIES).not.toContain(team.country.toLowerCase());
    }
  });

  it('should have non-empty name and country for all teams', () => {
    const rng = createRNG(42);
    const teams = FillerTeamGenerator.generate(rng);
    for (const team of teams) {
      expect(team.name.length).toBeGreaterThan(0);
      expect(team.country.length).toBeGreaterThan(0);
    }
  });

  it('should produce reproducible results with the same seed', () => {
    const teams1 = FillerTeamGenerator.generate(createRNG(123));
    const teams2 = FillerTeamGenerator.generate(createRNG(123));
    expect(teams1).toEqual(teams2);
  });

  it('should produce different ratings with different seeds', () => {
    const teams1 = FillerTeamGenerator.generate(createRNG(1));
    const teams2 = FillerTeamGenerator.generate(createRNG(999));
    // At least some ratings should differ
    const ratings1 = teams1.map(t => t.averageRating);
    const ratings2 = teams2.map(t => t.averageRating);
    expect(ratings1).not.toEqual(ratings2);
  });

  it('should generate valid IDs for all teams', () => {
    const rng = createRNG(42);
    const teams = FillerTeamGenerator.generate(rng);
    for (let i = 0; i < teams.length; i++) {
      expect(teams[i].id).toBe(`filler-${i + 1}`);
    }
  });
});
