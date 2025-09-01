import { z } from 'zod';

/**
 * Summary Preferences value object schema
 */
export const SummaryPreferencesSchema = z.object({
  dailySummary: z.boolean(),
  weeklySummary: z.boolean(),
  monthlySummary: z.boolean(),
});

/**
 * Position Size Defaults value object schema
 */
export const PositionSizeDefaultsSchema = z.object({
  walletAddress: z.string().nullable(),
  stopLossPercent: z.number().min(0).max(100).nullable(),
});

/**
 * Guild Settings entity schema
 */
export const GuildSettingsSchema = z.object({
  guildId: z.string().min(1),
  positionDisplayEnabled: z.boolean(),
  globalChannelId: z.string().nullable(),
  timezone: z.string(),
  forwardTpSl: z.boolean(),
  autoDeleteWarnings: z.boolean(),
  summaryPreferences: SummaryPreferencesSchema,
  positionSizeDefaults: PositionSizeDefaultsSchema,
  createdAt: z.number(),
});

export type GuildSettingsData = z.infer<typeof GuildSettingsSchema>;
export type SummaryPreferences = z.infer<typeof SummaryPreferencesSchema>;
export type PositionSizeDefaults = z.infer<typeof PositionSizeDefaultsSchema>;

/**
 * Guild Settings domain entity
 * Represents Discord guild configuration and preferences
 */
export class GuildSettingsEntity {
  private constructor(
    public readonly guildId: string,
    public readonly positionDisplayEnabled: boolean,
    public readonly globalChannelId: string | null,
    public readonly timezone: string,
    public readonly forwardTpSl: boolean,
    public readonly autoDeleteWarnings: boolean,
    public readonly summaryPreferences: SummaryPreferences,
    public readonly positionSizeDefaults: PositionSizeDefaults,
    public readonly createdAt: number,
  ) {}

  /**
   * Creates a new GuildSettingsEntity with validation
   */
  static create(data: GuildSettingsData): GuildSettingsEntity {
    const validated = GuildSettingsSchema.parse(data);

    return new GuildSettingsEntity(
      validated.guildId,
      validated.positionDisplayEnabled,
      validated.globalChannelId,
      validated.timezone,
      validated.forwardTpSl,
      validated.autoDeleteWarnings,
      validated.summaryPreferences,
      validated.positionSizeDefaults,
      validated.createdAt,
    );
  }

  /**
   * Creates guild settings with default values
   */
  static createDefault(guildId: string): GuildSettingsEntity {
    return GuildSettingsEntity.create({
      guildId,
      positionDisplayEnabled: true,
      globalChannelId: null,
      timezone: 'UTC',
      forwardTpSl: true,
      autoDeleteWarnings: false,
      summaryPreferences: {
        dailySummary: false,
        weeklySummary: false,
        monthlySummary: false,
      },
      positionSizeDefaults: {
        walletAddress: null,
        stopLossPercent: null,
      },
      createdAt: Date.now(),
    });
  }

  /**
   * Business logic: Check if guild has global channel configured
   */
  public hasGlobalChannel(): boolean {
    return this.globalChannelId !== null;
  }

  /**
   * Business logic: Check if any summary is enabled
   */
  public hasSummaryEnabled(): boolean {
    return (
      this.summaryPreferences.dailySummary ||
      this.summaryPreferences.weeklySummary ||
      this.summaryPreferences.monthlySummary
    );
  }

  /**
   * Business logic: Check if position size defaults are configured
   */
  public hasPositionDefaults(): boolean {
    return this.positionSizeDefaults.walletAddress !== null || this.positionSizeDefaults.stopLossPercent !== null;
  }

  /**
   * Create updated entity with new values
   */
  public update(updates: Partial<Omit<GuildSettingsData, 'guildId' | 'createdAt'>>): GuildSettingsEntity {
    return GuildSettingsEntity.create({
      guildId: this.guildId,
      positionDisplayEnabled: updates.positionDisplayEnabled ?? this.positionDisplayEnabled,
      globalChannelId: updates.globalChannelId ?? this.globalChannelId,
      timezone: updates.timezone ?? this.timezone,
      forwardTpSl: updates.forwardTpSl ?? this.forwardTpSl,
      autoDeleteWarnings: updates.autoDeleteWarnings ?? this.autoDeleteWarnings,
      summaryPreferences: updates.summaryPreferences ?? this.summaryPreferences,
      positionSizeDefaults: updates.positionSizeDefaults ?? this.positionSizeDefaults,
      createdAt: this.createdAt,
    });
  }
}
