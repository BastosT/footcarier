/**
 * ClubSelection - Écran de sélection de club avec filtrage par pays et tier.
 */

import { useState } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';
import { allClubs, clubsByCountry } from '../../data/clubs/index';
import type { Club, Country, ClubTier } from '../../core/types';

const COUNTRY_LABELS: Record<Country, { label: string; flag: string }> = {
  france: { label: 'France', flag: '🇫🇷' },
  spain: { label: 'Espagne', flag: '🇪🇸' },
  england: { label: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  italy: { label: 'Italie', flag: '🇮🇹' },
  germany: { label: 'Allemagne', flag: '🇩🇪' },
};

const TIER_LABELS: Record<ClubTier, { label: string; color: string }> = {
  big: { label: '⭐ Grand club', color: 'text-accent' },
  medium: { label: '🔵 Club moyen', color: 'text-primary-light' },
  small: { label: '🟢 Petit club', color: 'text-secondary-light' },
};

export function ClubSelection() {
  const { goToScreen } = useNavigation();
  const [selectedCountry, setSelectedCountry] = useState<Country>('france');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const clubs = clubsByCountry[selectedCountry];

  const handleConfirm = () => {
    if (!selectedClub) return;
    useGameStore.getState().selectClub(selectedClub);
    goToScreen('main');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-text">Choisis ton club</h1>
        <p className="text-text-muted mt-1">Sélectionne le club où tu débuteras ta carrière</p>
      </header>

      {/* Country filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(Object.keys(COUNTRY_LABELS) as Country[]).map((country) => (
          <button
            key={country}
            onClick={() => { setSelectedCountry(country); setSelectedClub(null); }}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all
              ${selectedCountry === country
                ? 'bg-primary text-white'
                : 'bg-surface text-text-muted hover:bg-surface-light'
              }`}
          >
            {COUNTRY_LABELS[country].flag} {COUNTRY_LABELS[country].label}
          </button>
        ))}
      </div>

      {/* Club list */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-6">
        {clubs.map((club) => (
          <button
            key={club.id}
            onClick={() => setSelectedClub(club)}
            className={`w-full p-4 rounded-xl text-left transition-all
              ${selectedClub?.id === club.id
                ? 'bg-primary/20 border-2 border-primary-light'
                : 'bg-surface border border-surface-light hover:bg-surface-light'
              }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-text">{club.name}</h3>
                <p className="text-sm text-text-muted">
                  {club.division.name} • {club.stadium}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${TIER_LABELS[club.tier].color}`}>
                  {TIER_LABELS[club.tier].label}
                </span>
                <p className="text-xs text-text-muted mt-1">
                  {club.squad.length} joueurs
                </p>
              </div>
            </div>
            {/* Club colors indicator */}
            <div className="flex gap-1 mt-2">
              <div
                className="w-4 h-4 rounded-full border border-white/20"
                style={{ backgroundColor: club.colors.primary }}
              />
              <div
                className="w-4 h-4 rounded-full border border-white/20"
                style={{ backgroundColor: club.colors.secondary }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!selectedClub}
        className="w-full py-4 px-6 bg-secondary text-white font-semibold rounded-xl
                   hover:bg-secondary-light active:scale-95 transition-all duration-200
                   text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedClub ? `Rejoindre ${selectedClub.name}` : 'Sélectionne un club'}
      </button>
    </div>
  );
}
