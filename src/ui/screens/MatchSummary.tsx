/**
 * MatchSummary - Résumé post-match avec résultat et performances.
 */

import { useNavigation } from '../hooks/useNavigation';

export function MatchSummary() {
  const navigate = useNavigation((s) => s.navigate);

  return (
    <div className="min-h-dvh flex flex-col bg-background p-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">📋 Résumé du match</h1>
        <button onClick={() => navigate('dashboard')} className="text-primary-light">← Retour</button>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">⚽</p>
          <p className="text-text-muted">Le résumé sera affiché après un match</p>
        </div>
      </div>

      <button
        onClick={() => navigate('dashboard')}
        className="w-full py-4 bg-primary text-white font-semibold rounded-xl
                   hover:bg-primary-light active:scale-95 transition-all"
      >
        Continuer
      </button>
    </div>
  );
}
