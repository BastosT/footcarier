# Requirements Document

## Introduction

Ce document décrit les exigences pour la version 2 de la boucle de gameplay du jeu de carrière footballistique. Cette itération intègre les systèmes backend existants (MatchEngine, StatsSystem, TransferSystem, FinanceSystem, TimeSystem, SocialSystem) dans une boucle de jeu cohérente avec une interface utilisateur repensée. Les fonctionnalités principales incluent : un système de ligue complet avec calendrier de matchs, un écran principal redessiné avec navigation par onglets, la création d'avatar visible, un vestiaire avec moral d'équipe, un entraînement hebdomadaire significatif, une simulation de match enrichie avec options jouer/simuler, et la consultation des classements et meilleurs buteurs de tous les championnats.

## Glossary

- **Système_de_Ligue** : Le module qui gère le calendrier complet de la saison, les journées de championnat et les résultats de tous les matchs pour chaque ligue
- **Écran_Principal** : L'écran central du jeu affichant l'avatar du joueur, le classement et la navigation vers les différentes sections
- **Navigation_Inférieure** : La barre de navigation fixe en bas de l'écran avec des icônes menant aux différentes sections du jeu
- **Vestiaire** : L'écran affichant les joueurs de l'équipe du Joueur_Personnage avec le moral collectif et l'ambiance
- **Système_de_Match** : Le module qui gère la simulation de match (option simuler ou jouer), les actions en cours de match et les statistiques post-match
- **Système_d_Entraînement** : Le module qui gère la session d'entraînement hebdomadaire unique avec un impact significatif sur la compétence ciblée
- **Système_de_Classement** : Le module qui calcule et affiche les classements de tous les championnats et le meilleur buteur
- **Avatar** : La représentation visuelle du Joueur_Personnage créée au début de la partie et affichée sur l'Écran_Principal
- **Moral_Équipe** : Un indicateur collectif reflétant l'ambiance du vestiaire, influencé par les résultats et la relation avec l'entraîneur
- **Fitness** : La condition physique du Joueur_Personnage (0-100) qui diminue pendant les matchs et récupère d'environ 1 point par jour
- **Meilleur_Buteur** : Le classement des buteurs du championnat du Joueur_Personnage
- **Discours_Coach** : Le message de l'entraîneur affiché avant le match dans l'écran pré-match
- **Interview_Post_Match** : L'interview optionnelle proposée au joueur après un match

## Requirements

### Requirement 1: Système de Ligue avec Calendrier Complet

**User Story:** As a player, I want my team to play in a full league season with 18 teams and a complete match calendar, so that I experience a realistic championship progression.

#### Acceptance Criteria

1. THE Système_de_Ligue SHALL organiser chaque championnat avec exactement 18 équipes par ligue
2. THE Système_de_Ligue SHALL gérer un championnat par pays (Ligue 1 pour la France, Premier League pour l'Angleterre, La Liga pour l'Espagne, Serie A pour l'Italie, Bundesliga pour l'Allemagne)
3. WHEN une nouvelle saison commence, THE Système_de_Ligue SHALL générer un calendrier complet de 34 journées (aller-retour) pour chaque championnat
4. WHEN une journée de championnat est atteinte, THE Système_de_Ligue SHALL simuler les résultats de tous les matchs de la journée pour toutes les ligues
5. WHEN les résultats d'une journée sont calculés, THE Système_de_Classement SHALL mettre à jour les classements de toutes les ligues immédiatement
6. THE Système_de_Ligue SHALL associer le club du Joueur_Personnage au championnat correspondant au pays du club

---

### Requirement 2: Consultation des Classements par Championnat

**User Story:** As a player, I want to view the standings of each championship separately (Ligue 1, Premier League, La Liga, Serie A, Bundesliga), so that I can follow each league independently.

#### Acceptance Criteria

