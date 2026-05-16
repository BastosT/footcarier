import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainScreen } from './MainScreen';
import type { PlayerCharacter, LeagueStanding, ScheduledMatch, GameDate } from '../../core/types';

const mockPlayer: PlayerCharacter = {
  id: 'player-1',
  firstName: 'Lucas',
  lastName: 'Dupont',
  nationality: 'france',
  position: 'ST',
  appearance: { skinTone: 1, hairStyle: 2, hairColor: 3, height: 'medium' },
  age: 20,
  stats: { pace: 75, shooting: 70, passing: 65, dribbling: 72, defending: 40, physical: 68 },
  potential: 88,
  overallRating: 72,
  fitness: 85,
  morale: 70,
  injury: null,
};

const mockStandings: LeagueStanding[] = [
  { clubId: 'club-1', clubName: 'PSG', played: 10, won: 8, drawn: 1, lost: 1, goalsFor: 25, goalsAgainst: 8, points: 25, position: 1 },
  { clubId: 'club-2', clubName: 'OM', played: 10, won: 6, drawn: 2, lost: 2, goalsFor: 18, goalsAgainst: 10, points: 20, position: 2 },
  { clubId: 'club-3', clubName: 'OL', played: 10, won: 5, drawn: 3, lost: 2, goalsFor: 15, goalsAgainst: 9, points: 18, position: 3 },
];

const mockNextMatch: ScheduledMatch = {
  date: { day: 20, month: 9, year: 2024 },
  homeTeam: 'club-1',
  awayTeam: 'club-2',
  competition: 'Ligue 1',
  matchday: 11,
};

const mockCurrentDate: GameDate = { day: 18, month: 9, year: 2024 };

describe('MainScreen', () => {
  const defaultProps = {
    player: mockPlayer,
    standings: mockStandings,
    nextMatch: mockNextMatch,
    currentDate: mockCurrentDate,
    trainingAvailable: true,
    onAdvanceDay: vi.fn(),
    onSimulateWeek: vi.fn(),
    onTrain: vi.fn(),
  };

  it('displays the player avatar', () => {
    render(<MainScreen {...defaultProps} />);
    expect(screen.getByRole('img', { name: 'Avatar du joueur' })).toBeInTheDocument();
  });

  it('displays the player name and info', () => {
    render(<MainScreen {...defaultProps} />);
    expect(screen.getByText(/Lucas/)).toBeInTheDocument();
    expect(screen.getByText(/Dupont/)).toBeInTheDocument();
    expect(screen.getByText(/ST/)).toBeInTheDocument();
  });

  it('displays the current date', () => {
    render(<MainScreen {...defaultProps} />);
    expect(screen.getByText('18/09/2024')).toBeInTheDocument();
  });

  it('displays the next match info', () => {
    render(<MainScreen {...defaultProps} />);
    expect(screen.getByText('Prochain match')).toBeInTheDocument();
    expect(screen.getByText(/J11/)).toBeInTheDocument();
    expect(screen.getByText('Ligue 1')).toBeInTheDocument();
  });

  it('displays the fitness bar', () => {
    render(<MainScreen {...defaultProps} />);
    expect(screen.getByRole('progressbar', { name: /Forme/ })).toBeInTheDocument();
  });

  it('displays the standings table', () => {
    render(<MainScreen {...defaultProps} />);
    expect(screen.getByText(/Classement/)).toBeInTheDocument();
    expect(screen.getByText('PSG')).toBeInTheDocument();
    expect(screen.getByText('OM')).toBeInTheDocument();
    expect(screen.getByText('OL')).toBeInTheDocument();
  });

  it('displays action buttons', () => {
    render(<MainScreen {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Jour suivant/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Semaine/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entraînement/ })).toBeInTheDocument();
  });

  it('hides training button when training is not available', () => {
    render(<MainScreen {...defaultProps} trainingAvailable={false} />);
    expect(screen.queryByRole('button', { name: /Entraînement/ })).not.toBeInTheDocument();
  });

  it('calls onAdvanceDay when "Jour suivant" is clicked', () => {
    const onAdvanceDay = vi.fn();
    render(<MainScreen {...defaultProps} onAdvanceDay={onAdvanceDay} />);
    fireEvent.click(screen.getByRole('button', { name: /Jour suivant/ }));
    expect(onAdvanceDay).toHaveBeenCalledTimes(1);
  });

  it('calls onSimulateWeek when "Simuler la semaine" is clicked', () => {
    const onSimulateWeek = vi.fn();
    render(<MainScreen {...defaultProps} onSimulateWeek={onSimulateWeek} />);
    fireEvent.click(screen.getByRole('button', { name: /Semaine/ }));
    expect(onSimulateWeek).toHaveBeenCalledTimes(1);
  });

  it('calls onTrain when "Entraînement" is clicked', () => {
    const onTrain = vi.fn();
    render(<MainScreen {...defaultProps} onTrain={onTrain} />);
    fireEvent.click(screen.getByRole('button', { name: /Entraînement/ }));
    expect(onTrain).toHaveBeenCalledTimes(1);
  });

  it('does not show next match section when nextMatch is null', () => {
    render(<MainScreen {...defaultProps} nextMatch={null} />);
    expect(screen.queryByText('Prochain match')).not.toBeInTheDocument();
  });

  it('is scrollable (has overflow-y-auto class)', () => {
    const { container } = render(<MainScreen {...defaultProps} />);
    const mainDiv = container.firstElementChild;
    expect(mainDiv?.className).toContain('overflow-y-auto');
  });
});
