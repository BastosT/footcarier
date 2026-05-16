import { describe, it, expect } from 'vitest';
import {
  generateSeasonSchedule,
  simulateMatchday,
  calculateStandings,
  sortStandings,
  updateTopScorers,
} from './LeagueEngine';
import type { Club, LeagueState, MatchResult } from '../../core/types';
import { createRNG } from '../../utils/random';

/**
 * Helper: creates a minimal club with a squad for testing.
 */
function createTestClub(id: string, name: string, avgRating: number = 70): Club {
  const squad = Array.from({ length: 18 }, (_, i) => ({
    id: `${id}-player-${i}`,
    name: `Player ${i}`,
    position: i === 0 ? 'GK' : i < 5 ? 'CB' : i < 9 ? 'CM' : 'ST' as any,
    age: 25,
    overallRating: avgRating + (i % 5) - 2,
    potential: 85,
    isPlayerCharacter: false,
  }));

  return {
    id,
    name,
    country: 'france',
    division: { country: 'france', level: 1, name: 'Ligue 1' },
    tier: 'medium',
    squad,
    finances: { budget: 50_000_000, wageBill: 1_000_000 },
    stadium: `${name} Stadium`,
    colors: { primary: '#000', secondary: '#fff' },
  };
}

/**
 * Helper: creates 18 test clubs.
 */
function create18Clubs(): Club[] {
  return Array.from({ length: 18 }, (_, i) =>
    createTestClub(`club-${i}`, `Club ${i}`, 60 + i * 2)
  );
}

