/**
 * Générateur de calendrier pour la phase de ligue de la Ligue des Champions.
 * Génère les 200 fixtures (50 équipes × 8 matchs / 2) et assigne les dates
 * mardi/mercredi de septembre à janvier (8 journées).
 *
 * Requirements: 2.2, 2.3, 4.1, 4.2, 4.7
 */

import type { GameDate, ScheduledMatch } from '../../core/types';
import type { CLParticipant, CLFixture, CLScheduledMatch, KnockoutRound } from './types';
import { CL_CONSTANTS } from './types';
import { type RNG, defaultRNG } from '../../utils/random';

/**
 * Génère les 200 fixtures de la phase de ligue.
 * Chaque équipe joue exactement 8 matchs (4 domicile, 4 extérieur) contre 8 adversaires différents.
 *
 * Algorithme déterministe basé sur le round-robin circulaire :
 * 1. Mélanger les participants pour le tirage aléatoire
 * 2. Utiliser 8 rounds d'un round-robin circulaire pour garantir que chaque équipe
 *    joue exactement une fois par round (= matchday) contre un adversaire unique
 * 3. Assigner les rôles domicile/extérieur pour obtenir exactement 4H/4A par équipe
 *
 * @param participants - Les 50 participants à la CL
 * @param rng - Générateur aléatoire optionnel
 * @returns Les 200 fixtures réparties sur 8 journées
 */
