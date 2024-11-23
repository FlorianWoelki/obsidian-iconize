import { describe, it, vi, expect, beforeEach } from 'vitest';
import { EventEmitter } from './event';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  it('should register and emit event listeners', () => {
    const listener = vi.fn();
    emitter.on('allIconsLoaded', listener);

    emitter.emit('allIconsLoaded');

    expect(listener).toHaveBeenCalledWith({ payload: undefined });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should unregister event listeners', () => {
    const listener = vi.fn();
    emitter.on('allIconsLoaded', listener);
    emitter.off('allIconsLoaded', listener);

    emitter.emit('allIconsLoaded');

    expect(listener).not.toHaveBeenCalled();
  });

  it('should support once-only event listeners', () => {
    const listener = vi.fn();
    emitter.once('allIconsLoaded', listener);

    emitter.emit('allIconsLoaded');
    emitter.emit('allIconsLoaded');

    expect(listener).toHaveBeenCalledWith({
      payload: undefined,
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should support priority listeners', () => {
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const listener3 = vi.fn();

    emitter.on('allIconsLoaded', listener1, 1);
    emitter.on('allIconsLoaded', listener2, 2);
    emitter.on('allIconsLoaded', listener3, 3);

    emitter.emit('allIconsLoaded');

    expect(listener3).toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();
    expect(listener1).toHaveBeenCalled();

    const listener3CallOrder = listener3.mock.invocationCallOrder[0];
    const listener2CallOrder = listener2.mock.invocationCallOrder[0];
    const listener1CallOrder = listener1.mock.invocationCallOrder[0];

    expect(listener3CallOrder).toBeLessThan(listener2CallOrder);
    expect(listener2CallOrder).toBeLessThan(listener1CallOrder);
  });
});
