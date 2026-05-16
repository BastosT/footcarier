import type { StateCreator } from 'zustand';
import type { GameStore } from '../gameStore';
import type { GameDate } from './timeSlice';

export interface SocialPost {
  id: string;
  author: string;
  authorType: 'fan' | 'journalist' | 'player' | 'self';
  content: string;
  timestamp: GameDate;
  likes: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface InterviewAnswer {
  text: string;
  tone: 'humble' | 'confident' | 'controversial';
  impacts: {
    popularity: number;
    reputation: number;
    coachRelation: number;
    teamRelation: number;
  };
}

export interface InterviewQuestion {
  text: string;
  answers: [InterviewAnswer, InterviewAnswer, InterviewAnswer];
}

export interface Interview {
  id: string;
  context: string;
  questions: InterviewQuestion[];
}

export interface SocialState {
  popularity: number;
  reputation: number;
  coachRelation: number;
  teamRelation: number;
  teamMorale: number;
  socialFeed: SocialPost[];
  pendingInterviews: Interview[];
}

export interface SocialSlice {
  social: SocialState;
  updatePopularity: (delta: number) => void;
  updateReputation: (delta: number) => void;
  updateCoachRelation: (delta: number) => void;
  updateTeamRelation: (delta: number) => void;
  updateTeamMorale: (newMorale: number) => void;
  addSocialPost: (post: SocialPost) => void;
  addInterview: (interview: Interview) => void;
  removeInterview: (id: string) => void;
  resetSocial: () => void;
}

const initialSocialState: SocialState = {
  popularity: 50,
  reputation: 50,
  coachRelation: 50,
  teamRelation: 50,
  teamMorale: 50,
  socialFeed: [],
  pendingInterviews: [],
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const createSocialSlice: StateCreator<GameStore, [], [], SocialSlice> = (set) => ({
  social: initialSocialState,

  updatePopularity: (delta) =>
    set((state) => ({
      social: {
        ...state.social,
        popularity: clamp(state.social.popularity + delta, 0, 100),
      },
    })),

  updateReputation: (delta) =>
    set((state) => ({
      social: {
        ...state.social,
        reputation: clamp(state.social.reputation + delta, 0, 100),
      },
    })),

  updateCoachRelation: (delta) =>
    set((state) => ({
      social: {
        ...state.social,
        coachRelation: clamp(state.social.coachRelation + delta, 0, 100),
      },
    })),

  updateTeamRelation: (delta) =>
    set((state) => ({
      social: {
        ...state.social,
        teamRelation: clamp(state.social.teamRelation + delta, 0, 100),
      },
    })),

  updateTeamMorale: (newMorale) =>
    set((state) => ({
      social: {
        ...state.social,
        teamMorale: clamp(newMorale, 0, 100),
      },
    })),

  addSocialPost: (post) =>
    set((state) => ({
      social: {
        ...state.social,
        socialFeed: [post, ...state.social.socialFeed],
      },
    })),

  addInterview: (interview) =>
    set((state) => ({
      social: {
        ...state.social,
        pendingInterviews: [...state.social.pendingInterviews, interview],
      },
    })),

  removeInterview: (id) =>
    set((state) => ({
      social: {
        ...state.social,
        pendingInterviews: state.social.pendingInterviews.filter((i) => i.id !== id),
      },
    })),

  resetSocial: () => set({ social: initialSocialState }),
});
