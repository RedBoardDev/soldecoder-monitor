/**
 * Utility class for building consistent custom IDs for Discord interactions
 */
export class CustomIdBuilder {
  private parts: string[] = [];

  /**
   * Create a new builder with initial parts
   */
  constructor(...parts: string[]) {
    this.parts = parts;
  }

  /**
   * Add a part to the custom ID
   */
  add(part: string): this {
    this.parts.push(part);
    return this;
  }

  /**
   * Add a feature namespace
   */
  feature(name: string): this {
    return this.add(name);
  }

  /**
   * Add an action
   */
  action(name: string): this {
    return this.add(name);
  }

  /**
   * Add an ID
   */
  id(id: string | number): this {
    return this.add(String(id));
  }

  /**
   * Add metadata
   */
  metadata(data: Record<string, unknown>): this {
    const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
    return this.add(encoded);
  }

  /**
   * Build the custom ID
   */
  build(separator = ':'): string {
    return this.parts.join(separator);
  }

  /**
   * Parse a custom ID
   */
  static parse(customId: string, separator = ':'): string[] {
    return customId.split(separator);
  }

  /**
   * Parse metadata from a custom ID part
   */
  static parseMetadata(encodedData: string): Record<string, unknown> {
    try {
      const decoded = Buffer.from(encodedData, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      return {};
    }
  }

  /**
   * Create a regex pattern for matching custom IDs
   */
  static pattern(...parts: (string | RegExp)[]): RegExp {
    const patterns = parts.map((part) => {
      if (part instanceof RegExp) {
        return part.source;
      }
      return part;
    });

    return new RegExp(`^${patterns.join(':')}$`);
  }
}
