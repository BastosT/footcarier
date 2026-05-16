/**
 * PlayerHub — Écran principal de l'onglet Joueur.
 * Contient des sous-onglets : Transferts et Stats.
 */

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Transfers } from './Transfers';
import type { PlayerSeasonStats } from '../../core/types';

type PlayerTab = 'transfers' | 'stats';

export function PlayerHub() {
  const [activeTab, setActiveTab] = useState<PlayerTab>('stats');
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) return null;

  const stats = gameState.playerCareerStats;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Sub-tabs */}
      <div className="flex bg-surface border-b border-surface-light">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'stats'
              ? 'text-primary-light border-b-2 border-primary-light'
              : 'text-text-muted'
          }`}
        >
          📊 Stats
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'transfers'
              ? 'text-primary-light border-b-2 border-primary-light'
              : 'text-text-muted'
          }`}
        >
          💰 Transferts
        </button>
      </div>

      {/* Content */}
      {activeTab === 'stats' ? (
        <StatsView
          season={stats?.season}
          allTime={stats?.allTime}
          player={gameState.player}
        />
      ) : (
        <Transfers />
      )}
    </div>
  );
}

// ─── Stats View ──────────────────────────────────────────────────────────────

interface StatsViewProps {
  season?: PlayerSeasonStats;
  allTime?: PlayerSeasonStats;
  player: { firstName: string; lastName: string; position: string; overallRating: number };
}

function StatsView({ season, allTime, player }: StatsViewProps) {
  const [view, setView] = useState<'season' | 'career'>('season');
  const gameState = useGameStore((s) => s.gameState);

  const stats = view === 'season' ? season : allTime;
  const empty = !stats || stats.matchesPlayed === 0;
  const currentSeason = gameState?.career.season ?? 1;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
      {/* Player header */}
      <div className="bg-surface rounded-xl p-4 mb-4 text-center">
        <p className="text-lg font-bold text-text">{player.firstName} {player.lastName}</p>
        <p className="text-sm text-text-muted">{player.position} • OVR {player.overallRating}</p>
      </div>

      {/* Toggle season / career */}
      <div className="flex bg-surface rounded-lg p-1 mb-4">
        <button
          onClick={() => setView('season')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
            view === 'season' ? 'bg-surface-light text-text' : 'text-text-muted'
          }`}
        >
          Saison
        </button>
        <button
          onClick={() => setView('career')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
            view === 'career' ? 'bg-surface-light text-text' : 'text-text-muted'
          }`}
        >
          Carrière
        </button>
      </div>

      {empty ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-text-muted">Aucune statistique pour le moment</p>
        </div>
      ) : (
        <>
          {/* Season/Career info */}
          {view === 'career' && (
            <div className="bg-surface rounded-xl p-3 mb-4 text-center">
              <p className="text-xs text-text-muted">Nombre de saisons</p>
              <p className="text-2xl font-bold text-primary-light">{currentSeason}</p>
            </div>
          )}

          {/* Main stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatCard label="Matchs" value={stats!.matchesPlayed} emoji="⚽" />
            <StatCard label="Buts" value={stats!.goals} emoji="🥅" />
            <StatCard label="Passes D." value={stats!.assists} emoji="🎯" />
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard label="Note moy." value={stats!.avgRating.toFixed(1)} emoji="⭐" />
            <StatCard label="Tirs" value={stats!.shots} emoji="💥" />
            <StatCard label="Dribbles" value={stats!.dribbles} emoji="🏃" />
            <StatCard label="Tacles" value={stats!.tackles} emoji="🛡️" />
          </div>

          {/* Ratios */}
          {stats!.matchesPlayed > 0 && (
            <div className="bg-surface rounded-xl p-4">
              <h3 className="text-sm font-bold text-text mb-3">Ratios</h3>
              <div className="space-y-2">
                <RatioRow
                  label="Buts / match"
                  value={(stats!.goals / stats!.matchesPlayed).toFixed(2)}
                />
                <RatioRow
                  label="Passes D. / match"
                  value={(stats!.assists / stats!.matchesPlayed).toFixed(2)}
                />
                <RatioRow
                  label="Contributions / match"
                  value={((stats!.goals + stats!.assists) / stats!.matchesPlayed).toFixed(2)}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: string | number; emoji: string }) {
  return (
    <div className="bg-surface rounded-xl p-3 text-center">
      <p className="text-lg mb-1">{emoji}</p>
      <p className="text-xl font-bold text-text">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}

function RatioRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-bold text-primary-light">{value}</span>
    </div>
  );
}
