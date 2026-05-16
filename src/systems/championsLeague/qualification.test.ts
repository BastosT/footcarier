import { describe, it, expect } from 'vitest';
import { qualify, extractQualifiedTeams, isPlayerClubQualified } from './qualification';
import { createRNG } from '../../utils/random';
import { CL_CONSTANTS } from './types';
import type { LeagueState } from '../../core/types';

/**
 * Crée un LeagueState de test avec un nombre donné d'équipes dans le classement.
 */
function createTestLeague(
  country: string,
  teamCount: number = 18,
  options?: { playerClubId?: string; playerPosition?: number }
): LeagueState {
  const standings = Array.from({ length: teamCount }, (_, i) => ({
    clubId: `${country}-club-${i + 1}`,
    clubName: `${country} Club ${i + 1}`,
    played: 34,
    won: 34 - i * 2,
    drawn: i,
    lost: i,
    goalsFor: 80 - i * 3,
    goalsAgainst: 20 + i * 2,
    points: (34 - i * 2) * 3 + i,
    position: i + 1,
  }));

  // Si un club du joueur est spécifié, le placer à la position donnée
  if (options?.playerClubId && options?.playerPosition) {
    const idx = options.playerPosition - 1;
    standings[idx] = {
      ...standings[idx],
      clubId: options.playerClubId,
      clubName: 'Player Club',
    };
  }

  return {
    division: { country: country as any, level: 1, name: `${country} League` },
    standings,
    results: [],
    season: 1,
    topScorers: [],
    schedule: [],
  };
}

function createFiveLeagues(options?: {
  playerClubId?: string;
  playerCountry?: string;
  playerPosition?: number;
}): LeagueState[] {
  const countries = ['france', 'spain', 'england', 'italy', 'germany'];
  return countries.map((country) => {
    if (options?.playerCountry === country) {
      return createTestLeague(country, 18, {
        playerClubId: options.playerClubId,
        playerPosition: options.playerPosition,
      });
    }
    return createTestLeague(country);
  });
}

describe('qualification - qualify', () => {
  it('retourne exactement 50 participants', () => {
    const leagues = createFiveLeagues();
    const rng = createRNG(42);
    const participants = qualify(leagues, 1, rng);
    expect(participants).toHaveLength(CL_CONSTANTS.TOTAL_PARTICIPANTS);
  });

  it('retourne 20 qualifiés et 30 fillers', () => {
    const leagues = createFiveLeagues();
    const rng = createRNG(42);
    const participants = qualify(leagues, 1, rng);

    const qualified = participants.filter((p) => !p.isFiller);
    const fillers = participants.filter((p) => p.isFiller);

    expect(qualified).toHaveLength(CL_CONSTANTS.TOTAL_QUALIFIED);
    expect(fillers).toHaveLength(CL_CONSTANTS.TOTAL_FILLERS);
  });

  it('extrait 4 équipes par ligue', () => {
    const leagues = createFiveLeagues();
    const rng = createRNG(42);
    const participants = qualify(leagues, 1, rng);

    const qualified = participants.filter((p) => !p.isFiller);
    const countries = ['france', 'spain', 'england', 'italy', 'germany'];

    for (const country of countries) {
      const fromCountry = qualified.filter((p) => p.country === country);
      expect(fromCountry).toHaveLength(CL_CONSTANTS.QUALIFIED_PER_LEAGUE);
    }
  });

  it('les qualifiés ont isFiller = false et un clubId', () => {
    const leagues = createFiveLeagues();
    const rng = createRNG(42);
    const participants = qualify(leagues, 1, rng);

    const qualified = participants.filter((p) => !p.isFiller);
    for (const p of qualified) {
      expect(p.isFiller).toBe(false);
      expect(p.clubId).toBeDefined();
      expect(p.clubId).not.toBe('');
    }
  });

  it('les fillers ont isFiller = true', () => {
    const leagues = createFiveLeagues();
    const rng = createRNG(42);
    const participants = qualify(leagues, 1, rng);

    const fillers = participants.filter((p) => p.isFiller);
    for (const p of fillers) {
      expect(p.isFiller).toBe(true);
    }
  });
});

describe('qualification - extractQualifiedTeams', () => {
  it('extrait les équipes aux positions 1-4 de chaque ligue', () => {
    const leagues = createFiveLeagues();
    const qualified = extractQualifiedTeams(leagues);

    expect(qualified).toHaveLength(20);

    // Vérifier que chaque ligue contribue les positions 1-4
    for (const league of leagues) {
      const country = league.division.country;
      const fromLeague = qualified.filter((p) => p.country === country);
      expect(fromLeague).toHaveLength(4);

      // Vérifier que ce sont bien les clubs aux positions 1-4
      const topClubIds = league.standings
        .filter((s) => s.position <= 4)
        .map((s) => s.clubId);

      for (const p of fromLeague) {
        expect(topClubIds).toContain(p.clubId);
      }
    }
  });

  it('gère les standings non triés par position', () => {
    const league = createTestLeague('france', 18);
    // Mélanger les standings
    league.standings.reverse();

    const qualified = extractQualifiedTeams([league]);
    expect(qualified).toHaveLength(4);

    // Doit quand même prendre les positions 1-4
    const clubIds = qualified.map((p) => p.clubId);
    expect(clubIds).toContain('france-club-1');
    expect(clubIds).toContain('france-club-2');
    expect(clubIds).toContain('france-club-3');
    expect(clubIds).toContain('france-club-4');
  });
});

describe('qualification - isPlayerClubQualified', () => {
  it('retourne true si le club du joueur est en position 1', () => {
    const leagues = createFiveLeagues({
      playerClubId: 'my-club',
      playerCountry: 'france',
      playerPosition: 1,
    });
    expect(isPlayerClubQualified(leagues, 'my-club')).toBe(true);
  });

  it('retourne true si le club du joueur est en position 4', () => {
    const leagues = createFiveLeagues({
      playerClubId: 'my-club',
      playerCountry: 'spain',
      playerPosition: 4,
    });
    expect(isPlayerClubQualified(leagues, 'my-club')).toBe(true);
  });

  it('retourne false si le club du joueur est en position 5', () => {
    const leagues = createFiveLeagues({
      playerClubId: 'my-club',
      playerCountry: 'england',
      playerPosition: 5,
    });
    expect(isPlayerClubQualified(leagues, 'my-club')).toBe(false);
  });

  it('retourne false si le club du joueur est en position 18', () => {
    const leagues = createFiveLeagues({
      playerClubId: 'my-club',
      playerCountry: 'italy',
      playerPosition: 18,
    });
    expect(isPlayerClubQualified(leagues, 'my-club')).toBe(false);
  });

  it('retourne false si le club du joueur n\'est dans aucune ligue', () => {
    const leagues = createFiveLeagues();
    expect(isPlayerClubQualified(leagues, 'unknown-club')).toBe(false);
  });
});
