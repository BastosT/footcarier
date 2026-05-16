import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChampionsLeagueTab } from './ChampionsLeagueTab';
import type { ChampionsLeagueState, CLStanding, CLKnockoutTie } from '../../systems/championsLeague/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createEmptyState(overrides: Partial<ChampionsLeagueState> = {}): ChampionsLeagueState {
  return {
    season: 1,
    participants: [],
    phase: 'league',
    currentMatchday: 1,
    leagueSchedule: [],
    leagueResults: [],
    standings: [],
    knockoutRound: null,
    knockoutBracket: {
      roundOf16: [],
      quarterFinals: [],
      semiFinals: [],
      final: null,
    },
    playerParticipating: true,
    playerEliminated: false,
    playerClubId: 'player-club',
    ...overrides,
  };
}

function createStanding(position: number, participantId: string = `team-${position}`): CLStanding {
  return {
    participantId,
    participantName: `Team ${position}`,
    country: 'france',
    played: 4,
    won: 3,
    drawn: 1,
    lost: 0,
    goalsFor: 10,
    goalsAgainst: 2,
    points: 10,
    position,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ChampionsLeagueTab', () => {
  describe('Conditional rendering (Requirement 7.1)', () => {
    it('returns null when playerParticipating is false', () => {
      const state = createEmptyState({ playerParticipating: false });
      const { container } = render(
        <ChampionsLeagueTab state={state} playerClubId="player-club" />
      );
      expect(container.innerHTML).toBe('');
    });

    it('renders when playerParticipating is true', () => {
      const state = createEmptyState({ playerParticipating: true });
      render(<ChampionsLeagueTab state={state} playerClubId="player-club" />);
      expect(screen.getByText('Ligue des Champions')).toBeInTheDocument();
    });
  });

  describe('Position highlighting (Requirement 7.3)', () => {
    it('shows green class for positions 1-16 (qualified)', () => {
      const standings = [1, 8, 16].map((pos) => createStanding(pos));
      const state = createEmptyState({ standings });

      render(<ChampionsLeagueTab state={state} playerClubId="player-club" />);

      // The position number is rendered inside a <span> with the color class
      // Use the table's aria-label to scope the query
      const table = screen.getByRole('table', { name: 'Classement Ligue des Champions' });
      const spans = table.querySelectorAll('span.font-bold');

      const greenSpans = Array.from(spans).filter((s) => s.classList.contains('text-green-400'));
      expect(greenSpans).toHaveLength(3);
      expect(greenSpans[0].textContent).toBe('1');
      expect(greenSpans[1].textContent).toBe('8');
      expect(greenSpans[2].textContent).toBe('16');
    });

    it('shows red class for positions 17-50 (eliminated)', () => {
      const standings = [17, 30, 50].map((pos) => createStanding(pos));
      const state = createEmptyState({ standings });

      render(<ChampionsLeagueTab state={state} playerClubId="player-club" />);

      const table = screen.getByRole('table', { name: 'Classement Ligue des Champions' });
      const spans = table.querySelectorAll('span.font-bold');

      const redSpans = Array.from(spans).filter((s) => s.classList.contains('text-red-400'));
      expect(redSpans).toHaveLength(3);
      expect(redSpans[0].textContent).toBe('17');
      expect(redSpans[1].textContent).toBe('30');
      expect(redSpans[2].textContent).toBe('50');
    });
  });

  describe('Bracket display (Requirement 7.5)', () => {
    it('shows message when no knockout data is available', () => {
      const standings = [createStanding(1)]; // Need standings so the component renders content
      const state = createEmptyState({ standings });

      render(<ChampionsLeagueTab state={state} playerClubId="player-club" />);

      // Click on the Bracket tab
      fireEvent.click(screen.getByRole('tab', { name: 'Bracket' }));

      expect(
        screen.getByText("Les tours éliminatoires n'ont pas encore commencé")
      ).toBeInTheDocument();
    });

    it('shows knockout ties when data is available', () => {
      const tie: CLKnockoutTie = {
        homeTeam: {
          id: 'team-a',
          name: 'FC Barcelona',
          country: 'spain',
          averageRating: 85,
          isFiller: false,
        },
        awayTeam: {
          id: 'team-b',
          name: 'Bayern Munich',
          country: 'germany',
          averageRating: 84,
          isFiller: false,
        },
        firstLeg: {
          matchday: 1,
          homeTeamId: 'team-a',
          awayTeamId: 'team-b',
          homeGoals: 2,
          awayGoals: 1,
          phase: 'round-of-16',
          leg: 1,
        },
        secondLeg: {
          matchday: 2,
          homeTeamId: 'team-b',
          awayTeamId: 'team-a',
          homeGoals: 0,
          awayGoals: 3,
          phase: 'round-of-16',
          leg: 2,
        },
        winner: 'team-a',
      };

      const state = createEmptyState({
        standings: [createStanding(1)],
        knockoutBracket: {
          roundOf16: [tie],
          quarterFinals: [],
          semiFinals: [],
          final: null,
        },
      });

      render(<ChampionsLeagueTab state={state} playerClubId="player-club" />);

      // Click on the Bracket tab
      fireEvent.click(screen.getByRole('tab', { name: 'Bracket' }));

      expect(screen.getByText('FC Barcelona')).toBeInTheDocument();
      expect(screen.getByText('Bayern Munich')).toBeInTheDocument();
      expect(screen.getByText('Huitièmes de finale')).toBeInTheDocument();
    });
  });

  describe('French text (Requirement 7.6)', () => {
    it('displays all text in French', () => {
      const standings = [createStanding(1)];
      const state = createEmptyState({ standings });

      render(<ChampionsLeagueTab state={state} playerClubId="player-club" />);

      expect(screen.getByText('Ligue des Champions')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Classement' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Calendrier' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Bracket' })).toBeInTheDocument();
    });
  });
});
