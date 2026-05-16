import { describe, it, expect } from 'vitest';
import {
  accumulateGoals,
  sortTopScorers,
  getPlayerPosition,
  type TopScorer,
  type MatchGoalEvent,
} from './TopScorers';

describe('TopScorers', () => {
  describe('accumulateGoals', () => {
    it('should add new scorers from events', () => {
      const events: MatchGoalEvent[] = [
        { playerId: 'p1', playerName: 'Mbappé', clubId: 'c1', clubName: 'PSG', goals: 2, assists: 0 },
        { playerId: 'p2', playerName: 'Haaland', clubId: 'c2', clubName: 'City', goals: 1, assists: 1 },
      ];

      const result = accumulateGoals([], events);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        playerId: 'p1',
        playerName: 'Mbappé',
        clubId: 'c1',
        clubName: 'PSG',
        goals: 2,
        assists: 0,
        matchesPlayed: 1,
      });
      expect(result[1]).toEqual({
        playerId: 'p2',
        playerName: 'Haaland',
        clubId: 'c2',
        clubName: 'City',
        goals: 1,
        assists: 1,
        matchesPlayed: 1,
      });
    });

    it('should accumulate goals for existing players', () => {
      const existing: TopScorer[] = [
        { playerId: 'p1', playerName: 'Mbappé', clubId: 'c1', clubName: 'PSG', goals: 5, assists: 2, matchesPlayed: 3 },
      ];
      const events: MatchGoalEvent[] = [
        { playerId: 'p1', playerName: 'Mbappé', clubId: 'c1', clubName: 'PSG', goals: 2, assists: 1 },
      ];

      const result = accumulateGoals(existing, events);

      expect(result).toHaveLength(1);
      expect(result[0].goals).toBe(7);
      expect(result[0].assists).toBe(3);
      expect(result[0].matchesPlayed).toBe(4);
    });

    it('should not add players with 0 goals and 0 assists who are not already in the list', () => {
      const events: MatchGoalEvent[] = [
        { playerId: 'p1', playerName: 'Defender', clubId: 'c1', clubName: 'PSG', goals: 0, assists: 0 },
      ];

      const result = accumulateGoals([], events);

      expect(result).toHaveLength(0);
    });

    it('should increment matchesPlayed for existing players even with 0 goals/assists', () => {
      const existing: TopScorer[] = [
        { playerId: 'p1', playerName: 'Mbappé', clubId: 'c1', clubName: 'PSG', goals: 5, assists: 2, matchesPlayed: 3 },
      ];
      const events: MatchGoalEvent[] = [
        { playerId: 'p1', playerName: 'Mbappé', clubId: 'c1', clubName: 'PSG', goals: 0, assists: 0 },
      ];

      const result = accumulateGoals(existing, events);

      expect(result[0].matchesPlayed).toBe(4);
      expect(result[0].goals).toBe(5); // unchanged
    });

    it('should return results sorted by goals descending', () => {
      const events: MatchGoalEvent[] = [
        { playerId: 'p1', playerName: 'A', clubId: 'c1', clubName: 'Club A', goals: 1, assists: 0 },
        { playerId: 'p2', playerName: 'B', clubId: 'c2', clubName: 'Club B', goals: 3, assists: 0 },
        { playerId: 'p3', playerName: 'C', clubId: 'c3', clubName: 'Club C', goals: 2, assists: 0 },
      ];

      const result = accumulateGoals([], events);

      expect(result[0].playerId).toBe('p2'); // 3 goals
      expect(result[1].playerId).toBe('p3'); // 2 goals
      expect(result[2].playerId).toBe('p1'); // 1 goal
    });

    it('should handle multiple matchdays of accumulation', () => {
      // Matchday 1
      const afterMd1 = accumulateGoals([], [
        { playerId: 'p1', playerName: 'A', clubId: 'c1', clubName: 'Club A', goals: 2, assists: 0 },
        { playerId: 'p2', playerName: 'B', clubId: 'c2', clubName: 'Club B', goals: 1, assists: 0 },
      ]);

      // Matchday 2
      const afterMd2 = accumulateGoals(afterMd1, [
        { playerId: 'p2', playerName: 'B', clubId: 'c2', clubName: 'Club B', goals: 3, assists: 0 },
        { playerId: 'p3', playerName: 'C', clubId: 'c3', clubName: 'Club C', goals: 1, assists: 0 },
      ]);

      expect(afterMd2).toHaveLength(3);
      // p2 has 4 goals total (1+3), p1 has 2, p3 has 1
      expect(afterMd2[0].playerId).toBe('p2');
      expect(afterMd2[0].goals).toBe(4);
      expect(afterMd2[0].matchesPlayed).toBe(2);
      expect(afterMd2[1].playerId).toBe('p1');
      expect(afterMd2[1].goals).toBe(2);
      expect(afterMd2[2].playerId).toBe('p3');
      expect(afterMd2[2].goals).toBe(1);
    });
  });

  describe('sortTopScorers', () => {
    it('should sort by goals descending', () => {
      const scorers: TopScorer[] = [
        { playerId: 'p1', playerName: 'A', clubId: 'c1', clubName: 'C1', goals: 5, assists: 0, matchesPlayed: 10 },
        { playerId: 'p2', playerName: 'B', clubId: 'c2', clubName: 'C2', goals: 10, assists: 0, matchesPlayed: 10 },
        { playerId: 'p3', playerName: 'C', clubId: 'c3', clubName: 'C3', goals: 7, assists: 0, matchesPlayed: 10 },
      ];

      const sorted = sortTopScorers(scorers);

      expect(sorted[0].goals).toBe(10);
      expect(sorted[1].goals).toBe(7);
      expect(sorted[2].goals).toBe(5);
    });

    it('should use assists as tiebreaker when goals are equal', () => {
      const scorers: TopScorer[] = [
        { playerId: 'p1', playerName: 'A', clubId: 'c1', clubName: 'C1', goals: 5, assists: 2, matchesPlayed: 10 },
        { playerId: 'p2', playerName: 'B', clubId: 'c2', clubName: 'C2', goals: 5, assists: 5, matchesPlayed: 10 },
      ];

      const sorted = sortTopScorers(scorers);

      expect(sorted[0].playerId).toBe('p2'); // more assists
      expect(sorted[1].playerId).toBe('p1');
    });

    it('should use player name alphabetically when goals and assists are equal', () => {
      const scorers: TopScorer[] = [
        { playerId: 'p1', playerName: 'Zidane', clubId: 'c1', clubName: 'C1', goals: 5, assists: 3, matchesPlayed: 10 },
        { playerId: 'p2', playerName: 'Ancelotti', clubId: 'c2', clubName: 'C2', goals: 5, assists: 3, matchesPlayed: 10 },
      ];

      const sorted = sortTopScorers(scorers);

      expect(sorted[0].playerName).toBe('Ancelotti');
      expect(sorted[1].playerName).toBe('Zidane');
    });

    it('should not mutate the original array', () => {
      const scorers: TopScorer[] = [
        { playerId: 'p1', playerName: 'A', clubId: 'c1', clubName: 'C1', goals: 1, assists: 0, matchesPlayed: 1 },
        { playerId: 'p2', playerName: 'B', clubId: 'c2', clubName: 'C2', goals: 5, assists: 0, matchesPlayed: 1 },
      ];

      const sorted = sortTopScorers(scorers);

      expect(scorers[0].playerId).toBe('p1'); // original unchanged
      expect(sorted[0].playerId).toBe('p2');
    });
  });

  describe('getPlayerPosition', () => {
    it('should return 1-indexed position of a player', () => {
      const scorers: TopScorer[] = [
        { playerId: 'p1', playerName: 'A', clubId: 'c1', clubName: 'C1', goals: 10, assists: 0, matchesPlayed: 10 },
        { playerId: 'p2', playerName: 'B', clubId: 'c2', clubName: 'C2', goals: 5, assists: 0, matchesPlayed: 10 },
        { playerId: 'p3', playerName: 'C', clubId: 'c3', clubName: 'C3', goals: 3, assists: 0, matchesPlayed: 10 },
      ];

      expect(getPlayerPosition(scorers, 'p1')).toBe(1);
      expect(getPlayerPosition(scorers, 'p2')).toBe(2);
      expect(getPlayerPosition(scorers, 'p3')).toBe(3);
    });

    it('should return -1 for a player not in the list', () => {
      const scorers: TopScorer[] = [
        { playerId: 'p1', playerName: 'A', clubId: 'c1', clubName: 'C1', goals: 10, assists: 0, matchesPlayed: 10 },
      ];

      expect(getPlayerPosition(scorers, 'unknown')).toBe(-1);
    });

    it('should return correct position even if input is unsorted', () => {
      const scorers: TopScorer[] = [
        { playerId: 'p1', playerName: 'A', clubId: 'c1', clubName: 'C1', goals: 3, assists: 0, matchesPlayed: 10 },
        { playerId: 'p2', playerName: 'B', clubId: 'c2', clubName: 'C2', goals: 10, assists: 0, matchesPlayed: 10 },
      ];

      // p2 has more goals, so should be position 1 regardless of input order
      expect(getPlayerPosition(scorers, 'p2')).toBe(1);
      expect(getPlayerPosition(scorers, 'p1')).toBe(2);
    });
  });
});