export function generateLeaguePhaseFixtures(
  participants: CLParticipant[],
  rng: RNG = defaultRNG
): CLFixture[] {
  const n = participants.length; // 50
  const matchdays = CL_CONSTANTS.LEAGUE_PHASE_MATCHDAYS; // 8
  const homeMatches = CL_CONSTANTS.HOME_MATCHES; // 4

  // Mélanger les participants pour le tirage aléatoire
  const shuffled = shuffleArray([...participants], rng);

  // Utiliser le round-robin circulaire pour générer 8 rounds.
  // Avec n=50 (pair), chaque round produit exactement 25 matchs,
  // et chaque équipe joue exactement une fois par round.
  // On prend les 8 premiers rounds d'un round-robin complet (qui en a 49).
  // Cela garantit que chaque équipe affronte 8 adversaires distincts.

  // Round-robin circulaire : fixer l'équipe 0, faire tourner les autres
  const rounds: Array<Array<[number, number]>> = [];
  const indices = Array.from({ length: n }, (_, i) => i);

  // Générer les rounds en utilisant l'algorithme du cercle
  // On sélectionne 8 rounds parmi les 49 possibles, de manière espacée et aléatoire
  const allRoundIndices = Array.from({ length: n - 1 }, (_, i) => i);
  shuffleArrayInPlace(allRoundIndices, rng);
  const selectedRounds = allRoundIndices.slice(0, matchdays);

  for (const roundIdx of selectedRounds) {
    const round: Array<[number, number]> = [];
    // Rotation circulaire : position 0 est fixe, les autres tournent
    const rotated = [indices[0]];
    for (let i = 1; i < n; i++) {
      const newPos = ((i - 1 + roundIdx) % (n - 1)) + 1;
      rotated.push(indices[newPos]);
    }

    // Apparier : premier avec dernier, deuxième avec avant-dernier, etc.
    for (let i = 0; i < n / 2; i++) {
      round.push([rotated[i], rotated[n - 1 - i]]);
    }
    rounds.push(round);
  }

  // Phase 2: Assigner les rôles domicile/extérieur pour obtenir exactement 4H/4A.
  // Algorithme garanti basé sur la décomposition en Euler :
  // Pour un graphe 8-régulier, on peut toujours orienter les arêtes pour que
  // chaque sommet ait in-degree = out-degree = 4.
  // 
  // Méthode : trouver des chemins/cycles alternants dans le graphe des déséquilibres.
  // On commence par une assignation arbitraire, puis on corrige via des chaînes alternantes.

  // Collecter toutes les paires avec adjacence
  interface Pairing { idxA: number; idxB: number; matchday: number; homeIsA: boolean }
  const pairings: Pairing[] = [];

  for (let md = 0; md < rounds.length; md++) {
    const round = rounds[md];
    for (const [i, j] of round) {
      pairings.push({ idxA: i, idxB: j, matchday: md + 1, homeIsA: true });
    }
  }

  // Initial home count: all "A" teams are home
  const homeCount = new Array(n).fill(0);
  for (const p of pairings) {
    homeCount[p.idxA]++;
  }

  // Fix using augmenting paths: find teams with too many home matches
  // and swap along a path to a team with too few home matches.
  // Build adjacency: for each team, list of pairings they're involved in
  const teamPairings = new Array(n).fill(null).map(() => [] as number[]);
  for (let pi = 0; pi < pairings.length; pi++) {
    teamPairings[pairings[pi].idxA].push(pi);
    teamPairings[pairings[pi].idxB].push(pi);
  }

  // BFS to find augmenting path from an "over" team to an "under" team
  function findAugmentingPath(startIdx: number): number[] | null {
    // BFS: from startIdx (homeCount > 4), find a path to a team with homeCount < 4
    // by alternating: flip a pairing where startIdx is home → follow to opponent → 
    // flip a pairing where opponent is away → etc.
    const visited = new Set<number>();
    visited.add(startIdx);
    // Queue entries: [teamIdx, path of pairing indices to flip]
    const queue: Array<[number, number[]]> = [[startIdx, []]];

    while (queue.length > 0) {
      const [currentTeam, path] = queue.shift()!;

      // Look for pairings where currentTeam is currently home (can flip to make them away)
      for (const pi of teamPairings[currentTeam]) {
        const p = pairings[pi];
        const isHome = (p.homeIsA && p.idxA === currentTeam) || (!p.homeIsA && p.idxB === currentTeam);
        if (!isHome) continue;

        // The opponent in this pairing
        const opponent = p.idxA === currentTeam ? p.idxB : p.idxA;
        if (visited.has(opponent)) continue;
        visited.add(opponent);

        const newPath = [...path, pi];

        // If flipping this makes opponent have homeCount <= 4, we're done
        if (homeCount[opponent] + 1 <= homeMatches) {
          return newPath;
        }

        // Otherwise, opponent now has too many home matches too, continue BFS
        queue.push([opponent, newPath]);
      }
    }
    return null;
  }

  // Iteratively fix all teams with homeCount > 4
  let maxIterations = n * matchdays; // Safety limit
  while (maxIterations-- > 0) {
    // Find a team with too many home matches
    let overTeam = -1;
    for (let i = 0; i < n; i++) {
      if (homeCount[i] > homeMatches) {
        overTeam = i;
        break;
      }
    }
    if (overTeam === -1) break; // All balanced

    const path = findAugmentingPath(overTeam);
    if (!path || path.length === 0) break; // Should not happen for valid graphs

    // Flip all pairings in the path
    for (const pi of path) {
      const p = pairings[pi];
      const oldHome = p.homeIsA ? p.idxA : p.idxB;
      const oldAway = p.homeIsA ? p.idxB : p.idxA;
      p.homeIsA = !p.homeIsA;
      homeCount[oldHome]--;
      homeCount[oldAway]++;
    }
  }

  // Build fixtures
  const fixtures: CLFixture[] = [];
  for (const p of pairings) {
    const homeTeamId = p.homeIsA ? shuffled[p.idxA].id : shuffled[p.idxB].id;
    const awayTeamId = p.homeIsA ? shuffled[p.idxB].id : shuffled[p.idxA].id;

    fixtures.push({
      homeTeamId,
      awayTeamId,
      matchday: p.matchday,
    });
  }

  return fixtures;
}



