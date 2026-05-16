/**
 * Tests unitaires pour CLCompetitionEnd.
 *
 * Vérifie :
 * - L'attribution du trophée après victoire en finale
 * - Le retrait des matchs après élimination
 * - La réinitialisation de l'état CL
 * - Le message d'élimination en français
 *
 * Requirements: 9.1, 9.2, 9.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleCLElimination,
  handleCLTrophy,
  handleCLSeasonEnd,
  getEliminationMessage,
} from './CLCompetitionEnd';
import { eventBus, GameEvent } from '../../core/EventBus';
import type { GameState } from '../../core/types';
import type { ChampionsLeagueState, CLScheduledMatch } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createMinimalGameState(overrides?: Partial<GameState>): GameState {
  return {
    version: '1.0',
    player: {
      id: 'player-1',
      firstName: 'Jean',
      lastName: 'Dupont',
      nationality: 'france',
      position: 'ST',
      appearance: { skinTone: 1, hairStyle: 1, hairColor: 1, height: 'medium' },
      age: 22,
      jerseyNumber: 9,
      stats: { pace: 75, shooting: 80, passing: 70, dribbling: 72, defending: 40, physical: 68 },
      potential: 88,
      overallRating: 76,
      fitness: 85,
      morale: 70,
      injury: null,
    },
    career: {
      currentClub: {
        id: 'club-psg',
        name: 'Paris Saint-Germain',
        country: 'france',
        division: { country: 'france', level: 1, name: 'Ligue 1' },
        tier: 'big',
        squad: [],
        finances: { budget: 100000000, wageBill: 5000000 },
        stadium: 'Parc des Princes',
        colors: { primary: '#004170', secondary: '#DA291C' },
      },
      contract: {
        clubId: 'club-psg',
        weeklySalary: 50000,
        bonusPerGoal: 5000,
        bonusPerAssist: 3000,
        duration: 4,
        seasonsRemaining: 3,
        signingBonus: 100000,
      },
      season: 2,
      matchday: 20,
      trophies: [],
      transferHistory: [],
    },
    time: {
      currentDate: { day: 15, month: 3, year: 2025 },
      season: 2,
      weekday: 2,
      eventsThisWeek: 0,
      schedule: { nextMatch: null, seasonMatches: [] },
    },
    social: {
      popularity: 50,
      reputation: 50,
      coachRelation: 60,
      teamRelation: 60,
      teamMorale: 70,
      socialFeed: [],
      pendingInterviews: [],
    },
    finance: {
      balance: 500000,
      weeklyIncome: 50000,
      history: [],
    },
    leagues: [],
    saves: { lastSaved: '2025-01-01', slot: 1 },
    playerCareerStats: {
      season: { matchesPlayed: 20, goals: 10, assists: 5, shots: 40, dribbles: 30, tackles: 5, avgRating: 7.2, totalRating: 144, cleanSheets: 0 },
      allTime: { matchesPlayed: 50, goals: 25, assists: 12, shots: 100, dribbles: 80, tackles: 15, avgRating: 7.0, totalRating: 350, cleanSheets: 0 },
      clGoals: 3,
    },
    lifestyle: {
      possessions: [],
      investments: [],
      instagram: { followers: 10000, posts: [], weeklyPostDone: false },
    },
    ...overrides,
  } as GameState;
}

function createCLState(overrides?: Partial<ChampionsLeagueState>): ChampionsLeagueState {
  return {
    season: 2,
    participants: [
      { id: 'club-psg', name: 'Paris Saint-Germain', country: 'france', averageRating: 85, isFiller: false, clubId: 'club-psg' },
      { id: 'club-rm', name: 'Real Madrid', country: 'spain', averageRating: 87, isFiller: false, clubId: 'club-rm' },
      { id: 'club-mc', name: 'Manchester City', country: 'england', averageRating: 86, isFiller: false, clubId: 'club-mc' },
    ],
    phase: 'knockout',
    currentMatchday: 8,
    leagueSchedule: [],
    leagueResults: [],
    standings: [],
    knockoutRound: 'final',
    knockoutBracket: {
      roundOf16: [],
      quarterFinals: [],
      semiFinals: [],
      final: null,
    },
    playerParticipating: true,
    playerEliminated: false,
    playerClubId: 'club-psg',
    ...overrides,
  };
}

function createScheduledMatches(): CLScheduledMatch[] {
  return [
    {
      date: { day: 20, month: 3, year: 2025 },
      homeTeamId: 'club-psg',
      awayTeamId: 'club-rm',
      matchday: 0,
      phase: 'quarter-final',
      leg: 1,
    },
    {
      date: { day: 10, month: 4, year: 2025 },
      homeTeamId: 'club-rm',
      awayTeamId: 'club-psg',
      matchday: 0,
      phase: 'quarter-final',
      leg: 2,
    },
    {
      date: { day: 22, month: 3, year: 2025 },
      homeTeamId: 'club-mc',
      awayTeamId: 'club-rm',
      matchday: 0,
      phase: 'quarter-final',
      leg: 1,
    },
  ];
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CLCompetitionEnd', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleCLElimination', () => {
    it('should set playerEliminated to true', () => {
      const clState = createCLState({
        leagueSchedule: createScheduledMatches(),
      });
      const state = createMinimalGameState({ championsLeague: clState });

      const result = handleCLElimination(state);

      expect(result.championsLeague!.playerEliminated).toBe(true);
    });

    it('should remove remaining CL matches for the player club from schedule', () => {
      const clState = createCLState({
        leagueSchedule: createScheduledMatches(),
      });
      const state = createMinimalGameState({ championsLeague: clState });

      const result = handleCLElimination(state);

      // Only the match between club-mc and club-rm should remain
      expect(result.championsLeague!.leagueSchedule).toHaveLength(1);
      expect(result.championsLeague!.leagueSchedule[0].homeTeamId).toBe('club-mc');
      expect(result.championsLeague!.leagueSchedule[0].awayTeamId).toBe('club-rm');
    });

    it('should emit CL_ELIMINATED event', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');
      const clState = createCLState({
        leagueSchedule: createScheduledMatches(),
      });
      const state = createMinimalGameState({ championsLeague: clState });

      handleCLElimination(state);

      expect(emitSpy).toHaveBeenCalledWith(GameEvent.CL_ELIMINATED, {
        playerClubId: 'club-psg',
      });
    });

    it('should return state unchanged if championsLeague is null', () => {
      const state = createMinimalGameState({ championsLeague: null });

      const result = handleCLElimination(state);

      expect(result).toBe(state);
    });

    it('should return state unchanged if player is already eliminated', () => {
      const clState = createCLState({
        playerEliminated: true,
        leagueSchedule: createScheduledMatches(),
      });
      const state = createMinimalGameState({ championsLeague: clState });

      const result = handleCLElimination(state);

      expect(result).toBe(state);
    });

    it('should use career.currentClub.id if playerClubId is null', () => {
      const clState = createCLState({
        playerClubId: null,
        leagueSchedule: createScheduledMatches(),
      });
      const state = createMinimalGameState({ championsLeague: clState });

      const result = handleCLElimination(state);

      // PSG matches should be removed (using career.currentClub.id = 'club-psg')
      expect(result.championsLeague!.playerEliminated).toBe(true);
      expect(result.championsLeague!.leagueSchedule).toHaveLength(1);
    });
  });

  describe('handleCLTrophy', () => {
    it('should add champions_league trophy when player club wins the final', () => {
      const clState = createCLState({
        knockoutBracket: {
          roundOf16: [],
          quarterFinals: [],
          semiFinals: [],
          final: {
            homeTeam: { id: 'club-psg', name: 'PSG', country: 'france', averageRating: 85, isFiller: false },
            awayTeam: { id: 'club-rm', name: 'Real Madrid', country: 'spain', averageRating: 87, isFiller: false },
            winner: 'club-psg',
          },
        },
      });
      const state = createMinimalGameState({ championsLeague: clState });

      const result = handleCLTrophy(state, 2);

      expect(result.career.trophies).toHaveLength(1);
      expect(result.career.trophies[0].type).toBe('champions_league');
      expect(result.career.trophies[0].season).toBe(2);
      expect(result.career.trophies[0].competition).toBe('Ligue des Champions');
    });

    it('should emit CL_TROPHY_WON event when player wins', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit');
      const clState = createCLState({
        knockoutBracket: {
          roundOf16: [],
          quarterFinals: [],
          semiFinals: [],
          final: {
            homeTeam: { id: 'club-psg', name: 'PSG', country: 'france', averageRating: 85, isFiller: false },
            awayTeam: { id: 'club-rm', name: 'Real Madrid', country: 'spain', averageRating: 87, isFiller: false },
            winner: 'club-psg',
          },
        },
      });
      const state = createMinimalGameState({ championsLeague: clState });

      handleCLTrophy(state, 2);

      expect(emitSpy).toHaveBeenCalledWith(GameEvent.CL_TROPHY_WON, expect.objectContaining({
        playerClubId: 'club-psg',
        season: 2,
      }));
    });

    it('should not add trophy when player club loses the final', () => {
      const clState = createCLState({
        knockoutBracket: {
          roundOf16: [],
          quarterFinals: [],
          semiFinals: [],
          final: {
            homeTeam: { id: 'club-psg', name: 'PSG', country: 'france', averageRating: 85, isFiller: false },
            awayTeam: { id: 'club-rm', name: 'Real Madrid', country: 'spain', averageRating: 87, isFiller: false },
            winner: 'club-rm',
          },
        },
      });
      const state = createMinimalGameState({ championsLeague: clState });

      const result = handleCLTrophy(state, 2);

      expect(result.career.trophies).toHaveLength(0);
      expect(result).toBe(state);
    });

    it('should not add trophy when final has not been played yet', () => {
      const clState = createCLState({
        knockoutBracket: {
          roundOf16: [],
          quarterFinals: [],
          semiFinals: [],
          final: {
            homeTeam: { id: 'club-psg', name: 'PSG', country: 'france', averageRating: 85, isFiller: false },
            awayTeam: { id: 'club-rm', name: 'Real Madrid', country: 'spain', averageRating: 87, isFiller: false },
            // No winner yet
          },
        },
      });
      const state = createMinimalGameState({ championsLeague: clState });

      const result = handleCLTrophy(state, 2);

      expect(result.career.trophies).toHaveLength(0);
    });

    it('should return state unchanged if championsLeague is null', () => {
      const state = createMinimalGameState({ championsLeague: null });

      const result = handleCLTrophy(state, 2);

      expect(result).toBe(state);
    });

    it('should preserve existing trophies when adding CL trophy', () => {
      const existingTrophy = {
        id: 'trophy-league-1',
        type: 'league' as const,
        season: 1,
        competition: 'Ligue 1',
      };
      const clState = createCLState({
        knockoutBracket: {
          roundOf16: [],
          quarterFinals: [],
          semiFinals: [],
          final: {
            homeTeam: { id: 'club-psg', name: 'PSG', country: 'france', averageRating: 85, isFiller: false },
            awayTeam: { id: 'club-rm', name: 'Real Madrid', country: 'spain', averageRating: 87, isFiller: false },
            winner: 'club-psg',
          },
        },
      });
      const state = createMinimalGameState({
        championsLeague: clState,
        career: {
          currentClub: {
            id: 'club-psg',
            name: 'Paris Saint-Germain',
            country: 'france',
            division: { country: 'france', level: 1, name: 'Ligue 1' },
            tier: 'big',
            squad: [],
            finances: { budget: 100000000, wageBill: 5000000 },
            stadium: 'Parc des Princes',
            colors: { primary: '#004170', secondary: '#DA291C' },
          },
          contract: {
            clubId: 'club-psg',
            weeklySalary: 50000,
            bonusPerGoal: 5000,
            bonusPerAssist: 3000,
            duration: 4,
            seasonsRemaining: 3,
            signingBonus: 100000,
          },
          season: 2,
          matchday: 20,
          trophies: [existingTrophy],
          transferHistory: [],
        },
      } as Partial<GameState>);

      const result = handleCLTrophy(state, 2);

      expect(result.career.trophies).toHaveLength(2);
      expect(result.career.trophies[0]).toEqual(existingTrophy);
      expect(result.career.trophies[1].type).toBe('champions_league');
    });
  });

  describe('handleCLSeasonEnd', () => {
    it('should reset championsLeague to null', () => {
      const clState = createCLState();
      const state = createMinimalGameState({ championsLeague: clState });

      const result = handleCLSeasonEnd(state);

      expect(result.championsLeague).toBeNull();
    });

    it('should preserve other state properties', () => {
      const clState = createCLState();
      const state = createMinimalGameState({ championsLeague: clState });

      const result = handleCLSeasonEnd(state);

      expect(result.career).toEqual(state.career);
      expect(result.player).toEqual(state.player);
      expect(result.time).toEqual(state.time);
    });

    it('should handle already null championsLeague state', () => {
      const state = createMinimalGameState({ championsLeague: null });

      const result = handleCLSeasonEnd(state);

      expect(result.championsLeague).toBeNull();
    });
  });

  describe('getEliminationMessage', () => {
    it('should return a message in French', () => {
      const message = getEliminationMessage();

      expect(message).toContain('éliminé');
      expect(message).toContain('Ligue des Champions');
    });

    it('should mention calendar removal', () => {
      const message = getEliminationMessage();

      expect(message).toContain('calendrier');
    });
  });
});
