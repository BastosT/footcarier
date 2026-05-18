/**
 * Blackjack — Vrai mini-jeu de Blackjack (21).
 * Règles : tirer pour se rapprocher de 21 sans dépasser.
 * As = 1 ou 11, Figures = 10.
 * Le dealer tire jusqu'à 17.
 */

import { useState, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Suit = '♠' | '♥' | '♦' | '♣';
type CardValue = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: Suit;
  value: CardValue;
  hidden?: boolean;
}

type GamePhase = 'betting' | 'playing' | 'dealer' | 'result';

interface BlackjackProps {
  balance: number;
  onComplete: (profit: number) => void;
  onCancel: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createDeck(): Card[] {
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];
  const values: CardValue[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardNumericValue(card: Card): number {
  if (card.value === 'A') return 11;
  if (['J', 'Q', 'K'].includes(card.value)) return 10;
  return parseInt(card.value);
}

function calculateHand(cards: Card[]): number {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.hidden) continue;
    total += cardNumericValue(card);
    if (card.value === 'A') aces++;
  }

  // Reduce aces from 11 to 1 if over 21
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && calculateHand(cards) === 21;
}

function formatCurrency(n: number): string {
  return n.toLocaleString('fr-FR') + '€';
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Blackjack({ balance, onComplete, onCancel }: BlackjackProps) {
  const [phase, setPhase] = useState<GamePhase>('betting');
  const [bet, setBet] = useState(1000);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [result, setResult] = useState<'win' | 'lose' | 'push' | 'blackjack' | null>(null);

  const drawCard = useCallback((currentDeck: Card[]): [Card, Card[]] => {
    const card = currentDeck[0];
    return [card, currentDeck.slice(1)];
  }, []);

  const startGame = () => {
    if (bet > balance) return;

    const newDeck = createDeck();
    const [p1, d1] = [newDeck[0], newDeck[1]];
    const [p2, d2] = [newDeck[2], { ...newDeck[3], hidden: true }];
    const remaining = newDeck.slice(4);

    const pHand = [p1, p2];
    const dHand = [d1, d2];

    setDeck(remaining);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setPhase('playing');
    setResult(null);

    // Check for natural blackjack
    if (isBlackjack(pHand)) {
      // Reveal dealer
      dHand[1].hidden = false;
      setDealerHand([...dHand]);
      if (isBlackjack(dHand)) {
        setResult('push');
      } else {
        setResult('blackjack');
      }
      setPhase('result');
    }
  };

  const hit = () => {
    const [card, remaining] = drawCard(deck);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(remaining);

    if (calculateHand(newHand) > 21) {
      // Bust — reveal dealer
      const revealedDealer = dealerHand.map((c) => ({ ...c, hidden: false }));
      setDealerHand(revealedDealer);
      setResult('lose');
      setPhase('result');
    }
  };

  const stand = () => {
    // Reveal dealer's hidden card
    let currentDealer = dealerHand.map((c) => ({ ...c, hidden: false }));
    let currentDeck = [...deck];

    // Dealer draws until 17
    while (calculateHand(currentDealer) < 17) {
      const [card, remaining] = [currentDeck[0], currentDeck.slice(1)];
      currentDealer = [...currentDealer, card];
      currentDeck = remaining;
    }

    setDealerHand(currentDealer);
    setDeck(currentDeck);

    const playerTotal = calculateHand(playerHand);
    const dealerTotal = calculateHand(currentDealer);

    if (dealerTotal > 21) {
      setResult('win');
    } else if (playerTotal > dealerTotal) {
      setResult('win');
    } else if (playerTotal < dealerTotal) {
      setResult('lose');
    } else {
      setResult('push');
    }
    setPhase('result');
  };

  const handleFinish = () => {
    let profit = 0;
    if (result === 'blackjack') profit = Math.round(bet * 1.5);
    else if (result === 'win') profit = bet;
    else if (result === 'lose') profit = -bet;
    // push = 0
    onComplete(profit);
  };

  const getCardDisplay = (card: Card): string => {
    if (card.hidden) return '🂠';
    const isRed = card.suit === '♥' || card.suit === '♦';
    return `${card.value}${card.suit}`;
  };

  const getCardColor = (card: Card): string => {
    if (card.hidden) return 'text-text-muted';
    return (card.suit === '♥' || card.suit === '♦') ? 'text-red-400' : 'text-text';
  };

  // ─── Betting Phase ─────────────────────────────────────────────────────────

  if (phase === 'betting') {
    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[400px]">
        <p className="text-3xl mb-4">🃏</p>
        <h2 className="text-xl font-bold text-text mb-6">Blackjack</h2>

        <div className="w-full max-w-xs space-y-4">
          <div>
            <p className="text-xs text-text-muted mb-2 text-center">Mise</p>
            <div className="flex gap-1.5 flex-wrap justify-center">
              {[1000, 2000, 5000, 10000, 25000, 50000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBet(amount)}
                  disabled={amount > balance}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    bet === amount ? 'bg-primary text-white' : amount > balance ? 'bg-surface-light/50 text-text-muted/50' : 'bg-surface-light text-text-muted'
                  }`}
                >
                  {amount >= 1000 ? `${amount / 1000}K` : amount}€
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 py-3 bg-surface-light text-text-muted font-semibold rounded-xl active:scale-95">
              Retour
            </button>
            <button
              onClick={startGame}
              disabled={bet > balance}
              className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl active:scale-95"
            >
              Jouer ({formatCurrency(bet)})
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Playing / Result Phase ────────────────────────────────────────────────

  const playerTotal = calculateHand(playerHand);
  const dealerTotal = calculateHand(dealerHand);

  return (
    <div className="flex flex-col p-4 min-h-[450px]">
      {/* Dealer hand */}
      <div className="mb-6">
        <p className="text-xs text-text-muted mb-1">Croupier {phase === 'result' ? `(${dealerTotal})` : ''}</p>
        <div className="flex gap-1.5">
          {dealerHand.map((card, i) => (
            <div key={i} className={`w-12 h-16 bg-surface border border-surface-light rounded-lg flex items-center justify-center ${getCardColor(card)}`}>
              <span className="text-sm font-bold">{card.hidden ? '?' : getCardDisplay(card)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Result */}
      {phase === 'result' && (
        <div className={`rounded-xl p-3 mb-4 text-center ${
          result === 'win' || result === 'blackjack' ? 'bg-green-500/20 border border-green-500/40' :
          result === 'lose' ? 'bg-red-500/20 border border-red-500/40' :
          'bg-yellow-500/20 border border-yellow-500/40'
        }`}>
          <p className="text-lg font-bold">
            {result === 'blackjack' && '🎉 BLACKJACK ! ×2.5'}
            {result === 'win' && '✅ Gagné !'}
            {result === 'lose' && '❌ Perdu'}
            {result === 'push' && '🤝 Égalité'}
          </p>
          <p className="text-sm text-text-muted mt-1">
            {result === 'blackjack' && `+${formatCurrency(Math.round(bet * 1.5))}`}
            {result === 'win' && `+${formatCurrency(bet)}`}
            {result === 'lose' && `-${formatCurrency(bet)}`}
            {result === 'push' && 'Mise remboursée'}
          </p>
        </div>
      )}

      {/* Player hand */}
      <div className="mb-6">
        <p className="text-xs text-text-muted mb-1">Toi ({playerTotal})</p>
        <div className="flex gap-1.5 flex-wrap">
          {playerHand.map((card, i) => (
            <div key={i} className={`w-12 h-16 bg-surface border-2 ${playerTotal > 21 ? 'border-red-500' : 'border-primary/50'} rounded-lg flex items-center justify-center ${getCardColor(card)}`}>
              <span className="text-sm font-bold">{getCardDisplay(card)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto">
        {phase === 'playing' && (
          <div className="flex gap-3">
            <button
              onClick={hit}
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl active:scale-95"
            >
              Tirer
            </button>
            <button
              onClick={stand}
              className="flex-1 py-3 bg-yellow-600 text-white font-bold rounded-xl active:scale-95"
            >
              Rester
            </button>
          </div>
        )}
        {phase === 'result' && (
          <div className="flex gap-3">
            <button
              onClick={handleFinish}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl active:scale-95"
            >
              Terminer
            </button>
            <button
              onClick={() => { setPhase('betting'); setResult(null); }}
              className="flex-1 py-3 bg-surface-light text-text font-semibold rounded-xl active:scale-95"
            >
              Rejouer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
