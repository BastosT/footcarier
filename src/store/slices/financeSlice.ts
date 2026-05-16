import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type { GameDate } from './timeSlice';

export interface FinanceTransaction {
  date: GameDate;
  type: 'salary' | 'bonus' | 'signing_bonus' | 'sponsorship' | 'fine' | 'event';
  amount: number;
  description: string;
}

export interface FinanceState {
  balance: number;
  weeklyIncome: number;
  history: FinanceTransaction[];
}

export interface FinanceSlice {
  finance: FinanceState;
  setBalance: (balance: number) => void;
  addTransaction: (transaction: FinanceTransaction) => void;
  setWeeklyIncome: (income: number) => void;
  creditSalary: (date: GameDate) => void;
  resetFinance: () => void;
}

const initialFinanceState: FinanceState = {
  balance: 0,
  weeklyIncome: 0,
  history: [],
};

export const createFinanceSlice: StateCreator<GameStore, [], [], FinanceSlice> = (set) => ({
  finance: initialFinanceState,

  setBalance: (balance) =>
    set((state) => ({
      finance: { ...state.finance, balance },
    })),

  addTransaction: (transaction) =>
    set((state) => ({
      finance: {
        ...state.finance,
        balance: state.finance.balance + transaction.amount,
        history: [...state.finance.history, transaction],
      },
    })),

  setWeeklyIncome: (income) =>
    set((state) => ({
      finance: { ...state.finance, weeklyIncome: income },
    })),

  creditSalary: (date) =>
    set((state) => {
      const transaction: FinanceTransaction = {
        date,
        type: 'salary',
        amount: state.finance.weeklyIncome,
        description: 'Salaire hebdomadaire',
      };
      return {
        finance: {
          ...state.finance,
          balance: state.finance.balance + state.finance.weeklyIncome,
          history: [...state.finance.history, transaction],
        },
      };
    }),

  resetFinance: () => set({ finance: initialFinanceState }),
});
