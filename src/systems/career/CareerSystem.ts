/**
 * CareerSystem - Orchestre la création de personnage, l'association joueur-club,
 * et la gestion du temps de jeu.
 */

import type {
  PlayerCharacter, Club, Contract, Position, Country,
  PlayerAppearance, ClubTier, SquadPlayer
} from '../../core/types';
import { generateInitialStats } from '../stats/ProgressionEngine';
import { calculateOverallRating } from '../stats/StatsSystem';
import { type RNG, defaultRNG } from '../../utils/random';
import { clamp } from '../../utils/math';

/**
 * Potentiel de base par tier de club.
 */
const POTENTIAL_BY_TIER: Record<ClubTier, { min: number; max: number }> = {
  small: { min: 65, max: 78 },
  medium: { min: 72, max: 85 },
  big: { min: 78, max: 95 },
};

export interface CharacterCreationInput {
  firstName: string;
  lastName: string;
  nationality: Country;
  position: Position;
  age?: number;
  jerseyNumber?: number;
  appearance: PlayerAppearance;
}

/**
 * Crée un nouveau personnage joueur.
 */
export function createPlayerCharacter(
  input: CharacterCreationInput,
  clubTier: ClubTier,
  rng: RNG = defaultRNG
): PlayerCharacter {
  const potentialRange = POTENTIAL_BY_TIER[clubTier];
  const potential = rng.randomInt(potentialRange.min, potentialRange.max);

  const stats = generateInitialStats(input.position, potential, rng);
  const overallRating = calculateOverallRating(stats, input.position);

  return {
    id: `player-${Date.now()}-${rng.randomInt(0, 9999)}`,
    firstName: input.firstName,
    lastName: input.lastName,
    nationality: input.nationality,
    position: input.position,
    appearance: input.appearance,
    age: input.age ?? 18,
    jerseyNumber: input.jerseyNumber ?? 10,
    stats,
    potential,
    overallRating,
    fitness: 100,
    morale: 75,
    injury: null,
  };
}

/**
 * Génère le contrat initial pour un joueur rejoignant un club.
 */
export function generateInitialContract(
  clubId: string,
  clubTier: ClubTier,
  rng: RNG = defaultRNG
): Contract {
  const salaryByTier: Record<ClubTier, { min: number; max: number }> = {
    small: { min: 2000, max: 8000 },
    medium: { min: 8000, max: 25000 },
    big: { min: 20000, max: 60000 },
  };

  const salaryRange = salaryByTier[clubTier];
  const weeklySalary = rng.randomInt(salaryRange.min, salaryRange.max);

  return {
    clubId,
    weeklySalary,
    bonusPerGoal: Math.round(weeklySalary * 0.1),
    bonusPerAssist: Math.round(weeklySalary * 0.05),
    duration: 3,
    seasonsRemaining: 3,
    signingBonus: weeklySalary * 4,
  };
}

/**
 * Intègre le joueur dans l'effectif du club.
 */
export function addPlayerToSquad(club: Club, player: PlayerCharacter): Club {
  const squadPlayer: SquadPlayer = {
    id: player.id,
    name: `${player.firstName} ${player.lastName}`,
    position: player.position,
    age: player.age,
    overallRating: player.overallRating,
    potential: player.potential,
    isPlayerCharacter: true,
  };

  return {
    ...club,
    squad: [...club.squad, squadPlayer],
  };
}

/**
 * Calcule le temps de jeu basé sur la relation entraîneur.
 * relation < 30 → réduit (60-80 minutes)
 * relation 30-70 → normal (80-90 minutes)
 * relation > 70 → augmenté (90 minutes, titulaire garanti)
 */
export function calculatePlaytime(coachRelation: number): number {
  if (coachRelation < 30) {
    return clamp(60 + coachRelation, 0, 80);
  }
  if (coachRelation > 70) {
    return 90;
  }
  return clamp(75 + (coachRelation - 50) * 0.3, 75, 90);
}

/**
 * Détermine si le joueur est titulaire basé sur la relation entraîneur.
 */
export function isStarter(coachRelation: number): boolean {
  return coachRelation >= 40;
}

export const CareerSystem = {
  createPlayerCharacter,
  generateInitialContract,
  addPlayerToSquad,
  calculatePlaytime,
  isStarter,
};
