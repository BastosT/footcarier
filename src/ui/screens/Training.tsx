/**
 * Training - Écran d'entraînement hebdomadaire unique et significatif (V2).
 *
 * Affiche 6 cartes de compétences (vitesse, tir, passe, dribble, défense, physique)
 * avec la valeur actuelle de chaque stat. Indique clairement si l'entraînement
 * est disponible ou déjà utilisé cette semaine.
 *
 * Requirements: 5.1, 5.2, 5.4, 5.5
 */

import { useState } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameStore } from '../../store/gameStore';
import type { TrainingSkill, TrainingResult } from '../../core/types';

const SKILLS: { value: TrainingSkill; label: string; emoji: string }[] = [
  { value: 'pace', label: 'Vitesse', emoji: '⚡' },
  { value: 'shooting', label: 'Tir', emoji: '🎯' },
  { value: 'passing', label: 'Passe', emoji: '🎾' },
  { value: 'dribbling', label: 'Dribble', emoji: '🏃' },
  { value: 'defending', label: 'Défense', emoji: '🛡️' },
  { value: 'physical', label: 'Physique', emoji: '💪' },
];

export function Training() {
  const { goHome } = useNavigation();
  const { executeTraining, trainingAvailable } = useGameLoop();
  const gameState = useGameStore((s) => s.gameState);
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);

  if (!gameState) return null;

  const { player } = gameState;
  const isInjured = player.injury !== null;
  const isAvailable = trainingAvailable && !isInjured;

  const handleTrain = (skill: TrainingSkill) => {
    if (!isAvailable) return;

    const result = executeTraining(skill);
    if (result) {
      setTrainingResult(result);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background p-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">🏋️ Entraînement</h1>
        <button onClick={goHome} className="text-primary-light">
          ← Retour
        </button>
      </header>

      {/* Training availability status */}
      {!trainingAvailable && (
        <div className="bg-amber-500/20 border border-amber-500 rounded-xl p-4 mb-6">
          <p className="text-amber-400 font-semibold">
            ⏳ Entraînement déjà effectué cette semaine
          </p>
          <p className="text-text-muted text-sm mt-1">
            La prochaine session sera disponible lundi prochain.
          </p>
        </div>
      )}

      {isInjured && (
        <div className="bg-danger/20 border border-danger rounded-xl p-4 mb-6">
          <p className="text-danger font-semibold">⚠️ Joueur blessé</p>
          <p className="text-text-muted text-sm mt-1">
            {player.injury!.type} — {player.injury!.weeksRemaining} semaines restantes.
            L'entraînement est impossible pendant la blessure.
          </p>
        </div>
      )}

      {isAvailable && (
        <div className="bg-secondary/20 border border-secondary rounded-xl p-4 mb-6">
          <p className="text-secondary-light font-semibold">
            ✅ Session d'entraînement disponible
          </p>
          <p className="text-text-muted text-sm mt-1">
            Choisissez une compétence à entraîner. Gain significatif : +1 à +3 points.
          </p>
        </div>
      )}

      {/* Training result */}
      {trainingResult && trainingResult.gain > 0 && (
        <div className="bg-secondary/20 border border-secondary rounded-xl p-4 mb-6 animate-pulse">
          <p className="text-secondary-light font-semibold">
            🎉 Entraînement réussi !
          </p>
          <p className="text-text text-sm mt-1">
            {SKILLS.find((s) => s.value === trainingResult.skill)?.label} :{' '}
            {trainingResult.previousValue} → {trainingResult.newValue} (+{trainingResult.gain})
          </p>
        </div>
      )}

      {trainingResult && trainingResult.gain === 0 && (
        <div className="bg-surface border border-surface-light rounded-xl p-4 mb-6">
          <p className="text-text-muted font-semibold">
            Compétence au maximum du potentiel
          </p>
          <p className="text-text-muted text-sm mt-1">
            Aucun gain possible sur cette compétence.
          </p>
        </div>
      )}

      {/* Skill cards */}
      <div className="mb-6">
        <h2 className="text-sm text-text-muted mb-3">Choisissez une compétence</h2>
        <div className="grid grid-cols-2 gap-3">
          {SKILLS.map((skill) => (
            <button
              key={skill.value}
              onClick={() => handleTrain(skill.value)}
              disabled={!isAvailable}
              className={`flex flex-col items-center justify-center py-5 px-3 rounded-xl transition-all
                ${isAvailable
                  ? 'bg-surface border border-surface-light hover:border-primary hover:bg-primary/10 active:scale-95 cursor-pointer'
                  : 'bg-surface/50 border border-surface-light/50 opacity-50 cursor-not-allowed'
                }`}
            >
              <span className="text-2xl mb-2">{skill.emoji}</span>
              <p className="text-text font-medium">{skill.label}</p>
              <p className="text-primary-light text-lg font-bold mt-1">
                {player.stats[skill.value]}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
