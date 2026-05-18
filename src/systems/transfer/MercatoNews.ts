/**
 * MercatoNews — Génère des transferts fictifs d'autres joueurs pendant les fenêtres de mercato.
 * Affichés dans le feed social et dans un onglet dédié.
 */

import { type RNG, defaultRNG } from '../../utils/random';

export interface MercatoTransfer {
  id: string;
  playerName: string;
  fromClub: string;
  toClub: string;
  fee: number; // en millions
  season: number;
  window: 'summer' | 'winter';
}

const STAR_PLAYERS = [
  'Vinícius Jr', 'Jude Bellingham', 'Erling Haaland', 'Kylian Mbappé',
  'Bukayo Saka', 'Phil Foden', 'Florian Wirtz', 'Jamal Musiala',
  'Lamine Yamal', 'Cole Palmer', 'Victor Osimhen', 'Rafael Leão',
  'Khvicha Kvaratskhelia', 'Rodri', 'Declan Rice', 'Federico Valverde',
  'Aurélien Tchouaméni', 'Pedri', 'Gavi', 'Nico Williams',
  'Bradley Barcola', 'Warren Zaïre-Emery', 'Kobbie Mainoo',
  'Alejandro Garnacho', 'Leny Yoro', 'Mathys Tel',
  'Ousmane Dembélé', 'Marcus Rashford', 'Leroy Sané',
  'Dusan Vlahovic', 'Randal Kolo Muani', 'Jonathan David',
];

const BIG_CLUBS = [
  'Real Madrid', 'FC Barcelona', 'Manchester City', 'Arsenal',
  'Liverpool', 'Chelsea', 'Manchester United', 'Bayern Munich',
  'PSG', 'Juventus', 'Inter Milan', 'AC Milan',
  'Borussia Dortmund', 'Atlético Madrid', 'Napoli', 'Tottenham',
];

const MEDIUM_CLUBS = [
  'Aston Villa', 'Newcastle', 'West Ham', 'Brighton',
  'RC Lens', 'OGC Nice', 'AS Monaco', 'Fiorentina',
  'Roma', 'Lazio', 'Real Betis', 'Villarreal',
  'RB Leipzig', 'Bayer Leverkusen', 'Wolfsburg', 'Séville',
];

/**
 * Génère 3-6 transferts aléatoires pour une fenêtre de mercato.
 */
export function generateMercatoTransfers(
  season: number,
  window: 'summer' | 'winter',
  rng: RNG = defaultRNG
): MercatoTransfer[] {
  const count = rng.randomInt(3, 6);
  const transfers: MercatoTransfer[] = [];
  const usedPlayers = new Set<string>();

  for (let i = 0; i < count; i++) {
    let player: string;
    do {
      player = rng.randomChoice(STAR_PLAYERS);
    } while (usedPlayers.has(player));
    usedPlayers.add(player);

    const fromClub = rng.randomChoice([...BIG_CLUBS, ...MEDIUM_CLUBS]);
    let toClub: string;
    do {
      toClub = rng.randomChoice(BIG_CLUBS);
    } while (toClub === fromClub);

    const fee = rng.randomInt(20, 150);

    transfers.push({
      id: `mercato-${season}-${window}-${i}`,
      playerName: player,
      fromClub,
      toClub,
      fee,
      season,
      window,
    });
  }

  return transfers;
}

export const MercatoNewsSystem = {
  generateMercatoTransfers,
};
