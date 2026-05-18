/**
 * Retirement — Écran de fin de carrière avec récap complet.
 */

import { useGameStore } from '../../store/gameStore';
import { useNavigation } from '../hooks/useNavigation';
import { formatCurrency } from '../../utils/formatters';

export function Retirement() {
  const { goToScreen } = useNavigation();
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) return null;

  const { player, career, finance, lifestyle, playerCareerStats } = gameState;
  const allTime = playerCareerStats?.allTime;
  const seasonHistory = playerCareerStats?.seasonHistory ?? [];
  const trophies = career.trophies ?? [];
  const children = lifestyle.relationships?.children ?? [];
  const relationship = lifestyle.relationships?.current;
  const possessions = lifestyle.possessions ?? [];
  const investments = lifestyle.investments ?? [];
  const totalWealth = finance.balance +
    possessions.reduce((s, p) => s + p.price, 0) +
    investments.reduce((s, i) => s + i.currentValue, 0);

  const nationalTeam = gameState.nationalTeam;

  const handleNewGame = () => {
    useGameStore.setState({ gameState: null });
    goToScreen('main-menu');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background overflow-y-auto p-4 pb-20">
      {/* Header */}
      <div className="text-center mb-6 pt-4">
        <p className="text-5xl mb-3">🏁</p>
        <h1 className="text-2xl font-black text-text">Fin de carrière</h1>
        <p className="text-text-muted mt-1">{player.firstName} {player.lastName} prend sa retraite à {player.age} ans</p>
      </div>

      {/* Career summary */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl p-4 mb-4 border border-primary/30">
        <h2 className="text-sm font-bold text-text-muted mb-3">📊 Carrière en chiffres</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-black text-text">{allTime?.matchesPlayed ?? 0}</p>
            <p className="text-[10px] text-text-muted">Matchs</p>
          </div>
          <div>
            <p className="text-2xl font-black text-green-400">{allTime?.goals ?? 0}</p>
            <p className="text-[10px] text-text-muted">Buts</p>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-400">{allTime?.assists ?? 0}</p>
            <p className="text-[10px] text-text-muted">Passes D.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center mt-3">
          <div>
            <p className="text-lg font-bold text-text">{seasonHistory.length + 1}</p>
            <p className="text-[10px] text-text-muted">Saisons pro</p>
          </div>
          <div>
            <p className="text-lg font-bold text-text">{trophies.length}</p>
            <p className="text-[10px] text-text-muted">Trophées</p>
          </div>
        </div>
      </div>

      {/* Clubs */}
      <div className="bg-surface rounded-xl p-4 mb-4">
        <h2 className="text-sm font-bold text-text mb-2">🏟️ Clubs</h2>
        <div className="space-y-1.5">
          {(() => {
            const groups: { name: string; seasons: number }[] = [];
            const all = [...seasonHistory, { clubName: career.currentClub.name, season: career.season }];
            for (const e of all) {
              const last = groups[groups.length - 1];
              if (last && last.name === (e as any).clubName) last.seasons++;
              else groups.push({ name: (e as any).clubName, seasons: 1 });
            }
            return groups.map((g, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-sm text-text">{g.name}</span>
                <span className="text-xs text-text-muted">{g.seasons} saison{g.seasons > 1 ? 's' : ''}</span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* National team */}
      {nationalTeam && nationalTeam.caps > 0 && (
        <div className="bg-surface rounded-xl p-4 mb-4">
          <h2 className="text-sm font-bold text-text mb-2">🏳️ Équipe nationale</h2>
          <p className="text-sm text-text">{nationalTeam.caps} sélections • {nationalTeam.nationalGoals} buts • {nationalTeam.nationalAssists} passes D.</p>
        </div>
      )}

      {/* Fortune */}
      <div className="bg-surface rounded-xl p-4 mb-4">
        <h2 className="text-sm font-bold text-text mb-2">💰 Fortune</h2>
        <p className="text-2xl font-black text-green-400">{formatCurrency(totalWealth)}</p>
        <div className="flex gap-4 mt-2 text-xs text-text-muted">
          <span>Cash: {formatCurrency(finance.balance)}</span>
          <span>Biens: {formatCurrency(possessions.reduce((s, p) => s + p.price, 0))}</span>
        </div>
      </div>

      {/* Family */}
      <div className="bg-surface rounded-xl p-4 mb-4">
        <h2 className="text-sm font-bold text-text mb-2">👨‍👩‍👧‍👦 Famille</h2>
        {relationship ? (
          <p className="text-sm text-text">{relationship.status === 'married' ? '👰 Marié avec' : '💑 En couple avec'} {relationship.womanName}</p>
        ) : (
          <p className="text-sm text-text-muted">Célibataire</p>
        )}
        {children.length > 0 && (
          <p className="text-sm text-text mt-1">{children.length} enfant{children.length > 1 ? 's' : ''} : {children.map((c) => c.firstName).join(', ')}</p>
        )}
      </div>

      {/* Final rating */}
      <div className="bg-surface rounded-xl p-4 mb-6 text-center">
        <p className="text-xs text-text-muted mb-1">Note finale</p>
        <p className="text-4xl font-black text-primary-light">{player.overallRating}</p>
        <p className="text-xs text-text-muted mt-1">Potentiel atteint : {Math.round((player.overallRating / player.potential) * 100)}%</p>
      </div>

      {/* New game button */}
      <button
        onClick={handleNewGame}
        className="w-full py-4 bg-primary text-white font-bold rounded-xl active:scale-95 text-lg"
      >
        Nouvelle carrière
      </button>
    </div>
  );
}
