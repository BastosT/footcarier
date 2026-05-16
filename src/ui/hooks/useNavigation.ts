/**
 * useNavigation — React hook for managing navigation state and transitions.
 *
 * Reads/writes activeTab and currentScreen from the uiSlice in the main Zustand store.
 * Provides navigation helpers (goToScreen, goToTab) with screen-tab mapping.
 *
 * Requirements: 13.5
 */

import { useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { NavTab, ScreenType } from '../../store/slices/uiSlice';

export interface UseNavigationReturn {
  /** Currently active bottom navigation tab */
  activeTab: NavTab;
  /** Currently displayed screen */
  currentScreen: ScreenType;
  /** Navigate to a specific screen (also updates the active tab accordingly) */
  goToScreen: (screen: ScreenType) => void;
  /** Switch to a specific bottom navigation tab (navigates to its default screen) */
  goToTab: (tab: NavTab) => void;
  /** Go back to the main screen (home tab) */
  goHome: () => void;
}

/**
 * Maps a screen to its corresponding bottom navigation tab.
 */
function getTabForScreen(screen: ScreenType): NavTab {
  switch (screen) {
    case 'main':
    case 'main-menu':
    case 'character-creation':
    case 'club-selection':
    case 'match-choice':
    case 'pre-match':
    case 'match-play':
    case 'post-match':
    case 'training':
      return 'home';
    case 'standings':
    case 'locker':
      return 'club';
    case 'transfers':
    case 'social':
      return 'person';
    case 'finance':
    case 'trophies':
      return 'trophy';
    default:
      return 'home';
  }
}

/**
 * Maps a tab to its default screen.
 */
function getDefaultScreenForTab(tab: NavTab): ScreenType {
  switch (tab) {
    case 'home':
      return 'main';
    case 'club':
      return 'standings';
    case 'person':
      return 'transfers';
    case 'trophy':
      return 'trophies';
    default:
      return 'main';
  }
}

export function useNavigation(): UseNavigationReturn {
  const activeTab = useGameStore((s) => s.ui.activeTab);
  const currentScreen = useGameStore((s) => s.ui.currentScreen);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);

  const goToScreen = useCallback(
    (screen: ScreenType) => {
      setCurrentScreen(screen);
      setActiveTab(getTabForScreen(screen));
    },
    [setCurrentScreen, setActiveTab]
  );

  const goToTab = useCallback(
    (tab: NavTab) => {
      setActiveTab(tab);
      setCurrentScreen(getDefaultScreenForTab(tab));
    },
    [setActiveTab, setCurrentScreen]
  );

  const goHome = useCallback(() => {
    setActiveTab('home');
    setCurrentScreen('main');
  }, [setActiveTab, setCurrentScreen]);

  return {
    activeTab,
    currentScreen,
    goToScreen,
    goToTab,
    goHome,
  };
}
