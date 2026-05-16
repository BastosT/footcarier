/**
 * Boutique d'objets de style de vie : maisons, voitures, bijoux.
 * Prix réalistes. La boutique change chaque semaine (sélection aléatoire).
 */

export type ItemCategory = 'house' | 'car' | 'jewelry' | 'fashion';

export interface ShopItem {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  description: string;
  emoji: string;
  tier: 'budget' | 'mid' | 'luxury' | 'ultra';
}

// ─── Maisons (20+) ──────────────────────────────────────────────────────────

export const ALL_HOUSES: ShopItem[] = [
  { id: 'apt-studio', name: 'Studio 20m²', category: 'house', price: 95_000, description: 'Petit studio étudiant', emoji: '🏢', tier: 'budget' },
  { id: 'apt-t1', name: 'Appartement T1 30m²', category: 'house', price: 150_000, description: 'T1 avec cuisine équipée', emoji: '🏢', tier: 'budget' },
  { id: 'apt-t2', name: 'Appartement T2 45m²', category: 'house', price: 250_000, description: 'Appartement 2 pièces avec balcon', emoji: '🏢', tier: 'budget' },
  { id: 'apt-t3', name: 'Appartement T3 70m²', category: 'house', price: 380_000, description: 'Bel appartement familial lumineux', emoji: '🏠', tier: 'budget' },
  { id: 'apt-t4', name: 'Appartement T4 90m²', category: 'house', price: 520_000, description: 'Grand appartement avec terrasse', emoji: '🏠', tier: 'mid' },
  { id: 'apt-duplex', name: 'Duplex 110m²', category: 'house', price: 750_000, description: 'Duplex moderne sur 2 niveaux', emoji: '🏠', tier: 'mid' },
  { id: 'apt-penthouse', name: 'Penthouse 150m²', category: 'house', price: 1_500_000, description: 'Penthouse avec terrasse panoramique', emoji: '🏙️', tier: 'mid' },
  { id: 'apt-loft', name: 'Loft industriel 200m²', category: 'house', price: 1_800_000, description: 'Ancien atelier rénové, plafonds 5m', emoji: '🏗️', tier: 'mid' },
  { id: 'house-maison', name: 'Maison 120m²', category: 'house', price: 450_000, description: 'Maison avec jardin en banlieue', emoji: '🏡', tier: 'mid' },
  { id: 'house-villa-s', name: 'Villa 180m²', category: 'house', price: 1_200_000, description: 'Villa avec piscine', emoji: '🏡', tier: 'mid' },
  { id: 'house-villa', name: 'Villa 250m² avec piscine', category: 'house', price: 2_500_000, description: 'Grande villa, piscine chauffée, garage 3 places', emoji: '🏡', tier: 'luxury' },
  { id: 'house-villa-l', name: 'Villa contemporaine 350m²', category: 'house', price: 4_000_000, description: 'Architecture moderne, vue mer, spa', emoji: '🏡', tier: 'luxury' },
  { id: 'house-mansion', name: 'Manoir 500m²', category: 'house', price: 6_500_000, description: 'Manoir avec parc privé et dépendances', emoji: '🏰', tier: 'luxury' },
  { id: 'house-chateau', name: 'Château rénové', category: 'house', price: 9_000_000, description: 'Château du XVIIIe siècle, 15 chambres', emoji: '🏰', tier: 'luxury' },
  { id: 'house-mega', name: 'Méga Villa 800m²', category: 'house', price: 15_000_000, description: 'Propriété avec spa, cinéma, terrain de foot', emoji: '🏯', tier: 'ultra' },
  { id: 'house-beverly', name: 'Villa Beverly Hills', category: 'house', price: 22_000_000, description: 'Villa de star à Los Angeles', emoji: '🌴', tier: 'ultra' },
  { id: 'house-monaco', name: 'Penthouse Monaco', category: 'house', price: 35_000_000, description: 'Penthouse vue port de Monaco', emoji: '🏙️', tier: 'ultra' },
  { id: 'house-island', name: 'Île privée', category: 'house', price: 50_000_000, description: 'Île privée avec villa de rêve aux Maldives', emoji: '🏝️', tier: 'ultra' },
  { id: 'house-dubai', name: 'Villa Palm Jumeirah', category: 'house', price: 18_000_000, description: 'Villa sur l\'île artificielle de Dubaï', emoji: '🌴', tier: 'ultra' },
  { id: 'house-ibiza', name: 'Finca Ibiza', category: 'house', price: 8_000_000, description: 'Propriété de charme avec vue mer à Ibiza', emoji: '🏡', tier: 'luxury' },
];

// ─── Voitures (20+) ──────────────────────────────────────────────────────────

