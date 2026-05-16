import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';

export interface GameDate {
  day: number;
  month: number;
  year: number;
}

export interface ScheduledMatch {
  date: GameDate;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchday: number;
}

export interface MatchSchedule {
  nextMatch: ScheduledMatch | null;
  seasonMatches: ScheduledMatch[];
}

export interface TimeState {
  currentDate: GameDate;
  season: number;
  weekday: number;
  eventsThisWeek: number;
  schedule: MatchSchedule;
}

export interface TimeSlice {
  time: TimeState;
  setCurrentDate: (date: GameDate) => void;
  setWeekday: (weekday: number) => void;
  incrementEventsThisWeek: () => void;
  resetWeeklyEvents: () => void;
  setSchedule: (schedule: MatchSchedule) => void;
  setNextMatch: (match: ScheduledMatch | null) => void;
  advanceDay: () => void;
}

const initialTimeState: TimeState = {
  currentDate: { day: 1, month: 8, year: 2024 },
  season: 1,
  weekday: 0,
  eventsThisWeek: 0,
  schedule: {
    nextMatch: null,
    seasonMatches: [],
  },
};

export const createTimeSlice: StateCreator<GameStore, [], [], TimeSlice> = (set) => ({
  time: initialTimeState,

  setCurrentDate: (date) =>
    set((state) => ({
      time: { ...state.time, currentDate: date },
    })),

  setWeekday: (weekday) =>
    set((state) => ({
      time: { ...state.time, weekday },
    })),

  incrementEventsThisWeek: () =>
    set((state) => ({
      time: { ...state.time, eventsThisWeek: state.time.eventsThisWeek + 1 },
    })),

  resetWeeklyEvents: () =>
    set((state) => ({
      time: { ...state.time, eventsThisWeek: 0 },
    })),

  setSchedule: (schedule) =>
    set((state) => ({
      time: { ...state.time, schedule },
    })),

  setNextMatch: (match) =>
    set((state) => ({
      time: {
        ...state.time,
        schedule: { ...state.time.schedule, nextMatch: match },
      },
    })),

  advanceDay: () =>
    set((state) => {
      const { currentDate, weekday } = state.time;
      const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      let newDay = currentDate.day + 1;
      let newMonth = currentDate.month;
      let newYear = currentDate.year;

      if (newDay > daysInMonth[newMonth - 1]) {
        newDay = 1;
        newMonth += 1;
        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
        }
      }

      const newWeekday = (weekday + 1) % 7;

      return {
        time: {
          ...state.time,
          currentDate: { day: newDay, month: newMonth, year: newYear },
          weekday: newWeekday,
          // Reset weekly events on Monday (weekday 0)
          eventsThisWeek: newWeekday === 0 ? 0 : state.time.eventsThisWeek,
        },
      };
    }),
});
