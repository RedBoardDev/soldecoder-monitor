import type {
  AutocompleteHandlerMetadata,
  MessageCommandMetadata,
  SlashCommandMetadata,
  UserCommandMetadata,
} from '../types';
import { metadataRegistry } from './metadata-registry';

/**
 * Extract method name from decorator context
 * Handles both old and new decorator API formats
 */
function getMethodName(propertyKey: string | symbol | { name: string }): string {
  return typeof propertyKey === 'string' || typeof propertyKey === 'symbol' ? String(propertyKey) : propertyKey.name;
}

/**
 * Slash command decorator
 * @param metadata - Command configuration
 */
export function SlashCommand(metadata: SlashCommandMetadata): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    metadataRegistry.addCommand(methodName, 'slash', metadata);
    return descriptor;
  };
}

/**
 * User context menu command decorator
 * @param metadata - Command configuration
 */
export function UserCommand(metadata: UserCommandMetadata): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    metadataRegistry.addCommand(methodName, 'user', metadata);
    return descriptor;
  };
}

/**
 * Message context menu command decorator
 * @param metadata - Command configuration
 */
export function MessageCommand(metadata: MessageCommandMetadata): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    metadataRegistry.addCommand(methodName, 'message', metadata);
    return descriptor;
  };
}

/**
 * Autocomplete handler decorator
 * @param metadata - Autocomplete configuration
 */
export function Autocomplete(metadata: AutocompleteHandlerMetadata): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    metadataRegistry.addAutocomplete(methodName, metadata);
    return descriptor;
  };
}
