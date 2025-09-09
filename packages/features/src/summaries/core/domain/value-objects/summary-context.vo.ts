import type { SummaryPreferences } from '@soldecoder-monitor/data';
import type { SummaryType } from '../types/summary.types';

export class SummaryContextVO {
  constructor(
    public readonly type: SummaryType,
    public readonly executedAt: Date = new Date(),
  ) {}

  get periodDescription(): string {
    return this.type === 'weekly' ? 'last week' : 'last month';
  }

  get typeLabel(): string {
    return this.type === 'weekly' ? 'Weekly' : 'Monthly';
  }

  public static create(type: SummaryType, executedAt?: Date): SummaryContextVO {
    return new SummaryContextVO(type, executedAt);
  }

  public static isGuildEligible(summaryType: SummaryType, preferences: SummaryPreferences): boolean {
    switch (summaryType) {
      case 'weekly':
        return preferences.weeklySummary;
      case 'monthly':
        return preferences.monthlySummary;
      default:
        return false;
    }
  }

  public static getPreferenceProperty(summaryType: SummaryType): keyof SummaryPreferences {
    switch (summaryType) {
      case 'weekly':
        return 'weeklySummary';
      case 'monthly':
        return 'monthlySummary';
      default:
        throw new Error(`Unknown summary type: ${summaryType}`);
    }
  }

  public get periodKey(): '7D' | '1M' {
    return this.type === 'weekly' ? '7D' : '1M';
  }

  public extractPeriodData<T extends Record<string, { '7D': number; '1M': number }>>(data: T): Record<keyof T, number> {
    const result = {} as Record<keyof T, number>;
    const periodKey = this.periodKey;

    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && periodKey in value) {
        result[key as keyof T] = value[periodKey];
      }
    }

    return result;
  }
}
