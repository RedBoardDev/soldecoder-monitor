import type { GuildSettingsEntity } from '@soldecoder-monitor/data';
import type { SummaryData } from './summary-data.types';

export interface ProcessedGuildSuccess {
  guildConfig: GuildSettingsEntity;
  summaryData: SummaryData;
  success: true;
}

export interface ProcessedGuildFailure {
  guildConfig: GuildSettingsEntity;
  summaryData: null;
  success: false;
  error: string;
}

export type ProcessedGuild = ProcessedGuildSuccess | ProcessedGuildFailure;

export interface ProcessSummaryResult {
  isSuccess: boolean;
  processedGuilds: ProcessedGuild[];
  error?: string;
}
