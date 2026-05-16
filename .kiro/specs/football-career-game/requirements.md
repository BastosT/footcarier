# Requirements Document

## Introduction

Ce document décrit les exigences pour un jeu de carrière footballistique 2D jouable directement dans le navigateur web (mobile et PC). Le jeu permet au joueur de créer un personnage, choisir un club et progresser dans une carrière professionnelle à travers différents championnats européens. Le style visuel est moderne, simple et élégant, optimisé pour une utilisation mobile-first sans nécessiter de téléchargement depuis un app store.

## Glossary

- **Moteur_de_Jeu** : Le système principal qui gère la logique du jeu, les calculs et le rendu
- **Interface_Utilisateur** : Le système d'affichage et d'interaction avec le joueur
- **Système_de_Match** : Le module qui simule les matchs de football en 2D
- **Système_de_Carrière** : Le module qui gère la progression, les contrats et les transferts
- **Système_de_Statistiques** : Le module qui calcule et stocke les statistiques du joueur
- **Système_Social** : Le module qui gère la popularité, les réseaux sociaux fictifs et les interviews
- **Système_d_Entraînement** : Le module qui gère les sessions d'entraînement et la progression des compétences
- **Système_de_Sauvegarde** : Le module qui persiste l'état du jeu dans le navigateur
- **Joueur_Personnage** : Le personnage créé et contrôlé par l'utilisateur
- **Club** : Une équipe de football réelle dans le jeu, classée par tier (petit, moyen, grand), avec son effectif actuel
- **Championnat** : Une compétition de ligue dans un pays donné avec des divisions
- **Division** : Un niveau hiérarchique au sein d'un championnat
- **Système_Temporel** : Le module qui gère l'avancement du temps dans le jeu (jour par jour ou semaine complète)
- **Événement_Aléatoire** : Un événement imprévu qui se déclenche pendant l'avancement du temps et affecte le joueur

## Requirements

### Exigence 1 : Compatibilité Navigateur et Mobile-First

**User Story :** En tant que joueur, je veux accéder au jeu directement depuis mon navigateur mobile ou PC, afin de jouer sans installer d'application.

#### Critères d'Acceptation

1. THE Interface_Utilisateur SHALL s'afficher de manière responsive sur les écrans de 320px à 2560px de largeur
2. THE Moteur_de_Jeu SHALL fonctionner sur les navigateurs Chrome, Safari, Firefox et Edge dans leurs deux dernières versions majeures
3. THE Interface_Utilisateur SHALL adopter une disposition mobile-first avec des éléments tactiles d'au moins 44x44 pixels
4. THE Moteur_de_Jeu SHALL maintenir un taux de rafraîchissement minimum de 30 images par seconde sur les appareils mobiles de milieu de gamme
5. WHEN le joueur accède au jeu depuis un appareil mobile, THE Interface_Utilisateur SHALL afficher des menus fluides avec des animations de transition inférieures à 300ms

---

### Exigence 2 : Création de Personnage

**User Story :** En tant que joueur, je veux créer mon personnage de footballeur, afin de personnaliser mon expérience de jeu.

#### Critères d'Acceptation

1. WHEN le joueur démarre une nouvelle partie, THE Système_de_Carrière SHALL afficher l'écran de création de personnage
2. THE Interface_Utilisateur SHALL permettre au joueur de définir le nom, le prénom, la nationalité, le poste et l'apparence du Joueur_Personnage
3. THE Système_de_Statistiques SHALL attribuer des statistiques initiales au Joueur_Personnage en fonction du poste choisi
4. WHEN le joueur valide la création, THE Système_de_Carrière SHALL enregistrer le Joueur_Personnage et afficher l'écran de sélection de club

---

### Exigence 3 : Sélection de Club et Tiers (Clubs Réels)

**User Story :** En tant que joueur, je veux choisir mon club de départ parmi des clubs réels avec leurs effectifs actuels, afin de vivre une expérience immersive et réaliste.

#### Critères d'Acceptation

