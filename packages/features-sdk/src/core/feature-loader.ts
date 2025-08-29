import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Logger } from '../types';
import type { Feature } from './feature-base';
import type { FeatureManager } from './feature-manager';

export interface LoaderOptions {
  featuresPath: string;
  recursive?: boolean;
  filter?: (path: string) => boolean;
  configPath?: string;
}

interface FeatureConfig {
  [key: string]: unknown;
}

interface FeatureModule {
  default?: unknown;
  [key: string]: unknown;
}

/**
 * Feature loader
 * Scans directories and loads feature classes
 */
export class FeatureLoader {
  private readonly loadedFeatures = new Set<string>();

  constructor(
    private readonly manager: FeatureManager,
    private readonly logger: Logger,
  ) {}

  /**
   * Load all features from a directory
   */
  async loadFeatures(options: LoaderOptions): Promise<void> {
    const { featuresPath, recursive = true } = options;
    const resolvedPath = resolve(featuresPath);

    this.logger.info(`Loading features from: ${resolvedPath}`);

    try {
      const configs = await this.loadConfigs(options.configPath);
      const featurePaths = this.scanDirectory(resolvedPath, recursive, options.filter);

      for (const featurePath of featurePaths) {
        await this.loadFeature(featurePath, configs);
      }

      this.logger.info(`Loaded ${this.loadedFeatures.size} features successfully`);
    } catch (error) {
      this.logger.error('Failed to load features:', error);
      throw error;
    }
  }

  /**
   * Load a single feature
   */
  private async loadFeature(featurePath: string, configs: Record<string, FeatureConfig>): Promise<void> {
    try {
      const module = (await import(featurePath)) as FeatureModule;

      // Find the feature class
      const FeatureClass = this.findFeatureClass(module);

      if (!FeatureClass) {
        this.logger.warn(`No feature class found in: ${featurePath}`);
        return;
      }

      // Get feature metadata
      const tempInstance = new FeatureClass();
      const featureName = tempInstance.metadata?.name;

      if (!featureName) {
        this.logger.warn(`Feature in ${featurePath} has no name in metadata`);
        return;
      }

      // Check if already loaded
      if (this.loadedFeatures.has(featureName)) {
        this.logger.warn(`Feature ${featureName} already loaded, skipping`);
        return;
      }

      // Register with manager
      const config = configs[featureName] || {};
      await this.manager.registerFeature(FeatureClass, config);

      this.loadedFeatures.add(featureName);
    } catch (error) {
      this.logger.error(`Failed to load feature from ${featurePath}:`, error);
    }
  }

  /**
   * Find feature class in module exports
   */
  private findFeatureClass(module: FeatureModule): (new () => Feature) | undefined {
    // Check default export first
    if (module.default && this.isFeatureClass(module.default)) {
      return module.default as new () => Feature;
    }

    // Check named exports
    for (const exportKey of Object.keys(module)) {
      if (this.isFeatureClass(module[exportKey])) {
        return module[exportKey] as new () => Feature;
      }
    }

    return undefined;
  }

  /**
   * Check if a value is a Feature class
   */
  private isFeatureClass(value: unknown): value is new () => Feature {
    return typeof value === 'function' && value.prototype && 'metadata' in value.prototype;
  }

  /**
   * Scan directory for feature files
   */
  private scanDirectory(dirPath: string, recursive: boolean, filter?: (path: string) => boolean): string[] {
    const featurePaths: string[] = [];

    try {
      const items = readdirSync(dirPath);

      for (const item of items) {
        const fullPath = join(dirPath, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory() && recursive) {
          // Recursively scan subdirectories
          featurePaths.push(...this.scanDirectory(fullPath, recursive, filter));
        } else if (stat.isFile() && this.isFeatureFile(fullPath)) {
          // Check filter if provided
          if (!filter || filter(fullPath)) {
            featurePaths.push(fullPath);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to scan directory ${dirPath}:`, error);
    }

    return featurePaths;
  }

  /**
   * Check if a file could be a feature
   */
  private isFeatureFile(filePath: string): boolean {
    // Accept .feature.js/ts files or any .js/ts file (except .d.ts)
    return (
      !filePath.endsWith('.d.ts') &&
      (filePath.endsWith('.feature.js') ||
        filePath.endsWith('.feature.ts') ||
        filePath.endsWith('.js') ||
        filePath.endsWith('.ts'))
    );
  }

  /**
   * Load feature configurations
   */
  private async loadConfigs(configPath?: string): Promise<Record<string, FeatureConfig>> {
    if (!configPath) {
      return {};
    }

    try {
      const resolvedPath = resolve(configPath);
      const configs = (await import(resolvedPath)) as { default?: Record<string, FeatureConfig> } & Record<
        string,
        FeatureConfig
      >;
      return configs.default || configs;
    } catch (error) {
      this.logger.warn(`Failed to load configs from ${configPath}:`, error);
      return {};
    }
  }

  /**
   * Get loaded feature names
   */
  getLoadedFeatures(): ReadonlySet<string> {
    return this.loadedFeatures;
  }

  /**
   * Clear loader state
   */
  clear(): void {
    this.loadedFeatures.clear();
  }
}
