import type { ILogger } from './types';

/**
 * Creates a logger instance for a specific feature/plugin
 * Prefixes all log messages with the feature name
 */
export function createFeatureLogger(featureName: string, baseLogger: ILogger): ILogger {
  const prefix = `[${featureName}]`;

  return {
    debug: (message: string, ...args: unknown[]) => {
      baseLogger.debug(`${prefix} ${message}`, ...args);
    },

    info: (message: string, ...args: unknown[]) => {
      baseLogger.info(`${prefix} ${message}`, ...args);
    },

    warn: (message: string, ...args: unknown[]) => {
      baseLogger.warn(`${prefix} ${message}`, ...args);
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
