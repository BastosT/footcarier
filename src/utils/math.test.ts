import { describe, it, expect } from 'vitest';
import { clamp, poissonRandom, weightedRandom, average, lerp } from './math';
import { createRNG } from './random';

describe('math - clamp', () => {
  it('retourne la valeur si elle est dans les bornes', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('retourne min si la valeur est inférieure', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('retourne max si la valeur est supérieure', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('fonctionne avec des valeurs flottantes', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(-0.1, 0, 1)).toBe(0);
    expect(clamp(1.5, 0, 1)).toBe(1);
  });

  it('retourne la valeur quand min === max === value', () => {
    expect(clamp(5, 5, 5)).toBe(5);
  });

  it('lance une erreur si min > max', () => {
    expect(() => clamp(5, 10, 0)).toThrow('min must be <= max');
  });
});

describe('math - poissonRandom', () => {
  it('retourne 0 quand lambda est 0', () => {
    const rng = createRNG(1);
    expect(poissonRandom(0, rng)).toBe(0);
  });

  it('retourne des entiers non-négatifs', () => {
    const rng = createRNG(42);
    for (let i = 0; i < 100; i++) {
      const val = poissonRandom(2.5, rng);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('la moyenne converge vers lambda sur un grand échantillon', () => {
    const rng = createRNG(123);
    const lambda = 3;
    const samples = Array.from({ length: 1000 }, () => poissonRandom(lambda, rng));
    const mean = samples.reduce((s, v) => s + v, 0) / samples.length;
    // La moyenne devrait être proche de lambda (tolérance large pour un PRNG)
    expect(mean).toBeGreaterThan(lambda - 0.5);
    expect(mean).toBeLessThan(lambda + 0.5);
  });

  it('lance une erreur si lambda est négatif', () => {
    const rng = createRNG(1);
    expect(() => poissonRandom(-1, rng)).toThrow('Lambda must be non-negative');
  });
});

describe('math - weightedRandom', () => {
  it('retourne un index valide', () => {
    const rng = createRNG(7);
    const weights = [1, 2, 3, 4];
    for (let i = 0; i < 50; i++) {
      const idx = weightedRandom(weights, rng);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(weights.length);
    }
  });

  it('favorise les index avec un poids élevé', () => {
    const rng = createRNG(42);
    const weights = [1, 1, 100];
    const results = Array.from({ length: 200 }, () => weightedRandom(weights, rng));
    const lastCount = results.filter((r) => r === 2).length;
    expect(lastCount).toBeGreaterThan(150);
  });

  it('lance une erreur pour un tableau vide', () => {
    const rng = createRNG(1);
    expect(() => weightedRandom([], rng)).toThrow('Weights array must not be empty');
  });

  it('lance une erreur si le poids total est <= 0', () => {
    const rng = createRNG(1);
    expect(() => weightedRandom([0, 0, 0], rng)).toThrow('Total weight must be positive');
  });
});

describe('math - average', () => {
  it('retourne 0 pour un tableau vide', () => {
    expect(average([])).toBe(0);
  });

  it('retourne la valeur unique pour un tableau à un élément', () => {
    expect(average([7])).toBe(7);
  });

  it('calcule correctement la moyenne', () => {
    expect(average([2, 4, 6, 8])).toBe(5);
  });

  it('gère les nombres négatifs', () => {
    expect(average([-10, 10])).toBe(0);
  });
});

describe('math - lerp', () => {
  it('retourne a quand t = 0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it('retourne b quand t = 1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('retourne le milieu quand t = 0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it('fonctionne avec des valeurs négatives', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });

  it('extrapole au-delà de [0, 1]', () => {
    expect(lerp(0, 10, 2)).toBe(20);
    expect(lerp(0, 10, -1)).toBe(-10);
  });
});
