/**
 * @soldecoder-monitor/logger
 *
 * Simple, clean logging package with feature support
 *
 * @example
 * ```typescript
 * import { logger, createFeatureLogger } from '@soldecoder-monitor/logger';
 *
 * logger.info('Application started');
 *
 * const featureLogger = createFeatureLogger('MyFeature');
 * featureLogger.debug('Feature initialized');
 * ```
 */

import { config } from '@soldecoder-monitor/config-env';
import { createFeatureLogger as createFeatureLoggerWithBase } from './create-feature';
import { Logger } from './logger';
import type { ILogger, LogLevel } from './types';

// Export the base feature creation function
export { createFeature } from './create-feature';

// Export Logger class
export { Logger } from './logger';
// Export types
export type { ILogger, LoggerConfig, LogLevel } from './types';

// Create and export global logger instance
export const logger = new Logger({
  level: config.logging.level as LogLevel,
  enableTimestamp: true,
  enableColors: true,
});

/**
 * Creates a feature logger using the global logger instance
 * Convenience function for easy feature logger creation
 */
export function createFeatureLogger(pluginName: string): ILogger {
  return createFeatureLoggerWithBase(pluginName, logger);
}
 