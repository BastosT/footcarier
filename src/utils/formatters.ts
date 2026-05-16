/**
 * Fonctions de formatage pour les dates (GameDate), nombres et monnaie.
 */

import type { GameDate } from '../core/types';

/**
 * Formate une GameDate en chaîne lisible (format français JJ/MM/AAAA).
 * @example formatGameDate({ day: 15, month: 8, year: 2024 }) => "15/08/2024"
 */
export function formatGameDate(date: GameDate): string {
  const day = String(date.day).padStart(2, '0');
  const month = String(date.month).padStart(2, '0');
  const year = String(date.year);
  return `${day}/${month}/${year}`;
}

/**
 * Formate un montant en euros avec séparateur de milliers.
 * @example formatCurrency(1500000) => "€1 500 000"
 * @example formatCurrency(-500) => "-€500"
 */
export function formatCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = formatNumber(absAmount);
  return isNegative ? `-€${formatted}` : `€${formatted}`;
}

/**
 * Formate un nombre avec des espaces comme séparateurs de milliers (format français).
 * @example formatNumber(1500000) => "1 500 000"
 * @example formatNumber(42) => "42"
 */
export function formatNumber(n: number): string {
  const intPart = Math.floor(Math.abs(n));
  const str = intPart.toString();
  const groups: string[] = [];

  for (let i = str.length; i > 0; i -= 3) {
    const start = Math.max(0, i - 3);
    groups.unshift(str.slice(start, i));
  }

  const formatted = groups.join(' ');
  return n < 0 ? `-${formatted}` : formatted;
}

const WEEKDAY_NAMES = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
] as const;

/**
 * Retourne le nom du jour de la semaine en français.
 * @param weekday - Index du jour (0 = lundi, 6 = dimanche)
 */
export function getWeekdayName(weekday: number): string {
  if (weekday < 0 || weekday > 6 || !Number.isInteger(weekday)) {
    throw new Error('Weekday must be an integer between 0 and 6');
  }
  return WEEKDAY_NAMES[weekday];
}
