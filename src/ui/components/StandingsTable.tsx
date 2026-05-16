/**
 * StandingsTable — Tableau de classement d'un championnat.
 *
 * Affiche les colonnes : Position, Club, P (joués), W, D, L, GF, GA, Pts.
 * Met en surbrillance la ligne du club du joueur.
 */

import type { LeagueStanding } from '../../core/types';

export interface StandingsTableProps {
  standings: LeagueStanding[];
  playerClubId?: string;
}

export function StandingsTable({ standings, playerClubId }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-text-muted text-sm">Aucun classement disponible</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="table" aria-label="Classement du championnat">
        <thead>
          <tr className="text-text-muted border-b border-surface-light">
            <th className="py-2 text-left w-8">#</th>
            <th className="py-2 text-left">Club</th>
            <th className="py-2 text-center w-8">P</th>
            <th className="py-2 text-center w-8">W</th>
            <th className="py-2 text-center w-8">D</th>
            <th className="py-2 text-center w-8">L</th>
            <th className="py-2 text-center w-10">GF</th>
            <th className="py-2 text-center w-10">GA</th>
            <th className="py-2 text-center w-10 font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team) => {
            const isPlayerClub = team.clubId === playerClubId;
            const isChampionsLeague = team.position <= 4;

            return (
              <tr
                key={team.clubId}
                className={`border-b border-surface-light/50 ${
                  isPlayerClub ? 'bg-primary/15 font-semibold' : ''
                }`}
              >
                <td className="py-2">
                  <span className={isChampionsLeague ? 'text-blue-400 font-bold' : 'text-text-muted'}>
                    {team.position}
                  </span>
                </td>
                <td className={`py-2 ${isPlayerClub ? 'text-primary-light' : 'text-text'}`}>
                  {team.clubName}
                </td>
                <td className="py-2 text-center text-text-muted">{team.played}</td>
                <td className="py-2 text-center text-text-muted">{team.won}</td>
                <td className="py-2 text-center text-text-muted">{team.drawn}</td>
                <td className="py-2 text-center text-text-muted">{team.lost}</td>
                <td className="py-2 text-center text-text-muted">{team.goalsFor}</td>
                <td className="py-2 text-center text-text-muted">{team.goalsAgainst}</td>
                <td className="py-2 text-center font-bold text-text">{team.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
