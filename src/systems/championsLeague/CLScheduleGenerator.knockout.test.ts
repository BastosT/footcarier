/**
 * Unit tests pour le calendrier des tours éliminatoires de la Ligue des Champions.
 * Vérifie les mois corrects pour chaque tour et que la finale est le dernier samedi de mai.
 *
 * Validates: Requirements 4.3, 4.4, 4.5, 4.6
 */

import { describe, it, expect } from 'vitest';
import { generateKnockoutSchedule } from './CLScheduleGenerator';

describe('generateKnockoutSchedule', () => {
  const testSeasons = [2023, 2024, 2025, 2026];

  describe('Requirement 4.3: Huitièmes de finale en février-mars', () => {
    it('should schedule round of 16 dates in February or March', () => {
      for (const season of testSeasons) {
        const schedule = generateKnockoutSchedule(season, 'round-of-16');
        expect(schedule.length).toBe(2);

        for (const match of schedule) {
          const { month, year } = match.date;
          expect(year).toBe(season + 1);
          expect(month).toBeGreaterThanOrEqual(2);
          expect(month).toBeLessThanOrEqual(3);
        }
      }
    });
  });

  describe('Requirement 4.4: Quarts de finale en avril', () => {
    it('should schedule quarter-final dates in April', () => {
      for (const season of testSeasons) {
        const schedule = generateKnockoutSchedule(season, 'quarter-final');
        expect(schedule.length).toBe(2);

        for (const match of schedule) {
          const { month, year } = match.date;
          expect(year).toBe(season + 1);
          expect(month).toBe(4);
        }
      }
    });
  });

  describe('Requirement 4.5: Demi-finales en avril-mai', () => {
    it('should schedule semi-final dates in April or May', () => {
      for (const season of testSeasons) {
        const schedule = generateKnockoutSchedule(season, 'semi-final');
        expect(schedule.length).toBe(2);

        for (const match of schedule) {
          const { month, year } = match.date;
          expect(year).toBe(season + 1);
          expect(month).toBeGreaterThanOrEqual(4);
          expect(month).toBeLessThanOrEqual(5);
        }
      }
    });
  });

  describe('Requirement 4.6: Finale le dernier samedi de mai', () => {
    it('should schedule the final on the last Saturday of May', () => {
      for (const season of testSeasons) {
        const schedule = generateKnockoutSchedule(season, 'final');
        expect(schedule.length).toBe(1);

        const finalMatch = schedule[0];
        const { day, month, year } = finalMatch.date;

        expect(year).toBe(season + 1);
        expect(month).toBe(5);

        // Verify it's a Saturday (6 = Saturday in JS Date.getDay())
        const date = new Date(year, month - 1, day);
        expect(date.getDay()).toBe(6);

        // Verify it's the LAST Saturday of May
        // The next Saturday would be in June (day + 7 > days in May)
        const daysInMay = new Date(year, 5, 0).getDate(); // month 5 with day 0 = last day of May
        expect(day + 7).toBeGreaterThan(daysInMay);
      }
    });

    it('should return the correct last Saturday of May for known years', () => {
      // 2024: May 25 is the last Saturday
      const schedule2023 = generateKnockoutSchedule(2023, 'final');
      expect(schedule2023[0].date).toEqual({ day: 25, month: 5, year: 2024 });

      // 2025: May 31 is the last Saturday
      const schedule2024 = generateKnockoutSchedule(2024, 'final');
      expect(schedule2024[0].date).toEqual({ day: 31, month: 5, year: 2025 });

      // 2026: May 30 is the last Saturday
      const schedule2025 = generateKnockoutSchedule(2025, 'final');
      expect(schedule2025[0].date).toEqual({ day: 30, month: 5, year: 2026 });

      // 2027: May 29 is the last Saturday
      const schedule2026 = generateKnockoutSchedule(2026, 'final');
      expect(schedule2026[0].date).toEqual({ day: 29, month: 5, year: 2027 });
    });
  });

  describe('Knockout dates are Tuesday or Wednesday (except final)', () => {
    it('should schedule round of 16 matches on Tuesday or Wednesday', () => {
      for (const season of testSeasons) {
        const schedule = generateKnockoutSchedule(season, 'round-of-16');
        for (const match of schedule) {
          const { day, month, year } = match.date;
          const weekday = new Date(year, month - 1, day).getDay();
          // Tuesday = 2, Wednesday = 3
          expect([2, 3]).toContain(weekday);
        }
      }
    });

    it('should schedule quarter-final matches on Tuesday or Wednesday', () => {
      for (const season of testSeasons) {
        const schedule = generateKnockoutSchedule(season, 'quarter-final');
        for (const match of schedule) {
          const { day, month, year } = match.date;
          const weekday = new Date(year, month - 1, day).getDay();
          expect([2, 3]).toContain(weekday);
        }
      }
    });

    it('should schedule semi-final matches on Tuesday or Wednesday', () => {
      for (const season of testSeasons) {
        const schedule = generateKnockoutSchedule(season, 'semi-final');
        for (const match of schedule) {
          const { day, month, year } = match.date;
          const weekday = new Date(year, month - 1, day).getDay();
          expect([2, 3]).toContain(weekday);
        }
      }
    });
  });

  describe('Final date is a Saturday', () => {
    it('should schedule the final on a Saturday', () => {
      for (const season of testSeasons) {
        const schedule = generateKnockoutSchedule(season, 'final');
        const { day, month, year } = schedule[0].date;
        const weekday = new Date(year, month - 1, day).getDay();
        // Saturday = 6
        expect(weekday).toBe(6);
      }
    });
  });

  describe('Two-legged ties have 2 dates spaced at least 2 weeks apart', () => {
    it('should have at least 14 days between first and second leg for round of 16', () => {
      for (const season of testSeasons) {
        const schedule = generateKnockoutSchedule(season, 'round-of-16');
        expect(schedule.length).toBe(2);

        const firstLeg = schedule[0].date;
        const secondLeg = schedule[1].date;

        const date1 = new Date(firstLeg.year, firstLeg.month - 1, firstLeg.day);
        const date2 = new Date(secondLeg.year, secondLeg.month - 1, secondLeg.day);
        const daysDiff = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

        expect(daysDiff).toBeGreaterThanOrEqual(14);
      }
    });

    it('should have at least 14 days between first and second leg for quarter-finals', () => {
      for (const season of testSeasons) {
        const schedule = generateKnockoutSchedule(season, 'quarter-final');
        expect(schedule.length).toBe(2);

        const firstLeg = schedule[0].date;
        const secondLeg = schedule[1].date;

        const date1 = new Date(firstLeg.year, firstLeg.month - 1, firstLeg.day);
        const date2 = new Date(secondLeg.year, secondLeg.month - 1, secondLeg.day);
        const daysDiff = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

        expect(daysDiff).toBeGreaterThanOrEqual(14);
      }
    });

    it('should have at least 14 days between first and second leg for semi-finals', () => {
      for (const season of testSeasons) {
        const schedule = generateKnockoutSchedule(season, 'semi-final');
        expect(schedule.length).toBe(2);

        const firstLeg = schedule[0].date;
        const secondLeg = schedule[1].date;

        const date1 = new Date(firstLeg.year, firstLeg.month - 1, firstLeg.day);
        const date2 = new Date(secondLeg.year, secondLeg.month - 1, secondLeg.day);
        const daysDiff = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

        expect(daysDiff).toBeGreaterThanOrEqual(14);
      }
    });

    it('should have leg 1 and leg 2 markers on two-legged ties', () => {
      const schedule = generateKnockoutSchedule(2024, 'round-of-16');
      expect(schedule[0].leg).toBe(1);
      expect(schedule[1].leg).toBe(2);
    });
  });
});
