/**
 * ChampionsLeagueSystem - Module principal orchestrant la Ligue des Champions.
 * Assemble les sous-modules (qualification, schedule, standings, knockout, simulator)
 * et expose l'interface complète IChampionsLeagueSystem.
 *
 * Requirements: 5.3, 5.4, 8.1, 8.2, 9.1, 9.2
 */

import type {
  LeagueState,
  ScheduledMatch,
  Trophy,
} from '../../core/types';
import type {
  CLParticipant,
  CLFixture,
  CLScheduledMatch,
  CLMatchResult,
  CLStanding,
  CLKnockoutTie,
  CLKnockoutTieResult,
  ChampionsLeagueState,
  KnockoutRound,
} from './types';
import { CL_CONSTANTS } from './types';
import { type RNG, defaultRNG } from '../../utils/random';
import { qualify } from './qualification';
import { generateLeaguePhaseFixtures, assignDates } from './CLScheduleGenerator';
import { updateStandings, resolveLeaguePhase } from './standings';
import { drawKnockoutRound, resolveKnockoutTie } from './knockout';
import { simulateMatch } from './CLMatchSimulator';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Résultat d'une journée de matchs CL */
export interface CLMatchdayResult {
  matchday: number;
  results: CLMatchResult[];
  playerMatchScheduled: boolean;
}

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IChampionsLeagueSystem {
  qualify(leagues: LeagueState[], season: number, rng?: RNG): CLParticipant[];
  initSeason(participants: CLParticipant[], season: number, rng?: RNG): ChampionsLeagueState;
  generateLeaguePhaseSchedule(
    fixtures: CLFixture[],
    season: number,
    playerClubSchedule: ScheduledMatch[]
  ): CLScheduledMatch[];
  simulateMatchday(
    state: ChampionsLeagueState,
    matchday: number,
    playerClubId: string | null,
    rng?: RNG
  ): CLMatchdayResult;
  updateStandings(state: ChampionsLeagueState, results: CLMatchResult[]): CLStanding[];
  resolveLeaguePhase(standings: CLStanding[], participants: CLParticipant[]): CLParticipant[];
  drawKnockoutRound(teams: CLParticipant[], round: KnockoutRound, rng?: RNG): CLKnockoutTie[];
  resolveKnockoutTie(firstLeg: CLMatchResult, secondLeg: CLMatchResult, rng?: RNG): CLKnockoutTieResult;
  processKnockoutRound(
    state: ChampionsLeagueState,
    playerClubId: string | null,
    rng?: RNG
  ): ChampionsLeagueState;
  checkTrophy(state: ChampionsLeagueState, playerClubId: string, season: number): Trophy | null;
  reset(): ChampionsLeagueState;
}

// ─── Implementation ──────────────────────────────────────────────────────────

/**
 * Initialise la saison CL : génère les fixtures de la phase de ligue et crée l'état initial.
 *
 * @param participants - Les 50 participants à la CL
 * @param season - L'année de début de la saison
 * @param rng - Générateur aléatoire optionnel
 * @returns L'état initial de la Ligue des Champions
 */
export function initSeason(
  participants: CLParticipant[],
  season: number,
  rng: RNG = defaultRNG
): ChampionsLeagueState {
  // Générer les fixtures de la phase de ligue
  const fixtures = generateLeaguePhaseFixtures(participants, rng);

  // Assigner les dates (calendrier vide par défaut pour le joueur)
  const leagueSchedule = assignDates(fixtures, season, []);

  // Initialiser les standings vides pour chaque participant
  const standings: CLStanding[] = participants.map((p, index) => ({
    participantId: p.id,
    participantName: p.name,
    country: p.country,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    position: index + 1,
  }));

  return {
    season,
    participants,
    phase: 'league',
    currentMatchday: 1,
    leagueSchedule,
    leagueResults: [],
    standings,
    knockoutRound: null,
    knockoutBracket: {
      roundOf16: [],
      quarterFinals: [],
      semiFinals: [],
      final: null,
    },
    playerParticipating: true,
    playerEliminated: false,
    playerClubId: null,
  };
}

/**
 * Génère le calendrier intercalé pour la phase de ligue.
 * Wrapper autour de CLScheduleGenerator.assignDates.
 */
export function generateLeaguePhaseSchedule(
  fixtures: CLFixture[],
  season: number,
  playerClubSchedule: ScheduledMatch[]
): CLScheduledMatch[] {
  return assignDates(fixtures, season, playerClubSchedule);
}