export const ALL_CARS: ShopItem[] = [
  { id: 'car-clio', name: 'Renault Clio', category: 'car', price: 22_000, description: 'Citadine française populaire', emoji: '🚗', tier: 'budget' },
  { id: 'car-golf', name: 'Volkswagen Golf', category: 'car', price: 35_000, description: 'Compacte fiable et confortable', emoji: '🚗', tier: 'budget' },
  { id: 'car-a3', name: 'Audi A3', category: 'car', price: 42_000, description: 'Berline compacte premium', emoji: '🚗', tier: 'budget' },
  { id: 'car-bmw3', name: 'BMW Série 3', category: 'car', price: 55_000, description: 'Berline sportive allemande', emoji: '🚗', tier: 'budget' },
  { id: 'car-c-class', name: 'Mercedes Classe C', category: 'car', price: 60_000, description: 'Berline de luxe', emoji: '🚗', tier: 'mid' },
  { id: 'car-bmw-m4', name: 'BMW M4 Competition', category: 'car', price: 105_000, description: 'Coupé sportif haute performance', emoji: '🏎️', tier: 'mid' },
  { id: 'car-amg', name: 'Mercedes AMG C63', category: 'car', price: 130_000, description: 'Berline V8 biturbo 510ch', emoji: '🏎️', tier: 'mid' },
  { id: 'car-porsche-macan', name: 'Porsche Macan', category: 'car', price: 85_000, description: 'SUV sportif premium', emoji: '🚙', tier: 'mid' },
  { id: 'car-porsche-911', name: 'Porsche 911 Carrera', category: 'car', price: 150_000, description: 'Sportive iconique', emoji: '🏎️', tier: 'mid' },
  { id: 'car-porsche-turbo', name: 'Porsche 911 Turbo S', category: 'car', price: 250_000, description: '650ch, 0-100 en 2.7s', emoji: '🏎️', tier: 'luxury' },
  { id: 'car-ferrari-roma', name: 'Ferrari Roma', category: 'car', price: 230_000, description: 'GT italienne élégante', emoji: '🏎️', tier: 'luxury' },
  { id: 'car-ferrari-f8', name: 'Ferrari F8 Tributo', category: 'car', price: 300_000, description: 'Supercar V8 720ch', emoji: '🏎️', tier: 'luxury' },
  { id: 'car-lambo-huracan', name: 'Lamborghini Huracán', category: 'car', price: 270_000, description: 'Supercar V10 spectaculaire', emoji: '🏎️', tier: 'luxury' },
  { id: 'car-lambo-urus', name: 'Lamborghini Urus', category: 'car', price: 220_000, description: 'Super SUV 650ch', emoji: '🚙', tier: 'luxury' },
  { id: 'car-lambo-aventador', name: 'Lamborghini Aventador', category: 'car', price: 450_000, description: 'V12 770ch, la légende', emoji: '🏎️', tier: 'luxury' },
  { id: 'car-mclaren', name: 'McLaren 720S', category: 'car', price: 280_000, description: 'Supercar britannique', emoji: '🏎️', tier: 'luxury' },
  { id: 'car-rolls', name: 'Rolls-Royce Phantom', category: 'car', price: 500_000, description: 'Le summum du luxe automobile', emoji: '🚘', tier: 'luxury' },
  { id: 'car-rolls-cullinan', name: 'Rolls-Royce Cullinan', category: 'car', price: 400_000, description: 'SUV ultra-luxe', emoji: '🚘', tier: 'luxury' },
  { id: 'car-bentley', name: 'Bentley Continental GT', category: 'car', price: 250_000, description: 'Grand tourisme W12', emoji: '🚘', tier: 'luxury' },
  { id: 'car-bugatti', name: 'Bugatti Chiron', category: 'car', price: 3_000_000, description: 'Hypercar 1500ch, 420 km/h', emoji: '🏎️', tier: 'ultra' },
  { id: 'car-pagani', name: 'Pagani Huayra', category: 'car', price: 3_500_000, description: 'Œuvre d\'art sur roues', emoji: '🏎️', tier: 'ultra' },
  { id: 'car-koenigsegg', name: 'Koenigsegg Jesko', category: 'car', price: 3_200_000, description: 'Hypercar suédoise 1600ch', emoji: '🏎️', tier: 'ultra' },
  { id: 'car-ferrari-laferrari', name: 'Ferrari LaFerrari', category: 'car', price: 5_000_000, description: 'Hypercar hybride collector', emoji: '🏎️', tier: 'ultra' },
];

// ─── Bijoux / Montres (20+) ─────────────────────────────────────────────────

