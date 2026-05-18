/**
 * Updates player career stats (season + all-time) after a match.
 */

import { useGameStore } from '../store/gameStore';
import type { PlayerCareerStats, PlayerSeasonStats } from '../core/types';
import type { LastMatchSummary } from '../store/slices/uiSlice';
import { CL_CONSTANTS } from '../systems/championsLeague/types';

function addToStats(stats: PlayerSeasonStats, summary: LastMatchSummary): PlayerSeasonStats {
  const newMatchesPlayed = stats.matchesPlayed + 1;
  const newTotalRating = stats.totalRating + summary.playerRating;

  return {
    matchesPlayed: newMatchesPlayed,
    goals: stats.goals + summary.playerGoals,
    assists: stats.assists + summary.playerAssists,
    shots: stats.shots + summary.playerShots,
    dribbles: stats.dribbles + summary.playerDribbles,
    tackles: stats.tackles + summary.playerTackles,
    avgRating: Math.round((newTotalRating / newMatchesPlayed) * 10) / 10,
    totalRating: newTotalRating,
    cleanSheets: stats.cleanSheets,
  };
}

export function updateCareerStatsFromMatch(summary: LastMatchSummary): void {
  const state = useGameStore.getState();
  if (!state.gameState) return;

  const current = state.gameState.playerCareerStats ?? {
    season: { matchesPlayed: 0, goals: 0, assists: 0, shots: 0, dribbles: 0, tackles: 0, avgRating: 0, totalRating: 0, cleanSheets: 0 },
    allTime: { matchesPlayed: 0, goals: 0, assists: 0, shots: 0, dribbles: 0, tackles: 0, avgRating: 0, totalRating: 0, cleanSheets: 0 },
    clGoals: 0,
  };

  const updatedStats: PlayerCareerStats = {
    season: addToStats(current.season, summary),
    allTime: addToStats(current.allTime, summary),
    clGoals: current.clGoals ?? 0,
  };

  // Credit goal and assist bonuses
  const contract = state.gameState.career.contract;
  const goalBonus = summary.playerGoals * (contract.bonusPerGoal ?? 0);
  const assistBonus = summary.playerAssists * (contract.bonusPerAssist ?? 0);
  const totalBonus = goalBonus + assistBonus;

  // Instagram: gain followers based on match performance
  const ig = state.gameState.lifestyle?.instagram ?? { followers: 1000, posts: [], weeklyPostDone: false };
  let followersGain = 10 + Math.floor(Math.random() * 20); // base 10-30 per match
  followersGain += summary.playerGoals * 50; // +50 per goal
  followersGain += summary.playerAssists * 25; // +25 per assist
  if (summary.playerRating >= 8) followersGain += 100; // great performance bonus
  if (summary.playerRating >= 9) followersGain += 200; // exceptional bonus
  // Club tier bonus
  const clubTier = state.gameState.career.currentClub.tier;
  if (clubTier === 'big') followersGain *= 3;
  else if (clubTier === 'medium') followersGain *= 1.5;
  followersGain = Math.round(followersGain);

  useGameStore.setState({
    gameState: {
      ...state.gameState,
      playerCareerStats: updatedStats,
      finance: {
        ...state.gameState.finance,
        balance: state.gameState.finance.balance + totalBonus,
      },
      lifestyle: {
        ...state.gameState.lifestyle,
        instagram: {
          ...ig,
          followers: ig.followers + followersGain,
          weeklyPostDone: false, // reset weekly post after match
        },
        youtube: {
          ...(state.gameState.lifestyle.youtube ?? { subscribers: 0, videos: [], weeklyUploadDone: false, monthlyRevenue: 0 }),
          weeklyUploadDone: false, // reset weekly upload after match
        },
      },
    },
  });

  // Post-match stat gain: ~15% chance per match (= ~5 times per 34-match season)
  // Gain +1 or +2 on a skill related to match performance
  if (Math.random() < 0.15) {
    const freshState = useGameStore.getState();
    if (freshState.gameState) {
      const player = freshState.gameState.player;
      // Choose skill based on what happened in the match
      type Skill = 'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical';
      let skill: Skill;
      if (summary.playerGoals > 0) skill = 'shooting';
      else if (summary.playerAssists > 0) skill = 'passing';
      else if (summary.playerDribbles > 1) skill = 'dribbling';
      else if (summary.playerTackles > 1) skill = 'defending';
      else {
        const skills: Skill[] = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
        skill = skills[Math.floor(Math.random() * skills.length)];
      }

      const gain = Math.random() < 0.7 ? 1 : 2; // 70% chance +1, 30% chance +2
      const currentVal = player.stats[skill];
      const newVal = Math.min(player.potential, currentVal + gain);

      if (newVal > currentVal) {
        const newStats = { ...player.stats, [skill]: newVal };
        const newOVR = Math.round(
          (newStats.pace + newStats.shooting + newStats.passing + newStats.dribbling + newStats.defending + newStats.physical) / 6
        );
        useGameStore.setState({
          gameState: {
            ...freshState.gameState,
            player: { ...player, stats: newStats, overallRating: newOVR },
          },
        });
      }
    }
  }
}

