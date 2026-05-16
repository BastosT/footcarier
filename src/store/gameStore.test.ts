import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import type { PlayerCharacter } from './slices/playerSlice';
import type { Club } from './slices/careerSlice';

const createMockPlayer = (): PlayerCharacter => ({
  id: 'player-1',
  firstName: 'Kylian',
  lastName: 'Mbappé',
  nationality: 'france',
  position: 'ST',
  appearance: { skinTone: 3, hairStyle: 1, hairColor: 0, height: 'medium' },
  age: 25,
  stats: { pace: 95, shooting: 88, passing: 78, dribbling: 90, defending: 36, physical: 78 },
  potential: 95,
  overallRating: 91,
  fitness: 100,
  morale: 80,
  injury: null,
});

const createMockClub = (): Club => ({
  id: 'club-1',
  name: 'Paris Saint-Germain',
  country: 'france',
  division: { country: 'france', level: 1, name: 'Ligue 1' },
  tier: 'big',
  squad: [],
  finances: { budget: 200000000, wageBill: 5000000 },
  stadium: 'Parc des Princes',
  colors: { primary: '#004170', secondary: '#DA291C' },
});

describe('GameStore', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState());
  });

  describe('PlayerSlice', () => {
    it('should set player', () => {
      const player = createMockPlayer();
      useGameStore.getState().setPlayer(player);
      expect(useGameStore.getState().player).toEqual(player);
    });

    it('should update stats partially', () => {
      useGameStore.getState().setPlayer(createMockPlayer());
      useGameStore.getState().updateStats({ shooting: 92 });
      expect(useGameStore.getState().player?.stats.shooting).toBe(92);
      expect(useGameStore.getState().player?.stats.pace).toBe(95);
    });

    it('should clamp fitness between 0 and 100', () => {
      useGameStore.getState().setPlayer(createMockPlayer());
      useGameStore.getState().updateFitness(150);
      expect(useGameStore.getState().player?.fitness).toBe(100);
      useGameStore.getState().updateFitness(-10);
      expect(useGameStore.getState().player?.fitness).toBe(0);
    });

    it('should clamp morale between 0 and 100', () => {
      useGameStore.getState().setPlayer(createMockPlayer());
      useGameStore.getState().updateMorale(120);
      expect(useGameStore.getState().player?.morale).toBe(100);
      useGameStore.getState().updateMorale(-5);
      expect(useGameStore.getState().player?.morale).toBe(0);
    });

    it('should set and clear injury', () => {
      useGameStore.getState().setPlayer(createMockPlayer());
      useGameStore.getState().setInjury({ type: 'muscle', weeksRemaining: 3, severity: 'moderate' });
      expect(useGameStore.getState().player?.injury).toEqual({ type: 'muscle', weeksRemaining: 3, severity: 'moderate' });
      useGameStore.getState().setInjury(null);
      expect(useGameStore.getState().player?.injury).toBeNull();
    });

    it('should clamp overall rating between 1 and 99', () => {
      useGameStore.getState().setPlayer(createMockPlayer());
      useGameStore.getState().updateOverallRating(100);
      expect(useGameStore.getState().player?.overallRating).toBe(99);
      useGameStore.getState().updateOverallRating(0);
      expect(useGameStore.getState().player?.overallRating).toBe(1);
    });
  });

  describe('CareerSlice', () => {
    it('should set current club', () => {
      const club = createMockClub();
      useGameStore.getState().setCurrentClub(club);
      expect(useGameStore.getState().career.currentClub).toEqual(club);
    });

    it('should set contract', () => {
      const contract = {
        clubId: 'club-1',
        weeklySalary: 500000,
        bonusPerGoal: 10000,
        bonusPerAssist: 5000,
        duration: 4,
        seasonsRemaining: 4,
        signingBonus: 5000000,
      };
      useGameStore.getState().setContract(contract);
      expect(useGameStore.getState().career.contract).toEqual(contract);
    });

    it('should advance matchday', () => {
      expect(useGameStore.getState().career.matchday).toBe(1);
      useGameStore.getState().advanceMatchday();
      expect(useGameStore.getState().career.matchday).toBe(2);
    });

    it('should advance season and reset matchday', () => {
      useGameStore.getState().advanceMatchday();
      useGameStore.getState().advanceMatchday();
      useGameStore.getState().advanceSeason();
      expect(useGameStore.getState().career.season).toBe(2);
      expect(useGameStore.getState().career.matchday).toBe(1);
    });

    it('should add trophy', () => {
      const trophy = { id: 't1', type: 'league' as const, season: 1, competition: 'Ligue 1' };
      useGameStore.getState().addTrophy(trophy);
      expect(useGameStore.getState().career.trophies).toHaveLength(1);
      expect(useGameStore.getState().career.trophies[0]).toEqual(trophy);
    });
  });

  describe('TimeSlice', () => {
    it('should advance day correctly', () => {
      useGameStore.getState().setCurrentDate({ day: 1, month: 8, year: 2024 });
      useGameStore.getState().advanceDay();
      expect(useGameStore.getState().time.currentDate).toEqual({ day: 2, month: 8, year: 2024 });
    });

    it('should handle month overflow', () => {
      useGameStore.getState().setCurrentDate({ day: 31, month: 8, year: 2024 });
      useGameStore.getState().advanceDay();
      expect(useGameStore.getState().time.currentDate).toEqual({ day: 1, month: 9, year: 2024 });
    });

    it('should handle year overflow', () => {
      useGameStore.getState().setCurrentDate({ day: 31, month: 12, year: 2024 });
      useGameStore.getState().advanceDay();
      expect(useGameStore.getState().time.currentDate).toEqual({ day: 1, month: 1, year: 2025 });
    });

    it('should reset weekly events on Monday', () => {
      // Set weekday to 6 (Sunday), so next day is Monday (0)
      useGameStore.setState((state) => ({
        time: { ...state.time, weekday: 6, eventsThisWeek: 3 },
      }));
      useGameStore.getState().advanceDay();
      expect(useGameStore.getState().time.eventsThisWeek).toBe(0);
      expect(useGameStore.getState().time.weekday).toBe(0);
    });

    it('should increment events this week', () => {
      useGameStore.getState().incrementEventsThisWeek();
      expect(useGameStore.getState().time.eventsThisWeek).toBe(1);
      useGameStore.getState().incrementEventsThisWeek();
      expect(useGameStore.getState().time.eventsThisWeek).toBe(2);
    });
  });

  describe('SocialSlice', () => {
    it('should update popularity with clamping', () => {
      useGameStore.getState().updatePopularity(60);
      expect(useGameStore.getState().social.popularity).toBe(100);
      useGameStore.getState().updatePopularity(-150);
      expect(useGameStore.getState().social.popularity).toBe(0);
    });

    it('should update coach relation with clamping', () => {
      useGameStore.getState().updateCoachRelation(-60);
      expect(useGameStore.getState().social.coachRelation).toBe(0);
      useGameStore.getState().updateCoachRelation(200);
      expect(useGameStore.getState().social.coachRelation).toBe(100);
    });

    it('should add social posts (newest first)', () => {
      const post1 = {
        id: 'p1', author: 'Fan1', authorType: 'fan' as const,
        content: 'Great goal!', timestamp: { day: 1, month: 8, year: 2024 },
        likes: 100, sentiment: 'positive' as const,
      };
      const post2 = {
        id: 'p2', author: 'Journalist', authorType: 'journalist' as const,
        content: 'Amazing performance', timestamp: { day: 2, month: 8, year: 2024 },
        likes: 500, sentiment: 'positive' as const,
      };
      useGameStore.getState().addSocialPost(post1);
      useGameStore.getState().addSocialPost(post2);
      expect(useGameStore.getState().social.socialFeed).toHaveLength(2);
      expect(useGameStore.getState().social.socialFeed[0].id).toBe('p2');
    });

    it('should add and remove interviews', () => {
      const interview = {
        id: 'i1', context: 'post-match',
        questions: [{
          text: 'How do you feel?',
          answers: [
            { text: 'Humble', tone: 'humble' as const, impacts: { popularity: 2, reputation: 3, coachRelation: 2, teamRelation: 1 } },
            { text: 'Confident', tone: 'confident' as const, impacts: { popularity: 5, reputation: 1, coachRelation: 0, teamRelation: -1 } },
            { text: 'Controversial', tone: 'controversial' as const, impacts: { popularity: -3, reputation: -2, coachRelation: -5, teamRelation: -3 } },
          ] as [typeof interview.questions[0]['answers'][0], typeof interview.questions[0]['answers'][0], typeof interview.questions[0]['answers'][0]],
        }],
      };
      useGameStore.getState().addInterview(interview);
      expect(useGameStore.getState().social.pendingInterviews).toHaveLength(1);
      useGameStore.getState().removeInterview('i1');
      expect(useGameStore.getState().social.pendingInterviews).toHaveLength(0);
    });
  });

  describe('FinanceSlice', () => {
    it('should add transaction and update balance', () => {
      useGameStore.getState().addTransaction({
        date: { day: 1, month: 8, year: 2024 },
        type: 'signing_bonus',
        amount: 5000000,
        description: 'Prime de signature',
      });
      expect(useGameStore.getState().finance.balance).toBe(5000000);
      expect(useGameStore.getState().finance.history).toHaveLength(1);
    });

    it('should credit salary correctly', () => {
      useGameStore.getState().setWeeklyIncome(100000);
      useGameStore.getState().creditSalary({ day: 7, month: 8, year: 2024 });
      expect(useGameStore.getState().finance.balance).toBe(100000);
      expect(useGameStore.getState().finance.history).toHaveLength(1);
      expect(useGameStore.getState().finance.history[0].type).toBe('salary');
    });
  });

  describe('LeagueSlice', () => {
    it('should set leagues', () => {
      const leagues = [{
        division: { country: 'france' as const, level: 1, name: 'Ligue 1' },
        standings: [],
        results: [],
        season: 1,
        topScorers: [],
        schedule: [],
      }];
      useGameStore.getState().setLeagues(leagues);
      expect(useGameStore.getState().leagues).toHaveLength(1);
    });

    it('should update standings for a specific league', () => {
      useGameStore.getState().setLeagues([{
        division: { country: 'france' as const, level: 1, name: 'Ligue 1' },
        standings: [],
        results: [],
        season: 1,
        topScorers: [],
        schedule: [],
      }]);
      const standings = [{
        clubId: 'club-1', clubName: 'PSG', played: 1, won: 1, drawn: 0, lost: 0,
        goalsFor: 3, goalsAgainst: 0, points: 3, position: 1,
      }];
      useGameStore.getState().updateStandings('france', 1, standings);
      expect(useGameStore.getState().leagues[0].standings).toHaveLength(1);
      expect(useGameStore.getState().leagues[0].standings[0].clubName).toBe('PSG');
    });

    it('should add match result to correct league', () => {
      useGameStore.getState().setLeagues([{
        division: { country: 'france' as const, level: 1, name: 'Ligue 1' },
        standings: [],
        results: [],
        season: 1,
        topScorers: [],
        schedule: [],
      }]);
      const result = {
        matchday: 1, homeTeamId: 'club-1', awayTeamId: 'club-2',
        homeGoals: 2, awayGoals: 1,
      };
      useGameStore.getState().addMatchResult('france', 1, result);
      expect(useGameStore.getState().leagues[0].results).toHaveLength(1);
    });

    it('should update top scorers for a specific league', () => {
      useGameStore.getState().setLeagues([{
        division: { country: 'france' as const, level: 1, name: 'Ligue 1' },
        standings: [],
        results: [],
        season: 1,
        topScorers: [],
        schedule: [],
      }]);
      const topScorers = [{
        playerId: 'p-1', playerName: 'Mbappé', clubId: 'club-1', clubName: 'PSG',
        goals: 15, assists: 7, matchesPlayed: 20,
      }];
      useGameStore.getState().updateTopScorers('france', 1, topScorers);
      expect(useGameStore.getState().leagues[0].topScorers).toHaveLength(1);
      expect(useGameStore.getState().leagues[0].topScorers[0].playerName).toBe('Mbappé');
    });

    it('should set schedule for a specific league', () => {
      useGameStore.getState().setLeagues([{
        division: { country: 'france' as const, level: 1, name: 'Ligue 1' },
        standings: [],
        results: [],
        season: 1,
        topScorers: [],
        schedule: [],
      }]);
      const schedule = [{
        date: { day: 10, month: 8, year: 2024 },
        homeTeam: 'club-1',
        awayTeam: 'club-2',
        competition: 'Ligue 1',
        matchday: 1,
      }];
      useGameStore.getState().setSchedule('france', 1, schedule);
      expect(useGameStore.getState().leagues[0].schedule).toHaveLength(1);
      expect(useGameStore.getState().leagues[0].schedule[0].matchday).toBe(1);
    });

    it('should support 5 leagues simultaneously', () => {
      const leagues = [
        { division: { country: 'france' as const, level: 1, name: 'Ligue 1' }, standings: [], results: [], season: 1, topScorers: [], schedule: [] },
        { division: { country: 'england' as const, level: 1, name: 'Premier League' }, standings: [], results: [], season: 1, topScorers: [], schedule: [] },
        { division: { country: 'spain' as const, level: 1, name: 'La Liga' }, standings: [], results: [], season: 1, topScorers: [], schedule: [] },
        { division: { country: 'italy' as const, level: 1, name: 'Serie A' }, standings: [], results: [], season: 1, topScorers: [], schedule: [] },
        { division: { country: 'germany' as const, level: 1, name: 'Bundesliga' }, standings: [], results: [], season: 1, topScorers: [], schedule: [] },
      ];
      useGameStore.getState().setLeagues(leagues);
      expect(useGameStore.getState().leagues).toHaveLength(5);

      // Update standings for one league, others remain unchanged
      const standings = [{
        clubId: 'club-1', clubName: 'Real Madrid', played: 1, won: 1, drawn: 0, lost: 0,
        goalsFor: 2, goalsAgainst: 0, points: 3, position: 1,
      }];
      useGameStore.getState().updateStandings('spain', 1, standings);
      expect(useGameStore.getState().leagues[2].standings).toHaveLength(1);
      expect(useGameStore.getState().leagues[0].standings).toHaveLength(0);
    });

    it('should cap leagues at MAX_LEAGUES (5)', () => {
      const leagues = Array.from({ length: 7 }, (_, i) => ({
        division: { country: 'france' as const, level: i + 1, name: `Division ${i + 1}` },
        standings: [],
        results: [],
        season: 1,
        topScorers: [],
        schedule: [],
      }));
      useGameStore.getState().setLeagues(leagues);
      expect(useGameStore.getState().leagues).toHaveLength(5);
    });
  });
});
