import type { ButtonHandlerMetadata, ModalHandlerMetadata, SelectHandlerMetadata } from '../types';
import { metadataRegistry } from './metadata-registry';

/**
 * Extract method name from decorator context
 * Handles both old and new decorator API formats
 */
function getMethodName(propertyKey: string | symbol | { name: string }): string {
  return typeof propertyKey === 'string' || typeof propertyKey === 'symbol' ? String(propertyKey) : propertyKey.name;
}

/**
 * Button interaction handler decorator
 * @param customId - Custom ID string or RegExp pattern
 * @param persistent - Whether the handler survives bot restarts (default: true)
 */
export function ButtonHandler(customId: string | RegExp, persistent = true): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    const metadata: ButtonHandlerMetadata = { customId, persistent };
    metadataRegistry.addInteraction(methodName, 'button', metadata);
    return descriptor;
  };
}

/**
 * Select menu interaction handler decorator
 * @param customId - Custom ID string or RegExp pattern
 * @param persistent - Whether the handler survives bot restarts (default: true)
 */
export function SelectHandler(customId: string | RegExp, persistent = true): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    const metadata: SelectHandlerMetadata = { customId, persistent };
    metadataRegistry.addInteraction(methodName, 'select', metadata);
    return descriptor;
  };
}

/**
 * Modal submit interaction handler decorator
 * @param customId - Custom ID string or RegExp pattern
 */
export function ModalHandler(customId: string | RegExp): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    const metadata: ModalHandlerMetadata = { customId };
    metadataRegistry.addInteraction(methodName, 'modal', metadata);
    return descriptor;
  };
}
