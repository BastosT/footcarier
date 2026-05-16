/**
 * TrophyCase - Vitrine de trophées et profil financier.
 */

import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../../utils/formatters';

export function TrophyCase() {
  const navigate = useNavigation((s) => s.navigate);
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) return null;
  const { career, finance } = gameState;

  const trophyEmoji: Record<string, string> = {
    league: '🏆',
    cup: '🏅',
    top_scorer: '⚽',
    best_player: '🌟',
    golden_boot: '👟',
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background p-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">🏆 Trophées & Finances</h1>
        <button onClick={() => navigate('dashboard')} className="text-primary-light">← Retour</button>
      </header>

      {/* Finance summary */}
      <div className="bg-surface rounded-xl p-4 mb-6">
        <h2 className="text-sm text-text-muted mb-2">💰 Finances</h2>
        <p className="text-2xl font-bold text-accent">{formatCurrency(finance.balance)}</p>
        <p className="text-sm text-text-muted mt-1">
          Revenu hebdomadaire : {formatCurrency(finance.weeklyIncome)}
        </p>
      </div>

      {/* Trophies */}
      <h2 className="text-sm text-text-muted mb-3">Palmarès</h2>
      {career.trophies.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">🏆</p>
            <p className="text-text-muted">Aucun trophée pour le moment</p>
            <p className="text-text-muted text-sm mt-1">Continue à progresser !</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {career.trophies.map((trophy) => (
            <div key={trophy.id} className="bg-surface rounded-xl p-4 text-center">
              <p className="text-3xl">{trophyEmoji[trophy.type] ?? '🏆'}</p>
              <p className="text-sm font-medium text-text mt-2">{trophy.competition}</p>
              <p className="text-xs text-text-muted">Saison {trophy.season}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
