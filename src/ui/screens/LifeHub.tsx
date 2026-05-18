/**
 * LifeHub — Onglet "Vie" (anciennement Trophées).
 * Sous-onglets : Style de vie (boutique), Possessions, Finance, Trophées, Relations.
 */

import { useState, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { generateWeeklyShop, type ShopItem } from '../../data/lifestyle/shop';
import { ALL_WOMEN as ALL_WOMEN_DATA } from '../../data/lifestyle/women';
import { RelationshipSystem, GIFT_TIERS, TRAVEL_OPTIONS, THRESHOLDS } from '../../systems/social/RelationshipSystem';
import { formatCurrency } from '../../utils/formatters';
import type { OwnedItem, Relationship } from '../../core/types';
import { ALL_CELEBRITIES, CATEGORY_LABELS, type CelebrityProfile, type CelebrityCategory } from '../../data/lifestyle/celebrities';

type LifeTab = 'shop' | 'possessions' | 'invest' | 'finance' | 'trophies' | 'relations' | 'celebs';

export function LifeHub() {
  const [activeTab, setActiveTab] = useState<LifeTab>('shop');
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) return null;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Sub-tabs - scrollable */}
      <div className="flex bg-surface border-b border-surface-light overflow-x-auto scrollbar-none">
        {([
          { id: 'shop' as LifeTab, label: '🛍️ Boutique' },
          { id: 'possessions' as LifeTab, label: '🏠 Possessions' },
          { id: 'invest' as LifeTab, label: '📈 Investir' },
          { id: 'finance' as LifeTab, label: '💰 Finance' },
          { id: 'trophies' as LifeTab, label: '🏆 Trophées' },
          { id: 'relations' as LifeTab, label: '❤️ Relations' },
          { id: 'celebs' as LifeTab, label: '⭐ Célébrités' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-primary-light border-b-2 border-primary-light'
                : 'text-text-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'shop' && <ShopView />}
      {activeTab === 'possessions' && <PossessionsView />}
      {activeTab === 'invest' && <InvestView />}
      {activeTab === 'finance' && <FinanceView />}
      {activeTab === 'trophies' && <TrophiesView />}
      {activeTab === 'relations' && <RelationsView />}
      {activeTab === 'celebs' && <CelebritiesView />}
    </div>
  );
}

// ─── Boutique ────────────────────────────────────────────────────────────────

function ShopView() {
  const gameState = useGameStore((s) => s.gameState);
  const [message, setMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!gameState) return null;

  // Generate weekly shop based on current week (seed = day of year / 7)
  const { currentDate } = gameState.time;
  const weekSeed = currentDate.year * 52 + Math.floor((currentDate.month * 30 + currentDate.day) / 7);
  const shopItems = generateWeeklyShop(weekSeed);

  const balance = gameState.finance.balance;

  const handleBuy = (item: ShopItem) => {
    const state = useGameStore.getState();
    if (!state.gameState) return;

    if (state.gameState.finance.balance < item.price) {
      setMessage(`❌ Pas assez d'argent ! Il te manque ${formatCurrency(item.price - balance)}`);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Check if already owned
    if (state.gameState.lifestyle.possessions.some((p) => p.id === item.id)) {
      setMessage('⚠️ Tu possèdes déjà cet objet !');
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const newPossession: OwnedItem = {
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      emoji: item.emoji,
      purchasedDate: state.gameState.time.currentDate,
    };

    // Calculate follower gain from luxury purchases
    let followersGain = 0;
    if (item.category === 'fashion' || item.category === 'jewelry') {
      followersGain = Math.round(item.price * 0.02); // 2% of price as followers
      if (item.tier === 'luxury') followersGain *= 2;
      if (item.tier === 'ultra') followersGain *= 4;
    } else if (item.category === 'car' && item.price >= 200000) {
      followersGain = Math.round(item.price * 0.005); // 0.5% for expensive cars
    }

    const currentIg = state.gameState.lifestyle.instagram ?? { followers: 1000, posts: [], weeklyPostDone: false };

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        finance: { ...state.gameState.finance, balance: state.gameState.finance.balance - item.price },
        lifestyle: {
          ...state.gameState.lifestyle,
          possessions: [...state.gameState.lifestyle.possessions, newPossession],
          instagram: {
            ...currentIg,
            followers: currentIg.followers + followersGain,
          },
        },
      },
    });

    const followerMsg = followersGain > 0 ? ` (+${followersGain} followers 📸)` : '';
    setMessage(`✅ ${item.name} acheté !${followerMsg}`);
    scrollToTop();
    setTimeout(() => setMessage(null), 4000);
  };

  const categoryOrder: ShopItem['category'][] = ['house', 'car', 'jewelry', 'fashion', 'yacht', 'jet'];
  const categoryLabels: Record<string, string> = { house: '🏠 Immobilier', car: '🚗 Voitures', jewelry: '💎 Bijoux & Montres', fashion: '👜 Mode & Luxe', yacht: '🛥️ Yachts', jet: '✈️ Jets Privés' };

  // Wellness: 1 fitness + 1 morale purchase per week (checked inside handler)

  const handleWellness = (type: 'fitness' | 'morale', amount: number, cost: number) => {
    // Always read fresh state
    const freshState = useGameStore.getState();
    if (!freshState.gameState) { alert('Erreur: pas de gameState'); return; }

    const cw = freshState.gameState.time.currentDate.year * 52 + Math.floor((freshState.gameState.time.currentDate.month * 30 + freshState.gameState.time.currentDate.day) / 7);
    const fitAvail = cw > (freshState.lastWellnessWeek ?? 0);
    const morAvail = cw > (freshState.lastMoraleWeek ?? 0);

    const available = type === 'fitness' ? fitAvail : morAvail;
    if (!available) {
      alert(`${type === 'fitness' ? 'Forme' : 'Moral'} déjà acheté cette semaine !`);
      return;
    }
    if (freshState.gameState.finance.balance < cost) {
      alert(`Pas assez d'argent ! Il te manque ${cost - freshState.gameState.finance.balance}€`);
      return;
    }

    const gs = freshState.gameState;

    if (type === 'fitness') {
      const oldFitness = gs.player.fitness;
      const newFitness = Math.min(100, oldFitness + amount);
      useGameStore.setState({
        gameState: {
          ...gs,
          player: { ...gs.player, fitness: newFitness },
          finance: { ...gs.finance, balance: gs.finance.balance - cost },
        },
        lastWellnessWeek: cw,
      });
      alert(`Forme +${amount} ! (${oldFitness} → ${newFitness})`);
    } else {
      const oldMorale = gs.player.morale;
      const newMorale = Math.min(100, oldMorale + amount);
      useGameStore.setState({
        gameState: {
          ...gs,
          player: { ...gs.player, morale: newMorale },
          finance: { ...gs.finance, balance: gs.finance.balance - cost },
        },
        lastMoraleWeek: cw,
      });
      alert(`Moral +${amount} ! (${oldMorale} → ${newMorale})`);
    }
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text">Boutique de la semaine</h2>
        <p className="text-xs text-primary-light font-bold">{formatCurrency(balance)}</p>
      </div>

      {message && (
        <div className="bg-surface rounded-xl p-3 mb-4 text-center text-sm text-text">
          {message}
        </div>
      )}

      {categoryOrder.map((cat) => {
        const items = shopItems.filter((i) => i.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="mb-6">
            <h3 className="text-sm font-bold text-text-muted mb-2">{categoryLabels[cat]}</h3>
            <div className="space-y-2">
              {items.map((item) => {
                const owned = gameState.lifestyle.possessions.some((p) => p.id === item.id);
                const canAfford = balance >= item.price;
                return (
                  <div key={item.id} className="bg-surface rounded-xl p-3 flex items-center gap-3 border border-surface-light">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{item.name}</p>
                      <p className="text-xs text-text-muted truncate">{item.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {owned ? (
                        <span className="text-xs text-green-400 font-bold">Possédé ✓</span>
                      ) : (
                        <button
                          onClick={() => handleBuy(item)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            canAfford
                              ? 'bg-primary text-white active:scale-95'
                              : 'bg-surface-light text-text-muted cursor-not-allowed'
                          }`}
                        >
                          {formatCurrency(item.price)}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Bien-être section */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-text-muted mb-2">🧘 Bien-être (1x/semaine par catégorie)</h3>
        <div className="space-y-2">
          {[
            { name: 'Massage sportif', emoji: '💆', price: 200, amount: 5, type: 'fitness' as const, desc: 'Récupération musculaire' },
            { name: 'Séance cryothérapie', emoji: '🧊', price: 500, amount: 10, type: 'fitness' as const, desc: 'Récupération intensive' },
            { name: 'Cure thermale VIP', emoji: '♨️', price: 1500, amount: 15, type: 'fitness' as const, desc: 'Programme complet' },
            { name: 'Spa détente', emoji: '🛁', price: 300, amount: 10, type: 'morale' as const, desc: 'Bien-être mental' },
            { name: 'Retraite zen', emoji: '🧘', price: 800, amount: 15, type: 'morale' as const, desc: 'Coaching mental' },
            { name: 'Vacances express', emoji: '🏖️', price: 2000, amount: 20, type: 'morale' as const, desc: 'Décompression totale' },
          ].map((item) => (
            <div key={item.name} className="bg-surface rounded-xl p-3 flex items-center gap-3 border border-surface-light">
              <span className="text-2xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">{item.name}</p>
                <p className="text-xs text-text-muted">{item.desc}</p>
                <p className="text-xs text-green-400 font-medium">+{item.amount} {item.type === 'fitness' ? 'forme' : 'moral'}</p>
              </div>
              <button
                onClick={() => handleWellness(item.type, item.amount, item.price)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  balance >= item.price
                    ? 'bg-secondary text-white active:scale-95'
                    : 'bg-surface-light text-text-muted cursor-not-allowed'
                }`}
              >
                {formatCurrency(item.price)}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Possessions ─────────────────────────────────────────────────────────────

function PossessionsView() {
  const gameState = useGameStore((s) => s.gameState);
  const [message, setMessage] = useState<string | null>(null);

  if (!gameState) return null;

  const { possessions } = gameState.lifestyle;
  const currentDate = gameState.time.currentDate;

  const houses = possessions.filter((p) => p.category === 'house');
  const cars = possessions.filter((p) => p.category === 'car');
  const jewelry = possessions.filter((p) => p.category === 'jewelry');
  const fashion = possessions.filter((p) => p.category === 'fashion');
  const yachts = possessions.filter((p) => p.category === 'yacht');
  const jets = possessions.filter((p) => p.category === 'jet');

  const totalValue = possessions.reduce((sum, p) => sum + getCurrentValue(p, currentDate), 0);

  const handleSell = (item: OwnedItem) => {
    const state = useGameStore.getState();
    if (!state.gameState) return;

    const sellPrice = getCurrentValue(item, currentDate);

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        finance: { ...state.gameState.finance, balance: state.gameState.finance.balance + sellPrice },
        lifestyle: {
          ...state.gameState.lifestyle,
          possessions: state.gameState.lifestyle.possessions.filter((p) => p.id !== item.id),
        },
      },
    });

    setMessage(`✅ ${item.name} vendu pour ${formatCurrency(sellPrice)}`);
    setTimeout(() => setMessage(null), 3000);
  };

  if (possessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center pb-20">
        <div className="text-center">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-text-muted">Aucune possession</p>
          <p className="text-xs text-text-muted mt-1">Achète dans la boutique !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
      {message && (
        <div className="bg-green-500/20 border border-green-500/40 rounded-xl p-3 mb-4 text-center text-sm text-green-400">
          {message}
        </div>
      )}

      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl p-4 mb-4 border border-primary/30">
        <p className="text-xs text-text-muted">Valeur totale des possessions</p>
        <p className="text-2xl font-black text-primary-light">{formatCurrency(totalValue)}</p>
      </div>

      {houses.length > 0 && <PossessionSection title="🏠 Immobilier" items={houses} currentDate={currentDate} onSell={handleSell} />}
      {cars.length > 0 && <PossessionSection title="🚗 Voitures" items={cars} currentDate={currentDate} onSell={handleSell} />}
      {jewelry.length > 0 && <PossessionSection title="💎 Bijoux & Montres" items={jewelry} currentDate={currentDate} onSell={handleSell} />}
      {fashion.length > 0 && <PossessionSection title="👜 Mode & Luxe" items={fashion} currentDate={currentDate} onSell={handleSell} />}
      {yachts.length > 0 && <PossessionSection title="🛥️ Yachts" items={yachts} currentDate={currentDate} onSell={handleSell} />}
      {jets.length > 0 && <PossessionSection title="✈️ Jets Privés" items={jets} currentDate={currentDate} onSell={handleSell} />}
    </div>
  );
}

/**
 * Calculates the current resale value of an item.
 * Cars depreciate ~3% per month, down to 50% minimum.
 * Houses and jewelry keep their value.
 */
function getCurrentValue(item: OwnedItem, currentDate: { day: number; month: number; year: number }): number {
  if (item.category !== 'car') {
    return item.price; // Houses and jewelry don't lose value
  }

  // Cars lose ~3% per month, minimum 50% of original price
  const monthsOwned =
    (currentDate.year - item.purchasedDate.year) * 12 +
    (currentDate.month - item.purchasedDate.month);

  const depreciationRate = 0.03;
  const minValue = item.price * 0.5;
  const currentValue = item.price * Math.pow(1 - depreciationRate, Math.max(0, monthsOwned));

  return Math.max(minValue, Math.round(currentValue / 1000) * 1000);
}

function PossessionSection({ title, items, currentDate, onSell }: {
  title: string;
  items: OwnedItem[];
  currentDate: { day: number; month: number; year: number };
  onSell: (item: OwnedItem) => void;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold text-text-muted mb-2">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => {
          const currentValue = getCurrentValue(item, currentDate);
          const hasDepreciated = currentValue < item.price;

          return (
            <div key={item.id} className="bg-surface rounded-xl p-3 border border-surface-light">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{item.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-text-muted">Acheté : {formatCurrency(item.price)}</p>
                    {hasDepreciated && (
                      <p className="text-xs text-red-400">↓ {Math.round((1 - currentValue / item.price) * 100)}%</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-light">
                <p className="text-sm font-bold text-primary-light">
                  Valeur : {formatCurrency(currentValue)}
                </p>
                <button
                  onClick={() => onSell(item)}
                  className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg
                             border border-red-500/40 active:scale-95 transition-all"
                >
                  Vendre
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Investissements ─────────────────────────────────────────────────────────

const INVESTMENT_OPTIONS = [
  // Immobilier (sûr)
  { id: 'immo-studio', name: 'Studio locatif', type: 'real_estate' as const, emoji: '🏢', price: 150_000, monthlyReturn: 0.4, risk: 'safe' as const, desc: 'Loyer garanti +0.4%/mois' },
  { id: 'immo-t3', name: 'Appartement T3 locatif', type: 'real_estate' as const, emoji: '🏠', price: 350_000, monthlyReturn: 0.5, risk: 'safe' as const, desc: 'Rendement stable +0.5%/mois' },
  { id: 'immo-commerce', name: 'Local commercial', type: 'real_estate' as const, emoji: '🏪', price: 500_000, monthlyReturn: 0.6, risk: 'safe' as const, desc: 'Commerce bien placé +0.6%/mois' },
  { id: 'immo-immeuble', name: 'Immeuble de rapport', type: 'real_estate' as const, emoji: '🏗️', price: 1_200_000, monthlyReturn: 0.7, risk: 'safe' as const, desc: '6 appartements +0.7%/mois' },
  { id: 'immo-hotel', name: 'Hôtel boutique', type: 'real_estate' as const, emoji: '🏨', price: 3_000_000, monthlyReturn: 0.8, risk: 'safe' as const, desc: 'Hôtel 4 étoiles +0.8%/mois' },
  { id: 'immo-parking', name: 'Parking souterrain', type: 'real_estate' as const, emoji: '🅿️', price: 800_000, monthlyReturn: 0.5, risk: 'safe' as const, desc: '200 places +0.5%/mois' },
  { id: 'immo-entrepot', name: 'Entrepôt logistique', type: 'real_estate' as const, emoji: '📦', price: 2_000_000, monthlyReturn: 0.6, risk: 'safe' as const, desc: 'E-commerce boom +0.6%/mois' },
  // Bourse (moyen)
  { id: 'stock-sp500', name: 'ETF S&P 500', type: 'stocks' as const, emoji: '📊', price: 10_000, monthlyReturn: 0.8, risk: 'medium' as const, desc: 'Bourse US ±0.8%/mois' },
  { id: 'stock-tech', name: 'Actions Tech (NVIDIA, Apple)', type: 'stocks' as const, emoji: '💻', price: 25_000, monthlyReturn: 1.5, risk: 'high' as const, desc: 'Volatile ±1.5%/mois' },
  { id: 'stock-luxury', name: 'Actions Luxe (LVMH, Hermès)', type: 'stocks' as const, emoji: '👜', price: 50_000, monthlyReturn: 1.0, risk: 'medium' as const, desc: 'Secteur luxe ±1%/mois' },
  { id: 'stock-pharma', name: 'Actions Pharma', type: 'stocks' as const, emoji: '💊', price: 15_000, monthlyReturn: 0.7, risk: 'medium' as const, desc: 'Santé stable ±0.7%/mois' },
  { id: 'stock-energy', name: 'Actions Énergie verte', type: 'stocks' as const, emoji: '🌱', price: 20_000, monthlyReturn: 1.2, risk: 'medium' as const, desc: 'Transition énergétique ±1.2%/mois' },
  { id: 'stock-gold', name: 'Or (lingots)', type: 'stocks' as const, emoji: '🥇', price: 60_000, monthlyReturn: 0.3, risk: 'safe' as const, desc: 'Valeur refuge +0.3%/mois' },
  // Crypto (risqué)
  { id: 'crypto-btc', name: 'Bitcoin', type: 'crypto' as const, emoji: '₿', price: 5_000, monthlyReturn: 3.0, risk: 'high' as const, desc: 'Très volatile ±3%/mois' },
  { id: 'crypto-eth', name: 'Ethereum', type: 'crypto' as const, emoji: '⟠', price: 3_000, monthlyReturn: 4.0, risk: 'high' as const, desc: 'Très volatile ±4%/mois' },
  { id: 'crypto-sol', name: 'Solana', type: 'crypto' as const, emoji: '◎', price: 2_000, monthlyReturn: 5.0, risk: 'high' as const, desc: 'Ultra volatile ±5%/mois' },
  { id: 'crypto-nft', name: 'Collection NFT', type: 'crypto' as const, emoji: '🖼️', price: 10_000, monthlyReturn: 6.0, risk: 'high' as const, desc: 'Spéculatif ±6%/mois' },
  // Business (moyen/risqué)
  { id: 'biz-restaurant', name: 'Restaurant', type: 'business' as const, emoji: '🍽️', price: 200_000, monthlyReturn: 1.2, risk: 'medium' as const, desc: 'Business food ±1.2%/mois' },
  { id: 'biz-salle-sport', name: 'Salle de sport', type: 'business' as const, emoji: '🏋️', price: 300_000, monthlyReturn: 0.9, risk: 'medium' as const, desc: 'Fitness business ±0.9%/mois' },
  { id: 'biz-marque', name: 'Lancer sa marque', type: 'business' as const, emoji: '👕', price: 100_000, monthlyReturn: 2.0, risk: 'high' as const, desc: 'Marque de vêtements ±2%/mois' },
  { id: 'biz-barbershop', name: 'Barbershop premium', type: 'business' as const, emoji: '💈', price: 80_000, monthlyReturn: 1.0, risk: 'medium' as const, desc: 'Coiffeur haut de gamme ±1%/mois' },
  { id: 'biz-nightclub', name: 'Boîte de nuit', type: 'business' as const, emoji: '🎶', price: 500_000, monthlyReturn: 2.5, risk: 'high' as const, desc: 'Nightlife ±2.5%/mois' },
  { id: 'biz-carwash', name: 'Car Wash premium', type: 'business' as const, emoji: '🚿', price: 150_000, monthlyReturn: 0.8, risk: 'medium' as const, desc: 'Lavage auto ±0.8%/mois' },
  { id: 'biz-esport', name: 'Équipe eSport', type: 'business' as const, emoji: '🎮', price: 250_000, monthlyReturn: 1.8, risk: 'high' as const, desc: 'Gaming compétitif ±1.8%/mois' },
  { id: 'biz-academy', name: 'Académie de foot', type: 'business' as const, emoji: '⚽', price: 400_000, monthlyReturn: 0.7, risk: 'medium' as const, desc: 'Formation jeunes ±0.7%/mois' },
];

function InvestView() {
  const gameState = useGameStore((s) => s.gameState);
  const [message, setMessage] = useState<string | null>(null);

  if (!gameState) return null;

  const investments = gameState.lifestyle.investments ?? [];
  const balance = gameState.finance.balance;
  const currentDate = gameState.time.currentDate;

  // Calculate total invested and current value
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalProfit = totalCurrentValue - totalInvested;

  const handleInvest = (option: typeof INVESTMENT_OPTIONS[0]) => {
    const state = useGameStore.getState();
    if (!state.gameState) return;

    if (state.gameState.finance.balance < option.price) {
      setMessage(`❌ Pas assez d'argent ! Il te manque ${formatCurrency(option.price - balance)}€`);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Check if already invested in this
    if (state.gameState.lifestyle.investments.some((i) => i.id === option.id)) {
      setMessage('⚠️ Tu as déjà cet investissement !');
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const newInvestment = {
      id: option.id,
      name: option.name,
      type: option.type,
      emoji: option.emoji,
      investedAmount: option.price,
      currentValue: option.price,
      monthlyReturn: option.monthlyReturn,
      risk: option.risk,
      purchasedDate: currentDate,
    };

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        finance: { ...state.gameState.finance, balance: state.gameState.finance.balance - option.price },
        lifestyle: {
          ...state.gameState.lifestyle,
          investments: [...state.gameState.lifestyle.investments, newInvestment],
        },
      },
    });

    setMessage(`✅ ${option.name} acheté pour ${formatCurrency(option.price)} !`);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSell = (inv: typeof investments[0]) => {
    const state = useGameStore.getState();
    if (!state.gameState) return;

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        finance: { ...state.gameState.finance, balance: state.gameState.finance.balance + inv.currentValue },
        lifestyle: {
          ...state.gameState.lifestyle,
          investments: state.gameState.lifestyle.investments.filter((i) => i.id !== inv.id),
        },
      },
    });

    const profit = inv.currentValue - inv.investedAmount;
    const profitText = profit >= 0 ? `+${formatCurrency(profit)}` : `-${formatCurrency(Math.abs(profit))}`;
    setMessage(`✅ ${inv.name} vendu pour ${formatCurrency(inv.currentValue)} (${profitText})`);
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
      {message && (
        <div className="bg-surface rounded-xl p-3 mb-4 text-center text-sm text-text">{message}</div>
      )}

      {/* Portfolio summary */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-4 mb-4 border border-blue-500/30">
        <p className="text-xs text-text-muted">Portfolio total</p>
        <p className="text-2xl font-black text-text">{formatCurrency(totalCurrentValue)}</p>
        <p className={`text-sm font-bold mt-1 ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {totalProfit >= 0 ? '📈' : '📉'} {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
        </p>
      </div>

      {/* My investments */}
      {investments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-text mb-3">📊 Mes investissements</h3>
          <div className="space-y-2">
            {investments.map((inv) => {
              const profit = inv.currentValue - inv.investedAmount;
              const profitPct = ((inv.currentValue / inv.investedAmount) - 1) * 100;
              return (
                <div key={inv.id} className="bg-surface rounded-xl p-3 border border-surface-light">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{inv.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{inv.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-text-muted">Investi : {formatCurrency(inv.investedAmount)}</p>
                        <p className={`text-xs font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-light">
                    <p className="text-sm font-bold text-primary-light">Valeur : {formatCurrency(inv.currentValue)}</p>
                    <button
                      onClick={() => handleSell(inv)}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/40 active:scale-95"
                    >
                      Vendre
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available investments */}
      <h3 className="text-sm font-bold text-text mb-3">🛒 Investir</h3>
      <div className="space-y-2">
        {INVESTMENT_OPTIONS.map((option) => {
          const owned = investments.some((i) => i.id === option.id);
          const canAfford = balance >= option.price;
          const riskColor = option.risk === 'safe' ? 'text-green-400' : option.risk === 'medium' ? 'text-yellow-400' : 'text-red-400';
          const riskLabel = option.risk === 'safe' ? '🟢 Sûr' : option.risk === 'medium' ? '🟡 Moyen' : '🔴 Risqué';

          return (
            <div key={option.id} className="bg-surface rounded-xl p-3 border border-surface-light">
              <div className="flex items-center gap-3">
                <span className="text-xl">{option.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text">{option.name}</p>
                  <p className="text-xs text-text-muted">{option.desc}</p>
                  <p className={`text-xs font-medium ${riskColor}`}>{riskLabel}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {owned ? (
                    <span className="text-xs text-green-400 font-bold">Possédé ✓</span>
                  ) : (
                    <button
                      onClick={() => handleInvest(option)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        canAfford ? 'bg-primary text-white active:scale-95' : 'bg-surface-light text-text-muted cursor-not-allowed'
                      }`}
                    >
                      {formatCurrency(option.price)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Finance ─────────────────────────────────────────────────────────────────

function FinanceView() {
  const gameState = useGameStore((s) => s.gameState);
  if (!gameState) return null;

  const { finance, career, lifestyle } = gameState;
  const totalPossessionsValue = lifestyle.possessions.reduce((sum, p) => sum + p.price, 0);
  const investments = lifestyle.investments ?? [];
  const totalInvestmentsValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const investmentProfit = totalInvestmentsValue - totalInvested;
  const netWorth = finance.balance + totalPossessionsValue + totalInvestmentsValue;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-4 mb-4 border border-green-500/30">
        <p className="text-xs text-text-muted">Patrimoine net</p>
        <p className="text-3xl font-black text-green-400">{formatCurrency(netWorth)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-surface rounded-xl p-3 text-center">
          <p className="text-xs text-text-muted">Solde</p>
          <p className="text-lg font-bold text-text">{formatCurrency(finance.balance)}</p>
        </div>
        <div className="bg-surface rounded-xl p-3 text-center">
          <p className="text-xs text-text-muted">Salaire/sem</p>
          <p className="text-lg font-bold text-text">{formatCurrency(career.contract.weeklySalary)}</p>
        </div>
        <div className="bg-surface rounded-xl p-3 text-center">
          <p className="text-xs text-text-muted">Possessions</p>
          <p className="text-lg font-bold text-text">{formatCurrency(totalPossessionsValue)}</p>
        </div>
        <div className="bg-surface rounded-xl p-3 text-center">
          <p className="text-xs text-text-muted">Investissements</p>
          <p className="text-lg font-bold text-text">{formatCurrency(totalInvestmentsValue)}</p>
        </div>
      </div>

      {/* Investment details */}
      {investments.length > 0 && (
        <div className="bg-surface rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-text">📈 Investissements</h3>
            <span className={`text-xs font-bold ${investmentProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {investmentProfit >= 0 ? '+' : ''}{formatCurrency(investmentProfit)}
            </span>
          </div>
          <div className="space-y-2">
            {investments.map((inv) => {
              const profit = inv.currentValue - inv.investedAmount;
              const profitPct = ((inv.currentValue / inv.investedAmount) - 1) * 100;
              return (
                <div key={inv.id} className="flex items-center justify-between py-1 border-b border-surface-light/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{inv.emoji}</span>
                    <span className="text-xs text-text">{inv.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-text">{formatCurrency(inv.currentValue)}</p>
                    <p className={`text-[10px] ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Salary info */}
      <div className="bg-surface rounded-xl p-4">
        <h3 className="text-sm font-bold text-text mb-2">💰 Revenus</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Salaire hebdo</span>
            <span className="text-text">{formatCurrency(career.contract.weeklySalary)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Salaire mensuel (×4)</span>
            <span className="text-text">{formatCurrency(career.contract.weeklySalary * 4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Salaire annuel (×52)</span>
            <span className="text-text font-bold">{formatCurrency(career.contract.weeklySalary * 52)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Trophées ────────────────────────────────────────────────────────────────

function TrophiesView() {
  const gameState = useGameStore((s) => s.gameState);
  if (!gameState) return null;

  const trophies = gameState.career.trophies ?? [];

  return (
    <div className="flex-1 flex items-center justify-center pb-20">
      <div className="text-center">
        <p className="text-4xl mb-4">🏆</p>
        {trophies.length === 0 ? (
          <>
            <p className="text-text-muted">Aucun trophée</p>
            <p className="text-xs text-text-muted mt-1">Gagne des compétitions pour débloquer des trophées</p>
          </>
        ) : (
          <p className="text-text">{trophies.length} trophée(s)</p>
        )}
      </div>
    </div>
  );
}

// ─── Relations (Tinder-style) ────────────────────────────────────────────────

function RelationsView() {
  const gameState = useGameStore((s) => s.gameState);
  if (!gameState) return null;

  const relationship = gameState.lifestyle.relationships.current;

  if (relationship) {
    return <RelationshipDashboard relationship={relationship} />;
  }

  return <TinderSwipe />;
}

/** Vue Tinder — Recherche de partenaire */
function TinderSwipe() {
  const gameState = useGameStore((s) => s.gameState);
  const [ageFilter, setAgeFilter] = useState<[number, number]>([18, 35]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  if (!gameState) return null;

  const popularity = gameState.social.popularity;
  const history = gameState.lifestyle.relationships.history;
  // Calculate age offset: women ages are base ages at game start (year of first season)
  const currentYear = gameState.time.currentDate.year;
  const startYear = currentYear - (gameState.career.season - 1); // year when season 1 started
  const ageOffset = currentYear - startYear;

  // Filter women by age and popularity, exclude past relationships
  const pastIds = history.map((h) => h.womanId);
  const available = ALL_WOMEN_DATA.filter(
    (w) =>
      (w.age + ageOffset) >= ageFilter[0] &&
      (w.age + ageOffset) <= ageFilter[1] &&
      w.popularityRequired <= popularity &&
      !pastIds.includes(w.id)
  );

  const currentWoman = available[currentIndex % Math.max(available.length, 1)];

  const handleSwipeLeft = () => {
    setCurrentIndex((i) => (i + 1) % Math.max(available.length, 1));
  };

  const handleSwipeRight = () => {
    if (!currentWoman) return;

    // Match! Start relationship
    const state = useGameStore.getState();
    if (!state.gameState) return;

    const currentDate = state.gameState.time.currentDate;
    const newRelationships = RelationshipSystem.startRelationship(
      state.gameState.lifestyle.relationships,
      currentWoman.id,
      currentWoman.firstName,
      currentDate
    );

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        lifestyle: {
          ...state.gameState.lifestyle,
          relationships: newRelationships,
        },
      },
    });

    setMessage(`💕 Match avec ${currentWoman.firstName} !`);
    setTimeout(() => setMessage(null), 3000);
  };

  if (available.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center pb-20">
        <div className="text-center px-6">
          <p className="text-4xl mb-4">💔</p>
          <p className="text-text font-medium">Aucune femme disponible</p>
          <p className="text-xs text-text-muted mt-2">
            Augmente ta popularité ({popularity}/100) pour débloquer plus de profils !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
      {message && (
        <div className="bg-pink-500/20 border border-pink-500/40 rounded-xl p-3 mb-4 text-center text-sm text-pink-300 font-bold">
          {message}
        </div>
      )}

      {/* Age filter */}
      <div className="bg-surface rounded-xl p-3 mb-4 border border-surface-light">
        <p className="text-xs text-text-muted mb-2">🔍 Filtre par âge</p>
        <div className="flex items-center gap-3">
          <select
            value={ageFilter[0]}
            onChange={(e) => { setAgeFilter([Number(e.target.value), ageFilter[1]]); setCurrentIndex(0); }}
            className="bg-surface-light text-text text-xs rounded-lg px-2 py-1.5 border border-surface-light"
          >
            {Array.from({ length: 18 }, (_, i) => 18 + i).map((age) => (
              <option key={age} value={age}>{age} ans</option>
            ))}
          </select>
          <span className="text-text-muted text-xs">à</span>
          <select
            value={ageFilter[1]}
            onChange={(e) => { setAgeFilter([ageFilter[0], Number(e.target.value)]); setCurrentIndex(0); }}
            className="bg-surface-light text-text text-xs rounded-lg px-2 py-1.5 border border-surface-light"
          >
            {Array.from({ length: 18 }, (_, i) => 18 + i).map((age) => (
              <option key={age} value={age}>{age} ans</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-text-muted mt-2">{available.length} profil(s) disponible(s)</p>
      </div>

      {/* Tinder Card */}
      {currentWoman && (
        <div className="bg-gradient-to-b from-pink-500/10 to-surface rounded-2xl border border-pink-500/30 overflow-hidden mb-4">
          <div className="flex items-center justify-center py-8">
            <span className="text-7xl">{currentWoman.emoji}</span>
          </div>
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black text-text">{currentWoman.firstName}</h3>
              <span className="text-sm text-text-muted">{currentWoman.age + ageOffset} ans</span>
            </div>
            <p className="text-sm text-primary-light font-medium mb-1">{currentWoman.job}</p>
            <p className="text-xs text-text-muted mb-3">{currentWoman.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {currentWoman.interests.map((interest) => (
                <span key={interest} className="bg-surface-light text-text-muted text-xs px-2 py-0.5 rounded-full">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Swipe buttons */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={handleSwipeLeft}
          className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center text-2xl active:scale-90 transition-transform"
        >
          ✕
        </button>
        <button
          onClick={handleSwipeRight}
          className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center text-3xl active:scale-90 transition-transform"
        >
          💚
        </button>
      </div>
    </div>
  );
}

/** Dashboard de la relation en cours */
function RelationshipDashboard({ relationship }: { relationship: Relationship }) {
  const gameState = useGameStore((s) => s.gameState);
  const [message, setMessage] = useState<string | null>(null);
  const [showBabyNaming, setShowBabyNaming] = useState(false);
  const [babyName, setBabyName] = useState('');
  const [babyGender, setBabyGender] = useState<'boy' | 'girl'>('boy');

  if (!gameState) return null;

  const balance = gameState.finance.balance;
  const currentDate = gameState.time.currentDate;
  const woman = ALL_WOMEN_DATA.find((w) => w.id === relationship.womanId);

  const statusLabel: Record<string, string> = {
    dating: '💑 En couple',
    engaged: '💍 Fiancés',
    married: '👰 Mariés',
  };

  const handleGift = (gift: typeof GIFT_TIERS[number]) => {
    const state = useGameStore.getState();
    if (!state.gameState?.lifestyle.relationships.current) return;

    if (state.gameState.finance.balance < gift.cost) {
      setMessage(`❌ Pas assez d'argent !`);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const updated = RelationshipSystem.giveGift(
      state.gameState.lifestyle.relationships.current,
      gift.loveGain,
      currentDate
    );

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        finance: { ...state.gameState.finance, balance: state.gameState.finance.balance - gift.cost },
        lifestyle: {
          ...state.gameState.lifestyle,
          relationships: { ...state.gameState.lifestyle.relationships, current: updated },
        },
      },
    });

    setMessage(`🎁 ${gift.name} offert ! +${gift.loveGain} ❤️`);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleTravel = (trip: typeof TRAVEL_OPTIONS[number]) => {
    const state = useGameStore.getState();
    if (!state.gameState?.lifestyle.relationships.current) return;

    if (state.gameState.finance.balance < trip.cost) {
      setMessage(`❌ Pas assez d'argent !`);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const updated = RelationshipSystem.goOnTrip(
      state.gameState.lifestyle.relationships.current,
      trip.loveGain,
      currentDate
    );

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        finance: { ...state.gameState.finance, balance: state.gameState.finance.balance - trip.cost },
        lifestyle: {
          ...state.gameState.lifestyle,
          relationships: { ...state.gameState.lifestyle.relationships, current: updated },
        },
      },
    });

    setMessage(`✈️ Voyage à ${trip.name} ! +${trip.loveGain} ❤️`);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleIntimacy = () => {
    const state = useGameStore.getState();
    if (!state.gameState?.lifestyle.relationships.current) return;

    const updated = RelationshipSystem.intimacy(
      state.gameState.lifestyle.relationships.current,
      currentDate
    );

    if (!updated) {
      setMessage(`❌ Relation pas assez forte (min ${THRESHOLDS.intimacy} ❤️)`);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        lifestyle: {
          ...state.gameState.lifestyle,
          relationships: { ...state.gameState.lifestyle.relationships, current: updated },
        },
      },
    });

    setMessage(`🔥 Moment intime ! +5 ❤️`);
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePropose = () => {
    const state = useGameStore.getState();
    if (!state.gameState?.lifestyle.relationships.current) return;

    const updated = RelationshipSystem.propose(
      state.gameState.lifestyle.relationships.current,
      currentDate
    );

    if (!updated) {
      setMessage(`❌ Amour insuffisant (min ${THRESHOLDS.proposal} ❤️) ou déjà fiancés`);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        lifestyle: {
          ...state.gameState.lifestyle,
          relationships: { ...state.gameState.lifestyle.relationships, current: updated },
        },
      },
    });

    setMessage(`💍 Elle a dit OUI ! Vous êtes fiancés !`);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleWedding = () => {
    const state = useGameStore.getState();
    if (!state.gameState?.lifestyle.relationships.current) return;

    const weddingCost = 50_000;
    if (state.gameState.finance.balance < weddingCost) {
      setMessage(`❌ Le mariage coûte ${formatCurrency(weddingCost)} !`);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const updated = RelationshipSystem.marry(
      state.gameState.lifestyle.relationships.current,
      currentDate
    );

    if (!updated) {
      setMessage(`❌ Amour insuffisant (min ${THRESHOLDS.wedding} ❤️) ou pas encore fiancés`);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        finance: { ...state.gameState.finance, balance: state.gameState.finance.balance - weddingCost },
        lifestyle: {
          ...state.gameState.lifestyle,
          relationships: { ...state.gameState.lifestyle.relationships, current: updated },
        },
      },
    });

    setMessage(`👰 Félicitations ! Vous êtes mariés !`);
    setTimeout(() => setMessage(null), 5000);
  };

  const handleBreakUp = () => {
    const state = useGameStore.getState();
    if (!state.gameState) return;

    const updated = RelationshipSystem.breakUp(
      state.gameState.lifestyle.relationships,
      currentDate
    );

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        lifestyle: {
          ...state.gameState.lifestyle,
          relationships: updated,
        },
      },
    });

    setMessage(`💔 Relation terminée...`);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
      {/* Baby naming modal */}
      {showBabyNaming && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm">
            <p className="text-4xl text-center mb-3">👶</p>
            <h3 className="text-lg font-bold text-text text-center mb-4">Nouveau bébé !</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Genre</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBabyGender('boy')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold ${babyGender === 'boy' ? 'bg-blue-500 text-white' : 'bg-surface-light text-text-muted'}`}
                  >
                    👦 Garçon
                  </button>
                  <button
                    onClick={() => setBabyGender('girl')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold ${babyGender === 'girl' ? 'bg-pink-500 text-white' : 'bg-surface-light text-text-muted'}`}
                  >
                    👧 Fille
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1 block">Prénom</label>
                <input
                  type="text"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder="Choisis un prénom..."
                  className="w-full px-4 py-3 bg-background border border-surface-light rounded-lg text-text text-center"
                  maxLength={20}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowBabyNaming(false)}
                  className="flex-1 py-3 bg-surface-light text-text-muted font-semibold rounded-xl active:scale-95"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (!babyName.trim()) return;
                    const state = useGameStore.getState();
                    if (!state.gameState) return;

                    const newChild = {
                      id: `child-${Date.now()}`,
                      firstName: babyName.trim(),
                      gender: babyGender,
                      birthDate: state.gameState.time.currentDate,
                    };

                    const children = state.gameState.lifestyle.relationships.children ?? [];

                    useGameStore.setState({
                      gameState: {
                        ...state.gameState,
                        lifestyle: {
                          ...state.gameState.lifestyle,
                          relationships: {
                            ...state.gameState.lifestyle.relationships,
                            children: [...children, newChild],
                          },
                        },
                      },
                    });

                    setShowBabyNaming(false);
                    setBabyName('');
                    setMessage(`🎉 Félicitations ! ${babyName.trim()} est né${babyGender === 'girl' ? 'e' : ''} !`);
                    setTimeout(() => setMessage(null), 5000);
                  }}
                  disabled={!babyName.trim()}
                  className={`flex-1 py-3 font-semibold rounded-xl active:scale-95 ${babyName.trim() ? 'bg-pink-500 text-white' : 'bg-surface-light text-text-muted'}`}
                >
                  Confirmer 👶
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="bg-surface rounded-xl p-3 mb-4 text-center text-sm text-text font-medium">
          {message}
        </div>
      )}

      {/* Partner card */}
      <div className="bg-gradient-to-r from-pink-500/20 to-red-500/20 rounded-2xl p-4 mb-4 border border-pink-500/30">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{woman?.emoji ?? '👩'}</span>
          <div className="flex-1">
            <h3 className="text-lg font-black text-text">{relationship.womanName}</h3>
            <p className="text-xs text-text-muted">{woman?.job ?? ''} • {woman ? woman.age + (currentDate.year - relationship.startDate.year) : '?'} ans</p>
            <p className="text-sm font-bold text-pink-400 mt-1">{statusLabel[relationship.status]}</p>
          </div>
        </div>

        {/* Love bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-text-muted">❤️ Amour</span>
            <span className="text-xs font-bold text-pink-400">{relationship.love}/100</span>
          </div>
          <div className="h-3 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-red-500 transition-all"
              style={{ width: `${relationship.love}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
          <span>🎁 {relationship.giftsGiven} cadeaux</span>
          <span>✈️ {relationship.tripsCount} voyages</span>
          <span>🔥 {relationship.intimacyCount}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {/* Cadeaux */}
        <div>
          <h4 className="text-sm font-bold text-text mb-2">🎁 Offrir un cadeau</h4>
          <div className="grid grid-cols-2 gap-2">
            {GIFT_TIERS.map((gift) => (
              <button
                key={gift.id}
                onClick={() => handleGift(gift)}
                disabled={balance < gift.cost}
                className={`bg-surface rounded-xl p-3 border border-surface-light text-left transition-all ${
                  balance >= gift.cost ? 'active:scale-95' : 'opacity-50'
                }`}
              >
                <span className="text-xl">{gift.emoji}</span>
                <p className="text-xs font-medium text-text mt-1">{gift.name}</p>
                <p className="text-xs text-primary-light font-bold">{formatCurrency(gift.cost)}</p>
                <p className="text-xs text-pink-400">+{gift.loveGain} ❤️</p>
              </button>
            ))}
          </div>
        </div>

        {/* Voyages */}
        <div>
          <h4 className="text-sm font-bold text-text mb-2">✈️ Voyages</h4>
          <div className="grid grid-cols-2 gap-2">
            {TRAVEL_OPTIONS.map((trip) => (
              <button
                key={trip.id}
                onClick={() => handleTravel(trip)}
                disabled={balance < trip.cost}
                className={`bg-surface rounded-xl p-3 border border-surface-light text-left transition-all ${
                  balance >= trip.cost ? 'active:scale-95' : 'opacity-50'
                }`}
              >
                <span className="text-xl">{trip.emoji}</span>
                <p className="text-xs font-medium text-text mt-1">{trip.name}</p>
                <p className="text-xs text-primary-light font-bold">{formatCurrency(trip.cost)}</p>
                <p className="text-xs text-pink-400">+{trip.loveGain} ❤️</p>
              </button>
            ))}
          </div>
        </div>

        {/* Actions spéciales */}
        <div>
          <h4 className="text-sm font-bold text-text mb-2">💫 Actions</h4>
          <div className="space-y-2">
            {/* Intimité */}
            <button
              onClick={handleIntimacy}
              disabled={relationship.love < THRESHOLDS.intimacy}
              className={`w-full bg-surface rounded-xl p-3 border border-surface-light flex items-center gap-3 transition-all ${
                relationship.love >= THRESHOLDS.intimacy ? 'active:scale-[0.98]' : 'opacity-50'
              }`}
            >
              <span className="text-2xl">🔥</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-text">Moment intime</p>
                <p className="text-xs text-text-muted">Nécessite {THRESHOLDS.intimacy}+ ❤️</p>
              </div>
              <span className="text-xs text-pink-400 font-bold">+5 ❤️</span>
            </button>

            {/* Fiançailles */}
            {relationship.status === 'dating' && (
              <button
                onClick={handlePropose}
                disabled={relationship.love < THRESHOLDS.proposal}
                className={`w-full bg-surface rounded-xl p-3 border border-surface-light flex items-center gap-3 transition-all ${
                  relationship.love >= THRESHOLDS.proposal ? 'active:scale-[0.98]' : 'opacity-50'
                }`}
              >
                <span className="text-2xl">💍</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-text">Demander en fiançailles</p>
                  <p className="text-xs text-text-muted">Nécessite {THRESHOLDS.proposal}+ ❤️</p>
                </div>
                <span className="text-xs text-pink-400 font-bold">+10 ❤️</span>
              </button>
            )}

            {/* Mariage */}
            {relationship.status === 'engaged' && (
              <button
                onClick={handleWedding}
                disabled={relationship.love < THRESHOLDS.wedding || balance < 50_000}
                className={`w-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl p-3 border border-pink-500/30 flex items-center gap-3 transition-all ${
                  relationship.love >= THRESHOLDS.wedding && balance >= 50_000 ? 'active:scale-[0.98]' : 'opacity-50'
                }`}
              >
                <span className="text-2xl">👰</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-text">Se marier</p>
                  <p className="text-xs text-text-muted">Nécessite {THRESHOLDS.wedding}+ ❤️ • Coût : {formatCurrency(50_000)}</p>
                </div>
              </button>
            )}

            {/* Avoir un enfant (fiancés ou mariés) */}
            {(relationship.status === 'engaged' || relationship.status === 'married') && (
              <button
                onClick={() => setShowBabyNaming(true)}
                className="w-full bg-pink-500/10 rounded-xl p-3 border border-pink-500/30 flex items-center gap-3 active:scale-[0.98] transition-all"
              >
                <span className="text-2xl">👶</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-pink-400">Avoir un enfant</p>
                  <p className="text-xs text-text-muted">Agrandir la famille</p>
                </div>
              </button>
            )}

            {/* Rupture */}
            <button
              onClick={handleBreakUp}
              className="w-full bg-red-500/10 rounded-xl p-3 border border-red-500/30 flex items-center gap-3 active:scale-[0.98] transition-all"
            >
              <span className="text-2xl">💔</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-red-400">Rompre</p>
                <p className="text-xs text-text-muted">Mettre fin à la relation</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Enfants */}
      {(gameState.lifestyle.relationships.children ?? []).length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-text mb-2">👨‍👩‍👧‍👦 Mes enfants</h4>
          <div className="space-y-2">
            {(gameState.lifestyle.relationships.children ?? []).map((child) => {
              const childAge = currentDate.year - child.birthDate.year;
              return (
                <div key={child.id} className="bg-surface rounded-xl p-3 border border-surface-light flex items-center gap-3">
                  <span className="text-2xl">{child.gender === 'boy' ? '👦' : '👧'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text">{child.firstName}</p>
                    <p className="text-xs text-text-muted">
                      {childAge <= 0 ? 'Nouveau-né' : `${childAge} an${childAge > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <span className="text-xs text-text-muted">Né le {child.birthDate.day}/{child.birthDate.month}/{child.birthDate.year}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historique */}
      {gameState.lifestyle.relationships.history.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-text-muted mb-2">📜 Historique</h4>
          <div className="space-y-1">
            {gameState.lifestyle.relationships.history.map((entry, i) => (
              <div key={i} className="bg-surface rounded-lg p-2 border border-surface-light flex items-center gap-2">
                <span className="text-sm">💔</span>
                <span className="text-xs text-text-muted">{entry.womanName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RelationCard({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="bg-surface rounded-xl p-4 border border-surface-light">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text">{emoji} {label}</span>
        <span className="text-sm font-bold text-text">{value}/100</span>
      </div>
      <div className="h-2 bg-surface-light rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function WellnessItem({ name, emoji, price, effect, onBuy, canAfford, description }: {
  name: string;
  emoji: string;
  price: number;
  effect: string;
  onBuy: () => void;
  canAfford: boolean;
  description: string;
}) {
  return (
    <div className="bg-surface rounded-xl p-3 flex items-center gap-3 border border-surface-light">
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text">{name}</p>
        <p className="text-xs text-text-muted">{description}</p>
        <p className="text-xs text-green-400 font-medium">{effect}</p>
      </div>
      <button
        onClick={onBuy}
        disabled={!canAfford}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          canAfford
            ? 'bg-secondary text-white active:scale-95'
            : 'bg-surface-light text-text-muted cursor-not-allowed'
        }`}
      >
        {formatCurrency(price)}
      </button>
    </div>
  );
}

// ─── Célébrités ──────────────────────────────────────────────────────────────

function CelebritiesView() {
  const gameState = useGameStore((s) => s.gameState);
  const [categoryFilter, setCategoryFilter] = useState<CelebrityCategory | 'all'>('all');
  const [message, setMessage] = useState<string | null>(null);

  if (!gameState) return null;

  const popularity = gameState.social.popularity;
  const celebrities = gameState.lifestyle.celebrities?.relations ?? [];
  const currentDate = gameState.time.currentDate;

  // Filter available celebrities by popularity
  const available = ALL_CELEBRITIES.filter((c) => c.popularityRequired <= popularity);
  const filtered = categoryFilter === 'all'
    ? available
    : available.filter((c) => c.category === categoryFilter);

  const getRelation = (celId: string) => celebrities.find((r) => r.celebrityId === celId);

  const handleFollow = (celeb: CelebrityProfile) => {
    const state = useGameStore.getState();
    if (!state.gameState) return;

    const existing = state.gameState.lifestyle.celebrities?.relations ?? [];
    const relation = existing.find((r) => r.celebrityId === celeb.id);

    if (relation?.isFollowing) {
      // Unfollow
      const updated = existing.map((r) =>
        r.celebrityId === celeb.id ? { ...r, isFollowing: false } : r
      );
      useGameStore.setState({
        gameState: {
          ...state.gameState,
          lifestyle: {
            ...state.gameState.lifestyle,
            celebrities: { relations: updated },
          },
        },
      });
      setMessage(`❌ Tu ne suis plus ${celeb.name}`);
    } else {
      // Follow — create or update relation
      const currentIg = state.gameState.lifestyle.instagram ?? { followers: 1000, posts: [], weeklyPostDone: false };
      let updated;
      if (relation) {
        updated = existing.map((r) =>
          r.celebrityId === celeb.id ? { ...r, isFollowing: true } : r
        );
      } else {
        const newRelation = {
          celebrityId: celeb.id,
          name: celeb.name,
          level: 0,
          isFollowing: true,
          interactions: 0,
          lastInteraction: currentDate,
        };
        updated = [...existing, newRelation];
      }

      useGameStore.setState({
        gameState: {
          ...state.gameState,
          lifestyle: {
            ...state.gameState.lifestyle,
            celebrities: { relations: updated },
            instagram: {
              ...currentIg,
              followers: currentIg.followers + Math.round(celeb.followerBonus * 0.1),
            },
          },
        },
      });
      setMessage(`✅ Tu suis ${celeb.name} ! +${Math.round(celeb.followerBonus * 0.1)} followers`);
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInteract = (celeb: CelebrityProfile, action: 'dm' | 'collab' | 'hangout') => {
    const state = useGameStore.getState();
    if (!state.gameState) return;

    const existing = state.gameState.lifestyle.celebrities?.relations ?? [];
    const relation = existing.find((r) => r.celebrityId === celeb.id);

    if (!relation || !relation.isFollowing) {
      setMessage(`❌ Tu dois d'abord suivre ${celeb.name} !`);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    let levelGain = 0;
    let followerGain = 0;
    let cost = 0;
    let actionLabel = '';

    switch (action) {
      case 'dm':
        levelGain = 3 + Math.floor(Math.random() * 5);
        followerGain = Math.round(celeb.followerBonus * 0.05);
        actionLabel = `💬 DM envoyé à ${celeb.name}`;
        break;
      case 'collab':
        levelGain = 8 + Math.floor(Math.random() * 8);
        followerGain = celeb.followerBonus;
        cost = 5000;
        actionLabel = `🤝 Collab avec ${celeb.name}`;
        break;
      case 'hangout':
        levelGain = 12 + Math.floor(Math.random() * 10);
        followerGain = Math.round(celeb.followerBonus * 0.5);
        cost = 10000;
        actionLabel = `🎉 Soirée avec ${celeb.name}`;
        break;
    }

    if (cost > 0 && state.gameState.finance.balance < cost) {
      setMessage(`❌ Pas assez d'argent ! (${formatCurrency(cost)} requis)`);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const currentIg = state.gameState.lifestyle.instagram ?? { followers: 1000, posts: [], weeklyPostDone: false };
    const updatedRelations = existing.map((r) =>
      r.celebrityId === celeb.id
        ? {
            ...r,
            level: Math.min(100, r.level + levelGain),
            interactions: r.interactions + 1,
            lastInteraction: currentDate,
          }
        : r
    );

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        finance: {
          ...state.gameState.finance,
          balance: state.gameState.finance.balance - cost,
        },
        lifestyle: {
          ...state.gameState.lifestyle,
          celebrities: { relations: updatedRelations },
          instagram: {
            ...currentIg,
            followers: currentIg.followers + followerGain,
          },
        },
      },
    });

    setMessage(`${actionLabel} ! +${levelGain} amitié, +${followerGain} followers`);
    setTimeout(() => setMessage(null), 4000);
  };

  const getLevelLabel = (level: number): string => {
    if (level >= 80) return '🤝 Meilleur ami';
    if (level >= 60) return '😎 Bon pote';
    if (level >= 40) return '🙂 Ami';
    if (level >= 20) return '👋 Connaissance';
    return '🆕 Nouveau';
  };

  const getLevelColor = (level: number): string => {
    if (level >= 80) return 'text-green-400';
    if (level >= 60) return 'text-blue-400';
    if (level >= 40) return 'text-yellow-400';
    return 'text-text-muted';
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
      {message && (
        <div className="bg-surface rounded-xl p-3 mb-4 text-center text-sm text-text font-medium">
          {message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-text">⭐ Célébrités</h2>
        <span className="text-xs text-text-muted">Popularité : {popularity}/100</span>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-4 pb-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            categoryFilter === 'all'
              ? 'bg-primary text-white'
              : 'bg-surface text-text-muted border border-surface-light'
          }`}
        >
          Tous
        </button>
        {(Object.keys(CATEGORY_LABELS) as CelebrityCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-primary text-white'
                : 'bg-surface text-text-muted border border-surface-light'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* My celebrity friends */}
      {celebrities.filter((r) => r.isFollowing).length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-text mb-2">🌟 Mes relations</h3>
          <div className="space-y-2">
            {celebrities
              .filter((r) => r.isFollowing)
              .sort((a, b) => b.level - a.level)
              .map((rel) => {
                const celeb = ALL_CELEBRITIES.find((c) => c.id === rel.celebrityId);
                if (!celeb) return null;
                return (
                  <div key={rel.celebrityId} className="bg-surface rounded-xl p-3 border border-surface-light">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{celeb.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-text">{celeb.name}</p>
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Suivi</span>
                        </div>
                        <p className="text-xs text-text-muted">{celeb.instagramHandle} • {celeb.instagramFollowers}M abonnés</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium ${getLevelColor(rel.level)}`}>{getLevelLabel(rel.level)}</span>
                          <span className="text-xs text-text-muted">{rel.level}/100</span>
                        </div>
                      </div>
                    </div>
                    {/* Relation bar */}
                    <div className="mt-2 h-1.5 bg-surface-light rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                        style={{ width: `${rel.level}%` }}
                      />
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleInteract(celeb, 'dm')}
                        className="flex-1 py-1.5 bg-surface-light rounded-lg text-xs text-text font-medium active:scale-95 transition-all"
                      >
                        💬 DM
                      </button>
                      <button
                        onClick={() => handleInteract(celeb, 'collab')}
                        className="flex-1 py-1.5 bg-blue-500/20 rounded-lg text-xs text-blue-400 font-medium active:scale-95 transition-all"
                      >
                        🤝 Collab (5K€)
                      </button>
                      <button
                        onClick={() => handleInteract(celeb, 'hangout')}
                        className="flex-1 py-1.5 bg-purple-500/20 rounded-lg text-xs text-purple-400 font-medium active:scale-95 transition-all"
                      >
                        🎉 Soirée (10K€)
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Available celebrities */}
      <h3 className="text-sm font-bold text-text mb-2">📋 Célébrités disponibles ({filtered.length})</h3>
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-text-muted text-sm">Augmente ta popularité pour débloquer des célébrités</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((celeb) => {
            const relation = getRelation(celeb.id);
            const isFollowing = relation?.isFollowing ?? false;

            return (
              <div key={celeb.id} className="bg-surface rounded-xl p-3 border border-surface-light">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{celeb.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text">{celeb.name}</p>
                      <span className="text-[10px] bg-surface-light text-text-muted px-1.5 py-0.5 rounded">
                        {CATEGORY_LABELS[celeb.category].split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">{celeb.description}</p>
                    <p className="text-xs text-blue-400 mt-0.5">{celeb.instagramHandle} • {celeb.instagramFollowers}M</p>
                  </div>
                  <button
                    onClick={() => handleFollow(celeb)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                      isFollowing
                        ? 'bg-surface-light text-text-muted border border-surface-light'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {isFollowing ? 'Suivi ✓' : 'Suivre'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Locked celebrities preview */}
      {ALL_CELEBRITIES.filter((c) => c.popularityRequired > popularity).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-text-muted mb-2">🔒 Célébrités verrouillées</h3>
          <div className="space-y-1.5">
            {ALL_CELEBRITIES
              .filter((c) => c.popularityRequired > popularity)
              .sort((a, b) => a.popularityRequired - b.popularityRequired)
              .slice(0, 5)
              .map((celeb) => (
                <div key={celeb.id} className="bg-surface/50 rounded-lg p-2.5 border border-surface-light flex items-center gap-3 opacity-60">
                  <span className="text-lg">{celeb.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-muted">{celeb.name}</p>
                    <p className="text-[10px] text-text-muted">{celeb.description}</p>
                  </div>
                  <span className="text-[10px] text-red-400 font-bold">{celeb.popularityRequired}+ pop.</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
