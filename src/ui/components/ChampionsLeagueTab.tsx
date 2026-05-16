/**
 * ChampionsLeagueTab — Onglet Ligue des Champions dans la section Club.
 *
 * Affiche trois sous-onglets :
 * - Classement : classement de la phase de ligue (50 équipes)
 * - Calendrier : matchs CL du club du joueur
 * - Bracket : tableau des tours éliminatoires
 *
 * Tous les textes sont en français (Requirement 7.6).
 * L'onglet n'est affiché que si le joueur participe (Requirement 7.1).
 */

import { useState } from 'react';
import type {
  ChampionsLeagueState,
  CLStanding,
  CLScheduledMatch,
  CLMatchResult,
  CLKnockoutTie,
  KnockoutRound,
} from '../../systems/championsLeague/types';

// ─── Props ───────────────────────────────────────────────────────────────────

export interface ChampionsLeagueTabProps {
  state: ChampionsLeagueState;
  playerClubId: string;
}

// ─── Internal Tab Types ──────────────────────────────────────────────────────

type CLSubTab = 'standings' | 'calendar' | 'bracket';

// ─── Main Component ──────────────────────────────────────────────────────────

export function ChampionsLeagueTab({ state, playerClubId }: ChampionsLeagueTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<CLSubTab>('standings');

  // Requirement 7.1: Only show if player participates
  if (!state.playerParticipating) {
    return null;
  }

  // Resolve the CL participant ID from the actual club ID
  // The schedule uses CLParticipant.id (e.g. "cl-qualified-france-1") not the club ID (e.g. "psg")
  const playerParticipant = state.participants.find((p) => p.clubId === playerClubId);
  const playerParticipantId = playerParticipant?.id ?? playerClubId;

  const subTabs: { id: CLSubTab; label: string }[] = [
    { id: 'standings', label: 'Classement' },
    { id: 'calendar', label: 'Calendrier' },
    { id: 'bracket', label: 'Bracket' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-text">Ligue des Champions</h2>

      {/* Sub-tab navigation */}
      <div className="flex gap-1 bg-surface rounded-lg p-1" role="tablist" aria-label="Onglets Ligue des Champions">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeSubTab === tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeSubTab === tab.id
                ? 'bg-primary text-text'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div className="bg-surface rounded-lg p-3">
        {activeSubTab === 'standings' && (
          <CLStandingsTable standings={state.standings} playerClubId={playerParticipantId} />
        )}
        {activeSubTab === 'calendar' && (
          <CLCalendar
            schedule={state.leagueSchedule}
            results={state.leagueResults}
            playerClubId={playerParticipantId}
            participants={state.participants}
            knockoutBracket={state.knockoutBracket}
          />
        )}
        {activeSubTab === 'bracket' && (
          <CLBracket knockoutBracket={state.knockoutBracket} playerClubId={playerParticipantId} />
        )}
      </div>
    </div>
  );
}


// ─── CLStandingsTable ────────────────────────────────────────────────────────

interface CLStandingsTableProps {
  standings: CLStanding[];
  playerClubId: string;
}

/**
 * Classement de la phase de ligue (50 équipes).
 * Requirement 7.2: position, points, V, N, D, BP, BC
 * Requirement 7.3: vert (1-16 qualifiés), rouge (17-50 éliminés)
 */
export function CLStandingsTable({ standings, playerClubId }: CLStandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-text-muted text-sm">Classement non disponible</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="table" aria-label="Classement Ligue des Champions">
        <thead>
          <tr className="text-text-muted border-b border-surface-light">
            <th className="py-2 text-left w-8">#</th>
            <th className="py-2 text-left">Équipe</th>
            <th className="py-2 text-center w-8">J</th>
            <th className="py-2 text-center w-8">V</th>
            <th className="py-2 text-center w-8">N</th>
            <th className="py-2 text-center w-8">D</th>
            <th className="py-2 text-center w-10">BP</th>
            <th className="py-2 text-center w-10">BC</th>
            <th className="py-2 text-center w-10 font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team) => {
            const isPlayerClub = team.participantId === playerClubId;
            const positionClass = getPositionClass(team.position);

            return (
              <tr
                key={team.participantId}
                className={`border-b border-surface-light/50 ${
                  isPlayerClub ? 'bg-primary/15 font-semibold' : ''
                }`}
              >
                <td className="py-2">
                  <span className={`font-bold ${positionClass}`}>
                    {team.position}
                  </span>
                </td>
                <td className={`py-2 ${isPlayerClub ? 'text-primary-light' : 'text-text'}`}>
                  {team.participantName}
                </td>
                <td className="py-2 text-center text-text-muted">{team.played}</td>
                <td className="py-2 text-center text-text-muted">{team.won}</td>
                <td className="py-2 text-center text-text-muted">{team.drawn}</td>
                <td className="py-2 text-center text-text-muted">{team.lost}</td>
                <td className="py-2 text-center text-text-muted">{team.goalsFor}</td>
                <td className="py-2 text-center text-text-muted">{team.goalsAgainst}</td>
                <td className="py-2 text-center font-bold text-text">{team.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Returns the CSS class for position highlighting.
 * Requirement 7.3: green for 1-16 (qualified), red for 17-50 (eliminated).
 */
function getPositionClass(position: number): string {
  if (position <= 16) {
    return 'text-green-400';
  }
  return 'text-red-400';
}

// ─── CLCalendar ──────────────────────────────────────────────────────────────

interface CLCalendarProps {
  schedule: CLScheduledMatch[];
  results: CLMatchResult[];
  playerClubId: string;
  participants: ChampionsLeagueState['participants'];
  knockoutBracket: ChampionsLeagueState['knockoutBracket'];
}

/**
 * Calendrier des matchs CL du club du joueur.
 * Requirement 7.4: dates, adversaires, résultats.
 */
export function CLCalendar({ schedule, results, playerClubId, participants, knockoutBracket }: CLCalendarProps) {
  // Filter matches involving the player's club
  const playerMatches = schedule.filter(
    (m) => m.homeTeamId === playerClubId || m.awayTeamId === playerClubId
  );

  // Also include knockout matches from the bracket
  const knockoutMatches = getPlayerKnockoutMatches(knockoutBracket, playerClubId);

  if (playerMatches.length === 0 && knockoutMatches.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-text-muted text-sm">Aucun match programmé</p>
      </div>
    );
  }

  const getTeamName = (teamId: string): string => {
    const participant = participants.find((p) => p.id === teamId);
    return participant?.name ?? teamId;
  };

  const findResult = (match: CLScheduledMatch): CLMatchResult | undefined => {
    return results.find(
      (r) =>
        r.homeTeamId === match.homeTeamId &&
        r.awayTeamId === match.awayTeamId &&
        r.matchday === match.matchday
    );
  };

  const formatDate = (date: { day: number; month: number; year: number }): string => {
    const d = String(date.day).padStart(2, '0');
    const m = String(date.month).padStart(2, '0');
    return `${d}/${m}/${date.year}`;
  };

  const getPhaseLabel = (phase: string, leg?: 1 | 2): string => {
    switch (phase) {
      case 'league': return 'Phase de ligue';
      case 'round-of-16': return `8èmes${leg ? ` (${leg === 1 ? 'Aller' : 'Retour'})` : ''}`;
      case 'quarter-final': return `Quarts${leg ? ` (${leg === 1 ? 'Aller' : 'Retour'})` : ''}`;
      case 'semi-final': return `Demies${leg ? ` (${leg === 1 ? 'Aller' : 'Retour'})` : ''}`;
      case 'final': return 'Finale';
      default: return phase;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {playerMatches.map((match, idx) => {
        const isHome = match.homeTeamId === playerClubId;
        const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
        const opponentName = getTeamName(opponentId);
        const result = findResult(match);
        const venue = isHome ? 'Dom.' : 'Ext.';

        return (
          <div
            key={`league-${idx}`}
            className="flex items-center justify-between py-2 px-3 rounded-md bg-surface-light/30 border-b border-surface-light/50"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-text-muted">
                {formatDate(match.date)} — {getPhaseLabel(match.phase, match.leg)}
              </span>
              <span className="text-sm text-text">
                {opponentName} <span className="text-text-muted">({venue})</span>
              </span>
            </div>
            <div className="text-right">
              {result ? (
                <span className="text-sm font-bold text-text">
                  {result.homeGoals} - {result.awayGoals}
                </span>
              ) : (
                <span className="text-xs text-text-muted">À jouer</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Knockout matches from bracket */}
      {knockoutMatches.map((km, idx) => (
        <div
          key={`knockout-${idx}`}
          className="flex items-center justify-between py-2 px-3 rounded-md bg-surface-light/30 border-b border-surface-light/50"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-text-muted">{km.phaseLabel}</span>
            <span className="text-sm text-text">
              {km.opponentName} <span className="text-text-muted">({km.venue})</span>
            </span>
          </div>
          <div className="text-right">
            {km.score ? (
              <span className="text-sm font-bold text-text">{km.score}</span>
            ) : (
              <span className="text-xs text-text-muted">À jouer</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface KnockoutMatchDisplay {
  phaseLabel: string;
  opponentName: string;
  venue: string;
  score: string | null;
}

function getPlayerKnockoutMatches(
  bracket: ChampionsLeagueState['knockoutBracket'],
  playerClubId: string
): KnockoutMatchDisplay[] {
  const matches: KnockoutMatchDisplay[] = [];

  const rounds: { ties: CLKnockoutTie[]; round: KnockoutRound }[] = [
    { ties: bracket.roundOf16, round: 'round-of-16' },
    { ties: bracket.quarterFinals, round: 'quarter-final' },
    { ties: bracket.semiFinals, round: 'semi-final' },
    ...(bracket.final ? [{ ties: [bracket.final], round: 'final' as KnockoutRound }] : []),
  ];

  const roundLabels: Record<KnockoutRound, string> = {
    'round-of-16': '8èmes de finale',
    'quarter-final': 'Quarts de finale',
    'semi-final': 'Demi-finales',
    'final': 'Finale',
  };

  for (const { ties, round } of rounds) {
    for (const tie of ties) {
      const isHome = tie.homeTeam.id === playerClubId || tie.homeTeam.clubId === playerClubId;
      const isAway = tie.awayTeam.id === playerClubId || tie.awayTeam.clubId === playerClubId;

      if (!isHome && !isAway) continue;

      const opponent = isHome ? tie.awayTeam : tie.homeTeam;

      if (round === 'final') {
        // Final is a single match
        const score = tie.firstLeg
          ? `${tie.firstLeg.homeGoals} - ${tie.firstLeg.awayGoals}`
          : null;
        matches.push({
          phaseLabel: roundLabels[round],
          opponentName: opponent.name,
          venue: 'Neutre',
          score,
        });
      } else {
        // Two-legged tie: aller + retour
        if (tie.firstLeg) {
          matches.push({
            phaseLabel: `${roundLabels[round]} (Aller)`,
            opponentName: opponent.name,
            venue: isHome ? 'Dom.' : 'Ext.',
            score: `${tie.firstLeg.homeGoals} - ${tie.firstLeg.awayGoals}`,
          });
        } else {
          matches.push({
            phaseLabel: `${roundLabels[round]} (Aller)`,
            opponentName: opponent.name,
            venue: isHome ? 'Dom.' : 'Ext.',
            score: null,
          });
        }

        if (tie.secondLeg) {
          matches.push({
            phaseLabel: `${roundLabels[round]} (Retour)`,
            opponentName: opponent.name,
            venue: isHome ? 'Ext.' : 'Dom.',
            score: `${tie.secondLeg.homeGoals} - ${tie.secondLeg.awayGoals}`,
          });
        } else {
          matches.push({
            phaseLabel: `${roundLabels[round]} (Retour)`,
            opponentName: opponent.name,
            venue: isHome ? 'Ext.' : 'Dom.',
            score: null,
          });
        }
      }
    }
  }

  return matches;
}

// ─── CLBracket ───────────────────────────────────────────────────────────────

interface CLBracketProps {
  knockoutBracket: ChampionsLeagueState['knockoutBracket'];
  playerClubId: string;
}

/**
 * Tableau des confrontations éliminatoires.
 * Requirement 7.5: bracket avec résultats aller-retour.
 */
export function CLBracket({ knockoutBracket, playerClubId }: CLBracketProps) {
  const { roundOf16, quarterFinals, semiFinals, final: finalTie } = knockoutBracket;

  const hasKnockoutData =
    roundOf16.length > 0 || quarterFinals.length > 0 || semiFinals.length > 0 || finalTie !== null;

  if (!hasKnockoutData) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-text-muted text-sm">
          Les tours éliminatoires n&apos;ont pas encore commencé
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {roundOf16.length > 0 && (
        <BracketRound
          title="Huitièmes de finale"
          ties={roundOf16}
          playerClubId={playerClubId}
          isFinal={false}
        />
      )}
      {quarterFinals.length > 0 && (
        <BracketRound
          title="Quarts de finale"
          ties={quarterFinals}
          playerClubId={playerClubId}
          isFinal={false}
        />
      )}
      {semiFinals.length > 0 && (
        <BracketRound
          title="Demi-finales"
          ties={semiFinals}
          playerClubId={playerClubId}
          isFinal={false}
        />
      )}
      {finalTie && (
        <BracketRound
          title="Finale"
          ties={[finalTie]}
          playerClubId={playerClubId}
          isFinal={true}
        />
      )}
    </div>
  );
}

// ─── BracketRound ────────────────────────────────────────────────────────────

interface BracketRoundProps {
  title: string;
  ties: CLKnockoutTie[];
  playerClubId: string;
  isFinal: boolean;
}

function BracketRound({ title, ties, playerClubId, isFinal }: BracketRoundProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">{title}</h3>
      <div className="flex flex-col gap-2">
        {ties.map((tie, idx) => (
          <BracketTie key={idx} tie={tie} playerClubId={playerClubId} isFinal={isFinal} />
        ))}
      </div>
    </div>
  );
}

// ─── BracketTie ──────────────────────────────────────────────────────────────

interface BracketTieProps {
  tie: CLKnockoutTie;
  playerClubId: string;
  isFinal: boolean;
}

function BracketTie({ tie, playerClubId, isFinal }: BracketTieProps) {
  const isPlayerHome = tie.homeTeam.id === playerClubId || tie.homeTeam.clubId === playerClubId;
  const isPlayerAway = tie.awayTeam.id === playerClubId || tie.awayTeam.clubId === playerClubId;
  const isPlayerInvolved = isPlayerHome || isPlayerAway;

  const firstLegScore = tie.firstLeg
    ? `${tie.firstLeg.homeGoals} - ${tie.firstLeg.awayGoals}`
    : '— – —';

  const secondLegScore = tie.secondLeg
    ? `${tie.secondLeg.homeGoals} - ${tie.secondLeg.awayGoals}`
    : '— – —';

  // Compute aggregate for display
  let aggregate = '';
  if (tie.firstLeg && tie.secondLeg) {
    const homeAgg = tie.firstLeg.homeGoals + tie.secondLeg.awayGoals;
    const awayAgg = tie.firstLeg.awayGoals + tie.secondLeg.homeGoals;
    aggregate = `(${homeAgg} - ${awayAgg} agg.)`;
  } else if (isFinal && tie.firstLeg) {
    // Final is single match, no aggregate needed
    aggregate = '';
  }

  return (
    <div
      className={`rounded-md p-3 border ${
        isPlayerInvolved
          ? 'border-primary/50 bg-primary/10'
          : 'border-surface-light bg-surface-light/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1 flex-1">
          <span className={`text-sm ${isPlayerHome ? 'text-primary-light font-semibold' : 'text-text'}`}>
            {tie.homeTeam.name}
          </span>
          <span className={`text-sm ${isPlayerAway ? 'text-primary-light font-semibold' : 'text-text'}`}>
            {tie.awayTeam.name}
          </span>
        </div>

        <div className="flex flex-col gap-1 items-end text-right">
          {isFinal ? (
            <span className="text-sm font-bold text-text">{firstLegScore}</span>
          ) : (
            <>
              <span className="text-xs text-text-muted">
                Aller: <span className="text-text font-medium">{firstLegScore}</span>
              </span>
              <span className="text-xs text-text-muted">
                Retour: <span className="text-text font-medium">{secondLegScore}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Aggregate and winner */}
      {tie.winner && (
        <div className="mt-2 pt-2 border-t border-surface-light/50 flex items-center justify-between">
          {aggregate && (
            <span className="text-xs text-text-muted">{aggregate}</span>
          )}
          <span className="text-xs font-semibold text-secondary-light">
            Qualifié : {tie.winner === tie.homeTeam.id ? tie.homeTeam.name : tie.awayTeam.name}
          </span>
        </div>
      )}
    </div>
  );
}
