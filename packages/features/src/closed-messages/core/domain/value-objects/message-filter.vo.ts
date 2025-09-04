import { ChannelType } from 'discord.js';

/**
 * Value Object for filtering Discord messages based on closed message criteria
 */
export class MessageFilter {
  private static readonly CLOSED_MESSAGE_PREFIX = '🟨Closed';

  constructor(
    public readonly content: string,
    public readonly isFromGuild: boolean,
    public readonly isFromTextChannel: boolean,
  ) {}

  public static fromDiscordMessage(content: string, guildId: string | null, channelType: number): MessageFilter {
    const isFromGuild = guildId !== null;
    const isFromTextChannel = channelType === ChannelType.GuildText;

    return new MessageFilter(content, isFromGuild, isFromTextChannel);
  }

  public matchesClosedMessage(): boolean {
    return (
      this.isFromGuild && this.isFromTextChannel && this.content.trim().startsWith(MessageFilter.CLOSED_MESSAGE_PREFIX)
    );
  }
}
