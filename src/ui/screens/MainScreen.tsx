/**
 * MainScreen — Écran principal redessiné du jeu.
 *
 * Affiche l'avatar du joueur en haut, la date actuelle, le prochain match,
 * la jauge de fitness, le classement du championnat et les boutons d'action.
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { Avatar } from '../components/Avatar';
import { FitnessBar } from '../components/FitnessBar';
import { StandingsTable } from '../components/StandingsTable';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameStore } from '../../store/gameStore';
import { formatGameDate, getWeekdayName } from '../../utils/formatters';
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
      {/* Hero header with gradient */}
      <section className="relative bg-gradient-to-b from-primary/30 to-background pt-8 pb-6 px-4">
        <div className="flex items-center gap-4">
          <Avatar appearance={player.appearance} size="md" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text">
              {player.firstName} {player.lastName}
            </h1>
            <p className="text-sm text-text-muted">
              {player.position} • OVR <span className="text-primary-light font-bold">{player.overallRating}</span>
            </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">🏃 Forme</span>
            <div className="flex-1">
              <FitnessBar fitness={player.fitness} compact />
            </div>
          </div>
          </div>
        </div>
        {/* Date badge + Phone */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {onPhone && (
            <button
              onClick={onPhone}
              className="bg-surface/80 backdrop-blur-sm rounded-lg w-9 h-9 flex items-center justify-center active:scale-95"
            >
              <span className="text-lg">📱</span>
            </button>
          )}
          <div className="bg-surface/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <p className="text-xs font-medium text-text">{formatGameDate(currentDate)}</p>
            <p className="text-[10px] text-text-muted text-center capitalize">{getWeekdayName(getWeekday(currentDate))}</p>
          </div>
        </div>
      </section>

      {/* Next match card */}
      {nextMatch && (
        <section className="px-4 -mt-2 mb-4">
          <div className={`rounded-2xl p-4 border ${isMatchDay ? 'bg-secondary/10 border-secondary/40' : 'bg-surface border-surface-light'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-text-muted">
                {isMatchDay ? '🔴 AUJOURD\'HUI' : 'Prochain match'}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                nextMatch.homeTeam === playerClubId
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {nextMatch.homeTeam === playerClubId ? 'DOM' : 'EXT'}
              </span>
            </div>
            <p className="text-lg font-bold text-text">
              vs {standings.find((s) => s.clubId === (nextMatch.homeTeam === playerClubId ? nextMatch.awayTeam : nextMatch.homeTeam))?.clubName ?? 'Adversaire'}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {nextMatch.competition} • J{nextMatch.matchday} • {formatGameDate(nextMatch.date)}
            </p>
          </div>
        </section>
      )}

      {/* Action buttons */}
      <section className="px-4 mb-4">
        {isMatchDay ? (
          <button
            onClick={onAdvanceDay}
            className="w-full py-4 px-4 bg-gradient-to-r from-secondary to-green-500 text-white font-bold rounded-2xl
                       active:scale-95 transition-all text-lg shadow-lg shadow-secondary/30"
          >
            ⚽ Jouer le match
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onAdvanceDay}
              className="py-3 px-3 bg-primary text-white font-semibold rounded-xl
                         active:scale-95 transition-all text-sm"
            >
              Jour suivant →
            </button>
            <button
              onClick={onSimulateWeek}
              className="py-3 px-3 bg-surface-light text-text font-semibold rounded-xl
                         active:scale-95 transition-all text-sm border border-surface-light"
            >
              Semaine →→
            </button>
            {trainingAvailable && (
              <button
                onClick={onTrain}
                className="col-span-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-xl
                           active:scale-95 transition-all text-sm"
              >
                🏋️ Entraînement disponible
              </button>
            )}
          </div>
        )}
      </section>

      {/* Mini standings */}
      <section className="px-4 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-text">📋 Classement</h2>
          <p className="text-xs text-text-muted">{nextMatch?.competition ?? 'Ligue 1'}</p>
        </div>
        <div className="bg-surface rounded-2xl p-3 border border-surface-light max-h-64 overflow-y-auto">
          <StandingsTable
            standings={standings}
            playerClubId={playerClubId}
          />
        </div>
      </section>
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

  const { player, career, time, leagues } = gameState;

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
    buildMatchConfig();
    setCurrentScreen('match-choice');
  };

  const handleAdvanceDay = () => {
    if (isMatchDay) {
      handleMatchDay();
      return;
    }
    const result = advanceDay();
    if (result && result.isMatchDay && result.matchConfig) {
      setPendingMatchConfig(result.matchConfig);
      setCurrentScreen('match-choice');
    }
  };

  const handleTrain = () => {
    setCurrentScreen('training');
  };

  return (
    <MainScreen
      player={player}
      standings={standings}
      nextMatch={nextMatch}
      currentDate={time.currentDate}
      trainingAvailable={trainingAvailable && !isMatchDay}
      onAdvanceDay={isMatchDay ? handleMatchDay : handleAdvanceDay}
      onSimulateWeek={isMatchDay ? handleMatchDay : simulateWeek}
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
