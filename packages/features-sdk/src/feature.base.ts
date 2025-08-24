import type { IFeature, IFeatureContext, IFeatureMetadata } from './interfaces/feature.interface';

interface CommandMetadata {
  name: string;
  description: string;
  builder?: (builder: unknown) => unknown;
}

interface EventMetadata {
  event: string;
  once: boolean;
}

interface SchedulerMetadata {
  name: string;
  interval?: number;
  cron?: string;
  immediate?: boolean;
  enabled?: boolean;
}

/**
 * Base class for Discord bot features
 */
export abstract class Feature implements IFeature {
  // Must be implemented by subclasses
  public abstract metadata: IFeatureMetadata;

  // Optional: define commands, events and schedulers
  public commands?: Map<string, CommandMetadata> = new Map();
  public events?: Map<string, EventMetadata> = new Map();
  public schedulers?: Map<string, SchedulerMetadata> = new Map();

  protected context?: IFeatureContext;

  /**
   * Called when feature is loaded
   */
  async onLoad(context: IFeatureContext): Promise<void> {
    this.context = context;
    this.context.logger.info(`Loading feature: ${this.metadata.name} v${this.metadata.version}`);
  }

  /**
   * Called when feature is enabled
   */
  async onEnable(context: IFeatureContext): Promise<void> {
    this.context = context;
    this.context.logger.info(`Enabling feature: ${this.metadata.name}`);
  }

  /**
   * Called when feature is disabled
   */
  async onDisable(): Promise<void> {
    this.context?.logger.info(`Disabling feature: ${this.metadata.name}`);
  }

  /**
   * Called when feature is unloaded
   */
  async onUnload(): Promise<void> {
    this.context?.logger.info(`Unloading feature: ${this.metadata.name}`);
    this.context = undefined;
  }

  /**
   * Get feature context
   */
  protected getContext(): IFeatureContext {
    if (!this.context) {
      throw new Error(`Feature ${this.metadata.name} is not loaded`);
    }
    return this.context;
  }
}
