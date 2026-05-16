import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type { Country, Position } from './playerSlice';

export type ClubTier = 'small' | 'medium' | 'big';

export interface Division {
  country: Country;
  level: number;
  name: string;
}

export interface ClubFinances {
  budget: number;
  wageBill: number;
}

export interface SquadPlayer {
  id: string;
  name: string;
  position: Position;
  age: number;
  overallRating: number;
  potential: number;
  isPlayerCharacter: boolean;
}

export interface Club {
  id: string;
  name: string;
  country: Country;
  division: Division;
  tier: ClubTier;
  squad: SquadPlayer[];
  finances: ClubFinances;
  stadium: string;
  colors: { primary: string; secondary: string };
}

export interface Contract {
  clubId: string;
  weeklySalary: number;
  bonusPerGoal: number;
  bonusPerAssist: number;
  duration: number;
  seasonsRemaining: number;
  signingBonus: number;
}

export interface Trophy {
  id: string;
  type: 'league' | 'cup' | 'champions_league' | 'top_scorer' | 'best_player' | 'golden_boot';
  season: number;
  competition: string;
}

export interface TransferRecord {
  fromClubId: string;
  toClubId: string;
  season: number;
  salary: number;
}

export interface CareerState {
  currentClub: Club | null;
  contract: Contract | null;
  season: number;
  matchday: number;
  trophies: Trophy[];
  transferHistory: TransferRecord[];
}

export interface CareerSlice {
  career: CareerState;
  setCurrentClub: (club: Club) => void;
  setContract: (contract: Contract) => void;
  advanceMatchday: () => void;
  advanceSeason: () => void;
  addTrophy: (trophy: Trophy) => void;
  addTransferRecord: (record: TransferRecord) => void;
  resetCareer: () => void;
}

const initialCareerState: CareerState = {
  currentClub: null,
  contract: null,
  season: 1,
  matchday: 1,
  trophies: [],
  transferHistory: [],
};

export const createCareerSlice: StateCreator<GameStore, [], [], CareerSlice> = (set) => ({
  career: initialCareerState,

  setCurrentClub: (club) =>
    set((state) => ({
      career: { ...state.career, currentClub: club },
    })),

  setContract: (contract) =>
    set((state) => ({
      career: { ...state.career, contract },
    })),

  advanceMatchday: () =>
    set((state) => ({
      career: { ...state.career, matchday: state.career.matchday + 1 },
    })),

  advanceSeason: () =>
    set((state) => ({
      career: {
        ...state.career,
        season: state.career.season + 1,
        matchday: 1,
      },
    })),

  addTrophy: (trophy) =>
    set((state) => ({
      career: {
        ...state.career,
        trophies: [...state.career.trophies, trophy],
      },
    })),

  addTransferRecord: (record) =>
    set((state) => ({
      career: {
        ...state.career,
        transferHistory: [...state.career.transferHistory, record],
      },
    })),

  resetCareer: () => set({ career: initialCareerState }),
});
