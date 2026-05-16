/**
 * SocialFeed - Réseau social fictif.
 */

import { useNavigation } from '../hooks/useNavigation';
import { useGameStore } from '../../store/gameStore';

export function SocialFeed() {
  const navigate = useNavigation((s) => s.navigate);
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) return null;
  const { social } = gameState;

  return (
    <div className="min-h-dvh flex flex-col bg-background p-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">📱 Social</h1>
        <button onClick={() => navigate('dashboard')} className="text-primary-light">← Retour</button>
      </header>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-surface rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-accent">{social.popularity}</p>
          <p className="text-xs text-text-muted">Popularité</p>
        </div>
        <div className="bg-surface rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-primary-light">{social.reputation}</p>
          <p className="text-xs text-text-muted">Réputation</p>
        </div>
        <div className="bg-surface rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-secondary-light">{social.coachRelation}</p>
          <p className="text-xs text-text-muted">Relation Coach</p>
        </div>
        <div className="bg-surface rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-secondary-light">{social.teamRelation}</p>
          <p className="text-xs text-text-muted">Relation Équipe</p>
        </div>
      </div>

      {/* Feed */}
      <h2 className="text-sm text-text-muted mb-3">Fil d'actualité</h2>
      {social.socialFeed.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-muted">Aucune publication pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto">
          {social.socialFeed.map((post) => (
            <div key={post.id} className="bg-surface rounded-xl p-4">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-text">{post.author}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  post.sentiment === 'positive' ? 'bg-secondary/20 text-secondary-light' :
                  post.sentiment === 'negative' ? 'bg-danger/20 text-danger' :
                  'bg-surface-light text-text-muted'
                }`}>
                  {post.sentiment === 'positive' ? '👍' : post.sentiment === 'negative' ? '👎' : '😐'}
                </span>
              </div>
              <p className="text-text-muted text-sm mt-1">{post.content}</p>
              <p className="text-xs text-text-muted mt-2">❤️ {post.likes}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
