import type { ILogger } from './types';

/**
 * Creates a logger instance for a specific feature/plugin
 * Prefixes all log messages with the feature name
 */
export function createFeatureLogger(featureName: string, baseLogger: ILogger): ILogger {
  const prefix = `[${featureName}]`;

  return {
    debug: (message: string, context?: Record<string, unknown>) => {
      baseLogger.debug(`${prefix} ${message}`, context);
    },

    info: (message: string, context?: Record<string, unknown>) => {
      baseLogger.info(`${prefix} ${message}`, context);
    },

    warn: (message: string, context?: Record<string, unknown>) => {
      baseLogger.warn(`${prefix} ${message}`, context);
    },

    error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => {
      baseLogger.error(`${prefix} ${message}`, error, context);
    },
  };
}

/**
 * Creates a feature logger using a provided base logger instance
 * This avoids circular dependencies by requiring the logger to be passed in
 */
export function createFeature(featureName: string, baseLogger: ILogger): ILogger {
  return createFeatureLogger(featureName, baseLogger);
}
