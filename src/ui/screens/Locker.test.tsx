import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Locker } from './Locker';
import type { SquadPlayer } from '../../core/types';

describe('Locker', () => {
  const mockSquad: SquadPlayer[] = [
    {
      id: 'player-1',
      name: 'Jean Dupont',
      position: 'ST',
      age: 24,
      overallRating: 78,
      potential: 85,
      isPlayerCharacter: true,
    },
    {
      id: 'player-2',
      name: 'Pierre Martin',
      position: 'CM',
      age: 27,
      overallRating: 72,
      potential: 75,
      isPlayerCharacter: false,
    },
    {
      id: 'player-3',
      name: 'Luc Bernard',
      position: 'GK',
      age: 30,
      overallRating: 68,
      potential: 70,
      isPlayerCharacter: false,
    },
  ];

  it('renders the screen title', () => {
    render(<Locker squad={mockSquad} teamMorale={65} />);
    expect(screen.getByText('Vestiaire')).toBeInTheDocument();
  });

  it('displays the squad count', () => {
    render(<Locker squad={mockSquad} teamMorale={65} />);
    expect(screen.getByText('3 joueurs')).toBeInTheDocument();
  });

  it('displays each player name', () => {
    render(<Locker squad={mockSquad} teamMorale={65} />);
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Pierre Martin')).toBeInTheDocument();
    expect(screen.getByText('Luc Bernard')).toBeInTheDocument();
  });

  it('displays each player position', () => {
    render(<Locker squad={mockSquad} teamMorale={65} />);
    expect(screen.getByText('ST')).toBeInTheDocument();
    expect(screen.getByText('CM')).toBeInTheDocument();
    expect(screen.getByText('GK')).toBeInTheDocument();
  });

  it('displays each player age', () => {
    render(<Locker squad={mockSquad} teamMorale={65} />);
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('27')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('displays each player overall rating', () => {
    render(<Locker squad={mockSquad} teamMorale={65} />);
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.getByText('68')).toBeInTheDocument();
  });

  it('highlights the player character row', () => {
    render(<Locker squad={mockSquad} teamMorale={65} />);
    expect(screen.getByText('(Vous)')).toBeInTheDocument();
  });

  it('renders the morale indicator', () => {
    render(<Locker squad={mockSquad} teamMorale={75} />);
    // MoraleIndicator renders a progressbar with the morale value
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '75');
  });

  it('displays empty state when squad is empty', () => {
    render(<Locker squad={[]} teamMorale={50} />);
    expect(screen.getByText("Aucun joueur dans l'effectif")).toBeInTheDocument();
  });

  it('shows singular form for single player', () => {
    const singleSquad: SquadPlayer[] = [mockSquad[0]];
    render(<Locker squad={singleSquad} teamMorale={50} />);
    expect(screen.getByText('1 joueur')).toBeInTheDocument();
  });
});
