/**
 * TimeSystem - Gère l'avancement du temps, le calendrier et la simulation.
 */

import type { GameDate, TimeState, DayResult, WeekSummary, RandomEvent, DayActivity, TrainingResult } from '../../core/types';
import { evaluateDay } from './RandomEventEngine';
import { type RNG, defaultRNG } from '../../utils/random';

/**
 * Avance la date d'un jour.
 */
export function advanceDate(date: GameDate): GameDate {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let { day, month, year } = date;

  day++;
  if (day > daysInMonth[month - 1]) {
    day = 1;
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return { day, month, year };
}

/**
 * Avance le jour de la semaine (0=lundi, 6=dimanche).
 */
export function advanceWeekday(weekday: number): number {
  return (weekday + 1) % 7;
}

/**
 * Vérifie si c'est un lundi (reset du compteur hebdomadaire).
 */
export function isMonday(weekday: number): boolean {
  return weekday === 0;
}

/**
 * Vérifie si c'est un jour de match.
 */
export function isMatchDay(state: TimeState): boolean {
  if (!state.schedule.nextMatch) return false;
  const { currentDate } = state;
  const matchDate = state.schedule.nextMatch.date;
  return currentDate.day === matchDate.day &&
    currentDate.month === matchDate.month &&
    currentDate.year === matchDate.year;
}

/**
 * Simule un jour et retourne le résultat.
 */
export function advanceDay(
  state: TimeState,
  rng: RNG = defaultRNG
): { newState: TimeState; dayResult: DayResult } {
  const newDate = advanceDate(state.currentDate);
  const newWeekday = advanceWeekday(state.weekday);

  // Reset weekly counter on Monday
  let eventsThisWeek = isMonday(newWeekday) ? 0 : state.eventsThisWeek;

  // Evaluate random event
  const event = evaluateDay(eventsThisWeek, rng);
  const events: RandomEvent[] = [];
  if (event) {
    events.push(event);
    eventsThisWeek++;
  }

  const newState: TimeState = {
    ...state,
    currentDate: newDate,
    weekday: newWeekday,
    eventsThisWeek,
  };

  const matchDay = isMatchDay(newState);

  const dayResult: DayResult = {
    date: newDate,
    events,
    isMatchDay: matchDay,
    activities: matchDay
      ? [{ type: 'match', description: 'Jour de match' }]
      : [{ type: 'training', description: 'Entraînement' }],
  };

  return { newState, dayResult };
}

/**
 * Simule une semaine complète (7 jours).
 */
export function simulateWeek(
  state: TimeState,
  rng: RNG = defaultRNG
): { newState: TimeState; summary: WeekSummary } {
  const startDate = state.currentDate;
  let currentState = state;
  const allEvents: RandomEvent[] = [];
  let matchDay: GameDate | null = null;

  for (let i = 0; i < 7; i++) {
    const { newState, dayResult } = advanceDay(currentState, rng);
    currentState = newState;
    allEvents.push(...dayResult.events);
    if (dayResult.isMatchDay) {
      matchDay = dayResult.date;
    }
  }

  const summary: WeekSummary = {
    startDate,
    endDate: currentState.currentDate,
    events: allEvents,
    trainingResults: [],
    matchDay,
  };

  return { newState: currentState, summary };
}

/**
 * Calcule le nombre de jours jusqu'au prochain match.
 */
export function getDaysUntilNextMatch(state: TimeState): number {
  if (!state.schedule.nextMatch) return -1;

  const current = state.currentDate;
  const match = state.schedule.nextMatch.date;

  // Simple approximation (doesn't handle month boundaries perfectly)
  const currentDays = current.year * 365 + current.month * 30 + current.day;
  const matchDays = match.year * 365 + match.month * 30 + match.day;

  return Math.max(0, matchDays - currentDays);
}

/**
 * Crée un état temporel initial.
 */
export function createInitialTimeState(season: number): TimeState {
  return {
    currentDate: { day: 8, month: 8, year: 2024 },
    season,
    weekday: 3, // Thursday (Aug 8, 2024 is a Thursday)
    eventsThisWeek: 0,
    schedule: {
      nextMatch: null,
      seasonMatches: [],
    },
  };
}

export const TimeSystem = {
  advanceDate,
  advanceWeekday,
  isMonday,
  isMatchDay,
  advanceDay,
  simulateWeek,
  getDaysUntilNextMatch,
  createInitialTimeState,
};
