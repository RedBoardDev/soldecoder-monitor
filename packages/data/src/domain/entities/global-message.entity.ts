import { z } from 'zod';

/**
 * Global Position Message entity schema
 */
export const GlobalMessageSchema = z.object({
  messageId: z.string().min(1),
  guildId: z.string().min(1),
  lastUpdated: z.number(),
});

export type GlobalMessageData = z.infer<typeof GlobalMessageSchema>;

/**
 * Global Position Message domain entity
 * Represents a Discord message used for global position tracking
 */
export class GlobalMessageEntity {
  private constructor(
    public readonly messageId: string,
    public readonly guildId: string,
    public readonly lastUpdated: number,
  ) {}

  /**
   * Creates a new GlobalMessageEntity with validation
   */
  static create(data: GlobalMessageData): GlobalMessageEntity {
    const validated = GlobalMessageSchema.parse(data);

    return new GlobalMessageEntity(validated.messageId, validated.guildId, validated.lastUpdated);
  }

  /**
   * Creates a new global message for a guild
   */
  static createNew(messageId: string, guildId: string): GlobalMessageEntity {
    return GlobalMessageEntity.create({
      messageId,
      guildId,
      lastUpdated: Date.now(),
    });
  }

  /**
   * Business logic: Check if message needs update (older than threshold)
   */
  public needsUpdate(thresholdMs: number = 5 * 60 * 1000): boolean {
    return Date.now() - this.lastUpdated > thresholdMs;
  }

  /**
   * Business logic: Get age of message in minutes
   */
  public getAgeInMinutes(): number {
    return Math.floor((Date.now() - this.lastUpdated) / (1000 * 60));
  }

  /**
   * Create updated entity with new timestamp
   */
  public updateTimestamp(): GlobalMessageEntity {
    return GlobalMessageEntity.create({
      messageId: this.messageId,
      guildId: this.guildId,
      lastUpdated: Date.now(),
    });
  }
}
