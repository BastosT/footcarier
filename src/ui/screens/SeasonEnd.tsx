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
import { generateBallonDorRanking, generateBestYoungPlayer, type BallonDorCandidate } from '../../systems/career/BallonDor';
import { NationalTeamSystem, type NationalMatchResult, type NationalCompetition } from '../../systems/career/NationalTeam';
import { createRNG } from '../../utils/random';
import type { LeagueState, LeagueStanding, TopScorer, Country, Division, ScheduledMatch } from '../../core/types';

type CeremonyStep = 'recap' | 'champion' | 'topscorer' | 'ballondor' | 'national' | 'bestxi' | 'player' | 'next';

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
          schedule: (() => {
            // Find the player's new league schedule and set the next match
            const playerLeague = newLeagues.find(
              (l) => l.division.country === career.currentClub.country && l.division.level === 1
            );
            const playerSchedule = playerLeague?.schedule ?? [];
            const playerClubId = career.currentClub.id;
            const nextMatch = playerSchedule.find(
              (m) => m.matchday === 1 && (m.homeTeam === playerClubId || m.awayTeam === playerClubId)
            ) ?? null;
            return {
              nextMatch,
              seasonMatches: playerSchedule,
            };
          })(),
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
            onClick={() => setStep('ballondor')}
            className="py-3 px-8 bg-primary text-white font-semibold rounded-xl active:scale-95"
          >
            Suivant →
          </button>
        </div>
      )}

      {step === 'ballondor' && <BallonDorStep gameState={gameState} onNext={() => setStep('national')} />}

      {step === 'national' && <NationalTeamStep gameState={gameState} onNext={() => setStep('player')} />}

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

// ─── Ballon d'Or Step ────────────────────────────────────────────────────────

