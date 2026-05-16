import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type { MatchConfig } from '../../core/types';

export type NavTab = 'home' | 'club' | 'person' | 'trophy';

export type ScreenType =
  | 'main-menu'
  | 'character-creation'
  | 'club-selection'
  | 'main'
  | 'standings'
  | 'locker'
  | 'training'
  | 'match-choice'
  | 'pre-match'
  | 'match-play'
  | 'post-match'
  | 'season-end'
  | 'phone'
  | 'transfers'
  | 'social'
  | 'finance'
  | 'trophies';

/** Summary of the last match played/simulated, used by PostMatch screen */
export interface LastMatchSummary {
  homeTeamName: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
  isPlayerHome: boolean;
  playerGoals: number;
  playerAssists: number;
  playerRating: number;
  playerShots: number;
  playerDribbles: number;
  playerTackles: number;
  playerPassAccuracy: number;
  minutesPlayed: number;
}

export interface UIState {
  activeTab: NavTab;
  currentScreen: ScreenType;
  pendingMatchConfig: MatchConfig | null;
  lastMatchSummary: LastMatchSummary | null;
}

export interface UISlice {
  ui: UIState;
  setActiveTab: (tab: NavTab) => void;
  setCurrentScreen: (screen: ScreenType) => void;
  setPendingMatchConfig: (config: MatchConfig | null) => void;
  setLastMatchSummary: (summary: LastMatchSummary | null) => void;
}

const initialUIState: UIState = {
  activeTab: 'home',
  currentScreen: 'main-menu',
  pendingMatchConfig: null,
  lastMatchSummary: null,
};

export const createUISlice: StateCreator<GameStore, [], [], UISlice> = (set) => ({
  ui: initialUIState,

  setActiveTab: (tab) =>
    set((state) => ({
      ui: { ...state.ui, activeTab: tab },
    })),

  setCurrentScreen: (screen) =>
    set((state) => ({
      ui: { ...state.ui, currentScreen: screen },
    })),

  setPendingMatchConfig: (config) =>
    set((state) => ({
      ui: { ...state.ui, pendingMatchConfig: config },
    })),

  setLastMatchSummary: (summary) =>
    set((state) => ({
      ui: { ...state.ui, lastMatchSummary: summary },
    })),
});
