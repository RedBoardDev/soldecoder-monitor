import type { Client, ClientEvents } from 'discord.js';
import type { EventRegistration, Logger } from '../types';

interface EventListenerInfo {
  registration: EventRegistration;
  listener: (...args: unknown[]) => Promise<void>;
}

/**
 * Event dispatcher
 * Manages Discord event listeners for features
 */
export class EventDispatcher {
  private readonly eventHandlers = new Map<string, EventListenerInfo[]>();

  constructor(
    private readonly client: Client,
    private readonly logger: Logger,
  ) {}

  /**
   * Register an event handler
   */
  registerEvent(registration: EventRegistration): void {
    const key = this.getEventKey(registration.feature, registration.event);

    // Create the event handler
    const eventHandler = async (...args: unknown[]) => {
      try {
        await registration.handler(...args);
      } catch (error) {
        this.logger.error(`Error in event handler ${registration.feature}.${registration.method}:`, error);
      }
    };

    // Store handler info for later removal
    const handlers = this.eventHandlers.get(key) || [];
    handlers.push({ registration, listener: eventHandler });
    this.eventHandlers.set(key, handlers);

    // Register with Discord client
    if (registration.once) {
      this.client.once(registration.event, eventHandler);
    } else {
      this.client.on(registration.event, eventHandler);
    }
  }

  /**
   * Unregister event handlers for a feature
   */
  unregisterEvent(featureName: string, event: keyof ClientEvents): void {
    const key = this.getEventKey(featureName, event);
    const handlers = this.eventHandlers.get(key);

    if (!handlers) {
      return;
    }

    // Remove each listener individually
    handlers.forEach(({ listener }) => {
      this.client.removeListener(event, listener);
    });

    this.eventHandlers.delete(key);
  }

  /**
   * Unregister all events for a feature
   */
  unregisterAllFeatureEvents(featureName: string): void {
    const keysToRemove: string[] = [];

    // Find all events for this feature
    for (const [key, handlers] of this.eventHandlers) {
      if (key.startsWith(`${featureName}:`)) {
        // Remove listeners
        handlers.forEach(({ registration, listener }) => {
          this.client.removeListener(registration.event, listener);
        });
        keysToRemove.push(key);
      }
    }

    // Remove from map
    for (const key of keysToRemove) {
      this.eventHandlers.delete(key);
    }
  }

  /**
   * Get all registered event handlers
   */
  getEventHandlers(): ReadonlyMap<string, EventListenerInfo[]> {
    return this.eventHandlers;
  }

  /**
   * Generate event key
   */
  private getEventKey(featureName: string, event: keyof ClientEvents): string {
    return `${featureName}:${event}`;
  }
}
