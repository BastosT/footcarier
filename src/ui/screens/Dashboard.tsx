/**
 * Dashboard - Écran principal de jeu avec navigation et actions.
 */

import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';
import { formatGameDate, getWeekdayName } from '../../utils/formatters';

export function Dashboard() {
  const navigate = useNavigation((s) => s.navigate);
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) {
    return <div className="min-h-dvh flex items-center justify-center bg-background">
      <p className="text-text-muted">Chargement...</p>
    </div>;
  }

  const { time, player, career, finance } = gameState;

  return (
    <div className="min-h-dvh flex flex-col bg-background p-4">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">
              {player.firstName} {player.lastName}
            </h1>
            <p className="text-sm text-text-muted">
              {career.currentClub.name} • {player.position} • OVR {player.overallRating}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-text">{formatGameDate(time.currentDate)}</p>
            <p className="text-xs text-text-muted capitalize">{getWeekdayName(time.weekday)}</p>
          </div>
        </div>
      </header>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-primary-light">{player.overallRating}</p>
          <p className="text-xs text-text-muted">Note</p>
        </div>
        <div className="bg-surface rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-secondary-light">{player.fitness}%</p>
          <p className="text-xs text-text-muted">Forme</p>
        </div>
        <div className="bg-surface rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-accent">{player.morale}%</p>
          <p className="text-xs text-text-muted">Moral</p>
        </div>
      </div>

      {/* Injury banner */}
      {player.injury && (
        <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 mb-4 flex items-center gap-3">
          <span className="text-2xl">🏥</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-400">Blessé — {getInjuryLabel(player.injury.type)}</p>
            <p className="text-xs text-text-muted">
              {player.injury.severity === 'minor' ? 'Légère' : player.injury.severity === 'moderate' ? 'Modérée' : 'Grave'}
              {' • '}{player.injury.weeksRemaining} semaine{player.injury.weeksRemaining > 1 ? 's' : ''} restante{player.injury.weeksRemaining > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Time actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => useGameStore.getState().advanceGameDay()}
          className="flex-1 py-3 px-4 bg-primary text-white font-semibold rounded-xl
                     hover:bg-primary-light active:scale-95 transition-all"
        >
          Jour suivant →
        </button>
        <button
          onClick={() => useGameStore.getState().simulateGameWeek()}
          className="flex-1 py-3 px-4 bg-surface-light text-text font-semibold rounded-xl
                     hover:bg-surface active:scale-95 transition-all border border-surface-light"
        >
          Simuler semaine ⏩
        </button>
      </div>

      {/* Navigation grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        <NavButton label="🏋️ Entraînement" onClick={() => navigate('training')} />
        <NavButton label="💰 Transferts" onClick={() => navigate('transfers')} />
        <NavButton label="📊 Statistiques" onClick={() => navigate('statistics')} />
        <NavButton label="📱 Social" onClick={() => navigate('social-feed')} />
        <NavButton label="🏆 Trophées" onClick={() => navigate('trophy-case')} />
        <NavButton label="📋 Classement" onClick={() => navigate('standings')} />
      </div>
    </div>
  );
}

function NavButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="py-4 px-4 bg-surface rounded-xl text-text font-medium
                 hover:bg-surface-light active:scale-95 transition-all
                 border border-surface-light text-left"
    >
      {label}
    </button>
  );
}

function getInjuryLabel(type: string): string {
  switch (type) {
    case 'muscle': return 'Blessure musculaire';
    case 'ligament': return 'Blessure ligamentaire';
    case 'fracture': return 'Fracture';
    case 'concussion': return 'Commotion';
    case 'fatigue': return 'Fatigue intense';
    default: return 'Blessure';
  }
}