1. THE Système_de_Classement SHALL afficher le classement complet du championnat du Joueur_Personnage par défaut avec position, points, victoires, nuls, défaites, buts marqués et encaissés
2. THE Interface_Utilisateur SHALL permettre de naviguer entre les 5 championnats via des onglets ou un sélecteur (Ligue 1, Premier League, La Liga, Serie A, Bundesliga)
3. WHEN le joueur sélectionne un championnat, THE Interface_Utilisateur SHALL afficher le classement de ce championnat spécifique avec ses 18 équipes triées par points, puis par différence de buts, puis par buts marqués
4. WHEN une journée de championnat est jouée, THE Système_de_Classement SHALL mettre à jour le classement du championnat concerné automatiquement
5. THE Interface_Utilisateur SHALL indiquer visuellement dans quel championnat joue le Joueur_Personnage (mise en surbrillance de son championnat)

---

### Requirement 3: Classement des Meilleurs Buteurs

**User Story:** As a player, I want to see the top scorers of my championship, so that I can track my goal-scoring performance against competitors.

#### Acceptance Criteria

1. THE Système_de_Classement SHALL maintenir un classement des buteurs pour le championnat du Joueur_Personnage
2. THE Système_de_Classement SHALL inclure le Joueur_Personnage dans le classement des buteurs avec ses buts marqués en championnat
3. WHEN un match de championnat est joué, THE Système_de_Classement SHALL mettre à jour le classement des buteurs avec les buts marqués lors de cette journée
4. THE Interface_Utilisateur SHALL afficher le classement des buteurs avec le nom du joueur, son club et son nombre de buts

---

### Requirement 4: Vestiaire et Moral d'Équipe

**User Story:** As a player, I want to view my team's squad and see the team morale evolve based on results and coach relationship, so that I feel connected to my club.

#### Acceptance Criteria

1. THE Vestiaire SHALL afficher la liste complète des joueurs de l'équipe du Joueur_Personnage avec leur nom, poste, âge et note globale
2. THE Vestiaire SHALL afficher un indicateur de Moral_Équipe sur une échelle de 0 à 100
3. WHEN le club du Joueur_Personnage remporte un match, THE Système_Social SHALL augmenter le Moral_Équipe
4. WHEN le club du Joueur_Personnage perd un match, THE Système_Social SHALL diminuer le Moral_Équipe
5. WHEN la relation entre le Joueur_Personnage et l'entraîneur change, THE Système_Social SHALL ajuster le Moral_Équipe proportionnellement
6. THE Interface_Utilisateur SHALL afficher le Moral_Équipe avec un indicateur visuel (couleur ou jauge) reflétant le niveau actuel

---

### Requirement 5: Entraînement Hebdomadaire Unique et Significatif

**User Story:** As a player, I want one impactful training session per week that significantly boosts the targeted skill, so that each training choice feels meaningful.

#### Acceptance Criteria

1. THE Système_d_Entraînement SHALL limiter le joueur à exactement une session d'entraînement par semaine
2. THE Système_d_Entraînement SHALL proposer le choix de la compétence à entraîner parmi : vitesse, tir, passe, dribble, défense, physique
3. WHEN le joueur complète sa session d'entraînement hebdomadaire, THE Système_de_Statistiques SHALL augmenter la compétence ciblée d'un montant significatif (entre 1 et 3 points selon le potentiel restant)
4. WHEN le joueur a déjà effectué sa session d'entraînement de la semaine, THE Système_d_Entraînement SHALL désactiver l'option d'entraînement jusqu'à la semaine suivante
5. THE Interface_Utilisateur SHALL indiquer clairement si la session d'entraînement de la semaine est disponible ou déjà utilisée

---

### Requirement 6: Option Simuler le Match

**User Story:** As a player, I want the option to simulate a match instead of playing it, so that I can progress quickly when I prefer.

#### Acceptance Criteria