/**
 * Assigne les dates mardi/mercredi aux fixtures de la phase de ligue.
 * Les 8 journées sont réparties entre septembre et janvier de la saison donnée.
 * Évite les conflits avec le calendrier de championnat du joueur.
 *
 * @param fixtures - Les fixtures à planifier
 * @param season - L'année de début de la saison (ex: 2024 pour la saison 2024-2025)
 * @param playerClubSchedule - Le calendrier de championnat du club du joueur
 * @returns Les matchs planifiés avec dates
 */
export function assignDates(
  fixtures: CLFixture[],
  season: number,
  playerClubSchedule: ScheduledMatch[]
): CLScheduledMatch[] {
  // Générer les dates mardi/mercredi disponibles de septembre à janvier
  const availableDates = generateTuesdayWednesdayDates(season);

  // Créer un set des dates occupées par le calendrier du joueur
  const playerMatchDates = new Set(
    playerClubSchedule.map((m) => gameDateToKey(m.date))
  );

  // Filtrer les dates qui ne sont pas en conflit avec le calendrier du joueur
  const validDates = availableDates.filter(
    (d) => !playerMatchDates.has(gameDateToKey(d))
  );

  // Répartir les dates sur les 8 journées (au moins 1 date par journée)
  const matchdayDates = distributeMatchdayDates(validDates);

  // Assigner les dates aux fixtures
  const scheduledMatches: CLScheduledMatch[] = [];

  for (const fixture of fixtures) {
    const md = fixture.matchday;
    const dates = matchdayDates.get(md);
    if (!dates || dates.length === 0) {
      // Fallback : utiliser la première date disponible pour cette journée
      const fallbackDate = validDates[md - 1] ?? availableDates[md - 1] ?? { day: 15 + md, month: 9, year: season };
      scheduledMatches.push({
        date: fallbackDate,
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        matchday: fixture.matchday,
        phase: 'league',
      });
    } else {
      // Utiliser la date de la journée correspondante
      scheduledMatches.push({
        date: dates[0],
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        matchday: fixture.matchday,
        phase: 'league',
      });
    }
  }

  return scheduledMatches;
}

/**
 * Génère toutes les dates mardi/mercredi entre septembre et janvier pour une saison donnée.
 * Septembre à décembre de l'année `season`, janvier de l'année `season + 1`.
 */
function generateTuesdayWednesdayDates(season: number): GameDate[] {
  const dates: GameDate[] = [];

  // Mois de septembre (9) à décembre (12) de l'année season
  for (let month = 9; month <= 12; month++) {
    const daysInMonth = getDaysInMonth(month, season);
    for (let day = 1; day <= daysInMonth; day++) {
      const weekday = getWeekday(day, month, season);
      // Mardi = 2, Mercredi = 3 (convention JS: 0=dimanche, 1=lundi, 2=mardi, 3=mercredi)
      if (weekday === 2 || weekday === 3) {
        dates.push({ day, month, year: season });
      }
    }
  }

  // Janvier de l'année season + 1
  const janYear = season + 1;
  const daysInJan = getDaysInMonth(1, janYear);
  for (let day = 1; day <= daysInJan; day++) {
    const weekday = getWeekday(day, 1, janYear);
    if (weekday === 2 || weekday === 3) {
      dates.push({ day, month: 1, year: janYear });
    }
  }

  return dates;
}

/**
 * Répartit les dates disponibles sur les 8 journées.
 * Espace les journées de manière régulière entre septembre et janvier.
 */
function distributeMatchdayDates(dates: GameDate[]): Map<number, GameDate[]> {
  const matchdayDates = new Map<number, GameDate[]>();
  const matchdays = CL_CONSTANTS.LEAGUE_PHASE_MATCHDAYS; // 8

  if (dates.length === 0) {
    for (let md = 1; md <= matchdays; md++) {
      matchdayDates.set(md, []);
    }
    return matchdayDates;
  }

  // Répartir les dates de manière équidistante
  const step = Math.max(1, Math.floor(dates.length / matchdays));

  for (let md = 1; md <= matchdays; md++) {
    const index = Math.min((md - 1) * step, dates.length - 1);
    matchdayDates.set(md, [dates[index]]);
  }

  return matchdayDates;
}

