/**
 * PostMatch — Écran post-match affiché après un match joué ou simulé.
 *
 * Affiche :
 * - Le score final du match
 * - Les statistiques du joueur : buts, passes décisives, note
 * - Les statistiques détaillées : tirs, dribbles, tacles, précision des passes
 * - L'option d'interview post-match
 * - Gestion du flux d'interview via SocialSystem
 * - Retour à l'écran principal après complétion
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { useState } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';
import type { InterviewAnswer, InterviewQuestion } from '../../core/types';

/** Post-match interview questions generated contextually based on match result */
function generatePostMatchQuestions(
  won: boolean,
  draw: boolean,
  goals: number,
  rating: number
): InterviewQuestion[] {
  if (won) {
    const question = goals >= 2
      ? 'Doublé et victoire ! Vous êtes en feu. Comment expliquez-vous cette forme ?'
      : goals === 1
        ? 'Buteur et victorieux ce soir. Quel est votre sentiment ?'
        : 'Belle victoire collective. Comment jugez-vous la prestation de l\'équipe ?';

    return [{
      text: question,
      answers: [
        {
          text: "C'est un travail d'équipe avant tout. On a tous donné le meilleur de nous-mêmes.",
          tone: 'humble',
          impacts: { popularity: 2, reputation: 2, coachRelation: 3, teamRelation: 4 },
        },
        {
          text: "Je suis en grande forme en ce moment, je sens que rien ne peut m'arrêter !",
          tone: 'confident',
          impacts: { popularity: 4, reputation: 2, coachRelation: 0, teamRelation: -2 },
        },
        {
          text: "Honnêtement, l'adversaire n'était pas au niveau. On mérite mieux comme opposition.",
          tone: 'controversial',
          impacts: { popularity: -2, reputation: -2, coachRelation: -2, teamRelation: -1 },
        },
      ],
    }];
  }

  if (draw) {
    const question = goals > 0
      ? 'Match nul malgré votre but. Frustrant ou satisfaisant ?'
      : rating >= 7
        ? 'Match nul ce soir. Vous avez pourtant bien joué. Un regret ?'
        : 'Partage des points. L\'équipe peut-elle faire mieux ?';

    return [{
      text: question,
      answers: [
        {
          text: "Un point c'est toujours bon à prendre. On continue à travailler.",
          tone: 'humble',
          impacts: { popularity: 1, reputation: 2, coachRelation: 2, teamRelation: 2 },
        },
        {
          text: "On aurait dû gagner. Je suis frustré, on méritait les 3 points.",
          tone: 'confident',
          impacts: { popularity: 2, reputation: 1, coachRelation: 0, teamRelation: 1 },
        },
        {
          text: "Avec un meilleur arbitrage, on gagnait ce match. C'est scandaleux.",
          tone: 'controversial',
          impacts: { popularity: -1, reputation: -3, coachRelation: -2, teamRelation: 0 },
        },
      ],
    }];
  }

  // Loss
  const question = rating < 5
    ? 'Soirée difficile pour vous et l\'équipe. Comment rebondir ?'
    : goals > 0
      ? 'Défaite malgré votre but. Que manque-t-il à cette équipe ?'
      : 'Défaite ce soir. Que retenez-vous de ce match ?';

  return [{
    text: question,
    answers: [
      {
        text: "On doit travailler plus dur à l'entraînement. On reviendra plus forts.",
        tone: 'humble',
        impacts: { popularity: 1, reputation: 2, coachRelation: 3, teamRelation: 3 },
      },
      {
        text: "Je sais ce que je vaux. Ce n'est qu'un mauvais jour, ça arrive.",
        tone: 'confident',
        impacts: { popularity: 1, reputation: 1, coachRelation: -1, teamRelation: 0 },
      },
      {
        text: "Certains coéquipiers n'étaient pas au niveau ce soir. Il faut le dire.",
        tone: 'controversial',
        impacts: { popularity: -3, reputation: -2, coachRelation: -1, teamRelation: -5 },
      },
    ],
  }];
}

