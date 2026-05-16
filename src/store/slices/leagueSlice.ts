import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type { Division } from './careerSlice';
import type { ScheduledMatch } from './timeSlice';

export interface LeagueStanding {
  clubId: string;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  position: number;
}

export interface MatchPerformance {
  rating: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
  shots: number;
  passAccuracy: number;
  dribbles: number;
  tackles: number;
}

export interface MatchResult {
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  playerPerformance?: MatchPerformance;
}

export interface TopScorer {
  playerId: string;
  playerName: string;
  clubId: string;
  clubName: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
}

export interface LeagueState {
  division: Division;
  standings: LeagueStanding[];
  results: MatchResult[];
  season: number;
  topScorers: TopScorer[];
  schedule: ScheduledMatch[];
}

/** Maximum number of leagues supported simultaneously (one per country). */
export const MAX_LEAGUES = 5;

export interface LeagueSlice {
  leagues: LeagueState[];
  setLeagues: (leagues: LeagueState[]) => void;
  updateStandings: (divisionCountry: string, divisionLevel: number, standings: LeagueStanding[]) => void;
  updateTopScorers: (divisionCountry: string, divisionLevel: number, topScorers: TopScorer[]) => void;
  setSchedule: (divisionCountry: string, divisionLevel: number, schedule: ScheduledMatch[]) => void;
  addMatchResult: (divisionCountry: string, divisionLevel: number, result: MatchResult) => void;
  resetLeagues: () => void;
}

export const createLeagueSlice: StateCreator<GameStore, [], [], LeagueSlice> = (set) => ({
  leagues: [],

  setLeagues: (leagues) => set({ leagues: leagues.slice(0, MAX_LEAGUES) }),

  updateStandings: (divisionCountry, divisionLevel, standings) =>
    set((state) => ({
      leagues: state.leagues.map((league) =>
        league.division.country === divisionCountry && league.division.level === divisionLevel
          ? { ...league, standings }
          : league
      ),
    })),

  updateTopScorers: (divisionCountry, divisionLevel, topScorers) =>
    set((state) => ({
      leagues: state.leagues.map((league) =>
        league.division.country === divisionCountry && league.division.level === divisionLevel
          ? { ...league, topScorers }
          : league
      ),
    })),

  setSchedule: (divisionCountry, divisionLevel, schedule) =>
    set((state) => ({
      leagues: state.leagues.map((league) =>
        league.division.country === divisionCountry && league.division.level === divisionLevel
          ? { ...league, schedule }
          : league
      ),
    })),

  addMatchResult: (divisionCountry, divisionLevel, result) =>
    set((state) => ({
      leagues: state.leagues.map((league) =>
        league.division.country === divisionCountry && league.division.level === divisionLevel
          ? { ...league, results: [...league.results, result] }
          : league
      ),
    })),

  resetLeagues: () => set({ leagues: [] }),
});
