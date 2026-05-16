import { describe, it, expect } from 'vitest';
import { formatGameDate, formatCurrency, formatNumber, getWeekdayName } from './formatters';

describe('formatters - formatGameDate', () => {
  it('formate une date avec padding des zéros', () => {
    expect(formatGameDate({ day: 5, month: 3, year: 2024 })).toBe('05/03/2024');
  });

  it('formate une date sans padding nécessaire', () => {
    expect(formatGameDate({ day: 15, month: 12, year: 2025 })).toBe('15/12/2025');
  });

  it('formate le premier jour de l\'année', () => {
    expect(formatGameDate({ day: 1, month: 1, year: 2020 })).toBe('01/01/2020');
  });

  it('formate le 15 août 2024 (exemple de la spec)', () => {
    expect(formatGameDate({ day: 15, month: 8, year: 2024 })).toBe('15/08/2024');
  });
});

describe('formatters - formatCurrency', () => {
  it('formate un montant simple', () => {
    expect(formatCurrency(500)).toBe('€500');
  });

  it('formate un montant avec séparateurs de milliers', () => {
    expect(formatCurrency(1500000)).toBe('€1 500 000');
  });

  it('formate zéro', () => {
    expect(formatCurrency(0)).toBe('€0');
  });

  it('formate un montant négatif', () => {
    expect(formatCurrency(-500)).toBe('-€500');
  });

  it('formate un grand montant négatif', () => {
    expect(formatCurrency(-2500000)).toBe('-€2 500 000');
  });
});

describe('formatters - formatNumber', () => {
  it('formate un petit nombre sans séparateur', () => {
    expect(formatNumber(42)).toBe('42');
  });

  it('formate un nombre à 4 chiffres', () => {
    expect(formatNumber(1500)).toBe('1 500');
  });

  it('formate un million', () => {
    expect(formatNumber(1000000)).toBe('1 000 000');
  });

  it('formate zéro', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formate un nombre négatif', () => {
    expect(formatNumber(-1234)).toBe('-1 234');
  });

  it('formate un nombre à 3 chiffres sans séparateur', () => {
    expect(formatNumber(999)).toBe('999');
  });
});

describe('formatters - getWeekdayName', () => {
  it('retourne lundi pour 0', () => {
    expect(getWeekdayName(0)).toBe('lundi');
  });

  it('retourne dimanche pour 6', () => {
    expect(getWeekdayName(6)).toBe('dimanche');
  });

  it('retourne mercredi pour 2', () => {
    expect(getWeekdayName(2)).toBe('mercredi');
  });

  it('retourne tous les jours correctement', () => {
    const expected = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    for (let i = 0; i < 7; i++) {
      expect(getWeekdayName(i)).toBe(expected[i]);
    }
  });

  it('lance une erreur pour un index invalide', () => {
    expect(() => getWeekdayName(-1)).toThrow('Weekday must be an integer between 0 and 6');
    expect(() => getWeekdayName(7)).toThrow('Weekday must be an integer between 0 and 6');
    expect(() => getWeekdayName(3.5)).toThrow('Weekday must be an integer between 0 and 6');
  });
});
