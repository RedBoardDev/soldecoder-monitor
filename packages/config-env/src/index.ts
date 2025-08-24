import { Config } from './config';
import { EnvironmentValidator } from './validator';

// Global config instance
let globalConfig: Config | null = null;

/**
 * Validates environment and initializes global config
 * Must be called before using getConfig()
 * @throws Error if validation fails
 */
export function validateEnvironment(envPath?: string): Config {
  const validator = EnvironmentValidator.getInstance();
  const validatedEnv = validator.validate(envPath);
  globalConfig = Config.fromEnvironment(validatedEnv);
  return globalConfig;
}

/**
 * Get the global configuration instance
 * Throws error if validateEnvironment() hasn't been called
 */
export function getConfig(): Config {
  if (!globalConfig) {
    throw new Error('Configuration not initialized. Call validateEnvironment() first in your application entry point.');
  }
  return globalConfig;
}

/**
 * Check if config is initialized
 */
export function isConfigInitialized(): boolean {
  return globalConfig !== null;
}

// Export types and classes
export { Config, type ConfigType } from './config';
export type { EnvironmentVariables } from './schemas';
export { EnvironmentValidator } from './validator';

// For backward compatibility, export config as a getter
export const config = new Proxy({} as Config, {
  get(_, prop) {
    const cfg = getConfig();
    return cfg[prop as keyof Config];
  },
});
