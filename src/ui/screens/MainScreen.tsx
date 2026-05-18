/**
 * MainScreen — Écran principal redessiné du jeu.
 *
 * Affiche l'avatar du joueur en haut, la date actuelle, le prochain match,
 * la jauge de fitness, le classement du championnat et les boutons d'action.
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { FitnessBar } from '../components/FitnessBar';
import { StandingsTable } from '../components/StandingsTable';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameStore } from '../../store/gameStore';
import { formatGameDate, getWeekdayName } from '../../utils/formatters';
import { simulateMatch as simMatchOrchestrator } from '../../core/GameLoopOrchestrator';
import { generateBallonDorRanking } from '../../systems/career/BallonDor';
import { generateSeasonObjectives, checkObjectives } from '../../systems/career/SeasonObjectives';
import { createRNG } from '../../utils/random';
import type { PlayerCharacter, LeagueStanding, ScheduledMatch, GameDate } from '../../core/types';

export interface MainScreenProps {
  player: PlayerCharacter;
  standings: LeagueStanding[];
  nextMatch: ScheduledMatch | null;
  currentDate: GameDate;
  trainingAvailable: boolean;
  onAdvanceDay: () => void;
  onSimulateWeek: () => void;
  onTrain: () => void;
  onPhone?: () => void;
  isMatchDay?: boolean;
  playerClubId?: string;
}

/**
 * MainScreen component that can be used standalone with props
 * or wired to the store via MainScreenConnected.
 */
export function MainScreen({
  player,
  standings,
  nextMatch,
  currentDate,
  trainingAvailable,
  onAdvanceDay,
  onSimulateWeek,
  onTrain,
  onPhone,
  isMatchDay = false,
  playerClubId = '',
}: MainScreenProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-background overflow-y-auto pb-20">
      {/* Hero header */}
      <section className="relative px-4" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))' }}>
        <div className="flex items-center gap-3 pb-4">
          <Avatar appearance={player.appearance} size="md" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-text truncate">
              {player.firstName} {player.lastName}
            </h1>
            <p className="text-xs text-text-muted">
              {player.position} • <span className="text-primary-light font-semibold">{player.overallRating}</span> OVR
              {player.injury && player.injury.weeksRemaining > 0 && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  🏥 {player.injury.weeksRemaining}sem
                </span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-surface-light rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: `${player.fitness}%` }} />
              </div>
              <span className="text-[10px] text-text-muted">{player.fitness}%</span>
            </div>
          </div>
          {/* Date + Phone */}
          <div className="flex flex-col items-end gap-1">
            {onPhone && (
              <button
                onClick={onPhone}
                className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center active:scale-90 transition-transform"
              >
                <span className="text-sm">📱</span>
              </button>
            )}
            <div className="text-right">
              <p className="text-[10px] font-medium text-text-muted">{formatGameDate(currentDate)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Next match card */}
      {nextMatch && (
        <section className="px-4 mb-3">
          <div className={`rounded-xl p-3 border ${isMatchDay ? 'bg-secondary/10 border-secondary/40' : 'bg-surface border-surface-light/50'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">
                {isMatchDay ? '🔴 Aujourd\'hui' : 'Prochain'}
              </p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                nextMatch.homeTeam === playerClubId
                  ? 'bg-secondary/20 text-secondary-light'
                  : 'bg-primary/20 text-primary-light'
              }`}>
                {nextMatch.homeTeam === playerClubId ? 'DOM' : 'EXT'}
              </span>
            </div>
            <p className="text-sm font-bold text-text">
              vs {standings.find((s) => s.clubId === (nextMatch.homeTeam === playerClubId ? nextMatch.awayTeam : nextMatch.homeTeam))?.clubName ?? 'Adversaire'}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">
              J{nextMatch.matchday} • {formatGameDate(nextMatch.date)}
            </p>
          </div>
        </section>
      )}

      {/* Action buttons */}
      <section className="px-4 mb-4">
        {isMatchDay ? (
          <button
            onClick={onAdvanceDay}
            className="w-full py-3.5 bg-gradient-to-r from-secondary to-emerald-500 text-white font-bold rounded-xl
                       active:scale-[0.97] transition-all shadow-lg shadow-secondary/20"
          >
            ⚽ Jouer le match
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onAdvanceDay}
              className="py-3 bg-surface text-text font-semibold rounded-xl
                         active:scale-[0.97] transition-all border border-surface-light/50"
            >
              Jour →
            </button>
            <button
              onClick={onSimulateWeek}
              className="py-3 bg-surface text-text font-semibold rounded-xl
                         active:scale-[0.97] transition-all border border-surface-light/50"
            >
              Semaine ⏩
            </button>
            {trainingAvailable && (
              <button
                onClick={onTrain}
                className="col-span-2 py-3 bg-primary/20 text-primary-light font-semibold rounded-xl
                           active:scale-[0.97] transition-all border border-primary/30"
              >
                🏋️ Entraînement
              </button>
            )}
          </div>
        )}
      </section>

      {/* Mini standings */}
      <section className="px-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wide">Classement</h2>
          <p className="text-[10px] text-text-muted">{nextMatch?.competition ?? 'Ligue 1'}</p>
        </div>
        <div className="bg-surface rounded-xl p-2 border border-surface-light/50 max-h-52 overflow-y-auto">
          <StandingsTable
            standings={standings}
            playerClubId={playerClubId}
          />
        </div>
      </section>

      {/* Season objectives widget */}
      <SeasonObjectivesWidget />

      {/* Records widget */}
      <ClubRecordsWidget />

      {/* Ballon d'Or race widget */}
      <BallonDorWidget />
    </div>
  );
}

