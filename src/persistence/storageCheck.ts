/**
 * storageCheck - Détecte la disponibilité d'IndexedDB au démarrage.
 */

export interface StorageStatus {
  available: boolean;
  error?: string;
}

/**
 * Vérifie si IndexedDB est disponible et fonctionnel.
 */
export async function checkStorageAvailability(): Promise<StorageStatus> {
  // Check if IndexedDB API exists
  if (typeof indexedDB === 'undefined') {
    return {
      available: false,
      error: 'IndexedDB n\'est pas disponible dans ce navigateur.',
    };
  }

  // Try to open a test database
  try {
    const testDbName = '__storage_test__';
    const request = indexedDB.open(testDbName, 1);

    await new Promise<void>((resolve, reject) => {
      request.onerror = () => reject(new Error('Impossible d\'ouvrir IndexedDB'));
      request.onsuccess = () => {
        request.result.close();
        indexedDB.deleteDatabase(testDbName);
        resolve();
      };
      request.onblocked = () => reject(new Error('IndexedDB est bloqué'));
    });

    return { available: true };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error
        ? `Impossible de sauvegarder. Vérifiez que votre navigateur autorise le stockage local. (${error.message})`
        : 'Stockage indisponible.',
    };
  }
}

/**
 * Estime l'espace disponible (si l'API est supportée).
 */
export async function estimateStorageQuota(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage || !navigator.storage.estimate) return null;

  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
    };
  } catch {
    return null;
  }
}
