/**
 * PenaltyShootout — Mini-jeu de tirs au but.
 * Le joueur choisit un côté pour tirer (gauche/centre/droite)
 * et un côté pour plonger quand il est gardien.
 * 5 tirs par équipe, puis mort subite.
 */

import { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ShootDirection = 'left' | 'center' | 'right';

interface PenaltyRound {
  shooter: 'player' | 'opponent';
  direction?: ShootDirection;
  diveDirection?: ShootDirection;
  scored: boolean | null;
}

interface PenaltyShootoutProps {
  playerTeamName: string;
  opponentTeamName: string;
  onComplete: (playerWon: boolean, playerScore: number, opponentScore: number) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PenaltyShootout({ playerTeamName, opponentTeamName, onComplete }: PenaltyShootoutProps) {
  const [rounds, setRounds] = useState<PenaltyRound[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [phase, setPhase] = useState<'shoot' | 'save' | 'result' | 'finished'>('shoot');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const totalRounds = Math.max(10, rounds.length + 2); // at least 5 per team
  const playerRound = currentRound % 2 === 0; // player shoots on even rounds

  // Check if shootout is decided
  const checkFinished = (pScore: number, oScore: number, roundNum: number): boolean => {
    const playerShots = Math.ceil((roundNum + 1) / 2);
    const opponentShots = Math.floor((roundNum + 1) / 2);

    // After 5 shots each (10 rounds), check if tied → sudden death
    if (roundNum >= 10) {
      // In sudden death, check after each pair
      if (roundNum % 2 === 0 && pScore !== oScore) return true;
    } else {
      // During regular 5, check if one team can't catch up
      const playerRemaining = 5 - playerShots;
      const opponentRemaining = 5 - opponentShots;
      if (pScore > oScore + opponentRemaining) return true;
      if (oScore > pScore + playerRemaining) return true;
    }
    return false;
  };

  const handleShoot = (direction: ShootDirection) => {
    // Player is shooting — opponent GK dives randomly
    const gkDive: ShootDirection = ['left', 'center', 'right'][Math.floor(Math.random() * 3)] as ShootDirection;
    const scored = direction !== gkDive || (direction === 'center' && Math.random() < 0.4);

    const newPScore = scored ? playerScore + 1 : playerScore;
    setPlayerScore(newPScore);

    const round: PenaltyRound = { shooter: 'player', direction, diveDirection: gkDive, scored };
    setRounds([...rounds, round]);

    setLastResult(scored ? '⚽ BUUUT !' : '❌ Arrêté !');
    setPhase('result');

    setTimeout(() => {
      const nextRound = currentRound + 1;
      if (checkFinished(newPScore, opponentScore, nextRound)) {
        setPhase('finished');
      } else {
        setCurrentRound(nextRound);
        setPhase('save');
        setLastResult(null);
      }
    }, 1500);
  };

  const handleSave = (diveDirection: ShootDirection) => {
    // Opponent is shooting — player GK dives
    const shootDir: ShootDirection = ['left', 'center', 'right'][Math.floor(Math.random() * 3)] as ShootDirection;
    const scored = shootDir !== diveDirection || (shootDir === 'center' && Math.random() < 0.4);

    const newOScore = scored ? opponentScore + 1 : opponentScore;
    setOpponentScore(newOScore);

    const round: PenaltyRound = { shooter: 'opponent', direction: shootDir, diveDirection, scored };
    setRounds([...rounds, round]);

    setLastResult(scored ? '😤 But adverse...' : '🧤 ARRÊTÉ !');
    setPhase('result');

    setTimeout(() => {
      const nextRound = currentRound + 1;
      if (checkFinished(playerScore, newOScore, nextRound)) {
        setPhase('finished');
      } else {
        setCurrentRound(nextRound);
        setPhase('shoot');
        setLastResult(null);
      }
    }, 1500);
  };

  // ─── Finished ────────────────────────────────────────────────────────────

  if (phase === 'finished') {
    const playerWon = playerScore > opponentScore;
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
        <p className="text-5xl mb-4">{playerWon ? '🎉' : '😞'}</p>
        <h2 className="text-2xl font-bold text-text mb-2">
          {playerWon ? 'Victoire aux tirs au but !' : 'Défaite aux tirs au but...'}
        </h2>
        <p className="text-3xl font-black text-text mb-6">
          {playerScore} - {opponentScore}
        </p>

        {/* Recap */}
        <div className="w-full max-w-xs space-y-1 mb-6">
          {rounds.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1 px-2 bg-surface rounded">
              <span className="text-text-muted">{r.shooter === 'player' ? playerTeamName : opponentTeamName}</span>
              <span>{r.scored ? '⚽' : '❌'}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => onComplete(playerWon, playerScore, opponentScore)}
          className="py-3 px-8 bg-primary text-white font-semibold rounded-xl active:scale-95"
        >
          Continuer
        </button>
      </div>
    );
  }

  // ─── Result animation ────────────────────────────────────────────────────

  if (phase === 'result' && lastResult) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
        <p className="text-4xl mb-4">{lastResult.includes('BU') || lastResult.includes('adverse') ? '⚽' : '🧤'}</p>
        <p className="text-xl font-bold text-text mb-4">{lastResult}</p>
        <p className="text-2xl font-black text-text">{playerScore} - {opponentScore}</p>
      </div>
    );
  }

  // ─── Shoot phase ─────────────────────────────────────────────────────────

  if (phase === 'shoot') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
        {/* Score */}
        <div className="flex items-center gap-4 mb-6">
          <div className="text-center">
            <p className="text-xs text-text-muted">{playerTeamName}</p>
            <p className="text-2xl font-black text-text">{playerScore}</p>
          </div>
          <span className="text-text-muted">-</span>
          <div className="text-center">
            <p className="text-xs text-text-muted">{opponentTeamName}</p>
            <p className="text-2xl font-black text-text">{opponentScore}</p>
          </div>
        </div>

        <p className="text-sm text-text-muted mb-2">Tir #{Math.ceil((currentRound + 1) / 2)}</p>
        <p className="text-lg font-bold text-text mb-8">🎯 Choisis où tirer !</p>

        {/* Goal with 3 zones */}
        <div className="w-full max-w-xs mb-6">
          <div className="bg-surface border-2 border-text-muted rounded-t-xl h-32 flex">
            <button
              onClick={() => handleShoot('left')}
              className="flex-1 flex items-center justify-center border-r border-surface-light hover:bg-green-500/20 active:bg-green-500/30 rounded-tl-xl transition-all"
            >
              <span className="text-2xl">⬅️</span>
            </button>
            <button
              onClick={() => handleShoot('center')}
              className="flex-1 flex items-center justify-center border-r border-surface-light hover:bg-green-500/20 active:bg-green-500/30 transition-all"
            >
              <span className="text-2xl">⬆️</span>
            </button>
            <button
              onClick={() => handleShoot('right')}
              className="flex-1 flex items-center justify-center hover:bg-green-500/20 active:bg-green-500/30 rounded-tr-xl transition-all"
            >
              <span className="text-2xl">➡️</span>
            </button>
          </div>
          <div className="h-3 bg-green-800 rounded-b-xl" />
        </div>

        <p className="text-xs text-text-muted">Gauche • Centre • Droite</p>
      </div>
    );
  }

  // ─── Save phase ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
      {/* Score */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-center">
          <p className="text-xs text-text-muted">{playerTeamName}</p>
          <p className="text-2xl font-black text-text">{playerScore}</p>
        </div>
        <span className="text-text-muted">-</span>
        <div className="text-center">
          <p className="text-xs text-text-muted">{opponentTeamName}</p>
          <p className="text-2xl font-black text-text">{opponentScore}</p>
        </div>
      </div>

      <p className="text-sm text-text-muted mb-2">Tir adverse #{Math.ceil((currentRound + 1) / 2)}</p>
      <p className="text-lg font-bold text-text mb-8">🧤 Choisis où plonger !</p>

      {/* Goal with 3 zones */}
      <div className="w-full max-w-xs mb-6">
        <div className="bg-surface border-2 border-red-500/50 rounded-t-xl h-32 flex">
          <button
            onClick={() => handleSave('left')}
            className="flex-1 flex items-center justify-center border-r border-surface-light hover:bg-yellow-500/20 active:bg-yellow-500/30 rounded-tl-xl transition-all"
          >
            <span className="text-2xl">⬅️</span>
          </button>
          <button
            onClick={() => handleSave('center')}
            className="flex-1 flex items-center justify-center border-r border-surface-light hover:bg-yellow-500/20 active:bg-yellow-500/30 transition-all"
          >
            <span className="text-2xl">🧤</span>
          </button>
          <button
            onClick={() => handleSave('right')}
            className="flex-1 flex items-center justify-center hover:bg-yellow-500/20 active:bg-yellow-500/30 rounded-tr-xl transition-all"
          >
            <span className="text-2xl">➡️</span>
          </button>
        </div>
        <div className="h-3 bg-green-800 rounded-b-xl" />
      </div>

      <p className="text-xs text-text-muted">Gauche • Centre • Droite</p>
    </div>
  );
}
