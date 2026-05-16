# Implementation Plan: Football Career Game

## Overview

Ce plan d'implémentation décompose le jeu de carrière footballistique 2D en tâches de développement incrémentales. L'approche suit une progression logique : infrastructure de base → modèles de données → systèmes métier → interface utilisateur → intégration Phaser → tests et finalisation. Chaque tâche construit sur les précédentes pour garantir un code fonctionnel à chaque étape.

## Tasks

- [x] 1. Initialisation du projet et infrastructure de base
  - [x] 1.1 Initialiser le projet Vite + React + TypeScript
    - Créer le projet avec `npm create vite@latest` (template react-ts)
    - Installer les dépendances : phaser, zustand, dexie, tailwindcss, fast-check, vitest
    - Configurer Tailwind CSS avec le fichier de configuration
    - Configurer Vitest dans vite.config.ts
    - Créer la structure de dossiers selon le design (src/core, src/systems, src/store, src/persistence, src/data, src/ui, src/phaser, src/utils)
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Implémenter le EventBus et les types partagés
    - Créer `src/core/EventBus.ts` avec l'interface IEventBus (emit, on, off)
    - Définir l'enum GameEvent avec tous les événements (ADVANCE_DAY, SIMULATE_WEEK, START_MATCH, MATCH_END, etc.)
    - Créer `src/core/types.ts` avec les types partagés (GameDate, Position, Country, ClubTier, etc.)
    - _Requirements: 1.4, 5.1_

  - [x] 1.3 Configurer le Zustand store principal et les slices
    - Créer `src/store/gameStore.ts` avec le store Zustand typé
    - Créer les slices par domaine : playerSlice, careerSlice, timeSlice, socialSlice, financeSlice, leagueSlice
    - Implémenter les selectors de base dans `src/store/selectors.ts`
    - _Requirements: 17.1, 17.2_

  - [x] 1.4 Configurer Dexie.js et la base IndexedDB
    - Créer `src/persistence/database.ts` avec la classe FootballCareerDB
    - Définir les tables : saves, clubs, players, leagues avec leurs index
    - Créer `src/persistence/SaveManager.ts` avec l'interface ISaveManager (saveGame, loadGame, listSaves, deleteSave)
    - Implémenter la gestion de 3 slots de sauvegarde maximum
    - _Requirements: 17.1, 17.2, 17.3, 17.4_


- [x] 2. Modèles de données et sérialisation
  - [x] 2.1 Implémenter les interfaces et modèles de données
    - Créer `src/core/types.ts` complet avec toutes les interfaces : PlayerCharacter, PlayerStats, Club, SquadPlayer, Division, Contract, Trophy, GameState, CareerState, TimeState, SocialState, FinanceState, LeagueState, LeagueStanding, MatchResult, MatchPerformance
    - Définir les types utilitaires : InjuryState, InjuryType, PlayerAppearance, TransferOffer, RandomEvent, EventEffects
    - _Requirements: 2.2, 3.3, 8.1, 8.3_

  - [x] 2.2 Implémenter le sérialiseur/désérialiseur d'état de jeu
    - Créer `src/persistence/serializer.ts` avec les fonctions serialize(state: GameState): string et deserialize(json: string): GameState
    - Implémenter la validation de schéma avec Zod pour la désérialisation
    - Gérer les cas d'erreur : JSON invalide, données corrompues, version incompatible
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [x] 2.3 Write property test for round-trip serialization
    - **Property 1: Sérialisation aller-retour (Round-trip)**
    - Créer un arbitrary pour GameState valide
    - Vérifier que serialize(deserialize(serialize(state))) === serialize(state)
    - **Validates: Requirements 18.1, 18.2, 18.3, 18.4**

  - [x] 2.4 Créer les données statiques des clubs réels
    - Créer `src/data/clubs/france.ts` avec les clubs français (Ligue 1, Ligue 2) classés par tier
    - Créer `src/data/clubs/spain.ts` avec les clubs espagnols (La Liga, Segunda)
    - Créer `src/data/clubs/england.ts` avec les clubs anglais (Premier League, Championship)
    - Créer `src/data/clubs/italy.ts` avec les clubs italiens (Serie A, Serie B)
    - Créer `src/data/clubs/germany.ts` avec les clubs allemands (Bundesliga, 2. Bundesliga)
    - Chaque club avec : nom, pays, division, tier, effectif (joueurs avec nom, poste, âge, note), couleurs, stade
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.5 Write property test for club data integrity
    - **Property 2: Intégrité des données de clubs**
    - Vérifier que chaque club a un tier valide, un pays valide, un effectif non-vide, et des joueurs avec postes et notes valides
    - **Validates: Requirements 3.1, 3.2, 3.3**


