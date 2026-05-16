import { useGameStore } from '../../store/gameStore';
import type { NavTab } from '../../store/slices/uiSlice';

export interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

interface TabConfig {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
}

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={active ? 0 : 2}
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
    />
  </svg>
);

const ClubIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={active ? 0 : 2}
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
    />
  </svg>
);

const PersonIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={active ? 0 : 2}
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
);

const TrophyIcon = ({ active }: { active: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={active ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={active ? 0 : 2}
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.996.178-1.768.563-2.15 1.106a2.244 2.244 0 00-.346 1.775c.178.996.776 1.783 1.604 2.227M18.75 4.236c.996.178 1.768.563 2.15 1.106.37.527.413 1.148.346 1.775-.178.996-.776 1.783-1.604 2.227M12 2.25c2.485 0 4.5.497 4.5 3.75 0 3.907-2.015 7.125-4.5 7.125S7.5 9.907 7.5 6c0-3.253 2.015-3.75 4.5-3.75z"
    />
  </svg>
);

const tabs: TabConfig[] = [
  { id: 'home', label: 'Accueil', icon: <HomeIcon active={false} /> },
  { id: 'club', label: 'Club', icon: <ClubIcon active={false} /> },
  { id: 'person', label: 'Joueur', icon: <PersonIcon active={false} /> },
  { id: 'trophy', label: 'Vie', icon: <TrophyIcon active={false} /> },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-gray-900 border-t border-gray-700 px-2 py-2 safe-bottom"
      role="tablist"
      aria-label="Navigation principale"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
              isActive
                ? 'text-emerald-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.id === 'home' && <HomeIcon active={isActive} />}
            {tab.id === 'club' && <ClubIcon active={isActive} />}
            {tab.id === 'person' && <PersonIcon active={isActive} />}
            {tab.id === 'trophy' && <TrophyIcon active={isActive} />}
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/**
 * Connected version that reads/writes directly from the Zustand store.
 * Use this when you don't need to control the component externally.
 */
export function ConnectedBottomNav() {
  const activeTab = useGameStore((s) => s.ui.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    // Navigate to the default screen for the selected tab
    switch (tab) {
      case 'home':
        setCurrentScreen('main');
        break;
      case 'club':
        setCurrentScreen('standings');
        break;
      case 'person':
        setCurrentScreen('transfers');
        break;
      case 'trophy':
        setCurrentScreen('trophies');
        break;
    }
  };

  return <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />;
}
