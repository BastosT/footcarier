import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type { GameDate } from '../../core/types';

export interface WeeklyTrainingState {
  trainedThisWeek: boolean;
  lastTrainingDate: GameDate | null;
}

export interface TrainingSlice {
  training: WeeklyTrainingState;
  markTrainingDone: (date: GameDate) => void;
  resetWeeklyTraining: () => void;
}

const initialTrainingState: WeeklyTrainingState = {
  trainedThisWeek: false,
  lastTrainingDate: null,
};

export const createTrainingSlice: StateCreator<GameStore, [], [], TrainingSlice> = (set) => ({
  training: initialTrainingState,

  markTrainingDone: (date) =>
    set((state) => ({
      training: { ...state.training, trainedThisWeek: true, lastTrainingDate: date },
    })),

  resetWeeklyTraining: () =>
    set((state) => ({
      training: { ...state.training, trainedThisWeek: false },
    })),
});
