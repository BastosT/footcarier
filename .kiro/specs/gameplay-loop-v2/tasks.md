# Implementation Plan: Gameplay Loop V2

## Overview

This plan implements the complete V2 gameplay loop: a full league system with 5 championships of 18 teams, a redesigned main screen with bottom navigation, avatar creation, locker room with team morale, weekly training, enriched match simulation (play/simulate), and multi-league standings with top scorers. The implementation builds incrementally on existing systems (MatchSimulator, AIMatchSimulator, TimeSystem, FinanceSystem, SocialSystem, TrainingSystem) by adding a GameLoopOrchestrator, LeagueEngine, and new UI screens.

## Tasks

- [x] 1. Set up league system core modules
  - [x] 1.1 Create ScheduleGenerator module
    - Create `src/systems/league/ScheduleGenerator.ts`
    - Implement `generateRoundRobin(clubIds: string[], season: number): ScheduledMatch[]` using the circle algorithm for 18 teams
    - Implement `assignDates(matches: ScheduledMatch[], startDate: GameDate): ScheduledMatch[]` with 1 matchday per week (Saturday)
    - Generate 34 matchdays (17 home + 17 return) where each team plays exactly once per matchday
    - _Requirements: 1.3_

  - [ ]* 1.2 Write property test for ScheduleGenerator (Property 1: Schedule Round-Robin)
    - **Property 1: Schedule Generation Produces Valid Round-Robin**
    - **Validates: Requirements 1.3**
    - File: `src/systems/league/schedule.property.test.ts`
    - Verify: 34 matchdays, each team plays 34 matches (17 home, 17 away), each pair meets exactly twice, each team plays once per matchday

  - [x] 1.3 Create StandingsCalculator module
    - Create `src/systems/league/StandingsCalculator.ts`
    - Implement `calculateFromResults(results: MatchResult[], clubs: Club[]): LeagueStanding[]`
    - Implement `sortStandings(standings: LeagueStanding[]): LeagueStanding[]` with sort order: points desc > goal difference desc > goals for desc > club name alphabetical
    - Implement `getPosition(clubId: string, standings: LeagueStanding[]): number`
    - _Requirements: 1.5, 2.3, 2.4, 9.6_

  - [ ]* 1.4 Write property test for StandingsCalculator (Property 3: Standings Calculation)
    - **Property 3: Standings Calculation Correctness**
    - **Validates: Requirements 1.5, 2.3, 2.4, 9.6**
    - File: `src/systems/league/standings.property.test.ts`
    - Verify: points = 3×wins + 1×draws, correct goal tallies, correct sort order

  - [x] 1.5 Create TopScorers module
    - Create `src/systems/league/TopScorers.ts`
    - Implement accumulation of goals per player across matchdays
    - Implement sorting by goals descending
    - _Requirements: 3.1, 3.3_

  - [ ]* 1.6 Write property test for TopScorers (Property 4: Top Scorers Accumulation)
    - **Property 4: Top Scorers Accumulation**
    - **Validates: Requirements 3.1, 3.3**
    - File: `src/systems/league/topscorers.property.test.ts`
    - Verify: correct sum of goals per player, sorted by goals descending

  - [x] 1.7 Create LeagueEngine module
    - Create `src/systems/league/LeagueEngine.ts`
    - Implement `generateSeasonSchedule(clubs: Club[]): ScheduledMatch[]` delegating to ScheduleGenerator
    - Implement `simulateMatchday(matchday: number, leagues: LeagueState[]): MatchdayResult` using AIMatchSimulator for all non-player matches
    - Implement `calculateStandings` and `updateTopScorers` delegating to respective modules
    - _Requirements: 1.4, 1.5, 2.4, 3.3, 14.2_

  - [ ]* 1.8 Write property test for LeagueEngine matchday simulation (Property 2: Matchday Completeness)
    - **Property 2: Matchday Simulation Completeness**
    - **Validates: Requirements 1.4**
    - File: `src/systems/league/league.property.test.ts`
    - Verify: N scheduled matches produce exactly N results with non-negative scores

- [x] 2. Enrich club data to 18 teams per country
  - [x] 2.1 Complete club data files to 18 teams each
    - Update `src/data/clubs/france.ts` to have exactly 18 Ligue 1 clubs
    - Update `src/data/clubs/england.ts` to have exactly 18 Premier League clubs
    - Update `src/data/clubs/germany.ts` to have exactly 18 Bundesliga clubs
    - Update `src/data/clubs/italy.ts` to have exactly 18 Serie A clubs
    - Update `src/data/clubs/spain.ts` to have exactly 18 La Liga clubs
    - Each club must have a valid squad with ratings for AIMatchSimulator
    - _Requirements: 1.1, 1.2, 1.6_

