/**
 * MatchChoice - Écran de choix entre jouer ou simuler le match.
 * Affiché les jours de match pour permettre au joueur de choisir son mode.
 *
 * Requirements: 6.1
 */

import { useState } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameStore } from '../../store/gameStore';
import { updateCareerStatsFromMatch } from '../../utils/updateCareerStats';
import type { InterviewAnswer } from '../../core/types';

export function MatchChoice() {
  const { goToScreen } = useNavigation();
  const { simulateMatch } = useGameLoop();
  const gameState = useGameStore((s) => s.gameState);
  const pendingMatchConfig = useGameStore((s) => s.ui.pendingMatchConfig);
  const setPendingMatchConfig = useGameStore((s) => s.setPendingMatchConfig);
  const [showPressConf, setShowPressConf] = useState(false);
  const [pressConfDone, setPressConfDone] = useState(false);

  if (!gameState) return null;

  const nextMatch = gameState.time.schedule.nextMatch;

  // Use pendingMatchConfig for display info if nextMatch is not available
  const matchInfo = pendingMatchConfig
    ? {
        competition: pendingMatchConfig.competition,
        matchday: pendingMatchConfig.matchday,
        homeTeam: pendingMatchConfig.homeTeam.name,
        awayTeam: pendingMatchConfig.awayTeam.name,
      }
    : nextMatch
      ? {
          competition: nextMatch.competition,
          matchday: nextMatch.matchday,
          homeTeam: nextMatch.homeTeam,
          awayTeam: nextMatch.awayTeam,
        }
      : null;

  /** Handle "Simuler" — run quick sim, then navigate to post-match */
  const handleSimulate = () => {
    if (pendingMatchConfig) {
      const result = simulateMatch(pendingMatchConfig);

      // Store match summary for PostMatch
      if (result) {
        const summary = {
          homeTeamName: pendingMatchConfig.homeTeam.name,
          awayTeamName: pendingMatchConfig.awayTeam.name,
          homeGoals: result.result.homeGoals,
          awayGoals: result.result.awayGoals,
          isPlayerHome: pendingMatchConfig.homeTeam.id === gameState?.career.currentClub.id,
          playerGoals: result.performance.goals,
          playerAssists: result.performance.assists,
          playerRating: result.performance.rating,
          playerShots: result.performance.shots,
          playerDribbles: result.performance.dribbles,
          playerTackles: result.performance.tackles,
          playerPassAccuracy: result.performance.passAccuracy,
          minutesPlayed: result.performance.minutesPlayed,
        };
        useGameStore.getState().setLastMatchSummary(summary);
        updateCareerStatsFromMatch(summary);
      }

      setPendingMatchConfig(null);
    }
    goToScreen('post-match');
  };

  /** Handle "Jouer" — navigate to pre-match screen */
  const handlePlay = () => {
    // pendingMatchConfig stays available for the PreMatch/MatchPlay flow
    goToScreen('pre-match');
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background p-4 overflow-y-auto pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text text-center">⚽ Jour de match</h1>
      </header>

      {/* Press conference view */}
      {showPressConf && (
        <PreMatchPressConference
          opponentName={matchInfo?.homeTeam === gameState?.career.currentClub.name ? matchInfo?.awayTeam ?? '' : matchInfo?.homeTeam ?? ''}
          onComplete={() => { setShowPressConf(false); setPressConfDone(true); }}
        />
      )}

      {!showPressConf && (
        <>
          {/* Match info */}
          {matchInfo && (
            <div className="bg-surface rounded-xl p-6 mb-6 text-center">
              <p className="text-sm text-text-muted mb-4">
                {matchInfo.competition} — Journée {matchInfo.matchday}
              </p>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-text">{matchInfo.homeTeam}</p>
                  <p className="text-xs text-text-muted">Domicile</p>
                </div>
                <p className="text-2xl font-bold text-text-muted mx-4">VS</p>
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-text">{matchInfo.awayTeam}</p>
                  <p className="text-xs text-text-muted">Extérieur</p>
                </div>
              </div>
            </div>
          )}

          {/* Press conference button (optional) */}
          {!pressConfDone && (
            <button
              onClick={() => setShowPressConf(true)}
              className="w-full max-w-sm mx-auto mb-4 py-3 px-6 bg-surface text-text font-medium rounded-xl
                         active:scale-95 transition-all border border-surface-light/50 flex items-center justify-center gap-2"
            >
              <span>🎙️</span>
              <span className="text-sm">Conférence de presse (facultatif)</span>
            </button>
          )}
          {pressConfDone && (
            <div className="w-full max-w-sm mx-auto mb-4 py-2 px-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
              <p className="text-xs text-green-400">✅ Conférence de presse terminée</p>
            </div>
          )}

          {/* Choice buttons */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <button
              onClick={handlePlay}
              className="w-full max-w-sm py-5 px-8 bg-secondary text-white font-semibold rounded-xl
                         active:scale-95 transition-all text-lg flex flex-col items-center gap-2"
            >
              <span className="text-3xl">🎮</span>
              <span>Jouer le match</span>
            </button>

            <button
              onClick={handleSimulate}
              className="w-full max-w-sm py-5 px-8 bg-surface-light text-text font-semibold rounded-xl
                         active:scale-95 transition-all text-lg
                         border border-surface-light flex flex-col items-center gap-2"
            >
              <span className="text-3xl">⏩</span>
              <span>Simuler le match</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Pre-Match Press Conference ──────────────────────────────────────────────

const PRE_MATCH_QUESTIONS = [
  {
    text: 'Comment abordez-vous ce match ?',
    answers: [
      { text: "Avec humilité. On respecte l'adversaire et on va donner le meilleur.", tone: 'humble' as const, impacts: { popularity: 1, reputation: 2, coachRelation: 2, teamRelation: 1 } },
      { text: "On est les meilleurs, on va gagner. Point final.", tone: 'confident' as const, impacts: { popularity: 3, reputation: 0, coachRelation: -1, teamRelation: 1 } },
      { text: "L'adversaire est faible, ça va être une formalité.", tone: 'controversial' as const, impacts: { popularity: -1, reputation: -2, coachRelation: -2, teamRelation: 0 } },
    ],
  },
  {
    text: 'Quel est votre objectif personnel pour ce match ?',
    answers: [
      { text: "Aider l'équipe du mieux possible, peu importe mon rôle.", tone: 'humble' as const, impacts: { popularity: 1, reputation: 1, coachRelation: 3, teamRelation: 2 } },
      { text: "Marquer et montrer que je suis le meilleur sur le terrain.", tone: 'confident' as const, impacts: { popularity: 2, reputation: 1, coachRelation: 0, teamRelation: -1 } },
      { text: "Prouver que certains ont tort de me sous-estimer.", tone: 'controversial' as const, impacts: { popularity: 0, reputation: -1, coachRelation: -1, teamRelation: 0 } },
    ],
  },
  {
    text: 'Un message pour les supporters ?',
    answers: [
      { text: "On joue pour eux. Leur soutien nous porte, on va tout donner.", tone: 'humble' as const, impacts: { popularity: 3, reputation: 1, coachRelation: 1, teamRelation: 2 } },
      { text: "Qu'ils se préparent à un spectacle. Je suis en forme.", tone: 'confident' as const, impacts: { popularity: 2, reputation: 0, coachRelation: 0, teamRelation: 0 } },
      { text: "S'ils ne sont pas contents, qu'ils viennent jouer à ma place.", tone: 'controversial' as const, impacts: { popularity: -3, reputation: -2, coachRelation: -2, teamRelation: -2 } },
    ],
  },
];

function PreMatchPressConference({ opponentName, onComplete }: { opponentName: string; onComplete: () => void }) {
  const [questionIdx, setQuestionIdx] = useState(0);
  const updatePopularity = useGameStore((s) => s.updatePopularity);
  const updateReputation = useGameStore((s) => s.updateReputation);
  const updateCoachRelation = useGameStore((s) => s.updateCoachRelation);
  const updateTeamRelation = useGameStore((s) => s.updateTeamRelation);

  // Pick a random question based on current time
  const question = PRE_MATCH_QUESTIONS[questionIdx % PRE_MATCH_QUESTIONS.length];

  const toneColors: Record<string, string> = {
    humble: 'border-secondary/50',
    confident: 'border-primary/50',
    controversial: 'border-danger/50',
  };

  const toneLabels: Record<string, string> = {
    humble: '🙏 Humble',
    confident: '💪 Confiant',
    controversial: '🔥 Provocateur',
  };

  const handleAnswer = (answer: typeof question.answers[0]) => {
    // Apply impacts
    updatePopularity(answer.impacts.popularity);
    updateReputation(answer.impacts.reputation);
    updateCoachRelation(answer.impacts.coachRelation);
    updateTeamRelation(answer.impacts.teamRelation);

    // Track controversy
    if (answer.tone === 'controversial') {
      const state = useGameStore.getState();
      if (state.gameState) {
        useGameStore.setState({
          gameState: {
            ...state.gameState,
            social: {
              ...state.gameState.social,
              controversyCount: (state.gameState.social.controversyCount ?? 0) + 1,
            },
          },
        });
      }
    }

    onComplete();
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-surface rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🎙️</span>
          <div>
            <p className="text-sm font-bold text-text">Conférence de presse</p>
            <p className="text-xs text-text-muted">Avant le match vs {opponentName}</p>
          </div>
        </div>
        <p className="text-text font-medium">"{question.text}"</p>
      </div>

      <div className="space-y-3">
        {question.answers.map((answer, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(answer)}
            className={`w-full p-4 rounded-xl text-left border-2 ${toneColors[answer.tone]}
                       bg-surface active:scale-[0.98] transition-all`}
          >
            <p className="text-[10px] text-text-muted mb-1">{toneLabels[answer.tone]}</p>
            <p className="text-sm text-text">"{answer.text}"</p>
          </button>
        ))}
      </div>

      <button
        onClick={onComplete}
        className="mt-4 py-2 text-text-muted text-xs text-center"
      >
        Passer →
      </button>
    </div>
  );
}
