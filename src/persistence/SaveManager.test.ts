import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from './SaveManager';
import { db } from './database';
import type { GameState } from './types';

/**
 * Creates a minimal valid GameState for testing purposes.
 */
function createMockGameState(overrides?: Partial<GameState>): GameState {
  return {
    version: '1.0.0',
    player: {
      id: 'player-1',
      firstName: 'Kylian',
      lastName: 'Mbappé',
      nationality: 'france',
      position: 'ST',
      appearance: { skinTone: 3, hairStyle: 1, hairColor: 0, height: 'medium' },
      age: 25,
      stats: { pace: 95, shooting: 88, passing: 78, dribbling: 90, defending: 36, physical: 78 },
      potential: 95,
      overallRating: 91,
      fitness: 100,
      morale: 80,
      injury: null,
    },
    career: {
      currentClub: {
        id: 'psg',
        name: 'Paris Saint-Germain',
        country: 'france',
        division: { country: 'france', level: 1, name: 'Ligue 1' },
        tier: 'big',
        squad: [],
        finances: { budget: 200000000, wageBill: 5000000 },
        stadium: 'Parc des Princes',
        colors: { primary: '#004170', secondary: '#DA291C' },
      },
      contract: {
        clubId: 'psg',
        weeklySalary: 500000,
        bonusPerGoal: 10000,
        bonusPerAssist: 5000,
        duration: 4,
        seasonsRemaining: 3,
        signingBonus: 5000000,
      },
      season: 1,
      matchday: 5,
      trophies: [],
      transferHistory: [],
    },
    time: {
      currentDate: { day: 15, month: 9, year: 2024 },
      season: 1,
      weekday: 3,
      eventsThisWeek: 0,
      schedule: { nextMatch: null, seasonMatches: [] },
    },
    social: {
      popularity: 75,
      reputation: 80,
      coachRelation: 65,
      teamRelation: 70,
      socialFeed: [],
      pendingInterviews: [],
    },
    finance: {
      balance: 1000000,
      weeklyIncome: 500000,
      history: [],
    },
    leagues: [],
    ...overrides,
  };
}