- [x] 3. Système de Statistiques et Progression
  - [x] 3.1 Implémenter le StatsSystem
    - Créer `src/systems/stats/StatsSystem.ts` avec l'interface IStatsSystem
    - Implémenter calculateOverallRating(stats: PlayerStats): number (pondéré par poste, résultat 1-99)
    - Implémenter getProgressionRate(currentRating, potential): facteur de progression
    - Implémenter applyAgingDecay(age, stats): décroissance physique après 30 ans
    - _Requirements: 8.3, 8.4, 8.5, 16.2, 16.3, 16.4_

  - [x] 3.2 Implémenter le ProgressionEngine
    - Créer `src/systems/stats/ProgressionEngine.ts`
    - Implémenter la génération de statistiques initiales par poste (attaquant: tir > défense, défenseur: défense > tir, etc.)
    - Implémenter updateStatsAfterTraining(session): augmentation ciblée avec facteur potentiel
    - Implémenter updateStatsAfterMatch(performance): progression basée sur la performance
    - Appliquer le ralentissement à 80% du potentiel (facteur_potentiel *= 0.3)
    - _Requirements: 2.3, 6.3, 16.2, 16.3_

  - [x] 3.3 Write property test for initial stats consistency
    - **Property 3: Statistiques initiales cohérentes avec le poste**
    - Vérifier que les stats initiales sont pondérées selon le poste
    - **Validates: Requirements 2.3**

  - [x] 3.4 Write property test for potential ceiling
    - **Property 4: Invariant du potentiel comme plafond**
    - Vérifier qu'aucune stat ne dépasse le potentiel après progression
    - **Validates: Requirements 8.5, 16.2**

  - [x] 3.5 Write property test for progression slowdown
    - **Property 5: Ralentissement de progression à 80% du potentiel**
    - Vérifier que le taux de progression diminue au-delà de 80% du potentiel
    - **Validates: Requirements 16.3**

  - [x] 3.6 Write property test for aging decay
    - **Property 6: Décroissance physique après 30 ans**
    - Vérifier que les stats physiques diminuent proportionnellement à (âge - 30)
    - **Validates: Requirements 16.4**

  - [x] 3.7 Write property test for overall rating bounds
    - **Property 25: Note globale dans l'intervalle [1, 99]**
    - Vérifier que calculateOverallRating retourne toujours une valeur dans [1, 99]
    - **Validates: Requirements 8.3**

- [x] 4. Checkpoint - Vérifier les fondations
  - Ensure all tests pass, ask the user if questions arise.