export const ALL_JEWELRY: ShopItem[] = [
  { id: 'watch-casio', name: 'Casio G-Shock', category: 'jewelry', price: 150, description: 'Montre sport indestructible', emoji: '⌚', tier: 'budget' },
  { id: 'watch-seiko', name: 'Seiko Presage', category: 'jewelry', price: 800, description: 'Montre automatique japonaise', emoji: '⌚', tier: 'budget' },
  { id: 'watch-tag', name: 'TAG Heuer Carrera', category: 'jewelry', price: 5_000, description: 'Chronographe sportif suisse', emoji: '⌚', tier: 'budget' },
  { id: 'watch-omega-sea', name: 'Omega Seamaster', category: 'jewelry', price: 8_500, description: 'Montre de plongée iconique', emoji: '⌚', tier: 'mid' },
  { id: 'watch-omega-speed', name: 'Omega Speedmaster', category: 'jewelry', price: 7_500, description: 'La montre de la NASA', emoji: '⌚', tier: 'mid' },
  { id: 'watch-rolex-sub', name: 'Rolex Submariner', category: 'jewelry', price: 12_000, description: 'La montre de plongée par excellence', emoji: '⌚', tier: 'mid' },
  { id: 'watch-rolex-datejust', name: 'Rolex Datejust', category: 'jewelry', price: 15_000, description: 'Classique intemporel', emoji: '⌚', tier: 'mid' },
  { id: 'watch-rolex-daytona', name: 'Rolex Daytona', category: 'jewelry', price: 35_000, description: 'Chronographe de course légendaire', emoji: '⌚', tier: 'luxury' },
  { id: 'watch-rolex-day', name: 'Rolex Day-Date or', category: 'jewelry', price: 55_000, description: 'La montre des présidents, or 18k', emoji: '⌚', tier: 'luxury' },
  { id: 'watch-ap-ro', name: 'Audemars Piguet Royal Oak', category: 'jewelry', price: 80_000, description: 'Haute horlogerie sportive', emoji: '⌚', tier: 'luxury' },
  { id: 'watch-ap-offshore', name: 'AP Royal Oak Offshore', category: 'jewelry', price: 45_000, description: 'Version sportive du Royal Oak', emoji: '⌚', tier: 'luxury' },
  { id: 'watch-patek-aqua', name: 'Patek Philippe Aquanaut', category: 'jewelry', price: 60_000, description: 'Sport-chic par excellence', emoji: '⌚', tier: 'luxury' },
  { id: 'watch-patek-nautilus', name: 'Patek Philippe Nautilus', category: 'jewelry', price: 150_000, description: 'Le graal des collectionneurs', emoji: '⌚', tier: 'ultra' },
  { id: 'watch-rm11', name: 'Richard Mille RM 011', category: 'jewelry', price: 250_000, description: 'La montre des sportifs d\'élite', emoji: '⌚', tier: 'ultra' },
  { id: 'watch-rm35', name: 'Richard Mille RM 035', category: 'jewelry', price: 350_000, description: 'Ultra-légère, portée par Nadal', emoji: '⌚', tier: 'ultra' },
  { id: 'watch-jacob', name: 'Jacob & Co Astronomia', category: 'jewelry', price: 500_000, description: 'Montre tourbillon spectaculaire', emoji: '⌚', tier: 'ultra' },
  { id: 'chain-silver', name: 'Chaîne argent 925', category: 'jewelry', price: 500, description: 'Chaîne cubaine en argent', emoji: '📿', tier: 'budget' },
  { id: 'chain-gold', name: 'Chaîne en or 18k', category: 'jewelry', price: 8_000, description: 'Chaîne cubaine en or massif', emoji: '📿', tier: 'mid' },
  { id: 'chain-gold-xl', name: 'Chaîne or 18k épaisse', category: 'jewelry', price: 25_000, description: 'Chaîne Miami Cuban Link massive', emoji: '📿', tier: 'luxury' },
  { id: 'bracelet-cartier', name: 'Bracelet Cartier Love', category: 'jewelry', price: 10_000, description: 'Bracelet iconique en or', emoji: '💍', tier: 'mid' },
  { id: 'ring-diamond', name: 'Bague diamant 1ct', category: 'jewelry', price: 15_000, description: 'Solitaire diamant brillant', emoji: '💍', tier: 'mid' },
  { id: 'pendant-diamond', name: 'Pendentif diamant 3ct', category: 'jewelry', price: 120_000, description: 'Diamant exceptionnel sur platine', emoji: '💎', tier: 'luxury' },
  { id: 'earrings-diamond', name: 'Boucles diamants 2ct', category: 'jewelry', price: 45_000, description: 'Paire de boucles en diamants', emoji: '💎', tier: 'luxury' },
];

// ─── Mode / Luxe (20+) ──────────────────────────────────────────────────────

