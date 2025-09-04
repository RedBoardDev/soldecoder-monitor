import type { SummaryContext, SummaryType } from '../types/summary.types';

/**
 * Value Object representing the context for a summary execution
 * Immutable and encapsulates summary execution metadata
 */
export class SummaryContextVO {
  constructor(
    public readonly type: SummaryType,
    public readonly guildId: string,
    public readonly executedAt: Date = new Date(),
  ) {}

  /**
   * Check if this is a weekly summary
   */
  public isWeekly(): boolean {
    return this.type === 'weekly';
  }

  /**
   * Check if this is a monthly summary
   */
  public isMonthly(): boolean {
    return this.type === 'monthly';
  }

  /**
   * Get the summary period description
   */
  public getPeriodDescription(): string {
    return this.isWeekly() ? 'semaine dernière' : 'mois dernier';
  }

  /**
   * Get the summary type label
   */
  public getTypeLabel(): string {
    return this.isWeekly() ? 'Hebdomadaire' : 'Mensuel';
  }

  /**
   * Convert to plain object for serialization
   */
  public toObject(): SummaryContext {
    return {
      type: this.type,
      guildId: this.guildId,
      executedAt: this.executedAt,
    };
  }

  /**
   * Create from plain object
   */
  public static fromObject(obj: SummaryContext): SummaryContextVO {
    return new SummaryContextVO(obj.type, obj.guildId, obj.executedAt);
  }

  /**
   * Factory method for weekly summary
   */
  public static weekly(guildId: string): SummaryContextVO {
    return new SummaryContextVO('weekly', guildId);
  }

  /**
   * Factory method for monthly summary
   */
  public static monthly(guildId: string): SummaryContextVO {
    return new SummaryContextVO('monthly', guildId);
  }
}
