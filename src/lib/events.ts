/**
 * Domain event system for extensibility
 */

import { logger } from './logger';

export enum DomainEventType {
  // Profile events
  PROFILE_CREATED = 'profile.created',
  PROFILE_UPDATED = 'profile.updated',
  PROFILE_DELETED = 'profile.deleted',
  PROFILE_SNAPSHOT_CREATED = 'profile.snapshot.created',

  // Run events
  RUN_STARTED = 'run.started',
  RUN_COMPLETED = 'run.completed',
  RUN_FAILED = 'run.failed',

  // Template events
  TEMPLATE_CREATED = 'template.created',
  TEMPLATE_INSTANTIATED = 'template.instantiated',

  // Schedule events
  SCHEDULE_CREATED = 'schedule.created',
  SCHEDULE_TRIGGERED = 'schedule.triggered',
  SCHEDULE_ENABLED = 'schedule.enabled',
  SCHEDULE_DISABLED = 'schedule.disabled',
}

export interface DomainEvent<T = any> {
  type: DomainEventType;
  timestamp: Date;
  data: T;
  metadata?: Record<string, any>;
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>;

class EventBus {
  private handlers: Map<DomainEventType, EventHandler[]> = new Map();

  /**
   * Register an event handler
   */
  on<T = any>(eventType: DomainEventType, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventType, existing);

    logger.debug('Event handler registered', { eventType });
  }

  /**
   * Unregister an event handler
   */
  off(eventType: DomainEventType, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) || [];
    const filtered = existing.filter(h => h !== handler);
    this.handlers.set(eventType, filtered);

    logger.debug('Event handler unregistered', { eventType });
  }

  /**
   * Emit an event
   */
  async emit<T = any>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    logger.debug('Event emitted', {
      type: event.type,
      handlerCount: handlers.length,
    });

    // Execute all handlers in parallel
    await Promise.all(
      handlers.map(async handler => {
        try {
          await handler(event);
        } catch (error) {
          logger.error('Event handler failed', error, {
            eventType: event.type,
          });
        }
      })
    );
  }

  /**
   * Create a typed event
   */
  createEvent<T = any>(
    type: DomainEventType,
    data: T,
    metadata?: Record<string, any>
  ): DomainEvent<T> {
    return {
      type,
      data,
      timestamp: new Date(),
      metadata,
    };
  }

  /**
   * Clear all handlers (for testing)
   */
  clearAll(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
