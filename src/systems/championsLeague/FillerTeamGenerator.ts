/**
 * Générateur d'équipes filler pour la Ligue des Champions.
 * Produit exactement 30 équipes fictives représentant des clubs de ligues mineures
 * non jouables dans le jeu.
 */

import type { CLParticipant } from './types';
import { CL_CONSTANTS } from './types';
import { type RNG, defaultRNG } from '../../utils/random';

// Noms de clubs fictifs inspirés de ligues mineures européennes
const FILLER_CLUB_NAMES: string[] = [
  'FK Partizan', 'Steaua București', 'Olympiacos Piraeus', 'Galatasaray SK',
  'Sporting CP', 'SL Benfica', 'FC Porto', 'Celtic FC',
  'Rangers FC', 'Ajax Amsterdam', 'PSV Eindhoven', 'Feyenoord Rotterdam',
  'Club Brugge', 'RSC Anderlecht', 'FC Salzburg', 'Rapid Wien',
  'Shakhtar Donetsk', 'Dynamo Kyiv', 'Spartak Moskva', 'Zenit St Petersburg',
  'FC København', 'Malmö FF', 'Rosenborg BK', 'HJK Helsinki',
  'Ferencváros TC', 'Slavia Praha', 'Sparta Praha', 'Legia Warszawa',
  'Dinamo Zagreb', 'FK Crvena Zvezda', 'APOEL Nicosia', 'Maccabi Tel Aviv',
  'FC Basel', 'BSC Young Boys', 'Lech Poznań', 'Viktoria Plzeň',
];

// Pays associés aux équipes filler (hors des 5 ligues principales)
const FILLER_COUNTRIES: string[] = [
  'serbia', 'romania', 'greece', 'turkey', 'portugal',
  'scotland', 'netherlands', 'belgium', 'austria',
  'ukraine', 'denmark', 'sweden', 'norway', 'finland',
  'hungary', 'czech_republic', 'poland', 'croatia',
  'cyprus', 'israel', 'switzerland',
];

/**
 * Génère exactement 30 équipes filler pour compléter les 50 participants de la CL.
 * Chaque équipe a un nom unique, un pays (hors des 5 ligues principales),
 * une averageRating entre 60 et 80, et isFiller = true.
 */
export function generate(rng: RNG = defaultRNG): CLParticipant[] {
  const fillers: CLParticipant[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < CL_CONSTANTS.TOTAL_FILLERS; i++) {
    // Sélectionner un nom unique
    let name: string;
    do {
      name = rng.randomChoice(FILLER_CLUB_NAMES);
    } while (usedNames.has(name));
    usedNames.add(name);

    const country = rng.randomChoice(FILLER_COUNTRIES);
    const averageRating = rng.randomInt(60, 80);

    fillers.push({
      id: `filler-${i + 1}`,
      name,
      country,
      averageRating,
      isFiller: true,
    });
  }

  return fillers;
}

export const FillerTeamGenerator = { generate };
