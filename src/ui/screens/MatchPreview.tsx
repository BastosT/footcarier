/**
 * MatchPreview - Écran pré-match avec composition et stats comparatives.
 */

import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';

export function MatchPreview() {
  const navigate = useNavigation((s) => s.navigate);
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) return null;

  const { career, player } = gameState;
  const nextMatch = gameState.time.schedule.nextMatch;
  const isInjured = player.injury !== null && player.injury.weeksRemaining > 0;

  return (
    <div className="min-h-dvh flex flex-col bg-background p-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">⚽ Pré-match</h1>
        <button onClick={() => navigate('dashboard')} className="text-primary-light">← Retour</button>
      </header>

      {!nextMatch ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted">Aucun match programmé</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md text-center">
            <p className="text-sm text-text-muted mb-4">{nextMatch.competition} — Journée {nextMatch.matchday}</p>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-lg font-bold text-text">{nextMatch.homeTeam}</p>
                <p className="text-xs text-text-muted">Domicile</p>
              </div>
              <p className="text-2xl font-bold text-text-muted mx-4">VS</p>
              <div className="text-center flex-1">
                <p className="text-lg font-bold text-text">{nextMatch.awayTeam}</p>
                <p className="text-xs text-text-muted">Extérieur</p>
              </div>
            </div>
          </div>

          {isInjured ? (
            <div className="mt-8 bg-red-500/15 border border-red-500/40 rounded-xl p-4 text-center max-w-md w-full">
              <p className="text-lg mb-1">🏥</p>
              <p className="text-sm font-bold text-red-400">Tu es blessé !</p>
              <p className="text-xs text-text-muted mt-1">
                {player.injury!.type === 'muscle' ? 'Blessure musculaire' :
                 player.injury!.type === 'ligament' ? 'Blessure ligamentaire' :
                 player.injury!.type === 'fracture' ? 'Fracture' :
                 player.injury!.type === 'concussion' ? 'Commotion' : 'Fatigue intense'}
                {' — '}{player.injury!.weeksRemaining} semaine{player.injury!.weeksRemaining > 1 ? 's' : ''} d'absence
              </p>
              <p className="text-xs text-text-muted mt-2">Tu ne peux pas jouer ce match. Simule la semaine pour avancer.</p>
            </div>
          ) : (
            <button
              onClick={() => navigate('match')}
              className="mt-8 py-4 px-8 bg-secondary text-white font-semibold rounded-xl
                         hover:bg-secondary-light active:scale-95 transition-all text-lg"
            >
              Jouer le match 🎮
            </button>
          )}
        </div>
      )}
    </div>
  );
}
