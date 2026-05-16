/**
 * CoachSpeech — Discours de l'entraîneur avant le match.
 *
 * Génère un message contextuel basé sur l'importance du match et la relation
 * avec l'entraîneur. Utilisé dans l'écran pré-match.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type MatchImportance = 'crucial' | 'important' | 'normal';
export type CoachTone = 'encouraging' | 'neutral' | 'cold';

export interface CoachSpeechParams {
  matchday: number;
  position: number;
  coachRelation: number;
}

export interface CoachSpeechResult {
  message: string;
  importance: MatchImportance;
  tone: CoachTone;
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Calculates match importance based on matchday and league position.
 * - matchday > 30 → crucial (end of season pressure)
 * - position <= 3 → important (title race)
 * - else → normal
 */
export function calculateImportance(matchday: number, position: number): MatchImportance {
  if (matchday > 30) return 'crucial';
  if (position <= 3) return 'important';
  return 'normal';
}

/**
 * Determines coach tone based on the relationship value (0-100).
 * - > 70 → encouraging
 * - 40-70 → neutral
 * - < 40 → cold
 */
export function selectTone(coachRelation: number): CoachTone {
  if (coachRelation > 70) return 'encouraging';
  if (coachRelation < 40) return 'cold';
  return 'neutral';
}

// ─── Message Templates ───────────────────────────────────────────────────────

const SPEECH_TEMPLATES: Record<MatchImportance, Record<CoachTone, string[]>> = {
  crucial: {
    encouraging: [
      "C'est le moment qu'on attendait tous. Je crois en toi, montre-leur de quoi tu es capable !",
      "La saison se joue maintenant. Tu es prêt, je le sais. Donne tout sur le terrain !",
      "On y est. Chaque ballon compte. J'ai confiance en toi, fais-nous rêver !",
    ],
    neutral: [
      "Match décisif aujourd'hui. Reste concentré et applique le plan de jeu.",
      "La fin de saison est là. Fais ton travail, c'est tout ce qu'on te demande.",
      "Journée importante. Pas de fantaisie, on joue collectif.",
    ],
    cold: [
      "C'est un match crucial. Ne me déçois pas, c'est ta dernière chance de prouver ta valeur.",
      "La saison se termine bientôt. Si tu veux jouer, c'est maintenant ou jamais.",
      "Match décisif. J'attends des résultats, pas des excuses.",
    ],
  },
  important: {
    encouraging: [
      "On est dans la course au titre ! Continue comme ça, tu es notre arme secrète.",
      "Le podium est à portée de main. Je compte sur toi pour faire la différence !",
      "Belle dynamique en ce moment. Garde cette énergie, on peut aller loin ensemble !",
    ],
    neutral: [
      "On est bien placés au classement. Reste sérieux et applique les consignes.",
      "Position intéressante au classement. Fais ton match, simplement.",
      "On joue le haut de tableau. Pas de relâchement aujourd'hui.",
    ],
    cold: [
      "On est bien classés malgré tout. Essaie de ne pas tout gâcher aujourd'hui.",
      "Le classement est bon, pas grâce à toi. Prouve que tu mérites ta place.",
      "Position correcte au classement. Tâche de ne pas être un boulet.",
    ],
  },
  normal: {
    encouraging: [
      "Match tranquille aujourd'hui. Amuse-toi et montre ton talent !",
      "Pas de pression particulière, profite du match. Tu as le niveau !",
      "Joue ton jeu, fais-toi plaisir. Je sais que tu peux briller !",
    ],
    neutral: [
      "Match classique aujourd'hui. Reste concentré et fais ton travail.",
      "Rien de spécial aujourd'hui, mais chaque point compte. Applique le plan.",
      "On joue notre match. Discipline et rigueur, comme d'habitude.",
    ],
    cold: [
      "Encore un match. Essaie au moins de ne pas être invisible sur le terrain.",
      "Je n'attends pas grand-chose, mais surprends-moi pour une fois.",
      "Fais ton match. Si tu es capable de ça, au moins.",
    ],
  },
};

/**
 * Selects a message template based on importance and tone.
 * Uses a deterministic selection based on matchday to avoid randomness in tests
 * while still varying messages across different matchdays.
 */
export function selectMessage(importance: MatchImportance, tone: CoachTone, matchday: number): string {
  const templates = SPEECH_TEMPLATES[importance][tone];
  const index = matchday % templates.length;
  return templates[index];
}

/**
 * Generates the full coach speech result including message, importance, and tone.
 */
export function generateCoachSpeech(params: CoachSpeechParams): CoachSpeechResult {
  const importance = calculateImportance(params.matchday, params.position);
  const tone = selectTone(params.coachRelation);
  const message = selectMessage(importance, tone, params.matchday);

  return { message, importance, tone };
}

// ─── React Component ─────────────────────────────────────────────────────────

interface CoachSpeechProps {
  matchday: number;
  position: number;
  coachRelation: number;
}

const TONE_STYLES: Record<CoachTone, string> = {
  encouraging: 'border-l-green-500 bg-green-500/10',
  neutral: 'border-l-yellow-500 bg-yellow-500/10',
  cold: 'border-l-red-500 bg-red-500/10',
};

const IMPORTANCE_LABELS: Record<MatchImportance, string> = {
  crucial: '🔥 Match crucial',
  important: '⭐ Match important',
  normal: '⚽ Match',
};

export function CoachSpeech({ matchday, position, coachRelation }: CoachSpeechProps) {
  const { message, importance, tone } = generateCoachSpeech({ matchday, position, coachRelation });

  return (
    <div className={`border-l-4 rounded-r-lg p-4 ${TONE_STYLES[tone]}`}>
      <p className="text-xs font-medium text-text-muted mb-1">
        {IMPORTANCE_LABELS[importance]} — Discours du coach
      </p>
      <p className="text-sm text-text italic">"{message}"</p>
    </div>
  );
}
