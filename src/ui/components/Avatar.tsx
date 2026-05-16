/**
 * Avatar - Composant de rendu visuel de l'avatar du joueur.
 * Affiche une représentation simple basée sur la configuration d'apparence.
 */

import type { PlayerAppearance } from '../../core/types';

export interface AvatarProps {
  appearance: PlayerAppearance;
  size?: 'sm' | 'md' | 'lg';
}

/** Palette de couleurs de peau disponibles */
export const SKIN_TONES = [
  '#FFDBB4', // 0 - clair
  '#EDB98A', // 1 - moyen clair
  '#C68642', // 2 - moyen
  '#8D5524', // 3 - moyen foncé
  '#5C3317', // 4 - foncé
  '#3B1F0B', // 5 - très foncé
] as const;

/** Palette de couleurs de cheveux disponibles */
export const HAIR_COLORS = [
  '#1C1C1C', // 0 - noir
  '#4A2C17', // 1 - brun foncé
  '#8B4513', // 2 - brun
  '#D4A76A', // 3 - blond foncé
  '#F5DEB3', // 4 - blond
  '#B22222', // 5 - roux
] as const;

/** Descriptions des coiffures disponibles */
export const HAIRSTYLES = [
  'Rasé',       // 0
  'Court',      // 1
  'Classique',  // 2
  'Dégradé',    // 3
  'Afro',       // 4
  'Long',       // 5
] as const;

const SIZE_MAP = {
  sm: { container: 'w-16 h-20', head: 'w-12 h-12', body: 'w-14 h-6' },
  md: { container: 'w-24 h-32', head: 'w-18 h-18', body: 'w-20 h-10' },
  lg: { container: 'w-32 h-44', head: 'w-24 h-24', body: 'w-28 h-14' },
} as const;

const HEIGHT_SCALE = {
  short: 'scale-90',
  medium: 'scale-100',
  tall: 'scale-110',
} as const;

/**
 * Rendu SVG simplifié d'un avatar de joueur de football.
 */
export function Avatar({ appearance, size = 'md' }: AvatarProps) {
  const skinColor = SKIN_TONES[appearance.skinTone] ?? SKIN_TONES[0];
  const hairColor = HAIR_COLORS[appearance.hairColor] ?? HAIR_COLORS[0];
  const heightClass = HEIGHT_SCALE[appearance.height] ?? HEIGHT_SCALE['medium'];
  const sizeConfig = SIZE_MAP[size];

  return (
    <div
      className={`${sizeConfig.container} flex flex-col items-center justify-end ${heightClass}`}
      role="img"
      aria-label="Avatar du joueur"
    >
      <svg
        viewBox="0 0 100 140"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hair (behind head for some styles) */}
        {renderHairBack(appearance.hairStyle, hairColor)}

        {/* Head */}
        <ellipse cx="50" cy="50" rx="28" ry="30" fill={skinColor} />

        {/* Hair (front) */}
        {renderHairFront(appearance.hairStyle, hairColor)}

        {/* Eyes */}
        <circle cx="40" cy="48" r="3" fill="#1C1C1C" />
        <circle cx="60" cy="48" r="3" fill="#1C1C1C" />

        {/* Mouth */}
        <path d="M 42 62 Q 50 67 58 62" stroke="#1C1C1C" strokeWidth="2" fill="none" />

        {/* Body (jersey) */}
        <rect x="30" y="85" width="40" height="45" rx="8" fill="#1e40af" />

        {/* Jersey number */}
        <text x="50" y="115" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
          10
        </text>

        {/* Neck */}
        <rect x="44" y="76" width="12" height="12" fill={skinColor} />
      </svg>
    </div>
  );
}

function renderHairBack(hairStyle: number, color: string) {
  switch (hairStyle) {
    case 4: // Afro
      return <ellipse cx="50" cy="38" rx="34" ry="36" fill={color} />;
    case 5: // Long
      return <path d="M 22 45 Q 22 80 35 85 L 50 50 L 65 85 Q 78 80 78 45" fill={color} />;
    default:
      return null;
  }
}

function renderHairFront(hairStyle: number, color: string) {
  switch (hairStyle) {
    case 0: // Rasé
      return null;
    case 1: // Court
      return <path d="M 25 42 Q 30 22 50 20 Q 70 22 75 42" fill={color} />;
    case 2: // Classique
      return (
        <path d="M 22 45 Q 25 20 50 18 Q 75 20 78 45 L 75 40 Q 70 25 50 23 Q 30 25 25 40 Z" fill={color} />
      );
    case 3: // Dégradé
      return (
        <>
          <path d="M 28 48 Q 30 25 50 22 Q 70 25 72 48" fill={color} />
          <path d="M 28 48 Q 28 52 30 55" fill={color} opacity="0.5" />
          <path d="M 72 48 Q 72 52 70 55" fill={color} opacity="0.5" />
        </>
      );
    case 4: // Afro (front part)
      return <path d="M 20 50 Q 20 15 50 12 Q 80 15 80 50" fill={color} />;
    case 5: // Long
      return <path d="M 22 45 Q 25 20 50 18 Q 75 20 78 45" fill={color} />;
    default:
      return <path d="M 25 42 Q 30 22 50 20 Q 70 22 75 42" fill={color} />;
  }
}
