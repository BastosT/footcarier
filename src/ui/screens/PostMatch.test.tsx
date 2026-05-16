/**
 * PostMatch screen tests.
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostMatch } from './PostMatch';
import { useGameStore } from '../../store/gameStore';
import type { GameState } from '../../core/types';

function createMockGameState(overrides?: Partial<GameState>): GameState {
  return {
    version: '1.0.0',
    player: {
      id: 'player-1',
      firstName: 'Jean',
      lastName: 'Dupont',
      nationality: 'france',
      position: 'ST',
      appearance: { skinTone: 3, hairStyle: 1, hairColor: 2, height: 'medium' },
      age: 22,
      stats: { pace: 80, shooting: 75, passing: 70, dribbling: 72, defending: 40, physical: 68 },
      potential: 88,
      overallRating: 74,
      fitness: 72,
      morale: 65,
      injury: null,
    },
    career: {
      currentClub: {
        id: 'club-psg',
        name: 'Paris SG',
        country: 'france',
        division: { country: 'france', level: 1, name: 'Ligue 1' },
        tier: 'big',
        squad: [],
        finances: { budget: 100000000, wageBill: 5000000 },
        stadium: 'Parc des Princes',
        colors: { primary: '#004170', secondary: '#DA291C' },
      },
      contract: {
        clubId: 'club-psg',
        weeklySalary: 50000,
        bonusPerGoal: 5000,
        bonusPerAssist: 2000,
        duration: 3,
        seasonsRemaining: 3,
        signingBonus: 100000,
      },
      season: 1,
      matchday: 5,
      trophies: [],
      transferHistory: [],
    },
    time: {
      currentDate: { day: 15, month: 9, year: 2024 },
      season: 1,
      weekday: 6,
      eventsThisWeek: 0,
      schedule: { nextMatch: null, seasonMatches: [] },
    },
    social: {
      popularity: 50,
      reputation: 50,
      coachRelation: 60,
      teamRelation: 55,
      teamMorale: 65,
      socialFeed: [],
      pendingInterviews: [],
    },
    finance: {
      balance: 200000,
      weeklyIncome: 50000,
      history: [],
    },
    leagues: [
      {
        division: { country: 'france', level: 1, name: 'Ligue 1' },
        standings: [
          {
            clubId: 'club-psg',
            clubName: 'Paris SG',
            played: 5,
            won: 4,
            drawn: 0,
            lost: 1,
            goalsFor: 12,
            goalsAgainst: 4,
            points: 12,
            position: 1,
          },
        ],
        results: [
          {
            matchday: 5,
            homeTeamId: 'club-psg',
            awayTeamId: 'club-om',
            homeGoals: 3,
            awayGoals: 1,
            playerPerformance: {
              rating: 8.2,
              goals: 2,
              assists: 1,
              minutesPlayed: 90,
              shots: 5,
              passAccuracy: 82,
              dribbles: 4,
              tackles: 2,
            },
          },
        ],
        season: 1,
        topScorers: [],
        schedule: [],
      },
    ],
    saves: { lastSaved: new Date().toISOString(), slot: 1 },
    ...overrides,
  };
}

describe('PostMatch', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState());
  });

  it('renders nothing when gameState is null', () => {
    useGameStore.setState({ gameState: null });
    const { container } = render(<PostMatch />);
    expect(container.innerHTML).toBe('');
  });

  it('displays the match summary title', () => {
    useGameStore.setState({ gameState: createMockGameState() });
    render(<PostMatch />);
    expect(screen.getByText('📋 Résumé du match')).toBeInTheDocument();
  });

  it('displays the final score (Req 9.1)', () => {
    useGameStore.setState({ gameState: createMockGameState() });
    render(<PostMatch />);
    // Score is displayed in text-4xl elements
    const scoreElements = screen.getAllByText(/^[0-9]+$/);
    const scores = scoreElements
      .filter((el) => el.className.includes('text-4xl'))
      .map((el) => el.textContent);
    expect(scores).toContain('3');
    expect(scores).toContain('1');
  });

  it('displays player goals and assists (Req 9.1)', () => {
    useGameStore.setState({ gameState: createMockGameState() });
    render(<PostMatch />);
    expect(screen.getByText('Buts')).toBeInTheDocument();
    expect(screen.getByText('Passes D.')).toBeInTheDocument();
    // Goals (2) is in the performance section with text-2xl class
    const goalsLabel = screen.getByText('Buts');
    const goalsValue = goalsLabel.previousElementSibling;
    expect(goalsValue?.textContent).toBe('2');
  });

  it('displays player rating (Req 9.1)', () => {
    useGameStore.setState({ gameState: createMockGameState() });
    render(<PostMatch />);
    expect(screen.getByText('8.2')).toBeInTheDocument();
    expect(screen.getByText('Note')).toBeInTheDocument();
  });

  it('displays detailed stats: shots, dribbles, tackles, pass accuracy (Req 9.2)', () => {
    useGameStore.setState({ gameState: createMockGameState() });
    render(<PostMatch />);
    expect(screen.getByText('Tirs')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Dribbles')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Tacles')).toBeInTheDocument();
    expect(screen.getByText('Précision passes')).toBeInTheDocument();
    expect(screen.getByText('82%')).toBeInTheDocument();
  });

  it('offers post-match interview option (Req 9.3)', () => {
    useGameStore.setState({ gameState: createMockGameState() });
    render(<PostMatch />);
    expect(screen.getByText('🎤 Interview post-match')).toBeInTheDocument();
  });

  it('shows interview questions when interview button is clicked (Req 9.4)', () => {
    useGameStore.setState({ gameState: createMockGameState() });
    render(<PostMatch />);
    fireEvent.click(screen.getByText('🎤 Interview post-match'));
    expect(screen.getByText('🎤 Interview post-match', { selector: 'h1' })).toBeInTheDocument();
    expect(screen.getByText('Question du journaliste')).toBeInTheDocument();
  });

  it('displays three answer options with different tones during interview (Req 9.4)', () => {
    useGameStore.setState({ gameState: createMockGameState() });
    render(<PostMatch />);
    fireEvent.click(screen.getByText('🎤 Interview post-match'));
    expect(screen.getByText('🙏 Humble')).toBeInTheDocument();
    expect(screen.getByText('💪 Confiant')).toBeInTheDocument();
    expect(screen.getByText('🔥 Controversé')).toBeInTheDocument();
  });

  it('applies social impacts when an interview answer is selected (Req 9.4)', () => {
    useGameStore.setState({
      gameState: createMockGameState(),
      social: {
        popularity: 50,
        reputation: 50,
        coachRelation: 60,
        teamRelation: 55,
        teamMorale: 65,
        socialFeed: [],
        pendingInterviews: [],
      },
    });
    render(<PostMatch />);
    fireEvent.click(screen.getByText('🎤 Interview post-match'));

    // Click the humble answer
    const humbleButton = screen.getByText('🙏 Humble').closest('button')!;
    fireEvent.click(humbleButton);

    // Verify social state was updated (humble answer for a win: +2 pop, +1 rep, +3 coach, +3 team)
    const state = useGameStore.getState();
    expect(state.social.popularity).toBe(52); // 50 + 2
    expect(state.social.reputation).toBe(51); // 50 + 1
    expect(state.social.coachRelation).toBe(63); // 60 + 3
    expect(state.social.teamRelation).toBe(58); // 55 + 3
  });

  it('hides interview button after interview is completed (Req 9.4)', () => {
    useGameStore.setState({ gameState: createMockGameState() });
    render(<PostMatch />);
    fireEvent.click(screen.getByText('🎤 Interview post-match'));

    // Answer the question
    const humbleButton = screen.getByText('🙏 Humble').closest('button')!;
    fireEvent.click(humbleButton);

    // Interview button should no longer be visible
    expect(screen.queryByText('🎤 Interview post-match')).not.toBeInTheDocument();
  });

  it('displays continue button to return to main screen (Req 9.5)', () => {
    useGameStore.setState({ gameState: createMockGameState() });
    render(<PostMatch />);
    expect(screen.getByText('Continuer')).toBeInTheDocument();
  });

  it('navigates to main screen when continue is clicked (Req 9.5)', () => {
    useGameStore.setState({ gameState: createMockGameState() });
    render(<PostMatch />);
    fireEvent.click(screen.getByText('Continuer'));

    const state = useGameStore.getState();
    expect(state.ui.currentScreen).toBe('main');
  });

  it('displays victory label when player team wins', () => {
    useGameStore.setState({ gameState: createMockGameState() });
    render(<PostMatch />);
    expect(screen.getByText('Victoire')).toBeInTheDocument();
  });

  it('displays defeat label when player team loses', () => {
    const gameState = createMockGameState();
    gameState.leagues[0].results[0] = {
      ...gameState.leagues[0].results[0],
      homeGoals: 0,
      awayGoals: 2,
    };
    useGameStore.setState({ gameState });
    render(<PostMatch />);
    expect(screen.getByText('Défaite')).toBeInTheDocument();
  });

  it('displays draw label when match is tied', () => {
    const gameState = createMockGameState();
    gameState.leagues[0].results[0] = {
      ...gameState.leagues[0].results[0],
      homeGoals: 1,
      awayGoals: 1,
    };
    useGameStore.setState({ gameState });
    render(<PostMatch />);
    expect(screen.getByText('Match nul')).toBeInTheDocument();
  });

  it('allows skipping the interview', () => {
    useGameStore.setState({ gameState: createMockGameState() });
    render(<PostMatch />);
    fireEvent.click(screen.getByText('🎤 Interview post-match'));

    // Click "Passer" to skip
    fireEvent.click(screen.getByText('Passer'));

    // Should return to summary view without interview button
    expect(screen.getByText('📋 Résumé du match')).toBeInTheDocument();
    expect(screen.queryByText('🎤 Interview post-match')).not.toBeInTheDocument();
  });
});
