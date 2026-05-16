/**
 * App — Root component with screen routing and bottom navigation.
 *
 * Uses the uiSlice's currentScreen to determine which screen to render.
 * Shows ConnectedBottomNav on all screens EXCEPT: main-menu, character-creation, match-play.
 *
 * Validates: Requirements 13.5, 12.1, 11.4
 */

import { useNavigation } from './ui/hooks/useNavigation';
import { ConnectedBottomNav } from './ui/components/BottomNav';
import type { ScreenType } from './store/slices/uiSlice';

// Screens
import { MainMenu } from './ui/screens/MainMenu';
import { CharacterCreation } from './ui/screens/CharacterCreation';
import { ClubSelection } from './ui/screens/ClubSelection';
import { MainScreenConnected } from './ui/screens/MainScreen';
import { MatchChoice } from './ui/screens/MatchChoice';
import { PreMatch } from './ui/screens/PreMatch';
import { MatchPlay } from './ui/screens/MatchPlay';
import { PostMatch } from './ui/screens/PostMatch';
import { ClubHub } from './ui/screens/ClubHub';
import { PlayerHub } from './ui/screens/PlayerHub';
import { Training } from './ui/screens/Training';
import { LifeHub } from './ui/screens/LifeHub';
import { SeasonEnd } from './ui/screens/SeasonEnd';
import { Phone } from './ui/screens/Phone';

/** Screens where the bottom navigation bar should NOT be displayed */
const SCREENS_WITHOUT_NAV: ScreenType[] = ['main-menu', 'character-creation', 'club-selection', 'match-play', 'season-end'];

function App() {
  const { currentScreen } = useNavigation();

  const showBottomNav = !SCREENS_WITHOUT_NAV.includes(currentScreen);

  return (
    <div className="transition-opacity duration-300">
      {renderScreen(currentScreen)}
      {showBottomNav && <ConnectedBottomNav />}
    </div>
  );
}

function renderScreen(screen: ScreenType): React.ReactNode {
  switch (screen) {
    case 'main-menu':
      return <MainMenu />;
    case 'character-creation':
      return <CharacterCreation />;
    case 'club-selection':
      return <ClubSelection />;
    case 'main':
      return <MainScreenConnected />;
    case 'match-choice':
      return <MatchChoice />;
    case 'pre-match':
      return <PreMatch />;
    case 'match-play':
      return <MatchPlay />;
    case 'post-match':
      return <PostMatch />;
    case 'season-end':
      return <SeasonEnd />;
    case 'phone':
      return <Phone />;
    case 'standings':
      return <ClubHub />;
    case 'locker':
      return <ClubHub />;
    case 'training':
      return <Training />;
    case 'transfers':
      return <PlayerHub />;
    case 'social':
      return <PlayerHub />;
    case 'finance':
      return <LifeHub />;
    case 'trophies':
      return <LifeHub />;
    default:
      return <MainMenu />;
  }
}

export default App;