1. THE Système_de_Carrière SHALL proposer des clubs réels répartis en trois tiers : petit club, club moyen et grand club
2. THE Système_de_Carrière SHALL proposer des clubs réels dans cinq pays : France, Espagne, Angleterre, Italie et Allemagne
3. THE Système_de_Carrière SHALL inclure les effectifs réels actuels de chaque club (joueurs, postes, notes)
4. WHEN le joueur sélectionne un tier, THE Interface_Utilisateur SHALL afficher la liste des clubs réels disponibles dans ce tier avec leur pays, leur division et un aperçu de l'effectif
5. WHEN le joueur choisit un club, THE Système_de_Carrière SHALL associer le Joueur_Personnage à ce club, l'intégrer dans l'effectif existant et générer un contrat initial
6. THE Système_de_Carrière SHALL mettre à jour les effectifs des clubs lors des transferts simulés entre équipes IA au fil des saisons

---

### Exigence 4 : Système de Championnats et Divisions

**User Story :** En tant que joueur, je veux évoluer dans un championnat structuré avec des divisions, afin de vivre une progression réaliste.

#### Critères d'Acceptation

1. THE Système_de_Carrière SHALL gérer un championnat par pays avec au moins deux divisions hiérarchiques
2. THE Système_de_Carrière SHALL simuler les résultats des matchs entre les équipes IA chaque journée de championnat
3. WHEN une saison se termine, THE Système_de_Carrière SHALL calculer les promotions et relégations entre divisions
4. THE Interface_Utilisateur SHALL afficher le classement du championnat mis à jour après chaque journée
5. WHEN le club du Joueur_Personnage termine dans la zone de promotion, THE Système_de_Carrière SHALL promouvoir le club à la division supérieure pour la saison suivante

---

### Exigence 5 : Simulation de Match

**User Story :** En tant que joueur, je veux vivre des matchs rapides et dynamiques avec la possibilité d'intervenir sur des actions clés, afin de ressentir l'excitation du football.

#### Critères d'Acceptation

1. WHEN un match commence, THE Système_de_Match SHALL afficher une vue 2D du terrain avec les joueurs représentés de manière stylisée
2. THE Système_de_Match SHALL simuler un match complet en moins de 5 minutes de temps réel
3. WHEN une action clé se produit (tir, passe décisive, dribble), THE Système_de_Match SHALL permettre au joueur d'intervenir via une interaction tactile ou clavier
4. THE Système_de_Match SHALL calculer le résultat des actions en fonction des statistiques du Joueur_Personnage et des adversaires
5. WHEN le match se termine, THE Système_de_Statistiques SHALL enregistrer les performances individuelles du Joueur_Personnage (buts, passes, note)
6. THE Système_de_Match SHALL afficher des animations fluides pour les actions de jeu à un minimum de 30 images par seconde

---

### Exigence 6 : Système d'Entraînement

**User Story :** En tant que joueur, je veux entraîner mon personnage entre les matchs, afin d'améliorer ses compétences.

#### Critères d'Acceptation

1. WHEN le joueur accède à la section entraînement, THE Système_d_Entraînement SHALL afficher les sessions disponibles pour la semaine en cours
2. THE Système_d_Entraînement SHALL proposer des exercices ciblant des compétences spécifiques (vitesse, tir, passe, dribble, défense)
3. WHEN le joueur complète une session d'entraînement, THE Système_de_Statistiques SHALL augmenter les compétences ciblées en fonction de l'intensité choisie et du potentiel du Joueur_Personnage
4. IF le joueur s'entraîne avec une intensité élevée pendant trois sessions consécutives, THEN THE Système_de_Carrière SHALL augmenter le risque de blessure du Joueur_Personnage

---

### Exigence 7 : Système de Transferts

**User Story :** En tant que joueur, je veux recevoir des offres de transfert et changer de club, afin de faire évoluer ma carrière.

#### Critères d'Acceptation

1. WHEN une fenêtre de transfert s'ouvre, THE Système_de_Carrière SHALL générer des offres de transfert basées sur les performances et la réputation du Joueur_Personnage
2. THE Interface_Utilisateur SHALL afficher les détails de chaque offre : club proposant, salaire, durée du contrat et division
3. WHEN le joueur accepte une offre de transfert, THE Système_de_Carrière SHALL transférer le Joueur_Personnage au nouveau club et mettre à jour le contrat
4. WHEN le joueur refuse toutes les offres, THE Système_de_Carrière SHALL maintenir le Joueur_Personnage dans son club actuel
5. THE Système_de_Carrière SHALL générer des offres provenant de clubs dont le tier correspond aux performances du Joueur_Personnage

---

### Exigence 8 : Statistiques et Progression du Joueur

