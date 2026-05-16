import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';

// Types imported from core/types.ts (defined in parallel)
// Re-exported here for slice-level usage until types.ts is available

export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST';

export type InjuryType = 'muscle' | 'ligament' | 'fracture' | 'concussion' | 'fatigue';

export interface InjuryState {
  type: InjuryType;
  weeksRemaining: number;
  severity: 'minor' | 'moderate' | 'severe';
}

export interface PlayerAppearance {
  skinTone: number;
  hairStyle: number;
  hairColor: number;
  height: 'short' | 'medium' | 'tall';
}

export type Country = 'france' | 'spain' | 'england' | 'italy' | 'germany';

export interface PlayerCharacter {
  id: string;
  firstName: string;
  lastName: string;
  nationality: Country;
  position: Position;
  appearance: PlayerAppearance;
  age: number;
  stats: PlayerStats;
  potential: number;
  overallRating: number;
  fitness: number;
  morale: number;
  injury: InjuryState | null;
}

export interface PlayerSlice {
  player: PlayerCharacter | null;
  setPlayer: (player: PlayerCharacter) => void;
  updateStats: (stats: Partial<PlayerStats>) => void;
  updateFitness: (fitness: number) => void;
  updateMorale: (morale: number) => void;
  setInjury: (injury: InjuryState | null) => void;
  updateOverallRating: (rating: number) => void;
}

export const createPlayerSlice: StateCreator<GameStore, [], [], PlayerSlice> = (set) => ({
  player: null,

  setPlayer: (player) => set({ player }),

  updateStats: (stats) =>
    set((state) => {
      if (!state.player) return state;
      return {
        player: {
          ...state.player,
          stats: { ...state.player.stats, ...stats },
        },
      };
    }),

  updateFitness: (fitness) =>
    set((state) => {
      if (!state.player) return state;
      return {
        player: {
          ...state.player,
          fitness: Math.max(0, Math.min(100, fitness)),
        },
      };
    }),

  updateMorale: (morale) =>
    set((state) => {
      if (!state.player) return state;
      return {
        player: {
          ...state.player,
          morale: Math.max(0, Math.min(100, morale)),
        },
      };
    }),

  setInjury: (injury) =>
    set((state) => {
      if (!state.player) return state;
      return {
        player: { ...state.player, injury },
      };
    }),

  updateOverallRating: (rating) =>
    set((state) => {
      if (!state.player) return state;
      return {
        player: {
          ...state.player,
          overallRating: Math.max(1, Math.min(99, rating)),
        },
      };
    }),
});
