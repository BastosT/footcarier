/**
 * GameLoopOrchestrator — Central module that coordinates the game loop.
 *
 * Responsibilities:
 * - advanceDay(): advance time, apply fitness recovery, check match day,
 *   credit salary on Monday, reset training on Monday, evaluate injury risk,
 *   generate transfer offers during transfer windows
 * - simulateWeek(): advance 7 days sequentially, collect results
 * - playMatch(config, playerInputs): run interactive match, update standings, update morale, generate social feed
 * - simulateMatch(config): run quick simulation, generate player performance, update standings, generate social feed
 * - executeTraining(skill): check availability, execute training, mark as done
 *
 * Wires existing systems: TimeSystem, FinanceSystem, SocialSystem, SocialFeedGenerator,
 * TransferSystem, InjurySystem, LeagueEngine, FitnessManager, TrainingManager, MatchSimulator.
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6
 */

import type {
  GameDate,
  GameState,
  MatchConfig,
  MatchResult,
  MatchPerformance,
  PlayerInput,
  TrainingSkill,
  TrainingResult,
  DayResult,
  LeagueState,
  Club,
} from './types';
import { TimeSystem } from '../systems/time/TimeSystem';
import { FinanceSystem } from '../systems/finance/FinanceSystem';
import { SocialSystem, type MatchOutcome } from '../systems/social/SocialSystem';
import { SocialFeedGenerator } from '../systems/social/SocialFeedGenerator';
import { TransferSystem } from '../systems/transfer/TransferSystem';
import { InjurySystem } from '../systems/injury/InjurySystem';
import { simulateMatchday } from '../systems/league/LeagueEngine';
import { StandingsCalculator } from '../systems/league/StandingsCalculator';
import { accumulateGoals, type MatchGoalEvent } from '../systems/league/TopScorers';
import { FitnessManager } from '../systems/match/FitnessManager';
import { TrainingManager } from '../systems/training/TrainingManager';
import { MatchSimulator } from '../systems/match/MatchSimulator';
import { AIMatchSimulator } from '../systems/match/AIMatchSimulator';
import { ChampionsLeagueSystem } from '../systems/championsLeague/ChampionsLeagueSystem';
import type { CLScheduledMatch, CLMatchResult, ChampionsLeagueState } from '../systems/championsLeague/types';
import { eventBus, GameEvent } from './EventBus';
import { type RNG, defaultRNG } from '../utils/random';
import { clamp } from '../utils/math';
import { allClubs } from '../data/clubs/index';
import type { TransferOffer, TransferWindow, SocialPost } from './types';

// ─── Result Interfaces ───────────────────────────────────────────────────────

export interface DayAdvanceResult {
  dayResult: DayResult;
  fitnessRecovery: number;
  isMatchDay: boolean;
  matchConfig?: MatchConfig;
  salaryCredited: boolean;
  trainingReset: boolean;
  injuryOccurred: boolean;
  transferOffersGenerated: TransferOffer[];
  isCLMatchDay: boolean;
  clMatchConfig?: CLScheduledMatch;
}

export interface WeekAdvanceResult {
  days: DayAdvanceResult[];
  matchResults: MatchResult[];
  standingsUpdated: boolean;
  blockedByCLMatch: boolean;
  clMatchConfig?: CLScheduledMatch;
}

export interface MatchCompleteResult {
  result: MatchResult;
  performance: MatchPerformance;
  fitnessLoss: number;
  moraleChange: number;
  standingsUpdated: boolean;
  topScorersUpdated: boolean;
  socialPosts: SocialPost[];
}

export interface CLMatchCompleteResult {
  result: CLMatchResult;
  performance: MatchPerformance;
  fitnessLoss: number;
  moraleChange: number;
  otherMatchResults: CLMatchResult[];
  updatedCLState: ChampionsLeagueState;
  socialPosts: SocialPost[];
}