- [x] 3. Implement fitness and training systems
  - [x] 3.1 Implement FitnessManager logic
    - Add fitness management functions (can be in `src/core/GameLoopOrchestrator.ts` or a dedicated utility)
    - Implement `applyMatchFatigue(fitness, matchIntensity)`: loss between 15-30 points
    - Implement `applyDailyRecovery(fitness)`: +1 point per day
    - Implement `clampFitness(fitness)`: always [0, 100]
    - Implement `getFitnessModifier(fitness)`: reduced probability when fitness < 50
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 3.2 Write property tests for FitnessManager (Properties 12, 13, 14)
    - **Property 12: Match Fitness Loss Bounded [15, 30]**
    - **Property 13: Fitness Always Bounded [0, 100]**
    - **Property 14: Daily Fitness Recovery on Non-Match Days**
    - **Validates: Requirements 10.1, 10.2, 10.3, 8.7**
    - File: `src/systems/match/fitness.property.test.ts`

  - [x] 3.3 Implement TrainingManager extension
    - Create or extend training logic in `src/systems/training/TrainingManager.ts`
    - Implement `isTrainingAvailable(trainedThisWeek: boolean): boolean`
    - Implement `executeWeeklyTraining(player, skill)`: gain between 1-3 points based on potential
    - Implement `calculateSignificantGain(currentStat, potential): number`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 3.4 Write property tests for TrainingManager (Properties 6, 7)
    - **Property 6: Training Limited to Once Per Week**
    - **Property 7: Training Gain Bounded Between 1 and 3**
    - **Validates: Requirements 5.1, 5.3, 5.4**
    - File: `src/systems/training/training.property.test.ts`

- [x] 4. Implement team morale system
  - [x] 4.1 Extend SocialSystem with team morale logic
    - Add `teamMorale` field to social state (0-100)
    - Implement morale increase on win (+3 to +8)
    - Implement morale decrease on loss (-3 to -8)
    - Implement morale adjustment on draw (-2 to +2)
    - Implement coach relationship influence on morale
    - Clamp morale to [0, 100] after every modification
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [ ]* 4.2 Write property test for team morale (Property 5: Morale Bounded)
    - **Property 5: Team Morale Bounded and Monotonic with Results**
    - **Validates: Requirements 4.2, 4.3, 4.4**
    - File: `src/systems/social/morale.property.test.ts`
    - Verify: win increases morale (or stays at 100), loss decreases (or stays at 0), always in [0, 100]

- [x] 5. Checkpoint - Core systems
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement GameLoopOrchestrator
  - [x] 6.1 Create GameLoopOrchestrator module
    - Create `src/core/GameLoopOrchestrator.ts`
    - Implement `advanceDay()`: advance time, apply fitness recovery, check match day, credit salary on Monday, reset training on Monday
    - Implement `simulateWeek()`: advance 7 days sequentially, collect results
    - Implement `playMatch(config, playerInputs)`: run interactive match, update standings, update morale
    - Implement `simulateMatch(config)`: run quick simulation, generate player performance, update standings
    - Implement `executeTraining(skill)`: check availability, execute training, mark as done
    - Wire all existing systems (TimeSystem, FinanceSystem, SocialSystem, LeagueEngine, MatchSimulator)
    - _Requirements: 14.1, 14.2, 14.3, 14.5_

  - [ ]* 6.2 Write property tests for GameLoopOrchestrator (Properties 15, 6, 14)
    - **Property 15: Weekly Salary Correctly Credited**
    - **Property 6: Training Limited to Once Per Week** (integration level)
    - **Property 14: Daily Fitness Recovery** (integration level)
    - **Validates: Requirements 14.5, 5.1, 10.2**
    - File: `src/core/gameloop.property.test.ts`