1. WHEN un jour de match est atteint, THE Interface_Utilisateur SHALL proposer deux options : "Jouer le match" et "Simuler le match"
2. WHEN le joueur choisit de simuler, THE Système_de_Match SHALL calculer le résultat en favorisant l'équipe la plus forte (moyenne des notes de l'effectif)
3. WHEN le match est simulé, THE Système_de_Match SHALL générer une performance automatique pour le Joueur_Personnage basée sur sa note globale et sa Fitness
4. WHEN le match simulé est terminé, THE Interface_Utilisateur SHALL afficher le score final et les statistiques du Joueur_Personnage avant de retourner à l'Écran_Principal

---

### Requirement 7: Match Joué - Écran Pré-Match

**User Story:** As a player, I want to see pre-match information with a coach speech before playing, so that I feel immersed in the match atmosphere.

#### Acceptance Criteria

1. WHEN le joueur choisit de jouer le match, THE Interface_Utilisateur SHALL afficher un écran pré-match avec les informations des deux équipes
2. THE Interface_Utilisateur SHALL afficher le Discours_Coach avec un message contextuel basé sur l'importance du match et la relation avec l'entraîneur
3. THE Interface_Utilisateur SHALL afficher la Fitness actuelle du Joueur_Personnage et sa note globale sur l'écran pré-match
4. WHEN le joueur confirme le lancement du match, THE Système_de_Match SHALL démarrer la simulation interactive

---

### Requirement 8: Match Joué - Déroulement en Temps Accéléré

**User Story:** As a player, I want the match to progress quickly with frequent action opportunities based on my skills, so that matches feel dynamic and engaging.

#### Acceptance Criteria

1. WHEN un match interactif est en cours, THE Système_de_Match SHALL faire avancer le temps de match de manière accélérée (90 minutes simulées en moins de 5 minutes réelles)
2. THE Système_de_Match SHALL générer des actions fréquentes (entre 6 et 12 par match) pour le Joueur_Personnage
3. WHEN une action se présente, THE Système_de_Match SHALL proposer un choix entre une action facile (probabilité de succès élevée, gain faible) et une action risquée (probabilité de succès basse, gain élevé)
4. THE Système_de_Match SHALL calculer la probabilité de succès de chaque action en fonction des compétences du Joueur_Personnage et de la Fitness actuelle
5. WHEN une action de tir réussit, THE Système_de_Match SHALL comptabiliser un but pour l'équipe du Joueur_Personnage
6. WHEN une action de passe décisive réussit, THE Système_de_Match SHALL comptabiliser une passe décisive et potentiellement un but
7. WHILE le match progresse, THE Système_de_Match SHALL diminuer la Fitness du Joueur_Personnage progressivement au fil des minutes

---

### Requirement 9: Match Joué - Écran Post-Match

**User Story:** As a player, I want to see my match stats and optionally do a post-match interview before returning to the main screen, so that I can review my performance.

#### Acceptance Criteria

1. WHEN le match se termine, THE Interface_Utilisateur SHALL afficher un écran de résumé avec le score final, les buts, les passes décisives et la note du Joueur_Personnage
2. THE Interface_Utilisateur SHALL afficher les statistiques détaillées du match : tirs, dribbles, tacles, précision des passes
3. WHEN le résumé est affiché, THE Interface_Utilisateur SHALL proposer l'option de faire une Interview_Post_Match
4. WHEN le joueur choisit de faire l'interview, THE Système_Social SHALL générer des questions contextuelles liées au résultat du match
5. WHEN le joueur termine ou refuse l'interview, THE Interface_Utilisateur SHALL retourner à l'Écran_Principal
6. WHEN le match est terminé, THE Système_de_Classement SHALL mettre à jour le classement du championnat avec le résultat

---

### Requirement 10: Gestion de la Fitness

**User Story:** As a player, I want my fitness to decrease during matches and recover over time, so that physical condition management adds strategic depth.

#### Acceptance Criteria

1. WHEN un match est joué ou simulé, THE Système_de_Match SHALL diminuer la Fitness du Joueur_Personnage d'un montant compris entre 15 et 30 points selon l'intensité du match
2. WHEN un jour passe sans match, THE Système_Temporel SHALL augmenter la Fitness du Joueur_Personnage d'environ 1 point (récupération quotidienne)
3. THE Système_de_Match SHALL borner la Fitness du Joueur_Personnage entre 0 et 100 après chaque modification
4. WHILE la Fitness du Joueur_Personnage est inférieure à 50, THE Système_de_Match SHALL réduire la probabilité de succès des actions en match proportionnellement