describe('SaveManager', () => {
  let saveManager: SaveManager;

  beforeEach(async () => {
    // Clear the database before each test
    await db.delete();
    await db.open();
    saveManager = new SaveManager();
  });

  describe('validateSlot', () => {
    it('should reject slot 0', async () => {
      const state = createMockGameState();
      await expect(saveManager.saveGame(0, state)).rejects.toThrow('Slot invalide');
    });

    it('should reject slot 4', async () => {
      const state = createMockGameState();
      await expect(saveManager.saveGame(4, state)).rejects.toThrow('Slot invalide');
    });

    it('should reject non-integer slots', async () => {
      const state = createMockGameState();
      await expect(saveManager.saveGame(1.5, state)).rejects.toThrow('Slot invalide');
    });

    it('should reject negative slots', async () => {
      const state = createMockGameState();
      await expect(saveManager.saveGame(-1, state)).rejects.toThrow('Slot invalide');
    });
  });

  describe('saveGame', () => {
    it('should save a game state to slot 1', async () => {
      const state = createMockGameState();
      await saveManager.saveGame(1, state);

      const saves = await saveManager.listSaves();
      expect(saves).toHaveLength(1);
      expect(saves[0].slot).toBe(1);
      expect(saves[0].playerName).toBe('Kylian Mbappé');
      expect(saves[0].clubName).toBe('Paris Saint-Germain');
    });

    it('should overwrite an existing save in the same slot', async () => {
      const state1 = createMockGameState();
      const state2 = createMockGameState({
        player: { ...createMockGameState().player, firstName: 'Lionel', lastName: 'Messi' },
      });

      await saveManager.saveGame(1, state1);
      await saveManager.saveGame(1, state2);

      const saves = await saveManager.listSaves();
      expect(saves).toHaveLength(1);
      expect(saves[0].playerName).toBe('Lionel Messi');
    });

    it('should save to all 3 slots', async () => {
      const state = createMockGameState();
      await saveManager.saveGame(1, state);
      await saveManager.saveGame(2, state);
      await saveManager.saveGame(3, state);

      const saves = await saveManager.listSaves();
      expect(saves).toHaveLength(3);
    });
  });

  describe('loadGame', () => {
    it('should load a previously saved game state', async () => {
      const state = createMockGameState();
      await saveManager.saveGame(1, state);

      const loaded = await saveManager.loadGame(1);
      expect(loaded.player.firstName).toBe('Kylian');
      expect(loaded.player.lastName).toBe('Mbappé');
      expect(loaded.career.currentClub.name).toBe('Paris Saint-Germain');
      expect(loaded.career.season).toBe(1);
    });

    it('should throw when loading from an empty slot', async () => {
      await expect(saveManager.loadGame(1)).rejects.toThrow('Aucune sauvegarde trouvée');
    });
  });

  describe('listSaves', () => {
    it('should return an empty array when no saves exist', async () => {
      const saves = await saveManager.listSaves();
      expect(saves).toEqual([]);
    });

    it('should return metadata for all saves', async () => {
      const state = createMockGameState();
      await saveManager.saveGame(1, state);
      await saveManager.saveGame(3, state);

      const saves = await saveManager.listSaves();
      expect(saves).toHaveLength(2);
      expect(saves.map((s) => s.slot).sort()).toEqual([1, 3]);
    });

    it('should include correct metadata fields', async () => {
      const state = createMockGameState();
      await saveManager.saveGame(2, state);

      const saves = await saveManager.listSaves();
      expect(saves[0]).toMatchObject({
        slot: 2,
        playerName: 'Kylian Mbappé',
        clubName: 'Paris Saint-Germain',
        season: 1,
        date: { day: 15, month: 9, year: 2024 },
        overallRating: 91,
      });
      expect(saves[0].lastSaved).toBeInstanceOf(Date);
    });
  });

  describe('deleteSave', () => {
    it('should delete a save from a slot', async () => {
      const state = createMockGameState();
      await saveManager.saveGame(1, state);
      await saveManager.deleteSave(1);

      const saves = await saveManager.listSaves();
      expect(saves).toHaveLength(0);
    });

    it('should not throw when deleting from an empty slot', async () => {
      await expect(saveManager.deleteSave(1)).resolves.toBeUndefined();
    });
  });

  describe('exportSave', () => {
    it('should export a save as valid JSON', async () => {
      const state = createMockGameState();
      await saveManager.saveGame(1, state);

      const json = await saveManager.exportSave(1);
      const parsed = JSON.parse(json);
      expect(parsed.player.firstName).toBe('Kylian');
    });

    it('should throw when exporting from an empty slot', async () => {
      await expect(saveManager.exportSave(2)).rejects.toThrow('Aucune sauvegarde trouvée');
    });
  });

  describe('importSave', () => {
    it('should import a valid JSON save into the first available slot', async () => {
      const state = createMockGameState();
      const json = JSON.stringify(state);

      await saveManager.importSave(json);

      const saves = await saveManager.listSaves();
      expect(saves).toHaveLength(1);
      expect(saves[0].slot).toBe(1);
    });

    it('should import into the next free slot when some are occupied', async () => {
      const state = createMockGameState();
      await saveManager.saveGame(1, state);

      const json = JSON.stringify(state);
      await saveManager.importSave(json);

      const saves = await saveManager.listSaves();
      expect(saves).toHaveLength(2);
      const slots = saves.map((s) => s.slot).sort();
      expect(slots).toEqual([1, 2]);
    });

    it('should throw when all 3 slots are full', async () => {
      const state = createMockGameState();
      await saveManager.saveGame(1, state);
      await saveManager.saveGame(2, state);
      await saveManager.saveGame(3, state);

      const json = JSON.stringify(state);
      await expect(saveManager.importSave(json)).rejects.toThrow('Tous les slots de sauvegarde sont occupés');
    });

    it('should throw on invalid JSON', async () => {
      await expect(saveManager.importSave('not json')).rejects.toThrow('JSON malformé');
    });

    it('should throw on incomplete game state', async () => {
      const json = JSON.stringify({ version: '1.0.0' });
      await expect(saveManager.importSave(json)).rejects.toThrow('données manquantes');
    });
  });

  describe('3 save slots maximum constraint', () => {
    it('should allow saving to slots 1, 2, and 3', async () => {
      const state = createMockGameState();
      await saveManager.saveGame(1, state);
      await saveManager.saveGame(2, state);
      await saveManager.saveGame(3, state);

      const saves = await saveManager.listSaves();
      expect(saves).toHaveLength(3);
    });

    it('should reject slot numbers above 3', async () => {
      const state = createMockGameState();
      await expect(saveManager.saveGame(4, state)).rejects.toThrow('Slot invalide');
    });

    it('should allow overwriting existing slots without exceeding limit', async () => {
      const state = createMockGameState();
      await saveManager.saveGame(1, state);
      await saveManager.saveGame(2, state);
      await saveManager.saveGame(3, state);

      // Overwrite slot 2 - should not increase count
      await saveManager.saveGame(2, state);
      const saves = await saveManager.listSaves();
      expect(saves).toHaveLength(3);
    });
  });
});
