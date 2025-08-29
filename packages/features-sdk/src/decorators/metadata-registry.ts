/**
 * Metadata Registry
 * Stores decorator metadata in a simple and efficient way
 */

import type {
  AutocompleteHandlerMetadata,
  ButtonHandlerMetadata,
  CronMetadata,
  EventMetadata,
  Guard,
  IntervalMetadata,
  MessageCommandMetadata,
  ModalHandlerMetadata,
  SelectHandlerMetadata,
  SlashCommandMetadata,
  UserCommandMetadata,
} from '../types';

interface CommandEntry {
  methodName: string;
  type: 'slash' | 'user' | 'message';
  metadata: SlashCommandMetadata | UserCommandMetadata | MessageCommandMetadata;
}

interface EventEntry {
  methodName: string;
  metadata: EventMetadata;
}

interface InteractionEntry {
  methodName: string;
  type: 'button' | 'select' | 'modal';
  metadata: ButtonHandlerMetadata | SelectHandlerMetadata | ModalHandlerMetadata;
}

interface SchedulerEntry {
  methodName: string;
  type: 'cron' | 'interval';
  metadata: CronMetadata | IntervalMetadata;
}

interface AutocompleteEntry {
  methodName: string;
  metadata: AutocompleteHandlerMetadata;
}

interface FeatureInstance {
  constructor: { name: string };
  [key: string]: unknown;
}

/**
 * Global metadata registry
 * Stores metadata by method name until feature instances are created
 */
class MetadataRegistry {
  private readonly commands: CommandEntry[] = [];
  private readonly events: EventEntry[] = [];
  private readonly interactions: InteractionEntry[] = [];
  private readonly schedulers: SchedulerEntry[] = [];
  private readonly autocompletes: AutocompleteEntry[] = [];
  private readonly guards = new Map<string, Guard[]>();

  addCommand(
    methodName: string,
    type: 'slash' | 'user' | 'message',
    metadata: SlashCommandMetadata | UserCommandMetadata | MessageCommandMetadata,
  ): void {
    this.commands.push({ methodName, type, metadata });
  }

  addEvent(methodName: string, metadata: EventMetadata): void {
    this.events.push({ methodName, metadata });
  }

  addInteraction(
    methodName: string,
    type: 'button' | 'select' | 'modal',
    metadata: ButtonHandlerMetadata | SelectHandlerMetadata | ModalHandlerMetadata,
  ): void {
    this.interactions.push({ methodName, type, metadata });
  }

  addScheduler(methodName: string, type: 'cron' | 'interval', metadata: CronMetadata | IntervalMetadata): void {
    this.schedulers.push({ methodName, type, metadata });
  }

  addAutocomplete(methodName: string, metadata: AutocompleteHandlerMetadata): void {
    this.autocompletes.push({ methodName, metadata });
  }

  addGuards(methodName: string, guards: Guard[]): void {
    const existing = this.guards.get(methodName) || [];
    this.guards.set(methodName, [...existing, ...guards]);
  }

  /**
   * Get metadata for a feature instance
   * Filters metadata to only include methods that exist on the feature
   */
  getFeatureMetadata(feature: FeatureInstance) {
    const className = feature.constructor.name;
    const methodNames = this.getFeatureMethodNames(feature);

    return {
      commands: this.commands
        .filter((cmd) => methodNames.has(cmd.methodName))
        .map((cmd) => ({
          feature: className,
          method: cmd.methodName,
          metadata: cmd.metadata,
          guards: this.guards.get(cmd.methodName) || [],
          handler: (feature[cmd.methodName] as (...args: unknown[]) => unknown).bind(feature),
        })),

      events: this.events
        .filter((evt) => methodNames.has(evt.methodName))
        .map((evt) => ({
          feature: className,
          method: evt.methodName,
          event: evt.metadata.event,
          once: evt.metadata.once || false,
          handler: (feature[evt.methodName] as (...args: unknown[]) => unknown).bind(feature),
        })),

      interactions: this.interactions
        .filter((int) => methodNames.has(int.methodName))
        .map((int) => ({
          feature: className,
          method: int.methodName,
          pattern: (int.metadata as ButtonHandlerMetadata).customId,
          guards: this.guards.get(int.methodName) || [],
          handler: (feature[int.methodName] as (...args: unknown[]) => unknown).bind(feature),
          persistent: (int.metadata as ButtonHandlerMetadata).persistent ?? true,
          type: int.type, // Add interaction type
        })),

      schedulers: this.schedulers
        .filter((sch) => methodNames.has(sch.methodName))
        .map((sch) => ({
          feature: className,
          method: sch.methodName,
          pattern: sch.type === 'cron' ? (sch.metadata as CronMetadata).pattern : undefined,
          interval: sch.type === 'interval' ? (sch.metadata as IntervalMetadata).milliseconds : undefined,
          runOnInit: (sch.metadata as CronMetadata | IntervalMetadata).runOnInit || false,
          handler: (feature[sch.methodName] as (...args: unknown[]) => unknown).bind(feature),
        })),

      autocompletes: this.autocompletes
        .filter((auto) => methodNames.has(auto.methodName))
        .map((auto) => ({
          feature: className,
          method: auto.methodName,
          commandName: auto.metadata.commandName,
          optionName: auto.metadata.optionName,
          handler: (feature[auto.methodName] as (...args: unknown[]) => unknown).bind(feature),
        })),
    };
  }

  /**
   * Get all method names from a feature instance
   */
  private getFeatureMethodNames(feature: FeatureInstance): Set<string> {
    const methodNames = new Set<string>();
    let obj = Object.getPrototypeOf(feature);

    do {
      Object.getOwnPropertyNames(obj).forEach((prop) => {
        if (prop !== 'constructor' && typeof feature[prop] === 'function') {
          methodNames.add(prop);
        }
      });
      obj = Object.getPrototypeOf(obj);
    } while (obj && obj !== Object.prototype);

    return methodNames;
  }

  /**
   * Clear all metadata (useful for testing)
   */
  clear(): void {
    this.commands.length = 0;
    this.events.length = 0;
    this.interactions.length = 0;
    this.schedulers.length = 0;
    this.autocompletes.length = 0;
    this.guards.clear();
  }
}

// Global registry instance
export const metadataRegistry = new MetadataRegistry();
