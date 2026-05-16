# Requirements Document

## Introduction

Ce document décrit les exigences pour l'intégration de la Ligue des Champions (Champions League) dans le jeu de carrière footballistique. La fonctionnalité ajoute une compétition européenne prestigieuse au format inspiré de l'UEFA (50 équipes en phase de ligue, puis tours à élimination directe sans barrages). Les 4 premiers de chaque championnat national (5 ligues × 4 = 20 équipes) se qualifient, complétés par 30 équipes "filler" représentant les ligues mineures. Le calendrier de la Ligue des Champions s'intercale avec les matchs de championnat (mardi/mercredi, de septembre à mai). Le joueur participe si son club a terminé dans le top 4 la saison précédente.

## Glossary

- **Système_Champions_League** : Le module qui gère l'ensemble de la compétition Ligue des Champions (qualification, tirage, calendrier, résultats, classement de la phase de ligue, tours à élimination directe)
- **Phase_de_Ligue** : La première phase de la Ligue des Champions où 50 équipes jouent chacune 8 matchs (4 à domicile, 4 à l'extérieur) contre des adversaires différents, produisant un classement unique
- **Tour_Éliminatoire** : Les phases à élimination directe de la Ligue des Champions (huitièmes de finale, quarts de finale, demi-finales, finale)
- **Équipe_Filler** : Une équipe fictive représentant un club d'une ligue mineure non jouable, utilisée pour compléter les 50 participants de la Ligue des Champions
- **Match_Aller_Retour** : Un format de confrontation en deux matchs (un à domicile, un à l'extérieur) où le vainqueur est déterminé par le score cumulé sur les deux rencontres
- **Calendrier_Intercalé** : Le système de planification qui alterne les matchs de championnat (week-end) et les matchs de Ligue des Champions (mardi/mercredi) dans le calendrier de la saison
- **GameLoopOrchestrator** : Le module central existant qui coordonne l'avancement du temps et déclenche les systèmes dans le bon ordre
- **Joueur_Personnage** : Le personnage contrôlé par le joueur dans le jeu de carrière

## Requirements

### Requirement 1: Qualification pour la Ligue des Champions

**User Story:** As a player, I want the top 4 teams from each league to qualify for the Champions League, so that qualification feels earned and realistic.

#### Acceptance Criteria

1. WHEN une saison se termine, THE Système_Champions_League SHALL qualifier les 4 premières équipes de chaque championnat (Ligue 1, Premier League, La Liga, Serie A, Bundesliga) pour la Ligue des Champions de la saison suivante
2. THE Système_Champions_League SHALL sélectionner exactement 20 équipes qualifiées à partir des classements finaux des 5 championnats
3. THE Système_Champions_League SHALL générer exactement 30 Équipes_Filler avec un nom, un pays et une note moyenne d'effectif pour compléter les 50 participants
4. WHEN le club du Joueur_Personnage termine dans les 4 premières positions de son championnat, THE Système_Champions_League SHALL inclure le club du Joueur_Personnage parmi les participants de la Ligue des Champions la saison suivante
5. WHEN le club du Joueur_Personnage ne termine pas dans les 4 premières positions, THE Système_Champions_League SHALL exclure le club du Joueur_Personnage de la Ligue des Champions la saison suivante

---

### Requirement 2: Format de la Phase de Ligue

**User Story:** As a player, I want the Champions League league phase to follow a format with 8 matches against different opponents, so that the competition feels modern and varied.

#### Acceptance Criteria

1. THE Système_Champions_League SHALL organiser la phase de ligue avec exactement 50 équipes dans un classement unique
2. THE Système_Champions_League SHALL attribuer à chaque équipe exactement 8 matchs en phase de ligue (4 à domicile, 4 à l'extérieur)
3. THE Système_Champions_League SHALL garantir que chaque équipe affronte 8 adversaires différents en phase de ligue
4. WHEN tous les matchs de la phase de ligue sont joués, THE Système_Champions_League SHALL calculer le classement selon les points (3 pour une victoire, 1 pour un nul, 0 pour une défaite), puis la différence de buts, puis les buts marqués
5. THE Système_Champions_League SHALL qualifier directement les 16 premières équipes du classement pour les huitièmes de finale
6. THE Système_Champions_League SHALL éliminer les équipes classées 17e à 50e de la compétition

---

### Requirement 3: Tours à Élimination Directe

**User Story:** As a player, I want knockout rounds with two-legged ties and a single-match final, so that the Champions League feels dramatic and high-stakes.

#### Acceptance Criteria

1. THE Système_Champions_League SHALL organiser les huitièmes de finale en matchs aller-retour entre les 16 équipes qualifiées de la phase de ligue
2. THE Système_Champions_League SHALL organiser les quarts de finale en matchs aller-retour entre les 8 vainqueurs des huitièmes de finale
3. THE Système_Champions_League SHALL organiser les demi-finales en matchs aller-retour entre les 4 vainqueurs des quarts de finale
4. THE Système_Champions_League SHALL organiser la finale en un match unique sur terrain neutre
5. WHEN un Match_Aller_Retour se termine avec un score cumulé égal, THE Système_Champions_League SHALL déterminer le vainqueur par prolongation puis tirs au but (simulation simplifiée)
6. THE Système_Champions_League SHALL effectuer un tirage au sort pour déterminer les confrontations de chaque tour éliminatoire

---

### Requirement 4: Calendrier Intercalé

**User Story:** As a player, I want Champions League matches scheduled on Tuesday/Wednesday between league matches, so that the season calendar feels realistic.

#### Acceptance Criteria

1. WHEN une nouvelle saison avec Ligue des Champions commence, THE Système_Champions_League SHALL générer le Calendrier_Intercalé avec les matchs de phase de ligue répartis entre septembre et janvier (8 journées)
2. THE Système_Champions_League SHALL planifier les matchs de Ligue des Champions exclusivement les mardis et mercredis
3. THE Système_Champions_League SHALL planifier les huitièmes de finale en février-mars
4. THE Système_Champions_League SHALL planifier les quarts de finale en avril
5. THE Système_Champions_League SHALL planifier les demi-finales en avril-mai
6. THE Système_Champions_League SHALL planifier la finale en mai (dernier samedi)
7. THE Système_Champions_League SHALL garantir qu'aucun match de Ligue des Champions ne tombe le même jour qu'un match de championnat pour le club du Joueur_Personnage

---

### Requirement 5: Intégration avec la Boucle de Jeu

**User Story:** As a player, I want Champions League matches to integrate seamlessly with the existing game loop, so that advancing days and simulating weeks accounts for CL matches.

#### Acceptance Criteria

1. WHEN un jour de match de Ligue des Champions est atteint, THE GameLoopOrchestrator SHALL proposer les options "Jouer le match" et "Simuler le match" comme pour un match de championnat
2. WHEN le joueur utilise "Simuler la semaine" et qu'un match de Ligue des Champions est programmé dans la semaine, THE GameLoopOrchestrator SHALL bloquer la simulation et signaler le match à jouer ou simuler
3. WHEN un match de Ligue des Champions est joué ou simulé, THE Système_Champions_League SHALL simuler tous les autres matchs de la même journée de Ligue des Champions
4. WHEN un match de Ligue des Champions est terminé, THE Système_Champions_League SHALL mettre à jour le classement de la phase de ligue ou faire progresser le tableau des tours éliminatoires
5. THE GameLoopOrchestrator SHALL traiter les matchs de Ligue des Champions avec la même priorité que les matchs de championnat pour le déclenchement des systèmes (fitness, blessures, moral)

---

### Requirement 6: Statistiques et Progression du Joueur en Ligue des Champions

**User Story:** As a player, I want my Champions League performances to count toward my career stats and social growth, so that the competition feels rewarding beyond just winning.

#### Acceptance Criteria

1. WHEN un match de Ligue des Champions est joué ou simulé, THE Système_de_Statistiques SHALL enregistrer la performance du Joueur_Personnage (buts, passes décisives, note) dans les statistiques de carrière
2. WHEN un match de Ligue des Champions est terminé, THE Système_Social SHALL générer des publications sur le réseau social en fonction de la performance
3. WHEN un match de Ligue des Champions est joué, THE Système_Instagram SHALL attribuer des abonnés supplémentaires au Joueur_Personnage proportionnellement à la performance et au prestige de la compétition
4. THE Système_Champions_League SHALL appliquer un multiplicateur de prestige aux gains d'abonnés Instagram par rapport aux matchs de championnat (multiplicateur de 2)
5. WHEN le Joueur_Personnage marque un but en Ligue des Champions, THE Système_de_Statistiques SHALL comptabiliser le but séparément dans un compteur de buts en Ligue des Champions

---

### Requirement 7: Affichage de la Ligue des Champions dans l'Interface

**User Story:** As a player, I want to view CL standings, calendar, and results in the Club tab, so that I can follow the competition's progression.

#### Acceptance Criteria

1. WHILE le club du Joueur_Personnage participe à la Ligue des Champions, THE Interface_Utilisateur SHALL afficher un onglet "Ligue des Champions" dans la section Club
2. THE Interface_Utilisateur SHALL afficher le classement complet de la phase de ligue (50 équipes) avec position, points, victoires, nuls, défaites, buts marqués et encaissés
3. THE Interface_Utilisateur SHALL mettre en surbrillance les positions 1 à 16 en vert (qualification directe pour les huitièmes) et 17 à 50 en rouge (élimination)
4. THE Interface_Utilisateur SHALL afficher le calendrier des matchs de Ligue des Champions du club du Joueur_Personnage avec dates, adversaires et résultats
5. WHEN les tours éliminatoires commencent, THE Interface_Utilisateur SHALL afficher le tableau des confrontations (bracket) avec les résultats des matchs aller-retour
6. THE Interface_Utilisateur SHALL afficher les textes de l'onglet Ligue des Champions en français

---

### Requirement 8: Simulation des Matchs de Ligue des Champions (hors joueur)

**User Story:** As a player, I want all other CL matches to be simulated realistically when a CL matchday occurs, so that the competition progresses coherently.

#### Acceptance Criteria

1. WHEN une journée de phase de ligue est atteinte, THE Système_Champions_League SHALL simuler tous les matchs de cette journée (sauf celui du Joueur_Personnage s'il participe)
2. WHEN un tour éliminatoire est atteint, THE Système_Champions_League SHALL simuler tous les matchs aller-retour de ce tour (sauf ceux du Joueur_Personnage s'il participe)
3. THE Système_Champions_League SHALL utiliser la note moyenne de l'effectif de chaque équipe pour déterminer les probabilités de victoire lors de la simulation
4. THE Système_Champions_League SHALL produire des scores réalistes (entre 0 et 5 buts par équipe par match)

---

### Requirement 9: Trophée et Fin de Compétition

**User Story:** As a player, I want to earn a Champions League trophy if my team wins the final, so that winning the competition is a memorable career achievement.

#### Acceptance Criteria

1. WHEN le club du Joueur_Personnage remporte la finale de la Ligue des Champions, THE Système_de_Trophées SHALL ajouter un trophée "Ligue des Champions" à la collection du Joueur_Personnage avec la saison correspondante
2. WHEN la Ligue des Champions se termine (finale jouée), THE Système_Champions_League SHALL réinitialiser l'état de la compétition pour la saison suivante
3. WHEN le club du Joueur_Personnage est éliminé de la Ligue des Champions, THE Interface_Utilisateur SHALL afficher un message d'élimination et retirer les matchs restants du calendrier du joueur
