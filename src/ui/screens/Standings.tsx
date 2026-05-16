/**
 * Standings — Écran de classement multi-championnats.
 *
 * Affiche les classements des 5 championnats (Ligue 1, Premier League, La Liga,
 * Serie A, Bundesliga) avec des onglets de navigation. Le championnat du joueur
 * est sélectionné par défaut et visuellement mis en surbrillance.
 * Inclut également le classement des meilleurs buteurs.
 */

import { useState } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';
import { StandingsTable } from '../components/StandingsTable';
import { TopScorersTable } from '../components/TopScorersTable';
import type { Country } from '../../core/types';


interface LeagueTab {
  country: Country;
  label: string;
}

const LEAGUE_TABS: LeagueTab[] = [
  { country: 'france', label: 'Ligue 1' },
  { country: 'england', label: 'Premier League' },
  { country: 'spain', label: 'La Liga' },
  { country: 'italy', label: 'Serie A' },
  { country: 'germany', label: 'Bundesliga' },
];

type ViewMode = 'standings' | 'scorers';

export function Standings() {
  const { goHome } = useNavigation();
  const gameState = useGameStore((s) => s.gameState);

  const playerCountry = gameState?.career.currentClub.country ?? 'france';
  const playerClubId = gameState?.career.currentClub.id;

  const [selectedCountry, setSelectedCountry] = useState<Country>(playerCountry);
  const [viewMode, setViewMode] = useState<ViewMode>('standings');

  if (!gameState) return null;

  const selectedLeague = gameState.leagues.find(
    (league) => league.division.country === selectedCountry && league.division.level === 1
  );

  const standings = selectedLeague?.standings ?? [];
  const topScorers = selectedLeague?.topScorers ?? [];

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 pb-2">
        <h1 className="text-xl font-bold text-text">📋 Classements</h1>
        <button
          onClick={() => goHome()}
          className="text-primary-light text-sm"
        >
          ← Retour
        </button>
      </header>

      {/* League tabs */}
      <nav className="px-4 pb-2" aria-label="Sélection du championnat">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {LEAGUE_TABS.map((tab) => {
            const isSelected = tab.country === selectedCountry;
            const isPlayerLeague = tab.country === playerCountry;

            return (
              <button
                key={tab.country}
                onClick={() => setSelectedCountry(tab.country)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-primary text-white'
                    : isPlayerLeague
                      ? 'bg-primary/20 text-primary-light border border-primary/40'
                      : 'bg-surface text-text-muted hover:bg-surface-light'
                }`}
                aria-selected={isSelected}
                aria-label={`${tab.label}${isPlayerLeague ? ' (votre championnat)' : ''}`}
              >
                {tab.label}
                {isPlayerLeague && !isSelected && (
                  <span className="ml-1 text-[10px]">⭐</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* View mode toggle (Standings / Top Scorers) */}
      <div className="px-4 pb-3">
        <div className="flex bg-surface rounded-lg p-1">
          <button
            onClick={() => setViewMode('standings')}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'standings'
                ? 'bg-surface-light text-text'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Classement
          </button>
          <button
            onClick={() => setViewMode('scorers')}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'scorers'
                ? 'bg-surface-light text-text'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Buteurs
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {viewMode === 'standings' ? (
          <StandingsTable standings={standings} playerClubId={playerClubId} />
        ) : (
          <TopScorersTable scorers={topScorers} playerClubId={playerClubId} />
        )}
      </div>
    </div>
  );
}
