# Implementation Plan: Champions League

## Overview

Implémentation de la Ligue des Champions dans le jeu de carrière footballistique. Le système comprend un module `ChampionsLeagueSystem` avec sous-modules (CLScheduleGenerator, FillerTeamGenerator, CLMatchSimulator), un slice Zustand pour l'état, l'intégration avec le GameLoopOrchestrator existant, et un composant UI dédié. L'implémentation suit une approche incrémentale : types → génération → simulation → intégration → UI.

## Tasks

- [x] 1. Définir les types et constantes de la Ligue des Champions
  - [x] 1.1 Créer le fichier de types `src/systems/championsLeague/types.ts`
    - Définir les interfaces : CLParticipant, CLScheduledMatch, CLFixture, CLMatchResult, CLStanding, KnockoutRound, CLKnockoutTie, CLKnockoutTieResult, ChampionsLeagueState
    - Définir les constantes CL_CONSTANTS (TOTAL_PARTICIPANTS: 50, QUALIFIED_PER_LEAGUE: 4, etc.)
    - Étendre TrophyType dans `src/core/types.ts` avec 'champions_league'
    - Ajouter les événements CL dans l'EventBus (CL_MATCH_DAY_REACHED, CL_MATCHDAY_COMPLETE, CL_PHASE_COMPLETE, CL_ELIMINATED, CL_TROPHY_WON)
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.4, 3.5, 9.1_

- [x] 2. Implémenter le FillerTeamGenerator
  - [x] 2.1 Créer `src/systems/championsLeague/FillerTeamGenerator.ts`
    - Implémenter la fonction `generate(rng?: RNG): CLParticipant[]` qui retourne exactement 30 équipes filler
    - Chaque équipe a un nom unique, un pays (hors des 5 ligues principales), une averageRating entre 60 et 80, et isFiller = true
    - Utiliser le pattern RNG existant pour la reproductibilité
    - _Requirements: 1.3_

  - [x] 2.2 Écrire le property test pour FillerTeamGenerator
    - **Property 3: Filler generation produces exactly 30 valid teams**
    - **Validates: Requirements 1.3**

- [x] 3. Implémenter la qualification
  - [x] 3.1 Créer `src/systems/championsLeague/qualification.ts`
    - Implémenter `qualify(leagues: LeagueState[], season: number, rng?: RNG): CLParticipant[]`
    - Extraire les 4 premières équipes de chaque ligue (5 ligues × 4 = 20 qualifiés)
    - Appeler FillerTeamGenerator pour les 30 fillers
    - Retourner les 50 participants combinés
    - Déterminer si le club du joueur est qualifié (position ≤ 4)
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 3.2 Écrire les property tests pour la qualification
    - **Property 1: Qualification produces exactly 20 teams from top 4 of each league**
    - **Property 2: Player club qualification is determined by league position**
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5**

- [x] 4. Implémenter le CLScheduleGenerator
  - [x] 4.1 Créer `src/systems/championsLeague/CLScheduleGenerator.ts`
    - Implémenter `generateLeaguePhaseFixtures(participants: CLParticipant[], rng?: RNG): CLFixture[]`
    - Chaque équipe joue 8 matchs (4 dom, 4 ext) contre 8 adversaires différents
    - Implémenter `assignDates(fixtures, season, playerClubSchedule): CLScheduledMatch[]`
    - Assigner les dates mardi/mercredi de septembre à janvier (8 journées)
    - Éviter les conflits avec le calendrier de championnat du joueur
    - _Requirements: 2.2, 2.3, 4.1, 4.2, 4.7_

  - [x] 4.2 Écrire les property tests pour le CLScheduleGenerator
    - **Property 4: Fixture generation gives each team exactly 8 matches against 8 distinct opponents**
    - **Property 9: CL schedule dates are exclusively Tuesday or Wednesday**
    - **Property 10: No CL match conflicts with player's league match**
    - **Validates: Requirements 2.2, 2.3, 4.2, 4.7**

- [x] 5. Checkpoint - Vérifier les fondations
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implémenter le classement et la résolution de la phase de ligue
  - [x] 6.1 Créer `src/systems/championsLeague/standings.ts`
    - Implémenter `updateStandings(state: ChampionsLeagueState, results: CLMatchResult[]): CLStanding[]`
    - Trier par points (3V, 1N, 0D), puis différence de buts, puis buts marqués
    - Implémenter `resolveLeaguePhase(standings: CLStanding[]): CLParticipant[]` retournant le top 16
    - Implémenter la fonction de classification position (1-16 = qualified, 17-50 = eliminated) pour le UI
    - _Requirements: 2.4, 2.5, 2.6, 7.3_

  - [x] 6.2 Écrire les property tests pour le classement
    - **Property 5: Standings are sorted by points, then goal difference, then goals scored**
    - **Property 6: League phase resolution qualifies exactly the top 16**
    - **Property 16: Position classification for UI highlighting**
    - **Validates: Requirements 2.4, 2.5, 2.6, 7.3**

