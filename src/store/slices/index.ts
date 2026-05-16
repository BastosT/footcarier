export { createPlayerSlice } from './playerSlice';
export type { PlayerSlice, PlayerCharacter, PlayerStats, Position, InjuryState, InjuryType, PlayerAppearance, Country } from './playerSlice';

export { createCareerSlice } from './careerSlice';
export type { CareerSlice, CareerState, Club, ClubTier, Division, Contract, Trophy, TransferRecord, SquadPlayer, ClubFinances } from './careerSlice';

export { createTimeSlice } from './timeSlice';
export type { TimeSlice, TimeState, GameDate, ScheduledMatch, MatchSchedule } from './timeSlice';

export { createSocialSlice } from './socialSlice';
export type { SocialSlice, SocialState, SocialPost, Interview, InterviewQuestion, InterviewAnswer } from './socialSlice';

export { createFinanceSlice } from './financeSlice';
export type { FinanceSlice, FinanceState, FinanceTransaction } from './financeSlice';

export { createLeagueSlice } from './leagueSlice';
export type { LeagueSlice, LeagueState, LeagueStanding, MatchResult, MatchPerformance, TopScorer } from './leagueSlice';

export { createTrainingSlice } from './trainingSlice';
export type { TrainingSlice, WeeklyTrainingState } from './trainingSlice';

export { createUISlice } from './uiSlice';
export type { UISlice, UIState, NavTab, ScreenType } from './uiSlice';

export { createChampionsLeagueSlice } from './championsLeagueSlice';
export type { ChampionsLeagueSlice } from './championsLeagueSlice';
