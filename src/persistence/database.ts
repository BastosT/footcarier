import Dexie, { type Table } from 'dexie';
import type { SaveData, Club, SquadPlayer, LeagueState } from './types';

/**
 * FootballCareerDB - Dexie.js wrapper for IndexedDB persistence.
 * Stores game saves, clubs, players, and league data.
 */
export class FootballCareerDB extends Dexie {
  saves!: Table<SaveData, number>;
  clubs!: Table<Club, string>;
  players!: Table<SquadPlayer, string>;
  leagues!: Table<LeagueState, string>;

  constructor() {
    super('FootballCareerGame');
    this.version(1).stores({
      saves: '++slot, playerName, lastSaved',
      clubs: 'id, country, tier, division.level',
      players: 'id, clubId, position, overallRating',
      leagues: '[division.country+division.level], season',
    });
  }
}

/** Singleton database instance */
export const db = new FootballCareerDB();
