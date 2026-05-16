import { create } from 'zustand';
import { createPlayerSlice, type PlayerSlice } from './slices/playerSlice';
import { createCareerSlice, type CareerSlice } from './slices/careerSlice';
import { createTimeSlice, type TimeSlice } from './slices/timeSlice';
import { createSocialSlice, type SocialSlice } from './slices/socialSlice';
import { createFinanceSlice, type FinanceSlice } from './slices/financeSlice';
import { createLeagueSlice, type LeagueSlice } from './slices/leagueSlice';
import { createTrainingSlice, type TrainingSlice } from './slices/trainingSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createChampionsLeagueSlice, type ChampionsLeagueSlice } from './slices/championsLeagueSlice';
import type { GameState, Club, PlayerCharacter, CareerState, TimeState, SocialState, FinanceState } from '../core/types';
import type { CharacterCreationInput } from '../systems/career/CareerSystem';
import { createPlayerCharacter, generateInitialContract, addPlayerToSquad } from '../systems/career/CareerSystem';
import { createInitialSocialState } from '../systems/social/SocialSystem';
import { createInitialFinanceState } from '../systems/finance/FinanceSystem';
import { createInitialTimeState, advanceDay as advanceDayFn, simulateWeek as simulateWeekFn } from '../systems/time/TimeSystem';
import { createRNG } from '../utils/random';
import { generateSeasonSchedule } from '../systems/league/LeagueEngine';
import { clubsByCountry } from '../data/clubs/index';
import { saveManager } from '../persistence/SaveManager';
import type { LeagueState, Division, Country, ScheduledMatch } from '../core/types';
import { ChampionsLeagueSystem } from '../systems/championsLeague/ChampionsLeagueSystem';
import { qualify } from '../systems/championsLeague/qualification';

export interface GameSlice {
  gameState: GameState | null;
  characterCreation: CharacterCreationInput | null;
  pendingRestEvent: boolean;
  restEventsThisMonth: number;
  lastWellnessWeek: number;
  lastMoraleWeek: number;
  setCharacterCreation: (input: CharacterCreationInput) => void;
  selectClub: (club: Club) => void;
  advanceGameDay: () => void;
  simulateGameWeek: () => void;
}

export type GameStore = PlayerSlice & CareerSlice & TimeSlice & SocialSlice & FinanceSlice & LeagueSlice & UISlice & TrainingSlice & ChampionsLeagueSlice & GameSlice;

