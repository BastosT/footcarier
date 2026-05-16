/**
 * AvatarCreation - Écran de personnalisation visuelle de l'avatar.
 * Propose des options de couleur de peau, coiffure, couleur de cheveux et taille.
 * Affiche un aperçu en temps réel pendant la personnalisation.
 */

import { useState } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';
import { Avatar, SKIN_TONES, HAIR_COLORS, HAIRSTYLES } from '../components/Avatar';
import type { PlayerAppearance } from '../../core/types';

const HEIGHT_OPTIONS: { value: PlayerAppearance['height']; label: string }[] = [
  { value: 'short', label: 'Petit' },
  { value: 'medium', label: 'Moyen' },
  { value: 'tall', label: 'Grand' },
];

export function AvatarCreation() {
  const { goToScreen } = useNavigation();
  const setPlayer = useGameStore((s) => s.setPlayer);
  const player = useGameStore((s) => s.player);
  const gameState = useGameStore((s) => s.gameState);

  const [appearance, setAppearance] = useState<PlayerAppearance>({
    skinTone: player?.appearance.skinTone ?? 1,
    hairStyle: player?.appearance.hairStyle ?? 2,
    hairColor: player?.appearance.hairColor ?? 0,
    height: player?.appearance.height ?? 'medium',
  });

  const updateAppearance = (patch: Partial<PlayerAppearance>) => {
    setAppearance((prev) => ({ ...prev, ...patch }));
  };

  const handleValidate = () => {
    // Save appearance to player character data
    if (player) {
      setPlayer({ ...player, appearance });
    }
    // Also update gameState if it exists
    if (gameState && gameState.player) {
      useGameStore.setState({
        gameState: {
          ...gameState,
          player: { ...gameState.player, appearance },
        },
      });
    }
    // Navigate to club selection (gameState is created there)
    goToScreen('club-selection');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-text">Créer ton avatar</h1>
        <p className="text-text-muted mt-1">Personnalise ton apparence</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Preview */}
        <div className="flex flex-col items-center justify-center lg:flex-1">
          <div className="bg-surface rounded-2xl p-8 flex items-center justify-center">
            <Avatar appearance={appearance} size="lg" />
          </div>
          <p className="text-text-muted text-sm mt-3">Aperçu en temps réel</p>
        </div>

        {/* Customization options */}
        <div className="flex flex-col gap-6 lg:flex-1 max-w-lg">
          {/* Skin tone */}
          <section>
            <label className="block text-sm text-text-muted mb-2">Couleur de peau</label>
            <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Couleur de peau">
              {SKIN_TONES.map((color, index) => (
                <button
                  key={index}
                  onClick={() => updateAppearance({ skinTone: index })}
                  className={`w-10 h-10 rounded-full border-2 transition-all
                    ${appearance.skinTone === index
                      ? 'border-primary-light scale-110 ring-2 ring-primary-light/50'
                      : 'border-surface-light hover:border-text-muted'
                    }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Couleur de peau ${index + 1}`}
                  aria-pressed={appearance.skinTone === index}
                  role="radio"
                  aria-checked={appearance.skinTone === index}
                />
              ))}
            </div>
          </section>

          {/* Hairstyle */}
          <section>
            <label className="block text-sm text-text-muted mb-2">Coiffure</label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Coiffure">
              {HAIRSTYLES.map((name, index) => (
                <button
                  key={index}
                  onClick={() => updateAppearance({ hairStyle: index })}
                  className={`py-3 px-4 rounded-lg text-center text-sm transition-all
                    ${appearance.hairStyle === index
                      ? 'bg-primary text-white border-2 border-primary-light'
                      : 'bg-surface border border-surface-light text-text-muted hover:bg-surface-light'
                    }`}
                  aria-pressed={appearance.hairStyle === index}
                  role="radio"
                  aria-checked={appearance.hairStyle === index}
                >
                  {name}
                </button>
              ))}
            </div>
          </section>

          {/* Hair color */}
          <section>
            <label className="block text-sm text-text-muted mb-2">Couleur de cheveux</label>
            <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Couleur de cheveux">
              {HAIR_COLORS.map((color, index) => (
                <button
                  key={index}
                  onClick={() => updateAppearance({ hairColor: index })}
                  className={`w-10 h-10 rounded-full border-2 transition-all
                    ${appearance.hairColor === index
                      ? 'border-primary-light scale-110 ring-2 ring-primary-light/50'
                      : 'border-surface-light hover:border-text-muted'
                    }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Couleur de cheveux ${index + 1}`}
                  aria-pressed={appearance.hairColor === index}
                  role="radio"
                  aria-checked={appearance.hairColor === index}
                />
              ))}
            </div>
          </section>

          {/* Height */}
          <section>
            <label className="block text-sm text-text-muted mb-2">Taille</label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Taille">
              {HEIGHT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateAppearance({ height: option.value })}
                  className={`py-3 px-4 rounded-lg text-center text-sm transition-all
                    ${appearance.height === option.value
                      ? 'bg-primary text-white border-2 border-primary-light'
                      : 'bg-surface border border-surface-light text-text-muted hover:bg-surface-light'
                    }`}
                  aria-pressed={appearance.height === option.value}
                  role="radio"
                  aria-checked={appearance.height === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Validate button */}
      <div className="mt-8">
        <button
          onClick={handleValidate}
          className="w-full py-4 px-6 bg-secondary text-white font-semibold rounded-xl
                     hover:bg-secondary-light active:scale-95 transition-all duration-200
                     text-lg"
        >
          Valider ✓
        </button>
      </div>
    </div>
  );
}
