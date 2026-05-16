/**
 * TopScorersTable — Tableau des meilleurs buteurs d'un championnat.
 *
 * Affiche les colonnes : Position, Joueur, Club, Buts.
 */

import type { TopScorer } from '../../core/types';

export interface TopScorersTableProps {
  scorers: TopScorer[];
  playerClubId?: string;
}

export function TopScorersTable({ scorers, playerClubId }: TopScorersTableProps) {
  if (scorers.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-text-muted text-sm">Aucun buteur enregistré</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="table" aria-label="Classement des buteurs">
        <thead>
          <tr className="text-text-muted border-b border-surface-light">
            <th className="py-2 text-left w-8">#</th>
            <th className="py-2 text-left">Joueur</th>
            <th className="py-2 text-left">Club</th>
            <th className="py-2 text-center w-12">Buts</th>
          </tr>
        </thead>
        <tbody>
          {scorers.map((scorer, idx) => {
            const isPlayerClub = scorer.clubId === playerClubId;

            return (
              <tr
                key={`${scorer.playerId}-${idx}`}
                className={`border-b border-surface-light/50 ${
                  isPlayerClub ? 'bg-primary/15 font-semibold' : ''
                }`}
              >
                <td className="py-2 text-text-muted">{idx + 1}</td>
                <td className={`py-2 ${isPlayerClub ? 'text-primary-light' : 'text-text'}`}>
                  {scorer.playerName}
                </td>
                <td className="py-2 text-text-muted">{scorer.clubName}</td>
                <td className="py-2 text-center font-bold text-text">{scorer.goals}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
