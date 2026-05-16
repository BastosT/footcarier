/**
 * ContractManager - Gère l'expiration, la négociation et le renouvellement des contrats.
 */

import type { Contract, ClubTier } from '../../core/types';
import { type RNG, defaultRNG } from '../../utils/random';

/**
 * Décrémente les saisons restantes du contrat.
 * @returns Le contrat mis à jour, ou null si expiré.
 */
export function advanceContractSeason(contract: Contract): Contract | null {
  const remaining = contract.seasonsRemaining - 1;
  if (remaining <= 0) return null;
  return { ...contract, seasonsRemaining: remaining };
}

/**
 * Vérifie si le contrat expire à la fin de cette saison.
 */
export function isExpiring(contract: Contract): boolean {
  return contract.seasonsRemaining <= 1;
}

export interface NegotiationParams {
  desiredSalary: number;
  desiredDuration: number;
  desiredBonus: number;
}

export interface NegotiationResult {
  accepted: boolean;
  contract?: Contract;
  counterOffer?: NegotiationParams;
}

/**
 * Négocie un renouvellement de contrat.
 * Le club accepte si les demandes sont raisonnables par rapport au tier.
 */
export function negotiateRenewal(
  currentContract: Contract,
  params: NegotiationParams,
  clubTier: ClubTier,
  playerRating: number,
  rng: RNG = defaultRNG
): NegotiationResult {
  const maxSalaryByTier: Record<ClubTier, number> = {
    small: 15000,
    medium: 50000,
    big: 150000,
  };

  const maxSalary = maxSalaryByTier[clubTier];
  const ratingFactor = playerRating / 80; // Higher rated players can demand more

  const acceptableSalary = Math.round(maxSalary * ratingFactor);

  if (params.desiredSalary <= acceptableSalary && params.desiredDuration <= 5) {
    // Accepted
    const newContract: Contract = {
      clubId: currentContract.clubId,
      weeklySalary: params.desiredSalary,
      bonusPerGoal: Math.round(params.desiredSalary * 0.1),
      bonusPerAssist: Math.round(params.desiredSalary * 0.05),
      duration: params.desiredDuration,
      seasonsRemaining: params.desiredDuration,
      signingBonus: params.desiredBonus,
    };
    return { accepted: true, contract: newContract };
  }

  // Counter offer
  const counterSalary = Math.round(Math.min(params.desiredSalary * 0.8, acceptableSalary));
  return {
    accepted: false,
    counterOffer: {
      desiredSalary: counterSalary,
      desiredDuration: Math.min(params.desiredDuration, 4),
      desiredBonus: Math.round(params.desiredBonus * 0.6),
    },
  };
}

export const ContractManager = {
  advanceContractSeason,
  isExpiring,
  negotiateRenewal,
};
