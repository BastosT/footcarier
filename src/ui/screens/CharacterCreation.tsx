/**
 * CharacterCreation - Écran de création de personnage.
 */

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { AvatarCreation } from './AvatarCreation';
import type { Position, Country } from '../../core/types';

const POSITIONS: { value: Position; label: string }[] = [
  { value: 'GK', label: 'Gardien' },
  { value: 'CB', label: 'Défenseur Central' },
  { value: 'LB', label: 'Arrière Gauche' },
  { value: 'RB', label: 'Arrière Droit' },
  { value: 'CDM', label: 'Milieu Défensif' },
  { value: 'CM', label: 'Milieu Central' },
  { value: 'CAM', label: 'Milieu Offensif' },
  { value: 'LW', label: 'Ailier Gauche' },
  { value: 'RW', label: 'Ailier Droit' },
  { value: 'ST', label: 'Attaquant' },
];

const COUNTRIES: { value: Country; label: string; flag: string }[] = [
  { value: 'france', label: 'France', flag: '🇫🇷' },
  { value: 'spain', label: 'Espagne', flag: '🇪🇸' },
  { value: 'england', label: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { value: 'italy', label: 'Italie', flag: '🇮🇹' },
  { value: 'germany', label: 'Allemagne', flag: '🇩🇪' },
];

export function CharacterCreation() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationality, setNationality] = useState<Country>('france');
  const [position, setPosition] = useState<Position>('ST');
  const [age, setAge] = useState(17);
  const [jerseyNumber, setJerseyNumber] = useState(10);
  const [step, setStep] = useState<'info' | 'avatar'>('info');

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleSubmitInfo = () => {
    if (!isValid) return;
    // Store character data in game store for next step
    useGameStore.getState().setCharacterCreation({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nationality,
      position,
      age,
      jerseyNumber,
      appearance: { skinTone: 1, hairStyle: 1, hairColor: 1, height: 'medium' },
    });
    // Move to avatar creation step
    setStep('avatar');
  };

  if (step === 'avatar') {
    return <AvatarCreation />;
  }

  const handleSubmit = handleSubmitInfo;

  return (
    <div className="min-h-dvh flex flex-col bg-background p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text">Créer ton joueur</h1>
        <p className="text-text-muted mt-1">Personnalise ton personnage</p>
      </header>

      <div className="flex flex-col gap-6 flex-1 max-w-lg">
        {/* Nom */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="firstName" className="block text-sm text-text-muted mb-1">Prénom</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg
                         text-text focus:outline-none focus:border-primary-light"
              placeholder="Kylian"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="lastName" className="block text-sm text-text-muted mb-1">Nom</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg
                         text-text focus:outline-none focus:border-primary-light"
              placeholder="Dupont"
            />
          </div>
        </div>

        {/* Nationalité */}
        <div>
          <label className="block text-sm text-text-muted mb-2">Nationalité</label>
          <div className="grid grid-cols-5 gap-2">
            {COUNTRIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setNationality(c.value)}
                className={`py-3 px-2 rounded-lg text-center transition-all
                  ${nationality === c.value
                    ? 'bg-primary text-white border-2 border-primary-light'
                    : 'bg-surface border border-surface-light text-text-muted hover:bg-surface-light'
                  }`}
                aria-label={c.label}
                aria-pressed={nationality === c.value}
              >
                <span className="text-2xl">{c.flag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Poste */}
        <div>
          <label className="block text-sm text-text-muted mb-2">Poste</label>
          <div className="grid grid-cols-2 gap-2">
            {POSITIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPosition(p.value)}
                className={`py-3 px-4 rounded-lg text-left transition-all text-sm
                  ${position === p.value
                    ? 'bg-primary text-white border-2 border-primary-light'
                    : 'bg-surface border border-surface-light text-text-muted hover:bg-surface-light'
                  }`}
                aria-pressed={position === p.value}
              >
                <span className="font-bold">{p.value}</span>
                <span className="ml-2">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Âge et Numéro de maillot */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="age" className="block text-sm text-text-muted mb-1">Âge</label>
            <input
              id="age"
              type="number"
              min={16}
              max={21}
              value={age}
              onChange={(e) => setAge(Math.max(16, Math.min(21, Number(e.target.value))))}
              className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg
                         text-text focus:outline-none focus:border-primary-light text-center text-lg"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="jersey" className="block text-sm text-text-muted mb-1">N° Maillot</label>
            <input
              id="jersey"
              type="number"
              min={1}
              max={99}
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(Math.max(1, Math.min(99, Number(e.target.value))))}
              className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg
                         text-text focus:outline-none focus:border-primary-light text-center text-lg"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-8">
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full py-4 px-6 bg-secondary text-white font-semibold rounded-xl
                     hover:bg-secondary-light active:scale-95 transition-all duration-200
                     text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Personnaliser l'avatar →
        </button>
      </div>
    </div>
  );
}
