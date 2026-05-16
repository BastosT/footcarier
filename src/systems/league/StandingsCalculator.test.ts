import { describe, it, expect } from 'vitest';
import { calculateFromResults, sortStandings, getPosition } from './StandingsCalculator';
import type { Club, LeagueStanding, MatchResult } from '../../core/types';

// Helper to create a minimal club
function makeClub(id: string, name: string): Club {
  return {
    id,
    name,
    country: 'france',
    division: { country: 'france', level: 1, name: 'Ligue 1' },
    tier: 'medium',
    squad: [],
    finances: { budget: 1000000, wageBill: 50000 },
    stadium: 'Stadium',
    colors: { primary: '#000', secondary: '#fff' },
  };
}

describe('StandingsCalculator', () => {
  describe('calculateFromResults', () => {
    it('should return empty standings for clubs with no results', () => {
      const clubs = [makeClub('a', 'Club A'), makeClub('b', 'Club B')];
      const standings = calculateFromResults([], clubs);

      expect(standings).toHaveLength(2);
      for (const s of standings) {
        expect(s.played).toBe(0);
        expect(s.won).toBe(0);
        expect(s.drawn).toBe(0);
        expect(s.lost).toBe(0);
        expect(s.goalsFor).toBe(0);
        expect(s.goalsAgainst).toBe(0);
        expect(s.points).toBe(0);
      }
    });

    it('should award 3 points for a win', () => {
      const clubs = [makeClub('a', 'Club A'), makeClub('b', 'Club B')];
      const results: MatchResult[] = [
        { matchday: 1, homeTeamId: 'a', awayTeamId: 'b', homeGoals: 2, awayGoals: 0 },
      ];

      const standings = calculateFromResults(results, clubs);
      const clubA = standings.find((s) => s.clubId === 'a')!;
      const clubB = standings.find((s) => s.clubId === 'b')!;

      expect(clubA.points).toBe(3);
      expect(clubA.won).toBe(1);
      expect(clubA.goalsFor).toBe(2);
      expect(clubA.goalsAgainst).toBe(0);

      expect(clubB.points).toBe(0);
      expect(clubB.lost).toBe(1);
      expect(clubB.goalsFor).toBe(0);
      expect(clubB.goalsAgainst).toBe(2);
    });

    it('should award 1 point each for a draw', () => {
      const clubs = [makeClub('a', 'Club A'), makeClub('b', 'Club B')];
      const results: MatchResult[] = [
        { matchday: 1, homeTeamId: 'a', awayTeamId: 'b', homeGoals: 1, awayGoals: 1 },
      ];

      const standings = calculateFromResults(results, clubs);
      const clubA = standings.find((s) => s.clubId === 'a')!;
      const clubB = standings.find((s) => s.clubId === 'b')!;

      expect(clubA.points).toBe(1);
      expect(clubA.drawn).toBe(1);
      expect(clubB.points).toBe(1);
      expect(clubB.drawn).toBe(1);
    });

    it('should correctly accumulate multiple results', () => {
      const clubs = [makeClub('a', 'Club A'), makeClub('b', 'Club B'), makeClub('c', 'Club C')];
      const results: MatchResult[] = [
        { matchday: 1, homeTeamId: 'a', awayTeamId: 'b', homeGoals: 3, awayGoals: 1 },
        { matchday: 1, homeTeamId: 'c', awayTeamId: 'a', homeGoals: 0, awayGoals: 2 },
        { matchday: 2, homeTeamId: 'b', awayTeamId: 'c', homeGoals: 1, awayGoals: 1 },
      ];

      const standings = calculateFromResults(results, clubs);
      const clubA = standings.find((s) => s.clubId === 'a')!;
      const clubB = standings.find((s) => s.clubId === 'b')!;
      const clubC = standings.find((s) => s.clubId === 'c')!;

      // Club A: 2 wins = 6 pts, GF=5, GA=1
      expect(clubA.points).toBe(6);
      expect(clubA.played).toBe(2);
      expect(clubA.won).toBe(2);
      expect(clubA.goalsFor).toBe(5);
      expect(clubA.goalsAgainst).toBe(1);

      // Club B: 1 loss + 1 draw = 1 pt, GF=2, GA=4
      expect(clubB.points).toBe(1);
      expect(clubB.played).toBe(2);
      expect(clubB.lost).toBe(1);
      expect(clubB.drawn).toBe(1);
      expect(clubB.goalsFor).toBe(2);
      expect(clubB.goalsAgainst).toBe(4);

      // Club C: 1 loss + 1 draw = 1 pt, GF=1, GA=3
      expect(clubC.points).toBe(1);
      expect(clubC.played).toBe(2);
      expect(clubC.lost).toBe(1);
      expect(clubC.drawn).toBe(1);
      expect(clubC.goalsFor).toBe(1);
      expect(clubC.goalsAgainst).toBe(3);
    });

    it('should ignore results for teams not in the clubs list', () => {
      const clubs = [makeClub('a', 'Club A')];
      const results: MatchResult[] = [
        { matchday: 1, homeTeamId: 'a', awayTeamId: 'unknown', homeGoals: 2, awayGoals: 0 },
      ];

      const standings = calculateFromResults(results, clubs);
      const clubA = standings.find((s) => s.clubId === 'a')!;

      // Club A still gets its stats updated
      expect(clubA.played).toBe(1);
      expect(clubA.won).toBe(1);
      expect(clubA.points).toBe(3);
    });
  });

  describe('sortStandings', () => {
    it('should sort by points descending', () => {
      const standings: LeagueStanding[] = [
        { clubId: 'a', clubName: 'Club A', played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 2, goalsAgainst: 2, points: 3, position: 0 },
        { clubId: 'b', clubName: 'Club B', played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 4, goalsAgainst: 1, points: 6, position: 0 },
      ];

      const sorted = sortStandings(standings);
      expect(sorted[0].clubId).toBe('b');
      expect(sorted[1].clubId).toBe('a');
    });

    it('should use goal difference as tiebreaker', () => {
      const standings: LeagueStanding[] = [
        { clubId: 'a', clubName: 'Club A', played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 2, goalsAgainst: 1, points: 4, position: 0 },
        { clubId: 'b', clubName: 'Club B', played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 5, goalsAgainst: 1, points: 4, position: 0 },
      ];

      const sorted = sortStandings(standings);
      // Club B has GD +4, Club A has GD +1
      expect(sorted[0].clubId).toBe('b');
      expect(sorted[1].clubId).toBe('a');
    });

    it('should use goals for as second tiebreaker', () => {
      const standings: LeagueStanding[] = [
        { clubId: 'a', clubName: 'Club A', played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 3, goalsAgainst: 1, points: 4, position: 0 },
        { clubId: 'b', clubName: 'Club B', played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 5, goalsAgainst: 3, points: 4, position: 0 },
      ];

      const sorted = sortStandings(standings);
      // Same GD (+2), but Club B has more goals for
      expect(sorted[0].clubId).toBe('b');
      expect(sorted[1].clubId).toBe('a');
    });

    it('should use club name alphabetical as final tiebreaker', () => {
      const standings: LeagueStanding[] = [
        { clubId: 'b', clubName: 'Zaragoza', played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 3, goalsAgainst: 1, points: 4, position: 0 },
        { clubId: 'a', clubName: 'Arsenal', played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 3, goalsAgainst: 1, points: 4, position: 0 },
      ];

      const sorted = sortStandings(standings);
      // Same points, GD, GF → alphabetical: Arsenal before Zaragoza
      expect(sorted[0].clubName).toBe('Arsenal');
      expect(sorted[1].clubName).toBe('Zaragoza');
    });

    it('should assign correct positions (1-based)', () => {
      const standings: LeagueStanding[] = [
        { clubId: 'a', clubName: 'Club A', played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 2, points: 0, position: 0 },
        { clubId: 'b', clubName: 'Club B', played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, points: 3, position: 0 },
        { clubId: 'c', clubName: 'Club C', played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 1, goalsAgainst: 1, points: 1, position: 0 },
      ];

      const sorted = sortStandings(standings);
      expect(sorted[0].position).toBe(1);
      expect(sorted[1].position).toBe(2);
      expect(sorted[2].position).toBe(3);
    });
  });

  describe('getPosition', () => {
    it('should return the correct position for a club', () => {
      const standings: LeagueStanding[] = [
        { clubId: 'a', clubName: 'Club A', played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, points: 3, position: 0 },
        { clubId: 'b', clubName: 'Club B', played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 2, points: 0, position: 0 },
      ];

      expect(getPosition('a', standings)).toBe(1);
      expect(getPosition('b', standings)).toBe(2);
    });

    it('should return -1 for a club not in standings', () => {
      const standings: LeagueStanding[] = [
        { clubId: 'a', clubName: 'Club A', played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, points: 3, position: 0 },
      ];

      expect(getPosition('unknown', standings)).toBe(-1);
    });
  });
});
