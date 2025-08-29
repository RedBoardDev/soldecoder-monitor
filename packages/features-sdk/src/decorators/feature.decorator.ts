import type { FeatureMetadata } from '../types';

export function Feature(metadata: FeatureMetadata): ClassDecorator {
  return (target: any) => {
    // Simply add the metadata getter
    if (!target.prototype.metadata) {
      Object.defineProperty(target.prototype, 'metadata', {
        get() {
          return metadata;
        },
      });
    }

    return target;
  };
}
