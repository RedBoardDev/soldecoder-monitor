import { z } from 'zod';

export const SummaryPreferencesSchema = z.object({
  dailySummary: z.boolean(),
  weeklySummary: z.boolean(),
  monthlySummary: z.boolean(),
});

export const PositionSizeDefaultsSchema = z.object({
  walletAddress: z.string().nullable(),
  stopLossPercent: z.number().min(0).max(100).nullable(),
});

export const GuildSettingsSchema = z.object({
  guildId: z.string().min(1),
  positionDisplayEnabled: z.boolean(),
  globalChannelId: z.string().nullable(),
  timezone: z.string(),
  forward: z.boolean(),
  autoDeleteWarnings: z.boolean(),
  summaryPreferences: SummaryPreferencesSchema,
  positionSizeDefaults: PositionSizeDefaultsSchema,
  createdAt: z.number(),
});

export type GuildSettingsData = z.infer<typeof GuildSettingsSchema>;
export type SummaryPreferences = z.infer<typeof SummaryPreferencesSchema>;
export type PositionSizeDefaults = z.infer<typeof PositionSizeDefaultsSchema>;

export class GuildSettingsEntity {
  private constructor(
    public readonly guildId: string,
    public readonly positionDisplayEnabled: boolean,
    public readonly globalChannelId: string | null,
    public readonly timezone: string,
    public readonly forward: boolean,
    public readonly autoDeleteWarnings: boolean,
    public readonly summaryPreferences: SummaryPreferences,
    public readonly positionSizeDefaults: PositionSizeDefaults,
    public readonly createdAt: number,
  ) {}

  static create(data: GuildSettingsData): GuildSettingsEntity {
    const validated = GuildSettingsSchema.parse(data);

    return new GuildSettingsEntity(
      validated.guildId,
      validated.positionDisplayEnabled,
      validated.globalChannelId,
      validated.timezone,
      validated.forward,
      validated.autoDeleteWarnings,
      validated.summaryPreferences,
      validated.positionSizeDefaults,
      validated.createdAt,
    );
  }

  static createDefault(guildId: string): GuildSettingsEntity {
    return GuildSettingsEntity.create({
      guildId,
      positionDisplayEnabled: true,
      globalChannelId: null,
      timezone: 'UTC',
      forward: true,
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

  public hasGlobalChannel(): boolean {
    return this.globalChannelId !== null;
  }

  public hasSummaryEnabled(): boolean {
    return (
      this.summaryPreferences.dailySummary ||
      this.summaryPreferences.weeklySummary ||
      this.summaryPreferences.monthlySummary
    );
  }

  public hasPositionDefaults(): boolean {
    return this.positionSizeDefaults.walletAddress !== null || this.positionSizeDefaults.stopLossPercent !== null;
  }

  public update(updates: Partial<Omit<GuildSettingsData, 'guildId' | 'createdAt'>>): GuildSettingsEntity {
    return GuildSettingsEntity.create({
      guildId: this.guildId,
      positionDisplayEnabled: updates.positionDisplayEnabled ?? this.positionDisplayEnabled,
      globalChannelId: updates.globalChannelId ?? this.globalChannelId,
      timezone: updates.timezone ?? this.timezone,
      forward: updates.forward ?? this.forward,
      autoDeleteWarnings: updates.autoDeleteWarnings ?? this.autoDeleteWarnings,
      summaryPreferences: updates.summaryPreferences ?? this.summaryPreferences,
      positionSizeDefaults: updates.positionSizeDefaults ?? this.positionSizeDefaults,
      createdAt: this.createdAt,
    });
  }
}