- [x] 5. Système Social et Relations
  - [x] 5.1 Implémenter le SocialSystem
    - Créer `src/systems/social/SocialSystem.ts` avec l'interface ISocialSystem
    - Implémenter la gestion des scores : popularité (0-100), réputation (0-100), relation entraîneur (0-100), relation vestiaire (0-100)
    - Implémenter la logique de mise à jour des scores avec clamping [0, 100]
    - Implémenter l'impact de la performance sur la popularité (note > 8 → augmente, note < 4 → diminue)
    - _Requirements: 10.1, 10.2, 10.3, 13.1, 13.2_

  - [x] 5.2 Implémenter le SocialFeedGenerator et InterviewGenerator
    - Créer `src/systems/social/SocialFeedGenerator.ts` pour générer des publications fictives (fans, journalistes, joueurs)
    - Créer `src/systems/social/InterviewGenerator.ts` pour générer des interviews contextuelles
    - Chaque question d'interview propose 3 réponses (humble, confiant, controversé) avec impacts sur les scores
    - Implémenter la génération de réactions négatives pour les réponses controversées
    - _Requirements: 11.1, 11.2, 11.4, 12.1, 12.2, 12.3, 12.4_

  - [x] 5.3 Write property test for bounded scores
    - **Property 7: Scores bornés entre 0 et 100**
    - Vérifier que popularité, réputation, relation entraîneur et vestiaire restent dans [0, 100]
    - **Validates: Requirements 10.1, 13.1, 13.2**

  - [x] 5.4 Write property test for performance-popularity monotonicity
    - **Property 8: Performance influence monotoniquement la popularité**
    - Vérifier que note > 8 augmente la popularité et note < 4 la diminue
    - **Validates: Requirements 10.2, 10.3**

  - [x] 5.5 Write property test for interview answers
    - **Property 23: Interview génère exactement 3 réponses par question**
    - Vérifier que chaque question a 3 réponses avec tons distincts
    - **Validates: Requirements 12.1, 12.2**

  - [x] 5.6 Write property test for controversial answers
    - **Property 24: Réponse controversée génère réactions négatives**
    - Vérifier qu'une réponse controversée génère au moins un post négatif
    - **Validates: Requirements 12.4**


- [x] 6. Système de Championnat et Classement
  - [x] 6.1 Implémenter le système de championnat
    - Créer `src/systems/career/PromotionEngine.ts`
    - Implémenter la gestion des divisions par pays (au moins 2 niveaux par pays)
    - Implémenter le calcul du classement : points (3V, 1N, 0D), différence de buts, buts marqués
    - Implémenter la mise à jour du classement après chaque journée
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.2 Implémenter les promotions et relégations
    - Implémenter la logique de fin de saison : zones de promotion (top N) et relégation (bottom M)
    - Gérer le transfert des clubs entre divisions
    - Mettre à jour les effectifs et les calendriers pour la nouvelle saison
    - _Requirements: 4.3, 4.5_

  - [x] 6.3 Write property test for standings calculation
    - **Property 9: Calcul correct du classement**
    - Vérifier que les points, différence de buts et buts marqués sont correctement calculés
    - **Validates: Requirements 4.2, 4.4**

  - [x] 6.4 Write property test for promotions and relegations
    - **Property 10: Promotions et relégations correctes**
    - Vérifier que les équipes en zone de promotion/relégation sont correctement déplacées
    - **Validates: Requirements 4.3, 4.5**

- [x] 7. Moteur de Match
  - [x] 7.1 Implémenter le MatchEngine et le simulateur IA
    - Créer `src/systems/match/MatchEngine.ts` avec l'interface IMatchEngine
    - Créer `src/systems/match/AIMatchSimulator.ts` pour simuler les matchs IA vs IA (distribution de Poisson)
    - Implémenter simulateAIMatch(homeTeam, awayTeam): MatchResult avec facteur domicile (1.1)
    - _Requirements: 4.2, 5.2_

  - [x] 7.2 Implémenter le ActionResolver pour les matchs joueur
    - Créer `src/systems/match/ActionResolver.ts`
    - Implémenter la résolution d'actions : probabilité = stat_joueur / (stat_joueur + stat_adversaire)
    - Appliquer les modificateurs : forme (fitness/100), moral (morale/100), timing du joueur (perfect: +0.15, good: +0.05)
    - Borner la probabilité finale entre [0.05, 0.95]
    - _Requirements: 5.3, 5.4_

  - [x] 7.3 Implémenter le MatchSimulator pour les matchs interactifs
    - Créer `src/systems/match/MatchSimulator.ts`
    - Implémenter la génération d'actions clés (tir, passe, dribble, tacle) pendant le match
    - Calculer les performances individuelles (buts, passes, note 1-10)
    - Enregistrer les résultats dans le StatsSystem
    - _Requirements: 5.2, 5.3, 5.5_

  - [x] 7.4 Write property test for action resolution bounds
    - **Property 11: Résolution d'action bornée et monotone**
    - Vérifier que la probabilité est dans [0.05, 0.95] et monotone par rapport aux stats
    - **Validates: Requirements 5.4**


