/**
 * useGameLoop — React hook wrapping GameLoopOrchestrator calls.
 *
 * Reads game state from the Zustand store, invokes orchestrator methods,
 * and updates the store after each operation.
 *
 * Requirements: 14.1
 */

import { useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  advanceDay,
  simulateWeek,
  playMatch,
  simulateMatch,
  executeTraining,
  type DayAdvanceResult,
  type WeekAdvanceResult,
  type MatchCompleteResult,
} from '../../core/GameLoopOrchestrator';
import type { MatchConfig, PlayerInput, TrainingSkill, TrainingResult } from '../../core/types';
import { createRNG } from '../../utils/random';

export interface UseGameLoopReturn {
  /** Advance the game by one day */
  advanceDay: () => DayAdvanceResult | null;
  /** Simulate a full week (7 days) */
  simulateWeek: () => WeekAdvanceResult | null;
  /** Play an interactive match with player inputs */
  playMatch: (config: MatchConfig, playerInputs: PlayerInput[]) => MatchCompleteResult | null;
  /** Simulate a match (quick sim, no player interaction) */
  simulateMatch: (config: MatchConfig) => MatchCompleteResult | null;
  /** Execute a weekly training session on the specified skill */
  executeTraining: (skill: TrainingSkill) => TrainingResult | null;
  /** Whether the game state is loaded */
  isReady: boolean;
  /** Whether training is available this week */
  trainingAvailable: boolean;
}

