/**
 * Statistics - Écran de statistiques du joueur.
 */

import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';

export function Statistics() {
  const navigate = useNavigation((s) => s.navigate);
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) return null;
  const { player, career, playerCareerStats } = gameState;

  const stats = [
    { label: 'Vitesse', value: player.stats.pace, color: 'bg-blue-500' },
    { label: 'Tir', value: player.stats.shooting, color: 'bg-red-500' },
    { label: 'Passe', value: player.stats.passing, color: 'bg-green-500' },
    { label: 'Dribble', value: player.stats.dribbling, color: 'bg-yellow-500' },
    { label: 'Défense', value: player.stats.defending, color: 'bg-purple-500' },
    { label: 'Physique', value: player.stats.physical, color: 'bg-orange-500' },
  ];

  const seasonStats = playerCareerStats?.season;
  const seasonHistory = playerCareerStats?.seasonHistory ?? [];

  // Current season entry (live)
  const currentSeasonEntry = {
    season: career.season,
    clubName: career.currentClub.name,
    goals: seasonStats?.goals ?? 0,
    assists: seasonStats?.assists ?? 0,
    matchesPlayed: seasonStats?.matchesPlayed ?? 0,
    avgRating: seasonStats && seasonStats.matchesPlayed > 0
      ? Math.round((seasonStats.totalRating / seasonStats.matchesPlayed) * 10) / 10
      : 0,
  };

  // Total career goals/assists
  const totalGoals = seasonHistory.reduce((sum, s) => sum + s.goals, 0) + currentSeasonEntry.goals;
  const totalAssists = seasonHistory.reduce((sum, s) => sum + s.assists, 0) + currentSeasonEntry.assists;
  const totalMatches = seasonHistory.reduce((sum, s) => sum + s.matchesPlayed, 0) + currentSeasonEntry.matchesPlayed;

  return (
    <div className="min-h-dvh flex flex-col bg-background p-4 pb-20">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">📊 Statistiques</h1>
        <button onClick={() => navigate('dashboard')} className="text-primary-light">← Retour</button>
      </header>

      {/* Player card */}
      <div className="bg-surface rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-text">{player.firstName} {player.lastName}</h2>
            <p className="text-text-muted">{player.position} • {player.age} ans</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-light">{player.overallRating}</p>
            <p className="text-xs text-text-muted">OVR</p>
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-sm text-text-muted">
          <span>Potentiel: {player.potential}</span>
          <span>Forme: {player.fitness}%</span>
          <span>Moral: {player.morale}%</span>
        </div>
      </div>

      {/* Career totals */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl p-4 mb-6 border border-primary/30">
        <h3 className="text-sm font-bold text-text-muted mb-2">📈 Carrière totale</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-black text-text">{totalMatches}</p>
            <p className="text-xs text-text-muted">Matchs</p>
          </div>
          <div>
            <p className="text-2xl font-black text-green-400">{totalGoals}</p>
            <p className="text-xs text-text-muted">Buts</p>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-400">{totalAssists}</p>
            <p className="text-xs text-text-muted">Passes D.</p>
          </div>
        </div>
      </div>

      {/* Season history table */}
      <div className="bg-surface rounded-xl p-4 mb-6">
        <h3 className="text-sm font-bold text-text mb-3">📋 Historique des saisons</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted border-b border-surface-light">
                <th className="py-2 text-left">Saison</th>
                <th className="py-2 text-left">Club</th>
                <th className="py-2 text-center">MJ</th>
                <th className="py-2 text-center">⚽</th>
                <th className="py-2 text-center">🎯</th>
              </tr>
            </thead>
            <tbody>
              {/* Current season (highlighted) */}
              <tr className="border-b border-surface-light/50 bg-primary/10">
                <td className="py-2 font-bold text-primary-light">S{currentSeasonEntry.season}</td>
                <td className="py-2 text-text font-medium">{currentSeasonEntry.clubName}</td>
                <td className="py-2 text-center text-text">{currentSeasonEntry.matchesPlayed}</td>
                <td className="py-2 text-center text-green-400 font-bold">{currentSeasonEntry.goals}</td>
                <td className="py-2 text-center text-blue-400 font-bold">{currentSeasonEntry.assists}</td>
              </tr>
              {/* Past seasons */}
              {[...seasonHistory].reverse().map((entry) => (
                <tr key={entry.season} className="border-b border-surface-light/50">
                  <td className="py-2 text-text-muted">S{entry.season}</td>
                  <td className="py-2 text-text">{entry.clubName}</td>
                  <td className="py-2 text-center text-text-muted">{entry.matchesPlayed}</td>
                  <td className="py-2 text-center text-green-400">{entry.goals}</td>
                  <td className="py-2 text-center text-blue-400">{entry.assists}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {seasonHistory.length === 0 && (
          <p className="text-xs text-text-muted text-center mt-2">L'historique apparaîtra après ta première saison complète</p>
        )}
      </div>

      {/* Stats bars */}
      <div className="bg-surface rounded-xl p-4">
        <h3 className="text-sm font-bold text-text mb-3">🎮 Attributs</h3>
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text">{stat.label}</span>
                <span className="text-text font-bold">{stat.value}</span>
              </div>
              <div className="h-3 bg-surface-light rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${stat.color} transition-all duration-500`}
                  style={{ width: `${stat.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