- [x] 8. Système d'Entraînement et Blessures
  - [x] 8.1 Implémenter le TrainingSystem
    - Créer `src/systems/training/TrainingSystem.ts`
    - Implémenter les sessions d'entraînement ciblant des compétences spécifiques (vitesse, tir, passe, dribble, défense)
    - Implémenter les niveaux d'intensité (faible, moyen, élevé) avec impact proportionnel sur la progression
    - Gérer les exercices de rééducation pour les joueurs blessés
    - Intégrer avec le ProgressionEngine pour la mise à jour des stats
    - _Requirements: 6.1, 6.2, 6.3, 9.4_

  - [x] 8.2 Implémenter le InjurySystem
    - Créer `src/systems/injury/InjurySystem.ts`
    - Implémenter l'évaluation de probabilité de blessure post-match (basée sur intensité et fatigue)
    - Implémenter le risque accru après 3 sessions intensives consécutives
    - Déterminer le type de blessure (muscle, ligament, fracture, etc.) et la durée en semaines
    - Gérer la récupération et la réduction temporaire des stats physiques au retour
    - Exclure le joueur blessé des matchs et de l'entraînement normal
    - _Requirements: 6.4, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 8.3 Write property test for training progression
    - **Property 15: Entraînement augmente les compétences ciblées**
    - Vérifier que la compétence ciblée augmente proportionnellement à l'intensité
    - **Validates: Requirements 6.3**

  - [x] 8.4 Write property test for injury risk after intensive training
    - **Property 16: Risque de blessure après entraînement intensif**
    - Vérifier que 3 sessions intensives consécutives augmentent le risque de blessure
    - **Validates: Requirements 6.4**

  - [x] 8.5 Write property test for injured player exclusion
    - **Property 17: Joueur blessé exclu des matchs et entraînement normal**
    - Vérifier que le joueur blessé ne peut pas jouer ni s'entraîner normalement
    - **Validates: Requirements 9.3, 9.4**

- [x] 9. Checkpoint - Vérifier les systèmes métier
  - Ensure all tests pass, ask the user if questions arise.


