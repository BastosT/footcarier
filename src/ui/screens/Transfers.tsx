/**
 * Transfers - Système complet de transfert avec offres, négociation et changement de club.
 *
 * Règles :
 * - Mercato : août et janvier
 * - Clubs intéressés selon le général du joueur :
 *   - < 35 OVR : petits clubs uniquement
 *   - 35-74 OVR : petits et moyens clubs
 *   - 75+ OVR : tous les clubs
 *   - Exception : 15+ buts ou 10+ passes D en saison → tous les clubs
 * - Négociation : le joueur propose un salaire, probabilité d'acceptation selon le club et le niveau
 */

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatCurrency } from '../../utils/formatters';
import { clubsByCountry } from '../../data/clubs/index';
import type { Club, ClubTier } from '../../core/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TransferOffer {
  club: Club;
  offeredSalary: number;
  contractYears: number;
  interest: 'low' | 'medium' | 'high';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calculateMarketValue(age: number, overallRating: number): number {
  const ratingFactor = Math.pow(overallRating / 60, 3);
  const baseValue = ratingFactor * 5_000_000;
  let ageMultiplier: number;
  if (age <= 20) ageMultiplier = 0.8 + (age - 16) * 0.1;
  else if (age <= 24) ageMultiplier = 1.2 + (age - 20) * 0.1;
  else if (age <= 27) ageMultiplier = 1.6;
  else if (age <= 30) ageMultiplier = 1.6 - (age - 27) * 0.2;
  else ageMultiplier = Math.max(0.3, 1.0 - (age - 30) * 0.2);
  return Math.round(baseValue * ageMultiplier / 100000) * 100000;
}

function formatMarketValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M€`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K€`;
  return `${value}€`;
}

function isTransferWindow(month: number): boolean {
  return month === 1 || month === 8; // January or August
}

function getEligibleTiers(overallRating: number, seasonGoals: number, seasonAssists: number): ClubTier[] {
  // Exception: 15+ goals or 10+ assists → all clubs
  if (seasonGoals >= 15 || seasonAssists >= 10) return ['small', 'medium', 'big'];
  if (overallRating >= 75) return ['small', 'medium', 'big'];
  if (overallRating >= 35) return ['small', 'medium'];
  return ['small'];
}

function generateOffers(
  overallRating: number,
  currentClubId: string,
  seasonGoals: number,
  seasonAssists: number,
  seed: number
): TransferOffer[] {
  const eligibleTiers = getEligibleTiers(overallRating, seasonGoals, seasonAssists);

  // Get all clubs from all countries, filter by tier and exclude current club
  const allClubs = Object.values(clubsByCountry).flat();
  const eligible = allClubs.filter(
    (c) => eligibleTiers.includes(c.tier) && c.id !== currentClubId
  );

  if (eligible.length === 0) return [];

  // Seeded random for deterministic offers
  let s = seed;
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xFFFFFFFF; return (s >>> 0) / 0xFFFFFFFF; };
  const shuffle = (arr: Club[]): Club[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Generate 2-5 offers
  const numOffers = 2 + Math.floor(rand() * 4);
  const selectedClubs = shuffle(eligible).slice(0, numOffers);

  return selectedClubs.map((club) => {
    const salaryByTier: Record<ClubTier, { min: number; max: number }> = {
      small: { min: 5000, max: 20000 },
      medium: { min: 15000, max: 60000 },
      big: { min: 40000, max: 150000 },
    };
    const range = salaryByTier[club.tier];
    const offeredSalary = Math.round((range.min + rand() * (range.max - range.min)) / 1000) * 1000;
    const contractYears = 1 + Math.floor(rand() * 4); // 1-4 years
    const interestLevels: TransferOffer['interest'][] = ['low', 'medium', 'high'];
    const interest = interestLevels[Math.floor(rand() * 3)];

    return { club, offeredSalary, contractYears, interest };
  });
}

