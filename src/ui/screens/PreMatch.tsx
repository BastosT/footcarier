/**
 * PreMatch — Écran pré-match affiché quand le joueur choisit de jouer le match.
 *
 * Affiche :
 * - Les informations des deux équipes (nom + note moyenne)
 * - Le discours du coach (CoachSpeech)
 * - La fitness et la note globale du joueur
 * - Un bouton "Jouer" pour lancer le match interactif
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';
import { CoachSpeech } from '../components/CoachSpeech';
import { FitnessBar } from '../components/FitnessBar';
import type { Club } from '../../core/types';

/**
 * Calculates the average overall rating of a club's squad.
 */
function getAverageRating(club: Club): number {
  if (club.squad.length === 0) return 0;
  const total = club.squad.reduce((sum, p) => sum + p.overallRating, 0);
  return Math.round(total / club.squad.length);
}

/**
 * Finds a club name by ID from the league standings data.
 */
function findClubName(
  leagues: { standings: { clubId: string; clubName: string }[] }[],
  clubId: string
): string | undefined {
  for (const league of leagues) {
    const standing = league.standings.find((s) => s.clubId === clubId);
    if (standing) return standing.clubName;
  }
  return undefined;
}

export function PreMatch() {
  const { goToScreen, goHome } = useNavigation();
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) return null;

  const { player, career, social, time } = gameState;
  const nextMatch = time.schedule.nextMatch;

  if (!nextMatch) {
    return (
      <div className="min-h-dvh flex flex-col bg-background p-4">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text">⚽ Pré-match</h1>
          <button onClick={goHome} className="text-primary-light">
            ← Retour
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted">Aucun match programmé</p>
        </div>
      </div>
    );
  }

  // Determine home/away teams from the match config
  const isPlayerHome = career.currentClub.id === nextMatch.homeTeam;
  const playerClub = career.currentClub;

  // Find opponent name from standings data
  const opponentId = isPlayerHome ? nextMatch.awayTeam : nextMatch.homeTeam;
  const opponentName = findClubName(gameState.leagues, opponentId) ?? opponentId;

  const homeTeamName = isPlayerHome ? playerClub.name : opponentName;
  const awayTeamName = isPlayerHome ? opponentName : playerClub.name;

  const playerAvgRating = getAverageRating(playerClub);
  const homeAvgRating = isPlayerHome ? playerAvgRating : 70;
  const awayAvgRating = isPlayerHome ? 70 : playerAvgRating;

  // Get player's league position for coach speech
  const playerLeague = gameState.leagues.find(
    (l) => l.division.country === playerClub.country
  );
  const playerPosition = playerLeague?.standings.find(
    (s) => s.clubId === playerClub.id
  )?.position ?? 9;

  return (
    <div className="min-h-dvh flex flex-col bg-background p-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">⚽ Pré-match</h1>
        <button onClick={goHome} className="text-primary-light">
          ← Retour
        </button>
      </header>

      {/* Match info — Req 7.1: both teams info */}
      <div className="bg-surface rounded-xl p-4 mb-4">
        <p className="text-xs text-text-muted text-center mb-4">
          {nextMatch.competition} — Journée {nextMatch.matchday}
        </p>

        {/* Teams comparison */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-text">{homeTeamName}</p>
            <p className="text-xs text-text-muted">Domicile</p>
            <p className="text-xl font-bold text-primary-light mt-1">{homeAvgRating}</p>
            <p className="text-xs text-text-muted">Note moy.</p>
          </div>

          <p className="text-2xl font-bold text-text-muted mx-4">VS</p>

          <div className="text-center flex-1">
            <p className="text-lg font-bold text-text">{awayTeamName}</p>
            <p className="text-xs text-text-muted">Extérieur</p>
            <p className="text-xl font-bold text-primary-light mt-1">{awayAvgRating}</p>
            <p className="text-xs text-text-muted">Note moy.</p>
          </div>
        </div>
      </div>

      {/* Coach Speech — Req 7.2 */}
      <div className="mb-4">
        <CoachSpeech
          matchday={nextMatch.matchday}
          position={playerPosition}
          coachRelation={social.coachRelation}
        />
      </div>

      {/* Player info: Fitness + Rating — Req 7.3 */}
      <div className="bg-surface rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-text mb-3">Votre état</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Fitness */}
          <div>
            <FitnessBar fitness={player.fitness} label="Fitness" />
          </div>

          {/* Overall Rating */}
          <div>
            <p className="text-xs text-text-muted mb-1">Note globale</p>
            <p className="text-3xl font-bold text-primary-light">{player.overallRating}</p>
          </div>
        </div>
      </div>

      {/* Confirm button — Req 7.4 */}
      <div className="mt-6">
        <button
          onClick={() => goToScreen('match-play')}
          className="w-full py-4 px-8 bg-secondary text-white font-semibold rounded-xl
                     hover:bg-secondary-light active:scale-95 transition-all text-lg"
        >
          Jouer 🎮
        </button>
      </div>
    </div>
  );
}