- [x] 10. Système de Transferts et Finances
  - [x] 10.1 Implémenter le TransferSystem
    - Créer `src/systems/transfer/TransferSystem.ts` avec l'interface ITransferSystem
    - Implémenter generateOffers : calcul d'attractivité (rating * 0.4 + popularity * 0.3 + age_factor * 0.3)
    - Filtrer les clubs éligibles par tier correspondant au niveau du joueur
    - Implémenter acceptOffer : transfert du joueur, mise à jour du contrat et de l'effectif
    - Implémenter rejectOffer : maintien de l'état actuel
    - Implémenter simulateAITransfers pour les transferts entre clubs IA
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 3.6_

  - [x] 10.2 Implémenter le FinanceSystem
    - Créer `src/systems/finance/FinanceSystem.ts`
    - Implémenter le crédit du salaire hebdomadaire
    - Gérer les transactions : salaire, bonus, prime de signature, sponsoring, amendes
    - Implémenter la négociation de contrat (durée, salaire, primes ajustables)
    - Gérer l'expiration de contrat et la phase de négociation/transfert libre
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 10.3 Write property test for transfer offer quality
    - **Property 12: Qualité des offres de transfert corrélée au niveau du joueur**
    - Vérifier que les offres proviennent de clubs de tier cohérent et salaire >= salaire actuel
    - **Validates: Requirements 7.1, 7.5**

  - [x] 10.4 Write property test for transfer acceptance
    - **Property 13: Accepter un transfert met à jour l'état correctement**
    - Vérifier que le joueur est dans le nouveau club avec le bon contrat
    - **Validates: Requirements 7.3**

  - [x] 10.5 Write property test for transfer rejection
    - **Property 14: Refuser toutes les offres préserve l'état**
    - Vérifier que l'état reste inchangé après refus
    - **Validates: Requirements 7.4**

  - [x] 10.6 Write property test for weekly salary
    - **Property 21: Salaire crédité chaque semaine**
    - Vérifier que le solde augmente exactement du salaire hebdomadaire
    - **Validates: Requirements 15.1, 15.2**

  - [x] 10.7 Write property test for coach relation and playtime
    - **Property 22: Relation entraîneur influence le temps de jeu**
    - Vérifier que relation < 30 réduit le temps de jeu et relation > 70 l'augmente
    - **Validates: Requirements 13.3, 13.4**


- [x] 11. Système Temporel et Événements Aléatoires
  - [x] 11.1 Implémenter le TimeSystem
    - Créer `src/systems/time/TimeSystem.ts` avec l'interface ITimeSystem
    - Implémenter advanceDay() : avancer d'un jour, évaluer les événements, vérifier si jour de match
    - Implémenter simulateWeek() : simuler tous les jours jusqu'au prochain match, générer un résumé
    - Implémenter getDaysUntilNextMatch() et getScheduleForWeek()
    - Gérer le calendrier des matchs et l'interruption automatique les jours de match
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [x] 11.2 Implémenter le RandomEventEngine
    - Créer `src/systems/time/RandomEventEngine.ts` avec l'interface IRandomEventEngine
    - Implémenter evaluateDay() : 15% de probabilité par jour, maximum 3 par semaine
    - Implémenter les catégories pondérées : financier (25%), physique (25%), social (30%), relationnel (20%)
    - Implémenter applyEventEffects() : appliquer les effets sur les attributs (argent, forme, relations, popularité)
    - Gérer les événements avec choix (EventChoice) pour le joueur
    - Reset du compteur hebdomadaire chaque lundi
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7_

  - [x] 11.3 Write property test for max events per week
    - **Property 18: Maximum trois événements aléatoires par semaine**
    - Vérifier que le nombre d'événements ne dépasse jamais 3 par semaine
    - **Validates: Requirements 21.7**

  - [x] 11.4 Write property test for event effects application
    - **Property 19: Effets des événements aléatoires appliqués correctement**
    - Vérifier que les attributs changent exactement du montant spécifié (en respectant les bornes)
    - **Validates: Requirements 21.4**

  - [x] 11.5 Write property test for day-by-day vs week simulation consistency
    - **Property 20: Cohérence entre simulation jour-par-jour et simulation semaine**
    - Vérifier que 7 appels advanceDay produit le même état que 1 appel simulateWeek
    - **Validates: Requirements 20.3, 20.4, 21.5, 21.6**


- [x] 12. Système de Carrière (orchestration)
  - [x] 12.1 Implémenter le CareerSystem
    - Créer `src/systems/career/CareerSystem.ts`
    - Implémenter la création de personnage : génération de stats initiales par poste, attribution du potentiel (basé sur tier + aléatoire)
    - Implémenter l'association joueur-club : intégration dans l'effectif, génération du contrat initial
    - Implémenter la gestion du temps de jeu basée sur la relation entraîneur
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.5, 16.1_

  - [x] 12.2 Implémenter le ContractManager
    - Créer `src/systems/career/ContractManager.ts`
    - Implémenter la gestion d'expiration de contrat
    - Implémenter la négociation (durée, salaire, primes)
    - Gérer les transferts libres en fin de contrat
    - _Requirements: 15.3, 15.5_

  - [x] 12.3 Implémenter le système de trophées
    - Implémenter l'attribution de trophées collectifs (championnat, coupe) en fin de saison
    - Implémenter l'attribution de trophées individuels (meilleur buteur, meilleur joueur) basés sur les stats
    - Augmenter la popularité lors de l'obtention d'un trophée
    - _Requirements: 14.1, 14.2, 14.4_