**User Story :** En tant que joueur, je veux suivre mes statistiques et ma progression, afin de mesurer l'évolution de mon personnage.

#### Critères d'Acceptation

1. THE Système_de_Statistiques SHALL maintenir un historique complet des performances par match, par saison et sur l'ensemble de la carrière
2. THE Interface_Utilisateur SHALL afficher les statistiques sous forme de graphiques et de tableaux accessibles depuis le menu principal
3. THE Système_de_Statistiques SHALL calculer une note globale du Joueur_Personnage sur une échelle de 1 à 99
4. WHEN les compétences du Joueur_Personnage augmentent, THE Système_de_Statistiques SHALL recalculer la note globale
5. THE Système_de_Statistiques SHALL gérer un attribut de potentiel qui limite la progression maximale du Joueur_Personnage

---

### Exigence 9 : Système de Blessures

**User Story :** En tant que joueur, je veux que les blessures soient un risque réaliste, afin d'ajouter du challenge à ma carrière.

#### Critères d'Acceptation

1. WHEN un match se termine, THE Système_de_Carrière SHALL évaluer la probabilité de blessure du Joueur_Personnage en fonction de l'intensité du match et de la fatigue accumulée
2. IF le Joueur_Personnage se blesse, THEN THE Système_de_Carrière SHALL déterminer le type de blessure et la durée d'indisponibilité en semaines
3. WHILE le Joueur_Personnage est blessé, THE Système_de_Match SHALL exclure le Joueur_Personnage des matchs
4. WHILE le Joueur_Personnage est blessé, THE Système_d_Entraînement SHALL proposer uniquement des exercices de rééducation
5. WHEN la période de blessure se termine, THE Système_de_Carrière SHALL rétablir la disponibilité du Joueur_Personnage avec une réduction temporaire de ses statistiques physiques

---

### Exigence 10 : Système de Popularité et Réputation

**User Story :** En tant que joueur, je veux que mes performances influencent ma popularité, afin de débloquer des opportunités de carrière.

#### Critères d'Acceptation

1. THE Système_Social SHALL calculer un score de popularité du Joueur_Personnage sur une échelle de 0 à 100
2. WHEN le Joueur_Personnage réalise une performance exceptionnelle (note supérieure à 8/10), THE Système_Social SHALL augmenter le score de popularité
3. WHEN le Joueur_Personnage réalise une mauvaise performance (note inférieure à 4/10), THE Système_Social SHALL diminuer le score de popularité
4. THE Système_de_Carrière SHALL utiliser le score de popularité pour déterminer la qualité des offres de transfert reçues
5. THE Système_Social SHALL calculer un score de réputation distinct basé sur le comportement du joueur lors des interviews et des interactions sociales

---

### Exigence 11 : Réseaux Sociaux Fictifs

**User Story :** En tant que joueur, je veux interagir avec un réseau social fictif dans le jeu, afin d'ajouter de l'immersion à ma carrière.

#### Critères d'Acceptation

1. THE Système_Social SHALL générer des publications fictives de fans, journalistes et autres joueurs en réaction aux événements de carrière
2. WHEN le Joueur_Personnage marque un but ou réalise une action notable, THE Système_Social SHALL générer des réactions sur le réseau social fictif dans les 24 heures de temps de jeu
3. THE Interface_Utilisateur SHALL afficher un fil d'actualité consultable depuis le menu principal
4. WHEN le joueur publie un message sur le réseau social fictif, THE Système_Social SHALL ajuster le score de popularité en fonction du contenu choisi parmi des options prédéfinies

---

### Exigence 12 : Système d'Interviews

**User Story :** En tant que joueur, je veux répondre à des interviews, afin d'influencer ma réputation et mes relations.

#### Critères d'Acceptation

1. WHEN un événement majeur se produit (match important, transfert, trophée), THE Système_Social SHALL déclencher une interview avec des questions contextuelles
2. THE Interface_Utilisateur SHALL proposer au joueur un choix parmi trois réponses prédéfinies pour chaque question d'interview
3. WHEN le joueur choisit une réponse, THE Système_Social SHALL ajuster les scores de réputation et de relation avec l'entraîneur en fonction du ton de la réponse
4. IF le joueur donne une réponse controversée, THEN THE Système_Social SHALL générer des réactions négatives sur le réseau social fictif

---

### Exigence 13 : Relations avec l'Entraîneur et les Coéquipiers

