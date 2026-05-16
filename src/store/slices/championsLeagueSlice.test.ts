import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';
import type {
  ChampionsLeagueState,
  CLStanding,
  CLMatchResult,
  CLKnockoutTie,
  CLKnockoutTieResult,
  CLParticipant,
} from '../../systems/championsLeague/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeParticipant(overrides: Partial<CLParticipant> = {}): CLParticipant {
  return {
    id: 'team-1',
    name: 'FC Test',
    country: 'france',
    averageRating: 75,
    isFiller: false,
    ...overrides,
  };
}

function makeStanding(overrides: Partial<CLStanding> = {}): CLStanding {
  return {
    participantId: 'team-1',
    participantName: 'FC Test',
    country: 'france',
    played: 4,
    won: 3,
    drawn: 1,
    lost: 0,
    goalsFor: 8,
    goalsAgainst: 2,
    points: 10,
    position: 1,
    ...overrides,
  };
}

function makeMatchResult(overrides: Partial<CLMatchResult> = {}): CLMatchResult {
  return {
    matchday: 1,
    homeTeamId: 'team-1',
    awayTeamId: 'team-2',
    homeGoals: 2,
    awayGoals: 1,
    phase: 'league',
    ...overrides,
  };
}

function makeCLState(overrides: Partial<ChampionsLeagueState> = {}): ChampionsLeagueState {
  return {
    season: 1,
    participants: [makeParticipant()],
    phase: 'league',
    currentMatchday: 1,
    leagueSchedule: [],
    leagueResults: [],
    standings: [],
    knockoutRound: null,
    knockoutBracket: {
      roundOf16: [],
      quarterFinals: [],
      semiFinals: [],
      final: null,
    },
    playerParticipating: true,
    playerEliminated: false,
    playerClubId: 'team-1',
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ChampionsLeagueSlice', () => {
  beforeEach(() => {
    useGameStore.setState({ championsLeague: null });
  });

  // ─── Initial state ───────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should be null when player does not participate (Requirement 7.1)', () => {
      const state = useGameStore.getState();
      expect(state.championsLeague).toBeNull();
    });
  });

  // ─── initChampionsLeague ─────────────────────────────────────────────────

  describe('initChampionsLeague', () => {
    it('should set the champions league state', () => {
      const clState = makeCLState();
      useGameStore.getState().initChampionsLeague(clState);

      expect(useGameStore.getState().championsLeague).toEqual(clState);
    });

    it('should overwrite previous state', () => {
      const first = makeCLState({ season: 1 });
      const second = makeCLState({ season: 2 });

      useGameStore.getState().initChampionsLeague(first);
      useGameStore.getState().initChampionsLeague(second);

      expect(useGameStore.getState().championsLeague?.season).toBe(2);
    });
  });

  // ─── updateCLStandings ───────────────────────────────────────────────────

  describe('updateCLStandings', () => {
    it('should update standings when CL is active', () => {
      useGameStore.getState().initChampionsLeague(makeCLState());

      const standings = [
        makeStanding({ participantId: 'team-1', position: 1, points: 10 }),
        makeStanding({ participantId: 'team-2', position: 2, points: 7 }),
      ];

      useGameStore.getState().updateCLStandings(standings);

      expect(useGameStore.getState().championsLeague?.standings).toEqual(standings);
    });

    it('should not crash when championsLeague is null', () => {
      expect(() => {
        useGameStore.getState().updateCLStandings([makeStanding()]);
      }).not.toThrow();

      expect(useGameStore.getState().championsLeague).toBeNull();
    });
  });

  // ─── addCLMatchResult ────────────────────────────────────────────────────

  describe('addCLMatchResult', () => {
    it('should add a match result to leagueResults', () => {
      useGameStore.getState().initChampionsLeague(makeCLState());

      const result = makeMatchResult({ matchday: 1 });
      useGameStore.getState().addCLMatchResult(1, result);

      const cl = useGameStore.getState().championsLeague!;
      expect(cl.leagueResults).toHaveLength(1);
      expect(cl.leagueResults[0]).toEqual(result);
    });

    it('should advance currentMatchday when matchday is higher', () => {
      useGameStore.getState().initChampionsLeague(makeCLState({ currentMatchday: 2 }));

      const result = makeMatchResult({ matchday: 4 });
      useGameStore.getState().addCLMatchResult(4, result);

      expect(useGameStore.getState().championsLeague?.currentMatchday).toBe(4);
    });

    it('should not decrease currentMatchday when matchday is lower', () => {
      useGameStore.getState().initChampionsLeague(makeCLState({ currentMatchday: 5 }));

      const result = makeMatchResult({ matchday: 3 });
      useGameStore.getState().addCLMatchResult(3, result);

      expect(useGameStore.getState().championsLeague?.currentMatchday).toBe(5);
    });

    it('should accumulate multiple results', () => {
      useGameStore.getState().initChampionsLeague(makeCLState());

      useGameStore.getState().addCLMatchResult(1, makeMatchResult({ matchday: 1 }));
      useGameStore.getState().addCLMatchResult(2, makeMatchResult({ matchday: 2 }));

      expect(useGameStore.getState().championsLeague?.leagueResults).toHaveLength(2);
    });

    it('should not crash when championsLeague is null', () => {
      expect(() => {
        useGameStore.getState().addCLMatchResult(1, makeMatchResult());
      }).not.toThrow();

      expect(useGameStore.getState().championsLeague).toBeNull();
    });
  });

  // ─── advanceToKnockout ───────────────────────────────────────────────────

  describe('advanceToKnockout', () => {
    const homeTeam = makeParticipant({ id: 'home-1', name: 'Home FC' });
    const awayTeam = makeParticipant({ id: 'away-1', name: 'Away FC' });
    const tie: CLKnockoutTie = { homeTeam, awayTeam };

    it('should set phase to knockout and update knockoutRound', () => {
      useGameStore.getState().initChampionsLeague(makeCLState());

      useGameStore.getState().advanceToKnockout('round-of-16', [tie]);

      const cl = useGameStore.getState().championsLeague!;
      expect(cl.phase).toBe('knockout');
      expect(cl.knockoutRound).toBe('round-of-16');
      expect(cl.knockoutBracket.roundOf16).toEqual([tie]);
    });

    it('should set quarter-finals ties', () => {
      useGameStore.getState().initChampionsLeague(makeCLState());

      useGameStore.getState().advanceToKnockout('quarter-final', [tie]);

      const cl = useGameStore.getState().championsLeague!;
      expect(cl.knockoutRound).toBe('quarter-final');
      expect(cl.knockoutBracket.quarterFinals).toEqual([tie]);
    });

    it('should set semi-finals ties', () => {
      useGameStore.getState().initChampionsLeague(makeCLState());

      useGameStore.getState().advanceToKnockout('semi-final', [tie]);

      const cl = useGameStore.getState().championsLeague!;
      expect(cl.knockoutRound).toBe('semi-final');
      expect(cl.knockoutBracket.semiFinals).toEqual([tie]);
    });

    it('should set final tie', () => {
      useGameStore.getState().initChampionsLeague(makeCLState());

      useGameStore.getState().advanceToKnockout('final', [tie]);

      const cl = useGameStore.getState().championsLeague!;
      expect(cl.knockoutRound).toBe('final');
      expect(cl.knockoutBracket.final).toEqual(tie);
    });

    it('should not crash when championsLeague is null', () => {
      expect(() => {
        useGameStore.getState().advanceToKnockout('round-of-16', [tie]);
      }).not.toThrow();

      expect(useGameStore.getState().championsLeague).toBeNull();
    });
  });

  // ─── updateKnockoutResult ────────────────────────────────────────────────

  describe('updateKnockoutResult', () => {
    const homeTeam = makeParticipant({ id: 'home-1', name: 'Home FC' });
    const awayTeam = makeParticipant({ id: 'away-1', name: 'Away FC' });
    const tie: CLKnockoutTie = { homeTeam, awayTeam };
    const result: CLKnockoutTieResult = {
      winnerId: 'home-1',
      aggregateHome: 3,
      aggregateAway: 2,
      decidedBy: 'aggregate',
    };

    it('should update the winner of a knockout tie', () => {
      useGameStore.getState().initChampionsLeague(makeCLState());
      useGameStore.getState().advanceToKnockout('round-of-16', [tie]);

      useGameStore.getState().updateKnockoutResult('round-of-16', 0, result);

      const cl = useGameStore.getState().championsLeague!;
      expect(cl.knockoutBracket.roundOf16[0].winner).toBe('home-1');
    });

    it('should update the final winner', () => {
      useGameStore.getState().initChampionsLeague(makeCLState());
      useGameStore.getState().advanceToKnockout('final', [tie]);

      useGameStore.getState().updateKnockoutResult('final', 0, result);

      const cl = useGameStore.getState().championsLeague!;
      expect(cl.knockoutBracket.final?.winner).toBe('home-1');
    });

    it('should not crash when championsLeague is null', () => {
      expect(() => {
        useGameStore.getState().updateKnockoutResult('round-of-16', 0, result);
      }).not.toThrow();

      expect(useGameStore.getState().championsLeague).toBeNull();
    });
  });

  // ─── setCLEliminated ─────────────────────────────────────────────────────

  describe('setCLEliminated (Requirement 9.3)', () => {
    it('should set playerEliminated to true', () => {
      useGameStore.getState().initChampionsLeague(makeCLState({ playerEliminated: false }));

      useGameStore.getState().setCLEliminated();

      expect(useGameStore.getState().championsLeague?.playerEliminated).toBe(true);
    });

    it('should not crash when championsLeague is null', () => {
      expect(() => {
        useGameStore.getState().setCLEliminated();
      }).not.toThrow();

      expect(useGameStore.getState().championsLeague).toBeNull();
    });
  });

  // ─── resetChampionsLeague ────────────────────────────────────────────────

  describe('resetChampionsLeague (Requirement 9.2)', () => {
    it('should reset championsLeague state to null', () => {
      useGameStore.getState().initChampionsLeague(makeCLState());
      expect(useGameStore.getState().championsLeague).not.toBeNull();

      useGameStore.getState().resetChampionsLeague();

      expect(useGameStore.getState().championsLeague).toBeNull();
    });

    it('should be safe to call when already null', () => {
      expect(() => {
        useGameStore.getState().resetChampionsLeague();
      }).not.toThrow();

      expect(useGameStore.getState().championsLeague).toBeNull();
    });
  });
});