describe('LeagueEngine', () => {
  describe('generateSeasonSchedule', () => {
    it('should generate a schedule with 34 matchdays × 9 matches = 306 matches', () => {
      const clubs = create18Clubs();
      const schedule = generateSeasonSchedule(clubs);

      expect(schedule).toHaveLength(306);
    });

    it('should throw if not exactly 18 clubs', () => {
      const clubs = create18Clubs().slice(0, 10);
      expect(() => generateSeasonSchedule(clubs)).toThrow('Expected exactly 18 clubs');
    });

    it('should assign dates starting from August', () => {
      const clubs = create18Clubs();
      const schedule = generateSeasonSchedule(clubs);

      const firstMatch = schedule[0];
      expect(firstMatch.date.month).toBe(8);
      expect(firstMatch.date.day).toBe(22);
    });

    it('should use club IDs as homeTeam and awayTeam', () => {
      const clubs = create18Clubs();
      const schedule = generateSeasonSchedule(clubs);
      const clubIds = new Set(clubs.map((c) => c.id));

      for (const match of schedule) {
        expect(clubIds.has(match.homeTeam)).toBe(true);
        expect(clubIds.has(match.awayTeam)).toBe(true);
      }
    });
  });

  describe('simulateMatchday', () => {
    it('should produce results for all scheduled matches in the matchday', () => {
      const clubs = create18Clubs();
      const schedule = generateSeasonSchedule(clubs);
      const matchday1Matches = schedule.filter((m) => m.matchday === 1);

      const clubsLookup = new Map(clubs.map((c) => [c.id, c]));
      const league: LeagueState = {
        division: { country: 'france', level: 1, name: 'Ligue 1' },
        standings: [],
        results: [],
        season: 2024,
        topScorers: [],
        schedule,
      };

      const rng = createRNG(42);
      const result = simulateMatchday(1, [league], clubsLookup, rng);

      expect(result.matchday).toBe(1);
      expect(result.results).toHaveLength(matchday1Matches.length);
    });

    it('should produce non-negative scores', () => {
      const clubs = create18Clubs();
      const schedule = generateSeasonSchedule(clubs);
      const clubsLookup = new Map(clubs.map((c) => [c.id, c]));

      const league: LeagueState = {
        division: { country: 'france', level: 1, name: 'Ligue 1' },
        standings: [],
        results: [],
        season: 2024,
        topScorers: [],
        schedule,
      };

      const rng = createRNG(123);
      const result = simulateMatchday(1, [league], clubsLookup, rng);

      for (const matchResult of result.results) {
        expect(matchResult.homeGoals).toBeGreaterThanOrEqual(0);
        expect(matchResult.awayGoals).toBeGreaterThanOrEqual(0);
      }
    });

    it('should update standings after simulation', () => {
      const clubs = create18Clubs();
      const schedule = generateSeasonSchedule(clubs);
      const clubsLookup = new Map(clubs.map((c) => [c.id, c]));

      const league: LeagueState = {
        division: { country: 'france', level: 1, name: 'Ligue 1' },
        standings: [],
        results: [],
        season: 2024,
        topScorers: [],
        schedule,
      };

      const rng = createRNG(99);
      const result = simulateMatchday(1, [league], clubsLookup, rng);

      expect(result.updatedStandings.length).toBe(18);
      // All teams should have played exactly 1 match
      for (const standing of result.updatedStandings) {
        expect(standing.played).toBe(1);
      }
    });

    it('should return empty results for a matchday with no scheduled matches', () => {
      const league: LeagueState = {
        division: { country: 'france', level: 1, name: 'Ligue 1' },
        standings: [],
        results: [],
        season: 2024,
        topScorers: [],
        schedule: [], // empty schedule
      };

      const rng = createRNG(1);
      const result = simulateMatchday(1, [league], undefined, rng);

      expect(result.results).toHaveLength(0);
    });
  });

  describe('calculateStandings', () => {
    it('should calculate correct points from results', () => {
      const clubs = create18Clubs().slice(0, 2);
      const results: MatchResult[] = [
        { matchday: 1, homeTeamId: clubs[0].id, awayTeamId: clubs[1].id, homeGoals: 2, awayGoals: 1 },
      ];

      const standings = calculateStandings(results, clubs);

      const winner = standings.find((s) => s.clubId === clubs[0].id)!;
      const loser = standings.find((s) => s.clubId === clubs[1].id)!;

      expect(winner.points).toBe(3);
      expect(winner.won).toBe(1);
      expect(winner.goalsFor).toBe(2);
      expect(winner.goalsAgainst).toBe(1);

      expect(loser.points).toBe(0);
      expect(loser.lost).toBe(1);
      expect(loser.goalsFor).toBe(1);
      expect(loser.goalsAgainst).toBe(2);
    });

    it('should handle draws correctly', () => {
      const clubs = create18Clubs().slice(0, 2);
      const results: MatchResult[] = [
        { matchday: 1, homeTeamId: clubs[0].id, awayTeamId: clubs[1].id, homeGoals: 1, awayGoals: 1 },
      ];

      const standings = calculateStandings(results, clubs);

      for (const standing of standings) {
        expect(standing.points).toBe(1);
        expect(standing.drawn).toBe(1);
      }
    });
  });

  describe('sortStandings', () => {
    it('should sort by points descending', () => {
      const standings = [
        { clubId: 'a', clubName: 'A', played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 1, points: 0, position: 0 },
        { clubId: 'b', clubName: 'B', played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 1, goalsAgainst: 0, points: 3, position: 0 },
      ];

      const sorted = sortStandings(standings);

      expect(sorted[0].clubId).toBe('b');
      expect(sorted[1].clubId).toBe('a');
      expect(sorted[0].position).toBe(1);
      expect(sorted[1].position).toBe(2);
    });

    it('should use goal difference as tiebreaker', () => {
      const standings = [
        { clubId: 'a', clubName: 'A', played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 2, goalsAgainst: 2, points: 3, position: 0 },
        { clubId: 'b', clubName: 'B', played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 5, goalsAgainst: 1, points: 3, position: 0 },
      ];

      const sorted = sortStandings(standings);

      expect(sorted[0].clubId).toBe('b'); // GD +4 vs GD 0
    });
  });

  describe('updateTopScorers', () => {
    it('should accumulate goals from match results', () => {
      const clubs = create18Clubs().slice(0, 2);
      const clubsLookup = new Map(clubs.map((c) => [c.id, c]));

      const results: MatchResult[] = [
        { matchday: 1, homeTeamId: clubs[0].id, awayTeamId: clubs[1].id, homeGoals: 3, awayGoals: 1 },
      ];

      const rng = createRNG(42);
      const topScorers = updateTopScorers(1, results, [], clubsLookup, rng);

      // Should have at least one scorer
      expect(topScorers.length).toBeGreaterThan(0);

      // Total goals in top scorers should equal total goals in results
      const totalGoals = topScorers.reduce((sum, s) => sum + s.goals, 0);
      expect(totalGoals).toBe(4); // 3 + 1
    });

    it('should return empty array when no goals scored', () => {
      const results: MatchResult[] = [
        { matchday: 1, homeTeamId: 'a', awayTeamId: 'b', homeGoals: 0, awayGoals: 0 },
      ];

      const topScorers = updateTopScorers(1, results, []);
      expect(topScorers).toHaveLength(0);
    });

    it('should accumulate across multiple matchdays', () => {
      const clubs = create18Clubs().slice(0, 2);
      const clubsLookup = new Map(clubs.map((c) => [c.id, c]));
      const rng = createRNG(42);

      const results1: MatchResult[] = [
        { matchday: 1, homeTeamId: clubs[0].id, awayTeamId: clubs[1].id, homeGoals: 2, awayGoals: 0 },
      ];
      const scorers1 = updateTopScorers(1, results1, [], clubsLookup, rng);

      const results2: MatchResult[] = [
        { matchday: 2, homeTeamId: clubs[1].id, awayTeamId: clubs[0].id, homeGoals: 1, awayGoals: 3 },
      ];
      const scorers2 = updateTopScorers(2, results2, scorers1, clubsLookup, rng);

      // Total goals should be 2 + 0 + 1 + 3 = 6
      const totalGoals = scorers2.reduce((sum, s) => sum + s.goals, 0);
      expect(totalGoals).toBe(6);
    });
  });
});
