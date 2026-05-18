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
import { allClubs } from '../../data/clubs/index';

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

      // Simulate CL matchday on Mondays (CL matches happen midweek)
      const clState = useGameStore.getState().championsLeague;
      if (clState && clState.phase === 'league' && clState.currentMatchday <= 8) {
        const clRng = createRNG(Date.now() + 4444);
        const currentCLMatchday = clState.currentMatchday;

        // Simulate all matches for this CL matchday
        const matchesThisDay = clState.leagueSchedule.filter((m) => m.matchday === currentCLMatchday);
        const newResults = [...clState.leagueResults];

        for (const match of matchesThisDay) {
          // Skip if already played
          if (newResults.some((r) => r.homeTeamId === match.homeTeamId && r.awayTeamId === match.awayTeamId && r.matchday === match.matchday)) continue;

          // Skip player's match (handled separately)
          const playerClubId = useGameStore.getState().gameState?.career.currentClub.id;
          const playerParticipant = clState.participants.find((p) => p.clubId === playerClubId);
          if (playerParticipant && (match.homeTeamId === playerParticipant.id || match.awayTeamId === playerParticipant.id)) continue;

          // Simulate the match
          const home = clState.participants.find((p) => p.id === match.homeTeamId);
          const away = clState.participants.find((p) => p.id === match.awayTeamId);
          const homeRating = home?.averageRating ?? 72;
          const awayRating = away?.averageRating ?? 72;

          const diff = homeRating - awayRating;
          const homeChance = 0.35 + diff / 100;
          let homeGoals = 0;
          let awayGoals = 0;
          for (let i = 0; i < 4; i++) {
            if (clRng.random() < Math.max(0.1, Math.min(0.6, homeChance))) homeGoals++;
            if (clRng.random() < Math.max(0.1, Math.min(0.6, 0.35 - diff / 100))) awayGoals++;
          }

          newResults.push({
            matchday: currentCLMatchday,
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            homeGoals,
            awayGoals,
            phase: 'league' as const,
          });
        }

        // Update standings
        const newStandings = clState.standings.map((s) => {
          let played = 0, won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0, points = 0;
          for (const r of newResults) {
            if (r.homeTeamId === s.participantId) {
              played++;
              goalsFor += r.homeGoals;
              goalsAgainst += r.awayGoals;
              if (r.homeGoals > r.awayGoals) { won++; points += 3; }
              else if (r.homeGoals === r.awayGoals) { drawn++; points += 1; }
              else { lost++; }
            } else if (r.awayTeamId === s.participantId) {
              played++;
              goalsFor += r.awayGoals;
              goalsAgainst += r.homeGoals;
              if (r.awayGoals > r.homeGoals) { won++; points += 3; }
              else if (r.awayGoals === r.homeGoals) { drawn++; points += 1; }
              else { lost++; }
            }
          }
          return { ...s, played, won, drawn, lost, goalsFor, goalsAgainst, points };
        });

        // Sort standings by points, then goal difference
        newStandings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const gdA = a.goalsFor - a.goalsAgainst;
          const gdB = b.goalsFor - b.goalsAgainst;
          if (gdB !== gdA) return gdB - gdA;
          return b.goalsFor - a.goalsFor;
        });
        newStandings.forEach((s, i) => { s.position = i + 1; });

        // Advance to next matchday
        const nextMatchday = currentCLMatchday + 1;

        useGameStore.getState().updateCLStandings(newStandings);
        useGameStore.setState((state) => ({
          championsLeague: state.championsLeague ? {
            ...state.championsLeague,
            leagueResults: newResults,
            currentMatchday: nextMatchday,
            // If all 8 matchdays done, transition to knockout
            phase: nextMatchday > 8 ? 'knockout' as const : 'league' as const,
          } : null,
        }));
      }
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

      // Monthly: update agent interested clubs
      const agentState = useGameStore.getState();
      if (agentState.gameState?.agent) {
        const gs = agentState.gameState;
        const agent = gs.agent!.currentAgent;
        // Simple deterministic generation based on month
        const seed = gs.time.currentDate.year * 12 + gs.time.currentDate.month;
        let s = seed;
        const rand = () => { s = (s * 1664525 + 1013904223) & 0xFFFFFFFF; return (s >>> 0) / 0xFFFFFFFF; };

        const eligible = allClubs.filter((c) => {
          if (c.id === gs.career.currentClub.id) return false;
          if (c.tier === 'big' && gs.player.overallRating < 72 && agent.tier !== 'elite') return false;
          if (c.tier === 'big' && agent.tier === 'family') return false;
          return true;
        });
        const shuffled = [...eligible].sort(() => rand() - 0.5);
        const count = agent.networkLevel + Math.floor(rand() * 2);
        const clubs = shuffled.slice(0, count).map((c) => c.name);

        useGameStore.setState({
          gameState: { ...gs, agent: { ...gs.agent!, interestedClubs: clubs } },
        });
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
