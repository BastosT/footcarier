/**
 * LeagueEngine — Orchestrates league operations: schedule generation,
 * matchday simulation, standings calculation, and top scorers updates.
 *
 * Delegates to:
 * - ScheduleGenerator for calendar generation
 * - AIMatchSimulator for simulating non-player matches
 * - StandingsCalculator for standings computation and sorting
 * - TopScorers module for top scorers accumulation
 *
 * Requirements: 1.4, 1.5, 2.4, 3.3, 14.2
 */

import type { Club, LeagueState, LeagueStanding, MatchResult, ScheduledMatch } from '../../core/types';
import type { TopScorer, MatchGoalEvent } from './TopScorers';
import { ScheduleGenerator } from './ScheduleGenerator';
import { StandingsCalculator } from './StandingsCalculator';
import { TopScorersModule, accumulateGoals } from './TopScorers';
import { AIMatchSimulator } from '../match/AIMatchSimulator';
import { type RNG, defaultRNG } from '../../utils/random';

export interface MatchdayResult {
  matchday: number;
  results: MatchResult[];
  updatedStandings: LeagueStanding[];
  updatedTopScorers: TopScorer[];
}

export interface ILeagueEngine {
  generateSeasonSchedule(clubs: Club[]): ScheduledMatch[];
  simulateMatchday(matchday: number, leagues: LeagueState[]): MatchdayResult;
  calculateStandings(results: MatchResult[], clubs: Club[]): LeagueStanding[];
  sortStandings(standings: LeagueStanding[]): LeagueStanding[];
  updateTopScorers(matchday: number, results: MatchResult[]): TopScorer[];
}

/**
 * Generates a full season schedule (34 matchdays) for the given clubs.
 * Delegates to ScheduleGenerator.generateRoundRobin.
 *
 * @param clubs - Array of exactly 18 clubs for the league
 * @returns Array of scheduled matches for the entire season
 */
export function generateSeasonSchedule(clubs: Club[]): ScheduledMatch[] {
  if (clubs.length !== 18) {
    throw new Error(`Expected exactly 18 clubs, got ${clubs.length}`);
  }

  const clubIds = clubs.map((c) => c.id);
  // Use 2024 as the season year (matches the game's initial time state)
  const season = 2024;

  const matches = ScheduleGenerator.generateRoundRobin(clubIds, season);

  // Assign dates starting from August 22nd of the season
  const startDate = { day: 22, month: 8, year: season };
  return ScheduleGenerator.assignDates(matches, startDate);
}

/**
 * Simulates all matches for a given matchday across all provided leagues.
 * Uses AIMatchSimulator for each match. Generates goal events for top scorers.
 * Then recalculates standings and updates top scorers.
 *
 * @param matchday - The matchday number to simulate (1-34)
 * @param leagues - Array of league states containing schedules and clubs info
 * @param rng - Optional RNG for deterministic testing
 * @returns MatchdayResult with all results, updated standings, and top scorers
 */
export function simulateMatchday(
  matchday: number,
  leagues: LeagueState[],
  clubsLookup?: Map<string, Club>,
  rng: RNG = defaultRNG
): MatchdayResult {
  const allResults: MatchResult[] = [];
  let allStandings: LeagueStanding[] = [];
  let allTopScorers: TopScorer[] = [];

  for (const league of leagues) {
    // Get scheduled matches for this matchday in this league
    const matchdayMatches = league.schedule.filter((m) => m.matchday === matchday);

    const leagueResults: MatchResult[] = [];

    for (const scheduledMatch of matchdayMatches) {
      // Look up clubs from the lookup map or create minimal club objects
      const homeClub = clubsLookup?.get(scheduledMatch.homeTeam);
      const awayClub = clubsLookup?.get(scheduledMatch.awayTeam);

      if (homeClub && awayClub) {
        // Simulate using AIMatchSimulator with full club data
        const result = AIMatchSimulator.simulateAIMatch(homeClub, awayClub, matchday, rng);
        leagueResults.push(result);
      } else {
        // Fallback: generate a simple result if clubs not found
        const homeGoals = rng.randomInt(0, 4);
        const awayGoals = rng.randomInt(0, 4);
        leagueResults.push({
          matchday,
          homeTeamId: scheduledMatch.homeTeam,
          awayTeamId: scheduledMatch.awayTeam,
          homeGoals,
          awayGoals,
        });
      }
    }

    allResults.push(...leagueResults);

    // Recalculate standings for this league with all results (existing + new)
    const allLeagueResults = [...league.results, ...leagueResults];
    const clubs = getClubsForLeague(league, clubsLookup);
    const updatedStandings = StandingsCalculator.calculateFromResults(allLeagueResults, clubs);
    allStandings.push(...updatedStandings);

    // Update top scorers with goal events from this matchday
    const goalEvents = generateGoalEvents(leagueResults, clubsLookup, rng);
    const updatedTopScorers = accumulateGoals(league.topScorers, goalEvents);
    allTopScorers.push(...updatedTopScorers);
  }

  return {
    matchday,
    results: allResults,
    updatedStandings: allStandings,
    updatedTopScorers: allTopScorers,
  };
}

