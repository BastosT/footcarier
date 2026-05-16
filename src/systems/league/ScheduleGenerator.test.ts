import { describe, it, expect } from 'vitest';
import { generateRoundRobin, assignDates } from './ScheduleGenerator';
import type { GameDate } from '../../core/types';

// Generate 18 club IDs for testing
const clubIds = Array.from({ length: 18 }, (_, i) => `club-${i + 1}`);

describe('ScheduleGenerator', () => {
  describe('generateRoundRobin', () => {
    it('should throw if not exactly 18 clubs', () => {
      expect(() => generateRoundRobin(['a', 'b'], 2024)).toThrow('Expected exactly 18 clubs');
    });

    it('should generate exactly 306 matches (34 matchdays × 9 matches)', () => {
      const matches = generateRoundRobin(clubIds, 2024);
      expect(matches).toHaveLength(306);
    });

    it('should produce exactly 34 matchdays', () => {
      const matches = generateRoundRobin(clubIds, 2024);
      const matchdays = new Set(matches.map((m) => m.matchday));
      expect(matchdays.size).toBe(34);
    });

    it('should have 9 matches per matchday', () => {
      const matches = generateRoundRobin(clubIds, 2024);
      for (let md = 1; md <= 34; md++) {
        const mdMatches = matches.filter((m) => m.matchday === md);
        expect(mdMatches).toHaveLength(9);
      }
    });

    it('should have each team play exactly once per matchday', () => {
      const matches = generateRoundRobin(clubIds, 2024);
      for (let md = 1; md <= 34; md++) {
        const mdMatches = matches.filter((m) => m.matchday === md);
        const teams = new Set<string>();
        for (const match of mdMatches) {
          teams.add(match.homeTeam);
          teams.add(match.awayTeam);
        }
        expect(teams.size).toBe(18);
      }
    });

    it('should have each team play 34 matches total (17 home, 17 away)', () => {
      const matches = generateRoundRobin(clubIds, 2024);
      for (const clubId of clubIds) {
        const homeMatches = matches.filter((m) => m.homeTeam === clubId);
        const awayMatches = matches.filter((m) => m.awayTeam === clubId);
        expect(homeMatches).toHaveLength(17);
        expect(awayMatches).toHaveLength(17);
      }
    });

    it('should have each pair of teams meet exactly twice (once home, once away)', () => {
      const matches = generateRoundRobin(clubIds, 2024);
      for (let i = 0; i < clubIds.length; i++) {
        for (let j = i + 1; j < clubIds.length; j++) {
          const a = clubIds[i];
          const b = clubIds[j];
          const abHome = matches.filter((m) => m.homeTeam === a && m.awayTeam === b);
          const baHome = matches.filter((m) => m.homeTeam === b && m.awayTeam === a);
          expect(abHome).toHaveLength(1);
          expect(baHome).toHaveLength(1);
        }
      }
    });

    it('should set competition to "league"', () => {
      const matches = generateRoundRobin(clubIds, 2024);
      expect(matches.every((m) => m.competition === 'league')).toBe(true);
    });

    it('return leg matchdays should be the reverse of first leg', () => {
      const matches = generateRoundRobin(clubIds, 2024);
      for (let md = 1; md <= 17; md++) {
        const firstLeg = matches.filter((m) => m.matchday === md);
        const returnLeg = matches.filter((m) => m.matchday === md + 17);
        for (const fl of firstLeg) {
          const rl = returnLeg.find(
            (m) => m.homeTeam === fl.awayTeam && m.awayTeam === fl.homeTeam
          );
          expect(rl).toBeDefined();
        }
      }
    });
  });

  describe('assignDates', () => {
    const startDate: GameDate = { day: 10, month: 8, year: 2024 };

    it('should assign the start date to matchday 1', () => {
      const matches = generateRoundRobin(clubIds, 2024);
      const dated = assignDates(matches, startDate);
      const md1 = dated.filter((m) => m.matchday === 1);
      expect(md1.every((m) => m.date.day === 10 && m.date.month === 8 && m.date.year === 2024)).toBe(true);
    });

    it('should assign dates 7 days apart for consecutive matchdays', () => {
      const matches = generateRoundRobin(clubIds, 2024);
      const dated = assignDates(matches, startDate);
      const md1Date = dated.find((m) => m.matchday === 1)!.date;
      const md2Date = dated.find((m) => m.matchday === 2)!.date;
      // Aug 10 + 7 = Aug 17
      expect(md2Date).toEqual({ day: 17, month: 8, year: 2024 });
    });

    it('should handle month overflow correctly', () => {
      const matches = generateRoundRobin(clubIds, 2024);
      const dated = assignDates(matches, { day: 28, month: 8, year: 2024 });
      // Matchday 1: Aug 28, Matchday 2: Aug 28 + 7 = Sep 4
      const md2Date = dated.find((m) => m.matchday === 2)!.date;
      expect(md2Date).toEqual({ day: 4, month: 9, year: 2024 });
    });

    it('should assign all matches in the same matchday the same date', () => {
      const matches = generateRoundRobin(clubIds, 2024);
      const dated = assignDates(matches, startDate);
      for (let md = 1; md <= 34; md++) {
        const mdMatches = dated.filter((m) => m.matchday === md);
        const dates = mdMatches.map((m) => JSON.stringify(m.date));
        expect(new Set(dates).size).toBe(1);
      }
    });
  });
});
