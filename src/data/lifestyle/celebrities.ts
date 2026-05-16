/**
 * Base de données de célébrités pour le système de relations VIP.
 * Catégories : rappeurs, acteurs/cinéma, politiques, sportifs, influenceurs, musiciens.
 * Chaque célébrité a un seuil de popularité pour être accessible.
 */

export type CelebrityCategory = 'rapper' | 'actor' | 'politician' | 'athlete' | 'influencer' | 'musician';

export interface CelebrityProfile {
  id: string;
  name: string;
  category: CelebrityCategory;
  description: string;
  emoji: string;
  instagramHandle: string;
  instagramFollowers: number; // en millions
  popularityRequired: number; // 0-100
  /** Bonus de followers Instagram quand on devient ami */
  followerBonus: number;
}

// ─── Rappeurs ────────────────────────────────────────────────────────────────

const RAPPERS: CelebrityProfile[] = [
  { id: 'cel-jul', name: 'Jul', category: 'rapper', description: 'Rappeur marseillais, roi du streaming', emoji: '🎤', instagramHandle: '@jul', instagramFollowers: 8, popularityRequired: 15, followerBonus: 2000 },
  { id: 'cel-ninho', name: 'Ninho', category: 'rapper', description: 'NI, le rappeur le plus certifié de France', emoji: '🎤', instagramHandle: '@naborininho', instagramFollowers: 7, popularityRequired: 20, followerBonus: 2500 },
  { id: 'cel-sdm', name: 'SDM', category: 'rapper', description: 'Rappeur du 93, membre du 667', emoji: '🎤', instagramHandle: '@sdm.officiel', instagramFollowers: 3, popularityRequired: 15, followerBonus: 1500 },
  { id: 'cel-gazo', name: 'Gazo', category: 'rapper', description: 'Drill français, DRILL FR', emoji: '🎤', instagramHandle: '@gaaborz', instagramFollowers: 4, popularityRequired: 20, followerBonus: 1800 },
  { id: 'cel-booba', name: 'Booba', category: 'rapper', description: 'Le Duc de Boulogne, légende du rap FR', emoji: '🎤', instagramHandle: '@boaborba', instagramFollowers: 10, popularityRequired: 35, followerBonus: 5000 },
  { id: 'cel-pnl', name: 'PNL (Ademo & N.O.S)', category: 'rapper', description: 'Duo légendaire des Tarterêts', emoji: '🎤', instagramHandle: '@pnlmusic', instagramFollowers: 6, popularityRequired: 30, followerBonus: 3000 },
  { id: 'cel-drake', name: 'Drake', category: 'rapper', description: 'Superstar mondiale du rap', emoji: '🎤', instagramHandle: '@champagnepapi', instagramFollowers: 140, popularityRequired: 70, followerBonus: 20000 },
  { id: 'cel-travis', name: 'Travis Scott', category: 'rapper', description: 'Rappeur US, icône de la culture', emoji: '🎤', instagramHandle: '@travisscott', instagramFollowers: 55, popularityRequired: 60, followerBonus: 15000 },
  { id: 'cel-kanye', name: 'Kanye West', category: 'rapper', description: 'Ye, génie controversé', emoji: '🎤', instagramHandle: '@ye', instagramFollowers: 18, popularityRequired: 65, followerBonus: 10000 },
  { id: 'cel-sch', name: 'SCH', category: 'rapper', description: 'Rappeur marseillais, JVLIVS', emoji: '🎤', instagramHandle: '@sch', instagramFollowers: 5, popularityRequired: 25, followerBonus: 2000 },
];

// ─── Acteurs / Cinéma ────────────────────────────────────────────────────────

const ACTORS: CelebrityProfile[] = [
  { id: 'cel-omar', name: 'Omar Sy', category: 'actor', description: 'Acteur français, star internationale', emoji: '🎬', instagramHandle: '@omarsyofficial', instagramFollowers: 12, popularityRequired: 30, followerBonus: 5000 },
  { id: 'cel-jamel', name: 'Jamel Debbouze', category: 'actor', description: 'Humoriste et acteur culte', emoji: '🎬', instagramHandle: '@jaabormel', instagramFollowers: 5, popularityRequired: 25, followerBonus: 2500 },
  { id: 'cel-dicaprio', name: 'Leonardo DiCaprio', category: 'actor', description: 'Acteur hollywoodien légendaire', emoji: '🎬', instagramHandle: '@leonardodicaprio', instagramFollowers: 65, popularityRequired: 75, followerBonus: 25000 },
  { id: 'cel-will', name: 'Will Smith', category: 'actor', description: 'Acteur et producteur américain', emoji: '🎬', instagramHandle: '@willsmith', instagramFollowers: 70, popularityRequired: 60, followerBonus: 15000 },
  { id: 'cel-zidane-actor', name: 'Dany Boon', category: 'actor', description: 'Acteur et humoriste du Nord', emoji: '🎬', instagramHandle: '@danyboon', instagramFollowers: 3, popularityRequired: 20, followerBonus: 1500 },
  { id: 'cel-mbj', name: 'Michael B. Jordan', category: 'actor', description: 'Acteur US, fan de foot', emoji: '🎬', instagramHandle: '@michaelbjordan', instagramFollowers: 25, popularityRequired: 50, followerBonus: 8000 },
  { id: 'cel-rock', name: 'Dwayne Johnson', category: 'actor', description: 'The Rock, acteur et entrepreneur', emoji: '🎬', instagramHandle: '@therock', instagramFollowers: 395, popularityRequired: 80, followerBonus: 50000 },
];