/**
 * Retourne le jour de la semaine pour une date donnée.
 * 0 = dimanche, 1 = lundi, 2 = mardi, 3 = mercredi, 4 = jeudi, 5 = vendredi, 6 = samedi
 */
function getWeekday(day: number, month: number, year: number): number {
  const date = new Date(year, month - 1, day);
  return date.getDay();
}

/**
 * Retourne le nombre de jours dans un mois donné.
 */
function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Convertit une GameDate en clé string pour comparaison.
 */
function gameDateToKey(date: GameDate): string {
  return `${date.year}-${date.month}-${date.day}`;
}

/**
 * Mélange un tableau en place (Fisher-Yates) avec le RNG fourni.
 */
function shuffleArrayInPlace<T>(array: T[], rng: RNG): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = rng.randomInt(0, i);
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Retourne une copie mélangée du tableau.
 */
function shuffleArray<T>(array: T[], rng: RNG): T[] {
  const copy = [...array];
  shuffleArrayInPlace(copy, rng);
  return copy;
}

/**
 * Génère le calendrier des tours éliminatoires de la Ligue des Champions.
 * - Huitièmes de finale : février-mars (mardi/mercredi)
 * - Quarts de finale : avril (mardi/mercredi)
 * - Demi-finales : avril-mai (mardi/mercredi)
 * - Finale : dernier samedi de mai
 *
 * Chaque confrontation aller-retour a 2 dates espacées de ~2-3 semaines.
 * La finale est un match unique.
 *
 * Requirements: 4.3, 4.4, 4.5, 4.6
 *
 * @param season - L'année de début de la saison (ex: 2024 pour la saison 2024-2025)
 * @param round - Le tour éliminatoire à planifier
 * @param playerClubSchedule - Le calendrier de championnat du club du joueur (pour éviter les conflits)
 * @returns Les dates planifiées pour le tour (2 dates pour aller-retour, 1 pour la finale)
 */
export function generateKnockoutSchedule(
  season: number,
  round: KnockoutRound,
  playerClubSchedule: ScheduledMatch[] = []
): CLScheduledMatch[] {
  const knockoutYear = season + 1; // Les tours éliminatoires se jouent l'année suivante

  if (round === 'final') {
    // La finale est le dernier samedi de mai
    const finalDate = getLastSaturdayOfMay(knockoutYear);
    return [{
      date: finalDate,
      homeTeamId: '', // À remplir lors du tirage
      awayTeamId: '', // À remplir lors du tirage
      matchday: 1,
      phase: 'final',
    }];
  }

  // Pour les tours aller-retour, générer 2 dates (mardi/mercredi)
  const { months, minWeekGap } = getKnockoutRoundConfig(round);

  // Générer les dates mardi/mercredi disponibles pour les mois du tour
  const availableDates = generateTuesdayWednesdayDatesForMonths(knockoutYear, months);

  // Créer un set des dates occupées par le calendrier du joueur
  const playerMatchDates = new Set(
    playerClubSchedule.map((m) => gameDateToKey(m.date))
  );

  // Filtrer les dates qui ne sont pas en conflit avec le calendrier du joueur
  const validDates = availableDates.filter(
    (d) => !playerMatchDates.has(gameDateToKey(d))
  );

  // Sélectionner 2 dates espacées d'au moins minWeekGap semaines
  const selectedDates = selectTwoLegDates(validDates, minWeekGap);

  // Construire les matchs planifiés (aller et retour)
  const scheduledMatches: CLScheduledMatch[] = [
    {
      date: selectedDates[0],
      homeTeamId: '', // À remplir lors du tirage
      awayTeamId: '', // À remplir lors du tirage
      matchday: 1,
      phase: round,
      leg: 1,
    },
    {
      date: selectedDates[1],
      homeTeamId: '', // À remplir lors du tirage
      awayTeamId: '', // À remplir lors du tirage
      matchday: 2,
      phase: round,
      leg: 2,
    },
  ];

  return scheduledMatches;
}