export function PostMatch() {
  const { goToScreen } = useNavigation();
  const gameState = useGameStore((s) => s.gameState);
  const updatePopularity = useGameStore((s) => s.updatePopularity);
  const updateReputation = useGameStore((s) => s.updateReputation);
  const updateCoachRelation = useGameStore((s) => s.updateCoachRelation);
  const updateTeamRelation = useGameStore((s) => s.updateTeamRelation);

  const [showInterview, setShowInterview] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);

  if (!gameState) return null;

  const { player, career } = gameState;

  // Get the latest match result with player performance
  // Use lastMatchSummary if available (from played or simulated match)
  const lastMatchSummary = useGameStore((s) => s.ui.lastMatchSummary);

  // Determine score and performance from summary or fallback to league results
  let homeGoals: number;
  let awayGoals: number;
  let isPlayerHome: boolean;
  let performance: { rating: number; goals: number; assists: number; minutesPlayed: number; shots: number; passAccuracy: number; dribbles: number; tackles: number };
  let homeTeamName: string;
  let awayTeamName: string;

  if (lastMatchSummary) {
    homeGoals = lastMatchSummary.homeGoals;
    awayGoals = lastMatchSummary.awayGoals;
    isPlayerHome = lastMatchSummary.isPlayerHome;
    homeTeamName = lastMatchSummary.homeTeamName;
    awayTeamName = lastMatchSummary.awayTeamName;
    performance = {
      rating: lastMatchSummary.playerRating,
      goals: lastMatchSummary.playerGoals,
      assists: lastMatchSummary.playerAssists,
      minutesPlayed: lastMatchSummary.minutesPlayed,
      shots: lastMatchSummary.playerShots,
      passAccuracy: lastMatchSummary.playerPassAccuracy,
      dribbles: lastMatchSummary.playerDribbles,
      tackles: lastMatchSummary.playerTackles,
    };
  } else {
    // Fallback: read from league results
    const playerLeague = gameState.leagues.find(
      (l) => l.division.country === career.currentClub.country
    );
    const latestResult = playerLeague?.results
      .filter((r) => r.playerPerformance)
      .sort((a, b) => b.matchday - a.matchday)[0];

    performance = latestResult?.playerPerformance ?? {
      rating: 6.5, goals: 0, assists: 0, minutesPlayed: 90,
      shots: 2, passAccuracy: 75, dribbles: 3, tackles: 1,
    };
    homeGoals = latestResult?.homeGoals ?? 0;
    awayGoals = latestResult?.awayGoals ?? 0;
    isPlayerHome = latestResult ? latestResult.homeTeamId === career.currentClub.id : true;
    homeTeamName = isPlayerHome ? career.currentClub.name : 'Adversaire';
    awayTeamName = isPlayerHome ? 'Adversaire' : career.currentClub.name;
  }

  const playerTeamGoals = isPlayerHome ? homeGoals : awayGoals;
  const opponentGoals = isPlayerHome ? awayGoals : homeGoals;
  const won = playerTeamGoals > opponentGoals;
  const draw = playerTeamGoals === opponentGoals;

  // Result label
  const resultLabel = won ? 'Victoire' : draw ? 'Match nul' : 'Défaite';
  const resultColor = won ? 'text-secondary' : draw ? 'text-accent' : 'text-danger';

  // Generate interview questions
  const interviewQuestions = generatePostMatchQuestions(won, draw, performance.goals, performance.rating);

  /** Handle interview answer selection */
  function handleInterviewAnswer(answer: InterviewAnswer) {
    // Apply social impacts via store actions
    updatePopularity(answer.impacts.popularity);
    updateReputation(answer.impacts.reputation);
    updateCoachRelation(answer.impacts.coachRelation);
    updateTeamRelation(answer.impacts.teamRelation);

    setInterviewCompleted(true);
    setShowInterview(false);
  }

  /** Handle returning to main screen */
  function handleContinue() {
    goToScreen('main');
  }

  // ─── Interview View ────────────────────────────────────────────────────────
  if (showInterview && interviewQuestions.length > 0) {
    const question = interviewQuestions[0];

    const toneColors: Record<string, string> = {
      humble: 'border-secondary',
      confident: 'border-primary-light',
      controversial: 'border-danger',
    };

    const toneLabels: Record<string, string> = {
      humble: '🙏 Humble',
      confident: '💪 Confiant',
      controversial: '🔥 Controversé',
    };

    return (
      <div className="min-h-dvh flex flex-col bg-background p-4">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text">🎤 Interview post-match</h1>
          <button
            onClick={() => {
              setShowInterview(false);
              setInterviewCompleted(true);
            }}
            className="text-primary-light text-sm"
          >
            Passer
          </button>
        </header>

        <div className="bg-surface rounded-xl p-4 mb-6">
          <p className="text-xs text-text-muted mb-2">Question du journaliste</p>
          <p className="text-text text-lg font-medium">"{question.text}"</p>
        </div>

        <div className="space-y-3">
          {question.answers.map((answer, idx) => (
            <button
              key={idx}
              onClick={() => handleInterviewAnswer(answer)}
              className={`w-full p-4 rounded-xl text-left border-2 ${toneColors[answer.tone]}
                         bg-surface hover:bg-surface-light active:scale-[0.98] transition-all`}
            >
              <p className="text-xs text-text-muted mb-1">{toneLabels[answer.tone]}</p>
              <p className="text-text text-sm">"{answer.text}"</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Main Post-Match Summary View ──────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col bg-background p-4">
      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-text">📋 Résumé du match</h1>
        <p className={`text-lg font-semibold mt-2 ${resultColor}`}>{resultLabel}</p>
      </header>

      {/* Score */}
      <div className="bg-surface rounded-xl p-6 mb-4 text-center">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-sm text-text-muted mb-1">
              {homeTeamName}
            </p>
            <p className="text-4xl font-bold text-text">{homeGoals}</p>
          </div>
          <p className="text-2xl text-text-muted">-</p>
          <div className="text-center">
            <p className="text-sm text-text-muted mb-1">
              {awayTeamName}
            </p>
            <p className="text-4xl font-bold text-text">{awayGoals}</p>
          </div>
        </div>
      </div>

      {/* Player Performance Summary (Req 9.1) */}
      <div className="bg-surface rounded-xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-text mb-3">Votre performance</h2>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-light">
              {performance.rating.toFixed(1)}
            </p>
            <p className="text-xs text-text-muted">Note</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text">{performance.goals}</p>
            <p className="text-xs text-text-muted">Buts</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text">{performance.assists}</p>
            <p className="text-xs text-text-muted">Passes D.</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text">{performance.minutesPlayed}'</p>
            <p className="text-xs text-text-muted">Minutes</p>
          </div>
        </div>
      </div>

      {/* Detailed Stats (Req 9.2) */}
      <div className="bg-surface rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-text mb-3">Statistiques détaillées</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatRow label="Tirs" value={performance.shots} />
          <StatRow label="Dribbles" value={performance.dribbles} />
          <StatRow label="Tacles" value={performance.tackles} />
          <StatRow label="Précision passes" value={`${performance.passAccuracy}%`} />
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Interview option (Req 9.3) */}
        {!interviewCompleted && (
          <button
            onClick={() => setShowInterview(true)}
            className="w-full py-4 px-8 bg-surface-light text-text font-semibold rounded-xl
                       hover:bg-surface active:scale-95 transition-all border border-surface-light"
          >
            🎤 Interview post-match
          </button>
        )}

        {/* Continue button (Req 9.5) */}
        <button
          onClick={handleContinue}
          className="w-full py-4 px-8 bg-primary text-white font-semibold rounded-xl
                     hover:bg-primary-light active:scale-95 transition-all"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

/** Simple stat row component for detailed stats display */
function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-semibold text-text">{value}</span>
    </div>
  );
}
