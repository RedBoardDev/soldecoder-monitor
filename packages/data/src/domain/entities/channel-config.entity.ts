import { z } from 'zod';

/**
 * Threshold configuration types
 * - number: Fixed percentage threshold
 * - 'TP': Only apply threshold to Take Profit messages
 * - 'SL': Only apply threshold to Stop Loss messages
 * - 'TP/SL': Apply threshold to both TP and SL messages
 * - null: No threshold
 */
export const ThresholdTypeSchema = z.union([
  z.number().min(0),
  z.literal('TP'),
  z.literal('SL'),
  z.literal('TP/SL'),
  z.null(),
]);

export type ThresholdType = z.infer<typeof ThresholdTypeSchema>;

/**
 * Channel Configuration entity schema
 */
export const ChannelConfigSchema = z.object({
  channelId: z.string().min(1),
  guildId: z.string().min(1),
  image: z.boolean(),
  pin: z.boolean(),
  tagType: z.enum(['user', 'role']).nullable(),
  tagId: z.string().nullable(),
  threshold: ThresholdTypeSchema,
  createdAt: z.number(),
});

export type ChannelConfigData = z.infer<typeof ChannelConfigSchema>;

/**
 * Channel Configuration domain entity
 * Represents Discord channel monitoring configuration
 */
export class ChannelConfigEntity {
  private constructor(
    public readonly channelId: string,
    public readonly guildId: string,
    public readonly image: boolean,
    public readonly pin: boolean,
    public readonly tagType: 'user' | 'role' | null,
    public readonly tagId: string | null,
    public readonly threshold: ThresholdType,
    public readonly createdAt: number,
  ) {}

  /**
   * Creates a new ChannelConfigEntity with validation
   */
  static create(data: ChannelConfigData): ChannelConfigEntity {
    const validated = ChannelConfigSchema.parse(data);

    return new ChannelConfigEntity(
      validated.channelId,
      validated.guildId,
      validated.image,
      validated.pin,
      validated.tagType,
      validated.tagId,
      validated.threshold,
      validated.createdAt,
    );
  }

  /**
   * Creates a new configuration with default values
   */
  static createDefault(channelId: string, guildId: string): ChannelConfigEntity {
    return ChannelConfigEntity.create({
      channelId,
      guildId,
      image: false,
      pin: false,
      tagType: null,
      tagId: null,
      threshold: null,
      createdAt: Date.now(),
    });
  }

  /**
   * Business logic: Check if notifications are enabled
   */
  public hasNotifications(): boolean {
    return this.tagType !== null;
  }

  /**
   * Business logic: Check if threshold is configured
   */
  public hasThreshold(): boolean {
    return this.threshold !== null;
  }

  /**
   * Business logic: Check if threshold applies to a specific trigger type
   */
  public thresholdAppliesTo(triggerType: 'take_profit' | 'stop_loss' | null): boolean {
    if (this.threshold === null) return false;
    if (typeof this.threshold === 'number') return true;

    switch (this.threshold) {
      case 'TP':
        return triggerType === 'take_profit';
      case 'SL':
        return triggerType === 'stop_loss';
      case 'TP/SL':
        return triggerType === 'take_profit' || triggerType === 'stop_loss';
      default:
        return false;
    }
  }

  /**
   * Business logic: Get numeric threshold value if applicable
   */
  public getNumericThreshold(): number | null {
    return typeof this.threshold === 'number' ? this.threshold : null;
  }

  /**
   * Create updated entity with new values
   */
  public update(updates: Partial<Omit<ChannelConfigData, 'channelId' | 'guildId' | 'createdAt'>>): ChannelConfigEntity {
    return ChannelConfigEntity.create({
      channelId: this.channelId,
      guildId: this.guildId,
      image: updates.image ?? this.image,
      pin: updates.pin ?? this.pin,
      tagType: updates.tagType ?? this.tagType,
      tagId: updates.tagId ?? this.tagId,
      threshold: updates.threshold ?? this.threshold,
      createdAt: this.createdAt,
    });
  }
}
