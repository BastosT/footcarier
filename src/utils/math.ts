/**
 * Fonctions mathématiques utilitaires pour le jeu.
 * Inclut clamp, distribution de Poisson, calculs statistiques et interpolation.
 */

import { type RNG, defaultRNG } from './random';

/**
 * Borne une valeur entre min et max (inclus).
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new Error('min must be <= max');
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Génère un nombre aléatoire suivant une distribution de Poisson.
 * Utilisé pour la simulation de buts dans les matchs.
 * @param lambda - Paramètre lambda (moyenne attendue)
 * @param rng - Générateur aléatoire (optionnel, utilise defaultRNG par défaut)
 */
export function poissonRandom(lambda: number, rng: RNG = defaultRNG): number {
  if (lambda < 0) {
    throw new Error('Lambda must be non-negative');
  }
  if (lambda === 0) {
    return 0;
  }

  // Algorithme de Knuth pour les petites valeurs de lambda
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= rng.random();
  } while (p > L);

  return k - 1;
}

/**
 * Sélectionne un index basé sur des poids.
 * @param weights - Tableau de poids (positifs)
 * @param rng - Générateur aléatoire (optionnel)
 * @returns L'index sélectionné
 */
export function weightedRandom(weights: number[], rng: RNG = defaultRNG): number {
  if (weights.length === 0) {
    throw new Error('Weights array must not be empty');
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    throw new Error('Total weight must be positive');
  }

  let roll = rng.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      return i;
    }
  }
  return weights.length - 1;
}

/**
 * Calcule la moyenne d'un tableau de nombres.
 * @returns La moyenne, ou 0 si le tableau est vide.
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) {
    return 0;
  }
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Interpolation linéaire entre deux valeurs.
 * @param a - Valeur de départ
 * @param b - Valeur d'arrivée
 * @param t - Facteur d'interpolation [0, 1]
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
