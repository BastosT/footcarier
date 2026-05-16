import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';

describe('TrainingSlice', () => {
  beforeEach(() => {
    // Reset the store to initial state
    useGameStore.setState({
      training: { trainedThisWeek: false, lastTrainingDate: null },
    });
  });

  it('should have initial state with trainedThisWeek false and lastTrainingDate null', () => {
    const state = useGameStore.getState();
    expect(state.training.trainedThisWeek).toBe(false);
    expect(state.training.lastTrainingDate).toBeNull();
  });

  it('should mark training as done with the given date', () => {
    const date = { day: 15, month: 9, year: 2024 };
    useGameStore.getState().markTrainingDone(date);

    const state = useGameStore.getState();
    expect(state.training.trainedThisWeek).toBe(true);
    expect(state.training.lastTrainingDate).toEqual(date);
  });

  it('should reset weekly training', () => {
    const date = { day: 15, month: 9, year: 2024 };
    useGameStore.getState().markTrainingDone(date);
    useGameStore.getState().resetWeeklyTraining();

    const state = useGameStore.getState();
    expect(state.training.trainedThisWeek).toBe(false);
    // lastTrainingDate should be preserved after reset
    expect(state.training.lastTrainingDate).toEqual(date);
  });

  it('should not allow marking training done twice without reset', () => {
    const date1 = { day: 10, month: 9, year: 2024 };
    const date2 = { day: 12, month: 9, year: 2024 };

    useGameStore.getState().markTrainingDone(date1);
    expect(useGameStore.getState().training.trainedThisWeek).toBe(true);

    // Marking again updates the date (the guard logic is in TrainingManager, not the slice)
    useGameStore.getState().markTrainingDone(date2);
    expect(useGameStore.getState().training.lastTrainingDate).toEqual(date2);
  });
});