/**
 * Calculates standings from match results and clubs.
 * Delegates to StandingsCalculator.calculateFromResults.
 */
export function calculateStandings(results: MatchResult[], clubs: Club[]): LeagueStanding[] {
  return StandingsCalculator.calculateFromResults(results, clubs);
}

/**
 * Sorts standings according to league rules.
 * Delegates to StandingsCalculator.sortStandings.
 */
export function sortStandings(standings: LeagueStanding[]): LeagueStanding[] {
  return StandingsCalculator.sortStandings(standings);
}

/**
 * Updates top scorers with goals from a matchday's results.
 * Generates synthetic goal events from match results and accumulates them.
 *
 * @param matchday - The matchday number
 * @param results - Match results from the matchday
 * @param existingScorers - Current top scorers list to accumulate into
 * @param clubsLookup - Optional club lookup for player names
 * @param rng - Optional RNG for deterministic goal attribution
 * @returns Updated and sorted top scorers list
 */
export function updateTopScorers(
  matchday: number,
  results: MatchResult[],
  existingScorers: TopScorer[] = [],
  clubsLookup?: Map<string, Club>,
  rng: RNG = defaultRNG
): TopScorer[] {
  const goalEvents = generateGoalEvents(results, clubsLookup, rng);
  return accumulateGoals(existingScorers, goalEvents);
}

/**
 * Generates goal events from match results by attributing goals to random players
 * from the scoring team's squad.
 */
function generateGoalEvents(
  results: MatchResult[],
  clubsLookup?: Map<string, Club>,
  rng: RNG = defaultRNG
): MatchGoalEvent[] {
  const events: MatchGoalEvent[] = [];

  for (const result of results) {
    // Attribute home goals to random home players
    if (result.homeGoals > 0) {
      const homeClub = clubsLookup?.get(result.homeTeamId);
      if (homeClub && homeClub.squad.length > 0) {
        const goalDistribution = distributeGoals(result.homeGoals, homeClub, rng);
        for (const [playerId, goals] of goalDistribution) {
          const player = homeClub.squad.find((p) => p.id === playerId)
            ?? generateFakeAttackers(homeClub, rng).find((p) => p.id === playerId);
          if (player) {
            events.push({
              playerId: player.id,
              playerName: player.name,
              clubId: homeClub.id,
              clubName: homeClub.name,
              goals,
              assists: 0,
            });
          }
        }
      } else if (homeClub) {
        // Club exists but no squad — use fake attackers
        const goalDistribution = distributeGoals(result.homeGoals, homeClub, rng);
        const fakeAttackers = generateFakeAttackers(homeClub, rng);
        for (const [playerId, goals] of goalDistribution) {
          const player = fakeAttackers.find((p) => p.id === playerId);
          events.push({
            playerId,
            playerName: player?.name ?? 'Joueur',
            clubId: homeClub.id,
            clubName: homeClub.name,
            goals,
            assists: 0,
          });
        }
      } else {
        // No club data available, create a generic event
        events.push({
          playerId: `${result.homeTeamId}-scorer`,
          playerName: 'Unknown',
          clubId: result.homeTeamId,
          clubName: result.homeTeamId,
          goals: result.homeGoals,
          assists: 0,
        });
      }
    }

    // Attribute away goals to random away players
    if (result.awayGoals > 0) {
      const awayClub = clubsLookup?.get(result.awayTeamId);
      if (awayClub && awayClub.squad.length > 0) {
        const goalDistribution = distributeGoals(result.awayGoals, awayClub, rng);
        for (const [playerId, goals] of goalDistribution) {
          const player = awayClub.squad.find((p) => p.id === playerId)
            ?? generateFakeAttackers(awayClub, rng).find((p) => p.id === playerId);
          if (player) {
            events.push({
              playerId: player.id,
              playerName: player.name,
              clubId: awayClub.id,
              clubName: awayClub.name,
              goals,
              assists: 0,
            });
          }
        }
      } else if (awayClub) {
        const goalDistribution = distributeGoals(result.awayGoals, awayClub, rng);
        const fakeAttackers = generateFakeAttackers(awayClub, rng);
        for (const [playerId, goals] of goalDistribution) {
          const player = fakeAttackers.find((p) => p.id === playerId);
          events.push({
            playerId,
            playerName: player?.name ?? 'Joueur',
            clubId: awayClub.id,
            clubName: awayClub.name,
            goals,
            assists: 0,
          });
        }
      } else {
        events.push({
          playerId: `${result.awayTeamId}-scorer`,
          playerName: 'Unknown',
          clubId: result.awayTeamId,
          clubName: result.awayTeamId,
          goals: result.awayGoals,
          assists: 0,
        });
      }
    }
  }

  return events;
}

/**
 * Distributes goals among players in a club's squad.
 * Favors attackers with higher ratings. If squad is empty, generates realistic fake players.
 * A player can't score more goals than the team total.
 */