- [x] 7. Implement match flow (simulate and play)
  - [x] 7.1 Implement quick match simulation logic
    - Implement `simulateQuickMatch` in GameLoopOrchestrator or MatchChoiceFlow
    - Calculate result favoring stronger team (average squad ratings)
    - Generate automatic player performance based on overall rating and fitness
    - Apply fitness loss (15-30 points)
    - _Requirements: 6.2, 6.3, 6.4_

  - [ ]* 7.2 Write property test for match simulation (Property 8: Stronger Team Wins)
    - **Property 8: Stronger Team Wins More Often in Simulation**
    - **Validates: Requirements 6.2**
    - File: `src/systems/match/simulation.property.test.ts`
    - Verify: over many simulations, team with higher average rating wins more often

  - [x] 7.3 Implement interactive match action generation
    - Extend MatchSimulator to generate 6-12 actions per match
    - Each action offers easy (high probability, low reward) vs risky (low probability, high reward) choice
    - Calculate success probability based on player stats and fitness
    - Implement shot success → goal, pass success → assist attribution
    - Apply progressive fitness decrease during match
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 7.4 Write property tests for match actions (Properties 9, 10, 11)
    - **Property 9: Match Action Count Bounded [6, 12]**
    - **Property 10: Action Probability Monotonic with Stats and Fitness**
    - **Property 11: Successful Actions Produce Correct Outcomes**
    - **Validates: Requirements 8.2, 8.4, 8.5, 8.6, 10.4**
    - File: `src/systems/match/match.property.test.ts` and `src/systems/match/action.property.test.ts`

  - [x] 7.5 Implement coach speech generation
    - Create `src/ui/components/CoachSpeech.tsx` or utility function
    - Generate contextual message based on match importance and coach relationship
    - Implement importance calculation (matchday > 30 = crucial, position <= 3 = important, else normal)
    - Implement tone selection based on coach relation thresholds (>70 encouraging, 40-70 neutral, <40 cold)
    - _Requirements: 7.2_

- [x] 8. Checkpoint - Match and game loop systems
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Enrich Zustand store slices
  - [x] 9.1 Enrich leagueSlice for multi-championship support
    - Update `src/store/slices/leagueSlice.ts` to support `LeagueStateV2` with topScorers and full schedule per league
    - Add actions: `updateStandings`, `updateTopScorers`, `setSchedule`
    - Support 5 leagues simultaneously
    - _Requirements: 1.2, 2.1, 2.2, 3.1_

  - [x] 9.2 Create uiSlice for navigation state
    - Create `src/store/slices/uiSlice.ts`
    - Manage `activeTab: NavTab` and `currentScreen: ScreenType`
    - Add actions: `setActiveTab`, `setCurrentScreen`
    - _Requirements: 13.5, 13.6_

  - [x] 9.3 Add weekly training state to store
    - Add `WeeklyTrainingState` to the game state (trainedThisWeek, lastTrainingDate)
    - Add actions: `markTrainingDone`, `resetWeeklyTraining`
    - _Requirements: 5.1, 5.4_

  - [x] 9.4 Extend social slice with team morale
    - Add `teamMorale: number` to social state
    - Add actions: `updateTeamMorale`
    - _Requirements: 4.2_

- [x] 10. Implement UI screens - Main and Navigation
  - [x] 10.1 Create BottomNav component
    - Create `src/ui/components/BottomNav.tsx`
    - Implement fixed bottom navigation bar with 4 icons: Home, Club, Person, Trophy/Finance
    - Highlight active tab visually
    - Wire to uiSlice for tab state
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 10.2 Create MainScreen component
    - Create `src/ui/screens/MainScreen.tsx`
    - Display avatar at top, scrollable layout
    - Show current date, next match, fitness bar
    - Show player's championship standings below avatar
    - Display action buttons: "Jour suivant", "Simuler la semaine", "Entraînement" (if available)
    - Wire to GameLoopOrchestrator via useGameLoop hook
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 10.3 Create FitnessBar and MoraleIndicator components
    - Create `src/ui/components/FitnessBar.tsx` - visual gauge for fitness (0-100)
    - Create `src/ui/components/MoraleIndicator.tsx` - color-coded indicator for team morale
    - _Requirements: 4.6, 10.3, 12.3_

  - [x] 10.4 Create useGameLoop and useNavigation hooks
    - Create `src/ui/hooks/useGameLoop.ts` - wraps GameLoopOrchestrator calls
    - Create `src/ui/hooks/useNavigation.ts` - manages navigation state and transitions
    - _Requirements: 14.1, 13.5_