/**
 * Simule tous les matchs d'une journée CL sauf celui du joueur.
 * Retourne les résultats de tous les matchs simulés et indique si le joueur a un match programmé.
 *
 * @param state - L'état actuel de la Ligue des Champions
 * @param matchday - Le numéro de la journée (1-8)
 * @param playerClubId - L'identifiant du club du joueur (null si pas de participation)
 * @param rng - Générateur aléatoire optionnel
 * @returns Le résultat de la journée avec tous les matchs simulés
 */
export function simulateMatchday(
  state: ChampionsLeagueState,
  matchday: number,
  playerClubId: string | null,
  rng: RNG = defaultRNG
): CLMatchdayResult {
  // Trouver tous les matchs de cette journée dans le calendrier
  const matchdayFixtures = state.leagueSchedule.filter(
    (m) => m.matchday === matchday && m.phase === 'league'
  );

  let playerMatchScheduled = false;
  const results: CLMatchResult[] = [];

  // Créer un map des participants pour accès rapide
  const participantsMap = new Map<string, CLParticipant>();
  for (const p of state.participants) {
    participantsMap.set(p.id, p);
  }

  for (const fixture of matchdayFixtures) {
    // Vérifier si c'est le match du joueur
    const isPlayerMatch =
      playerClubId !== null &&
      (fixture.homeTeamId === playerClubId || fixture.awayTeamId === playerClubId);

    if (isPlayerMatch) {
      playerMatchScheduled = true;
      // Ne pas simuler le match du joueur
      continue;
    }

    // Simuler le match
    const homeTeam = participantsMap.get(fixture.homeTeamId);
    const awayTeam = participantsMap.get(fixture.awayTeamId);

    if (!homeTeam || !awayTeam) continue;

    const matchResult = simulateMatch(homeTeam, awayTeam, rng);

    // Compléter le résultat avec les infos de la journée
    results.push({
      ...matchResult,
      matchday,
      phase: 'league',
    });
  }

  return {
    matchday,
    results,
    playerMatchScheduled,
  };
}

/**
 * Gère la progression d'un tour éliminatoire.
 * Effectue le tirage, simule les matchs (sauf ceux du joueur), et résout les confrontations.
 *
 * @param state - L'état actuel de la Ligue des Champions
 * @param playerClubId - L'identifiant du club du joueur
 * @param rng - Générateur aléatoire optionnel
 * @returns L'état mis à jour après le tour éliminatoire
 */
export function processKnockoutRound(
  state: ChampionsLeagueState,
  playerClubId: string | null,
  rng: RNG = defaultRNG
): ChampionsLeagueState {
  const currentRound = state.knockoutRound;
  if (!currentRound) return state;

  // Récupérer les confrontations du tour actuel
  let ties: CLKnockoutTie[];
  switch (currentRound) {
    case 'round-of-16':
      ties = state.knockoutBracket.roundOf16;
      break;
    case 'quarter-final':
      ties = state.knockoutBracket.quarterFinals;
      break;
    case 'semi-final':
      ties = state.knockoutBracket.semiFinals;
      break;
    case 'final':
      ties = state.knockoutBracket.final ? [state.knockoutBracket.final] : [];
      break;
    default:
      return state;
  }

  // Simuler les matchs et résoudre les confrontations
  const resolvedTies: CLKnockoutTie[] = [];
  const winners: CLParticipant[] = [];

  const participantsMap = new Map<string, CLParticipant>();
  for (const p of state.participants) {
    participantsMap.set(p.id, p);
  }

  for (const tie of ties) {
    const isPlayerTie =
      playerClubId !== null &&
      (tie.homeTeam.id === playerClubId || tie.awayTeam.id === playerClubId);

    if (isPlayerTie && !tie.firstLeg && !tie.secondLeg) {
      // Le joueur doit jouer ce match — ne pas simuler
      resolvedTies.push(tie);
      continue;
    }

    // Simuler le match aller si pas encore joué
    const firstLeg = tie.firstLeg ?? simulateKnockoutMatch(tie.homeTeam, tie.awayTeam, currentRound, 1, rng);

    // Pour la finale, pas de match retour
    let secondLeg: CLMatchResult;
    if (currentRound === 'final') {
      secondLeg = {
        matchday: 0,
        homeTeamId: tie.awayTeam.id,
        awayTeamId: tie.homeTeam.id,
        homeGoals: 0,
        awayGoals: 0,
        phase: 'final',
        leg: 2,
      };
    } else {
      secondLeg = tie.secondLeg ?? simulateKnockoutMatch(tie.awayTeam, tie.homeTeam, currentRound, 2, rng);
    }

    // Résoudre la confrontation
    const tieResult = resolveKnockoutTie(firstLeg, secondLeg, rng);

    const winnerId = tieResult.winnerId;
    const winner = participantsMap.get(winnerId);

    resolvedTies.push({
      ...tie,
      firstLeg,
      secondLeg: currentRound === 'final' ? undefined : secondLeg,
      winner: winnerId,
    });

    if (winner) {
      winners.push(winner);
    }
  }

  // Mettre à jour l'état avec les résultats
  const updatedState = { ...state };
  const updatedBracket = { ...state.knockoutBracket };

  switch (currentRound) {
    case 'round-of-16':
      updatedBracket.roundOf16 = resolvedTies;
      break;
    case 'quarter-final':
      updatedBracket.quarterFinals = resolvedTies;
      break;
    case 'semi-final':
      updatedBracket.semiFinals = resolvedTies;
      break;
    case 'final':
      updatedBracket.final = resolvedTies[0] ?? null;
      break;
  }

  updatedState.knockoutBracket = updatedBracket;

  // Vérifier si le joueur est éliminé
  if (playerClubId) {
    const playerEliminated = resolvedTies.some(
      (tie) =>
        tie.winner !== undefined &&
        tie.winner !== playerClubId &&
        (tie.homeTeam.id === playerClubId || tie.awayTeam.id === playerClubId)
    );
    if (playerEliminated) {
      updatedState.playerEliminated = true;
    }
  }

  // Avancer au tour suivant si tous les matchs sont résolus
  const allResolved = resolvedTies.every((tie) => tie.winner !== undefined);
  if (allResolved) {
    const nextRound = getNextKnockoutRound(currentRound);
    if (nextRound) {
      // Tirer au sort le tour suivant
      const nextTies = drawKnockoutRound(winners, nextRound, rng);
      updatedState.knockoutRound = nextRound;

      switch (nextRound) {
        case 'quarter-final':
          updatedState.knockoutBracket.quarterFinals = nextTies;
          break;
        case 'semi-final':
          updatedState.knockoutBracket.semiFinals = nextTies;
          break;
        case 'final':
          updatedState.knockoutBracket.final = nextTies[0] ?? null;
          break;
      }
    } else {
      // Compétition terminée
      updatedState.phase = 'finished';
    }
  }

  return updatedState;
}