function BallonDorStep({ gameState, onNext }: { gameState: any; onNext: () => void }) {
  const [subStep, setSubStep] = useState<'ranking' | 'young'>('ranking');

  const rng = createRNG(gameState.career.season * 1000 + gameState.time.currentDate.year);
  const ranking = generateBallonDorRanking(gameState, rng);
  const youngRanking = generateBestYoungPlayer(gameState, createRNG(gameState.career.season * 2000));

  const playerInRanking = ranking.find((c) => c.isPlayer);
  const playerPosition = playerInRanking ? ranking.indexOf(playerInRanking) + 1 : null;

  const playerInYoung = youngRanking.find((c) => c.isPlayer);
  const playerYoungPosition = playerInYoung ? youngRanking.indexOf(playerInYoung) + 1 : null;

  const winner = ranking[0];
  const youngWinner = youngRanking[0];

  if (subStep === 'ranking') {
    return (
      <div className="flex-1 flex flex-col items-center text-center overflow-y-auto pb-6">
        <p className="text-5xl mb-3 mt-4">🏆</p>
        <h2 className="text-xl font-bold text-text mb-1">Ballon d'Or</h2>
        <p className="text-text-muted text-sm mb-4">Saison {gameState.career.season}</p>

        {/* Winner */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-2xl p-4 border border-yellow-500/40 mb-4 w-full max-w-sm">
          <p className="text-xs text-text-muted">🥇 Ballon d'Or</p>
          <p className="text-2xl font-black text-yellow-400">{winner.name}</p>
          <p className="text-sm text-text-muted">{winner.club} • {winner.goals} buts, {winner.assists} PD</p>
        </div>

        {/* Player position */}
        {playerPosition && (
          <div className={`rounded-xl p-3 mb-4 w-full max-w-sm ${playerPosition <= 3 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-surface border border-surface-light'}`}>
            <p className="text-sm text-text-muted">
              Toi : <span className="text-primary-light font-bold">{playerPosition}e</span>
              {' '}({playerInRanking!.goals} buts, {playerInRanking!.assists} PD, note {playerInRanking!.rating})
            </p>
            {playerPosition === 1 && <p className="text-yellow-400 font-bold mt-1">🏆 TU AS GAGNÉ LE BALLON D'OR !</p>}
          </div>
        )}

        {/* Top 10 */}
        <div className="w-full max-w-sm bg-surface rounded-xl p-3 mb-4">
          <h3 className="text-xs font-bold text-text-muted mb-2">Top 10</h3>
          <div className="space-y-1">
            {ranking.slice(0, 10).map((candidate, idx) => (
              <div
                key={candidate.id}
                className={`flex items-center justify-between py-1.5 px-2 rounded ${candidate.isPlayer ? 'bg-primary/15' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-muted w-5">{idx + 1}.</span>
                  <span className="text-xs">{candidate.country}</span>
                  <span className={`text-xs ${candidate.isPlayer ? 'text-primary-light font-bold' : 'text-text'}`}>
                    {candidate.name}
                  </span>
                </div>
                <span className="text-xs text-text-muted">{candidate.goals}⚽ {candidate.assists}🎯</span>
              </div>
            ))}
          </div>
        </div>

        {/* Full ranking 11-30 (collapsed) */}
        {ranking.length > 10 && (
          <details className="w-full max-w-sm bg-surface rounded-xl p-3 mb-4">
            <summary className="text-xs font-bold text-text-muted cursor-pointer">11e - 30e</summary>
            <div className="space-y-1 mt-2">
              {ranking.slice(10, 30).map((candidate, idx) => (
                <div
                  key={candidate.id}
                  className={`flex items-center justify-between py-1 px-2 rounded ${candidate.isPlayer ? 'bg-primary/15' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted w-5">{idx + 11}.</span>
                    <span className="text-xs">{candidate.country}</span>
                    <span className={`text-xs ${candidate.isPlayer ? 'text-primary-light font-bold' : 'text-text-muted'}`}>
                      {candidate.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-text-muted">{candidate.goals}⚽</span>
                </div>
              ))}
            </div>
          </details>
        )}

        <button
          onClick={() => setSubStep('young')}
          className="py-3 px-8 bg-primary text-white font-semibold rounded-xl active:scale-95"
        >
          Meilleur Jeune →
        </button>
      </div>
    );
  }

  // Young player award
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <p className="text-5xl mb-3">🌟</p>
      <h2 className="text-xl font-bold text-text mb-1">Meilleur Jeune</h2>
      <p className="text-text-muted text-sm mb-4">Joueurs de 21 ans et moins</p>

      {/* Winner */}
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl p-4 border border-blue-500/40 mb-4 w-full max-w-sm">
        <p className="text-xs text-text-muted">🥇 Trophée Kopa</p>
        <p className="text-2xl font-black text-blue-400">{youngWinner.name}</p>
        <p className="text-sm text-text-muted">{youngWinner.club} • {youngWinner.age} ans • {youngWinner.goals} buts</p>
      </div>

      {/* Player position if eligible */}
      {playerYoungPosition && (
        <div className={`rounded-xl p-3 mb-4 w-full max-w-sm ${playerYoungPosition === 1 ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-surface border border-surface-light'}`}>
          <p className="text-sm text-text-muted">
            Toi : <span className="text-primary-light font-bold">{playerYoungPosition}e</span>
          </p>
          {playerYoungPosition === 1 && <p className="text-blue-400 font-bold mt-1">🌟 TU AS GAGNÉ LE TROPHÉE KOPA !</p>}
        </div>
      )}
      {!playerInYoung && gameState.player.age > 21 && (
        <div className="bg-surface rounded-xl p-3 mb-4 w-full max-w-sm">
          <p className="text-xs text-text-muted">Tu as plus de 21 ans — non éligible</p>
        </div>
      )}

      {/* Top 5 young */}
      <div className="w-full max-w-sm bg-surface rounded-xl p-3 mb-6">
        <div className="space-y-1">
          {youngRanking.slice(0, 5).map((candidate, idx) => (
            <div
              key={candidate.id}
              className={`flex items-center justify-between py-1.5 px-2 rounded ${candidate.isPlayer ? 'bg-primary/15' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-muted w-5">{idx + 1}.</span>
                <span className={`text-xs ${candidate.isPlayer ? 'text-primary-light font-bold' : 'text-text'}`}>
                  {candidate.name}
                </span>
                <span className="text-[10px] text-text-muted">{candidate.age} ans</span>
              </div>
              <span className="text-xs text-text-muted">{candidate.goals}⚽</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        className="py-3 px-8 bg-primary text-white font-semibold rounded-xl active:scale-95"
      >
        Suivant →
      </button>
    </div>
  );
}

// ─── National Team Step ──────────────────────────────────────────────────────

function NationalTeamStep({ gameState, onNext }: { gameState: any; onNext: () => void }) {
  const year = gameState.time.currentDate.year;
  const competition = NationalTeamSystem.getCompetitionForYear(year);
  const isEligible = NationalTeamSystem.isEligibleForNationalTeam(gameState);
  const country = gameState.player.nationality;
  const team = NationalTeamSystem.NATIONAL_TEAMS[country as keyof typeof NationalTeamSystem.NATIONAL_TEAMS];

  const [results, setResults] = useState<NationalMatchResult[] | null>(null);
  const [simulated, setSimulated] = useState(false);

  const competitionName = competition === 'world_cup' ? 'Coupe du Monde' : 'Euro';
  const competitionEmoji = competition === 'world_cup' ? '🏆' : '⚽';

  // Not a competition year or not eligible
  if (!competition || !isEligible) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-5xl mb-4">🏳️</p>
        <h2 className="text-xl font-bold text-text mb-2">Équipe nationale</h2>
        {!competition ? (
          <p className="text-text-muted text-sm mb-6">Pas de compétition internationale cette année.</p>
        ) : (
          <div className="mb-6">
            <p className="text-text-muted text-sm">Tu n'es pas convoqué pour le {competitionName}.</p>
            <p className="text-xs text-text-muted mt-2">
              Conditions : OVR ≥ 60 (actuel : {gameState.player.overallRating}) + bonnes performances
            </p>
          </div>
        )}
        <button
          onClick={onNext}
          className="py-3 px-8 bg-primary text-white font-semibold rounded-xl active:scale-95"
        >
          Suivant →
        </button>
      </div>
    );
  }

  // Simulate competition
  const handleSimulate = () => {
    const rng = createRNG(year * 7777 + gameState.career.season);
    const competitionResults = NationalTeamSystem.simulateCompetition(gameState, competition, rng);
    setResults(competitionResults);
    setSimulated(true);

    // Update national team stats in game state
    const totalGoals = competitionResults.reduce((sum, r) => sum + r.playerGoals, 0);
    const totalAssists = competitionResults.reduce((sum, r) => sum + r.playerAssists, 0);
    const caps = competitionResults.length;

    const state = useGameStore.getState();
    if (state.gameState) {
      const existing = state.gameState.nationalTeam ?? {
        isConvoked: false, caps: 0, nationalGoals: 0, nationalAssists: 0,
        currentCompetition: null, competitionResults: [], lastConvocationSeason: 0,
      };

      useGameStore.setState({
        gameState: {
          ...state.gameState,
          nationalTeam: {
            ...existing,
            isConvoked: true,
            caps: existing.caps + caps,
            nationalGoals: existing.nationalGoals + totalGoals,
            nationalAssists: existing.nationalAssists + totalAssists,
            currentCompetition: competition,
            competitionResults,
            lastConvocationSeason: gameState.career.season,
          },
        },
      });
    }
  };

  if (!simulated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-5xl mb-4">{competitionEmoji}</p>
        <h2 className="text-xl font-bold text-text mb-2">{competitionName} {year}</h2>
        <p className="text-text-muted text-sm mb-2">Tu es convoqué avec {team?.name ?? 'ton pays'} ! {team?.flag}</p>
        <p className="text-xs text-text-muted mb-6">
          {gameState.player.firstName} {gameState.player.lastName} • OVR {gameState.player.overallRating}
        </p>
        <button
          onClick={handleSimulate}
          className="py-4 px-8 bg-gradient-to-r from-secondary to-green-500 text-white font-bold rounded-2xl active:scale-95 text-lg"
        >
          Jouer la compétition ⚽
        </button>
      </div>
    );
  }

  // Show results
  const lastRound = results![results!.length - 1]?.round ?? '';
  const won = lastRound === 'Finale' && results![results!.length - 1].teamGoals > results![results!.length - 1].opponentGoals;
  const totalPlayerGoals = results!.reduce((sum, r) => sum + r.playerGoals, 0);
  const totalPlayerAssists = results!.reduce((sum, r) => sum + r.playerAssists, 0);

  return (
    <div className="flex-1 flex flex-col items-center text-center overflow-y-auto pb-6">
      <p className="text-5xl mb-3 mt-4">{won ? '🏆' : competitionEmoji}</p>
      <h2 className="text-xl font-bold text-text mb-1">
        {competitionName} {year} — {team?.flag} {team?.name}
      </h2>
      {won && <p className="text-yellow-400 font-bold text-lg mb-2">🏆 CHAMPION !</p>}
      {!won && <p className="text-text-muted text-sm mb-2">Éliminé en {lastRound}</p>}

      {/* Player stats */}
      <div className="bg-surface rounded-xl p-3 mb-4 w-full max-w-sm">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-text">{results!.length}</p>
            <p className="text-xs text-text-muted">Matchs</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-400">{totalPlayerGoals}</p>
            <p className="text-xs text-text-muted">Buts</p>
          </div>
          <div>
            <p className="text-xl font-bold text-blue-400">{totalPlayerAssists}</p>
            <p className="text-xs text-text-muted">Passes D.</p>
          </div>
        </div>
      </div>

      {/* Match results */}
      <div className="w-full max-w-sm space-y-1.5 mb-4">
        {results!.map((match, idx) => {
          const matchWon = match.teamGoals > match.opponentGoals;
          const matchDraw = match.teamGoals === match.opponentGoals;
          return (
            <div key={idx} className={`flex items-center justify-between p-2.5 rounded-lg border ${
              matchWon ? 'border-green-500/30 bg-green-500/5' : matchDraw ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted w-12">{match.round}</span>
                <span className="text-sm">{match.opponentFlag}</span>
                <span className="text-xs text-text">{match.opponent}</span>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold ${matchWon ? 'text-green-400' : matchDraw ? 'text-yellow-400' : 'text-red-400'}`}>
                  {match.teamGoals} - {match.opponentGoals}
                </span>
                {(match.playerGoals > 0 || match.playerAssists > 0) && (
                  <p className="text-[10px] text-text-muted">
                    {match.playerGoals > 0 ? `⚽×${match.playerGoals}` : ''}{match.playerAssists > 0 ? ` 🎯×${match.playerAssists}` : ''}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        className="py-3 px-8 bg-primary text-white font-semibold rounded-xl active:scale-95"
      >
        Suivant →
      </button>
    </div>
  );
}
