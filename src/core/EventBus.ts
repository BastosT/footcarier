/**
 * EventBus - Mécanisme central de communication entre Phaser et React.
 * Permet l'émission et l'écoute d'événements typés dans tout le jeu.
 */

export enum GameEvent {
  // Temps
  ADVANCE_DAY = 'advance_day',
  SIMULATE_WEEK = 'simulate_week',
  DAY_ADVANCED = 'day_advanced',
  MATCH_DAY_REACHED = 'match_day_reached',

  // Match
  START_MATCH = 'start_match',
  MATCH_ACTION = 'match_action',
  PLAYER_INPUT = 'player_input',
  MATCH_END = 'match_end',

  // Carrière
  TRANSFER_OFFER = 'transfer_offer',
  CONTRACT_EXPIRED = 'contract_expired',
  SEASON_END = 'season_end',

  // Social
  INTERVIEW_TRIGGERED = 'interview_triggered',
  SOCIAL_POST = 'social_post',

  // Événements
  RANDOM_EVENT = 'random_event',

  // Sauvegarde
  SAVE_GAME = 'save_game',
  LOAD_GAME = 'load_game',

  // Champions League
  CL_MATCH_DAY_REACHED = 'cl_match_day_reached',
  CL_MATCHDAY_COMPLETE = 'cl_matchday_complete',
  CL_PHASE_COMPLETE = 'cl_phase_complete',
  CL_ELIMINATED = 'cl_eliminated',
  CL_TROPHY_WON = 'cl_trophy_won',
}

export interface IEventBus {
  emit<T>(event: GameEvent, payload?: T): void;
  on<T>(event: GameEvent, handler: (payload: T) => void): () => void;
  off(event: GameEvent, handler: Function): void;
}

type EventHandler = (payload: unknown) => void;

export class EventBus implements IEventBus {
  private listeners: Map<GameEvent, Set<EventHandler>> = new Map();

  emit<T>(event: GameEvent, payload?: T): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(payload);
    }
  }

  on<T>(event: GameEvent, handler: (payload: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);

    // Retourne une fonction de désinscription
    return () => {
      this.off(event, handler);
    };
  }

  off(event: GameEvent, handler: Function): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.delete(handler as EventHandler);
    if (handlers.size === 0) {
      this.listeners.delete(event);
    }
  }
}

/** Instance singleton du EventBus partagé entre Phaser et React */
export const eventBus = new EventBus();
