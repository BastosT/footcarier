/**
 * Gestion d'erreurs globale pour la persistance.
 * Détecte l'indisponibilité d'IndexedDB et gère les erreurs de stockage.
 */

/**
 * Vérifie si IndexedDB est disponible dans le navigateur.
 */
export async function checkIndexedDBAvailability(): Promise<{ available: boolean; error?: string }> {
  if (typeof indexedDB === 'undefined') {
    return { available: false, error: 'IndexedDB n\'est pas supporté par ce navigateur.' };
  }

  try {
    const testDB = indexedDB.open('__test_availability__');
    return new Promise((resolve) => {
      testDB.onsuccess = () => {
        testDB.result.close();
        indexedDB.deleteDatabase('__test_availability__');
        resolve({ available: true });
      };
      testDB.onerror = () => {
        resolve({
          available: false,
          error: 'Impossible d\'accéder au stockage local. Vérifiez les paramètres de votre navigateur.',
        });
      };
      testDB.onblocked = () => {
        resolve({
          available: false,
          error: 'Le stockage est bloqué. Fermez les autres onglets du jeu.',
        });
      };
    });
  } catch {
    return {
      available: false,
      error: 'Erreur inattendue lors de la vérification du stockage.',
    };
  }
}

/**
 * Estime l'espace de stockage disponible (si l'API est supportée).
 */
export async function checkStorageQuota(): Promise<{ available: boolean; usedMB?: number; totalMB?: number }> {
  if (!navigator.storage || !navigator.storage.estimate) {
    return { available: true }; // Can't check, assume OK
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usedMB = Math.round((estimate.usage ?? 0) / 1024 / 1024);
    const totalMB = Math.round((estimate.quota ?? 0) / 1024 / 1024);

    // Warn if less than 10MB available
    const available = (estimate.quota ?? 0) - (estimate.usage ?? 0) > 10 * 1024 * 1024;
    return { available, usedMB, totalMB };
  } catch {
    return { available: true };
  }
}

export type StorageErrorType = 'unavailable' | 'quota_exceeded' | 'corrupted' | 'unknown';

export interface StorageError {
  type: StorageErrorType;
  message: string;
  recoverable: boolean;
}

/**
 * Classifie une erreur de stockage.
 */
export function classifyStorageError(error: unknown): StorageError {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('QuotaExceededError') || message.includes('quota')) {
    return {
      type: 'quota_exceeded',
      message: 'Espace de stockage insuffisant. Supprimez d\'anciennes sauvegardes.',
      recoverable: true,
    };
  }

  if (message.includes('corrompu') || message.includes('corrupted')) {
    return {
      type: 'corrupted',
      message: 'Données corrompues. Veuillez démarrer une nouvelle partie.',
      recoverable: false,
    };
  }

  if (message.includes('stockage') || message.includes('storage') || message.includes('IndexedDB')) {
    return {
      type: 'unavailable',
      message: 'Impossible de sauvegarder. Vérifiez que votre navigateur autorise le stockage local.',
      recoverable: false,
    };
  }

  return {
    type: 'unknown',
    message: `Erreur inattendue : ${message}`,
    recoverable: false,
  };
}
