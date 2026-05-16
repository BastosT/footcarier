/**
 * Locker — Écran du vestiaire affichant l'effectif complet et le moral d'équipe.
 *
 * Affiche la liste des joueurs de l'équipe avec nom, poste, âge et note globale,
 * ainsi qu'un indicateur visuel du moral collectif (0-100).
 *
 * Validates: Requirements 4.1, 4.2, 4.6
 */

import type { SquadPlayer } from '../../core/types';
import { useGameStore } from '../../store/gameStore';
import { MoraleIndicator } from '../components/MoraleIndicator';

export interface LockerProps {
  squad: SquadPlayer[];
  teamMorale: number;
}

/**
 * Returns a display-friendly label for a position abbreviation.
 */
function getPositionLabel(position: string): string {
  const labels: Record<string, string> = {
    GK: 'Gardien',
    CB: 'Défenseur central',
    LB: 'Latéral gauche',
    RB: 'Latéral droit',
    CDM: 'Milieu défensif',
    CM: 'Milieu central',
    CAM: 'Milieu offensif',
    LW: 'Ailier gauche',
    RW: 'Ailier droit',
    ST: 'Attaquant',
  };
  return labels[position] ?? position;
}

/**
 * Returns a Tailwind text color class based on the player's overall rating.
 */
function getRatingColor(rating: number): string {
  if (rating >= 80) return 'text-green-400';
  if (rating >= 70) return 'text-yellow-400';
  if (rating >= 60) return 'text-orange-400';
  return 'text-red-400';
}

export function Locker({ squad, teamMorale }: LockerProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-background p-4">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-xl font-bold text-text">Vestiaire</h1>
        <p className="text-sm text-text-muted">
          {squad.length} joueur{squad.length > 1 ? 's' : ''}
        </p>
      </header>

      {/* Team Morale Indicator */}
      <section className="mb-6 bg-surface rounded-xl p-4" aria-label="Moral d'équipe">
        <MoraleIndicator morale={teamMorale} />
      </section>

      {/* Squad List */}
      <section className="flex-1" aria-label="Effectif">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-light">
                <th className="py-2 px-2 text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Joueur
                </th>
                <th className="py-2 px-2 text-xs font-semibold text-text-muted uppercase tracking-wide">
                  Poste
                </th>
                <th className="py-2 px-2 text-xs font-semibold text-text-muted uppercase tracking-wide text-center">
                  Âge
                </th>
                <th className="py-2 px-2 text-xs font-semibold text-text-muted uppercase tracking-wide text-center">
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {squad.map((player) => (
                <tr
                  key={player.id}
                  className={`border-b border-surface-light/50 ${
                    player.isPlayerCharacter ? 'bg-primary/10' : ''
                  }`}
                >
                  <td className="py-3 px-2">
                    <span className={`text-sm font-medium ${player.isPlayerCharacter ? 'text-primary-light' : 'text-text'}`}>
                      {player.name}
                    </span>
                    {player.isPlayerCharacter && (
                      <span className="ml-2 text-xs text-primary-light">(Vous)</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-xs text-text-muted" title={getPositionLabel(player.position)}>
                      {player.position}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-sm text-text">{player.age}</span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`text-sm font-bold ${getRatingColor(player.overallRating)}`}>
                      {player.overallRating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {squad.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-text-muted text-sm">Aucun joueur dans l'effectif</p>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Connected version that reads squad and teamMorale from the Zustand store.
 */
export function LockerConnected() {
  const gameState = useGameStore((s) => s.gameState);
  const teamMorale = useGameStore((s) => s.social.teamMorale);

  if (!gameState) return null;

  const squad = gameState.career.currentClub.squad;

  return <Locker squad={squad} teamMorale={teamMorale} />;
}