export interface IGameLoopOrchestrator {
  advanceDay(state: GameState, rng?: RNG): { newState: GameState; result: DayAdvanceResult };
  simulateWeek(state: GameState, rng?: RNG): { newState: GameState; result: WeekAdvanceResult };
  playMatch(
    state: GameState,
    config: MatchConfig,
    playerInputs: PlayerInput[],
    rng?: RNG
  ): { newState: GameState; result: MatchCompleteResult };
  simulateMatch(
    state: GameState,
    config: MatchConfig,
    rng?: RNG
  ): { newState: GameState; result: MatchCompleteResult };
  executeTraining(
    state: GameState,
    skill: TrainingSkill,
    rng?: RNG
  ): { newState: GameState; result: TrainingResult };
  playCLMatch(
    state: GameState,
    clMatch: CLScheduledMatch,
    playerInputs: PlayerInput[],
    rng?: RNG
  ): { newState: GameState; result: CLMatchCompleteResult };
  simulateCLMatch(
    state: GameState,
    clMatch: CLScheduledMatch,
    rng?: RNG
  ): { newState: GameState; result: CLMatchCompleteResult };
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Determines the match outcome for the player's team.
 */
function getMatchOutcome(result: MatchResult, playerClubId: string): MatchOutcome {
  const isHome = result.homeTeamId === playerClubId;
  const playerGoals = isHome ? result.homeGoals : result.awayGoals;
  const opponentGoals = isHome ? result.awayGoals : result.homeGoals;

  if (playerGoals > opponentGoals) return 'win';
  if (playerGoals < opponentGoals) return 'loss';
  return 'draw';
}

/**
 * Finds the match config for the player's team on the current matchday.
 */
function findPlayerMatchConfig(
  state: GameState,
  matchday: number
): MatchConfig | undefined {
  const playerClubId = state.career.currentClub.id;
  const playerLeague = state.leagues.find(
    (l) =>
      l.division.country === state.career.currentClub.country &&
      l.division.level === state.career.currentClub.division.level
  );

  if (!playerLeague) return undefined;

  const scheduledMatch = playerLeague.schedule.find(
    (m) =>
      m.matchday === matchday &&
      (m.homeTeam === playerClubId || m.awayTeam === playerClubId)
  );

  if (!scheduledMatch) return undefined;

  // Build MatchConfig from scheduled match
  const isHome = scheduledMatch.homeTeam === playerClubId;
  const opponentId = isHome ? scheduledMatch.awayTeam : scheduledMatch.homeTeam;

  // Find opponent club from league data or clubs
  const opponentClub = findClubById(state, opponentId);
  if (!opponentClub) return undefined;

  const homeTeam = isHome ? state.career.currentClub : opponentClub;
  const awayTeam = isHome ? opponentClub : state.career.currentClub;

  return {
    homeTeam,
    awayTeam,
    playerCharacter: state.player,
    competition: scheduledMatch.competition,
    matchday: scheduledMatch.matchday,
  };
}

/**
 * Finds a club by ID across all leagues in the game state.
 */
function findClubById(state: GameState, clubId: string): Club | undefined {
  // Check if it's the player's club
  if (state.career.currentClub.id === clubId) {
    return state.career.currentClub;
  }

  // Search through league standings to build a minimal club
  for (const league of state.leagues) {
    const standing = league.standings.find((s) => s.clubId === clubId);
    if (standing) {
      return {
        id: clubId,
        name: standing.clubName,
        country: league.division.country,
        division: league.division,
        tier: 'medium',
        squad: [],
        finances: { budget: 0, wageBill: 0 },
        stadium: '',
        colors: { primary: '#000', secondary: '#fff' },
      };
    }
  }

  return undefined;
}

/**
 * Determines the current matchday from the time state schedule.
 */
function getCurrentMatchday(state: GameState): number {
  return state.career.matchday + 1;
}

/**
 * Generates a quick match performance for the player based on rating and fitness.
 * Used when simulating (not playing) a match.
 */
function generateQuickPerformance(
  overallRating: number,
  fitness: number,
  rng: RNG,
  teamWon?: boolean,
  teamDrew?: boolean,
  startsOnBench?: boolean
): MatchPerformance {
  const minutesPlayed = startsOnBench ? rng.randomInt(25, 35) : 90;

  // Base rating depends on match result (lower if bench)
  let baseRating: number;
  if (teamWon) baseRating = 6.5 + rng.randomFloat(0, 1.5);
  else if (teamDrew) baseRating = 5.8 + rng.randomFloat(0, 1.2);
  else baseRating = 4.5 + rng.randomFloat(0, 1.5);

  // Bench penalty: less time = lower chance to impact
  const minutesFactor = minutesPlayed / 90;

  // Generate goals/assists based on rating (reduced if bench)
  const goalChance = (overallRating / 100) * (fitness / 100) * 0.3 * minutesFactor;
  const assistChance = (overallRating / 100) * 0.2 * minutesFactor;
  const goals = rng.random() < goalChance ? (rng.random() < 0.3 ? 2 : 1) : 0;
  const assists = rng.random() < assistChance ? 1 : 0;

  // Adjust rating based on goals/assists
  baseRating += goals * 1.0 + assists * 0.5;
  // Slight penalty for bench (less time to prove yourself)
  if (startsOnBench) baseRating -= 0.3;

  const rating = clamp(Math.round(baseRating * 10) / 10, 3, 10);

  return {
    rating,
    goals,
    assists,
    minutesPlayed,
    shots: rng.randomInt(startsOnBench ? 0 : 1, startsOnBench ? 2 : 5),
    passAccuracy: rng.randomInt(65, 92),
    dribbles: rng.randomInt(0, startsOnBench ? 2 : 4),
    tackles: rng.randomInt(0, startsOnBench ? 1 : 3),
  };
}

// ─── Transfer Window Helper ──────────────────────────────────────────────────

/**
 * Determines if the current date falls within a transfer window.
 * Summer window: June 1 - August 31
 * Winter window: January 1 - January 31
 * Returns the window type or null if not in a window.
 */
function getActiveTransferWindow(date: GameDate): TransferWindow | null {
  if (date.month === 1) return 'winter';
  if (date.month >= 6 && date.month <= 8) return 'summer';
  return null;
}

// ─── Champions League Helpers ────────────────────────────────────────────────

/**
 * Checks if two GameDates are the same day.
 */
function isSameDate(a: GameDate, b: GameDate): boolean {
  return a.day === b.day && a.month === b.month && a.year === b.year;
}

/**
 * Finds the CL match scheduled for the player's club on the given date.
 * Returns the CLScheduledMatch if found, undefined otherwise.
 */
function findCLMatchForDate(
  clState: ChampionsLeagueState | null | undefined,
  date: GameDate,
  playerClubId: string
): CLScheduledMatch | undefined {
  if (!clState || !clState.playerParticipating || clState.playerEliminated) {
    return undefined;
  }

  // Search in league phase schedule
  const match = clState.leagueSchedule.find(
    (m) =>
      isSameDate(m.date, date) &&
      (m.homeTeamId === playerClubId || m.awayTeamId === playerClubId)
  );

  return match;
}

/**
 * Checks if there's a CL match scheduled within the next N days for the player's club.
 * Used by simulateWeek to detect blocking CL matches.
 */
function findCLMatchInRange(
  clState: ChampionsLeagueState | null | undefined,
  startDate: GameDate,
  days: number,
  playerClubId: string
): CLScheduledMatch | undefined {
  if (!clState || !clState.playerParticipating || clState.playerEliminated) {
    return undefined;
  }

  // Generate dates for the range and check each one
  let currentDate = { ...startDate };
  for (let i = 0; i < days; i++) {
    currentDate = advanceDateByOneDay(currentDate);
    const match = findCLMatchForDate(clState, currentDate, playerClubId);
    if (match) return match;
  }

  return undefined;
}

/**
 * Advances a GameDate by one day (simple calendar logic).
 */
function advanceDateByOneDay(date: GameDate): GameDate {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let { day, month, year } = date;

  day++;
  if (day > daysInMonth[month - 1]) {
    day = 1;
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return { day, month, year };
}

/**
 * Builds a Map of clubId -> Club from the static club data.
 * Used to pass to simulateMatchday for proper goal attribution.
 */
function buildClubsLookup(state: GameState): Map<string, Club> {
  const lookup = new Map<string, Club>();
  // Add all static clubs
  for (const club of allClubs) {
    lookup.set(club.id, club);
  }
  // Override with the player's current club (has the player in squad)
  lookup.set(state.career.currentClub.id, state.career.currentClub);
  return lookup;
}

/**
 * Recalculates standings from all results for a league.
 * Uses the league's existing standings as the source of club names.
 */
function recalculateLeagueStandings(
  allResults: import('./types').MatchResult[],
  league: import('./types').LeagueState
): import('./types').LeagueStanding[] {
  const clubs: Club[] = league.standings.map((s) => ({
    id: s.clubId,
    name: s.clubName,
    country: league.division.country,
    division: league.division,
    tier: 'medium' as const,
    squad: [],
    finances: { budget: 0, wageBill: 0 },
    stadium: '',
    colors: { primary: '#000', secondary: '#fff' },
  }));
  return StandingsCalculator.calculateFromResults(allResults, clubs);
}

// ─── Core Implementation ─────────────────────────────────────────────────────

/**
 * Advances the game by one day.
 *
 * Steps:
 * 1. Advance time (TimeSystem)
 * 2. Apply fitness recovery (+1 if no match)
 * 3. Check if it's a match day
 * 4. On Monday: credit weekly salary, reset training availability
 */
export function advanceDay(
  state: GameState,
  rng: RNG = defaultRNG
): { newState: GameState; result: DayAdvanceResult } {
  // 1. Advance time
  const { newState: newTimeState, dayResult } = TimeSystem.advanceDay(state.time, rng);

  let newGameState: GameState = {
    ...state,
    time: newTimeState,
  };

  // 2. Apply fitness recovery (+1 per day, regardless of match day — recovery happens before match)
  const fitnessRecovery = FitnessManager.DAILY_RECOVERY;
  const newFitness = FitnessManager.applyDailyRecovery(newGameState.player.fitness);
  newGameState = {
    ...newGameState,
    player: {
      ...newGameState.player,
      fitness: newFitness,
    },
  };

  // 3. Check if it's Monday (weekday 0)
  const isMonday = TimeSystem.isMonday(newTimeState.weekday);
  let salaryCredited = false;
  let trainingReset = false;

  if (isMonday) {
    // Credit weekly salary
    const newFinanceState = FinanceSystem.creditWeeklySalary(
      newGameState.finance,
      newGameState.career.contract,
      newTimeState.currentDate
    );
    newGameState = {
      ...newGameState,
      finance: newFinanceState,
    };
    salaryCredited = true;

    // Reset training availability
    trainingReset = true;
  }

  // 4. Injury system: evaluate random injury risk during day advance
  let injuryOccurred = false;
  if (!InjurySystem.isInjured(newGameState.player)) {
    // Daily injury risk: rare but possible (~3-5% per week effectively)
    // Base: 0.5% per day + up to 2% more if fitness is low
    const baseRisk = 0.005;
    const fitnessPenalty = (1 - newGameState.player.fitness / 100) * 0.02;
    const injuryRisk = baseRisk + fitnessPenalty;
    if (rng.random() < injuryRisk) {
      const injury = InjurySystem.generateInjury(rng);
      newGameState = {
        ...newGameState,
        player: {
          ...newGameState.player,
          injury,
        },
      };
      injuryOccurred = true;
    }
  } else {
    // Advance recovery if already injured (weekly recovery on Mondays)
    if (isMonday) {
      const updatedInjury = InjurySystem.advanceRecovery(newGameState.player.injury!);
      newGameState = {
        ...newGameState,
        player: {
          ...newGameState.player,
          injury: updatedInjury,
        },
      };
    }
  }

  // 5. Transfer system: generate offers during transfer windows (once per window opening, on Mondays)
  let transferOffersGenerated: TransferOffer[] = [];
  const activeWindow = getActiveTransferWindow(newTimeState.currentDate);
  if (activeWindow && isMonday) {
    const offers = TransferSystem.generateOffers(
      newGameState.player,
      newGameState.career.currentClub.id,
      newGameState.career.contract.weeklySalary,
      newGameState.social.popularity,
      activeWindow,
      rng
    );
    transferOffersGenerated = offers;
  }

  // 6. Check if it's a match day
  const isMatchDay = dayResult.isMatchDay;
  let matchConfig: MatchConfig | undefined;

  if (isMatchDay) {
    const matchday = getCurrentMatchday(newGameState);
    matchConfig = findPlayerMatchConfig(newGameState, matchday);
  }

  // 7. Check if it's a Champions League match day
  let isCLMatchDay = false;
  let clMatchConfig: CLScheduledMatch | undefined;

  const playerClubId = newGameState.career.currentClub.id;
  const clMatch = findCLMatchForDate(
    newGameState.championsLeague,
    newTimeState.currentDate,
    playerClubId
  );

  if (clMatch) {
    isCLMatchDay = true;
    clMatchConfig = clMatch;
    // Emit CL_MATCH_DAY_REACHED event
    eventBus.emit(GameEvent.CL_MATCH_DAY_REACHED, {
      date: newTimeState.currentDate,
      match: clMatch,
    });
  }

  const result: DayAdvanceResult = {
    dayResult,
    fitnessRecovery,
    isMatchDay,
    matchConfig,
    salaryCredited,
    trainingReset,
    injuryOccurred,
    transferOffersGenerated,
    isCLMatchDay,
    clMatchConfig,
  };

  return { newState: newGameState, result };
}

/**
 * Simulates a full week (7 days) sequentially, collecting all results.
 * Blocks if a Champions League match is scheduled within the week.
 */
export function simulateWeek(
  state: GameState,
  rng: RNG = defaultRNG
): { newState: GameState; result: WeekAdvanceResult } {
  // Check if a CL match is scheduled within the next 7 days
  const playerClubId = state.career.currentClub.id;
  const clMatchInWeek = findCLMatchInRange(
    state.championsLeague,
    state.time.currentDate,
    7,
    playerClubId
  );

  if (clMatchInWeek) {
    // Block simulation — CL match needs to be played/simulated first
    return {
      newState: state,
      result: {
        days: [],
        matchResults: [],
        standingsUpdated: false,
        blockedByCLMatch: true,
        clMatchConfig: clMatchInWeek,
      },
    };
  }

  let currentState = state;
  const days: DayAdvanceResult[] = [];
  const matchResults: MatchResult[] = [];
  let standingsUpdated = false;

  for (let i = 0; i < 7; i++) {
    const { newState, result } = advanceDay(currentState, rng);
    currentState = newState;
    days.push(result);

    // If it's a match day and we have a config, auto-simulate the match
    if (result.isMatchDay && result.matchConfig) {
      const { newState: postMatchState, result: matchResult } = simulateMatch(
        currentState,
        result.matchConfig,
        rng
      );
      currentState = postMatchState;
      matchResults.push(matchResult.result);
      standingsUpdated = true;
    }
  }

  return {
    newState: currentState,
    result: {
      days,
      matchResults,
      standingsUpdated,
      blockedByCLMatch: false,
    },
  };
}

/**
 * Plays an interactive match with player inputs.
 *
 * Steps:
 * 1. Run MatchSimulator with player inputs
 * 2. Apply fitness loss
 * 3. Simulate other matches for the matchday (LeagueEngine)
 * 4. Update standings
 * 5. Update morale based on result
 */
export function playMatch(
  state: GameState,
  config: MatchConfig,
  playerInputs: PlayerInput[],
  rng: RNG = defaultRNG
): { newState: GameState; result: MatchCompleteResult } {
  // 1. Run interactive match
  const { result: matchResult, performance } = MatchSimulator.simulateMatch(
    config,
    playerInputs,
    rng
  );

  // 2. Apply fitness loss
  const fitnessLoss = rng.randomInt(
    FitnessManager.MATCH_FITNESS_LOSS.min,
    FitnessManager.MATCH_FITNESS_LOSS.max
  );
  const newFitness = FitnessManager.clampFitness(state.player.fitness - fitnessLoss);

  let newGameState: GameState = {
    ...state,
    player: {
      ...state.player,
      fitness: newFitness,
    },
  };

  // 3. Simulate other matches for this matchday — ALL leagues
  const playerClubId = state.career.currentClub.id;

  let standingsUpdated = false;
  let topScorersUpdated = false;

  // Build clubs lookup for proper goal attribution
  const clubsLookup = buildClubsLookup(state);

  // Simulate matchday for ALL leagues
  const updatedLeagues = newGameState.leagues.map((league) => {
    const isPlayerLeague =
      league.division.country === state.career.currentClub.country &&
      league.division.level === state.career.currentClub.division.level;

    // Simulate all matches for this matchday in this league
    const matchdayResult = simulateMatchday(
      config.matchday,
      [league],
      clubsLookup,
      rng
    );

    if (isPlayerLeague) {
      // Add the player's match result + other results
      const allNewResults = [...matchdayResult.results, matchResult];
      const allLeagueResults = [...league.results, ...allNewResults];
      const recalcStandings = recalculateLeagueStandings(allLeagueResults, league);
      // Add player's goals/assists to top scorers
      const playerGoalEvents: MatchGoalEvent[] = [];
      if (matchResult.playerPerformance && (matchResult.playerPerformance.goals > 0 || matchResult.playerPerformance.assists > 0)) {
        playerGoalEvents.push({
          playerId: state.player.id,
          playerName: `${state.player.firstName} ${state.player.lastName}`,
          clubId: state.career.currentClub.id,
          clubName: state.career.currentClub.name,
          goals: matchResult.playerPerformance.goals,
          assists: matchResult.playerPerformance.assists,
        });
      }
      const topScorersWithPlayer = accumulateGoals(matchdayResult.updatedTopScorers, playerGoalEvents);
      standingsUpdated = true;
      topScorersUpdated = true;
      return {
        ...league,
        results: allLeagueResults,
        standings: recalcStandings,
        topScorers: topScorersWithPlayer,
      };
    } else {
      // Other leagues: just add the simulated results
      const allLeagueResults = [...league.results, ...matchdayResult.results];
      const recalcStandings = recalculateLeagueStandings(allLeagueResults, league);
      return {
        ...league,
        results: allLeagueResults,
        standings: recalcStandings,
        topScorers: matchdayResult.updatedTopScorers,
      };
    }
  });

  newGameState = {
    ...newGameState,
    leagues: updatedLeagues,
    career: {
      ...newGameState.career,
      matchday: config.matchday,
    },
  };

  // 4. Update morale based on match result
  const outcome = getMatchOutcome(matchResult, playerClubId);
  const previousMorale = newGameState.social.teamMorale ?? 50;
  const newSocialState = SocialSystem.updateTeamMorale(newGameState.social, outcome, rng);
  const moraleChange = (newSocialState.teamMorale ?? 50) - previousMorale;

  // 5. Generate social feed posts based on performance
  const playerName = `${state.player.firstName} ${state.player.lastName}`;
  const socialPosts = SocialFeedGenerator.generateMatchPosts(
    performance,
    playerName,
    state.time.currentDate,
    rng
  );

  const socialStateWithFeed: typeof newSocialState = {
    ...newSocialState,
    socialFeed: [...socialPosts, ...newSocialState.socialFeed].slice(0, 50),
  };

  newGameState = {
    ...newGameState,
    social: socialStateWithFeed,
  };

  // 6. Post-match injury risk (~8% chance, higher if fitness is low)
  if (!InjurySystem.isInjured(newGameState.player)) {
    const postMatchInjuryRisk = 0.04 + (1 - newGameState.player.fitness / 100) * 0.06; // 4-10%
    if (rng.random() < postMatchInjuryRisk) {
      const injury = InjurySystem.generateInjury(rng);
      newGameState = {
        ...newGameState,
        player: {
          ...newGameState.player,
          injury,
        },
      };
    }
  }

  return {
    newState: newGameState,
    result: {
      result: matchResult,
      performance,
      fitnessLoss,
      moraleChange,
      standingsUpdated,
      topScorersUpdated,
      socialPosts,
    },
  };
}

/**
 * Simulates a match quickly (no player interaction).
 *
 * Steps:
 * 1. Calculate result favoring stronger team
 * 2. Generate automatic player performance
 * 3. Apply fitness loss
 * 4. Simulate other matches for the matchday
 * 5. Update standings and morale
 */
export function simulateMatch(
  state: GameState,
  config: MatchConfig,
  rng: RNG = defaultRNG
): { newState: GameState; result: MatchCompleteResult } {
  // 1. Simulate the match using AIMatchSimulator (favors stronger team)
  const aiResult = AIMatchSimulator.simulateAIMatch(
    config.homeTeam,
    config.awayTeam,
    config.matchday,
    rng
  );

  // 2. Determine base result and then generate player performance
  const playerClubId = state.career.currentClub.id;
  const isHome = config.homeTeam.id === playerClubId;
  const playerTeamBaseGoals = isHome ? aiResult.homeGoals : aiResult.awayGoals;
  const opponentBaseGoals = isHome ? aiResult.awayGoals : aiResult.homeGoals;
  const teamWinning = playerTeamBaseGoals > opponentBaseGoals;
  const teamDrawing = playerTeamBaseGoals === opponentBaseGoals;

  // Check if player starts on bench (coachRelation < 40)
  const coachRelation = state.social.coachRelation ?? 50;
  const startsOnBench = coachRelation < 40;

  const performance = generateQuickPerformance(
    state.player.overallRating,
    state.player.fitness,
    rng,
    teamWinning,
    teamDrawing,
    startsOnBench
  );

  // Adjust goals based on player performance
  let homeGoals = aiResult.homeGoals;
  let awayGoals = aiResult.awayGoals;

  if (performance.goals > 0) {
    if (isHome) homeGoals += performance.goals;
    else awayGoals += performance.goals;
  }

  const matchResult: MatchResult = {
    matchday: config.matchday,
    homeTeamId: config.homeTeam.id,
    awayTeamId: config.awayTeam.id,
    homeGoals,
    awayGoals,
    playerPerformance: performance,
  };

  // 3. Apply fitness loss
  const fitnessLoss = rng.randomInt(
    FitnessManager.MATCH_FITNESS_LOSS.min,
    FitnessManager.MATCH_FITNESS_LOSS.max
  );
  const newFitness = FitnessManager.clampFitness(state.player.fitness - fitnessLoss);

  let newGameState: GameState = {
    ...state,
    player: {
      ...state.player,
      fitness: newFitness,
    },
  };

  // 4. Simulate other matches for this matchday — ALL leagues
  let standingsUpdated = false;
  let topScorersUpdated = false;

  // Build clubs lookup for proper goal attribution
  const clubsLookupSim = buildClubsLookup(state);

  const updatedLeagues = newGameState.leagues.map((league) => {
    const isPlayerLeague =
      league.division.country === state.career.currentClub.country &&
      league.division.level === state.career.currentClub.division.level;

    // Simulate all matches for this matchday in this league
    const matchdayResult = simulateMatchday(
      config.matchday,
      [league],
      clubsLookupSim,
      rng
    );

    if (isPlayerLeague) {
      // Add the player's match result + other results
      const allNewResults = [...matchdayResult.results, matchResult];
      const allLeagueResults = [...league.results, ...allNewResults];
      const recalcStandings = recalculateLeagueStandings(allLeagueResults, league);
      // Add player's goals/assists to top scorers
      const playerGoalEvents: MatchGoalEvent[] = [];
      if (matchResult.playerPerformance && (matchResult.playerPerformance.goals > 0 || matchResult.playerPerformance.assists > 0)) {
        playerGoalEvents.push({
          playerId: state.player.id,
          playerName: `${state.player.firstName} ${state.player.lastName}`,
          clubId: state.career.currentClub.id,
          clubName: state.career.currentClub.name,
          goals: matchResult.playerPerformance.goals,
          assists: matchResult.playerPerformance.assists,
        });
      }
      const topScorersWithPlayer = accumulateGoals(matchdayResult.updatedTopScorers, playerGoalEvents);
      standingsUpdated = true;
      topScorersUpdated = true;
      return {
        ...league,
        results: allLeagueResults,
        standings: recalcStandings,
        topScorers: topScorersWithPlayer,
      };
    } else {
      // Other leagues: just add the simulated results
      const allLeagueResults = [...league.results, ...matchdayResult.results];
      const recalcStandings = recalculateLeagueStandings(allLeagueResults, league);
      return {
        ...league,
        results: allLeagueResults,
        standings: recalcStandings,
        topScorers: matchdayResult.updatedTopScorers,
      };
    }
  });

  newGameState = {
    ...newGameState,
    leagues: updatedLeagues,
    career: {
      ...newGameState.career,
      matchday: config.matchday,
    },
  };

  // 5. Update morale
  const outcome = getMatchOutcome(matchResult, playerClubId);
  const previousMorale = newGameState.social.teamMorale ?? 50;
  const newSocialState = SocialSystem.updateTeamMorale(newGameState.social, outcome, rng);
  const moraleChange = (newSocialState.teamMorale ?? 50) - previousMorale;

  // 6. Generate social feed posts based on performance
  const playerName = `${state.player.firstName} ${state.player.lastName}`;
  const socialPosts = SocialFeedGenerator.generateMatchPosts(
    performance,
    playerName,
    state.time.currentDate,
    rng
  );

  const socialStateWithFeed: typeof newSocialState = {
    ...newSocialState,
    socialFeed: [...socialPosts, ...newSocialState.socialFeed].slice(0, 50),
  };

  newGameState = {
    ...newGameState,
    social: socialStateWithFeed,
  };

  // 7. Post-match injury risk (~8% chance, higher if fitness is low)
  if (!InjurySystem.isInjured(newGameState.player)) {
    const postMatchInjuryRisk = 0.04 + (1 - newGameState.player.fitness / 100) * 0.06; // 4-10%
    if (rng.random() < postMatchInjuryRisk) {
      const injury = InjurySystem.generateInjury(rng);
      newGameState = {
        ...newGameState,
        player: {
          ...newGameState.player,
          injury,
        },
      };
    }
  }

  return {
    newState: newGameState,
    result: {
      result: matchResult,
      performance,
      fitnessLoss,
      moraleChange,
      standingsUpdated,
      topScorersUpdated,
      socialPosts,
    },
  };
}

/**
 * Executes a weekly training session on the specified skill.
 *
 * Steps:
 * 1. Check if training is available (not already done this week)
 * 2. Execute training via TrainingManager
 * 3. Update player stats
 * 4. Mark training as done
 */
export function executeTraining(
  state: GameState,
  skill: TrainingSkill,
  rng: RNG = defaultRNG
): { newState: GameState; result: TrainingResult } {
  // 1. Check availability — use the training state from the store-level WeeklyTrainingState
  // We check via the player's state and a trainedThisWeek flag embedded in the game state
  // For now, we rely on the caller to pass the correct state with training info
  // The training availability is tracked externally (in the store's trainingSlice)
  // But we still validate via TrainingManager
  if (!TrainingManager.isTrainingAvailable(false)) {
    // This shouldn't happen if the caller checks first, but as a safety net
    return {
      newState: state,
      result: {
        skill,
        previousValue: state.player.stats[skill],
        newValue: state.player.stats[skill],
        gain: 0,
      },
    };
  }

  // 2. Execute training
  const trainingResult = TrainingManager.executeWeeklyTraining(state.player, skill, rng);

  // 3. Update player stats and recalculate overall rating
  const newStats = {
    ...state.player.stats,
    [skill]: trainingResult.newValue,
  };

  // OVR = average of all 6 stats
  const newOverallRating = Math.round(
    (newStats.pace + newStats.shooting + newStats.passing + newStats.dribbling + newStats.defending + newStats.physical) / 6
  );

  const newGameState: GameState = {
    ...state,
    player: {
      ...state.player,
      stats: newStats,
      overallRating: newOverallRating,
    },
  };

  return {
    newState: newGameState,
    result: trainingResult,
  };
}

// ─── Champions League Match Functions ─────────────────────────────────────────

/**
 * Plays an interactive Champions League match with player inputs.
 *
 * Steps:
 * 1. Run MatchSimulator with player inputs (using CL match config)
 * 2. Apply fitness loss
 * 3. Simulate other CL matches for the matchday (ChampionsLeagueSystem.simulateMatchday)
 * 4. Update CL standings
 * 5. Update morale based on result
 * 6. Apply injury risk evaluation
 * 7. Emit CL events via EventBus
 */
export function playCLMatch(
  state: GameState,
  clMatch: CLScheduledMatch,
  playerInputs: PlayerInput[],
  rng: RNG = defaultRNG
): { newState: GameState; result: CLMatchCompleteResult } {
  const clState = state.championsLeague;
  if (!clState) {
    throw new Error('Champions League state is not initialized');
  }

  const playerClubId = state.career.currentClub.id;

  // Build a MatchConfig from the CL match for the MatchSimulator
  const isHome = clMatch.homeTeamId === playerClubId;
  const opponentId = isHome ? clMatch.awayTeamId : clMatch.homeTeamId;

  // Find opponent from CL participants
  const opponent = clState.participants.find((p) => p.id === opponentId);
  const opponentClub: Club = {
    id: opponentId,
    name: opponent?.name ?? 'Unknown',
    country: (opponent?.country as any) ?? 'france',
    division: state.career.currentClub.division,
    tier: 'medium',
    squad: [],
    finances: { budget: 0, wageBill: 0 },
    stadium: '',
    colors: { primary: '#000', secondary: '#fff' },
  };

  const homeTeam = isHome ? state.career.currentClub : opponentClub;
  const awayTeam = isHome ? opponentClub : state.career.currentClub;

  const matchConfig: MatchConfig = {
    homeTeam,
    awayTeam,
    playerCharacter: state.player,
    competition: 'Ligue des Champions',
    matchday: clMatch.matchday,
  };

  // 1. Run interactive match
  const { result: matchResult, performance } = MatchSimulator.simulateMatch(
    matchConfig,
    playerInputs,
    rng
  );

  // Convert to CLMatchResult
  const clMatchResult: CLMatchResult = {
    matchday: clMatch.matchday,
    homeTeamId: matchResult.homeTeamId,
    awayTeamId: matchResult.awayTeamId,
    homeGoals: matchResult.homeGoals,
    awayGoals: matchResult.awayGoals,
    phase: clMatch.phase,
    leg: clMatch.leg,
    playerPerformance: performance,
  };

  // 2. Apply fitness loss
  const fitnessLoss = rng.randomInt(
    FitnessManager.MATCH_FITNESS_LOSS.min,
    FitnessManager.MATCH_FITNESS_LOSS.max
  );
  const newFitness = FitnessManager.clampFitness(state.player.fitness - fitnessLoss);

  let newGameState: GameState = {
    ...state,
    player: {
      ...state.player,
      fitness: newFitness,
    },
  };

  // 3. Simulate other CL matches for this matchday
  const matchdayResult = ChampionsLeagueSystem.simulateMatchday(
    clState,
    clMatch.matchday,
    playerClubId,
    rng
  );

  // 4. Update CL standings with all results (player's + simulated)
  const allCLResults = [...matchdayResult.results, clMatchResult];
  const updatedStandings = ChampionsLeagueSystem.updateStandings(clState, allCLResults);

  const updatedCLState: ChampionsLeagueState = {
    ...clState,
    leagueResults: [...clState.leagueResults, ...allCLResults],
    standings: updatedStandings,
    currentMatchday: Math.max(clState.currentMatchday, clMatch.matchday),
  };

  newGameState = {
    ...newGameState,
    championsLeague: updatedCLState,
  };

  // 5. Update morale based on match result
  const playerGoals = isHome ? matchResult.homeGoals : matchResult.awayGoals;
  const opponentGoals = isHome ? matchResult.awayGoals : matchResult.homeGoals;
  const outcome: MatchOutcome =
    playerGoals > opponentGoals ? 'win' : playerGoals < opponentGoals ? 'loss' : 'draw';

  const previousMorale = newGameState.social.teamMorale ?? 50;
  const newSocialState = SocialSystem.updateTeamMorale(newGameState.social, outcome, rng);
  const moraleChange = (newSocialState.teamMorale ?? 50) - previousMorale;

  // 6. Generate social feed posts
  const playerName = `${state.player.firstName} ${state.player.lastName}`;
  const socialPosts = SocialFeedGenerator.generateMatchPosts(
    performance,
    playerName,
    state.time.currentDate,
    rng
  );

  const socialStateWithFeed = {
    ...newSocialState,
    socialFeed: [...socialPosts, ...newSocialState.socialFeed].slice(0, 50),
  };

  newGameState = {
    ...newGameState,
    social: socialStateWithFeed,
  };

  // 7. Evaluate injury risk after CL match (same as league)
  if (!InjurySystem.isInjured(newGameState.player)) {
    const injuryRisk = (1 - newGameState.player.fitness / 100) * 0.05; // slightly higher risk after match
    if (rng.random() < injuryRisk) {
      const injury = InjurySystem.generateInjury(rng);
      newGameState = {
        ...newGameState,
        player: {
          ...newGameState.player,
          injury,
        },
      };
    }
  }

  // 8. Emit CL events
  eventBus.emit(GameEvent.CL_MATCHDAY_COMPLETE, {
    matchday: clMatch.matchday,
    phase: clMatch.phase,
    results: allCLResults,
  });

  // Check if league phase is complete (all 8 matchdays played)
  if (clMatch.phase === 'league' && updatedCLState.currentMatchday >= 8) {
    eventBus.emit(GameEvent.CL_PHASE_COMPLETE, { phase: 'league' });
  }

  return {
    newState: newGameState,
    result: {
      result: clMatchResult,
      performance,
      fitnessLoss,
      moraleChange,
      otherMatchResults: matchdayResult.results,
      updatedCLState,
      socialPosts,
    },
  };
}

/**
 * Simulates a Champions League match quickly (no player interaction).
 *
 * Steps:
 * 1. Simulate the match using AIMatchSimulator
 * 2. Generate player performance
 * 3. Apply fitness loss
 * 4. Simulate other CL matches for the matchday
 * 5. Update CL standings and morale
 * 6. Apply injury risk evaluation
 * 7. Emit CL events via EventBus
 */
export function simulateCLMatch(
  state: GameState,
  clMatch: CLScheduledMatch,
  rng: RNG = defaultRNG
): { newState: GameState; result: CLMatchCompleteResult } {
  const clState = state.championsLeague;
  if (!clState) {
    throw new Error('Champions League state is not initialized');
  }

  const playerClubId = state.career.currentClub.id;
  const isHome = clMatch.homeTeamId === playerClubId;
  const opponentId = isHome ? clMatch.awayTeamId : clMatch.homeTeamId;

  // Find opponent from CL participants
  const opponent = clState.participants.find((p) => p.id === opponentId);
  const opponentClub: Club = {
    id: opponentId,
    name: opponent?.name ?? 'Unknown',
    country: (opponent?.country as any) ?? 'france',
    division: state.career.currentClub.division,
    tier: 'medium',
    squad: [],
    finances: { budget: 0, wageBill: 0 },
    stadium: '',
    colors: { primary: '#000', secondary: '#fff' },
  };

  const homeTeam = isHome ? state.career.currentClub : opponentClub;
  const awayTeam = isHome ? opponentClub : state.career.currentClub;

  // 1. Simulate the match using AIMatchSimulator
  const aiResult = AIMatchSimulator.simulateAIMatch(
    homeTeam,
    awayTeam,
    clMatch.matchday,
    rng
  );

  // 2. Generate player performance
  const playerTeamGoals = isHome ? aiResult.homeGoals : aiResult.awayGoals;
  const opponentBaseGoals = isHome ? aiResult.awayGoals : aiResult.homeGoals;
  const teamWinning = playerTeamGoals > opponentBaseGoals;
  const teamDrawing = playerTeamGoals === opponentBaseGoals;

  const performance = generateQuickPerformance(
    state.player.overallRating,
    state.player.fitness,
    rng,
    teamWinning,
    teamDrawing
  );

  // Adjust goals based on player performance
  let homeGoals = aiResult.homeGoals;
  let awayGoals = aiResult.awayGoals;

  if (performance.goals > 0) {
    if (isHome) homeGoals += performance.goals;
    else awayGoals += performance.goals;
  }

  const clMatchResult: CLMatchResult = {
    matchday: clMatch.matchday,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeGoals,
    awayGoals,
    phase: clMatch.phase,
    leg: clMatch.leg,
    playerPerformance: performance,
  };

  // 3. Apply fitness loss
  const fitnessLoss = rng.randomInt(
    FitnessManager.MATCH_FITNESS_LOSS.min,
    FitnessManager.MATCH_FITNESS_LOSS.max
  );
  const newFitness = FitnessManager.clampFitness(state.player.fitness - fitnessLoss);

  let newGameState: GameState = {
    ...state,
    player: {
      ...state.player,
      fitness: newFitness,
    },
  };

  // 4. Simulate other CL matches for this matchday
  const matchdayResult = ChampionsLeagueSystem.simulateMatchday(
    clState,
    clMatch.matchday,
    playerClubId,
    rng
  );

  // 5. Update CL standings with all results
  const allCLResults = [...matchdayResult.results, clMatchResult];
  const updatedStandings = ChampionsLeagueSystem.updateStandings(clState, allCLResults);

  const updatedCLState: ChampionsLeagueState = {
    ...clState,
    leagueResults: [...clState.leagueResults, ...allCLResults],
    standings: updatedStandings,
    currentMatchday: Math.max(clState.currentMatchday, clMatch.matchday),
  };

  newGameState = {
    ...newGameState,
    championsLeague: updatedCLState,
  };

  // 6. Update morale
  const finalPlayerGoals = isHome ? homeGoals : awayGoals;
  const finalOpponentGoals = isHome ? awayGoals : homeGoals;
  const outcome: MatchOutcome =
    finalPlayerGoals > finalOpponentGoals ? 'win' : finalPlayerGoals < finalOpponentGoals ? 'loss' : 'draw';

  const previousMorale = newGameState.social.teamMorale ?? 50;
  const newSocialState = SocialSystem.updateTeamMorale(newGameState.social, outcome, rng);
  const moraleChange = (newSocialState.teamMorale ?? 50) - previousMorale;

  // 7. Generate social feed posts
  const playerName = `${state.player.firstName} ${state.player.lastName}`;
  const socialPosts = SocialFeedGenerator.generateMatchPosts(
    performance,
    playerName,
    state.time.currentDate,
    rng
  );

  const socialStateWithFeed = {
    ...newSocialState,
    socialFeed: [...socialPosts, ...newSocialState.socialFeed].slice(0, 50),
  };

  newGameState = {
    ...newGameState,
    social: socialStateWithFeed,
  };

  // 8. Evaluate injury risk after CL match (same as league)
  if (!InjurySystem.isInjured(newGameState.player)) {
    const injuryRisk = (1 - newGameState.player.fitness / 100) * 0.05;
    if (rng.random() < injuryRisk) {
      const injury = InjurySystem.generateInjury(rng);
      newGameState = {
        ...newGameState,
        player: {
          ...newGameState.player,
          injury,
        },
      };
    }
  }

  // 9. Emit CL events
  eventBus.emit(GameEvent.CL_MATCHDAY_COMPLETE, {
    matchday: clMatch.matchday,
    phase: clMatch.phase,
    results: allCLResults,
  });

  // Check if league phase is complete
  if (clMatch.phase === 'league' && updatedCLState.currentMatchday >= 8) {
    eventBus.emit(GameEvent.CL_PHASE_COMPLETE, { phase: 'league' });
  }

  // Check if player is eliminated (in knockout phase)
  if (clMatch.phase !== 'league') {
    if (finalOpponentGoals > finalPlayerGoals) {
      // Simplified: in knockout, a loss could mean elimination
      // Full logic would check aggregate scores
      eventBus.emit(GameEvent.CL_ELIMINATED, { playerClubId });
    }
  }

  return {
    newState: newGameState,
    result: {
      result: clMatchResult,
      performance,
      fitnessLoss,
      moraleChange,
      otherMatchResults: matchdayResult.results,
      updatedCLState,
      socialPosts,
    },
  };
}

// ─── Exported Orchestrator ───────────────────────────────────────────────────

export const GameLoopOrchestrator: IGameLoopOrchestrator = {
  advanceDay,
  simulateWeek,
  playMatch,
  simulateMatch,
  executeTraining,
  playCLMatch,
  simulateCLMatch,
};
