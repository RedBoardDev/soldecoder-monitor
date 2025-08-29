import type { CronMetadata, IntervalMetadata } from '../types';
import { metadataRegistry } from './metadata-registry';

/**
 * Extract method name from decorator context
 * Handles both old and new decorator API formats
 */
function getMethodName(propertyKey: string | symbol | { name: string }): string {
  return typeof propertyKey === 'string' || typeof propertyKey === 'symbol' ? String(propertyKey) : propertyKey.name;
}

/**
 * Cron job scheduler decorator
 * @param options - Cron configuration with pattern (e.g., "0 0/5 * * * *")
 */
export function Cron(options: CronMetadata): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    metadataRegistry.addScheduler(methodName, 'cron', options);
    return descriptor;
  };
}

/**
 * Interval scheduler decorator
 * @param options - Interval configuration with milliseconds
 */
export function Interval(options: IntervalMetadata): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    metadataRegistry.addScheduler(methodName, 'interval', options);
    return descriptor;
  };
}