- [x] 7. Implémenter le CLMatchSimulator
  - [x] 7.1 Créer `src/systems/championsLeague/CLMatchSimulator.ts`
    - Implémenter `simulateMatch(home: CLParticipant, away: CLParticipant, rng?: RNG): CLMatchResult`
    - Utiliser la note moyenne de l'effectif pour pondérer les probabilités de victoire
    - Produire des scores réalistes entre 0 et 5 buts par équipe
    - Implémenter `simulateExtraTimeAndPenalties()` pour les matchs à élimination directe
    - _Requirements: 8.3, 8.4, 3.5_

  - [x] 7.2 Écrire les property tests pour le CLMatchSimulator
    - **Property 12: Simulated scores are within realistic bounds (0-5)**
    - **Property 13: Higher-rated teams win more often over many simulations**
    - **Validates: Requirements 8.3, 8.4**

- [x] 8. Implémenter les tours à élimination directe
  - [x] 8.1 Créer `src/systems/championsLeague/knockout.ts`
    - Implémenter `drawKnockoutRound(teams: CLParticipant[], round: KnockoutRound, rng?: RNG): CLKnockoutTie[]`
    - Implémenter `resolveKnockoutTie(firstLeg: CLMatchResult, secondLeg: CLMatchResult, rng?: RNG): CLKnockoutTieResult`
    - Gérer les huitièmes (16→8), quarts (8→4), demi-finales (4→2), finale (match unique)
    - Résoudre les égalités par prolongation puis tirs au but
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 8.2 Écrire les property tests pour les tours éliminatoires
    - **Property 7: Knockout draw produces valid pairings where each team appears exactly once**
    - **Property 8: Tied aggregate in knockout is resolved by extra time or penalties**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5, 3.6**

- [x] 9. Implémenter le ChampionsLeagueSystem principal
  - [x] 9.1 Créer `src/systems/championsLeague/ChampionsLeagueSystem.ts`
    - Assembler tous les sous-modules (qualification, schedule, standings, knockout, simulator)
    - Implémenter `initSeason(participants, season, rng)` qui génère le tirage et le calendrier complet
    - Implémenter `simulateMatchday(state, matchday, playerClubId, rng)` qui simule tous les matchs d'une journée sauf celui du joueur
    - Implémenter `processKnockoutRound()` pour gérer la progression des tours éliminatoires
    - Implémenter `checkTrophy(state, playerClubId, season)` pour l'attribution du trophée
    - Implémenter `reset()` pour la réinitialisation en fin de compétition
    - _Requirements: 5.3, 5.4, 8.1, 8.2, 9.1, 9.2_

  - [x] 9.2 Écrire les property tests pour le système principal
    - **Property 11: All matchday fixtures produce results when simulated**
    - **Property 15: Trophy is awarded if and only if player's club wins the final**
    - **Validates: Requirements 5.3, 8.1, 9.1**

- [x] 10. Checkpoint - Vérifier le système CL complet
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implémenter le championsLeagueSlice (Zustand)
  - [x] 11.1 Créer `src/store/slices/championsLeagueSlice.ts`
    - Définir l'interface ChampionsLeagueSlice avec l'état et les actions
    - Implémenter initChampionsLeague, updateCLStandings, addCLMatchResult
    - Implémenter advanceToKnockout, updateKnockoutResult, setCLEliminated, resetChampionsLeague
    - Intégrer le slice dans le gameStore existant (`src/store/gameStore.ts`) et l'index des slices
    - _Requirements: 7.1, 9.2, 9.3_

  - [x] 11.2 Écrire les unit tests pour le championsLeagueSlice
    - Tester chaque action du slice (init, update standings, add result, advance knockout, eliminate, reset)
    - Vérifier que l'état null quand le joueur ne participe pas
    - _Requirements: 7.1, 9.2, 9.3_

- [x] 12. Intégrer avec le GameLoopOrchestrator
  - [x] 12.1 Modifier `src/core/GameLoopOrchestrator.ts` pour intégrer la Ligue des Champions
    - Étendre `advanceDay()` pour détecter les jours de match CL et proposer "Jouer" ou "Simuler"
    - Étendre `simulateWeek()` pour bloquer si un match CL est programmé dans la semaine
    - Après un match CL joué/simulé : appeler `ChampionsLeagueSystem.simulateMatchday()` pour les autres matchs
    - Appliquer les systèmes fitness, blessure et moral après un match CL (même priorité que championnat)
    - Émettre les événements CL via l'EventBus
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 12.2 Écrire les unit tests pour l'intégration GameLoopOrchestrator
    - Tester que advanceDay détecte un match CL
    - Tester que simulateWeek bloque sur un match CL
    - Tester que les systèmes fitness/blessure/moral sont appliqués après match CL
    - _Requirements: 5.1, 5.2, 5.5_

