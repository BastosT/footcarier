import { describe, it, expect } from 'vitest';
import { allClubs } from './index';
import type { Club, Position, Country, ClubTier } from '../../core/types';

const VALID_POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const VALID_COUNTRIES: Country[] = ['france', 'spain', 'england', 'italy', 'germany'];
const VALID_TIERS: ClubTier[] = ['small', 'medium', 'big'];

describe('Club Data Integrity - Property 2', () => {
  it('Property 2: Every club has valid tier, country, non-empty squad, and valid players', () => {
    expect(allClubs.length).toBeGreaterThan(0);

    for (const club of allClubs) {
      // Valid tier
      expect(VALID_TIERS).toContain(club.tier);

      // Valid country
      expect(VALID_COUNTRIES).toContain(club.country);

      // Non-empty squad
      expect(club.squad.length).toBeGreaterThan(0);

      // Each player has valid position and rating
      for (const player of club.squad) {
        expect(VALID_POSITIONS).toContain(player.position);
        expect(player.overallRating).toBeGreaterThanOrEqual(1);
        expect(player.overallRating).toBeLessThanOrEqual(99);
        expect(player.potential).toBeGreaterThanOrEqual(1);
        expect(player.potential).toBeLessThanOrEqual(99);
        expect(player.age).toBeGreaterThanOrEqual(15);
        expect(player.age).toBeLessThanOrEqual(45);
        expect(player.name.length).toBeGreaterThan(0);
        expect(player.id.length).toBeGreaterThan(0);
      }
    }
  });

  it('has clubs from all 5 countries', () => {
    for (const country of VALID_COUNTRIES) {
      const countryClubs = allClubs.filter(c => c.country === country);
      expect(countryClubs.length).toBeGreaterThan(0);
    }
  });

  it('has clubs from all 3 tiers', () => {
    for (const tier of VALID_TIERS) {
      const tierClubs = allClubs.filter(c => c.tier === tier);
      expect(tierClubs.length).toBeGreaterThan(0);
    }
  });

  it('each country has at least 2 divisions', () => {
    for (const country of VALID_COUNTRIES) {
      const countryClubs = allClubs.filter(c => c.country === country);
      const levels = new Set(countryClubs.map(c => c.division.level));
      expect(levels.size).toBeGreaterThanOrEqual(2);
    }
  });

  it('club IDs are unique', () => {
    const ids = allClubs.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('division country matches club country', () => {
    for (const club of allClubs) {
      expect(club.division.country).toBe(club.country);
    }
  });
});