// ─── Politiques ──────────────────────────────────────────────────────────────

const POLITICIANS: CelebrityProfile[] = [
  { id: 'cel-macron', name: 'Emmanuel Macron', category: 'politician', description: 'Président de la République française', emoji: '🏛️', instagramHandle: '@emmanuelmacron', instagramFollowers: 12, popularityRequired: 50, followerBonus: 5000 },
  { id: 'cel-mbappe-pol', name: 'Kylian (ambassadeur UNICEF)', category: 'politician', description: 'Ambassadeur de bonne volonté', emoji: '🌍', instagramHandle: '@unicef', instagramFollowers: 20, popularityRequired: 55, followerBonus: 3000 },
  { id: 'cel-obama', name: 'Barack Obama', category: 'politician', description: 'Ancien président des États-Unis', emoji: '🏛️', instagramHandle: '@barackobama', instagramFollowers: 55, popularityRequired: 80, followerBonus: 20000 },
  { id: 'cel-hidalgo', name: 'Anne Hidalgo', category: 'politician', description: 'Maire de Paris', emoji: '🏛️', instagramHandle: '@annehidalgo', instagramFollowers: 1, popularityRequired: 35, followerBonus: 1000 },
  { id: 'cel-elon', name: 'Elon Musk', category: 'politician', description: 'Entrepreneur tech, propriétaire de X', emoji: '🚀', instagramHandle: '@elonmusk', instagramFollowers: 30, popularityRequired: 70, followerBonus: 15000 },
];

// ─── Sportifs (hors foot) ────────────────────────────────────────────────────

const ATHLETES: CelebrityProfile[] = [
  { id: 'cel-lebron', name: 'LeBron James', category: 'athlete', description: 'Légende du basketball NBA', emoji: '🏀', instagramHandle: '@kingjames', instagramFollowers: 160, popularityRequired: 65, followerBonus: 20000 },
  { id: 'cel-djokovic', name: 'Novak Djokovic', category: 'athlete', description: 'Plus grand tennisman de l\'histoire', emoji: '🎾', instagramHandle: '@djokernole', instagramFollowers: 15, popularityRequired: 40, followerBonus: 5000 },
  { id: 'cel-hamilton', name: 'Lewis Hamilton', category: 'athlete', description: 'Pilote F1, 7x champion du monde', emoji: '🏎️', instagramHandle: '@lewishamilton', instagramFollowers: 35, popularityRequired: 50, followerBonus: 10000 },
  { id: 'cel-teddy', name: 'Teddy Riner', category: 'athlete', description: 'Judoka français, triple champion olympique', emoji: '🥋', instagramHandle: '@teddyriner', instagramFollowers: 3, popularityRequired: 25, followerBonus: 2000 },
  { id: 'cel-tony', name: 'Tony Parker', category: 'athlete', description: 'Légende du basket français, ex-NBA', emoji: '🏀', instagramHandle: '@tonyparker', instagramFollowers: 5, popularityRequired: 30, followerBonus: 3000 },
  { id: 'cel-conor', name: 'Conor McGregor', category: 'athlete', description: 'Star du MMA, personnalité explosive', emoji: '🥊', instagramHandle: '@thenotoriousmma', instagramFollowers: 50, popularityRequired: 45, followerBonus: 8000 },
  { id: 'cel-usain', name: 'Usain Bolt', category: 'athlete', description: 'L\'homme le plus rapide de l\'histoire', emoji: '⚡', instagramHandle: '@usainbolt', instagramFollowers: 12, popularityRequired: 40, followerBonus: 5000 },
];

// ─── Influenceurs / Personnalités ────────────────────────────────────────────

