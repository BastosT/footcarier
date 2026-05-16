/**
 * ClubHub — Écran principal de l'onglet Club.
 * Contient des sous-onglets : Classement, Calendrier et Vestiaire.
 */

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Standings } from './Standings';
import { Locker } from './Locker';
import { MoraleIndicator } from '../components/MoraleIndicator';
import { ChampionsLeagueTab } from '../components/ChampionsLeagueTab';
import type { ScheduledMatch } from '../../core/types';

type ClubTab = 'standings' | 'calendar' | 'champions' | 'locker';

export function ClubHub() {
  const [activeTab, setActiveTab] = useState<ClubTab>('standings');
  const gameState = useGameStore((s) => s.gameState);
  const championsLeague = useGameStore((s) => s.championsLeague);

  if (!gameState) return null;

  const { career, social } = gameState;
  const squad = career.currentClub.squad;
  const teamMorale = social.teamMorale ?? 50;
  const coachRelation = social.coachRelation ?? 50;

  // Get player's league schedule
  const playerLeague = gameState.leagues.find(
    (l) => l.division.country === career.currentClub.country && l.division.level === 1
  );
  const schedule = playerLeague?.schedule ?? [];
  const playerClubId = career.currentClub.id;
  const currentMatchday = career.matchday;

  // Filter only player's matches
  const playerMatches = schedule.filter(
    (m) => m.homeTeam === playerClubId || m.awayTeam === playerClubId
  );

  // Check if player participates in CL
  const playerInCL = championsLeague?.playerParticipating ?? false;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Sub-tabs */}
      <div className="flex bg-surface border-b border-surface-light overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('standings')}
          className={`flex-shrink-0 flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'standings'
              ? 'text-primary-light border-b-2 border-primary-light'
              : 'text-text-muted'
          }`}
        >
          📋 Classement
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-shrink-0 flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'calendar'
              ? 'text-primary-light border-b-2 border-primary-light'
              : 'text-text-muted'
          }`}
        >
          📅 Calendrier
        </button>
        {playerInCL && (
          <button
            onClick={() => setActiveTab('champions')}
            className={`flex-shrink-0 flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'champions'
                ? 'text-primary-light border-b-2 border-primary-light'
                : 'text-text-muted'
            }`}
          >
            🏆 LDC
          </button>
        )}
        <button
          onClick={() => setActiveTab('locker')}
          className={`flex-shrink-0 flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'locker'
              ? 'text-primary-light border-b-2 border-primary-light'
              : 'text-text-muted'
          }`}
        >
          👕 Vestiaire
        </button>
      </div>

      {/* Content */}
      {activeTab === 'standings' ? (
        <Standings />
      ) : activeTab === 'calendar' ? (
        <CalendarView
          matches={playerMatches}
          playerClubId={playerClubId}
          currentMatchday={currentMatchday}
          leagues={gameState.leagues}
        />
      ) : activeTab === 'champions' && championsLeague ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
          <ChampionsLeagueTab state={championsLeague} playerClubId={playerClubId} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-20">
          {/* Coach section */}
          <div className="p-4 bg-surface m-4 rounded-xl">
            <h2 className="text-sm font-bold text-text mb-3">🧑‍💼 Entraîneur</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text font-medium">Coach {career.currentClub.name}</p>
                <p className="text-xs text-text-muted">Relation avec le coach</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${getRelationColor(coachRelation)}`}>
                  {coachRelation}/100
                </p>
                <p className="text-xs text-text-muted">{getRelationLabel(coachRelation)}</p>
              </div>
            </div>
            {/* Relation bar */}
            <div className="mt-2 h-2 bg-surface-light rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getRelationBarColor(coachRelation)}`}
                style={{ width: `${coachRelation}%` }}
              />
            </div>
          </div>

          {/* Morale section */}
          <div className="px-4 mb-4">
            <div className="bg-surface rounded-xl p-4">
              <h2 className="text-sm font-bold text-text mb-2">Moral d'équipe</h2>
              <MoraleIndicator morale={teamMorale} />
            </div>
          </div>

          {/* Squad */}
          <Locker squad={squad} teamMorale={teamMorale} />
        </div>
      )}
    </div>
  );
}

// ─── Calendar View ───────────────────────────────────────────────────────────

interface CalendarViewProps {
  matches: ScheduledMatch[];
  playerClubId: string;
  currentMatchday: number;
  leagues: { standings: { clubId: string; clubName: string }[]; results: { matchday: number; homeTeamId: string; awayTeamId: string; homeGoals: number; awayGoals: number }[] }[];
}