/**
 * Connected version that reads state from the store and wires
 * actions via the useGameLoop hook.
 */
export function MainScreenConnected() {
  const gameState = useGameStore((s) => s.gameState);
  const { advanceDay, simulateWeek, trainingAvailable } = useGameLoop();
  const setCurrentScreen = useGameStore((s) => s.setCurrentScreen);
  const setPendingMatchConfig = useGameStore((s) => s.setPendingMatchConfig);
  const pendingRestEvent = useGameStore((s) => s.pendingRestEvent);

  // ALL hooks must be at the top, before any conditional returns
  const [injuryAlert, setInjuryAlert] = useState<string | null>(null);
  const [scandalAlert, setScandalAlert] = useState(false);
  const [lifeEvent, setLifeEvent] = useState<{ emoji: string; title: string; description: string; effect?: string; moraleBonus?: number; moneyBonus?: number } | null>(null);

  // Handle rest event choices
  const handleRestFree = () => {
    const state = useGameStore.getState();
    if (!state.gameState) return;
    const newFitness = Math.min(100, state.gameState.player.fitness + 5);
    useGameStore.setState({
      gameState: { ...state.gameState, player: { ...state.gameState.player, fitness: newFitness } },
      pendingRestEvent: false,
      restEventsThisMonth: (state.restEventsThisMonth ?? 0) + 1,
    });
  };

  const handleRestPaid = () => {
    const state = useGameStore.getState();
    if (!state.gameState) return;
    const newFitness = Math.min(100, state.gameState.player.fitness + 10);
    const newBalance = state.gameState.finance.balance - 500;
    useGameStore.setState({
      gameState: {
        ...state.gameState,
        player: { ...state.gameState.player, fitness: newFitness },
        finance: { ...state.gameState.finance, balance: newBalance },
      },
      pendingRestEvent: false,
      restEventsThisMonth: (state.restEventsThisMonth ?? 0) + 1,
    });
  };

  if (!gameState) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-text-muted">Chargement...</p>
      </div>
    );
  }

  // Show rest event popup
  if (pendingRestEvent) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
        <div className="bg-surface rounded-2xl p-6 max-w-sm w-full text-center">
          <p className="text-4xl mb-4">🛌</p>
          <h2 className="text-xl font-bold text-text mb-2">Jour de repos !</h2>
          <p className="text-text-muted text-sm mb-6">
            Tu as l'opportunité de te reposer. Choisis ton option :
          </p>

          <div className="space-y-3">
            <button
              onClick={handleRestFree}
              className="w-full py-4 px-6 bg-surface-light text-text font-semibold rounded-xl
                         hover:bg-surface active:scale-95 transition-all border border-surface-light"
            >
              <p className="font-bold">Repos gratuit</p>
              <p className="text-xs text-text-muted">+5 forme</p>
            </button>

            <button
              onClick={handleRestPaid}
              className="w-full py-4 px-6 bg-primary text-white font-semibold rounded-xl
                         hover:bg-primary-light active:scale-95 transition-all"
            >
              <p className="font-bold">Spa & récupération — 500€</p>
              <p className="text-xs text-white/70">+10 forme</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Life events — random special moments
  if (lifeEvent) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
        <div className="bg-surface rounded-2xl p-6 max-w-sm w-full text-center">
          <p className="text-4xl mb-4">{lifeEvent.emoji}</p>
          <h2 className="text-lg font-bold text-text mb-2">{lifeEvent.title}</h2>
          <p className="text-text-muted text-sm mb-4">{lifeEvent.description}</p>
          {lifeEvent.effect && (
            <p className="text-xs text-green-400 mb-4">{lifeEvent.effect}</p>
          )}
          <button
            onClick={() => {
              // Apply effect
              if (lifeEvent.moraleBonus) {
                const s = useGameStore.getState();
                if (s.gameState) {
                  useGameStore.setState({
                    gameState: { ...s.gameState, player: { ...s.gameState.player, morale: Math.min(100, s.gameState.player.morale + lifeEvent.moraleBonus) } },
                  });
                }
              }
              if (lifeEvent.moneyBonus) {
                const s = useGameStore.getState();
                if (s.gameState) {
                  useGameStore.setState({
                    gameState: { ...s.gameState, finance: { ...s.gameState.finance, balance: s.gameState.finance.balance + lifeEvent.moneyBonus } },
                  });
                }
              }
              setLifeEvent(null);
            }}
            className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl active:scale-95"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  const { player, career, time, leagues } = gameState;
  const isInjured = player.injury !== null && player.injury.weeksRemaining > 0;

  // Check for active scandal (deferred)
  const scandalActive = gameState.social.scandalActive ?? false;
  if (scandalActive && !scandalAlert) {
    setScandalAlert(true);
    setTimeout(() => {
      const s = useGameStore.getState();
      if (s.gameState) {
        useGameStore.setState({ gameState: { ...s.gameState, social: { ...s.gameState.social, scandalActive: false } } });
      }
    }, 0);
  }

  // Show scandal alert popup
  if (scandalAlert) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
        <div className="bg-surface rounded-2xl p-6 max-w-sm w-full text-center">
          <p className="text-4xl mb-4">🔥📰</p>
          <h2 className="text-xl font-bold text-red-400 mb-2">SCANDALE !</h2>
          <p className="text-text-muted text-sm mb-3">
            Tes déclarations controversées ont provoqué un bad buzz massif !
          </p>
          <div className="bg-red-500/10 rounded-xl p-3 mb-4 text-left space-y-1">
            <p className="text-xs text-red-400">📉 Popularité -15</p>
            <p className="text-xs text-red-400">📉 Réputation -20</p>
            <p className="text-xs text-red-400">📉 Relation coach -10</p>
            <p className="text-xs text-red-400">💔 Perte d'un contrat de sponsoring</p>
          </div>
          <p className="text-xs text-text-muted mb-4">
            Fais attention à tes déclarations en interview !
          </p>
          <button
            onClick={() => setScandalAlert(false)}
            className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl active:scale-95 transition-all"
          >
            Compris...
          </button>
        </div>
      </div>
    );
  }

  // Show injury alert popup
  if (injuryAlert) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
        <div className="bg-surface rounded-2xl p-6 max-w-sm w-full text-center">
          <p className="text-4xl mb-4">🏥</p>
          <h2 className="text-xl font-bold text-red-400 mb-2">Blessure !</h2>
          <p className="text-text-muted text-sm mb-6">{injuryAlert}</p>
          <button
            onClick={() => setInjuryAlert(null)}
            className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-xl active:scale-95 transition-all"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  // Get standings for the player's championship
  const playerLeague = leagues.find(
    (l) => l.division.country === career.currentClub.country
  );
  const standings = playerLeague?.standings ?? [];

  // Calculate next match from the schedule based on current matchday
  const playerClubId = career.currentClub.id;
  const schedule = playerLeague?.schedule ?? [];
  const nextMatch = schedule.find(
    (m) => m.matchday > career.matchday &&
      (m.homeTeam === playerClubId || m.awayTeam === playerClubId)
  ) ?? null;

  // Detect end of season: matchday 34 completed and no more matches
  const isSeasonOver = career.matchday >= 34 && nextMatch === null;
  if (isSeasonOver) {
    // Navigate to season end screen
    setCurrentScreen('season-end');
    return null;
  }

  // Check if TODAY is a match day (compare current date with next match date)
  const isMatchDay = nextMatch !== null &&
    time.currentDate.day === nextMatch.date.day &&
    time.currentDate.month === nextMatch.date.month &&
    time.currentDate.year === nextMatch.date.year;

  // Build match config from the next match in the schedule
  const buildMatchConfig = () => {
    if (!nextMatch) return;
    const isHome = nextMatch.homeTeam === playerClubId;
    const opponentId = isHome ? nextMatch.awayTeam : nextMatch.homeTeam;

    // Find opponent club data from standings
    const opponentStanding = standings.find((s) => s.clubId === opponentId);
    const opponentClub = {
      id: opponentId,
      name: opponentStanding?.clubName ?? opponentId,
      country: career.currentClub.country,
      division: career.currentClub.division,
      tier: 'medium' as const,
      squad: [],
      finances: { budget: 0, wageBill: 0 },
      stadium: '',
      colors: { primary: '#000', secondary: '#fff' },
    };

    const homeTeam = isHome ? career.currentClub : opponentClub;
    const awayTeam = isHome ? opponentClub : career.currentClub;

    setPendingMatchConfig({
      homeTeam,
      awayTeam,
      playerCharacter: player,
      competition: nextMatch.competition,
      matchday: nextMatch.matchday,
    });
  };

  const handleMatchDay = () => {
    try {
      if (isInjured) {
        // Player is injured — auto-simulate the match without them
        buildMatchConfig();
        const config = useGameStore.getState().ui.pendingMatchConfig;
        if (config) {
          const state = useGameStore.getState();
          if (state.gameState) {
            const rng = createRNG(Date.now());
            const { newState } = simMatchOrchestrator(state.gameState, config, rng);
            useGameStore.setState({ gameState: newState });
            setPendingMatchConfig(null);
          }
        }
        setInjuryAlert(`Tu es blessé (${getInjuryTypeName(player.injury!.type)}) et ne peux pas jouer. Le match a été simulé sans toi.`);
        return;
      }
      buildMatchConfig();
      setCurrentScreen('match-choice');
    } catch (e) {
      console.error('handleMatchDay error:', e);
    }
  };

  const handleAdvanceDay = () => {
    try {
      if (isMatchDay) {
        handleMatchDay();
        return;
      }
      const result = advanceDay();
      if (result) {
        // Check if injury occurred during this day
        if (result.injuryOccurred) {
          const freshState = useGameStore.getState().gameState;
          if (freshState?.player.injury) {
            setInjuryAlert(
              `Tu t'es blessé ! ${getInjuryTypeName(freshState.player.injury.type)} (${freshState.player.injury.severity === 'minor' ? 'légère' : freshState.player.injury.severity === 'moderate' ? 'modérée' : 'grave'}) — ${freshState.player.injury.weeksRemaining} semaine(s) d'absence.`
            );
          }
          return;
        }
        if (result.isMatchDay && result.matchConfig) {
          // Check if injured before going to match
          const freshState = useGameStore.getState().gameState;
          if (freshState?.player.injury && freshState.player.injury.weeksRemaining > 0) {
            // Auto-simulate
            const rng = createRNG(Date.now());
            const { newState } = simMatchOrchestrator(freshState, result.matchConfig, rng);
            useGameStore.setState({ gameState: newState });
            setInjuryAlert(`Jour de match mais tu es blessé. Le match a été simulé sans toi.`);
            return;
          }
          setPendingMatchConfig(result.matchConfig);
          setCurrentScreen('match-choice');
        }
      }
    } catch (e) {
      console.error('handleAdvanceDay error:', e);
      alert('Erreur: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleTrain = () => {
    setCurrentScreen('training');
  };

  const handleSimulateWeek = () => {
    // Wrap simulateWeek to handle injuries during simulation
    try {
      const result = simulateWeek();

      // After simulation, check if we stopped on a match day while injured
      const freshState = useGameStore.getState().gameState;
      if (freshState) {
        const freshIsInjured = freshState.player.injury !== null && freshState.player.injury.weeksRemaining > 0;

        // Check if we're now on a match day
        const freshPlayerLeague = freshState.leagues.find(
          (l) => l.division.country === freshState.career.currentClub.country
        );
        const freshSchedule = freshPlayerLeague?.schedule ?? [];
        const freshClubId = freshState.career.currentClub.id;
        const freshNextMatch = freshSchedule.find(
          (m) => m.matchday > freshState.career.matchday &&
            (m.homeTeam === freshClubId || m.awayTeam === freshClubId)
        );
        const freshIsMatchDay = freshNextMatch !== null &&
          freshState.time.currentDate.day === freshNextMatch?.date.day &&
          freshState.time.currentDate.month === freshNextMatch?.date.month &&
          freshState.time.currentDate.year === freshNextMatch?.date.year;

        if (freshIsMatchDay && freshIsInjured && freshNextMatch) {
          // Auto-simulate the match
          const opponentId = freshNextMatch.homeTeam === freshClubId ? freshNextMatch.awayTeam : freshNextMatch.homeTeam;
          const opponentStanding = (freshPlayerLeague?.standings ?? []).find((s) => s.clubId === opponentId);
          const opponentClub = {
            id: opponentId,
            name: opponentStanding?.clubName ?? opponentId,
            country: freshState.career.currentClub.country,
            division: freshState.career.currentClub.division,
            tier: 'medium' as const,
            squad: [],
            finances: { budget: 0, wageBill: 0 },
            stadium: '',
            colors: { primary: '#000', secondary: '#fff' },
          };
          const isHome = freshNextMatch.homeTeam === freshClubId;
          const matchConfig = {
            homeTeam: isHome ? freshState.career.currentClub : opponentClub,
            awayTeam: isHome ? opponentClub : freshState.career.currentClub,
            playerCharacter: freshState.player,
            competition: freshNextMatch.competition,
            matchday: freshNextMatch.matchday,
          };

          const rng = createRNG(Date.now());
          const { newState } = simMatchOrchestrator(freshState, matchConfig, rng);
          useGameStore.setState({ gameState: newState });
          setInjuryAlert(`Jour de match mais tu es blessé. Le match a été simulé sans toi.`);
          return;
        }

        // Check if injury occurred during the week
        if (freshIsInjured && !isInjured) {
          setInjuryAlert(
            `Tu t'es blessé pendant la semaine ! ${getInjuryTypeName(freshState.player.injury!.type)} (${freshState.player.injury!.severity === 'minor' ? 'légère' : freshState.player.injury!.severity === 'moderate' ? 'modérée' : 'grave'}) — ${freshState.player.injury!.weeksRemaining} semaine(s) d'absence.`
          );
        }

        // Random life event (10% chance per week)
        if (!freshIsInjured && Math.random() < 0.10) {
          const events = LIFE_EVENTS;
          const event = events[Math.floor(Math.random() * events.length)];
          setLifeEvent(event);
        }
      }
    } catch (e) {
      console.error('SimulateWeek error:', e);
      alert('Erreur semaine: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <MainScreen
      player={player}
      standings={standings}
      nextMatch={nextMatch}
      currentDate={time.currentDate}
      trainingAvailable={trainingAvailable && !isMatchDay}
      onAdvanceDay={isMatchDay ? handleMatchDay : handleAdvanceDay}
      onSimulateWeek={isMatchDay ? handleMatchDay : handleSimulateWeek}
      onTrain={handleTrain}
      onPhone={() => setCurrentScreen('phone')}
      isMatchDay={isMatchDay}
      playerClubId={playerClubId}
    />
  );
}

/**
 * Helper to derive weekday from a GameDate.
 */
function getWeekday(date: GameDate): number {
  const jsDate = new Date(date.year, date.month - 1, date.day);
  const jsDay = jsDate.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function getInjuryTypeName(type: string): string {
  switch (type) {
    case 'muscle': return 'blessure musculaire';
    case 'ligament': return 'blessure ligamentaire';
    case 'fracture': return 'fracture';
    case 'concussion': return 'commotion';
    case 'fatigue': return 'fatigue intense';
    default: return 'blessure';
  }
}

// ─── Ballon d'Or Widget ──────────────────────────────────────────────────────

function BallonDorWidget() {
  const gameState = useGameStore((s) => s.gameState);
  if (!gameState) return null;

  const rng = createRNG(gameState.career.season * 1000 + gameState.time.currentDate.month);
  const ranking = generateBallonDorRanking(gameState, rng);

  const playerInRanking = ranking.find((c) => c.isPlayer);
  const playerPosition = playerInRanking ? ranking.indexOf(playerInRanking) + 1 : null;
  const top5 = ranking.slice(0, 5);

  return (
    <section className="px-4 pb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-text">🏆 Course au Ballon d'Or</h2>
        <p className="text-xs text-text-muted">Saison {gameState.career.season}</p>
      </div>
      <div className="bg-surface rounded-2xl p-3 border border-surface-light">
        {/* Player position line */}
        {playerPosition && playerPosition <= 30 ? (
          <div className={`rounded-lg px-3 py-1.5 mb-2 ${playerPosition <= 3 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-primary/10 border border-primary/30'}`}>
            <p className="text-xs">
              <span className="font-bold text-primary-light">Toi : {playerPosition}e</span>
              <span className="text-text-muted"> — {playerInRanking!.goals}⚽ {playerInRanking!.assists}🎯 (note {playerInRanking!.rating})</span>
            </p>
          </div>
        ) : (
          <div className="rounded-lg px-3 py-1.5 mb-2 bg-surface-light">
            <p className="text-xs text-text-muted">Tu n'es pas dans le top 30 — continue à performer !</p>
          </div>
        )}

        {/* Top 5 */}
        <div className="space-y-1">
          {top5.map((candidate, idx) => (
            <div
              key={candidate.id}
              className={`flex items-center justify-between py-1 px-2 rounded ${candidate.isPlayer ? 'bg-primary/15' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-muted w-4">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                </span>
                <span className="text-xs">{candidate.country}</span>
                <span className={`text-xs ${candidate.isPlayer ? 'text-primary-light font-bold' : 'text-text'}`}>
                  {candidate.name}
                </span>
              </div>
              <span className="text-[10px] text-text-muted">{candidate.goals}⚽ {candidate.assists}🎯</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Season Objectives Widget ────────────────────────────────────────────────

function SeasonObjectivesWidget() {
  const gameState = useGameStore((s) => s.gameState);
  if (!gameState) return null;

  // Get or generate objectives (don't write to state during render)
  let objectives = gameState.seasonObjectives;
  if (!objectives) {
    const rng = createRNG(gameState.career.season * 5555);
    objectives = generateSeasonObjectives(
      gameState.player.overallRating,
      gameState.career.currentClub.tier,
      rng
    );
  }

  // Check progress
  const seasonStats = gameState.playerCareerStats?.season;
  const avgRating = seasonStats && seasonStats.matchesPlayed > 0
    ? seasonStats.totalRating / seasonStats.matchesPlayed
    : 0;

  const updated = checkObjectives(
    objectives,
    seasonStats?.goals ?? 0,
    seasonStats?.assists ?? 0,
    avgRating,
    seasonStats?.matchesPlayed ?? 0
  );

  // Save objectives to state only if not yet saved (via effect-like pattern)
  if (!gameState.seasonObjectives) {
    // Defer the state update to avoid render loop
    setTimeout(() => {
      const s = useGameStore.getState();
      if (s.gameState && !s.gameState.seasonObjectives) {
        useGameStore.setState({ gameState: { ...s.gameState, seasonObjectives: objectives } });
      }
    }, 0);
  }

  // Update if any objective was newly completed (deferred to avoid render loop)
  const newlyCompleted = updated.objectives.filter((o) => o.completed).length > objectives.objectives.filter((o) => o.completed).length;
  if (newlyCompleted) {
    setTimeout(() => {
      const s = useGameStore.getState();
      if (!s.gameState) return;
      const bonus = updated.bonusEarned - (s.gameState.seasonObjectives?.bonusEarned ?? 0);
      if (bonus > 0) {
        useGameStore.setState({
          gameState: { ...s.gameState, seasonObjectives: updated, finance: { ...s.gameState.finance, balance: s.gameState.finance.balance + bonus } },
        });
      } else {
        useGameStore.setState({ gameState: { ...s.gameState, seasonObjectives: updated } });
      }
    }, 0);
  }

  const completedCount = updated.objectives.filter((o) => o.completed).length;
  const totalCount = updated.objectives.length;

  const getProgress = (obj: typeof updated.objectives[0]): number => {
    switch (obj.type) {
      case 'goals': return Math.min(100, ((seasonStats?.goals ?? 0) / obj.target) * 100);
      case 'assists': return Math.min(100, ((seasonStats?.assists ?? 0) / obj.target) * 100);
      case 'rating': return Math.min(100, (avgRating / obj.target) * 100);
      case 'matches': return Math.min(100, ((seasonStats?.matchesPlayed ?? 0) / obj.target) * 100);
    }
  };

  const getCurrent = (obj: typeof updated.objectives[0]): string => {
    switch (obj.type) {
      case 'goals': return `${seasonStats?.goals ?? 0}/${obj.target}`;
      case 'assists': return `${seasonStats?.assists ?? 0}/${obj.target}`;
      case 'rating': return `${avgRating.toFixed(1)}/${obj.target}`;
      case 'matches': return `${seasonStats?.matchesPlayed ?? 0}/${obj.target}`;
    }
  };

  return (
    <section className="px-4 pb-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-text">🎯 Objectifs du coach</h2>
        <span className="text-xs text-text-muted">{completedCount}/{totalCount}</span>
      </div>
      <div className="bg-surface rounded-2xl p-3 border border-surface-light space-y-2">
        {updated.objectives.map((obj) => (
          <div key={obj.id} className="flex items-center gap-2">
            <span className="text-sm">{obj.completed ? '✅' : '⬜'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-xs ${obj.completed ? 'text-green-400 line-through' : 'text-text'}`}>
                  {obj.description}
                </p>
                <span className="text-[10px] text-text-muted ml-1">{getCurrent(obj)}</span>
              </div>
              <div className="h-1 bg-surface-light rounded-full overflow-hidden mt-0.5">
                <div
                  className={`h-full rounded-full transition-all ${obj.completed ? 'bg-green-500' : 'bg-primary'}`}
                  style={{ width: `${getProgress(obj)}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-green-400 font-bold w-10 text-right">
              {obj.completed ? '✓' : `${(obj.reward / 1000).toFixed(0)}K€`}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Life Events Data ────────────────────────────────────────────────────────

const LIFE_EVENTS = [
  { emoji: '🎂', title: 'Anniversaire !', description: 'Joyeux anniversaire ! Tes proches t\'ont organisé une fête surprise.', effect: '+10 moral', moraleBonus: 10 },
  { emoji: '🎄', title: 'Fêtes de fin d\'année', description: 'Noël en famille, un moment de bonheur.', effect: '+8 moral', moraleBonus: 8 },
  { emoji: '🎁', title: 'Cadeau d\'un fan', description: 'Un fan t\'a envoyé un cadeau personnalisé au centre d\'entraînement.', effect: '+5 moral', moraleBonus: 5 },
  { emoji: '👨‍👩‍👦', title: 'Visite de la famille', description: 'Ta famille est venue te voir jouer ce week-end.', effect: '+8 moral', moraleBonus: 8 },
  { emoji: '🏆', title: 'Récompense du club', description: 'Le club t\'a remis un prix pour ton implication.', effect: '+5 moral, +5 000€', moraleBonus: 5, moneyBonus: 5000 },
  { emoji: '📸', title: 'Shooting photo', description: 'Séance photo pour un magazine sportif.', effect: '+3 moral, +2 000€', moraleBonus: 3, moneyBonus: 2000 },
  { emoji: '🎮', title: 'Soirée gaming', description: 'Soirée jeux vidéo avec les coéquipiers.', effect: '+5 moral', moraleBonus: 5 },
  { emoji: '🍽️', title: 'Dîner d\'équipe', description: 'Le capitaine a organisé un dîner d\'équipe.', effect: '+6 moral', moraleBonus: 6 },
  { emoji: '🚗', title: 'Road trip', description: 'Petit road trip le jour de repos avec des amis.', effect: '+7 moral', moraleBonus: 7 },
  { emoji: '📺', title: 'Passage TV', description: 'Tu es invité sur un plateau TV pour parler de ta saison.', effect: '+3 moral, +3 000€', moraleBonus: 3, moneyBonus: 3000 },
  { emoji: '💰', title: 'Prime exceptionnelle', description: 'Le club te verse une prime pour tes performances.', effect: '+10 000€', moneyBonus: 10000 },
  { emoji: '⚠️', title: 'Amende fiscale', description: 'Contrôle fiscal... Tu dois payer une amende.', effect: '-5 000€', moneyBonus: -5000 },
  { emoji: '🚨', title: 'Cambriolage', description: 'Ton domicile a été cambriolé pendant un déplacement.', effect: '-10 000€, -5 moral', moraleBonus: -5, moneyBonus: -10000 },
  { emoji: '🤕', title: 'Accident de voiture', description: 'Petit accrochage en voiture. Plus de peur que de mal.', effect: '-3 moral', moraleBonus: -3 },
  { emoji: '🌟', title: 'Fan day', description: 'Journée avec les jeunes du centre de formation. Inspirant !', effect: '+5 moral', moraleBonus: 5 },
];

// ─── Club Records Widget ─────────────────────────────────────────────────────

function ClubRecordsWidget() {
  const gameState = useGameStore((s) => s.gameState);
  if (!gameState) return null;

  const seasonStats = gameState.playerCareerStats?.season;
  if (!seasonStats || seasonStats.matchesPlayed < 5) return null;

  // Club records (based on tier — bigger clubs have higher records to beat)
  const tier = gameState.career.currentClub.tier;
  const clubRecords = {
    goals: tier === 'big' ? 25 : tier === 'medium' ? 18 : 12,
    assists: tier === 'big' ? 15 : tier === 'medium' ? 10 : 7,
    rating: tier === 'big' ? 7.8 : tier === 'medium' ? 7.5 : 7.2,
  };

  const avgRating = seasonStats.matchesPlayed > 0 ? seasonStats.totalRating / seasonStats.matchesPlayed : 0;

  const records = [
    { label: 'Record buts du club', current: seasonStats.goals, record: clubRecords.goals, emoji: '⚽', beaten: seasonStats.goals >= clubRecords.goals },
    { label: 'Record passes D.', current: seasonStats.assists, record: clubRecords.assists, emoji: '🎯', beaten: seasonStats.assists >= clubRecords.assists },
    { label: 'Meilleure note moy.', current: Math.round(avgRating * 10) / 10, record: clubRecords.rating, emoji: '⭐', beaten: avgRating >= clubRecords.rating },
  ];

  const anyBeaten = records.some((r) => r.beaten);
  if (!anyBeaten && seasonStats.goals < clubRecords.goals * 0.5) return null; // Don't show if far from records

  return (
    <section className="px-4 pb-3">
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="text-xs font-bold text-text-muted uppercase tracking-wide">Records du club</h2>
      </div>
      <div className="bg-surface rounded-xl p-2.5 border border-surface-light/50 space-y-1.5">
        {records.map((rec) => (
          <div key={rec.label} className="flex items-center gap-2">
            <span className="text-sm">{rec.beaten ? '🏅' : rec.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-[10px] ${rec.beaten ? 'text-yellow-400 font-bold' : 'text-text-muted'}`}>
                  {rec.label}
                </p>
                <span className="text-[10px] text-text-muted">{rec.current}/{rec.record}</span>
              </div>
              <div className="h-1 bg-surface-light rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${rec.beaten ? 'bg-yellow-500' : 'bg-text-muted/30'}`}
                  style={{ width: `${Math.min(100, (Number(rec.current) / Number(rec.record)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
