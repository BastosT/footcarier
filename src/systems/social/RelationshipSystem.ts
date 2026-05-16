/**
 * RelationshipSystem — Gère les relations amoureuses du joueur.
 * Style Tinder : swipe, match, puis interactions (cadeaux, voyages, intimité, fiançailles, mariage).
 */

import type { Relationship, RelationshipState, RelationshipHistoryEntry, GameDate } from '../../core/types';
import { clamp } from '../../utils/math';

// ─── Constantes ──────────────────────────────────────────────────────────────

/** Coût des cadeaux par tier */
export const GIFT_TIERS = [
  { id: 'flowers', name: 'Bouquet de fleurs', emoji: '💐', cost: 100, loveGain: 3 },
  { id: 'perfume', name: 'Parfum de luxe', emoji: '🧴', cost: 500, loveGain: 5 },
  { id: 'jewelry-gift', name: 'Bijou', emoji: '💍', cost: 2_000, loveGain: 8 },
  { id: 'designer-bag', name: 'Sac de créateur', emoji: '👜', cost: 5_000, loveGain: 12 },
  { id: 'watch-gift', name: 'Montre de luxe', emoji: '⌚', cost: 15_000, loveGain: 18 },
  { id: 'car-gift', name: 'Voiture', emoji: '🚗', cost: 50_000, loveGain: 25 },
] as const;

/** Voyages disponibles */
export const TRAVEL_OPTIONS = [
  { id: 'weekend-paris', name: 'Week-end à Paris', emoji: '🗼', cost: 2_000, loveGain: 8 },
  { id: 'trip-barcelona', name: 'Barcelone', emoji: '🇪🇸', cost: 5_000, loveGain: 12 },
  { id: 'trip-dubai', name: 'Dubaï', emoji: '🏜️', cost: 15_000, loveGain: 18 },
  { id: 'trip-maldives', name: 'Maldives', emoji: '🏝️', cost: 30_000, loveGain: 22 },
  { id: 'trip-bora', name: 'Bora Bora', emoji: '🌺', cost: 50_000, loveGain: 28 },
  { id: 'world-tour', name: 'Tour du monde', emoji: '🌍', cost: 100_000, loveGain: 35 },
] as const;

/** Seuils pour les actions */
export const THRESHOLDS = {
  intimacy: 30,       // love minimum pour intimité
  proposal: 60,       // love minimum pour fiançailles
  wedding: 80,        // love minimum pour mariage
} as const;

// ─── Fonctions ───────────────────────────────────────────────────────────────

/**
 * Démarre une nouvelle relation (match Tinder).
 */
export function startRelationship(
  state: RelationshipState,
  womanId: string,
  womanName: string,
  currentDate: GameDate
): RelationshipState {
  const newRelationship: Relationship = {
    womanId,
    womanName,
    status: 'dating',
    love: 10,
    startDate: currentDate,
    lastInteraction: currentDate,
    giftsGiven: 0,
    tripsCount: 0,
    intimacyCount: 0,
  };

  return {
    ...state,
    current: newRelationship,
  };
}

/**
 * Offrir un cadeau — augmente l'amour.
 */
export function giveGift(
  relationship: Relationship,
  loveGain: number,
  currentDate: GameDate
): Relationship {
  return {
    ...relationship,
    love: clamp(relationship.love + loveGain, 0, 100),
    giftsGiven: relationship.giftsGiven + 1,
    lastInteraction: currentDate,
  };
}

/**
 * Partir en voyage — augmente l'amour.
 */
export function goOnTrip(
  relationship: Relationship,
  loveGain: number,
  currentDate: GameDate
): Relationship {
  return {
    ...relationship,
    love: clamp(relationship.love + loveGain, 0, 100),
    tripsCount: relationship.tripsCount + 1,
    lastInteraction: currentDate,
  };
}

/**
 * Intimité — augmente l'amour (nécessite love >= 30).
 */
export function intimacy(
  relationship: Relationship,
  currentDate: GameDate
): Relationship | null {
  if (relationship.love < THRESHOLDS.intimacy) return null;

  return {
    ...relationship,
    love: clamp(relationship.love + 5, 0, 100),
    intimacyCount: relationship.intimacyCount + 1,
    lastInteraction: currentDate,
  };
}

/**
 * Demande en fiançailles (nécessite love >= 60).
 */
export function propose(
  relationship: Relationship,
  currentDate: GameDate
): Relationship | null {
  if (relationship.love < THRESHOLDS.proposal) return null;
  if (relationship.status !== 'dating') return null;

  return {
    ...relationship,
    status: 'engaged',
    love: clamp(relationship.love + 10, 0, 100),
    lastInteraction: currentDate,
  };
}

/**
 * Mariage (nécessite love >= 80 et statut "engaged").
 */
export function marry(
  relationship: Relationship,
  currentDate: GameDate
): Relationship | null {
  if (relationship.love < THRESHOLDS.wedding) return null;
  if (relationship.status !== 'engaged') return null;

  return {
    ...relationship,
    status: 'married',
    love: 100,
    lastInteraction: currentDate,
  };
}

/**
 * Rompre la relation.
 */
export function breakUp(
  state: RelationshipState,
  currentDate: GameDate
): RelationshipState {
  if (!state.current) return state;

  const historyEntry: RelationshipHistoryEntry = {
    womanId: state.current.womanId,
    womanName: state.current.womanName,
    status: 'broken_up',
    startDate: state.current.startDate,
    endDate: currentDate,
  };

  return {
    current: null,
    history: [...state.history, historyEntry],
  };
}

/**
 * Décroissance naturelle de l'amour si pas d'interaction (appelé chaque semaine).
 * -2 par semaine sans interaction.
 */
export function decayLove(relationship: Relationship): Relationship {
  return {
    ...relationship,
    love: clamp(relationship.love - 2, 0, 100),
  };
}

export const RelationshipSystem = {
  startRelationship,
  giveGift,
  goOnTrip,
  intimacy,
  propose,
  marry,
  breakUp,
  decayLove,
  GIFT_TIERS,
  TRAVEL_OPTIONS,
  THRESHOLDS,
};
