/**
 * RandomEventEngine - Génère et applique des événements aléatoires.
 * 15% de probabilité par jour, maximum 3 par semaine.
 */

import type { RandomEvent, EventEffects, EventCategory, SocialState } from '../../core/types';
import { type RNG, defaultRNG } from '../../utils/random';
import { clamp } from '../../utils/math';

export const EVENT_PROBABILITY = 0.15;
export const MAX_EVENTS_PER_WEEK = 3;

/**
 * Poids des catégories d'événements.
 */
const CATEGORY_WEIGHTS: Record<EventCategory, number> = {
  financial: 25,
  physical: 25,
  social: 30,
  relational: 20,
};

/**
 * Templates d'événements par catégorie.
 */
const EVENT_TEMPLATES: Record<EventCategory, Array<{ title: string; description: string; effects: EventEffects }>> = {
  financial: [
    { title: 'Contrat de sponsoring', description: 'Une marque vous propose un partenariat.', effects: { money: 5000 } },
    { title: 'Amende disciplinaire', description: 'Retard à l\'entraînement.', effects: { money: -2000, coachRelation: -5 } },
    { title: 'Prime de performance', description: 'Le club vous récompense.', effects: { money: 10000 } },
  ],
  physical: [
    { title: 'Séance de récupération', description: 'Massage et cryothérapie.', effects: { fitness: 5 } },
    { title: 'Fatigue accumulée', description: 'Votre corps montre des signes de fatigue.', effects: { fitness: -10 } },
    { title: 'Bonne nuit de sommeil', description: 'Vous vous sentez en pleine forme.', effects: { fitness: 3 } },
  ],
  social: [
    { title: 'Interview virale', description: 'Votre dernière interview fait le buzz.', effects: { popularity: 8 } },
    { title: 'Polémique sur les réseaux', description: 'Un ancien post refait surface.', effects: { popularity: -10 } },
    { title: 'Action caritative', description: 'Vous participez à un événement caritatif.', effects: { popularity: 5, reputation: 3 } },
  ],
  relational: [
    { title: 'Discussion avec le coach', description: 'Échange constructif sur votre rôle.', effects: { coachRelation: 8 } },
    { title: 'Tension au vestiaire', description: 'Un désaccord avec un coéquipier.', effects: { teamRelation: -8 } },
    { title: 'Soirée d\'équipe', description: 'Moment de cohésion avec le groupe.', effects: { teamRelation: 5, coachRelation: 2 } },
  ],
};

/**
 * Évalue si un événement se produit ce jour.
 * @returns L'événement généré ou null.
 */
export function evaluateDay(
  eventsThisWeek: number,
  rng: RNG = defaultRNG
): RandomEvent | null {
  if (eventsThisWeek >= MAX_EVENTS_PER_WEEK) return null;
  if (rng.random() >= EVENT_PROBABILITY) return null;

  // Choose category
  const categories = Object.keys(CATEGORY_WEIGHTS) as EventCategory[];
  const weights = categories.map(c => CATEGORY_WEIGHTS[c]);
  const category = rng.randomWeighted(categories, weights);

  // Choose event template
  const templates = EVENT_TEMPLATES[category];
  const template = rng.randomChoice(templates);

  return {
    id: `event-${Date.now()}-${rng.randomInt(0, 9999)}`,
    category,
    title: template.title,
    description: template.description,
    effects: template.effects,
  };
}

/**
 * Applique les effets d'un événement sur l'état social et financier.
 * Retourne les changements à appliquer.
 */
export function applyEventEffects(
  effects: EventEffects,
  currentState: { popularity: number; coachRelation: number; teamRelation: number; fitness: number; balance: number }
): { popularity: number; coachRelation: number; teamRelation: number; fitness: number; balance: number } {
  return {
    popularity: clamp(currentState.popularity + (effects.popularity ?? 0), 0, 100),
    coachRelation: clamp(currentState.coachRelation + (effects.coachRelation ?? 0), 0, 100),
    teamRelation: clamp(currentState.teamRelation + (effects.teamRelation ?? 0), 0, 100),
    fitness: clamp(currentState.fitness + (effects.fitness ?? 0), 0, 100),
    balance: currentState.balance + (effects.money ?? 0),
  };
}

export const RandomEventEngine = {
  evaluateDay,
  applyEventEffects,
  MAX_EVENTS_PER_WEEK,
  EVENT_PROBABILITY,
};
