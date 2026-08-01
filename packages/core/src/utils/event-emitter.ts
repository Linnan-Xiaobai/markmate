import type { Disposable, EventEmitter as IEventEmitter } from '../types';
import { createLogger } from '@markmate/logger';

const logger = createLogger('event-emitter');

type Handler<T = unknown> = (data: T) => void;

export class EventEmitter<T = unknown> implements IEventEmitter<T> {
  private handlers = new Map<string, Set<Handler<T>>>();

  on(event: string, handler: Handler<T>): Disposable {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return {
      dispose: () => this.off(event, handler),
    };
  }

  off(event: string, handler: Handler<T>): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  emit(event: string, data?: T): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data as T);
        } catch (error) {
          logger.error(`Error in event handler for "${event}"`, error);
        }
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  listenerCount(event: string): number {
    return this.handlers.get(event)?.size || 0;
  }
}

export function createEventEmitter<T = unknown>(): EventEmitter<T> {
  return new EventEmitter<T>();
}
