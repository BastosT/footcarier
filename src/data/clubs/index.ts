/**
 * Point d'entrée pour toutes les données de clubs.
 * Exporte les clubs par pays et un tableau global.
 */

export { franceClubs, franceLigue1Clubs, franceLigue2Clubs } from './france';
export { spainClubs, spainLaLigaClubs, spainSegundaClubs } from './spain';
export { englandClubs, englandPremierLeagueClubs, englandChampionshipClubs } from './england';
export { italyClubs, italySerieAClubs, italySerieBClubs } from './italy';
export { germanyClubs, germanyBundesligaClubs, germany2BundesligaClubs } from './germany';

import { franceClubs } from './france';
import { spainClubs } from './spain';
import { englandClubs } from './england';
import { italyClubs } from './italy';
import { germanyClubs } from './germany';
import type { Club, Country } from '../../core/types';

/** Tous les clubs de tous les pays */
export const allClubs: Club[] = [
  ...franceClubs,
  ...spainClubs,
  ...englandClubs,
  ...italyClubs,
  ...germanyClubs,
];

/** Clubs par pays */
export const clubsByCountry: Record<Country, Club[]> = {
  france: franceClubs,
  spain: spainClubs,
  england: englandClubs,
  italy: italyClubs,
  germany: germanyClubs,
};
