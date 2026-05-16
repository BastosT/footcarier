/**
 * Interview - Écran d'interview avec 3 réponses par question.
 */

import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';

export function Interview() {
  const navigate = useNavigation((s) => s.navigate);
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) return null;

  const pendingInterview = gameState.social.pendingInterviews[0];

  if (!pendingInterview) {
    return (
      <div className="min-h-dvh flex flex-col bg-background p-4">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text">🎤 Interview</h1>
          <button onClick={() => navigate('dashboard')} className="text-primary-light">← Retour</button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted">Aucune interview en attente</p>
        </div>
      </div>
    );
  }

  const question = pendingInterview.questions[0];

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
        <h1 className="text-2xl font-bold text-text">🎤 Interview</h1>
        <button onClick={() => navigate('dashboard')} className="text-primary-light">← Retour</button>
      </header>

      <div className="bg-surface rounded-xl p-4 mb-6">
        <p className="text-xs text-text-muted mb-2">Question du journaliste</p>
        <p className="text-text text-lg font-medium">"{question.text}"</p>
      </div>

      <div className="space-y-3">
        {question.answers.map((answer, idx) => (
          <button
            key={idx}
            onClick={() => navigate('dashboard')}
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
