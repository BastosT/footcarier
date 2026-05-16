/**
 * Générateur de nombres aléatoires seedable pour la reproductibilité des tests.
 * Utilise l'algorithme mulberry32 (PRNG rapide et de bonne qualité).
 */

export interface RNG {
  /** Retourne un nombre flottant dans [0, 1) */
  random(): number;
  /** Retourne un entier dans [min, max] (inclus) */
  randomInt(min: number, max: number): number;
  /** Retourne un flottant dans [min, max) */
  randomFloat(min: number, max: number): number;
  /** Retourne un élément aléatoire du tableau */
  randomChoice<T>(array: T[]): T;
  /** Retourne un élément selon des poids associés */
  randomWeighted<T>(items: T[], weights: number[]): T;
}

/**
 * Algorithme mulberry32 — PRNG 32-bit rapide et de bonne qualité statistique.
 */
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Crée un générateur de nombres aléatoires seedable.
 * @param seed - Graine pour la reproductibilité. Si omise, utilise Math.random.
 */
export function createRNG(seed?: number): RNG {
  const nextRandom = seed !== undefined ? mulberry32(seed) : () => Math.random();

  function random(): number {
    return nextRandom();
  }

  function randomInt(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return lo + Math.floor(nextRandom() * (hi - lo + 1));
  }

  function randomFloat(min: number, max: number): number {
    return min + nextRandom() * (max - min);
  }

  function randomChoice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from an empty array');
    }
    return array[Math.floor(nextRandom() * array.length)];
  }

  function randomWeighted<T>(items: T[], weights: number[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty items');
    }
    if (items.length !== weights.length) {
      throw new Error('Items and weights must have the same length');
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight <= 0) {
      throw new Error('Total weight must be positive');
    }

    let roll = nextRandom() * totalWeight;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        return items[i];
      }
    }
    // Fallback (ne devrait pas arriver avec des poids valides)
    return items[items.length - 1];
  }

  return { random, randomInt, randomFloat, randomChoice, randomWeighted };
}

/** Instance par défaut non-seedée pour la production */
export const defaultRNG = createRNG();
