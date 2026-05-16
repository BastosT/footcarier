import { describe, it, expect } from 'vitest';
import { createRNG } from './random';

describe('random - createRNG', () => {
  describe('reproductibilité avec seed', () => {
    it('produit la même séquence pour la même seed', () => {
      const rng1 = createRNG(42);
      const rng2 = createRNG(42);

      const seq1 = Array.from({ length: 10 }, () => rng1.random());
      const seq2 = Array.from({ length: 10 }, () => rng2.random());

      expect(seq1).toEqual(seq2);
    });

    it('produit des séquences différentes pour des seeds différentes', () => {
      const rng1 = createRNG(42);
      const rng2 = createRNG(123);

      const seq1 = Array.from({ length: 5 }, () => rng1.random());
      const seq2 = Array.from({ length: 5 }, () => rng2.random());

      expect(seq1).not.toEqual(seq2);
    });
  });

  describe('random()', () => {
    it('retourne des valeurs dans [0, 1)', () => {
      const rng = createRNG(1);
      for (let i = 0; i < 100; i++) {
        const val = rng.random();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });
  });

  describe('randomInt(min, max)', () => {
    it('retourne des entiers dans [min, max]', () => {
      const rng = createRNG(7);
      for (let i = 0; i < 100; i++) {
        const val = rng.randomInt(1, 10);
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(10);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('retourne min quand min === max', () => {
      const rng = createRNG(99);
      expect(rng.randomInt(5, 5)).toBe(5);
    });
  });

  describe('randomFloat(min, max)', () => {
    it('retourne des flottants dans [min, max)', () => {
      const rng = createRNG(3);
      for (let i = 0; i < 100; i++) {
        const val = rng.randomFloat(2.5, 7.5);
        expect(val).toBeGreaterThanOrEqual(2.5);
        expect(val).toBeLessThan(7.5);
      }
    });
  });

  describe('randomChoice(array)', () => {
    it('retourne un élément du tableau', () => {
      const rng = createRNG(10);
      const items = ['a', 'b', 'c', 'd'];
      for (let i = 0; i < 50; i++) {
        expect(items).toContain(rng.randomChoice(items));
      }
    });

    it('lance une erreur pour un tableau vide', () => {
      const rng = createRNG(1);
      expect(() => rng.randomChoice([])).toThrow('Cannot pick from an empty array');
    });
  });

  describe('randomWeighted(items, weights)', () => {
    it('retourne un élément parmi les items', () => {
      const rng = createRNG(5);
      const items = ['rare', 'common', 'epic'];
      const weights = [1, 10, 2];
      for (let i = 0; i < 50; i++) {
        expect(items).toContain(rng.randomWeighted(items, weights));
      }
    });

    it('favorise les éléments avec un poids élevé', () => {
      const rng = createRNG(42);
      const items = ['heavy', 'light'];
      const weights = [100, 1];
      const results = Array.from({ length: 200 }, () => rng.randomWeighted(items, weights));
      const heavyCount = results.filter((r) => r === 'heavy').length;
      // Avec un poids 100:1, on s'attend à une large majorité de 'heavy'
      expect(heavyCount).toBeGreaterThan(150);
    });

    it('lance une erreur si items est vide', () => {
      const rng = createRNG(1);
      expect(() => rng.randomWeighted([], [])).toThrow('Cannot pick from empty items');
    });

    it('lance une erreur si items et weights ont des tailles différentes', () => {
      const rng = createRNG(1);
      expect(() => rng.randomWeighted(['a', 'b'], [1])).toThrow(
        'Items and weights must have the same length',
      );
    });
  });
});
