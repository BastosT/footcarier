/**
 * ClubSelection — 4 offres de petits clubs (1 par pays au hasard).
 * Le joueur débute en bas et doit gravir les échelons.
 */

import { useState, useMemo } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';
import { clubsByCountry } from '../../data/clubs/index';
import type { Club, Country } from '../../core/types';

const COUNTRY_INFO: Record<Country, { label: string; flag: string; league: string }> = {
  france: { label: 'France', flag: '🇫🇷', league: 'Ligue 1' },
  spain: { label: 'Espagne', flag: '🇪🇸', league: 'La Liga' },
  england: { label: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', league: 'Premier League' },
  italy: { label: 'Italie', flag: '🇮🇹', league: 'Serie A' },
  germany: { label: 'Allemagne', flag: '🇩🇪', league: 'Bundesliga' },
};

export function ClubSelection() {
  const { goToScreen } = useNavigation();
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  // Generate 4 random small/medium club offers (1 per country, pick 4 countries)
  const offers = useMemo(() => {
    const countries: Country[] = ['france', 'spain', 'england', 'italy', 'germany'];
    // Shuffle and pick 4
    const shuffled = [...countries].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);

    return selected.map((country) => {
      const clubs = clubsByCountry[country];
      // Pick only small clubs (last ones in the list, lower tier)
      const smallClubs = clubs.filter((c) => c.tier === 'small');
      const mediumClubs = clubs.filter((c) => c.tier === 'medium');
      // Prefer small, fallback to medium
      const pool = smallClubs.length > 0 ? smallClubs : mediumClubs;
      const club = pool[Math.floor(Math.random() * pool.length)];
      return { country, club };
    });
  }, []);

  const handleConfirm = () => {
    if (!selectedClub) return;
    useGameStore.getState().selectClub(selectedClub);
    goToScreen('main');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text">📋 Offres de clubs</h1>
        <p className="text-text-muted text-sm mt-1">
          En tant que jeune joueur, voici les clubs qui te proposent un contrat
        </p>
      </header>

      {/* Offers */}
      <div className="flex-1 space-y-3 mb-6">
        {offers.map(({ country, club }) => {
          if (!club) return null;
          const info = COUNTRY_INFO[country];
          const isSelected = selectedClub?.id === club.id;

          return (
            <button
              key={club.id}
              onClick={() => setSelectedClub(club)}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                isSelected
                  ? 'bg-primary/20 border-2 border-primary-light'
                  : 'bg-surface border border-surface-light/50 active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-light rounded-lg flex items-center justify-center">
                  <span className="text-xl">{info.flag}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text">{club.name}</h3>
                  <p className="text-xs text-text-muted">{info.league} • {club.stadium}</p>
                </div>
                <div className="text-right">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: club.colors.primary }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: club.colors.secondary }} />
                  </div>
                  <p className="text-[10px] text-text-muted mt-1">{club.squad.length} joueurs</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!selectedClub}
        className={`w-full py-4 px-6 font-bold rounded-xl active:scale-95 transition-all text-lg ${
          selectedClub
            ? 'bg-primary text-white'
            : 'bg-surface-light text-text-muted'
        }`}
      >
        {selectedClub ? `Signer à ${selectedClub.name}` : 'Choisis un club'}
      </button>
    </div>
  );
}
