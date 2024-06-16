type Events = 'allIconsLoaded';

export interface Event {
  type: Events;
}

type EventListener<T extends Event> = (event: T) => void;

interface ListenerEntry<T extends Event> {
  listener: EventListener<T>;
  once: boolean;
  priority: number;
}

export class EventEmitter {
  private listeners: { [key: string]: ListenerEntry<Event>[] } = {};

  on<T extends Event>(
    type: T['type'],
    listener: EventListener<T>,
    priority: number = 0,
  ): void {
    this.listeners[type] ??= [];
    this.listeners[type].push({ listener, once: false, priority });
    this.sortListeners(type);
  }

  once<T extends Event>(
    type: T['type'],
    listener: EventListener<T>,
    priority: number = 0,
  ): void {
    this.listeners[type] ??= [];
    this.listeners[type].push({ listener, once: true, priority });
    this.sortListeners(type);
  }

  off<T extends Event>(type: T['type'], listener: EventListener<T>): void {
    if (!this.listeners[type]) {
      return;
    }

    this.listeners[type] = this.listeners[type].filter(
      (entry) => entry.listener !== listener,
    );
  }

  emit<T extends Event>(event: T): void {
    if (!this.listeners[event.type]) {
      return;
    }

    this.listeners[event.type].forEach((entry) => {
      entry.listener(event);
      if (entry.once) {
        this.off(event.type, entry.listener);
      }
    });
  }

  private sortListeners(type: string): void {
    if (this.listeners[type]) {
      this.listeners[type].sort((a, b) => b.priority - a.priority);
    }
  }
}