- [x] 13. Checkpoint - Vérifier tous les systèmes métier intégrés
  - Ensure all tests pass, ask the user if questions arise.


- [x] 14. Interface Utilisateur React - Écrans principaux
  - [x] 14.1 Implémenter le MainMenu et le router
    - Créer `src/App.tsx` avec le routeur principal (React Router ou navigation par état)
    - Créer `src/ui/screens/MainMenu.tsx` : nouvelle partie, charger partie, options
    - Configurer Tailwind CSS avec le thème mobile-first (couleurs vives, contrastes élevés)
    - Implémenter les transitions animées entre écrans (200-400ms)
    - _Requirements: 1.1, 1.3, 1.5, 19.1, 19.3_

  - [x] 14.2 Implémenter l'écran de création de personnage
    - Créer `src/ui/screens/CharacterCreation.tsx`
    - Formulaire : nom, prénom, nationalité (5 pays), poste (10 positions), apparence (skin, cheveux, taille)
    - Éléments tactiles minimum 44x44px
    - Validation et transition vers la sélection de club
    - _Requirements: 2.1, 2.2, 1.3_

  - [x] 14.3 Implémenter l'écran de sélection de club
    - Créer `src/ui/screens/ClubSelection.tsx`
    - Afficher les 3 tiers avec filtrage par pays
    - Pour chaque club : nom, pays, division, aperçu de l'effectif, couleurs
    - Confirmation de sélection et génération du contrat initial
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 14.4 Implémenter le Dashboard principal
    - Créer `src/ui/screens/Dashboard.tsx`
    - Afficher : date actuelle, jour de la semaine, jours avant prochain match
    - Boutons "Jour suivant" et "Simuler la semaine"
    - Navigation vers : entraînement, transferts, statistiques, social, trophées
    - Notifications d'événements aléatoires
    - _Requirements: 20.1, 20.2, 20.5, 20.6, 21.3_

  - [x] 14.5 Implémenter l'écran d'entraînement
    - Créer `src/ui/screens/Training.tsx`
    - Afficher les sessions disponibles pour la semaine
    - Choix de compétence ciblée et d'intensité
    - Affichage des exercices de rééducation si blessé
    - Résultat de la session avec progression visible
    - _Requirements: 6.1, 6.2, 9.4_

  - [x] 14.6 Implémenter l'écran de transferts
    - Créer `src/ui/screens/Transfers.tsx`
    - Afficher les offres reçues : club, salaire, durée, division
    - Boutons accepter/refuser pour chaque offre
    - Indicateur de fenêtre de transfert ouverte/fermée
    - _Requirements: 7.2, 7.3, 7.4_


