import { describe, it, expect, vi } from 'vitest';
import { EventBus, GameEvent } from './EventBus';

describe('EventBus', () => {
  it('should emit events and call registered handlers', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on(GameEvent.ADVANCE_DAY, handler);
    bus.emit(GameEvent.ADVANCE_DAY, { day: 1 });

    expect(handler).toHaveBeenCalledWith({ day: 1 });
  });

  it('should support multiple handlers for the same event', () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.on(GameEvent.MATCH_END, handler1);
    bus.on(GameEvent.MATCH_END, handler2);
    bus.emit(GameEvent.MATCH_END, { score: '2-1' });

    expect(handler1).toHaveBeenCalledWith({ score: '2-1' });
    expect(handler2).toHaveBeenCalledWith({ score: '2-1' });
  });

  it('should not call handlers for different events', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on(GameEvent.ADVANCE_DAY, handler);
    bus.emit(GameEvent.MATCH_END, { score: '1-0' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should remove handler with off()', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on(GameEvent.SAVE_GAME, handler);
    bus.off(GameEvent.SAVE_GAME, handler);
    bus.emit(GameEvent.SAVE_GAME);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should return an unsubscribe function from on()', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const unsubscribe = bus.on(GameEvent.RANDOM_EVENT, handler);
    unsubscribe();
    bus.emit(GameEvent.RANDOM_EVENT, { type: 'bonus' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle emit with no payload', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on(GameEvent.ADVANCE_DAY, handler);
    bus.emit(GameEvent.ADVANCE_DAY);

    expect(handler).toHaveBeenCalledWith(undefined);
  });

  it('should handle emit with no registered handlers', () => {
    const bus = new EventBus();

    // Should not throw
    expect(() => bus.emit(GameEvent.ADVANCE_DAY)).not.toThrow();
  });

  it('should handle off() for non-existent event', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    // Should not throw
    expect(() => bus.off(GameEvent.ADVANCE_DAY, handler)).not.toThrow();
  });

  it('should support typed payloads', () => {
    const bus = new EventBus();
    const handler = vi.fn<(payload: { goals: number }) => void>();

    bus.on<{ goals: number }>(GameEvent.MATCH_END, handler);
    bus.emit<{ goals: number }>(GameEvent.MATCH_END, { goals: 3 });

    expect(handler).toHaveBeenCalledWith({ goals: 3 });
  });
});