function distributeGoals(totalGoals: number, club: Club, rng: RNG): Map<string, number> {
  const distribution = new Map<string, number>();

  // Get or generate scoring candidates
  let candidates = club.squad.filter(
    (p) => ['ST', 'RW', 'LW', 'CAM', 'CM'].includes(p.position) && p.position !== 'GK'
  );

  // If no squad, generate realistic fake attackers for this club
  if (candidates.length === 0) {
    candidates = generateFakeAttackers(club, rng);
  }

  if (candidates.length === 0) return distribution;

  // Weight by position: ST gets 3x, wingers 2x, midfielders 1x
  const weighted: { id: string; weight: number }[] = candidates.map((p) => ({
    id: p.id,
    weight: p.position === 'ST' ? 3 : ['RW', 'LW'].includes(p.position) ? 2 : 1,
  }));

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);

  for (let i = 0; i < totalGoals; i++) {
    // Weighted random selection
    let roll = rng.random() * totalWeight;
    let scorer = weighted[0];
    for (const w of weighted) {
      roll -= w.weight;
      if (roll <= 0) { scorer = w; break; }
    }
    const current = distribution.get(scorer.id) || 0;
    distribution.set(scorer.id, current + 1);
  }

  return distribution;
}

/** Fake attacker names by country for realistic top scorers */
const FAKE_ATTACKERS: Record<string, string[]> = {
  france: ['Mbappé', 'Lacazette', 'Terrier', 'Barcola', 'Ekitike', 'Kolo Muani', 'Gouiri', 'David', 'Laborde', 'Diaby'],
  england: ['Haaland', 'Salah', 'Watkins', 'Isak', 'Palmer', 'Saka', 'Son', 'Solanke', 'Jackson', 'Nkunku'],
  spain: ['Lewandowski', 'Bellingham', 'Griezmann', 'Morata', 'Williams', 'Dovbyk', 'Ayoze', 'Budimir', 'Joselu', 'Aspas'],
  italy: ['Lautaro', 'Vlahovic', 'Osimhen', 'Lookman', 'Thuram', 'Retegui', 'Kean', 'Castellanos', 'Dybala', 'Lukaku'],
  germany: ['Kane', 'Xavi Simons', 'Wirtz', 'Openda', 'Guirassy', 'Füllkrug', 'Sané', 'Musiala', 'Adeyemi', 'Beier'],
};

function generateFakeAttackers(club: Club, rng: RNG): { id: string; name: string; position: string; overallRating: number; age: number; potential: number; isPlayerCharacter: boolean }[] {
  const country = club.country ?? 'france';
  const names = FAKE_ATTACKERS[country] ?? FAKE_ATTACKERS['france'];

  // Generate 3-4 fake attackers for this club
  const numAttackers = 3 + Math.floor(rng.random() * 2);
  const result: { id: string; name: string; position: string; overallRating: number; age: number; potential: number; isPlayerCharacter: boolean }[] = [];

  // Use club name as seed for consistent player names
  const clubSeed = club.id.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);

  for (let i = 0; i < numAttackers; i++) {
    const nameIdx = (clubSeed + i) % names.length;
    const positions = ['ST', 'RW', 'LW', 'CAM'];
    result.push({
      id: `${club.id}-att-${i}`,
      name: names[nameIdx],
      position: positions[i % positions.length],
      overallRating: club.tier === 'big' ? 80 + Math.floor(rng.random() * 8) : club.tier === 'medium' ? 72 + Math.floor(rng.random() * 6) : 65 + Math.floor(rng.random() * 5),
      age: 22 + Math.floor(rng.random() * 8),
      potential: 85,
      isPlayerCharacter: false,
    });
  }

  return result;
}

/**
 * Extracts club objects for a league from the lookup map.
 * Falls back to creating minimal Club objects from standings data if lookup is unavailable.
 */
function getClubsForLeague(league: LeagueState, clubsLookup?: Map<string, Club>): Club[] {
  // Collect all unique club IDs from the schedule
  const clubIds = new Set<string>();
  for (const match of league.schedule) {
    clubIds.add(match.homeTeam);
    clubIds.add(match.awayTeam);
  }

  const clubs: Club[] = [];
  for (const id of clubIds) {
    const club = clubsLookup?.get(id);
    if (club) {
      clubs.push(club);
    } else {
      // Create a minimal club object for standings calculation
      const standingEntry = league.standings.find((s) => s.clubId === id);
      clubs.push({
        id,
        name: standingEntry?.clubName || id,
        country: league.division.country,
        division: league.division,
        tier: 'medium',
        squad: [],
        finances: { budget: 0, wageBill: 0 },
        stadium: '',
        colors: { primary: '#000', secondary: '#fff' },
      });
    }
  }

  return clubs;
}

export const LeagueEngine: ILeagueEngine = {
  generateSeasonSchedule,
  simulateMatchday: (matchday, leagues) => simulateMatchday(matchday, leagues),
  calculateStandings,
  sortStandings,
  updateTopScorers: (matchday, results) => updateTopScorers(matchday, results),
};
