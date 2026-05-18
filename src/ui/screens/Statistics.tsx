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

      {/* National team stats */}
      {gameState.nationalTeam && gameState.nationalTeam.caps > 0 && (
        <div className="bg-surface rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold text-text mb-3">🏳️ Équipe nationale</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-text">{gameState.nationalTeam.caps}</p>
              <p className="text-xs text-text-muted">Sélections</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-400">{gameState.nationalTeam.nationalGoals}</p>
              <p className="text-xs text-text-muted">Buts</p>
            </div>
            <div>
              <p className="text-xl font-bold text-blue-400">{gameState.nationalTeam.nationalAssists}</p>
              <p className="text-xs text-text-muted">Passes D.</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Club career summary — grouped by club */}
      {seasonHistory.length > 0 && (
        <div className="bg-surface rounded-xl p-4 mt-6">
          <h3 className="text-sm font-bold text-text mb-3">🏟️ Parcours</h3>
          <div className="space-y-3">
            {(() => {
              // Group seasons by club (consecutive)
              const groups: { clubName: string; seasons: number[]; totalGoals: number; totalAssists: number; totalMatches: number }[] = [];

              // Add current season
              const allEntries = [...seasonHistory, {
                season: career.season,
                clubName: career.currentClub.name,
                clubId: career.currentClub.id,
                goals: currentSeasonEntry.goals,
                assists: currentSeasonEntry.assists,
                matchesPlayed: currentSeasonEntry.matchesPlayed,
                avgRating: currentSeasonEntry.avgRating,
              }];

              for (const entry of allEntries) {
                const lastGroup = groups[groups.length - 1];
                if (lastGroup && lastGroup.clubName === entry.clubName) {
                  lastGroup.seasons.push(entry.season);
                  lastGroup.totalGoals += entry.goals;
                  lastGroup.totalAssists += entry.assists;
                  lastGroup.totalMatches += entry.matchesPlayed;
                } else {
                  groups.push({
                    clubName: entry.clubName,
                    seasons: [entry.season],
                    totalGoals: entry.goals,
                    totalAssists: entry.assists,
                    totalMatches: entry.matchesPlayed,
                  });
                }
              }

              const startYear = gameState.time.currentDate.year - (career.season - 1);

              return groups.map((group, idx) => {
                const fromYear = startYear + group.seasons[0] - 1;
                const toYear = startYear + group.seasons[group.seasons.length - 1];
                const yearRange = group.seasons.length === 1 ? `${fromYear}` : `${fromYear} - ${toYear}`;

                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-surface-light/50 rounded-xl border border-surface-light/30">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🏟️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text truncate">{group.clubName}</p>
                      <p className="text-xs text-text-muted">{yearRange} • {group.seasons.length} saison{group.seasons.length > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text">{group.totalMatches} MJ</p>
                      <p className="text-xs">
                        <span className="text-green-400 font-bold">{group.totalGoals}⚽</span>
                        {' '}
                        <span className="text-blue-400 font-bold">{group.totalAssists}🎯</span>
                      </p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