- [x] 15. Interface Utilisateur React - Écrans secondaires
  - [x] 15.1 Implémenter l'écran de statistiques
    - Créer `src/ui/screens/Statistics.tsx`
    - Afficher les stats par match, par saison et carrière complète
    - Graphiques de progression (note globale, compétences)
    - Tableaux de performances détaillées
    - _Requirements: 8.1, 8.2_

  - [x] 15.2 Implémenter l'écran de réseau social fictif
    - Créer `src/ui/screens/SocialFeed.tsx`
    - Fil d'actualité avec publications de fans, journalistes, joueurs
    - Option de publication par le joueur (choix parmi options prédéfinies)
    - Affichage des likes et du sentiment (positif/neutre/négatif)
    - _Requirements: 11.1, 11.3, 11.4_

  - [x] 15.3 Implémenter l'écran d'interview
    - Créer `src/ui/screens/Interview.tsx`
    - Afficher la question contextuelle
    - Proposer 3 réponses avec indication du ton
    - Afficher l'impact sur les scores après réponse
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 15.4 Implémenter la vitrine de trophées et le profil financier
    - Créer `src/ui/screens/TrophyCase.tsx` : vitrine avec trophées collectifs et individuels par saison
    - Intégrer l'affichage financier dans le Dashboard : solde, historique des revenus, détails du contrat
    - _Requirements: 14.3, 15.4_

  - [x] 15.5 Implémenter l'écran de classement du championnat
    - Créer un composant de classement affichant : position, club, matchs joués, V/N/D, buts pour/contre, points
    - Mise à jour après chaque journée
    - Indicateurs visuels pour zones de promotion et relégation
    - _Requirements: 4.4_

  - [x] 15.6 Implémenter les écrans de match (pré-match et résumé)
    - Créer `src/ui/screens/MatchPreview.tsx` : composition des équipes, stats comparatives
    - Créer `src/ui/screens/MatchSummary.tsx` : résultat, performances individuelles, note du joueur
    - _Requirements: 5.5_


- [x] 16. Intégration Phaser 3 - Match 2D interactif
  - [x] 16.1 Configurer Phaser 3 et le composant wrapper React
    - Créer `src/phaser/config.ts` avec la configuration Phaser (type: AUTO, responsive, 30+ FPS)
    - Créer `src/phaser/PhaserGame.tsx` : composant React qui monte/démonte le canvas Phaser
    - Créer `src/phaser/scenes/BootScene.ts` et `src/phaser/scenes/PreloadScene.ts`
    - Connecter Phaser au EventBus pour la communication avec React
    - _Requirements: 1.4, 5.1, 5.6_

  - [x] 16.2 Implémenter la scène de match 2D
    - Créer `src/phaser/scenes/MatchScene.ts`
    - Implémenter le terrain 2D (vue de dessus stylisée)
    - Créer `src/phaser/entities/Pitch.ts`, `src/phaser/entities/Player.ts`, `src/phaser/entities/Ball.ts`
    - Animer les joueurs et le ballon avec des sprites vectoriels simples
    - Implémenter le déroulement du match en temps accéléré (< 5 minutes réelles)
    - _Requirements: 5.1, 5.2, 5.6, 19.1_

  - [x] 16.3 Implémenter les interactions joueur pendant le match
    - Détecter les moments d'action clé (tir, passe décisive, dribble)
    - Afficher une interface d'interaction (bouton tactile ou touche clavier) avec timing
    - Envoyer l'input du joueur au ActionResolver via EventBus
    - Afficher le résultat de l'action avec animation
    - _Requirements: 5.3, 5.4_

- [x] 17. Checkpoint - Vérifier l'intégration UI et Phaser
  - Ensure all tests pass, ask the user if questions arise.


