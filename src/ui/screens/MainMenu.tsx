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
      useGameStore.setState({ gameState, player: gameState.player });
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
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-primary/10 p-6">
      {/* Logo area */}
      <div className="text-center mb-16">
        <div className="text-7xl mb-4">⚽</div>
        <h1 className="text-4xl font-black text-text tracking-tight">
          Football <span className="text-primary-light">Career</span>
        </h1>
        <p className="text-text-muted text-sm mt-2 tracking-wide uppercase">Vis ta vie de footballeur</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={() => goToScreen('character-creation')}
          className="w-full py-4 px-6 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-2xl
                     active:scale-95 transition-all duration-200
                     text-lg shadow-lg shadow-primary/30"
          aria-label="Nouvelle partie"
        >
          Nouvelle Partie
        </button>

        <button
          onClick={() => setShowSaves(true)}
          className="w-full py-4 px-6 bg-surface text-text font-semibold rounded-2xl
                     active:scale-95 transition-all duration-200
                     text-lg border border-surface-light"
          aria-label="Charger une partie"
        >
          Charger Partie
          {saves.length > 0 && (
            <span className="ml-2 text-sm text-primary-light">({saves.length})</span>
          )}
        </button>

        <button
          className="w-full py-4 px-6 bg-surface/50 text-text-muted font-medium rounded-2xl
                     active:scale-95 transition-all duration-200
                     text-base border border-surface-light/50"
          aria-label="Options"
        >
          Options
        </button>
      </div>

      <p className="mt-16 text-text-muted/50 text-xs tracking-wider">v0.2.0 — by bastos</p>
    </div>
  );
}
