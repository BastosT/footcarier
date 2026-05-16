/**
 * ScheduleGenerator — Génère un calendrier complet de 34 journées (aller-retour)
 * pour 18 équipes en utilisant l'algorithme du cercle (round-robin).
 *
 * Algorithme :
 * 1. Fixer l'équipe à l'index 0, faire tourner les 17 autres
 * 2. Pour chaque rotation, générer 9 matchs par journée
 * 3. Journées 18-34 = inverse domicile/extérieur des journées 1-17
 * 4. Assigner les dates : 1 journée par semaine (samedi), début août
 */

import type { GameDate, ScheduledMatch } from '../../core/types';

export interface IScheduleGenerator {
  generateRoundRobin(clubIds: string[], season: number): ScheduledMatch[];
  assignDates(matches: ScheduledMatch[], startDate: GameDate): ScheduledMatch[];
}

/**
 * Generates a full round-robin schedule for exactly 18 teams.
 * Uses the circle algorithm: fix team at index 0, rotate the remaining 17.
 * Produces 34 matchdays (17 first leg + 17 return leg).
 */
export function generateRoundRobin(clubIds: string[], season: number): ScheduledMatch[] {
  if (clubIds.length !== 18) {
    throw new Error(`Expected exactly 18 clubs, got ${clubIds.length}`);
  }

  const numTeams = clubIds.length;
  const numRounds = numTeams - 1; // 17 rounds for first leg
  const matchesPerRound = numTeams / 2; // 9 matches per matchday

  // Circle algorithm: place all teams in an array, fix position 0, rotate positions 1..n-1
  // For each round, pair: position[0] vs position[n-1], position[1] vs position[n-2], etc.
  const teams = [...clubIds];

  const firstLegMatches: ScheduledMatch[] = [];

  for (let round = 0; round < numRounds; round++) {
    const matchday = round + 1;
    const roundMatches: ScheduledMatch[] = [];

    for (let i = 0; i < matchesPerRound; i++) {
      const home = teams[i];
      const away = teams[numTeams - 1 - i];

      roundMatches.push({
        date: { day: 1, month: 8, year: season }, // placeholder date
        homeTeam: home,
        awayTeam: away,
        competition: 'league',
        matchday,
      });
    }

    firstLegMatches.push(...roundMatches);

    // Rotate: fix teams[0], rotate teams[1..n-1] clockwise
    // i.e., last element goes to position 1, everything else shifts right
    const last = teams[numTeams - 1];
    for (let i = numTeams - 1; i > 1; i--) {
      teams[i] = teams[i - 1];
    }
    teams[1] = last;
  }

  // Generate return leg (matchdays 18-34): reverse home/away of matchdays 1-17
  const returnLegMatches: ScheduledMatch[] = firstLegMatches.map((match) => ({
    ...match,
    homeTeam: match.awayTeam,
    awayTeam: match.homeTeam,
    matchday: match.matchday + numRounds,
  }));

  const allMatches = [...firstLegMatches, ...returnLegMatches];

  // Post-process: enforce alternating home/away for each team
  return enforceAlternatingHomeAway(allMatches, clubIds);
}

/**
 * Assigns dates to scheduled matches: 1 matchday per week (Saturday).
 * Starting from the given startDate, each subsequent matchday is 7 days later.
 */
export function assignDates(matches: ScheduledMatch[], startDate: GameDate): ScheduledMatch[] {
  // Group matches by matchday to assign the same date to all matches in a matchday
  const matchdayDates = new Map<number, GameDate>();

  // Find all unique matchdays and sort them
  const matchdays = [...new Set(matches.map((m) => m.matchday))].sort((a, b) => a - b);

  // Assign dates: each matchday is 7 days after the previous one
  let currentDate = { ...startDate };
  for (const matchday of matchdays) {
    matchdayDates.set(matchday, { ...currentDate });
    currentDate = addDays(currentDate, 7);
  }

  // Apply dates to all matches
  return matches.map((match) => ({
    ...match,
    date: matchdayDates.get(match.matchday)!,
  }));
}

/**
 * Adds a number of days to a GameDate, handling month/year overflow.
 */
function addDays(date: GameDate, days: number): GameDate {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let { day, month, year } = date;
  day += days;

  while (day > daysInMonth[month - 1]) {
    day -= daysInMonth[month - 1];
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return { day, month, year };
}

/**
 * Enforces alternating home/away pattern for each team.
 * For each team, ensures matches alternate: DOM, EXT, DOM, EXT...
 * Swaps home/away in a match if needed (both teams in the match get swapped).
 */
function enforceAlternatingHomeAway(matches: ScheduledMatch[], clubIds: string[]): ScheduledMatch[] {
  // Group matches by matchday
  const matchesByDay = new Map<number, ScheduledMatch[]>();
  for (const match of matches) {
    if (!matchesByDay.has(match.matchday)) {
      matchesByDay.set(match.matchday, []);
    }
    matchesByDay.get(match.matchday)!.push(match);
  }

  const sortedMatchdays = [...matchesByDay.keys()].sort((a, b) => a - b);

  // Track last home/away status for each team
  // true = last was home, false = last was away, undefined = no match yet
  const lastWasHome = new Map<string, boolean>();

  // Process matchday by matchday
  const result: ScheduledMatch[] = [];

  for (const matchday of sortedMatchdays) {
    const dayMatches = matchesByDay.get(matchday)!;

    for (const match of dayMatches) {
      const homeLastWasHome = lastWasHome.get(match.homeTeam);
      const awayLastWasHome = lastWasHome.get(match.awayTeam);

      // Decide if we should swap: if the home team was home last time, swap
      let shouldSwap = false;
      if (homeLastWasHome === true && awayLastWasHome !== true) {
        shouldSwap = true;
      } else if (awayLastWasHome === false && homeLastWasHome !== false) {
        shouldSwap = true;
      }

      if (shouldSwap) {
        result.push({
          ...match,
          homeTeam: match.awayTeam,
          awayTeam: match.homeTeam,
        });
        lastWasHome.set(match.awayTeam, true);
        lastWasHome.set(match.homeTeam, false);
      } else {
        result.push(match);
        lastWasHome.set(match.homeTeam, true);
        lastWasHome.set(match.awayTeam, false);
      }
    }
  }

  return result;
}

export const ScheduleGenerator: IScheduleGenerator = {
  generateRoundRobin,
  assignDates,
};
