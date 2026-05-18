/**
 * PlayerHub — Écran principal de l'onglet Joueur.
 * Contient des sous-onglets : Transferts et Stats.
 */

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Transfers } from './Transfers';
import type { PlayerSeasonStats } from '../../core/types';

type PlayerTab = 'transfers' | 'stats' | 'agent';

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
        <button
          onClick={() => setActiveTab('agent')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'agent'
              ? 'text-primary-light border-b-2 border-primary-light'
              : 'text-text-muted'
          }`}
        >
          🕴️ Agent
        </button>
      </div>

      {/* Content */}
      {activeTab === 'stats' ? (
        <StatsView
          season={stats?.season}
          allTime={stats?.allTime}
          player={gameState.player}
        />
      ) : activeTab === 'transfers' ? (
        <Transfers />
      ) : (
        <AgentView />
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

// ─── Agent View ──────────────────────────────────────────────────────────────

import { ALL_AGENTS } from '../../systems/career/AgentSystem';
import type { AgentProfile } from '../../core/types';

function AgentView() {
  const gameState = useGameStore((s) => s.gameState);
  const [message, setMessage] = useState<string | null>(null);

  if (!gameState) return null;

  const currentAgent = gameState.agent?.currentAgent ?? ALL_AGENTS[0];
  const interestedClubs = gameState.agent?.interestedClubs ?? [];
  const { player } = gameState;

  // Available agents based on player level
  const availableAgents = ALL_AGENTS.filter((agent) => {
    switch (agent.tier) {
      case 'family': return true;
      case 'local': return player.overallRating >= 55 || gameState.social.popularity >= 20;
      case 'national': return player.overallRating >= 70 || gameState.social.popularity >= 40;
      case 'elite': return player.overallRating >= 80 || gameState.social.popularity >= 60;
    }
  });

  const handleChangeAgent = (agent: AgentProfile) => {
    if (agent.id === currentAgent.id) return;

    const state = useGameStore.getState();
    if (!state.gameState) return;

    useGameStore.setState({
      gameState: {
        ...state.gameState,
        agent: {
          currentAgent: agent,
          interestedClubs: [], // reset clubs when changing agent
        },
      },
    });

    setMessage(`✅ ${agent.name} est maintenant ton agent ! (${agent.commission}% commission)`);
    setTimeout(() => setMessage(null), 4000);
  };

  const tierColors: Record<string, string> = {
    family: 'border-green-500/30 bg-green-500/5',
    local: 'border-blue-500/30 bg-blue-500/5',
    national: 'border-purple-500/30 bg-purple-500/5',
    elite: 'border-yellow-500/30 bg-yellow-500/5',
  };

  const tierLabels: Record<string, string> = {
    family: '👨‍👦 Famille',
    local: '🏠 Local',
    national: '🌍 National',
    elite: '👑 Élite',
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
      {message && (
        <div className="bg-surface rounded-xl p-3 mb-4 text-center text-sm text-text font-medium">
          {message}
        </div>
      )}

      {/* Current agent */}
      <div className="bg-gradient-to-r from-primary/10 to-surface rounded-xl p-4 mb-4 border border-primary/30">
        <p className="text-xs text-text-muted mb-1">Mon agent actuel</p>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentAgent.emoji}</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-text">{currentAgent.name}</p>
            <p className="text-xs text-text-muted">{currentAgent.description}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-text-muted">Commission : <span className="text-primary-light font-bold">{currentAgent.commission}%</span></span>
              <span className="text-xs text-text-muted">Réseau : {Array(currentAgent.networkLevel).fill('⭐').join('')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interested clubs */}
      <div className="bg-surface rounded-xl p-4 mb-4 border border-surface-light/50">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">Clubs intéressés</h3>
        {interestedClubs.length > 0 ? (
          <div className="space-y-1">
            {interestedClubs.map((club, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1">
                <span className="text-xs">⚽</span>
                <span className="text-sm text-text">{club}</span>
              </div>
            ))}
            <p className="text-[10px] text-text-muted mt-2">Mis à jour chaque mois par ton agent</p>
          </div>
        ) : (
          <p className="text-xs text-text-muted">Aucun club intéressé pour le moment. Ton agent cherche...</p>
        )}
      </div>

      {/* Change agent */}
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">Changer d'agent</h3>
      <div className="space-y-2">
        {availableAgents.map((agent) => {
          const isCurrent = agent.id === currentAgent.id;
          return (
            <div
              key={agent.id}
              className={`rounded-xl p-3 border ${isCurrent ? 'border-primary/50 bg-primary/10' : tierColors[agent.tier]}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{agent.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text">{agent.name}</p>
                    {isCurrent && <span className="text-[10px] bg-primary/20 text-primary-light px-1.5 py-0.5 rounded">Actuel</span>}
                  </div>
                  <p className="text-xs text-text-muted">{agent.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-text-muted">💰 {agent.commission}%</span>
                    <span className="text-[10px] text-text-muted">📈 ×{agent.offerBonus}</span>
                    <span className="text-[10px] text-text-muted">🌐 {Array(agent.networkLevel).fill('⭐').join('')}</span>
                  </div>
                </div>
                {!isCurrent && (
                  <button
                    onClick={() => handleChangeAgent(agent)}
                    className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg active:scale-95"
                  >
                    Choisir
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Locked agents */}
      {ALL_AGENTS.filter((a) => !availableAgents.includes(a)).length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2">🔒 Agents verrouillés</h3>
          <div className="space-y-1.5">
            {ALL_AGENTS.filter((a) => !availableAgents.includes(a)).map((agent) => (
              <div key={agent.id} className="rounded-lg p-2.5 bg-surface/50 border border-surface-light/30 opacity-60">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{agent.emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-muted">{agent.name}</p>
                    <p className="text-[10px] text-text-muted">
                      {agent.tier === 'local' ? 'OVR 55+ ou Pop 20+' :
                       agent.tier === 'national' ? 'OVR 70+ ou Pop 40+' :
                       'OVR 80+ ou Pop 60+'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