export const ALL_FASHION: ShopItem[] = [
  { id: 'bag-goyard', name: 'Sac Goyard Saint-Louis', category: 'fashion', price: 2_500, description: 'Sac iconique en toile Goyardine', emoji: '👜', tier: 'mid' },
  { id: 'bag-lv-keepall', name: 'Louis Vuitton Keepall', category: 'fashion', price: 2_200, description: 'Sac de voyage monogram', emoji: '👜', tier: 'mid' },
  { id: 'bag-hermes-birkin', name: 'Hermès Birkin 30', category: 'fashion', price: 12_000, description: 'Le sac le plus exclusif au monde', emoji: '👜', tier: 'luxury' },
  { id: 'bag-dior-saddle', name: 'Dior Saddle Bag', category: 'fashion', price: 3_500, description: 'Sac iconique Dior', emoji: '👜', tier: 'mid' },
  { id: 'shoes-louboutin', name: 'Louboutin Red Bottoms', category: 'fashion', price: 1_200, description: 'Chaussures à semelle rouge', emoji: '👞', tier: 'mid' },
  { id: 'shoes-jordan-og', name: 'Air Jordan 1 OG', category: 'fashion', price: 180, description: 'Sneakers légendaires', emoji: '👟', tier: 'budget' },
  { id: 'shoes-jordan-dior', name: 'Air Jordan 1 x Dior', category: 'fashion', price: 10_000, description: 'Collab ultra-limitée', emoji: '👟', tier: 'luxury' },
  { id: 'shoes-yeezy', name: 'Yeezy 350 V2', category: 'fashion', price: 300, description: 'Sneakers Kanye West', emoji: '👟', tier: 'budget' },
  { id: 'jacket-moncler', name: 'Doudoune Moncler', category: 'fashion', price: 1_800, description: 'Doudoune premium française', emoji: '🧥', tier: 'mid' },
  { id: 'jacket-lv', name: 'Blouson Louis Vuitton', category: 'fashion', price: 4_500, description: 'Blouson en cuir monogram', emoji: '🧥', tier: 'luxury' },
  { id: 'tshirt-balenciaga', name: 'T-shirt Balenciaga', category: 'fashion', price: 650, description: 'T-shirt oversize logo', emoji: '👕', tier: 'budget' },
  { id: 'hoodie-offwhite', name: 'Hoodie Off-White', category: 'fashion', price: 800, description: 'Hoodie avec flèches', emoji: '👕', tier: 'budget' },
  { id: 'pants-amiri', name: 'Jean Amiri', category: 'fashion', price: 1_200, description: 'Jean destroyed premium', emoji: '👖', tier: 'mid' },
  { id: 'belt-hermes', name: 'Ceinture Hermès H', category: 'fashion', price: 900, description: 'Ceinture boucle H dorée', emoji: '👔', tier: 'mid' },
  { id: 'belt-lv', name: 'Ceinture Louis Vuitton', category: 'fashion', price: 600, description: 'Ceinture monogram', emoji: '👔', tier: 'budget' },
  { id: 'glasses-cartier', name: 'Lunettes Cartier', category: 'fashion', price: 3_000, description: 'Lunettes en or', emoji: '🕶️', tier: 'mid' },
  { id: 'glasses-gucci', name: 'Lunettes Gucci', category: 'fashion', price: 450, description: 'Lunettes de soleil aviator', emoji: '🕶️', tier: 'budget' },
  { id: 'suit-tomford', name: 'Costume Tom Ford', category: 'fashion', price: 5_000, description: 'Costume sur mesure', emoji: '🤵', tier: 'luxury' },
  { id: 'perfume-creed', name: 'Parfum Creed Aventus', category: 'fashion', price: 400, description: 'Le parfum des winners', emoji: '🧴', tier: 'budget' },
  { id: 'bag-goyard-xl', name: 'Goyard Artois MM', category: 'fashion', price: 3_200, description: 'Sac cabas Goyard', emoji: '👜', tier: 'mid' },
];

export const ALL_ITEMS: ShopItem[] = [...ALL_HOUSES, ...ALL_CARS, ...ALL_JEWELRY, ...ALL_FASHION];

/**
 * Generates a weekly shop selection (random subset of items).
 * 4-5 houses, 4-5 cars, 4-5 jewelry items.
 */
export function generateWeeklyShop(seed: number): ShopItem[] {
  // Simple seeded random
  let s = seed;
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xFFFFFFFF; return (s >>> 0) / 0xFFFFFFFF; };
  const shuffle = (arr: ShopItem[]): ShopItem[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const houses = shuffle(ALL_HOUSES).slice(0, 4 + Math.floor(rand() * 2));
  const cars = shuffle(ALL_CARS).slice(0, 4 + Math.floor(rand() * 2));
  const jewelry = shuffle(ALL_JEWELRY).slice(0, 4 + Math.floor(rand() * 2));
  const fashion = shuffle(ALL_FASHION).slice(0, 4 + Math.floor(rand() * 3));

  return [...houses, ...cars, ...jewelry, ...fashion];
}