---

### Requirement 11: Création d'Avatar

**User Story:** As a player, I want to create a visual avatar at the start of the game that is displayed on the main screen, so that I have a personalized visual identity.

#### Acceptance Criteria

1. WHEN le joueur crée son personnage, THE Interface_Utilisateur SHALL proposer des options de personnalisation visuelle : couleur de peau, coiffure, couleur de cheveux et taille
2. THE Interface_Utilisateur SHALL afficher un aperçu en temps réel de l'Avatar pendant la personnalisation
3. WHEN la création est validée, THE Système_de_Carrière SHALL sauvegarder l'apparence de l'Avatar avec les données du Joueur_Personnage
4. THE Écran_Principal SHALL afficher l'Avatar du Joueur_Personnage de manière proéminente en haut de l'écran

---

### Requirement 12: Écran Principal Redessiné

**User Story:** As a player, I want a scrollable main screen showing my avatar at the top and standings below, so that I have quick access to key information.

#### Acceptance Criteria

1. THE Écran_Principal SHALL être scrollable verticalement avec l'Avatar affiché en haut
2. THE Écran_Principal SHALL afficher le classement du championnat du Joueur_Personnage sous l'Avatar
3. THE Écran_Principal SHALL afficher la date actuelle, le prochain match et la Fitness du Joueur_Personnage
4. THE Écran_Principal SHALL afficher les boutons d'action principaux : "Jour suivant", "Simuler la semaine" et "Entraînement" (si disponible)
5. WHEN le joueur scrolle vers le bas, THE Écran_Principal SHALL révéler le classement complet et les informations supplémentaires

---

### Requirement 13: Navigation Inférieure par Onglets

**User Story:** As a player, I want a bottom navigation bar with icons to access different sections, so that I can navigate the game efficiently on mobile.

#### Acceptance Criteria

1. THE Navigation_Inférieure SHALL être fixe en bas de l'écran et visible sur tous les écrans principaux du jeu
2. THE Navigation_Inférieure SHALL contenir une icône Club donnant accès aux classements et au Vestiaire
3. THE Navigation_Inférieure SHALL contenir une icône Personne donnant accès aux transferts et au réseau social
4. THE Navigation_Inférieure SHALL contenir une icône Trophée/Finance donnant accès aux trophées et aux finances
5. WHEN le joueur appuie sur une icône de la Navigation_Inférieure, THE Interface_Utilisateur SHALL afficher la section correspondante avec une transition fluide
6. THE Navigation_Inférieure SHALL indiquer visuellement l'onglet actuellement actif

---

### Requirement 14: Intégration des Systèmes Existants

**User Story:** As a player, I want all existing game systems (transfers, social, finance, time) to work together seamlessly in the new gameplay loop, so that the experience feels cohesive.

#### Acceptance Criteria

1. WHEN un jour avance, THE Système_Temporel SHALL déclencher tous les systèmes concernés : récupération de Fitness, événements aléatoires, vérification de jour de match
2. WHEN une journée de championnat est jouée, THE Système_de_Ligue SHALL simuler tous les matchs des autres équipes et mettre à jour les classements de toutes les ligues
3. WHEN un match est terminé, THE Système_de_Statistiques SHALL enregistrer la performance et mettre à jour les statistiques de carrière du Joueur_Personnage
4. WHEN une fenêtre de transfert s'ouvre, THE Système_de_Carrière SHALL générer des offres accessibles depuis l'onglet Personne de la Navigation_Inférieure
5. THE Système_Financier SHALL créditer le salaire hebdomadaire et afficher l'historique dans l'onglet Trophée/Finance
6. THE Système_Social SHALL générer des publications sur le réseau social fictif accessibles depuis l'onglet Personne de la Navigation_Inférieure