const INFLUENCERS: CelebrityProfile[] = [
  { id: 'cel-squeezie', name: 'Squeezie', category: 'influencer', description: 'Youtubeur #1 en France', emoji: '🎮', instagramHandle: '@xsqueezie', instagramFollowers: 9, popularityRequired: 15, followerBonus: 3000 },
  { id: 'cel-cyprien', name: 'Cyprien', category: 'influencer', description: 'Youtubeur et créateur de contenu', emoji: '🎮', instagramHandle: '@cyprien', instagramFollowers: 6, popularityRequired: 15, followerBonus: 2000 },
  { id: 'cel-mrbeast', name: 'MrBeast', category: 'influencer', description: 'Youtubeur le plus suivi au monde', emoji: '🎮', instagramHandle: '@mrbeast', instagramFollowers: 45, popularityRequired: 55, followerBonus: 15000 },
  { id: 'cel-khaby', name: 'Khaby Lame', category: 'influencer', description: 'TikTokeur le plus suivi au monde', emoji: '📱', instagramHandle: '@khaby00', instagramFollowers: 80, popularityRequired: 40, followerBonus: 10000 },
  { id: 'cel-inoxtag', name: 'Inoxtag', category: 'influencer', description: 'Youtubeur français, aventurier', emoji: '🎮', instagramHandle: '@inoxtag', instagramFollowers: 7, popularityRequired: 20, followerBonus: 3000 },
  { id: 'cel-amine', name: 'Aminematue', category: 'influencer', description: 'Streamer et créateur de contenu', emoji: '🎮', instagramHandle: '@aminematue', instagramFollowers: 4, popularityRequired: 15, followerBonus: 1500 },
];

// ─── Musiciens (hors rap) ────────────────────────────────────────────────────

const MUSICIANS: CelebrityProfile[] = [
  { id: 'cel-aya', name: 'Aya Nakamura', category: 'musician', description: 'Chanteuse la plus streamée de France', emoji: '🎵', instagramHandle: '@ayanakamura', instagramFollowers: 10, popularityRequired: 25, followerBonus: 4000 },
  { id: 'cel-angele', name: 'Angèle', category: 'musician', description: 'Chanteuse belge, pop star', emoji: '🎵', instagramHandle: '@angele_vl', instagramFollowers: 5, popularityRequired: 20, followerBonus: 2500 },
  { id: 'cel-ed', name: 'Ed Sheeran', category: 'musician', description: 'Chanteur britannique, fan de foot', emoji: '🎵', instagramHandle: '@teddysphotos', instagramFollowers: 45, popularityRequired: 50, followerBonus: 10000 },
  { id: 'cel-rihanna', name: 'Rihanna', category: 'musician', description: 'Superstar mondiale, Fenty', emoji: '🎵', instagramHandle: '@badgalriri', instagramFollowers: 150, popularityRequired: 75, followerBonus: 30000 },
  { id: 'cel-weeknd', name: 'The Weeknd', category: 'musician', description: 'Chanteur R&B canadien', emoji: '🎵', instagramHandle: '@theweeknd', instagramFollowers: 70, popularityRequired: 60, followerBonus: 15000 },
  { id: 'cel-dua', name: 'Dua Lipa', category: 'musician', description: 'Pop star britannique', emoji: '🎵', instagramHandle: '@dualipa', instagramFollowers: 90, popularityRequired: 55, followerBonus: 12000 },
];

// ─── Export ──────────────────────────────────────────────────────────────────

export const ALL_CELEBRITIES: CelebrityProfile[] = [
  ...RAPPERS,
  ...ACTORS,
  ...POLITICIANS,
  ...ATHLETES,
  ...INFLUENCERS,
  ...MUSICIANS,
];

export const CELEBRITIES_BY_CATEGORY: Record<CelebrityCategory, CelebrityProfile[]> = {
  rapper: RAPPERS,
  actor: ACTORS,
  politician: POLITICIANS,
  athlete: ATHLETES,
  influencer: INFLUENCERS,
  musician: MUSICIANS,
};

export const CATEGORY_LABELS: Record<CelebrityCategory, string> = {
  rapper: '🎤 Rappeurs',
  actor: '🎬 Cinéma',
  politician: '🏛️ Politiques',
  athlete: '🏀 Sportifs',
  influencer: '🎮 Influenceurs',
  musician: '🎵 Musiciens',
};

/**
 * Retourne les célébrités accessibles selon la popularité du joueur.
 */
export function getAvailableCelebrities(popularity: number): CelebrityProfile[] {
  return ALL_CELEBRITIES.filter((c) => c.popularityRequired <= popularity);
}