export function useGameLoop(): UseGameLoopReturn {
  const gameState = useGameStore((s) => s.gameState);
  const training = useGameStore((s) => s.training);
  const markTrainingDone = useGameStore((s) => s.markTrainingDone);
  const resetWeeklyTraining = useGameStore((s) => s.resetWeeklyTraining);

  const handleAdvanceDay = useCallback((): DayAdvanceResult | null => {
    const state = useGameStore.getState();
    if (!state.gameState) return null;

    const rng = createRNG(Date.now());
    const { newState, result } = advanceDay(state.gameState, rng);

    // Update the store with the new game state
    useGameStore.setState({ gameState: newState });

    // Handle training reset on Monday
    if (result.trainingReset) {
      resetWeeklyTraining();
    }

    // Random rest event (~10% chance per day, max 2/month)
    const restRng = createRNG(Date.now() + 777);
    const restCount = useGameStore.getState().restEventsThisMonth ?? 0;
    if (restCount < 2 && restRng.random() < 0.10) {
      useGameStore.setState({ pendingRestEvent: true });
    }

    // Reset monthly rest counter on the 1st
    if (newState.time.currentDate.day === 1) {
      useGameStore.setState({ restEventsThisMonth: 0 });

      // Monthly investment value update
      const latestState = useGameStore.getState();
      if (latestState.gameState && latestState.gameState.lifestyle.investments.length > 0) {
        const updatedInvestments = latestState.gameState.lifestyle.investments.map((inv) => {
          let change: number;
          if (inv.risk === 'safe') {
            // Real estate: always positive (0.3% to full return)
            change = inv.currentValue * (inv.monthlyReturn / 100) * (0.7 + Math.random() * 0.6);
          } else if (inv.risk === 'medium') {
            // Stocks/business: can go up or down
            const direction = Math.random() < 0.6 ? 1 : -1; // 60% chance positive
            change = inv.currentValue * (inv.monthlyReturn / 100) * direction * (0.5 + Math.random());
          } else {
            // Crypto/high risk: very volatile
            const direction = Math.random() < 0.55 ? 1 : -1; // 55% chance positive
            change = inv.currentValue * (inv.monthlyReturn / 100) * direction * (0.5 + Math.random() * 1.5);
          }
          return { ...inv, currentValue: Math.max(inv.investedAmount * 0.3, Math.round(inv.currentValue + change)) };
        });

        useGameStore.setState({
          gameState: { ...latestState.gameState, lifestyle: { ...latestState.gameState.lifestyle, investments: updatedInvestments } },
        });
      }

      // Monthly sponsoring payments
      const sponsorState = useGameStore.getState();
      if (sponsorState.gameState && (sponsorState.gameState.lifestyle.sponsorContracts ?? []).length > 0) {
        const contracts = sponsorState.gameState.lifestyle.sponsorContracts ?? [];
        const totalSponsorIncome = contracts.reduce((sum, c) => sum + c.monthlyPay, 0);
        // Decrease months remaining, remove expired contracts
        const updatedContracts = contracts
          .map((c) => ({ ...c, monthsRemaining: c.monthsRemaining - 1 }))
          .filter((c) => c.monthsRemaining > 0);

        useGameStore.setState({
          gameState: {
            ...sponsorState.gameState,
            finance: {
              ...sponsorState.gameState.finance,
              balance: sponsorState.gameState.finance.balance + totalSponsorIncome,
            },
            lifestyle: {
              ...sponsorState.gameState.lifestyle,
              sponsorContracts: updatedContracts,
            },
          },
        });
      }

      // Monthly YouTube revenue
      const ytState = useGameStore.getState();
      if (ytState.gameState) {
        const ytRevenue = ytState.gameState.lifestyle.youtube?.monthlyRevenue ?? 0;
        if (ytRevenue > 0) {
          useGameStore.setState({
            gameState: {
              ...ytState.gameState,
              finance: {
                ...ytState.gameState.finance,
                balance: ytState.gameState.finance.balance + ytRevenue,
              },
            },
          });
        }
      }
    }

    return result;
  }, [resetWeeklyTraining]);

  const handleSimulateWeek = useCallback((): WeekAdvanceResult | null => {
    const state = useGameStore.getState();
    if (!state.gameState) return null;

    // Advance day by day, stopping if we hit a match day
    let currentGameState = state.gameState;
    const days: DayAdvanceResult[] = [];
    let stoppedOnMatchDay = false;

    for (let i = 0; i < 7; i++) {
      // Check if today is already a match day before advancing
      const playerLeague = currentGameState.leagues.find(
        (l) => l.division.country === currentGameState.career.currentClub.country
      );
      const playerClubId = currentGameState.career.currentClub.id;
      const schedule = playerLeague?.schedule ?? [];
      const nextMatch = schedule.find(
        (m) => m.matchday > currentGameState.career.matchday &&
          (m.homeTeam === playerClubId || m.awayTeam === playerClubId)
      );

      if (nextMatch &&
        currentGameState.time.currentDate.day === nextMatch.date.day &&
        currentGameState.time.currentDate.month === nextMatch.date.month &&
        currentGameState.time.currentDate.year === nextMatch.date.year) {
        // It's a match day — stop here
        stoppedOnMatchDay = true;
        break;
      }

      const rng = createRNG(Date.now() + i);
      const { newState, result } = advanceDay(currentGameState, rng);
      currentGameState = newState;
      days.push(result);

      // Check if the day we just advanced TO is a match day
      if (result.isMatchDay) {
        stoppedOnMatchDay = true;
        break;
      }
    }

    // Check for random rest event (max 2 per month, ~35% chance per week)
    const restRng = createRNG(Date.now() + 999);
    const restCountThisMonth = useGameStore.getState().restEventsThisMonth ?? 0;
    const shouldTriggerRest = restCountThisMonth < 2 && restRng.random() < 0.35;

    if (shouldTriggerRest) {
      // Set pending rest event — UI will show the popup
      useGameStore.setState({
        gameState: currentGameState,
        pendingRestEvent: true,
      });
    } else {
      useGameStore.setState({ gameState: currentGameState });
    }

    // Reset monthly rest counter on the 1st of the month
    if (currentGameState.time.currentDate.day <= 7) {
      useGameStore.setState({ restEventsThisMonth: 0 });

      // Monthly investment value update (if we crossed the 1st during this week)
      const latestState = useGameStore.getState();
      if (latestState.gameState && latestState.gameState.lifestyle.investments.length > 0) {
        const updatedInvestments = latestState.gameState.lifestyle.investments.map((inv) => {
          let change: number;
          if (inv.risk === 'safe') {
            change = inv.currentValue * (inv.monthlyReturn / 100) * (0.7 + Math.random() * 0.6);
          } else if (inv.risk === 'medium') {
            const direction = Math.random() < 0.6 ? 1 : -1;
            change = inv.currentValue * (inv.monthlyReturn / 100) * direction * (0.5 + Math.random());
          } else {
            const direction = Math.random() < 0.55 ? 1 : -1;
            change = inv.currentValue * (inv.monthlyReturn / 100) * direction * (0.5 + Math.random() * 1.5);
          }
          return { ...inv, currentValue: Math.max(inv.investedAmount * 0.3, Math.round(inv.currentValue + change)) };
        });

        useGameStore.setState({
          gameState: { ...latestState.gameState, lifestyle: { ...latestState.gameState.lifestyle, investments: updatedInvestments } },
        });
      }

      // Monthly sponsoring payments (simulateWeek)
      const sponsorState = useGameStore.getState();
      if (sponsorState.gameState && (sponsorState.gameState.lifestyle.sponsorContracts ?? []).length > 0) {
        const contracts = sponsorState.gameState.lifestyle.sponsorContracts ?? [];
        const totalSponsorIncome = contracts.reduce((sum, c) => sum + c.monthlyPay, 0);
        const updatedContracts = contracts
          .map((c) => ({ ...c, monthsRemaining: c.monthsRemaining - 1 }))
          .filter((c) => c.monthsRemaining > 0);

        useGameStore.setState({
          gameState: {
            ...sponsorState.gameState,
            finance: {
              ...sponsorState.gameState.finance,
              balance: sponsorState.gameState.finance.balance + totalSponsorIncome,
            },
            lifestyle: {
              ...sponsorState.gameState.lifestyle,
              sponsorContracts: updatedContracts,
            },
          },
        });
      }
    }

    // Reset training if we passed a Monday
    if (days.some((d) => d.trainingReset)) {
      resetWeeklyTraining();
    }

    return {
      days,
      matchResults: [],
      standingsUpdated: false,
    };
  }, [resetWeeklyTraining]);

  const handlePlayMatch = useCallback(
    (config: MatchConfig, playerInputs: PlayerInput[]): MatchCompleteResult | null => {
      const state = useGameStore.getState();
      if (!state.gameState) return null;

      const rng = createRNG(Date.now());
      const { newState, result } = playMatch(state.gameState, config, playerInputs, rng);

      useGameStore.setState({ gameState: newState });

      return result;
    },
    []
  );

  const handleSimulateMatch = useCallback(
    (config: MatchConfig): MatchCompleteResult | null => {
      const state = useGameStore.getState();
      if (!state.gameState) return null;

      const rng = createRNG(Date.now());
      const { newState, result } = simulateMatch(state.gameState, config, rng);

      useGameStore.setState({ gameState: newState });

      return result;
    },
    []
  );

  const handleExecuteTraining = useCallback(
    (skill: TrainingSkill): TrainingResult | null => {
      const state = useGameStore.getState();
      if (!state.gameState) return null;

      // Check if training is available
      if (state.training.trainedThisWeek) return null;

      const rng = createRNG(Date.now());
      const { newState, result } = executeTraining(state.gameState, skill, rng);

      // Update game state and mark training as done
      useGameStore.setState({ gameState: newState });
      markTrainingDone(newState.time.currentDate);

      return result;
    },
    [markTrainingDone]
  );

  return {
    advanceDay: handleAdvanceDay,
    simulateWeek: handleSimulateWeek,
    playMatch: handlePlayMatch,
    simulateMatch: handleSimulateMatch,
    executeTraining: handleExecuteTraining,
    isReady: gameState !== null,
    trainingAvailable: !training.trainedThisWeek,
  };
}
