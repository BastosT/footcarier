/**
 * InterviewGenerator - Génère des interviews contextuelles avec 3 réponses par question.
 */

import type { Interview, InterviewContext, InterviewQuestion, InterviewAnswer } from '../../core/types';
import { type RNG, defaultRNG } from '../../utils/random';

interface QuestionTemplate {
  text: string;
  answers: [
    { text: string; tone: 'humble'; impacts: InterviewAnswer['impacts'] },
    { text: string; tone: 'confident'; impacts: InterviewAnswer['impacts'] },
    { text: string; tone: 'controversial'; impacts: InterviewAnswer['impacts'] },
  ];
}

const POST_MATCH_QUESTIONS: QuestionTemplate[] = [
  {
    text: 'Comment évaluez-vous votre performance aujourd\'hui ?',
    answers: [
      { text: 'L\'équipe a bien joué, je suis content de contribuer.', tone: 'humble', impacts: { popularity: 2, reputation: 1, coachRelation: 3, teamRelation: 2 } },
      { text: 'J\'ai été décisif, comme d\'habitude.', tone: 'confident', impacts: { popularity: 3, reputation: 2, coachRelation: -1, teamRelation: -2 } },
      { text: 'Avec un meilleur soutien de mes coéquipiers, j\'aurais fait encore mieux.', tone: 'controversial', impacts: { popularity: -3, reputation: -2, coachRelation: -5, teamRelation: -8 } },
    ],
  },
  {
    text: 'Quels sont vos objectifs pour la suite de la saison ?',
    answers: [
      { text: 'Continuer à travailler dur et aider l\'équipe.', tone: 'humble', impacts: { popularity: 1, reputation: 2, coachRelation: 3, teamRelation: 2 } },
      { text: 'Je vise le titre de meilleur joueur de la saison.', tone: 'confident', impacts: { popularity: 4, reputation: 3, coachRelation: 0, teamRelation: -1 } },
      { text: 'Si le club ne montre pas plus d\'ambition, je partirai.', tone: 'controversial', impacts: { popularity: -5, reputation: -3, coachRelation: -8, teamRelation: -5 } },
    ],
  },
];

const TRANSFER_QUESTIONS: QuestionTemplate[] = [
  {
    text: 'Des rumeurs de transfert circulent. Qu\'en pensez-vous ?',
    answers: [
      { text: 'Je suis concentré sur mon club actuel.', tone: 'humble', impacts: { popularity: 1, reputation: 2, coachRelation: 5, teamRelation: 3 } },
      { text: 'Les grands clubs s\'intéressent à moi, c\'est normal.', tone: 'confident', impacts: { popularity: 3, reputation: 2, coachRelation: -3, teamRelation: -2 } },
      { text: 'Ce club est trop petit pour mes ambitions.', tone: 'controversial', impacts: { popularity: -8, reputation: -5, coachRelation: -10, teamRelation: -10 } },
    ],
  },
];

const GENERAL_QUESTIONS: QuestionTemplate[] = [
  {
    text: 'Comment se passe votre intégration dans le vestiaire ?',
    answers: [
      { text: 'Les gars sont super, je me sens bien ici.', tone: 'humble', impacts: { popularity: 2, reputation: 1, coachRelation: 2, teamRelation: 5 } },
      { text: 'Je suis un leader naturel, ils me respectent.', tone: 'confident', impacts: { popularity: 1, reputation: 3, coachRelation: 0, teamRelation: -3 } },
      { text: 'Certains joueurs ne sont pas à mon niveau.', tone: 'controversial', impacts: { popularity: -4, reputation: -3, coachRelation: -5, teamRelation: -10 } },
    ],
  },
];

const QUESTIONS_BY_CONTEXT: Record<InterviewContext['type'], QuestionTemplate[]> = {
  post_match: POST_MATCH_QUESTIONS,
  transfer: TRANSFER_QUESTIONS,
  trophy: POST_MATCH_QUESTIONS,
  controversy: GENERAL_QUESTIONS,
  general: GENERAL_QUESTIONS,
};

/**
 * Génère une interview contextuelle avec 1-3 questions.
 * Chaque question a exactement 3 réponses (humble, confiant, controversé).
 */
export function generateInterview(
  context: InterviewContext,
  rng: RNG = defaultRNG
): Interview {
  const templates = QUESTIONS_BY_CONTEXT[context.type];
  const numQuestions = rng.randomInt(1, Math.min(3, templates.length));

  const questions: InterviewQuestion[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < numQuestions; i++) {
    let idx: number;
    do {
      idx = rng.randomInt(0, templates.length - 1);
    } while (usedIndices.has(idx) && usedIndices.size < templates.length);
    usedIndices.add(idx);

    const template = templates[idx];
    questions.push({
      text: template.text,
      answers: template.answers as [InterviewAnswer, InterviewAnswer, InterviewAnswer],
    });
  }

  return {
    id: `interview-${Date.now()}-${rng.randomInt(0, 9999)}`,
    context,
    questions,
  };
}

export const InterviewGenerator = {
  generateInterview,
};