export const useGameStore = create<GameStore>()((...a) => ({
  ...createPlayerSlice(...a),
  ...createCareerSlice(...a),
  ...createTimeSlice(...a),
  ...createSocialSlice(...a),
  ...createFinanceSlice(...a),
  ...createLeagueSlice(...a),
  ...createUISlice(...a),
  ...createTrainingSlice(...a),
  ...createChampionsLeagueSlice(...a),

  // Game orchestration slice
  gameState: null,
  characterCreation: null,
  pendingRestEvent: false,
  restEventsThisMonth: 0,
  lastWellnessWeek: 0,
  lastMoraleWeek: 0,

  setCharacterCreation: (input) => a[0]({ characterCreation: input }),

  selectClub: (club) => {
    const state = a[1]();
    const charInput = state.characterCreation;
    if (!charInput) return;

    const rng = createRNG(Date.now());
    const player = createPlayerCharacter(charInput, club.tier, rng);
    const contract = generateInitialContract(club.id, club.tier, rng);
    const updatedClub = addPlayerToSquad(club, player);

    // Initialize all 5 leagues with schedules and initial standings
    const leagueConfigs: { country: Country; name: string }[] = [
      { country: 'france', name: 'Ligue 1' },
      { country: 'england', name: 'Premier League' },
      { country: 'spain', name: 'La Liga' },
      { country: 'italy', name: 'Serie A' },
      { country: 'germany', name: 'Bundesliga' },
    ];

    const leagues: LeagueState[] = leagueConfigs.map(({ country, name }) => {
      let clubs = clubsByCountry[country].slice(0, 18);

      // If this is the player's country, make sure the player's club is in the list
      if (country === updatedClub.country) {
        const hasPlayerClub = clubs.some((c) => c.id === updatedClub.id);
        if (!hasPlayerClub) {
          clubs = [updatedClub, ...clubs.slice(0, 17)];
        } else {
          clubs = clubs.map((c) => (c.id === updatedClub.id ? updatedClub : c));
        }
      }

      // Generate schedule (requires exactly 18 clubs)
      let schedule: ScheduledMatch[] = [];
      if (clubs.length === 18) {
        try {
          schedule = generateSeasonSchedule(clubs);
        } catch {
          // Fallback: empty schedule if generation fails
          schedule = [];
        }
      }

      const division: Division = { country, level: 1, name };

      // Initial standings: all teams at 0
      const standings = clubs.map((c, idx) => ({
        clubId: c.id,
        clubName: c.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        position: idx + 1,
      }));

      return {
        division,
        standings,
        results: [],
        season: 1,
        topScorers: [],
        schedule,
      };
    });

    // Find the next match for the player's team
    const playerLeague = leagues.find((l) => l.division.country === updatedClub.country);
    const nextMatch = playerLeague?.schedule.find(
      (m) => m.matchday === 1 && (m.homeTeam === updatedClub.id || m.awayTeam === updatedClub.id)
    ) ?? null;

    const timeState = createInitialTimeState(1);

    const gameState: GameState = {
      version: '1.0.0',
      player,
      career: {
        currentClub: updatedClub,
        contract,
        season: 1,
        matchday: 0,
        trophies: [],
        transferHistory: [],
        isCaptain: false,
      },
      time: {
        ...timeState,
        schedule: {
          nextMatch,
          seasonMatches: playerLeague?.schedule ?? [],
        },
      },
      social: createInitialSocialState(),
      finance: createInitialFinanceState(contract.weeklySalary),
      leagues,
      saves: { lastSaved: new Date().toISOString(), slot: 1 },
      playerCareerStats: {
        season: { matchesPlayed: 0, goals: 0, assists: 0, shots: 0, dribbles: 0, tackles: 0, avgRating: 0, totalRating: 0, cleanSheets: 0 },
        allTime: { matchesPlayed: 0, goals: 0, assists: 0, shots: 0, dribbles: 0, tackles: 0, avgRating: 0, totalRating: 0, cleanSheets: 0 },
        clGoals: 0,
        seasonHistory: [],
      },
      lifestyle: {
        possessions: [],
        investments: [],
        instagram: {
          followers: 1000,
          posts: [],
          weeklyPostDone: false,
        },
        relationships: {
          current: null,
          history: [],
        },
        celebrities: {
          relations: [],
        },
      },
    };

    a[0]({ gameState, player });

    // Initialize Champions League for season 1
    // Use initial standings (positions based on data order = historical ranking)
    // The top 4 clubs in each league (by initial position) qualify
    try {
      const clRng = createRNG(Date.now() + 1);
      const participants = qualify(leagues, 1, clRng);

      // Check if the player's club is among the qualified
      const playerQualified = participants.some(
        (p) => p.clubId === updatedClub.id && !p.isFiller
      );

      if (playerQualified) {
        const playerSchedule = playerLeague?.schedule ?? [];
        const clState = ChampionsLeagueSystem.initSeason(participants, 1, clRng);
        // Re-assign dates with player's league schedule to avoid conflicts
        const clSchedule = ChampionsLeagueSystem.generateLeaguePhaseSchedule(
          clState.leagueSchedule.map((m) => ({
            homeTeamId: m.homeTeamId,
            awayTeamId: m.awayTeamId,
            matchday: m.matchday,
          })),
          2024,
          playerSchedule
        );
        const finalCLState = {
          ...clState,
          leagueSchedule: clSchedule,
          playerParticipating: true,
          playerClubId: updatedClub.id,
        };
        a[1]().initChampionsLeague(finalCLState);
      }
    } catch {
      // If CL initialization fails, continue without it (non-blocking)
    }
  },

  advanceGameDay: () => {
    const state = a[1]();
    if (!state.gameState) return;

    const rng = createRNG(Date.now());
    const { newState, dayResult } = advanceDayFn(state.gameState.time, rng);

    a[0]({
      gameState: {
        ...state.gameState,
        time: newState,
      },
    });
  },

  simulateGameWeek: () => {
    const state = a[1]();
    if (!state.gameState) return;

    const rng = createRNG(Date.now());
    const { newState, summary } = simulateWeekFn(state.gameState.time, rng);

    a[0]({
      gameState: {
        ...state.gameState,
        time: newState,
      },
    });
  },
}));

// ─── Auto-save: persist gameState to IndexedDB whenever it changes ───────────
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

useGameStore.subscribe((state, prevState) => {
  if (state.gameState && state.gameState !== prevState.gameState) {
    // Debounce: save 500ms after the last change
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      saveManager.saveGame(1, state.gameState!).catch(() => {
        // Silent fail — don't block gameplay
      });
    }, 500);
  }
});