import type { GuildSettingsRepository } from '@soldecoder-monitor/data';
import { DynamoChannelConfigRepository } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Guild, TextChannel } from 'discord.js';
import { NoConfiguredChannelsError } from '../../domain/global-positions.errors';
import type { PositionStatus } from '../../domain/value-objects/position-status.vo';
import type { GetGlobalPositionsCommand } from '../commands/get-global-positions.command';
import { parsePositionStatusMessage } from '../helpers/position-parser.helper';
import { GlobalPositionsResult } from '../results/global-positions.result';

const logger = createFeatureLogger('get-global-positions-use-case');

export class GetGlobalPositionsUseCase {
  private readonly channelConfigRepository: DynamoChannelConfigRepository;

  constructor(private readonly guildSettingsRepository: GuildSettingsRepository) {
    this.channelConfigRepository = DynamoChannelConfigRepository.create();
  }

  /**
   * Execute the use case
   * @param command Input parameters
   * @returns Global positions result with all positions grouped by wallet
   * @throws NoConfiguredChannelsError if no channels are configured
   * @throws ChannelFetchError if channel fetching fails
   * @throws MessageParseError if message parsing fails
   */
  async execute(guild: Guild, command: GetGlobalPositionsCommand): Promise<GlobalPositionsResult> {
    const guildSettings = await this.guildSettingsRepository.getByGuildId(command.guildId);
    if (!guildSettings) {
      throw new NoConfiguredChannelsError(command.guildId);
    }

    const channels = await this.channelConfigRepository.getByGuildId(command.guildId);
    if (channels.length === 0) {
      throw new NoConfiguredChannelsError(command.guildId);
    }

    const positionsByWallet = new Map<string, PositionStatus[]>();
    let totalPositions = 0;
    let totalPnL = 0;

    if (!guild) {
      throw new Error('Guild context not set. Call setGuildContext() before execute().');
    }

    for (const ch of channels) {
      try {
        const chan = guild.channels.cache.get(ch.channelId);
        if (!chan || chan.type !== 0) continue;

        const textChannel = chan as TextChannel;
        const messages = await textChannel.messages.fetch({ limit: 1 });
        const latest = messages.first();
        if (!latest) continue;

        const parsed = parsePositionStatusMessage(latest.content);
        if (!parsed) continue;

        const key = parsed.walletName;
        if (!positionsByWallet.has(key)) positionsByWallet.set(key, []);
        positionsByWallet.get(key)?.push(parsed);

        totalPositions++;
        totalPnL += parsed.pnl;
      } catch (error) {
        logger.warn('Failed to fetch or parse channel message', {
          channelId: ch.channelId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return new GlobalPositionsResult(command.guildId, positionsByWallet, totalPositions, totalPnL, command.percentOnly);
  }
}