**User Story :** En tant que joueur, je veux que mes choix influencent mes relations avec l'entraîneur et les coéquipiers, afin d'ajouter de la profondeur à la carrière.

#### Critères d'Acceptation

1. THE Système_Social SHALL maintenir un score de relation entre le Joueur_Personnage et l'entraîneur sur une échelle de 0 à 100
2. THE Système_Social SHALL maintenir un score de relation entre le Joueur_Personnage et le vestiaire (coéquipiers) sur une échelle de 0 à 100
3. WHEN la relation avec l'entraîneur descend en dessous de 30, THE Système_de_Carrière SHALL réduire le temps de jeu du Joueur_Personnage
4. WHEN la relation avec l'entraîneur dépasse 70, THE Système_de_Carrière SHALL augmenter le temps de jeu et la confiance accordée au Joueur_Personnage
5. WHEN la relation avec le vestiaire descend en dessous de 20, THE Système_Social SHALL générer des événements négatifs (conflits, isolement)

---

### Exigence 14 : Système de Trophées

**User Story :** En tant que joueur, je veux remporter des trophées individuels et collectifs, afin de marquer les accomplissements de ma carrière.

#### Critères d'Acceptation

1. THE Système_de_Carrière SHALL attribuer des trophées collectifs (championnat, coupe) au club du Joueur_Personnage en fin de saison selon le classement
2. THE Système_de_Carrière SHALL attribuer des trophées individuels (meilleur buteur, meilleur joueur) en fin de saison selon les statistiques
3. THE Interface_Utilisateur SHALL afficher une vitrine de trophées accessible depuis le profil du Joueur_Personnage
4. WHEN le Joueur_Personnage remporte un trophée, THE Système_Social SHALL augmenter significativement le score de popularité

---

### Exigence 15 : Système Financier et Contrats

**User Story :** En tant que joueur, je veux gérer mon salaire et mes finances, afin d'ajouter une dimension économique à ma carrière.

#### Critères d'Acceptation

1. THE Système_de_Carrière SHALL attribuer un salaire hebdomadaire au Joueur_Personnage défini par le contrat en cours
2. THE Système_de_Carrière SHALL créditer le salaire sur le compte du Joueur_Personnage chaque semaine de jeu
3. WHEN un contrat arrive à expiration, THE Système_de_Carrière SHALL déclencher une phase de négociation avec le club actuel ou permettre un transfert libre
4. THE Interface_Utilisateur SHALL afficher le solde financier, l'historique des revenus et les détails du contrat actuel
5. WHEN le joueur négocie un nouveau contrat, THE Système_de_Carrière SHALL proposer des paramètres ajustables : durée, salaire et primes

---

### Exigence 16 : Système de Potentiel et Progression

**User Story :** En tant que joueur, je veux que mon personnage ait un potentiel qui influence sa progression maximale, afin de rendre la carrière stratégique.

#### Critères d'Acceptation

1. THE Système_de_Statistiques SHALL attribuer un potentiel au Joueur_Personnage lors de la création, déterminé par le tier du club choisi et un facteur aléatoire
2. THE Système_de_Statistiques SHALL limiter la progression des compétences du Joueur_Personnage en fonction de son potentiel
3. WHEN le Joueur_Personnage atteint 80% de son potentiel, THE Système_de_Statistiques SHALL ralentir la vitesse de progression des compétences
4. WHEN le Joueur_Personnage dépasse 30 ans d'âge dans le jeu, THE Système_de_Statistiques SHALL appliquer une décroissance progressive des statistiques physiques

---

### Exigence 17 : Sauvegarde et Persistance

**User Story :** En tant que joueur, je veux que ma progression soit sauvegardée automatiquement, afin de reprendre ma carrière à tout moment.

#### Critères d'Acceptation

1. THE Système_de_Sauvegarde SHALL persister l'état complet du jeu dans le stockage local du navigateur après chaque action significative (fin de match, transfert, entraînement)
2. WHEN le joueur revient sur le jeu, THE Système_de_Sauvegarde SHALL restaurer l'état de la carrière à la dernière sauvegarde
3. IF le stockage local est indisponible ou corrompu, THEN THE Système_de_Sauvegarde SHALL afficher un message d'erreur explicite et proposer de démarrer une nouvelle partie
4. THE Système_de_Sauvegarde SHALL permettre au joueur de gérer jusqu'à trois sauvegardes de carrière simultanées