function calculateAcceptProbability(
  requestedSalary: number,
  offeredSalary: number,
  clubTier: ClubTier,
  playerRating: number,
  requestedBonus: number = 0
): number {
  // Base probability from salary ratio
  const salaryRatio = offeredSalary / Math.max(1, requestedSalary);
  let prob = salaryRatio * 0.7; // If asking exactly what they offer = 70%

  // Club tier bonus (big clubs more flexible)
  if (clubTier === 'big') prob += 0.15;
  else if (clubTier === 'medium') prob += 0.05;

  // Player rating bonus (higher rated = more wanted)
  prob += (playerRating - 50) * 0.003;

  // Signing bonus penalty — the higher the bonus relative to salary, the lower the probability
  const bonusRatio = requestedBonus / Math.max(1, offeredSalary * 8); // 8 weeks = reasonable
  if (bonusRatio > 1) {
    prob -= (bonusRatio - 1) * 0.3; // heavy penalty for excessive bonus
  }

  return Math.max(0.05, Math.min(0.95, prob));
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Transfers() {
  const gameState = useGameStore((s) => s.gameState);
  const [negotiating, setNegotiating] = useState<TransferOffer | null>(null);
  const [requestedSalary, setRequestedSalary] = useState(0);
  const [requestedYears, setRequestedYears] = useState(3);
  const [requestedBonus, setRequestedBonus] = useState(0);
  const [negotiationResult, setNegotiationResult] = useState<'accepted' | 'rejected' | null>(null);
  const [renewMode, setRenewMode] = useState(false);
  const [renewSalary, setRenewSalary] = useState(0);
  const [renewYears, setRenewYears] = useState(3);
  const [renewBonus, setRenewBonus] = useState(0);
  const [renewResult, setRenewResult] = useState<'accepted' | 'rejected' | null>(null);

  if (!gameState) return null;

  const { player, career, time } = gameState;
  const marketValue = calculateMarketValue(player.age, player.overallRating);
  const inWindow = isTransferWindow(time.currentDate.month);
  const seasonStats = gameState.playerCareerStats?.season;
  const seasonGoals = seasonStats?.goals ?? 0;
  const seasonAssists = seasonStats?.assists ?? 0;

  // Generate offers (deterministic based on month/year)
  const offerSeed = time.currentDate.year * 100 + time.currentDate.month;
  const offers = inWindow
    ? generateOffers(player.overallRating, career.currentClub.id, seasonGoals, seasonAssists, offerSeed)
    : [];

  const handleNegotiate = (offer: TransferOffer) => {
    setNegotiating(offer);
    setRequestedSalary(offer.offeredSalary);
    setRequestedYears(offer.contractYears);
    setRequestedBonus(offer.offeredSalary * 4); // default: 4 weeks salary
    setNegotiationResult(null);
  };

  const handleSubmitNegotiation = () => {
    if (!negotiating) return;

    const prob = calculateAcceptProbability(
      requestedSalary,
      negotiating.offeredSalary,
      negotiating.club.tier,
      player.overallRating,
      requestedBonus
    );

    const accepted = Math.random() < prob;
    setNegotiationResult(accepted ? 'accepted' : 'rejected');

    if (accepted) {
      // Transfer the player to the new club — update schedule for remaining matches
      const state = useGameStore.getState();
      if (!state.gameState) return;

      const newClubId = negotiating.club.id;
      const currentMatchday = state.gameState.career.matchday;

      // Find the new club's league and get remaining schedule
      const newClubLeague = state.gameState.leagues.find(
        (l) => l.division.country === negotiating.club.country && l.division.level === 1
      );
      const newClubSchedule = newClubLeague?.schedule ?? [];

      // Get remaining matches for the new club (matchday > current)
      const remainingMatches = newClubSchedule.filter(
        (m) => m.matchday > currentMatchday &&
          (m.homeTeam === newClubId || m.awayTeam === newClubId)
      );

      // Find the next match for the new club
      const nextMatch = remainingMatches[0] ?? null;

      useGameStore.setState({
        gameState: {
          ...state.gameState,
          career: {
            ...state.gameState.career,
            currentClub: negotiating.club,
            contract: {
              clubId: negotiating.club.id,
              weeklySalary: requestedSalary,
              bonusPerGoal: Math.round(requestedSalary * 0.1),
              bonusPerAssist: Math.round(requestedSalary * 0.05),
              duration: requestedYears,
              seasonsRemaining: requestedYears,
              signingBonus: requestedBonus,
            },
            transferHistory: [
              ...(state.gameState.career.transferHistory ?? []),
              {
                fromClubId: career.currentClub.id,
                toClubId: negotiating.club.id,
                season: state.gameState.career.season,
                fee: 0,
              },
            ],
          },
          time: {
            ...state.gameState.time,
            schedule: {
              nextMatch,
              seasonMatches: newClubSchedule,
            },
          },
          finance: {
            ...state.gameState.finance,
            balance: state.gameState.finance.balance + requestedBonus,
          },
        },
      });
    }
  };

  const handleCloseNegotiation = () => {
    setNegotiating(null);
    setNegotiationResult(null);
  };

  // ─── Negotiation Modal ───────────────────────────────────────────────────

  if (negotiating) {
    const prob = calculateAcceptProbability(
      requestedSalary,
      negotiating.offeredSalary,
      negotiating.club.tier,
      player.overallRating,
      requestedBonus
    );

    return (
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <h2 className="text-lg font-bold text-text mb-4">
          Négociation — {negotiating.club.name}
        </h2>

        {negotiationResult === 'accepted' ? (
          <div className="bg-green-500/20 border border-green-500 rounded-2xl p-6 text-center mb-4">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-lg font-bold text-green-400">Transfert accepté !</p>
            <p className="text-sm text-text-muted mt-2">
              Tu rejoins {negotiating.club.name} pour {formatCurrency(requestedSalary)}/sem
            </p>
            <button
              onClick={handleCloseNegotiation}
              className="mt-4 py-3 px-6 bg-primary text-white font-semibold rounded-xl active:scale-95"
            >
              Continuer
            </button>
          </div>
        ) : negotiationResult === 'rejected' ? (
          <div className="bg-red-500/20 border border-red-500 rounded-2xl p-6 text-center mb-4">
            <p className="text-4xl mb-2">❌</p>
            <p className="text-lg font-bold text-red-400">Offre refusée</p>
            <p className="text-sm text-text-muted mt-2">Le club n'accepte pas tes conditions</p>
            <button
              onClick={handleCloseNegotiation}
              className="mt-4 py-3 px-6 bg-surface-light text-text font-semibold rounded-xl active:scale-95"
            >
              Retour
            </button>
          </div>
        ) : (
          <>
            <div className="bg-surface rounded-xl p-4 mb-4">
              <p className="text-sm text-text-muted">Leur offre</p>
              <p className="text-text font-bold">{formatCurrency(negotiating.offeredSalary)}/sem • {negotiating.contractYears} an(s)</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-text-muted mb-1 block">Salaire demandé (€/semaine)</label>
                <input
                  type="number"
                  value={requestedSalary}
                  onChange={(e) => setRequestedSalary(Math.max(0, Number(e.target.value)))}
                  step={1000}
                  className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-text text-center text-lg"
                />
              </div>
              <div>
                <label className="text-sm text-text-muted mb-1 block">Durée du contrat (années)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((y) => (
                    <button
                      key={y}
                      onClick={() => setRequestedYears(y)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                        requestedYears === y ? 'bg-primary text-white' : 'bg-surface text-text-muted'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-text-muted mb-1 block">Prime à la signature (€)</label>
                <input
                  type="number"
                  value={requestedBonus}
                  onChange={(e) => setRequestedBonus(Math.max(0, Number(e.target.value)))}
                  step={10000}
                  className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-text text-center text-lg"
                />
                <p className="text-xs text-text-muted mt-1">Raisonnable : {formatCurrency(negotiating!.offeredSalary * 4)} à {formatCurrency(negotiating!.offeredSalary * 8)}</p>
              </div>
            </div>

            {/* Probability indicator */}
            <div className="bg-surface rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Probabilité d'acceptation</span>
                <span className={`text-sm font-bold ${prob >= 0.6 ? 'text-green-400' : prob >= 0.3 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round(prob * 100)}%
                </span>
              </div>
              <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${prob >= 0.6 ? 'bg-green-500' : prob >= 0.3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${prob * 100}%` }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseNegotiation}
                className="flex-1 py-3 bg-surface-light text-text font-semibold rounded-xl active:scale-95"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitNegotiation}
                className="flex-1 py-3 bg-secondary text-white font-semibold rounded-xl active:scale-95"
              >
                Proposer
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── Renewal Mode ──────────────────────────────────────────────────────────

  // Can renew at mid-season (matchday >= 17) or when contract has 1 season remaining
  const canRenew = career.matchday >= 17 || career.contract.seasonsRemaining <= 1;

  const handleStartRenew = () => {
    setRenewSalary(Math.round(career.contract.weeklySalary * 1.2)); // propose 20% raise
    setRenewYears(3);
    setRenewBonus(career.contract.weeklySalary * 4);
    setRenewResult(null);
    setRenewMode(true);
  };

  const handleSubmitRenew = () => {
    const currentSalary = career.contract.weeklySalary;
    const raiseRatio = renewSalary / currentSalary;
    const bonusRatio = renewBonus / (currentSalary * 8);

    // Probability: reasonable raise (up to 50%) = high chance, excessive = low
    let prob = 0.8;
    if (raiseRatio > 1.5) prob -= (raiseRatio - 1.5) * 0.5;
    if (raiseRatio > 2.0) prob -= 0.3;
    if (bonusRatio > 1) prob -= (bonusRatio - 1) * 0.2;
    // Better players get more leverage
    prob += (player.overallRating - 60) * 0.005;
    prob = Math.max(0.05, Math.min(0.95, prob));

    const accepted = Math.random() < prob;
    setRenewResult(accepted ? 'accepted' : 'rejected');

    if (accepted) {
      const state = useGameStore.getState();
      if (!state.gameState) return;

      useGameStore.setState({
        gameState: {
          ...state.gameState,
          career: {
            ...state.gameState.career,
            contract: {
              ...state.gameState.career.contract,
              weeklySalary: renewSalary,
              duration: renewYears,
              seasonsRemaining: renewYears,
              signingBonus: renewBonus,
            },
          },
          finance: {
            ...state.gameState.finance,
            balance: state.gameState.finance.balance + renewBonus,
          },
        },
      });
    }
  };

  if (renewMode) {
    const currentSalary = career.contract.weeklySalary;
    const raiseRatio = renewSalary / currentSalary;
    const bonusRatio = renewBonus / (currentSalary * 8);
    let renewProb = 0.8;
    if (raiseRatio > 1.5) renewProb -= (raiseRatio - 1.5) * 0.5;
    if (raiseRatio > 2.0) renewProb -= 0.3;
    if (bonusRatio > 1) renewProb -= (bonusRatio - 1) * 0.2;
    renewProb += (player.overallRating - 60) * 0.005;
    renewProb = Math.max(0.05, Math.min(0.95, renewProb));

    return (
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <h2 className="text-lg font-bold text-text mb-4">
          Renégociation — {career.currentClub.name}
        </h2>

        {renewResult === 'accepted' ? (
          <div className="bg-green-500/20 border border-green-500 rounded-2xl p-6 text-center mb-4">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-lg font-bold text-green-400">Contrat renouvelé !</p>
            <p className="text-sm text-text-muted mt-2">
              {formatCurrency(renewSalary)}/sem • {renewYears} an(s) • Prime : {formatCurrency(renewBonus)}
            </p>
            <button
              onClick={() => setRenewMode(false)}
              className="mt-4 py-3 px-6 bg-primary text-white font-semibold rounded-xl active:scale-95"
            >
              Continuer
            </button>
          </div>
        ) : renewResult === 'rejected' ? (
          <div className="bg-red-500/20 border border-red-500 rounded-2xl p-6 text-center mb-4">
            <p className="text-4xl mb-2">❌</p>
            <p className="text-lg font-bold text-red-400">Refusé</p>
            <p className="text-sm text-text-muted mt-2">Le club refuse tes conditions</p>
            <button
              onClick={() => setRenewMode(false)}
              className="mt-4 py-3 px-6 bg-surface-light text-text font-semibold rounded-xl active:scale-95"
            >
              Retour
            </button>
          </div>
        ) : (
          <>
            <div className="bg-surface rounded-xl p-4 mb-4">
              <p className="text-sm text-text-muted">Contrat actuel</p>
              <p className="text-text font-bold">{formatCurrency(currentSalary)}/sem • {career.contract.seasonsRemaining} saison(s)</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-text-muted mb-1 block">Nouveau salaire (€/semaine)</label>
                <input
                  type="number"
                  value={renewSalary}
                  onChange={(e) => setRenewSalary(Math.max(0, Number(e.target.value)))}
                  step={1000}
                  className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-text text-center text-lg"
                />
              </div>
              <div>
                <label className="text-sm text-text-muted mb-1 block">Durée (années)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((y) => (
                    <button
                      key={y}
                      onClick={() => setRenewYears(y)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold ${
                        renewYears === y ? 'bg-primary text-white' : 'bg-surface text-text-muted'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-text-muted mb-1 block">Prime à la signature (€)</label>
                <input
                  type="number"
                  value={renewBonus}
                  onChange={(e) => setRenewBonus(Math.max(0, Number(e.target.value)))}
                  step={10000}
                  className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-text text-center text-lg"
                />
              </div>
            </div>

            {/* Probability */}
            <div className="bg-surface rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-muted">Probabilité d'acceptation</span>
                <span className={`text-sm font-bold ${renewProb >= 0.6 ? 'text-green-400' : renewProb >= 0.3 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round(renewProb * 100)}%
                </span>
              </div>
              <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${renewProb >= 0.6 ? 'bg-green-500' : renewProb >= 0.3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${renewProb * 100}%` }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRenewMode(false)}
                className="flex-1 py-3 bg-surface-light text-text font-semibold rounded-xl active:scale-95"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitRenew}
                className="flex-1 py-3 bg-secondary text-white font-semibold rounded-xl active:scale-95"
              >
                Proposer
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── Main View ─────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-20">
      {/* Player value card */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl p-4 mb-4 border border-primary/30">
        <p className="text-xs text-text-muted mb-1">Valeur marchande</p>
        <p className="text-3xl font-black text-primary-light">{formatMarketValue(marketValue)}</p>
        <p className="text-xs text-text-muted mt-1">
          {player.firstName} {player.lastName} • {player.age} ans • OVR {player.overallRating}
        </p>
      </div>

      {/* Club info */}
      <div className="bg-surface rounded-xl p-4 mb-4">
        <p className="text-text-muted text-sm">Club actuel</p>
        <p className="text-text font-bold text-lg">{career.currentClub.name}</p>
        <div className="flex items-center gap-4 mt-2">
          <div>
            <p className="text-xs text-text-muted">Salaire</p>
            <p className="text-sm font-semibold text-text">{formatCurrency(career.contract.weeklySalary)}/sem</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Contrat</p>
            <p className="text-sm font-semibold text-text">{career.contract.seasonsRemaining} saison(s)</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">N° Maillot</p>
            <p className="text-sm font-semibold text-text">#{player.jerseyNumber ?? 10}</p>
          </div>
        </div>
        {/* Renew contract button */}
        {canRenew && (
          <button
            onClick={handleStartRenew}
            className="w-full mt-3 py-2 bg-purple-600/20 text-purple-400 text-sm font-semibold rounded-lg
                       border border-purple-600/40 active:scale-95 transition-all"
          >
            📝 Renégocier le contrat
          </button>
        )}
      </div>

      {/* Transfer window status */}
      <div className={`rounded-xl p-3 mb-4 ${inWindow ? 'bg-green-500/20 border border-green-500/40' : 'bg-surface border border-surface-light'}`}>
        <p className={`text-sm font-medium ${inWindow ? 'text-green-400' : 'text-text-muted'}`}>
          {inWindow ? '🟢 Mercato ouvert' : '🔴 Mercato fermé'}
        </p>
        <p className="text-xs text-text-muted mt-1">
          {inWindow ? 'Des clubs sont intéressés par ton profil' : 'Prochaine fenêtre : ' + (time.currentDate.month < 8 ? 'Août' : 'Janvier')}
        </p>
      </div>

      {/* Offers */}
      {inWindow && offers.length > 0 ? (
        <div>
          <h3 className="text-sm font-bold text-text mb-3">Clubs intéressés ({offers.length})</h3>
          <div className="space-y-3">
            {offers.map((offer, idx) => (
              <div key={idx} className="bg-surface rounded-xl p-4 border border-surface-light">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-text">{offer.club.name}</p>
                    <p className="text-xs text-text-muted">{offer.club.division.name} • {offer.club.country}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    offer.interest === 'high' ? 'bg-green-500/20 text-green-400' :
                    offer.interest === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-surface-light text-text-muted'
                  }`}>
                    {offer.interest === 'high' ? 'Très intéressé' : offer.interest === 'medium' ? 'Intéressé' : 'Curieux'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <p className="text-xs text-text-muted">Offre</p>
                    <p className="text-sm font-semibold text-primary-light">{formatCurrency(offer.offeredSalary)}/sem</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Contrat</p>
                    <p className="text-sm font-semibold text-text">{offer.contractYears} an(s)</p>
                  </div>
                </div>
                <button
                  onClick={() => handleNegotiate(offer)}
                  className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-lg active:scale-95"
                >
                  Négocier
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : inWindow ? (
        <div className="text-center py-8">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-text-muted">Aucun club intéressé pour le moment</p>
          <p className="text-xs text-text-muted mt-1">Améliore ton niveau pour attirer des offres</p>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-4xl mb-4">⏳</p>
          <p className="text-text-muted">En attente du prochain mercato</p>
          <p className="text-xs text-text-muted mt-1">Continue à performer pour attirer l'attention</p>
        </div>
      )}
    </div>
  );
}
