import type { SummaryType } from '../types/summary.types';

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
   * Get the summary period description
   */
  public getPeriodDescription(): string {
    return this.type === 'weekly' ? 'semaine dernière' : 'mois dernier';
  }

  /**
   * Get the summary type label
   */
  public getTypeLabel(): string {
    return this.type === 'weekly' ? 'Hebdomadaire' : 'Mensuel';
  }

  /**
   * Factory method for system context (used by schedulers)
   */
  public static system(type: SummaryType): SummaryContextVO {
    return new SummaryContextVO(type, 'system');
  }

  /**
   * Create a guild-specific context from system context
   */
  public forGuild(guildId: string): SummaryContextVO {
    return new SummaryContextVO(this.type, guildId, this.executedAt);
  }
}
