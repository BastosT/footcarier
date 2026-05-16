import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from './BottomNav';
import type { NavTab } from '../../store/slices/uiSlice';

describe('BottomNav', () => {
  const defaultProps = {
    activeTab: 'home' as NavTab,
    onTabChange: vi.fn(),
  };

  it('renders all 4 navigation tabs', () => {
    render(<BottomNav {...defaultProps} />);

    expect(screen.getByRole('tab', { name: 'Accueil' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Club' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Joueur' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Vie' })).toBeInTheDocument();
  });

  it('highlights the active tab with aria-selected', () => {
    render(<BottomNav {...defaultProps} activeTab="club" />);

    expect(screen.getByRole('tab', { name: 'Club' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Accueil' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Joueur' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Vie' })).toHaveAttribute('aria-selected', 'false');
  });

  it('applies active styling to the active tab', () => {
    render(<BottomNav {...defaultProps} activeTab="home" />);

    const homeTab = screen.getByRole('tab', { name: 'Accueil' });
    expect(homeTab.className).toContain('text-emerald-400');

    const clubTab = screen.getByRole('tab', { name: 'Club' });
    expect(clubTab.className).toContain('text-gray-400');
  });

  it('calls onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn();
    render(<BottomNav activeTab="home" onTabChange={onTabChange} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Club' }));
    expect(onTabChange).toHaveBeenCalledWith('club');

    fireEvent.click(screen.getByRole('tab', { name: 'Joueur' }));
    expect(onTabChange).toHaveBeenCalledWith('person');

    fireEvent.click(screen.getByRole('tab', { name: 'Vie' }));
    expect(onTabChange).toHaveBeenCalledWith('trophy');
  });

  it('calls onTabChange with home when home tab is clicked', () => {
    const onTabChange = vi.fn();
    render(<BottomNav activeTab="club" onTabChange={onTabChange} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Accueil' }));
    expect(onTabChange).toHaveBeenCalledWith('home');
  });

  it('has a navigation role with proper aria-label', () => {
    render(<BottomNav {...defaultProps} />);

    const nav = screen.getByRole('tablist');
    expect(nav).toHaveAttribute('aria-label', 'Navigation principale');
  });

  it('renders as fixed at the bottom', () => {
    render(<BottomNav {...defaultProps} />);

    const nav = screen.getByRole('tablist');
    expect(nav.className).toContain('fixed');
    expect(nav.className).toContain('bottom-0');
  });
});
