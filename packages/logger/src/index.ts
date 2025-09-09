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

import { createFeatureLogger as createFeatureLoggerWithBase } from './create-feature';
import { Logger } from './logger';
import { type ILogger, type LogLevel, logLevel } from './types';

// Export the base feature creation function
export { createFeature } from './create-feature';

// Export Logger class
export { Logger } from './logger';
// Export types
export type { LoggerConfig, LogLevel } from './types';

// Create and export global logger instance (singleton with file logging enabled)
export const logger = Logger.getInstance();
logger.setLevel(logLevel.DEBUG);

// Configuration par défaut pour activer les logs vers les fichiers
// Les logs seront écrits dans le répertoire ./logs/ avec un fichier par jour
// Exemple: ./logs/2025-01-04.log

/**
 * Creates a feature logger using the global logger instance
 * Convenience function for easy feature logger creation
 */
export function createFeatureLogger(pluginName: string): ILogger {
  return createFeatureLoggerWithBase(pluginName, logger);
}

/**
 * Set the log level for the global logger instance
 * @param level - The log level to set
 */
export function setLogLevel(level: LogLevel): void {
  logger.setLevel(level);
}

/**
 * Get the current log level of the global logger instance
 * @returns The current log level
 */
export function getLogLevel(): LogLevel {
  return logger.getLevel();
}
