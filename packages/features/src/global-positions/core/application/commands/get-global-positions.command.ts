import type { GlobalPositionsOptions } from '../../domain/types/global-positions.types';

/**
 * Command DTO for getting global positions
 * Represents the input parameters for global positions retrieval
 */
export class GetGlobalPositionsCommand {
  constructor(
    public readonly guildId: string,
    public readonly percentOnly: boolean = false,
  ) {}

  static fromOptions(guildId: string, options: GlobalPositionsOptions): GetGlobalPositionsCommand {
    return new GetGlobalPositionsCommand(guildId, options.percent_only ?? false);
  }

  public shouldShowPercentOnly(): boolean {
    return this.percentOnly;
  }
}
