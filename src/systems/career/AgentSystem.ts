/**
 * AgentSystem — Gère les agents du joueur.
 * Différents tiers d'agents avec commission et réseau variables.
 */

import type { AgentProfile, AgentTier, AgentState } from '../../core/types';
import { type RNG, defaultRNG } from '../../utils/random';
import { allClubs } from '../../data/clubs/index';

// ─── Agents disponibles ──────────────────────────────────────────────────────

export const ALL_AGENTS: AgentProfile[] = [
  {
    id: 'agent-family',
    name: 'Papa (agent familial)',
    tier: 'family',
    emoji: '👨‍👦',
    commission: 0,
    offerBonus: 1.0,
    networkLevel: 1,
    description: 'Pas de commission mais réseau limité. Peu d\'offres.',
  },
  {
    id: 'agent-uncle',
    name: 'Tonton Rachid',
    tier: 'family',
    emoji: '👴',
    commission: 2,
    offerBonus: 1.0,
    networkLevel: 1,
    description: 'Famille élargie. Connaît quelques personnes dans le foot local.',
  },
  {
    id: 'agent-local',
    name: 'Marc Dupont',
    tier: 'local',
    emoji: '🕴️',
    commission: 5,
    offerBonus: 1.1,
    networkLevel: 2,
    description: 'Agent local, bon réseau en France. Commission raisonnable.',
  },
  {
    id: 'agent-local2',
    name: 'Karim Benali',
    tier: 'local',
    emoji: '🕴️',
    commission: 7,
    offerBonus: 1.15,
    networkLevel: 2,
    description: 'Spécialiste des jeunes talents. Bons contacts en Ligue 1.',
  },
  {
    id: 'agent-national',
    name: 'Jean-Pierre Bernès',
    tier: 'national',
    emoji: '💼',
    commission: 10,
    offerBonus: 1.25,
    networkLevel: 3,
    description: 'Agent reconnu nationalement. Accès aux gros clubs français et européens.',
  },
  {
    id: 'agent-national2',
    name: 'Moussa Sissoko (agent)',
    tier: 'national',
    emoji: '💼',
    commission: 12,
    offerBonus: 1.3,
    networkLevel: 4,
    description: 'Réseau international solide. Négocie les meilleurs contrats.',
  },
  {
    id: 'agent-elite',
    name: 'Jorge Mendes',
    tier: 'elite',
    emoji: '👑',
    commission: 15,
    offerBonus: 1.4,
    networkLevel: 5,
    description: 'Super-agent mondial. Les plus gros clubs l\'appellent directement.',
  },
  {
    id: 'agent-elite2',
    name: 'Mino Raiola Jr',
    tier: 'elite',
    emoji: '👑',
    commission: 20,
    offerBonus: 1.5,
    networkLevel: 5,
    description: 'Le plus cher mais le meilleur. Offres folles garanties.',
  },
];

/**
 * Retourne l'agent par défaut (famille).
 */
export function getDefaultAgent(): AgentProfile {
  return ALL_AGENTS[0]; // Papa
}

/**
 * Retourne les agents disponibles selon le niveau du joueur.
 */
export function getAvailableAgents(overallRating: number, popularity: number): AgentProfile[] {
  return ALL_AGENTS.filter((agent) => {
    switch (agent.tier) {
      case 'family': return true; // toujours dispo
      case 'local': return overallRating >= 55 || popularity >= 20;
      case 'national': return overallRating >= 70 || popularity >= 40;
      case 'elite': return overallRating >= 80 || popularity >= 60;
    }
  });
}

/**
 * Génère la liste des clubs intéressés selon l'agent et le joueur.
 */
export function generateInterestedClubs(
  overallRating: number,
  popularity: number,
  currentClubId: string,
  agent: AgentProfile,
  rng: RNG = defaultRNG
): string[] {
  // Number of interested clubs depends on agent network
  const baseCount = agent.networkLevel;
  const count = baseCount + rng.randomInt(0, 2);

  // Filter clubs by player level
  const eligible = allClubs.filter((c) => {
    if (c.id === currentClubId) return false;
    if (c.tier === 'big' && overallRating < 72 && agent.tier !== 'elite') return false;
    if (c.tier === 'big' && agent.tier === 'family') return false;
    return true;
  });

  // Shuffle and pick
  const shuffled = [...eligible].sort(() => rng.random() - 0.5);

  // Elite agents get access to bigger clubs
  let selected = shuffled.slice(0, count);
  if (agent.tier === 'elite' || agent.tier === 'national') {
    // Prioritize bigger clubs
    const bigClubs = eligible.filter((c) => c.tier === 'big').sort(() => rng.random() - 0.5);
    const others = eligible.filter((c) => c.tier !== 'big').sort(() => rng.random() - 0.5);
    selected = [...bigClubs.slice(0, Math.ceil(count / 2)), ...others.slice(0, Math.floor(count / 2))];
  }

  return selected.slice(0, count).map((c) => c.name);
}

/**
 * Calcule la commission de l'agent sur un montant.
 */
export function calculateCommission(amount: number, agent: AgentProfile): number {
  return Math.round(amount * (agent.commission / 100));
}

export const AgentSystem = {
  ALL_AGENTS,
  getDefaultAgent,
  getAvailableAgents,
  generateInterestedClubs,
  calculateCommission,
};