- [x] 11. Implement UI screens - Match flow
  - [x] 11.1 Create MatchChoice screen
    - Create `src/ui/screens/MatchChoice.tsx`
    - Display two options: "Jouer le match" and "Simuler le match" on match days
    - _Requirements: 6.1_

  - [x] 11.2 Create PreMatch screen
    - Create `src/ui/screens/PreMatch.tsx`
    - Display both teams info, coach speech, player fitness and rating
    - Confirm button to start interactive match
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 11.3 Create MatchPlay screen
    - Create `src/ui/screens/MatchPlay.tsx`
    - Display accelerated match time (90 min in < 5 min real)
    - Present action choices (easy/risky) when actions occur
    - Update score and fitness in real-time
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 11.4 Create PostMatch screen
    - Create `src/ui/screens/PostMatch.tsx`
    - Display final score, goals, assists, player rating
    - Display detailed stats: shots, dribbles, tackles, pass accuracy
    - Offer post-match interview option
    - Handle interview flow via SocialSystem
    - Return to main screen after completion
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 12. Implement UI screens - Secondary screens
  - [x] 12.1 Create Standings screen with multi-league tabs
    - Create `src/ui/screens/Standings.tsx`
    - Create `src/ui/components/StandingsTable.tsx` - table with position, points, W/D/L, GF/GA
    - Create `src/ui/components/TopScorersTable.tsx` - table with player name, club, goals
    - Implement league selector (tabs or dropdown) for 5 championships
    - Highlight player's championship visually
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.4_

  - [x] 12.2 Create Locker screen
    - Create `src/ui/screens/Locker.tsx`
    - Display full squad list with name, position, age, overall rating
    - Display team morale indicator (0-100 with color gauge)
    - _Requirements: 4.1, 4.2, 4.6_

  - [x] 12.3 Create Training screen
    - Create `src/ui/screens/Training.tsx`
    - Display skill choices: vitesse, tir, passe, dribble, défense, physique
    - Clearly indicate if training is available or already used this week
    - Wire to TrainingManager via GameLoopOrchestrator
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

  - [x] 12.4 Create AvatarCreation screen
    - Create `src/ui/screens/AvatarCreation.tsx`
    - Create `src/ui/components/Avatar.tsx` - renders the avatar visual
    - Offer customization options: skin tone, hairstyle, hair color, height
    - Display real-time preview during customization
    - Save appearance with player character data on validation
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 12.5 Write property test for avatar appearance (Property 16: Round-Trip)
    - **Property 16: Avatar Appearance Round-Trip**
    - **Validates: Requirements 11.3**
    - File: `src/persistence/serializer.property.test.ts`
    - Verify: saving and reading back appearance produces identical object

- [x] 13. Checkpoint - UI screens complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Integration and wiring
  - [x] 14.1 Wire App routing and screen transitions
    - Update `src/App.tsx` to integrate BottomNav, MainScreen, and all secondary screens
    - Implement screen transitions based on uiSlice state
    - Ensure BottomNav is visible on all main screens
    - Wire avatar creation into the character creation flow
    - _Requirements: 13.5, 12.1, 11.4_

  - [x] 14.2 Wire match day detection and flow
    - Connect GameLoopOrchestrator's `advanceDay()` to detect match days
    - Trigger MatchChoice screen on match day
    - Connect simulate path → quick sim → PostMatch → MainScreen
    - Connect play path → PreMatch → MatchPlay → PostMatch → MainScreen
    - Update standings and top scorers after every match
    - _Requirements: 6.1, 6.4, 7.4, 9.5, 9.6, 14.1, 14.2_

  - [x] 14.3 Wire existing systems into GameLoopOrchestrator
    - Connect FinanceSystem for weekly salary credit on Mondays
    - Connect SocialSystem for social feed generation (accessible via Person tab)
    - Connect TransferSystem for transfer window offers (accessible via Person tab)
    - Connect InjurySystem for injury events during day advance
    - _Requirements: 14.4, 14.5, 14.6_

  - [ ]* 14.4 Write integration tests for full day advance and matchday
    - Test complete day advance flow (time + fitness + events + match detection)
    - Test complete matchday flow (player match + other matches + standings update)
    - Test complete week simulation (salary + training reset + multiple days)
    - File: `src/integration/dayAdvance.test.ts`, `src/integration/matchday.test.ts`, `src/integration/weekSimulation.test.ts`
    - _Requirements: 14.1, 14.2, 14.3, 14.5_

- [x] 15. Final checkpoint - Full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation reuses existing systems (MatchSimulator, AIMatchSimulator, TimeSystem, FinanceSystem, SocialSystem) via the new GameLoopOrchestrator
- All UI components use React 19 + TypeScript + Tailwind CSS 4
- State management via Zustand 5 slices (existing pattern)
- Tests use Vitest + fast-check (already configured in the project)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "3.3", "4.1", "9.2", "9.3", "9.4"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.5", "3.2", "3.4", "4.2", "9.1"] },
    { "id": 2, "tasks": ["1.4", "1.6", "1.7"] },
    { "id": 3, "tasks": ["1.8", "6.1"] },
    { "id": 4, "tasks": ["6.2", "7.1", "7.3", "7.5"] },
    { "id": 5, "tasks": ["7.2", "7.4", "10.1", "10.3", "10.4"] },
    { "id": 6, "tasks": ["10.2", "11.1", "11.2", "11.3", "11.4", "12.1", "12.2", "12.3", "12.4"] },
    { "id": 7, "tasks": ["12.5", "14.1"] },
    { "id": 8, "tasks": ["14.2", "14.3"] },
    { "id": 9, "tasks": ["14.4"] }
  ]
}
```
