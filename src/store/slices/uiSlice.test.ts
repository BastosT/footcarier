import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';

describe('UISlice', () => {
  beforeEach(() => {
    useGameStore.setState({
      ui: { activeTab: 'home', currentScreen: 'main', pendingMatchConfig: null },
    });
  });

  it('should have correct initial state', () => {
    const { ui } = useGameStore.getState();
    expect(ui.activeTab).toBe('home');
    expect(ui.currentScreen).toBe('main');
  });

  it('should set active tab', () => {
    useGameStore.getState().setActiveTab('club');
    expect(useGameStore.getState().ui.activeTab).toBe('club');

    useGameStore.getState().setActiveTab('person');
    expect(useGameStore.getState().ui.activeTab).toBe('person');

    useGameStore.getState().setActiveTab('trophy');
    expect(useGameStore.getState().ui.activeTab).toBe('trophy');
  });

  it('should set current screen', () => {
    useGameStore.getState().setCurrentScreen('standings');
    expect(useGameStore.getState().ui.currentScreen).toBe('standings');

    useGameStore.getState().setCurrentScreen('locker');
    expect(useGameStore.getState().ui.currentScreen).toBe('locker');

    useGameStore.getState().setCurrentScreen('match-play');
    expect(useGameStore.getState().ui.currentScreen).toBe('match-play');
  });

  it('should not affect other state when changing tab', () => {
    useGameStore.getState().setCurrentScreen('standings');
    useGameStore.getState().setActiveTab('club');

    const { ui } = useGameStore.getState();
    expect(ui.activeTab).toBe('club');
    expect(ui.currentScreen).toBe('standings');
  });

  it('should not affect other state when changing screen', () => {
    useGameStore.getState().setActiveTab('trophy');
    useGameStore.getState().setCurrentScreen('finance');

    const { ui } = useGameStore.getState();
    expect(ui.activeTab).toBe('trophy');
    expect(ui.currentScreen).toBe('finance');
  });
});
