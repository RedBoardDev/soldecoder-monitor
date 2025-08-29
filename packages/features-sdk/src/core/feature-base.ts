import type { FeatureContext, FeatureMetadata } from '../types';

/**
 * Base class for all features
 * Provides lifecycle hooks and context management
 */
export abstract class Feature {
  protected context!: FeatureContext;

  /**
   * Feature metadata
   * Must be implemented by each feature
   */
  abstract get metadata(): FeatureMetadata;

  /**
   * Called when feature is loaded (bot startup)
   * @param context - Feature context with client, logger and config
   */
  async onLoad?(context: FeatureContext): Promise<void>;

  /**
   * Called when feature is enabled
   * @param context - Feature context with client, logger and config
   */
  async onEnable?(context: FeatureContext): Promise<void>;

  /**
   * Called when feature is disabled
   */
  async onDisable?(): Promise<void>;

  /**
   * Called when feature is unloaded (bot shutdown)
   */
  async onUnload?(): Promise<void>;

  /**
   * Set the feature context
   * @internal
   */
  setContext(context: FeatureContext): void {
    this.context = context;
  }

  /**
   * Get the feature context
   * @throws Error if context is not initialized
   */
  protected getContext(): FeatureContext {
    if (!this.context) {
      throw new Error(`Feature ${this.metadata.name} context not initialized`);
    }
    return this.context;
  }

  /**
   * Logging helpers
   */
  protected debug(message: string, ...args: unknown[]): void {
    this.getContext().logger.debug(`[${this.metadata.name}] ${message}`, ...args);
  }

  protected info(message: string, ...args: unknown[]): void {
    this.getContext().logger.info(`[${this.metadata.name}] ${message}`, ...args);
  }

  protected warn(message: string, ...args: unknown[]): void {
    this.getContext().logger.warn(`[${this.metadata.name}] ${message}`, ...args);
  }

  protected error(message: string, error?: Error | unknown): void {
    this.getContext().logger.error(`[${this.metadata.name}] ${message}`, error);
  }
}
