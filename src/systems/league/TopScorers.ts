/**
 * TopScorers — Gère le classement des meilleurs buteurs d'un championnat.
 *
 * Accumule les buts par joueur à travers les journées de championnat
 * et trie le classement par nombre de buts décroissant.
 *
 * Requirements: 3.1, 3.3
 */

export interface TopScorer {
  playerId: string;
  playerName: string;
  clubId: string;
  clubName: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
}

/**
 * Represents a goal or assist event from a single match.
 * Used to feed the top scorers accumulator.
 */
export interface MatchGoalEvent {
  playerId: string;
  playerName: string;
  clubId: string;
  clubName: string;
  goals: number;
  assists: number;
}

/**
 * Accumulates goal events into the existing top scorers list.
 * For each event, if the player already exists in the list, their totals are updated.
 * If the player is new, they are added to the list.
 * The returned list is sorted by goals descending.
 */
export function accumulateGoals(
  currentScorers: TopScorer[],
  events: MatchGoalEvent[]
): TopScorer[] {
  // Create a mutable map from existing scorers for efficient lookup
  const scorerMap = new Map<string, TopScorer>();
  for (const scorer of currentScorers) {
    scorerMap.set(scorer.playerId, { ...scorer });
  }

  // Process each event
  for (const event of events) {
    if (event.goals === 0 && event.assists === 0) {
      // Player participated but didn't score or assist — still count match played
      const existing = scorerMap.get(event.playerId);
      if (existing) {
        existing.matchesPlayed += 1;
      }
      // Don't add players who never scored/assisted to the top scorers list
      continue;
    }

    const existing = scorerMap.get(event.playerId);
    if (existing) {
      existing.goals += event.goals;
      existing.assists += event.assists;
      existing.matchesPlayed += 1;
    } else {
      scorerMap.set(event.playerId, {
        playerId: event.playerId,
        playerName: event.playerName,
        clubId: event.clubId,
        clubName: event.clubName,
        goals: event.goals,
        assists: event.assists,
        matchesPlayed: 1,
      });
    }
  }

  return sortTopScorers([...scorerMap.values()]);
}

/**
 * Sorts top scorers by goals descending, then assists descending,
 * then player name alphabetically for stability.
 */
export function sortTopScorers(scorers: TopScorer[]): TopScorer[] {
  return [...scorers].sort((a, b) => {
    // Primary: goals descending
    if (b.goals !== a.goals) return b.goals - a.goals;
    // Secondary: assists descending
    if (b.assists !== a.assists) return b.assists - a.assists;
    // Tertiary: player name alphabetical for stability
    return a.playerName.localeCompare(b.playerName);
  });
}

/**
 * Gets the position (1-indexed) of a player in the top scorers list.
 * Returns -1 if the player is not found.
 */
export function getPlayerPosition(scorers: TopScorer[], playerId: string): number {
  const sorted = sortTopScorers(scorers);
  const index = sorted.findIndex((s) => s.playerId === playerId);
  return index === -1 ? -1 : index + 1;
}

export const TopScorersModule = {
  accumulateGoals,
  sortTopScorers,
  getPlayerPosition,
};
