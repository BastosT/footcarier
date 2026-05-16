/**
 * FinanceSystem - Gère les finances du joueur (salaire, bonus, transactions).
 */

import type { FinanceState, FinanceTransaction, GameDate, Contract, TransactionType } from '../../core/types';

/**
 * Crédite le salaire hebdomadaire du joueur.
 */
export function creditWeeklySalary(state: FinanceState, contract: Contract, date: GameDate): FinanceState {
  const transaction: FinanceTransaction = {
    date,
    type: 'salary',
    amount: contract.weeklySalary,
    description: 'Salaire hebdomadaire',
  };

  return {
    ...state,
    balance: state.balance + contract.weeklySalary,
    history: [...state.history, transaction],
  };
}

/**
 * Ajoute une transaction au compte du joueur.
 */
export function addTransaction(
  state: FinanceState,
  type: TransactionType,
  amount: number,
  description: string,
  date: GameDate
): FinanceState {
  const transaction: FinanceTransaction = { date, type, amount, description };

  return {
    ...state,
    balance: state.balance + amount,
    history: [...state.history, transaction],
  };
}

/**
 * Crédite un bonus de but.
 */
export function creditGoalBonus(state: FinanceState, contract: Contract, goals: number, date: GameDate): FinanceState {
  if (goals <= 0 || contract.bonusPerGoal <= 0) return state;

  const amount = contract.bonusPerGoal * goals;
  return addTransaction(state, 'bonus', amount, `Bonus de but (x${goals})`, date);
}

/**
 * Crédite un bonus de passe décisive.
 */
export function creditAssistBonus(state: FinanceState, contract: Contract, assists: number, date: GameDate): FinanceState {
  if (assists <= 0 || contract.bonusPerAssist <= 0) return state;

  const amount = contract.bonusPerAssist * assists;
  return addTransaction(state, 'bonus', amount, `Bonus de passe décisive (x${assists})`, date);
}

/**
 * Crédite la prime de signature lors d'un transfert.
 */
export function creditSigningBonus(state: FinanceState, contract: Contract, date: GameDate): FinanceState {
  if (contract.signingBonus <= 0) return state;
  return addTransaction(state, 'signing_bonus', contract.signingBonus, 'Prime de signature', date);
}

/**
 * Crée un état financier initial.
 */
export function createInitialFinanceState(weeklySalary: number): FinanceState {
  return {
    balance: 0,
    weeklyIncome: weeklySalary,
    history: [],
  };
}

export const FinanceSystem = {
  creditWeeklySalary,
  addTransaction,
  creditGoalBonus,
  creditAssistBonus,
  creditSigningBonus,
  createInitialFinanceState,
};
