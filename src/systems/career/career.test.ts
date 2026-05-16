import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { updateStandings, sortStandings, getPromotionsAndRelegations, createInitialStandings } from './PromotionEngine';
import type { LeagueStanding, MatchResult } from '../../core/types';

describe('PromotionEngine - Property Tests', () => {
  it('Property 9: Standings correctly reflect points, goal difference, and goals scored', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        (homeGoals, awayGoals) => {
          const standings = createInitialStandings([
            { id: 'team-a', name: 'Team A' },
            { id: 'team-b', name: 'Team B' },
          ]);

          const result: MatchResult = {
            matchday: 1,
            homeTeamId: 'team-a',
            awayTeamId: 'team-b',
            homeGoals,
            awayGoals,
          };

          const updated = updateStandings(standings, result);
          const teamA = updated.find(s => s.clubId === 'team-a')!;
          const teamB = updated.find(s => s.clubId === 'team-b')!;

          // Matches played
          expect(teamA.played).toBe(1);
          expect(teamB.played).toBe(1);

          // Goals
          expect(teamA.goalsFor).toBe(homeGoals);
          expect(teamA.goalsAgainst).toBe(awayGoals);
          expect(teamB.goalsFor).toBe(awayGoals);
          expect(teamB.goalsAgainst).toBe(homeGoals);

          // Points
          if (homeGoals > awayGoals) {
            expect(teamA.points).toBe(3);
            expect(teamB.points).toBe(0);
            expect(teamA.won).toBe(1);
            expect(teamB.lost).toBe(1);
          } else if (homeGoals < awayGoals) {
            expect(teamA.points).toBe(0);
            expect(teamB.points).toBe(3);
            expect(teamA.lost).toBe(1);
            expect(teamB.won).toBe(1);
          } else {
            expect(teamA.points).toBe(1);
            expect(teamB.points).toBe(1);
            expect(teamA.drawn).toBe(1);
            expect(teamB.drawn).toBe(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10: Promotions and relegations are correctly determined', () => {
    // Create a standings table with clear positions
    const standings: LeagueStanding[] = [
      { clubId: 'c1', clubName: 'Club 1', played: 38, won: 30, drawn: 5, lost: 3, goalsFor: 90, goalsAgainst: 20, points: 95, position: 1 },
      { clubId: 'c2', clubName: 'Club 2', played: 38, won: 28, drawn: 6, lost: 4, goalsFor: 80, goalsAgainst: 25, points: 90, position: 2 },
      { clubId: 'c3', clubName: 'Club 3', played: 38, won: 25, drawn: 8, lost: 5, goalsFor: 70, goalsAgainst: 30, points: 83, position: 3 },
      { clubId: 'c4', clubName: 'Club 4', played: 38, won: 15, drawn: 10, lost: 13, goalsFor: 50, goalsAgainst: 50, points: 55, position: 4 },
      { clubId: 'c5', clubName: 'Club 5', played: 38, won: 10, drawn: 8, lost: 20, goalsFor: 35, goalsAgainst: 60, points: 38, position: 5 },
      { clubId: 'c6', clubName: 'Club 6', played: 38, won: 8, drawn: 7, lost: 23, goalsFor: 30, goalsAgainst: 70, points: 31, position: 6 },
      { clubId: 'c7', clubName: 'Club 7', played: 38, won: 6, drawn: 8, lost: 24, goalsFor: 25, goalsAgainst: 75, points: 26, position: 7 },
      { clubId: 'c8', clubName: 'Club 8', played: 38, won: 5, drawn: 5, lost: 28, goalsFor: 20, goalsAgainst: 80, points: 20, position: 8 },
    ];

    const { promoted, relegated } = getPromotionsAndRelegations(standings, 'france');

    // Top 3 promoted
    expect(promoted).toContain('c1');
    expect(promoted).toContain('c2');
    expect(promoted).toContain('c3');
    expect(promoted).toHaveLength(3);

    // Bottom 3 relegated
    expect(relegated).toContain('c6');
    expect(relegated).toContain('c7');
    expect(relegated).toContain('c8');
    expect(relegated).toHaveLength(3);
  });

  it('Standings are sorted by points, then goal difference, then goals scored', () => {
    const standings: LeagueStanding[] = [
      { clubId: 'a', clubName: 'A', played: 10, won: 5, drawn: 2, lost: 3, goalsFor: 20, goalsAgainst: 15, points: 17, position: 1 },
      { clubId: 'b', clubName: 'B', played: 10, won: 5, drawn: 2, lost: 3, goalsFor: 18, goalsAgainst: 13, points: 17, position: 2 },
      { clubId: 'c', clubName: 'C', played: 10, won: 5, drawn: 2, lost: 3, goalsFor: 15, goalsAgainst: 10, points: 17, position: 3 },
    ];

    const sorted = sortStandings(standings);

    // Same points, same GD (+5 each), sorted by goals scored
    expect(sorted[0].clubId).toBe('a'); // 20 goals
    expect(sorted[1].clubId).toBe('b'); // 18 goals
    expect(sorted[2].clubId).toBe('c'); // 15 goals
  });
});