/**
 * Vérifie si le club du joueur a remporté la Ligue des Champions.
 * Retourne un trophée si le joueur a gagné la finale, null sinon.
 *
 * @param state - L'état actuel de la Ligue des Champions
 * @param playerClubId - L'identifiant du club du joueur
 * @param season - La saison en cours
 * @returns Un trophée Champions League ou null
 */
export function checkTrophy(
  state: ChampionsLeagueState,
  playerClubId: string,
  season: number
): Trophy | null {
  // Vérifier que la finale a été jouée
  const final = state.knockoutBracket.final;
  if (!final || !final.winner) return null;

  // Vérifier que le club du joueur a gagné
  if (final.winner !== playerClubId) return null;

  return {
    id: `trophy-champions-league-${season}`,
    type: 'champions_league',
    season,
    competition: 'Ligue des Champions',
  };
}

/**
 * Réinitialise l'état de la Ligue des Champions pour la saison suivante.
 * Retourne un état vide/null prêt pour une nouvelle qualification.
 */
export function reset(): ChampionsLeagueState {
  return {
    season: 0,
    participants: [],
    phase: 'league',
    currentMatchday: 1,
    leagueSchedule: [],
    leagueResults: [],
    standings: [],
    knockoutRound: null,
    knockoutBracket: {
      roundOf16: [],
      quarterFinals: [],
      semiFinals: [],
      final: null,
    },
    playerParticipating: false,
    playerEliminated: false,
    playerClubId: null,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Simule un match de tour éliminatoire entre deux participants.
 */
function simulateKnockoutMatch(
  home: CLParticipant,
  away: CLParticipant,
  round: KnockoutRound,
  leg: 1 | 2,
  rng: RNG
): CLMatchResult {
  const result = simulateMatch(home, away, rng);
  return {
    ...result,
    matchday: 0,
    phase: round,
    leg,
  };
}

/**
 * Retourne le tour éliminatoire suivant, ou null si c'est la finale.
 */
function getNextKnockoutRound(current: KnockoutRound): KnockoutRound | null {
  switch (current) {
    case 'round-of-16':
      return 'quarter-final';
    case 'quarter-final':
      return 'semi-final';
    case 'semi-final':
      return 'final';
    case 'final':
      return null;
  }
}

// ─── Export ──────────────────────────────────────────────────────────────────

/** Objet exporté regroupant toutes les fonctions du système CL */
export const ChampionsLeagueSystem: IChampionsLeagueSystem = {
  qualify,
  initSeason,
  generateLeaguePhaseSchedule,
  simulateMatchday,
  updateStandings,
  resolveLeaguePhase,
  drawKnockoutRound,
  resolveKnockoutTie,
  processKnockoutRound,
  checkTrophy,
  reset,
};
