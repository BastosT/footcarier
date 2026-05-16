/**
 * TransferSystem - Gère les offres de transfert, acceptation et refus.
 */

import type {
  PlayerCharacter, Club, TransferOffer, TransferResult,
  Contract, Division, ClubTier, TransferWindow, Country
} from '../../core/types';
import { type RNG, defaultRNG } from '../../utils/random';
import { allClubs } from '../../data/clubs/index';

/**
 * Calcule l'attractivité d'un joueur pour les clubs.
 * attractivité = rating * 0.4 + popularity * 0.3 + age_factor * 0.3
 */
export function calculateAttractiveness(
  overallRating: number,
  popularity: number,
  age: number
): number {
  // Age factor: peaks at 25, decreases after 30
  const ageFactor = age <= 25 ? 80 + (25 - age) : Math.max(20, 100 - (age - 25) * 5);
  return overallRating * 0.4 + popularity * 0.3 + ageFactor * 0.3;
}

/**
 * Détermine le tier de clubs éligibles basé sur l'attractivité.
 */
function getEligibleTiers(attractiveness: number): ClubTier[] {
  if (attractiveness >= 70) return ['big', 'medium'];
  if (attractiveness >= 50) return ['medium', 'small'];
  return ['small'];
}

/**
 * Génère des offres de transfert pour le joueur.
 */
export function generateOffers(
  player: PlayerCharacter,
  currentClubId: string,
  currentSalary: number,
  popularity: number,
  window: TransferWindow,
  rng: RNG = defaultRNG
): TransferOffer[] {
  const attractiveness = calculateAttractiveness(player.overallRating, popularity, player.age);
  const eligibleTiers = getEligibleTiers(attractiveness);

  // Filter eligible clubs (different from current, matching tier)
  const eligibleClubs = allClubs.filter(
    club => club.id !== currentClubId && eligibleTiers.includes(club.tier)
  );

  if (eligibleClubs.length === 0) return [];

  // Generate 1-3 offers
  const numOffers = rng.randomInt(1, Math.min(3, eligibleClubs.length));
  const selectedClubs: Club[] = [];

  for (let i = 0; i < numOffers; i++) {
    let club: Club;
    do {
      club = rng.randomChoice(eligibleClubs);
    } while (selectedClubs.some(c => c.id === club.id));
    selectedClubs.push(club);
  }

  return selectedClubs.map(club => {
    const salaryMultiplier = 1 + rng.randomFloat(0.1, 0.5);
    const tierBonus = club.tier === 'big' ? 1.5 : club.tier === 'medium' ? 1.2 : 1.0;
    const salary = Math.round(currentSalary * salaryMultiplier * tierBonus);

    return {
      id: `offer-${club.id}-${Date.now()}-${rng.randomInt(0, 9999)}`,
      fromClub: club,
      salary,
      contractDuration: rng.randomInt(1, 4),
      signingBonus: Math.round(salary * rng.randomFloat(2, 8)),
      division: club.division,
      tier: club.tier,
    };
  });
}

/**
 * Accepte une offre de transfert.
 * Met à jour le joueur dans le nouveau club avec le nouveau contrat.
 */
export function acceptOffer(
  offer: TransferOffer,
  player: PlayerCharacter
): TransferResult {
  const newContract: Contract = {
    clubId: offer.fromClub.id,
    weeklySalary: offer.salary,
    bonusPerGoal: Math.round(offer.salary * 0.1),
    bonusPerAssist: Math.round(offer.salary * 0.05),
    duration: offer.contractDuration,
    seasonsRemaining: offer.contractDuration,
    signingBonus: offer.signingBonus,
  };

  // Add player to new club squad
  const newClub: Club = {
    ...offer.fromClub,
    squad: [
      ...offer.fromClub.squad,
      {
        id: player.id,
        name: `${player.firstName} ${player.lastName}`,
        position: player.position,
        age: player.age,
        overallRating: player.overallRating,
        potential: player.potential,
        isPlayerCharacter: true,
      },
    ],
  };

  return {
    success: true,
    newClub,
    newContract,
  };
}

export const TransferSystem = {
  calculateAttractiveness,
  generateOffers,
  acceptOffer,
};
