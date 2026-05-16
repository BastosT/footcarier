/**
 * MatchChoice - Écran de choix entre jouer ou simuler le match.
 * Affiché les jours de match pour permettre au joueur de choisir son mode.
 *
 * Requirements: 6.1
 */

import { useNavigation } from '../hooks/useNavigation';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameStore } from '../../store/gameStore';
import { updateCareerStatsFromMatch } from '../../utils/updateCareerStats';

export function MatchChoice() {
  const { goToScreen } = useNavigation();
  const { simulateMatch } = useGameLoop();
  const gameState = useGameStore((s) => s.gameState);
  const pendingMatchConfig = useGameStore((s) => s.ui.pendingMatchConfig);
  const setPendingMatchConfig = useGameStore((s) => s.setPendingMatchConfig);

  if (!gameState) return null;

  const nextMatch = gameState.time.schedule.nextMatch;

  // Use pendingMatchConfig for display info if nextMatch is not available
  const matchInfo = pendingMatchConfig
    ? {
        competition: pendingMatchConfig.competition,
        matchday: pendingMatchConfig.matchday,
        homeTeam: pendingMatchConfig.homeTeam.name,
        awayTeam: pendingMatchConfig.awayTeam.name,
      }
    : nextMatch
      ? {
          competition: nextMatch.competition,
          matchday: nextMatch.matchday,
          homeTeam: nextMatch.homeTeam,
          awayTeam: nextMatch.awayTeam,
        }
      : null;

  /** Handle "Simuler" — run quick sim, then navigate to post-match */
  const handleSimulate = () => {
    if (pendingMatchConfig) {
      const result = simulateMatch(pendingMatchConfig);

      // Store match summary for PostMatch
      if (result) {
        const summary = {
          homeTeamName: pendingMatchConfig.homeTeam.name,
          awayTeamName: pendingMatchConfig.awayTeam.name,
          homeGoals: result.result.homeGoals,
          awayGoals: result.result.awayGoals,
          isPlayerHome: pendingMatchConfig.homeTeam.id === gameState?.career.currentClub.id,
          playerGoals: result.performance.goals,
          playerAssists: result.performance.assists,
          playerRating: result.performance.rating,
          playerShots: result.performance.shots,
          playerDribbles: result.performance.dribbles,
          playerTackles: result.performance.tackles,
          playerPassAccuracy: result.performance.passAccuracy,
          minutesPlayed: result.performance.minutesPlayed,
        };
        useGameStore.getState().setLastMatchSummary(summary);
        updateCareerStatsFromMatch(summary);
      }

      setPendingMatchConfig(null);
    }
    goToScreen('post-match');
  };

  /** Handle "Jouer" — navigate to pre-match screen */
  const handlePlay = () => {
    // pendingMatchConfig stays available for the PreMatch/MatchPlay flow
    goToScreen('pre-match');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background p-4 overflow-y-auto pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text text-center">⚽ Jour de match</h1>
      </header>

      {/* Match info */}
      {matchInfo && (
        <div className="bg-surface rounded-xl p-6 mb-8 text-center">
          <p className="text-sm text-text-muted mb-4">
            {matchInfo.competition} — Journée {matchInfo.matchday}
          </p>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-text">{matchInfo.homeTeam}</p>
              <p className="text-xs text-text-muted">Domicile</p>
            </div>
            <p className="text-2xl font-bold text-text-muted mx-4">VS</p>
            <div className="text-center flex-1">
              <p className="text-lg font-bold text-text">{matchInfo.awayTeam}</p>
              <p className="text-xs text-text-muted">Extérieur</p>
            </div>
          </div>
        </div>
      )}

      {/* Choice buttons */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <button
          onClick={handlePlay}
          className="w-full max-w-sm py-6 px-8 bg-secondary text-white font-semibold rounded-xl
                     hover:bg-secondary-light active:scale-95 transition-all text-lg
                     flex flex-col items-center gap-2"
        >
          <span className="text-3xl">🎮</span>
          <span>Jouer le match</span>
        </button>

        <button
          onClick={handleSimulate}
          className="w-full max-w-sm py-6 px-8 bg-surface-light text-text font-semibold rounded-xl
                     hover:bg-surface active:scale-95 transition-all text-lg
                     border border-surface-light flex flex-col items-center gap-2"
        >
          <span className="text-3xl">⏩</span>
          <span>Simuler le match</span>
        </button>
      </div>
    </div>
  );
}