/**
 * Updates player career stats after a Champions League match.
 * Records performance in season + all-time stats, increments CL goals counter,
 * and applies the CL Instagram prestige multiplier (×2).
 *
 * Requirements: 6.1, 6.3, 6.4, 6.5
 */
export function updateCareerStatsFromCLMatch(summary: LastMatchSummary): void {
  const state = useGameStore.getState();
  if (!state.gameState) return;

  const current = state.gameState.playerCareerStats ?? {
    season: { matchesPlayed: 0, goals: 0, assists: 0, shots: 0, dribbles: 0, tackles: 0, avgRating: 0, totalRating: 0, cleanSheets: 0 },
    allTime: { matchesPlayed: 0, goals: 0, assists: 0, shots: 0, dribbles: 0, tackles: 0, avgRating: 0, totalRating: 0, cleanSheets: 0 },
    clGoals: 0,
  };

  const updatedStats: PlayerCareerStats = {
    season: addToStats(current.season, summary),
    allTime: addToStats(current.allTime, summary),
    clGoals: (current.clGoals ?? 0) + summary.playerGoals,
  };

  // Credit goal and assist bonuses
  const contract = state.gameState.career.contract;
  const goalBonus = summary.playerGoals * (contract.bonusPerGoal ?? 0);
  const assistBonus = summary.playerAssists * (contract.bonusPerAssist ?? 0);
  const totalBonus = goalBonus + assistBonus;

  // Instagram: gain followers with CL prestige multiplier (×2)
  const ig = state.gameState.lifestyle?.instagram ?? { followers: 1000, posts: [], weeklyPostDone: false };
  let followersGain = 10 + Math.floor(Math.random() * 20); // base 10-30 per match
  followersGain += summary.playerGoals * 50; // +50 per goal
  followersGain += summary.playerAssists * 25; // +25 per assist
  if (summary.playerRating >= 8) followersGain += 100; // great performance bonus
  if (summary.playerRating >= 9) followersGain += 200; // exceptional bonus
  // Club tier bonus
  const clubTier = state.gameState.career.currentClub.tier;
  if (clubTier === 'big') followersGain *= 3;
  else if (clubTier === 'medium') followersGain *= 1.5;
  followersGain = Math.round(followersGain);
  // Apply CL prestige multiplier
  followersGain *= CL_CONSTANTS.INSTAGRAM_MULTIPLIER;

  useGameStore.setState({
    gameState: {
      ...state.gameState,
      playerCareerStats: updatedStats,
      finance: {
        ...state.gameState.finance,
        balance: state.gameState.finance.balance + totalBonus,
      },
      lifestyle: {
        ...state.gameState.lifestyle,
        instagram: {
          ...ig,
          followers: ig.followers + followersGain,
          weeklyPostDone: false,
        },
      },
    },
  });
}