function CalendarView({ matches, playerClubId, currentMatchday, leagues }: CalendarViewProps) {
  // Find the first upcoming match index
  const nextMatchIdx = matches.findIndex((m) => m.matchday > currentMatchday);

  // Get results for the player's league
  const playerLeague = leagues.find((l) =>
    l.standings.some((s) => s.clubId === playerClubId)
  );
  const results = playerLeague?.results ?? [];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
      <h2 className="text-lg font-bold text-text mb-4">
        Calendrier — 34 journées
      </h2>
      <p className="text-xs text-text-muted mb-4">
        Journée actuelle : {currentMatchday} / 34
      </p>

      <div className="space-y-2">
        {matches.map((match, idx) => {
          const isHome = match.homeTeam === playerClubId;
          const opponentId = isHome ? match.awayTeam : match.homeTeam;
          const opponentName = findClubName(leagues, opponentId) ?? opponentId;
          const isPlayed = match.matchday <= currentMatchday;
          const isNext = idx === nextMatchIdx;

          // Find the score for played matches
          let score: string | null = null;
          if (isPlayed) {
            const matchResult = results.find(
              (r) => r.matchday === match.matchday &&
                ((r.homeTeamId === playerClubId && r.awayTeamId === opponentId) ||
                 (r.awayTeamId === playerClubId && r.homeTeamId === opponentId))
            );
            if (matchResult) {
              const playerGoals = matchResult.homeTeamId === playerClubId
                ? matchResult.homeGoals
                : matchResult.awayGoals;
              const opponentGoals = matchResult.homeTeamId === playerClubId
                ? matchResult.awayGoals
                : matchResult.homeGoals;
              score = `${playerGoals} - ${opponentGoals}`;
            }
          }

          return (
            <div
              key={`${match.matchday}-${match.homeTeam}`}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                isNext
                  ? 'border-primary bg-primary/10'
                  : isPlayed
                    ? 'border-surface-light bg-surface/50'
                    : 'border-surface-light bg-surface'
              }`}
            >
              {/* Matchday number */}
              <div className="w-8 text-center">
                <span className={`text-xs font-bold ${isPlayed ? 'text-text-muted' : 'text-text'}`}>
                  J{match.matchday}
                </span>
              </div>

              {/* Match info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    isHome ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {isHome ? 'DOM' : 'EXT'}
                  </span>
                  <span className={`text-sm font-medium ${isPlayed ? 'text-text-muted' : 'text-text'}`}>
                    {isHome ? 'vs' : '@'} {opponentName}
                  </span>
                </div>
              </div>

              {/* Status / Score */}
              <div className="text-right">
                {isNext && (
                  <span className="text-xs font-bold text-primary-light">PROCHAIN</span>
                )}
                {isPlayed && score && (
                  <span className={`text-sm font-bold ${getScoreColor(score, playerClubId)}`}>
                    {score}
                  </span>
                )}
                {isPlayed && !score && (
                  <span className="text-xs text-text-muted">Joué ✓</span>
                )}
                {!isPlayed && !isNext && (
                  <span className="text-xs text-text-muted">
                    {match.date.day}/{match.date.month}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {matches.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <p className="text-text-muted">Aucun match programmé</p>
        </div>
      )}
    </div>
  );
}

function getScoreColor(score: string, _playerClubId: string): string {
  const [playerGoals, opponentGoals] = score.split(' - ').map(Number);
  if (playerGoals > opponentGoals) return 'text-green-400';
  if (playerGoals < opponentGoals) return 'text-red-400';
  return 'text-yellow-400';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findClubName(
  leagues: { standings: { clubId: string; clubName: string }[] }[],
  clubId: string
): string | undefined {
  for (const league of leagues) {
    const standing = league.standings.find((s) => s.clubId === clubId);
    if (standing) return standing.clubName;
  }
  return undefined;
}

function getRelationColor(relation: number): string {
  if (relation >= 70) return 'text-green-400';
  if (relation >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function getRelationLabel(relation: number): string {
  if (relation >= 80) return 'Excellente';
  if (relation >= 60) return 'Bonne';
  if (relation >= 40) return 'Correcte';
  if (relation >= 20) return 'Tendue';
  return 'Mauvaise';
}

function getRelationBarColor(relation: number): string {
  if (relation >= 70) return 'bg-green-500';
  if (relation >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}
