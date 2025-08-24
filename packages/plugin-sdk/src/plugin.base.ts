import type { IPlugin, IPluginContext, IPluginMetadata } from './interfaces/plugin.interface';

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
 * Base class for Discord bot plugins
 */
export abstract class Plugin implements IPlugin {
  // Must be implemented by subclasses
  public abstract metadata: IPluginMetadata;

  // Optional: define commands, events and schedulers
  public commands?: Map<string, CommandMetadata> = new Map();
  public events?: Map<string, EventMetadata> = new Map();
  public schedulers?: Map<string, SchedulerMetadata> = new Map();

  protected context?: IPluginContext;

  /**
   * Called when plugin is loaded
   */
  async onLoad(context: IPluginContext): Promise<void> {
    this.context = context;
    this.context.logger.info(`Loading plugin: ${this.metadata.name} v${this.metadata.version}`);
  }

  /**
   * Called when plugin is enabled
   */
  async onEnable(context: IPluginContext): Promise<void> {
    this.context = context;
    this.context.logger.info(`Enabling plugin: ${this.metadata.name}`);
  }

  /**
   * Called when plugin is disabled
   */
  async onDisable(): Promise<void> {
    this.context?.logger.info(`Disabling plugin: ${this.metadata.name}`);
  }

  /**
   * Called when plugin is unloaded
   */
  async onUnload(): Promise<void> {
    this.context?.logger.info(`Unloading plugin: ${this.metadata.name}`);
    this.context = undefined;
  }

  /**
   * Get plugin context
   */
  protected getContext(): IPluginContext {
    if (!this.context) {
      throw new Error(`Plugin ${this.metadata.name} is not loaded`);
    }
    return this.context;
  }
}
