/**
 * CLCompetitionEnd — Gestion de la fin de compétition en Ligue des Champions.
 *
 * Ce module gère :
 * - L'élimination du joueur (retrait des matchs restants, message)
 * - L'attribution du trophée Champions League en cas de victoire en finale
 * - La réinitialisation de l'état CL pour la saison suivante
 *
 * Requirements: 9.1, 9.2, 9.3
 */

import type { GameState, Trophy } from '../../core/types';
import type { ChampionsLeagueState } from './types';
import { checkTrophy } from './ChampionsLeagueSystem';
import { eventBus, GameEvent } from '../../core/EventBus';

// ─── Elimination ─────────────────────────────────────────────────────────────

/**
 * Gère l'élimination du club du joueur de la Ligue des Champions.
 *
 * - Marque le joueur comme éliminé (playerEliminated = true)
 * - Retire les matchs CL restants du calendrier (leagueSchedule)
 * - Émet l'événement CL_ELIMINATED via l'EventBus
 *
 * @param state - L'état global du jeu
 * @returns L'état mis à jour avec le joueur éliminé et les matchs retirés
 */
export function handleCLElimination(state: GameState): GameState {
  const clState = state.championsLeague;
  if (!clState || clState.playerEliminated) {
    return state;
  }

  const playerClubId = clState.playerClubId ?? state.career.currentClub.id;

  // Retirer les matchs CL restants du calendrier pour le club du joueur
  const filteredSchedule = clState.leagueSchedule.filter(
    (match) =>
      match.homeTeamId !== playerClubId && match.awayTeamId !== playerClubId
  );

  const updatedCLState: ChampionsLeagueState = {
    ...clState,
    playerEliminated: true,
    leagueSchedule: filteredSchedule,
  };

  // Émettre l'événement d'élimination
  eventBus.emit(GameEvent.CL_ELIMINATED, { playerClubId });

  return {
    ...state,
    championsLeague: updatedCLState,
  };
}

// ─── Trophy ──────────────────────────────────────────────────────────────────

/**
 * Vérifie si le club du joueur a remporté la finale et attribue le trophée.
 *
 * - Utilise `checkTrophy` du ChampionsLeagueSystem pour vérifier la victoire
 * - Ajoute le trophée 'champions_league' à career.trophies si victoire
 * - Émet l'événement CL_TROPHY_WON via l'EventBus
 *
 * @param state - L'état global du jeu
 * @param season - La saison en cours
 * @returns L'état mis à jour avec le trophée ajouté (si victoire)
 */
export function handleCLTrophy(state: GameState, season: number): GameState {
  const clState = state.championsLeague;
  if (!clState) {
    return state;
  }

  const playerClubId = clState.playerClubId ?? state.career.currentClub.id;

  // Vérifier si le joueur a gagné la finale
  const trophy = checkTrophy(clState, playerClubId, season);
  if (!trophy) {
    return state;
  }

  // Ajouter le trophée à la collection du joueur
  const updatedTrophies: Trophy[] = [...state.career.trophies, trophy];

  // Émettre l'événement de victoire
  eventBus.emit(GameEvent.CL_TROPHY_WON, {
    playerClubId,
    season,
    trophy,
  });

  return {
    ...state,
    career: {
      ...state.career,
      trophies: updatedTrophies,
    },
  };
}

// ─── Season End ──────────────────────────────────────────────────────────────

/**
 * Réinitialise l'état de la Ligue des Champions pour préparer la saison suivante.
 *
 * - Met championsLeague à null dans le GameState
 * - Permet une nouvelle qualification lors de la prochaine fin de saison
 *
 * @param state - L'état global du jeu
 * @returns L'état mis à jour avec championsLeague = null
 */
export function handleCLSeasonEnd(state: GameState): GameState {
  return {
    ...state,
    championsLeague: null,
  };
}

// ─── UI Message ──────────────────────────────────────────────────────────────

/**
 * Retourne un message d'élimination en français pour l'interface utilisateur.
 *
 * @returns Le message d'élimination à afficher
 */
export function getEliminationMessage(): string {
  return 'Votre club a été éliminé de la Ligue des Champions. Les matchs restants ont été retirés du calendrier.';
}
