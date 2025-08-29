import type { Feature } from '../core/feature-base';
import { metadataRegistry } from '../decorators/metadata-registry';
import type { CommandRegistration, EventRegistration, InteractionRegistration, SchedulerRegistration } from '../types';

interface FeatureMetadataStore {
  commands: CommandRegistration[];
  interactions: InteractionRegistration[];
  events: EventRegistration[];
  schedulers: SchedulerRegistration[];
  autocompletes: any[];
}

export class MetadataScanner {
  private metadataStore = new Map<string, FeatureMetadataStore>();

  /**
   * Scan a feature instance for decorators
   * Now simply gets metadata from the registry
   */
  scanFeature(feature: Feature, featureName: string): void {
    const metadata = metadataRegistry.getFeatureMetadata(feature);

    // Store with proper feature name
    const store: FeatureMetadataStore = {
      commands: metadata.commands.map((cmd) => ({ ...cmd, feature: featureName })),
      interactions: metadata.interactions,
      events: metadata.events,
      schedulers: metadata.schedulers,
      autocompletes: metadata.autocompletes,
    };

    this.metadataStore.set(featureName, store);
  }

  /**
   * Get metadata for a feature
   */
  getFeatureMetadata(featureName: string): FeatureMetadataStore | undefined {
    return this.metadataStore.get(featureName);
  }
}