---

### Exigence 18 : Sérialisation et Désérialisation de l'État du Jeu

**User Story :** En tant que joueur, je veux que l'état de mon jeu soit correctement sérialisé et restauré, afin de ne perdre aucune donnée de progression.

#### Critères d'Acceptation

1. THE Système_de_Sauvegarde SHALL sérialiser l'état complet du jeu (carrière, statistiques, relations, finances) au format JSON
2. THE Système_de_Sauvegarde SHALL désérialiser un état JSON sauvegardé en un état de jeu fonctionnel identique à l'état original
3. THE Système_de_Sauvegarde SHALL formater l'état du jeu en JSON valide pour toute combinaison d'état de carrière
4. FOR ALL états de jeu valides, sérialiser puis désérialiser puis sérialiser à nouveau SHALL produire un JSON identique (propriété aller-retour)

---

### Exigence 19 : Style Visuel 2D Moderne

**User Story :** En tant que joueur, je veux un style visuel moderne et épuré, afin de profiter d'une expérience agréable sur mobile.

#### Critères d'Acceptation

1. THE Interface_Utilisateur SHALL utiliser un style graphique 2D vectoriel avec des couleurs vives et des contrastes élevés
2. THE Interface_Utilisateur SHALL afficher des icônes et éléments graphiques nets sur les écrans haute densité (Retina, 2x et 3x)
3. THE Interface_Utilisateur SHALL appliquer des transitions animées entre les écrans d'une durée comprise entre 200ms et 400ms
4. THE Interface_Utilisateur SHALL respecter un ratio de contraste minimum de 4.5:1 pour le texte conformément aux normes WCAG 2.1 AA
5. THE Interface_Utilisateur SHALL utiliser une typographie lisible avec une taille minimale de 16px pour le corps de texte sur mobile

---

### Exigence 20 : Avancement du Temps Flexible

**User Story :** En tant que joueur, je veux pouvoir avancer dans le temps jour par jour ou simuler toute la semaine d'un coup, afin de gérer mon rythme de jeu selon mes préférences.

#### Critères d'Acceptation

1. THE Système_Temporel SHALL permettre au joueur d'avancer le temps d'un jour à la fois via un bouton "Jour suivant"
2. THE Système_Temporel SHALL permettre au joueur de simuler toute la semaine jusqu'au prochain match via un bouton "Simuler la semaine"
3. WHEN le joueur avance jour par jour, THE Système_Temporel SHALL afficher les événements et activités de chaque jour individuellement
4. WHEN le joueur simule la semaine entière, THE Système_Temporel SHALL résumer les événements de la semaine dans un récapitulatif
5. WHEN un jour de match est atteint, THE Système_Temporel SHALL interrompre l'avancement automatique et proposer au joueur de jouer le match
6. THE Interface_Utilisateur SHALL afficher clairement la date actuelle, le jour de la semaine et le nombre de jours avant le prochain match

---

### Exigence 21 : Événements Aléatoires

**User Story :** En tant que joueur, je veux que des événements aléatoires se produisent entre les matchs, afin d'ajouter de la variété et de l'imprévisibilité à ma carrière.

#### Critères d'Acceptation

1. WHEN le temps avance (jour par jour ou simulation de semaine), THE Système_Temporel SHALL évaluer la probabilité de déclencher un Événement_Aléatoire pour chaque jour simulé
2. THE Système_Temporel SHALL proposer des événements aléatoires de différentes catégories : financiers (bonus, sponsoring), physiques (boost de forme, fatigue), sociaux (invitation, rencontre), et relationnels (amélioration relation coach/vestiaire)
3. WHEN un Événement_Aléatoire se déclenche, THE Interface_Utilisateur SHALL afficher une notification décrivant l'événement et ses effets
4. THE Système_Temporel SHALL appliquer les effets de l'Événement_Aléatoire immédiatement sur les attributs concernés (argent, forme, relations, popularité)
5. WHEN le joueur avance jour par jour, THE Interface_Utilisateur SHALL afficher chaque événement individuellement avec possibilité de choix si applicable
6. WHEN le joueur simule la semaine, THE Interface_Utilisateur SHALL lister tous les événements survenus dans le récapitulatif de semaine
7. THE Système_Temporel SHALL limiter la fréquence des événements aléatoires à un maximum de trois par semaine pour éviter la surcharge
