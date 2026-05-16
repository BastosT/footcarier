/**
 * Base de données de femmes pour le système de relations.
 * Chaque femme a un nom, âge, métier, description et préférences.
 */

export interface WomanProfile {
  id: string;
  firstName: string;
  age: number;
  job: string;
  description: string;
  emoji: string;
  personality: 'shy' | 'outgoing' | 'ambitious' | 'creative' | 'sporty';
  interests: string[];
  /** Minimum popularity required to match */
  popularityRequired: number;
}

export const ALL_WOMEN: WomanProfile[] = [
  // 18-22 ans
  { id: 'w-emma', firstName: 'Emma', age: 19, job: 'Étudiante en droit', description: 'Studieuse et ambitieuse, rêve de devenir avocate', emoji: '👩‍🎓', personality: 'ambitious', interests: ['lecture', 'yoga', 'voyages'], popularityRequired: 10 },
  { id: 'w-lea', firstName: 'Léa', age: 20, job: 'Mannequin', description: 'Mannequin pour une agence parisienne', emoji: '💃', personality: 'outgoing', interests: ['mode', 'photo', 'soirées'], popularityRequired: 30 },
  { id: 'w-chloe', firstName: 'Chloé', age: 21, job: 'Étudiante en médecine', description: 'Future médecin, passionnée par la science', emoji: '👩‍⚕️', personality: 'shy', interests: ['science', 'musique', 'cuisine'], popularityRequired: 15 },
  { id: 'w-manon', firstName: 'Manon', age: 18, job: 'Danseuse', description: 'Danseuse classique au conservatoire', emoji: '🩰', personality: 'creative', interests: ['danse', 'art', 'nature'], popularityRequired: 10 },
  { id: 'w-jade', firstName: 'Jade', age: 22, job: 'Influenceuse fitness', description: '500K followers sur Instagram', emoji: '🏋️‍♀️', personality: 'sporty', interests: ['sport', 'nutrition', 'voyages'], popularityRequired: 25 },

  // 23-26 ans
  { id: 'w-camille', firstName: 'Camille', age: 23, job: 'Architecte junior', description: 'Créative et passionnée de design', emoji: '👷‍♀️', personality: 'creative', interests: ['architecture', 'art', 'voyages'], popularityRequired: 20 },
  { id: 'w-sarah', firstName: 'Sarah', age: 24, job: 'Journaliste sportive', description: 'Couvre la Ligue 1 pour un grand média', emoji: '📺', personality: 'outgoing', interests: ['foot', 'écriture', 'cinéma'], popularityRequired: 35 },
  { id: 'w-ines', firstName: 'Inès', age: 25, job: 'Avocate', description: 'Avocate en droit des affaires', emoji: '👩‍💼', personality: 'ambitious', interests: ['droit', 'gastronomie', 'art'], popularityRequired: 40 },
  { id: 'w-lina', firstName: 'Lina', age: 23, job: 'Photographe', description: 'Photographe de mode freelance', emoji: '📸', personality: 'creative', interests: ['photo', 'voyages', 'musique'], popularityRequired: 20 },
  { id: 'w-clara', firstName: 'Clara', age: 26, job: 'Kinésithérapeute', description: 'Spécialisée dans le sport de haut niveau', emoji: '💆‍♀️', personality: 'sporty', interests: ['sport', 'bien-être', 'randonnée'], popularityRequired: 15 },

  // 27-30 ans
  { id: 'w-sofia', firstName: 'Sofia', age: 27, job: 'Actrice', description: 'Actrice montante du cinéma français', emoji: '🎬', personality: 'outgoing', interests: ['cinéma', 'théâtre', 'voyages'], popularityRequired: 50 },
  { id: 'w-victoria', firstName: 'Victoria', age: 28, job: 'Directrice marketing', description: 'Dirige le marketing d\'une marque de luxe', emoji: '👠', personality: 'ambitious', interests: ['luxe', 'business', 'gastronomie'], popularityRequired: 45 },
  { id: 'w-nina', firstName: 'Nina', age: 29, job: 'Médecin', description: 'Médecin urgentiste dévouée', emoji: '🏥', personality: 'shy', interests: ['médecine', 'lecture', 'cuisine'], popularityRequired: 30 },
  { id: 'w-luna', firstName: 'Luna', age: 27, job: 'DJ', description: 'DJ résidente dans les clubs de la Côte d\'Azur', emoji: '🎧', personality: 'outgoing', interests: ['musique', 'soirées', 'voyages'], popularityRequired: 35 },
  { id: 'w-alice', firstName: 'Alice', age: 30, job: 'Cheffe cuisinière', description: 'Cheffe étoilée, passionnée de gastronomie', emoji: '👩‍🍳', personality: 'creative', interests: ['cuisine', 'vin', 'voyages'], popularityRequired: 25 },

  // 30+ ans
  { id: 'w-isabelle', firstName: 'Isabelle', age: 32, job: 'Entrepreneuse', description: 'Fondatrice d\'une startup tech à succès', emoji: '💼', personality: 'ambitious', interests: ['business', 'tech', 'art'], popularityRequired: 55 },
  { id: 'w-nadia', firstName: 'Nadia', age: 31, job: 'Pilote de ligne', description: 'Pilote pour une compagnie internationale', emoji: '✈️', personality: 'sporty', interests: ['aviation', 'voyages', 'sport'], popularityRequired: 40 },
  { id: 'w-eva', firstName: 'Eva', age: 33, job: 'Galeriste', description: 'Propriétaire d\'une galerie d\'art contemporain', emoji: '🎨', personality: 'creative', interests: ['art', 'culture', 'vin'], popularityRequired: 45 },
  { id: 'w-maya', firstName: 'Maya', age: 28, job: 'Chanteuse', description: 'Chanteuse R&B avec un album platine', emoji: '🎤', personality: 'outgoing', interests: ['musique', 'mode', 'voyages'], popularityRequired: 60 },
  { id: 'w-zoe', firstName: 'Zoé', age: 26, job: 'Coach sportive', description: 'Personal trainer des stars', emoji: '🏃‍♀️', personality: 'sporty', interests: ['fitness', 'nutrition', 'nature'], popularityRequired: 20 },

  // Profils premium (haute popularité requise)
  { id: 'w-alessandra', firstName: 'Alessandra', age: 29, job: 'Top model international', description: 'Défile pour les plus grandes maisons', emoji: '👗', personality: 'outgoing', interests: ['mode', 'voyages', 'art'], popularityRequired: 70 },
  { id: 'w-valentina', firstName: 'Valentina', age: 27, job: 'Héritière', description: 'Fille d\'un milliardaire, jet-setteuse', emoji: '💎', personality: 'ambitious', interests: ['luxe', 'voyages', 'chevaux'], popularityRequired: 75 },
  { id: 'w-rihanna', firstName: 'Amira', age: 30, job: 'Actrice Hollywood', description: 'Star internationale du cinéma', emoji: '⭐', personality: 'outgoing', interests: ['cinéma', 'philanthropie', 'mode'], popularityRequired: 85 },
  { id: 'w-serena', firstName: 'Serena', age: 25, job: 'Athlète olympique', description: 'Médaillée d\'or en natation', emoji: '🏅', personality: 'sporty', interests: ['sport', 'compétition', 'voyages'], popularityRequired: 60 },
  { id: 'w-diana', firstName: 'Diana', age: 31, job: 'Diplomate', description: 'Ambassadrice auprès de l\'ONU', emoji: '🌍', personality: 'ambitious', interests: ['politique', 'langues', 'culture'], popularityRequired: 65 },
];

/**
 * Filtre les femmes disponibles par tranche d'âge.
 */
export function filterWomenByAge(minAge: number, maxAge: number): WomanProfile[] {
  return ALL_WOMEN.filter((w) => w.age >= minAge && w.age <= maxAge);
}

/**
 * Retourne les femmes accessibles selon la popularité du joueur.
 */
export function getAvailableWomen(popularity: number): WomanProfile[] {
  return ALL_WOMEN.filter((w) => w.popularityRequired <= popularity);
}