- [x] 18. Intégration complète et wiring
  - [x] 18.1 Connecter tous les systèmes via le EventBus
    - Câbler les événements entre TimeSystem et les autres systèmes (match, entraînement, transferts)
    - Connecter le SocialSystem aux événements de match et de carrière
    - Connecter le FinanceSystem au TimeSystem pour le crédit hebdomadaire
    - Connecter le InjurySystem au MatchEngine et au TrainingSystem
    - Synchroniser le Zustand store avec IndexedDB via Dexie.js (sauvegarde automatique après actions significatives)
    - _Requirements: 17.1, 20.5_

  - [x] 18.2 Implémenter le flux complet de jeu
    - Câbler le flux : création personnage → sélection club → dashboard → avancement temps → match → résumé
    - Gérer les transitions entre les fenêtres de transfert et les saisons
    - Implémenter la fin de saison : calcul classement, promotions/relégations, trophées, renouvellement contrats
    - Gérer le cycle complet d'une carrière multi-saisons
    - _Requirements: 2.4, 3.5, 4.3, 14.1, 14.2_

  - [x] 18.3 Implémenter l'accessibilité et le responsive design
    - Vérifier le ratio de contraste minimum 4.5:1 (WCAG 2.1 AA) sur tous les écrans
    - Vérifier la taille minimale des éléments tactiles (44x44px)
    - Tester le responsive de 320px à 2560px
    - Typographie minimale 16px pour le corps de texte mobile
    - Icônes nettes sur écrans haute densité (2x, 3x)
    - _Requirements: 1.1, 1.3, 19.2, 19.4, 19.5_

  - [x] 18.4 Write integration tests for full game flow
    - Tester le flux création → sélection club → premier match
    - Tester un cycle complet de saison (simulation)
    - Tester sauvegarde/chargement avec vérification d'intégrité
    - Tester avancement jour par jour vs simulation semaine
    - _Requirements: 2.1, 2.4, 3.5, 17.1, 17.2, 20.1, 20.2_

- [x] 19. Utilitaires et polish
  - [x] 19.1 Implémenter les utilitaires partagés
    - Créer `src/utils/random.ts` : générateur aléatoire seedable pour la reproductibilité des tests
    - Créer `src/utils/math.ts` : fonctions clamp, distribution de Poisson, calculs statistiques
    - Créer `src/utils/formatters.ts` : formatage des dates (GameDate), nombres, monnaie
    - _Requirements: 5.4, 21.1_

  - [x] 19.2 Implémenter la gestion d'erreurs globale
    - Implémenter la détection d'indisponibilité IndexedDB au démarrage
    - Afficher les messages d'erreur explicites pour stockage indisponible/corrompu
    - Implémenter la validation Zod au chargement des sauvegardes
    - Gérer le dépassement de capacité IndexedDB
    - _Requirements: 17.3, 18.2_

- [x] 20. Final checkpoint - Vérification complète
  - Ensure all tests pass, ask the user if questions arise.


## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties defined in the design document
- Unit tests validate specific examples and edge cases
- Le projet utilise TypeScript avec Phaser 3 (matchs 2D), React 18 (UI), Vite 5 (bundler), Zustand (state), Dexie.js (IndexedDB), Tailwind CSS (styling), Vitest + fast-check (tests)
- Les données de clubs réels doivent être maintenues à jour pour l'immersion
- La sauvegarde automatique via IndexedDB est critique pour l'expérience mobile (pas de perte de progression)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "2.4", "19.1"] },
    { "id": 3, "tasks": ["2.2", "2.5", "3.1", "3.2"] },
    { "id": 4, "tasks": ["2.3", "3.3", "3.4", "3.5", "3.6", "3.7"] },
    { "id": 5, "tasks": ["5.1", "6.1", "7.1", "8.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.4", "6.2", "7.2", "7.3", "8.2"] },
    { "id": 7, "tasks": ["5.5", "5.6", "6.3", "6.4", "7.4", "8.3", "8.4", "8.5"] },
    { "id": 8, "tasks": ["10.1", "10.2", "11.1", "11.2"] },
    { "id": 9, "tasks": ["10.3", "10.4", "10.5", "10.6", "10.7", "11.3", "11.4", "11.5"] },
    { "id": 10, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 11, "tasks": ["14.1", "14.2", "14.3", "14.4", "14.5", "14.6"] },
    { "id": 12, "tasks": ["15.1", "15.2", "15.3", "15.4", "15.5", "15.6"] },
    { "id": 13, "tasks": ["16.1"] },
    { "id": 14, "tasks": ["16.2", "16.3"] },
    { "id": 15, "tasks": ["18.1", "18.2", "18.3", "19.2"] },
    { "id": 16, "tasks": ["18.4"] }
  ]
}
```
