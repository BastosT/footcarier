/**
 * MainMenu - Écran d'accueil avec nouvelle partie, charger partie, options.
 */

import { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';
import { saveManager } from '../../persistence/SaveManager';
import type { SaveSlot } from '../../persistence/types';

export function MainMenu() {
  const { goToScreen } = useNavigation();
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [showSaves, setShowSaves] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveManager.listSaves().then(setSaves).catch(() => {});
  }, []);

  const handleLoadGame = async (slot: number) => {
    setLoading(true);
    try {
      const gameState = await saveManager.loadGame(slot);

      // Migrate old saves: add missing fields with defaults
      const migrated = {
        ...gameState,
        lifestyle: {
          possessions: [],
          investments: [],
          instagram: { followers: 1000, posts: [], weeklyPostDone: false },
          youtube: { subscribers: 0, videos: [], weeklyUploadDone: false, monthlyRevenue: 0 },
          relationships: { current: null, history: [], children: [] },
          celebrities: { relations: [] },
          sponsorContracts: [],
          pets: [],
          casinoHistory: [],
          ...gameState.lifestyle,
          // Ensure nested objects have all fields
          instagram: { followers: 1000, posts: [], weeklyPostDone: false, ...(gameState.lifestyle?.instagram ?? {}) },
          youtube: { subscribers: 0, videos: [], weeklyUploadDone: false, monthlyRevenue: 0, ...(gameState.lifestyle?.youtube ?? {}) },
          relationships: { current: null, history: [], children: [], ...(gameState.lifestyle?.relationships ?? {}) },
          celebrities: { relations: [], ...(gameState.lifestyle?.celebrities ?? {}) },
        },
        social: {
          popularity: 20, reputation: 20, coachRelation: 50, teamRelation: 50,
          teamMorale: 50, teamAmbiance: 50, controversyCount: 0, scandalActive: false,
          socialFeed: [], pendingInterviews: [],
          ...gameState.social,
        },
        career: {
          ...gameState.career,
          isCaptain: gameState.career?.isCaptain ?? false,
        },
        playerCareerStats: {
          season: { matchesPlayed: 0, goals: 0, assists: 0, shots: 0, dribbles: 0, tackles: 0, avgRating: 0, totalRating: 0, cleanSheets: 0 },
          allTime: { matchesPlayed: 0, goals: 0, assists: 0, shots: 0, dribbles: 0, tackles: 0, avgRating: 0, totalRating: 0, cleanSheets: 0 },
          clGoals: 0,
          seasonHistory: [],
          ...gameState.playerCareerStats,
        },
        agent: gameState.agent ?? {
          currentAgent: { id: 'agent-family', name: 'Papa (agent familial)', tier: 'family', emoji: '👨‍👦', commission: 0, offerBonus: 1.0, networkLevel: 1, description: 'Pas de commission mais réseau limité.' },
          interestedClubs: [],
        },
      };

      useGameStore.setState({ gameState: migrated as any, player: migrated.player });
      goToScreen('main');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  if (showSaves) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
        <h2 className="text-2xl font-bold text-text mb-6">Charger une partie</h2>

        {saves.length === 0 ? (
          <p className="text-text-muted mb-6">Aucune sauvegarde trouvée.</p>
        ) : (
          <div className="flex flex-col gap-3 w-full max-w-sm mb-6">
            {saves.map((save) => (
              <button
                key={save.slot}
                onClick={() => handleLoadGame(save.slot)}
                disabled={loading}
                className="w-full p-4 bg-surface rounded-xl text-left border border-surface-light
                           hover:bg-surface-light active:scale-95 transition-all"
              >
                <p className="font-semibold text-text">{save.playerName}</p>
                <p className="text-sm text-text-muted">
                  {save.clubName} • Saison {save.season}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Sauvegardé le {new Date(save.lastSaved).toLocaleDateString('fr-FR')}
                </p>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowSaves(false)}
          className="text-primary-light"
        >
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
      {/* Logo area */}
      <div className="text-center mb-16">
        <div className="text-6xl mb-3">⚽</div>
        <h1 className="text-3xl font-black text-text tracking-tight">
          Foot<span className="text-primary-light">Carier</span>
        </h1>
        <p className="text-text-muted text-xs mt-2 tracking-widest uppercase">Vis ta carrière de footballeur</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => goToScreen('character-creation')}
          className="w-full py-4 px-6 bg-primary text-white font-bold rounded-xl
                     active:scale-[0.97] transition-all text-base"
          aria-label="Nouvelle partie"
        >
          Nouvelle Partie
        </button>

        <button
          onClick={() => setShowSaves(true)}
          className="w-full py-4 px-6 bg-surface text-text font-semibold rounded-xl
                     active:scale-[0.97] transition-all text-base border border-surface-light/50"
          aria-label="Charger une partie"
        >
          Charger Partie
          {saves.length > 0 && (
            <span className="ml-2 text-sm text-primary-light">({saves.length})</span>
          )}
        </button>
      </div>

      <p className="mt-16 text-text-muted/40 text-[10px] tracking-widest uppercase">v0.3.0</p>
    </div>
  );
}
