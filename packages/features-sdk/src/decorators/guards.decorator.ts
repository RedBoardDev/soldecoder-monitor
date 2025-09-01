import { GuildOnlyGuard } from '../guards/builtin/guild-only.guard';
import { PermissionGuard } from '../guards/builtin/permission.guard';
import { RateLimitGuard } from '../guards/builtin/rate-limit.guard';
import type { Guard, PermissionResolvable, RateLimitOptions } from '../types';
import { metadataRegistry } from './metadata-registry';

/**
 * Extract method name from decorator context
 * Handles both old and new decorator API formats
 */
function getMethodName(propertyKey: string | symbol | { name: string }): string {
  return typeof propertyKey === 'string' || typeof propertyKey === 'symbol' ? String(propertyKey) : propertyKey.name;
}

/**
 * Apply guards to a method
 * @param guards - Array of guard instances to apply
 */
export function UseGuards(...guards: Guard[]): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    metadataRegistry.addGuards(methodName, guards);
    return descriptor;
  };
}

/**
 * Rate limit guard decorator
 * @param options - Rate limit configuration
 */
export function RateLimit(options: RateLimitOptions): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    const guard = new RateLimitGuard(options);
    metadataRegistry.addGuards(methodName, [guard]);
    return descriptor;
  };
}

/**
 * Permission guard decorator
 * @param permissions - Required Discord permissions
 */
export function RequirePermissions(permissions: PermissionResolvable[]): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    const guard = new PermissionGuard(permissions);
    metadataRegistry.addGuards(methodName, [guard]);
    return descriptor;
  };
}

/**
 * Guild-only guard decorator
 * Ensures command can only be used in guilds (not DMs)
 */
export function GuildOnly(): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    const guard = new GuildOnlyGuard();
    metadataRegistry.addGuards(methodName, [guard]);
    return descriptor;
  };
}

/**
 * Ephemeral decorator
 * Makes all interaction responses ephemeral (only visible to the user who triggered the command)
 */
export function Ephemeral(): MethodDecorator {
  return (_target: object, propertyKey: string | symbol | { name: string }, descriptor: PropertyDescriptor) => {
    const methodName = getMethodName(propertyKey);
    metadataRegistry.addEphemeral(methodName);
    return descriptor;
  };
}
