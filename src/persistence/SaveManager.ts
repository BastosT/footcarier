import { db } from './database';
import type { GameState, SaveData, SaveSlot } from './types';

const MAX_SAVE_SLOTS = 3;

/**
 * ISaveManager - Interface for game save management.
 */
export interface ISaveManager {
  saveGame(slot: number, gameState: GameState): Promise<void>;
  loadGame(slot: number): Promise<GameState>;
  listSaves(): Promise<SaveSlot[]>;
  deleteSave(slot: number): Promise<void>;
  exportSave(slot: number): Promise<string>;
  importSave(json: string): Promise<void>;
}

/**
 * SaveManager handles persistence of game state to IndexedDB via Dexie.js.
 * Enforces a maximum of 3 save slots.
 */
export class SaveManager implements ISaveManager {
  /**
   * Save the current game state to a specific slot (1-3).
   * Overwrites existing data in that slot.
   * @throws Error if slot is out of range or storage is unavailable.
   */
  async saveGame(slot: number, gameState: GameState): Promise<void> {
    this.validateSlot(slot);

    const saveData: SaveData = {
      slot,
      playerName: `${gameState.player.firstName} ${gameState.player.lastName}`,
      clubName: gameState.career.currentClub.name,
      season: gameState.career.season,
      date: gameState.time.currentDate,
      lastSaved: new Date(),
      overallRating: gameState.player.overallRating,
      gameState,
    };

    try {
      // Use put to upsert (insert or update) by slot key
      await db.saves.put(saveData);
    } catch (error) {
      throw new Error(
        `Impossible de sauvegarder. Vérifiez que votre navigateur autorise le stockage local. (${error instanceof Error ? error.message : 'Unknown error'})`
      );
    }
  }

  /**
   * Load a game state from a specific slot.
   * @throws Error if slot doesn't exist or data is corrupted.
   */
  async loadGame(slot: number): Promise<GameState> {
    this.validateSlot(slot);

    try {
      const saveData = await db.saves.get(slot);

      if (!saveData) {
        throw new Error(`Aucune sauvegarde trouvée dans le slot ${slot}.`);
      }

      if (!saveData.gameState) {
        throw new Error(
          `Données corrompues dans le slot ${slot}. Veuillez supprimer cette sauvegarde et démarrer une nouvelle partie.`
        );
      }

      return saveData.gameState;
    } catch (error) {
      if (error instanceof Error && error.message.includes('slot')) {
        throw error;
      }
      throw new Error(
        `Impossible de charger la sauvegarde. Vérifiez que votre navigateur autorise le stockage local. (${error instanceof Error ? error.message : 'Unknown error'})`
      );
    }
  }

  /**
   * List all existing saves with their metadata.
   * Returns an array of SaveSlot (max 3 entries).
   */
  async listSaves(): Promise<SaveSlot[]> {
    try {
      const saves = await db.saves.toArray();
      return saves.map((save) => ({
        slot: save.slot!,
        playerName: save.playerName,
        clubName: save.clubName,
        season: save.season,
        date: save.date,
        lastSaved: save.lastSaved,
        overallRating: save.overallRating,
      }));
    } catch (error) {
      throw new Error(
        `Impossible de lister les sauvegardes. Vérifiez que votre navigateur autorise le stockage local. (${error instanceof Error ? error.message : 'Unknown error'})`
      );
    }
  }

  /**
   * Delete a save from a specific slot.
   * @throws Error if slot is out of range.
   */
  async deleteSave(slot: number): Promise<void> {
    this.validateSlot(slot);

    try {
      await db.saves.delete(slot);
    } catch (error) {
      throw new Error(
        `Impossible de supprimer la sauvegarde. (${error instanceof Error ? error.message : 'Unknown error'})`
      );
    }
  }

  /**
   * Export a save as a JSON string for backup/sharing.
   * @throws Error if slot doesn't exist.
   */
  async exportSave(slot: number): Promise<string> {
    this.validateSlot(slot);

    const saveData = await db.saves.get(slot);
    if (!saveData) {
      throw new Error(`Aucune sauvegarde trouvée dans le slot ${slot}.`);
    }

    return JSON.stringify(saveData.gameState);
  }

  /**
   * Import a save from a JSON string into the next available slot.
   * @throws Error if all slots are full or JSON is invalid.
   */
  async importSave(json: string): Promise<void> {
    let gameState: GameState;

    try {
      gameState = JSON.parse(json) as GameState;
    } catch {
      throw new Error('Le fichier de sauvegarde est invalide (JSON malformé).');
    }

    if (!gameState.player || !gameState.career || !gameState.time) {
      throw new Error(
        'Le fichier de sauvegarde est corrompu (données manquantes).'
      );
    }

    // Find the next available slot
    const existingSaves = await this.listSaves();
    if (existingSaves.length >= MAX_SAVE_SLOTS) {
      throw new Error(
        `Tous les slots de sauvegarde sont occupés (maximum ${MAX_SAVE_SLOTS}). Supprimez une sauvegarde avant d'importer.`
      );
    }

    // Find the first free slot number (1-3)
    const usedSlots = new Set(existingSaves.map((s) => s.slot));
    let freeSlot = 1;
    while (usedSlots.has(freeSlot) && freeSlot <= MAX_SAVE_SLOTS) {
      freeSlot++;
    }

    await this.saveGame(freeSlot, gameState);
  }

  /**
   * Validate that a slot number is within the allowed range.
   */
  private validateSlot(slot: number): void {
    if (!Number.isInteger(slot) || slot < 1 || slot > MAX_SAVE_SLOTS) {
      throw new Error(
        `Slot invalide : ${slot}. Les slots valides sont 1 à ${MAX_SAVE_SLOTS}.`
      );
    }
  }
}

/** Singleton SaveManager instance */
export const saveManager = new SaveManager();
