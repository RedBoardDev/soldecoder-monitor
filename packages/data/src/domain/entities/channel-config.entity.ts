import { z } from 'zod';

/**
 * Channel Configuration entity schema
 */
export const ChannelConfigSchema = z.object({
  channelId: z.string().min(1),
  guildId: z.string().min(1),
  image: z.boolean(),
  notifyOnClose: z.boolean(),
  pin: z.boolean(),
  tagType: z.enum(['user', 'role']).nullable(),
  tagId: z.string().nullable(),
  threshold: z.number().min(0).nullable(),
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
    public readonly notifyOnClose: boolean,
    public readonly pin: boolean,
    public readonly tagType: 'user' | 'role' | null,
    public readonly tagId: string | null,
    public readonly threshold: number | null,
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
      validated.notifyOnClose,
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
      notifyOnClose: true,
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
    return this.notifyOnClose || this.tagType !== null;
  }

  /**
   * Business logic: Check if threshold is configured
   */
  public hasThreshold(): boolean {
    return this.threshold !== null && this.threshold > 0;
  }

  /**
   * Create updated entity with new values
   */
  public update(updates: Partial<Omit<ChannelConfigData, 'channelId' | 'guildId' | 'createdAt'>>): ChannelConfigEntity {
    return ChannelConfigEntity.create({
      channelId: this.channelId,
      guildId: this.guildId,
      image: updates.image ?? this.image,
      notifyOnClose: updates.notifyOnClose ?? this.notifyOnClose,
      pin: updates.pin ?? this.pin,
      tagType: updates.tagType ?? this.tagType,
      tagId: updates.tagId ?? this.tagId,
      threshold: updates.threshold ?? this.threshold,
      createdAt: this.createdAt,
    });
  }
}
