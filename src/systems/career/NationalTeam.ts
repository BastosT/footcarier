/**
 * NationalTeam — Système d'équipe nationale.
 * Gère les convocations, la Coupe du Monde (années paires) et l'Euro (années impaires).
 * Conditions de convocation : OVR >= 60 + bonnes performances en club.
 */

import type { GameState, Country } from '../../core/types';
import { type RNG, defaultRNG } from '../../utils/random';

// ─── Types ───────────────────────────────────────────────────────────────────

export type NationalCompetition = 'world_cup' | 'euro';

export interface NationalTeamPlayer {
  id: string;
  name: string;
  position: string;
  overallRating: number;
  club: string;
  isPlayer: boolean;
}

export interface NationalMatchResult {
  opponent: string;
  opponentFlag: string;
  playerGoals: number;
  playerAssists: number;
  teamGoals: number;
  opponentGoals: number;
  round: string;
}

export interface NationalTeamState {
  isConvoked: boolean;
  caps: number;              // sélections totales
  nationalGoals: number;     // buts en sélection
  nationalAssists: number;
  currentCompetition: NationalCompetition | null;
  competitionResults: NationalMatchResult[];
  lastConvocationSeason: number;
}

// ─── Données ─────────────────────────────────────────────────────────────────

const NATIONAL_TEAMS: Record<Country, { name: string; flag: string; rating: number }> = {
  france: { name: 'France', flag: '🇫🇷', rating: 86 },
  spain: { name: 'Espagne', flag: '🇪🇸', rating: 85 },
  england: { name: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', rating: 84 },
  italy: { name: 'Italie', flag: '🇮🇹', rating: 82 },
  germany: { name: 'Allemagne', flag: '🇩🇪', rating: 83 },
};

const WORLD_CUP_TEAMS = [
  { name: 'Brésil', flag: '🇧🇷', rating: 84 },
  { name: 'Argentine', flag: '🇦🇷', rating: 86 },
  { name: 'Portugal', flag: '🇵🇹', rating: 83 },
  { name: 'Pays-Bas', flag: '🇳🇱', rating: 82 },
  { name: 'Belgique', flag: '🇧🇪', rating: 81 },
  { name: 'Croatie', flag: '🇭🇷', rating: 80 },
  { name: 'Uruguay', flag: '🇺🇾', rating: 79 },
  { name: 'Colombie', flag: '🇨🇴', rating: 78 },
  { name: 'Sénégal', flag: '🇸🇳', rating: 77 },
  { name: 'Japon', flag: '🇯🇵', rating: 76 },
  { name: 'Maroc', flag: '🇲🇦', rating: 79 },
  { name: 'USA', flag: '🇺🇸', rating: 77 },
  { name: 'Mexique', flag: '🇲🇽', rating: 76 },
  { name: 'Suisse', flag: '🇨🇭', rating: 79 },
  { name: 'Danemark', flag: '🇩🇰', rating: 78 },
  { name: 'Australie', flag: '🇦🇺', rating: 74 },
  { name: 'Corée du Sud', flag: '🇰🇷', rating: 76 },
  { name: 'Nigeria', flag: '🇳🇬', rating: 75 },
  { name: 'Cameroun', flag: '🇨🇲', rating: 74 },
  { name: 'Serbie', flag: '🇷🇸', rating: 78 },
  { name: 'Pologne', flag: '🇵🇱', rating: 77 },
  { name: 'Turquie', flag: '🇹🇷', rating: 78 },
  { name: 'Autriche', flag: '🇦🇹', rating: 77 },
  { name: 'Écosse', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', rating: 74 },
  { name: 'Équateur', flag: '🇪🇨', rating: 75 },
  { name: 'Ghana', flag: '🇬🇭', rating: 74 },
  { name: 'Arabie Saoudite', flag: '🇸🇦', rating: 72 },
];

const SQUAD_PLAYERS: Record<Country, string[]> = {
  france: ['Mbappé', 'Griezmann', 'Dembélé', 'Tchouaméni', 'Camavinga', 'Upamecano', 'Saliba', 'Hernandez', 'Maignan', 'Koundé', 'Thuram', 'Giroud', 'Rabiot', 'Coman', 'Pavard', 'Konaté', 'Fofana', 'Zaïre-Emery', 'Barcola', 'Kolo Muani', 'Clauss', 'Lloris'],
  england: ['Kane', 'Saka', 'Bellingham', 'Foden', 'Rice', 'Palmer', 'Alexander-Arnold', 'Walker', 'Stones', 'Pickford', 'Rashford', 'Sterling', 'Grealish', 'Maguire', 'Shaw', 'Mainoo', 'Gordon', 'Watkins', 'Toney', 'Gallagher', 'Trippier', 'Pope'],
  spain: ['Yamal', 'Pedri', 'Rodri', 'Morata', 'Olmo', 'Williams', 'Carvajal', 'Laporte', 'Unai Simón', 'Cucurella', 'Grimaldo', 'Ferran Torres', 'Joselu', 'Gavi', 'Merino', 'Nacho', 'Vivian', 'Le Normand', 'Zubimendi', 'Oyarzabal', 'Fermín', 'Remiro'],
  italy: ['Donnarumma', 'Barella', 'Chiesa', 'Bastoni', 'Dimarco', 'Jorginho', 'Scamacca', 'Raspadori', 'Pellegrini', 'Tonali', 'Frattesi', 'Calafiori', 'Di Lorenzo', 'Retegui', 'Mancini', 'Cristante', 'El Shaarawy', 'Zaccagni', 'Vicario', 'Buongiorno', 'Cambiaso', 'Fagioli'],
  germany: ['Musiala', 'Wirtz', 'Havertz', 'Sané', 'Kimmich', 'Gündogan', 'Rüdiger', 'Neuer', 'Schlotterbeck', 'Raum', 'Füllkrug', 'Müller', 'Gnabry', 'Tah', 'Andrich', 'Gross', 'Mittelstädt', 'Beier', 'Undav', 'ter Stegen', 'Henrichs', 'Can'],
};

// ─── Fonctions ───────────────────────────────────────────────────────────────

/**
 * Vérifie si le joueur est éligible à la convocation.
 * Conditions : OVR >= 60 + note moyenne >= 6.5 ou 5+ buts en saison
 */
export function isEligibleForNationalTeam(state: GameState): boolean {
  if (state.player.overallRating < 60) return false;

  const seasonStats = state.playerCareerStats?.season;
  if (!seasonStats) return false;

  const avgRating = seasonStats.matchesPlayed > 0
    ? seasonStats.totalRating / seasonStats.matchesPlayed
    : 0;

  // Eligible if good average rating OR decent goal/assist record
  return avgRating >= 6.5 || seasonStats.goals >= 5 || seasonStats.assists >= 5;
}

/**
 * Détermine si c'est une année de compétition.
 * Coupe du Monde : années paires (2024, 2026, 2028...)
 * Euro : années impaires (2025, 2027, 2029...)
 */
export function getCompetitionForYear(year: number): NationalCompetition | null {
  if (year % 2 === 0) return 'world_cup';
  return 'euro';
}

/**
 * Génère la liste des joueurs convoqués (23 joueurs dont le joueur).
 */
export function generateSquad(
  state: GameState,
  rng: RNG = defaultRNG
): NationalTeamPlayer[] {
  const country = state.player.nationality;
  const squadNames = SQUAD_PLAYERS[country] ?? SQUAD_PLAYERS.france;

  const squad: NationalTeamPlayer[] = [];

  // Add the player
  squad.push({
    id: state.player.id,
    name: `${state.player.firstName} ${state.player.lastName}`,
    position: state.player.position,
    overallRating: state.player.overallRating,
    club: state.career.currentClub.name,
    isPlayer: true,
  });

  // Add AI teammates (22 others)
  const positions = ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CM', 'CAM', 'LW', 'RW', 'ST',
                     'GK', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'ST'];
  const shuffledNames = [...squadNames].sort(() => rng.random() - 0.5);

  for (let i = 0; i < 22 && i < shuffledNames.length; i++) {
    squad.push({
      id: `nat-${i}`,
      name: shuffledNames[i],
      position: positions[i],
      overallRating: 72 + rng.randomInt(0, 15),
      club: '',
      isPlayer: false,
    });
  }

  return squad;
}

/**
 * Simule un match de compétition nationale.
 */
export function simulateNationalMatch(
  playerTeamRating: number,
  opponentRating: number,
  playerOVR: number,
  rng: RNG = defaultRNG
): { teamGoals: number; opponentGoals: number; playerGoals: number; playerAssists: number } {
  // Team goals based on rating difference
  const diff = playerTeamRating - opponentRating;
  const baseGoalChance = 0.4 + diff / 100;

  let teamGoals = 0;
  for (let i = 0; i < 5; i++) {
    if (rng.random() < Math.max(0.1, Math.min(0.7, baseGoalChance))) teamGoals++;
  }

  let opponentGoals = 0;
  const oppChance = 0.4 - diff / 100;
  for (let i = 0; i < 4; i++) {
    if (rng.random() < Math.max(0.1, Math.min(0.6, oppChance))) opponentGoals++;
  }

  // Player contribution
  const playerGoalChance = (playerOVR / 100) * 0.35;
  const playerAssistChance = (playerOVR / 100) * 0.25;
  let playerGoals = 0;
  let playerAssists = 0;

  if (teamGoals > 0) {
    for (let i = 0; i < teamGoals; i++) {
      if (rng.random() < playerGoalChance && playerGoals < teamGoals) {
        playerGoals++;
      } else if (rng.random() < playerAssistChance) {
        playerAssists++;
      }
    }
  }

  return { teamGoals, opponentGoals, playerGoals, playerAssists };
}

/**
 * Simule une compétition complète (Coupe du Monde ou Euro).
 * Phase de groupes (3 matchs) + éliminatoires si qualifié.
 */
export function simulateCompetition(
  state: GameState,
  competition: NationalCompetition,
  rng: RNG = defaultRNG
): NationalMatchResult[] {
  const country = state.player.nationality;
  const team = NATIONAL_TEAMS[country];
  const results: NationalMatchResult[] = [];

  // Get opponents pool
  const allOpponents = [
    ...Object.entries(NATIONAL_TEAMS)
      .filter(([c]) => c !== country)
      .map(([, t]) => t),
    ...WORLD_CUP_TEAMS,
  ];

  // Shuffle opponents
  const shuffled = [...allOpponents].sort(() => rng.random() - 0.5);

  // Phase de groupes : 3 matchs
  const groupOpponents = shuffled.slice(0, 3);
  let groupPoints = 0;

  for (const opp of groupOpponents) {
    const match = simulateNationalMatch(team.rating, opp.rating, state.player.overallRating, rng);
    const won = match.teamGoals > match.opponentGoals;
    const draw = match.teamGoals === match.opponentGoals;
    if (won) groupPoints += 3;
    else if (draw) groupPoints += 1;

    results.push({
      opponent: opp.name,
      opponentFlag: opp.flag,
      playerGoals: match.playerGoals,
      playerAssists: match.playerAssists,
      teamGoals: match.teamGoals,
      opponentGoals: match.opponentGoals,
      round: 'Groupe',
    });
  }

  // Qualifié si >= 4 points (top 2 du groupe)
  if (groupPoints < 4) return results;

  // Huitièmes de finale
  const r16Opp = shuffled[3];
  const r16 = simulateNationalMatch(team.rating + 2, r16Opp.rating, state.player.overallRating, rng);
  results.push({
    opponent: r16Opp.name, opponentFlag: r16Opp.flag,
    playerGoals: r16.playerGoals, playerAssists: r16.playerAssists,
    teamGoals: r16.teamGoals, opponentGoals: r16.opponentGoals,
    round: '8èmes',
  });
  if (r16.teamGoals <= r16.opponentGoals) return results;

  // Quarts
  const qfOpp = shuffled[4];
  const qf = simulateNationalMatch(team.rating + 1, qfOpp.rating, state.player.overallRating, rng);
  results.push({
    opponent: qfOpp.name, opponentFlag: qfOpp.flag,
    playerGoals: qf.playerGoals, playerAssists: qf.playerAssists,
    teamGoals: qf.teamGoals, opponentGoals: qf.opponentGoals,
    round: 'Quarts',
  });
  if (qf.teamGoals <= qf.opponentGoals) return results;

  // Demies
  const sfOpp = shuffled[5];
  const sf = simulateNationalMatch(team.rating, sfOpp.rating + 2, state.player.overallRating, rng);
  results.push({
    opponent: sfOpp.name, opponentFlag: sfOpp.flag,
    playerGoals: sf.playerGoals, playerAssists: sf.playerAssists,
    teamGoals: sf.teamGoals, opponentGoals: sf.opponentGoals,
    round: 'Demies',
  });
  if (sf.teamGoals <= sf.opponentGoals) return results;

  // Finale
  const fOpp = shuffled[6];
  const f = simulateNationalMatch(team.rating, fOpp.rating + 3, state.player.overallRating, rng);
  results.push({
    opponent: fOpp.name, opponentFlag: fOpp.flag,
    playerGoals: f.playerGoals, playerAssists: f.playerAssists,
    teamGoals: f.teamGoals, opponentGoals: f.opponentGoals,
    round: 'Finale',
  });

  return results;
}

export const NationalTeamSystem = {
  isEligibleForNationalTeam,
  getCompetitionForYear,
  generateSquad,
  simulateNationalMatch,
  simulateCompetition,
  NATIONAL_TEAMS,
};
