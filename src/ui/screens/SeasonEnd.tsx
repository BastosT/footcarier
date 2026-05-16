/**
 * SeasonEnd — Écran de fin de saison avec récapitulatif et cérémonie des récompenses.
 * Affiche : champion, meilleur buteur, meilleur passeur, équipe type, puis passage à la saison suivante.
 */

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useNavigation } from '../hooks/useNavigation';
import { generateSeasonSchedule } from '../../systems/league/LeagueEngine';
import { clubsByCountry } from '../../data/clubs/index';
import { formatCurrency } from '../../utils/formatters';
import type { LeagueState, LeagueStanding, TopScorer, Country, Division, ScheduledMatch } from '../../core/types';

type CeremonyStep = 'recap' | 'champion' | 'topscorer' | 'bestxi' | 'player' | 'next';

export function SeasonEnd() {
  const { goToScreen } = useNavigation();
  const gameState = useGameStore((s) => s.gameState);
  const [step, setStep] = useState<CeremonyStep>('recap');

  if (!gameState) return null;

  const { career, player, leagues } = gameState;
  const playerLeague = leagues.find(
    (l) => l.division.country === career.currentClub.country && l.division.level === 1
  );

  const standings = playerLeague?.standings ?? [];
  const topScorers = playerLeague?.topScorers ?? [];
  const champion = standings[0];
  const playerStanding = standings.find((s) => s.clubId === career.currentClub.id);
  const playerPosition = playerStanding?.position ?? 0;

  // Player season stats
  const seasonStats = gameState.playerCareerStats?.season;

  // Find top scorer and top assister
  const topScorer = topScorers[0];
  // Check if player is in top scorers
  const playerInTopScorers = topScorers.find(
    (s) => s.playerName === `${player.firstName} ${player.lastName}` || s.playerId === player.id
  );

  const handleNextSeason = () => {
    const state = useGameStore.getState();
    if (!state.gameState) return;

    const currentSeason = state.gameState.career.season;
    const newSeason = currentSeason + 1;
    const newYear = state.gameState.time.currentDate.year + 1;

    // Generate new schedules for all leagues
    const newLeagues: LeagueState[] = state.gameState.leagues.map((league) => {
      const country = league.division.country as Country;
      let clubs = clubsByCountry[country].slice(0, 18);

      // Make sure player's club is in the league
      if (country === career.currentClub.country) {
        const hasPlayerClub = clubs.some((c) => c.id === career.currentClub.id);
        if (!hasPlayerClub) {
          clubs = [career.currentClub, ...clubs.slice(0, 17)];
        }
      }

      let schedule: ScheduledMatch[] = [];
      if (clubs.length === 18) {
        try {
          schedule = generateSeasonSchedule(clubs);
          // Update year in schedule dates
          schedule = schedule.map((m) => ({
            ...m,
            date: { ...m.date, year: newYear },
          }));
        } catch { schedule = []; }
      }

      return {
        division: league.division,
        standings: clubs.map((c, idx) => ({
          clubId: c.id,
          clubName: c.name,
          played: 0, won: 0, drawn: 0, lost: 0,
          goalsFor: 0, goalsAgainst: 0, points: 0,
          position: idx + 1,
        })),
        results: [],
        season: newSeason,
        topScorers: [],
        schedule,
      };
    });

    // Reset season stats, keep career stats — archive current season first
    const currentSeasonStats = state.gameState.playerCareerStats?.season ?? { matchesPlayed: 0, goals: 0, assists: 0, shots: 0, dribbles: 0, tackles: 0, avgRating: 0, totalRating: 0, cleanSheets: 0 };
    const existingHistory = state.gameState.playerCareerStats?.seasonHistory ?? [];

    const seasonEntry = {
      season: currentSeason,
      clubName: state.gameState.career.currentClub.name,
      clubId: state.gameState.career.currentClub.id,
      goals: currentSeasonStats.goals,
      assists: currentSeasonStats.assists,
      matchesPlayed: currentSeasonStats.matchesPlayed,
      avgRating: currentSeasonStats.matchesPlayed > 0
        ? Math.round((currentSeasonStats.totalRating / currentSeasonStats.matchesPlayed) * 10) / 10
        : 0,
    };

    const newPlayerCareerStats = {
      season: { matchesPlayed: 0, goals: 0, assists: 0, shots: 0, dribbles: 0, tackles: 0, avgRating: 0, totalRating: 0, cleanSheets: 0 },
      allTime: state.gameState.playerCareerStats?.allTime ?? { matchesPlayed: 0, goals: 0, assists: 0, shots: 0, dribbles: 0, tackles: 0, avgRating: 0, totalRating: 0, cleanSheets: 0 },
      clGoals: state.gameState.playerCareerStats?.clGoals ?? 0,
      seasonHistory: [...existingHistory, seasonEntry],
    };

    // Age the player by 1 year
    const newAge = state.gameState.player.age + 1;

    // Decrease contract remaining
    const newSeasonsRemaining = Math.max(0, state.gameState.career.contract.seasonsRemaining - 1);

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        player: { ...state.gameState.player, age: newAge, fitness: 100, morale: 70 },
        career: {
          ...state.gameState.career,
          season: newSeason,
          matchday: 0,
          contract: { ...state.gameState.career.contract, seasonsRemaining: newSeasonsRemaining },
        },
        time: {
          ...state.gameState.time,
          currentDate: { day: 8, month: 8, year: newYear },
          weekday: 3,
          season: newSeason,
        },
        leagues: newLeagues,
        social: { ...state.gameState.social, teamMorale: 60 },
        playerCareerStats: newPlayerCareerStats,
      },
      restEventsThisMonth: 0,
      lastWellnessWeek: 0,
    });

    goToScreen('main');
  };

  // ─── Render Steps ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh flex flex-col bg-background p-4 overflow-y-auto">
      {step === 'recap' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-5xl mb-4">🏁</p>
          <h1 className="text-2xl font-bold text-text mb-2">Fin de saison {career.season}</h1>
          <p className="text-text-muted mb-6">{playerLeague?.division.name ?? 'Championnat'}</p>

          <div className="bg-surface rounded-2xl p-4 w-full max-w-sm mb-6">
            <p className="text-sm text-text-muted mb-1">Ton club</p>
            <p className="text-lg font-bold text-text">{career.currentClub.name}</p>
            <p className="text-3xl font-black text-primary-light mt-2">{playerPosition}e</p>
            <p className="text-xs text-text-muted">au classement final</p>
          </div>

          {seasonStats && (
            <div className="bg-surface rounded-2xl p-4 w-full max-w-sm mb-6">
              <p className="text-sm text-text-muted mb-2">Ta saison</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-text">{seasonStats.matchesPlayed}</p>
                  <p className="text-xs text-text-muted">Matchs</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-text">{seasonStats.goals}</p>
                  <p className="text-xs text-text-muted">Buts</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-text">{seasonStats.assists}</p>
                  <p className="text-xs text-text-muted">Passes D.</p>
                </div>
              </div>
              <p className="text-sm text-text-muted mt-2">Note moy. : <span className="text-primary-light font-bold">{seasonStats.avgRating.toFixed(1)}</span></p>
            </div>
          )}

          <button
            onClick={() => setStep('champion')}
            className="py-3 px-8 bg-primary text-white font-semibold rounded-xl active:scale-95"
          >
            Cérémonie des récompenses →
          </button>
        </div>
      )}

      {step === 'champion' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-5xl mb-4">🏆</p>
          <h2 className="text-xl font-bold text-text mb-2">Champion</h2>
          <p className="text-text-muted mb-4">{playerLeague?.division.name}</p>

          {champion && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-2xl p-6 border border-yellow-500/40 mb-6">
              <p className="text-3xl font-black text-yellow-400">{champion.clubName}</p>
              <p className="text-sm text-text-muted mt-2">{champion.points} pts • {champion.won}V {champion.drawn}N {champion.lost}D</p>
            </div>
          )}

          <button
            onClick={() => setStep('topscorer')}
            className="py-3 px-8 bg-primary text-white font-semibold rounded-xl active:scale-95"
          >
            Suivant →
          </button>
        </div>
      )}

      {step === 'topscorer' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-5xl mb-4">⚽</p>
          <h2 className="text-xl font-bold text-text mb-2">Meilleur Buteur</h2>

          {topScorer && (
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/40 mb-4">
              <p className="text-2xl font-black text-green-400">{topScorer.playerName}</p>
              <p className="text-sm text-text-muted">{topScorer.clubName}</p>
              <p className="text-3xl font-bold text-text mt-2">{topScorer.goals} buts</p>
            </div>
          )}

          {playerInTopScorers && (
            <div className="bg-surface rounded-xl p-3 mb-4">
              <p className="text-sm text-text-muted">Toi : <span className="text-primary-light font-bold">{playerInTopScorers.goals} buts</span> ({topScorers.indexOf(playerInTopScorers) + 1}e)</p>
            </div>
          )}

          <button
            onClick={() => setStep('player')}
            className="py-3 px-8 bg-primary text-white font-semibold rounded-xl active:scale-95"
          >
            Suivant →
          </button>
        </div>
      )}

      {step === 'player' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-5xl mb-4">⭐</p>
          <h2 className="text-xl font-bold text-text mb-2">Tes récompenses</h2>

          <div className="space-y-3 w-full max-w-sm mb-6">
            {playerPosition === 1 && (
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-3">
                <p className="text-yellow-400 font-bold">🏆 Champion !</p>
              </div>
            )}
            {playerPosition <= 3 && playerPosition > 1 && (
              <div className="bg-blue-500/20 border border-blue-500/40 rounded-xl p-3">
                <p className="text-blue-400 font-bold">🥈 Podium ({playerPosition}e)</p>
              </div>
            )}
            {seasonStats && seasonStats.goals >= 15 && (
              <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-3">
                <p className="text-green-400 font-bold">⚽ +15 buts en saison !</p>
              </div>
            )}
            {seasonStats && seasonStats.assists >= 10 && (
              <div className="bg-purple-500/20 border border-purple-500/40 rounded-xl p-3">
                <p className="text-purple-400 font-bold">🎯 +10 passes D. en saison !</p>
              </div>
            )}
            {seasonStats && seasonStats.avgRating >= 7.5 && (
              <div className="bg-primary/20 border border-primary/40 rounded-xl p-3">
                <p className="text-primary-light font-bold">⭐ Note moyenne 7.5+ !</p>
              </div>
            )}
            {(!seasonStats || (playerPosition > 3 && seasonStats.goals < 15 && seasonStats.assists < 10 && seasonStats.avgRating < 7.5)) && (
              <div className="bg-surface rounded-xl p-3">
                <p className="text-text-muted">Continue à progresser la saison prochaine !</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setStep('next')}
            className="py-3 px-8 bg-primary text-white font-semibold rounded-xl active:scale-95"
          >
            Suivant →
          </button>
        </div>
      )}

      {step === 'next' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-5xl mb-4">🔄</p>
          <h2 className="text-xl font-bold text-text mb-2">Nouvelle saison</h2>
          <p className="text-text-muted mb-6">
            Prêt pour la saison {career.season + 1} ?
          </p>

          <div className="bg-surface rounded-2xl p-4 w-full max-w-sm mb-6 text-left">
            <p className="text-sm text-text-muted mb-2">Ce qui change :</p>
            <ul className="space-y-1 text-sm text-text">
              <li>• Âge : {player.age} → {player.age + 1} ans</li>
              <li>• Forme remise à 100%</li>
              <li>• Calendrier régénéré</li>
              <li>• Classements remis à zéro</li>
              <li>• Stats saison remises à zéro</li>
              {career.contract.seasonsRemaining <= 1 && (
                <li className="text-red-400">• ⚠️ Dernière année de contrat !</li>
              )}
            </ul>
          </div>

          <button
            onClick={handleNextSeason}
            className="py-4 px-8 bg-gradient-to-r from-secondary to-green-500 text-white font-bold rounded-2xl
                       active:scale-95 text-lg shadow-lg shadow-secondary/30"
          >
            Commencer la saison {career.season + 1} →
          </button>
        </div>
      )}
    </div>
  );
}