- [x] 13. Intégrer avec StatsSystem, SocialSystem et Instagram
  - [x] 13.1 Étendre les systèmes existants pour la Ligue des Champions
    - Modifier StatsSystem pour enregistrer les performances CL dans les stats de carrière
    - Ajouter un compteur de buts CL séparé dans PlayerCareerStats
    - Modifier SocialSystem pour générer des posts après un match CL
    - Appliquer le multiplicateur de prestige ×2 pour les gains d'abonnés Instagram en CL
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 13.2 Écrire le property test pour le multiplicateur Instagram
    - **Property 14: Instagram prestige multiplier is exactly 2× for CL matches**
    - **Validates: Requirements 6.4**

  - [x] 13.3 Écrire les unit tests pour l'intégration stats/social
    - Tester l'enregistrement des performances CL
    - Tester le compteur de buts CL séparé
    - Tester la génération de posts sociaux après match CL
    - _Requirements: 6.1, 6.2, 6.5_

- [x] 14. Implémenter le calendrier des tours éliminatoires
  - [x] 14.1 Étendre le CLScheduleGenerator pour les tours éliminatoires
    - Planifier les huitièmes de finale en février-mars
    - Planifier les quarts de finale en avril
    - Planifier les demi-finales en avril-mai
    - Planifier la finale le dernier samedi de mai
    - Respecter la contrainte mardi/mercredi pour les tours éliminatoires (sauf finale)
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [x] 14.2 Écrire les unit tests pour le calendrier des tours éliminatoires
    - Vérifier les mois corrects pour chaque tour
    - Vérifier que la finale est le dernier samedi de mai
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

- [x] 15. Checkpoint - Vérifier l'intégration complète
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Implémenter le composant UI ChampionsLeagueTab
  - [x] 16.1 Créer `src/ui/components/ChampionsLeagueTab.tsx`
    - Implémenter le composant principal avec onglets internes (Classement, Calendrier, Bracket)
    - Implémenter CLStandingsTable : classement 50 équipes, surbrillance vert (1-16) / rouge (17-50)
    - Implémenter CLCalendar : calendrier des matchs CL du joueur avec dates, adversaires, résultats
    - Implémenter CLBracket : tableau des confrontations éliminatoires avec résultats aller-retour
    - Tous les textes en français
    - Afficher conditionnellement l'onglet CL uniquement si le joueur participe
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 16.2 Écrire les unit tests pour le composant ChampionsLeagueTab
    - Tester le rendu conditionnel (onglet masqué si pas de participation)
    - Tester la surbrillance des positions (vert/rouge)
    - Tester l'affichage du bracket en phase éliminatoire
    - _Requirements: 7.1, 7.3, 7.5_

- [x] 17. Implémenter la gestion de l'élimination et du trophée
  - [x] 17.1 Intégrer la fin de compétition dans le flux de jeu
    - Intégrer `TrophySystem` pour ajouter le trophée 'champions_league' si victoire en finale
    - Afficher un message d'élimination quand le club du joueur est éliminé
    - Retirer les matchs CL restants du calendrier après élimination
    - Réinitialiser l'état CL après la finale pour préparer la saison suivante
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 17.2 Écrire les unit tests pour l'élimination et le trophée
    - Tester l'attribution du trophée après victoire en finale
    - Tester le retrait des matchs après élimination
    - Tester la réinitialisation de l'état
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 18. Intégrer la persistance et la validation
  - [x] 18.1 Étendre la sérialisation pour l'état Champions League
    - Ajouter le schéma Zod pour valider ChampionsLeagueState au chargement
    - Intégrer dans le SaveManager existant (`src/persistence/serializer.ts`)
    - Gérer le cas où l'état CL est null (joueur non qualifié)
    - Gérer la migration si une sauvegarde existante n'a pas de champ championsLeague
    - _Requirements: 5.4, 9.2_

- [x] 19. Final checkpoint - Vérifier l'ensemble du système
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Le projet utilise TypeScript, Vite, React, Zustand, Phaser, fast-check et vitest
- Les textes UI doivent être en français (Requirement 7.6)
- Le pattern RNG existant doit être réutilisé pour la reproductibilité des simulations

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "6.1", "7.1"] },
    { "id": 4, "tasks": ["6.2", "7.2", "8.1"] },
    { "id": 5, "tasks": ["8.2", "9.1"] },
    { "id": 6, "tasks": ["9.2", "11.1"] },
    { "id": 7, "tasks": ["11.2", "12.1", "13.1", "14.1"] },
    { "id": 8, "tasks": ["12.2", "13.2", "13.3", "14.2"] },
    { "id": 9, "tasks": ["16.1", "17.1", "18.1"] },
    { "id": 10, "tasks": ["16.2", "17.2"] }
  ]
}
```
