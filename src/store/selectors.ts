import type { GameStore } from './gameStore';

// Player selectors
export const selectPlayer = (state: GameStore) => state.player;
export const selectPlayerStats = (state: GameStore) => state.player?.stats ?? null;
export const selectPlayerFitness = (state: GameStore) => state.player?.fitness ?? 0;
export const selectPlayerMorale = (state: GameStore) => state.player?.morale ?? 0;
export const selectPlayerInjury = (state: GameStore) => state.player?.injury ?? null;
export const selectPlayerOverallRating = (state: GameStore) => state.player?.overallRating ?? 0;
export const selectIsPlayerInjured = (state: GameStore) => state.player?.injury !== null && state.player?.injury !== undefined;

// Career selectors
export const selectCareer = (state: GameStore) => state.career;
export const selectCurrentClub = (state: GameStore) => state.career.currentClub;
export const selectContract = (state: GameStore) => state.career.contract;
export const selectSeason = (state: GameStore) => state.career.season;
export const selectMatchday = (state: GameStore) => state.career.matchday;
export const selectTrophies = (state: GameStore) => state.career.trophies;

// Time selectors
export const selectTime = (state: GameStore) => state.time;
export const selectCurrentDate = (state: GameStore) => state.time.currentDate;
export const selectWeekday = (state: GameStore) => state.time.weekday;
export const selectEventsThisWeek = (state: GameStore) => state.time.eventsThisWeek;
export const selectNextMatch = (state: GameStore) => state.time.schedule.nextMatch;
export const selectSeasonMatches = (state: GameStore) => state.time.schedule.seasonMatches;

// Social selectors
export const selectSocial = (state: GameStore) => state.social;
export const selectPopularity = (state: GameStore) => state.social.popularity;
export const selectReputation = (state: GameStore) => state.social.reputation;
export const selectCoachRelation = (state: GameStore) => state.social.coachRelation;
export const selectTeamRelation = (state: GameStore) => state.social.teamRelation;
export const selectSocialFeed = (state: GameStore) => state.social.socialFeed;
export const selectPendingInterviews = (state: GameStore) => state.social.pendingInterviews;

// Finance selectors
export const selectFinance = (state: GameStore) => state.finance;
export const selectBalance = (state: GameStore) => state.finance.balance;
export const selectWeeklyIncome = (state: GameStore) => state.finance.weeklyIncome;
export const selectFinanceHistory = (state: GameStore) => state.finance.history;

// League selectors
export const selectLeagues = (state: GameStore) => state.leagues;
export const selectLeagueByDivision = (country: string, level: number) => (state: GameStore) =>
  state.leagues.find((l) => l.division.country === country && l.division.level === level) ?? null;
export const selectCurrentLeague = (state: GameStore) => {
  const club = state.career.currentClub;
  if (!club) return null;
  return state.leagues.find(
    (l) => l.division.country === club.division.country && l.division.level === club.division.level
  ) ?? null;
};
export const selectCurrentStandings = (state: GameStore) => {
  const league = selectCurrentLeague(state);
  return league?.standings ?? [];
};