/**
 * Configuration des mois et espacement pour chaque tour éliminatoire.
 */
function getKnockoutRoundConfig(round: KnockoutRound): { months: number[]; minWeekGap: number } {
  switch (round) {
    case 'round-of-16':
      // Février-Mars
      return { months: [2, 3], minWeekGap: 2 };
    case 'quarter-final':
      // Avril
      return { months: [4], minWeekGap: 2 };
    case 'semi-final':
      // Avril-Mai
      return { months: [4, 5], minWeekGap: 2 };
    default:
      return { months: [5], minWeekGap: 2 };
  }
}

/**
 * Génère toutes les dates mardi/mercredi pour les mois spécifiés d'une année donnée.
 */
function generateTuesdayWednesdayDatesForMonths(year: number, months: number[]): GameDate[] {
  const dates: GameDate[] = [];

  for (const month of months) {
    const daysInMonth = getDaysInMonth(month, year);
    for (let day = 1; day <= daysInMonth; day++) {
      const weekday = getWeekday(day, month, year);
      // Mardi = 2, Mercredi = 3 (convention JS: 0=dimanche, 1=lundi, 2=mardi, 3=mercredi)
      if (weekday === 2 || weekday === 3) {
        dates.push({ day, month, year });
      }
    }
  }

  return dates;
}

/**
 * Sélectionne 2 dates espacées d'au moins `minWeekGap` semaines pour les matchs aller-retour.
 * Si pas assez de dates valides, utilise un fallback raisonnable.
 */
function selectTwoLegDates(validDates: GameDate[], minWeekGap: number): [GameDate, GameDate] {
  const minDayGap = minWeekGap * 7;

  if (validDates.length === 0) {
    // Fallback : dates par défaut si aucune date valide
    return [
      { day: 15, month: 2, year: 2025 },
      { day: 8, month: 3, year: 2025 },
    ];
  }

  if (validDates.length === 1) {
    // Fallback : utiliser la seule date disponible et en créer une 3 semaines plus tard
    const firstDate = validDates[0];
    const secondDate = addDays(firstDate, 21);
    return [firstDate, secondDate];
  }

  // Trouver la première date et la première date suffisamment espacée
  const firstDate = validDates[0];

  for (let i = 1; i < validDates.length; i++) {
    const daysDiff = daysBetween(firstDate, validDates[i]);
    if (daysDiff >= minDayGap) {
      return [firstDate, validDates[i]];
    }
  }

  // Si aucune paire suffisamment espacée, prendre la première et la dernière
  return [validDates[0], validDates[validDates.length - 1]];
}

/**
 * Retourne le dernier samedi du mois de mai pour une année donnée.
 */
function getLastSaturdayOfMay(year: number): GameDate {
  // Parcourir les jours de mai en partant de la fin
  const daysInMay = getDaysInMonth(5, year);
  for (let day = daysInMay; day >= 1; day--) {
    const weekday = getWeekday(day, 5, year);
    // Samedi = 6
    if (weekday === 6) {
      return { day, month: 5, year };
    }
  }
  // Fallback (ne devrait jamais arriver)
  return { day: 31, month: 5, year };
}

/**
 * Calcule le nombre de jours entre deux GameDate.
 */
function daysBetween(a: GameDate, b: GameDate): number {
  const dateA = new Date(a.year, a.month - 1, a.day);
  const dateB = new Date(b.year, b.month - 1, b.day);
  return Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Ajoute un nombre de jours à une GameDate.
 */
function addDays(date: GameDate, days: number): GameDate {
  const d = new Date(date.year, date.month - 1, date.day);
  d.setDate(d.getDate() + days);
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
}

export const CLScheduleGenerator = { generateLeaguePhaseFixtures, assignDates, generateKnockoutSchedule };
