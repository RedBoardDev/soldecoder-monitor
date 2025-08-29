import type { ClientEvents } from 'discord.js';
import type { EventMetadata } from '../types';
import { metadataRegistry } from './metadata-registry';

/**
 * Extract method name from decorator context
 * Handles both old and new decorator API formats
 */
function getMethodName(propertyKey: string | symbol | { name: string }): string {
  return typeof propertyKey === 'string' || typeof propertyKey === 'symbol' ? String(propertyKey) : propertyKey.name;
}

/**
 * Discord event listener decorator
 * @param event - Discord.js event name
 */
export function On<K extends keyof ClientEvents>(event: K): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    const metadata: EventMetadata = { event, once: false };
    metadataRegistry.addEvent(methodName, metadata);
    return descriptor;
  };
}

/**
 * Discord one-time event listener decorator
 * @param event - Discord.js event name
 */
export function Once<K extends keyof ClientEvents>(event: K): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    const metadata: EventMetadata = { event, once: true };
    metadataRegistry.addEvent(methodName, metadata);
    return descriptor;
  };
}
