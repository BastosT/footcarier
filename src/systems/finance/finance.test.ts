import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { creditWeeklySalary, createInitialFinanceState } from './FinanceSystem';
import type { Contract, GameDate } from '../../core/types';

describe('FinanceSystem - Property Tests', () => {
  it('Property 21: Weekly salary is credited exactly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 500000 }),
        fc.integer({ min: 0, max: 10000000 }),
        (salary, initialBalance) => {
          const state = { ...createInitialFinanceState(salary), balance: initialBalance };
          const contract: Contract = {
            clubId: 'test',
            weeklySalary: salary,
            bonusPerGoal: 0,
            bonusPerAssist: 0,
            duration: 3,
            seasonsRemaining: 2,
            signingBonus: 0,
          };
          const date: GameDate = { day: 1, month: 1, year: 2025 };

          const result = creditWeeklySalary(state, contract, date);

          expect(result.balance).toBe(initialBalance + salary);
          expect(result.history).toHaveLength(state.history.length + 1);
          expect(result.history[result.history.length - 1].type).toBe('salary');
          expect(result.history[result.history.length - 1].amount).toBe(salary);
        }
      ),
      { numRuns: 100 }
    );
  });
});
