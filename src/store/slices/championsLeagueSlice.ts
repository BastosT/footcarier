import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type {
  ChampionsLeagueState,
  CLStanding,
  CLMatchResult,
  KnockoutRound,
  CLKnockoutTie,
  CLKnockoutTieResult,
} from '../../systems/championsLeague/types';

export interface ChampionsLeagueSlice {
  championsLeague: ChampionsLeagueState | null;
  initChampionsLeague: (state: ChampionsLeagueState) => void;
  updateCLStandings: (standings: CLStanding[]) => void;
  addCLMatchResult: (matchday: number, result: CLMatchResult) => void;
  advanceToKnockout: (round: KnockoutRound, ties: CLKnockoutTie[]) => void;
  updateKnockoutResult: (round: KnockoutRound, tieIndex: number, result: CLKnockoutTieResult) => void;
  setCLEliminated: () => void;
  resetChampionsLeague: () => void;
}

export const createChampionsLeagueSlice: StateCreator<GameStore, [], [], ChampionsLeagueSlice> = (set) => ({
  championsLeague: null,

  initChampionsLeague: (state) => set({ championsLeague: state }),

  updateCLStandings: (standings) =>
    set((store) => {
      if (!store.championsLeague) return {};
      return {
        championsLeague: { ...store.championsLeague, standings },
      };
    }),

  addCLMatchResult: (matchday, result) =>
    set((store) => {
      if (!store.championsLeague) return {};
      const newResults = [...store.championsLeague.leagueResults, result];
      const newMatchday = matchday > store.championsLeague.currentMatchday
        ? matchday
        : store.championsLeague.currentMatchday;
      return {
        championsLeague: {
          ...store.championsLeague,
          leagueResults: newResults,
          currentMatchday: newMatchday,
        },
      };
    }),

  advanceToKnockout: (round, ties) =>
    set((store) => {
      if (!store.championsLeague) return {};
      const bracketKey = getBracketKey(round);
      const newBracket = { ...store.championsLeague.knockoutBracket };
      if (bracketKey === 'final') {
        newBracket.final = ties[0] ?? null;
      } else {
        newBracket[bracketKey] = ties;
      }
      return {
        championsLeague: {
          ...store.championsLeague,
          phase: 'knockout',
          knockoutRound: round,
          knockoutBracket: newBracket,
        },
      };
    }),

  updateKnockoutResult: (round, tieIndex, result) =>
    set((store) => {
      if (!store.championsLeague) return {};
      const bracketKey = getBracketKey(round);
      const newBracket = { ...store.championsLeague.knockoutBracket };

      if (bracketKey === 'final') {
        if (newBracket.final) {
          newBracket.final = { ...newBracket.final, winner: result.winnerId };
        }
      } else {
        const ties = [...newBracket[bracketKey]];
        if (ties[tieIndex]) {
          ties[tieIndex] = { ...ties[tieIndex], winner: result.winnerId };
        }
        newBracket[bracketKey] = ties;
      }

      return {
        championsLeague: {
          ...store.championsLeague,
          knockoutBracket: newBracket,
        },
      };
    }),

  setCLEliminated: () =>
    set((store) => {
      if (!store.championsLeague) return {};
      return {
        championsLeague: { ...store.championsLeague, playerEliminated: true },
      };
    }),

  resetChampionsLeague: () => set({ championsLeague: null }),
});

/** Maps a KnockoutRound to the corresponding key in knockoutBracket */
function getBracketKey(round: KnockoutRound): 'roundOf16' | 'quarterFinals' | 'semiFinals' | 'final' {
  switch (round) {
    case 'round-of-16': return 'roundOf16';
    case 'quarter-final': return 'quarterFinals';
    case 'semi-final': return 'semiFinals';
    case 'final': return 'final';
  }
}
