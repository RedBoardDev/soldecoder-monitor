import type { Message, TextChannel } from 'discord.js';
import { DiscordAPIError } from 'discord.js';

/**
 * Safely pins a Discord message with proper error handling
 * Handles permission errors and rate limits gracefully
 */
export async function safePin(message: Message): Promise<void> {
  const maxPins = 50;
  const channel = message.channel as TextChannel;

  if (channel.type !== 0) {
    try {
      await message.pin();
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === 50013) {
        channel.send('❌ **Error**: Missing permission: Manage Messages (required to pin messages)');
        throw new Error('Missing permission: Manage Messages (required to pin messages)');
      }
      throw error;
    }
    return;
  }

  try {
    const pinned = await channel.messages.fetchPinned();

    if (pinned.size >= maxPins) {
      const oldest = pinned.sort((a, b) => a.createdTimestamp - b.createdTimestamp).first() as Message | null;
      if (oldest) {
        await oldest.unpin();
      }
    }

    await message.pin();

    try {
      const recent = await channel.messages.fetch({ limit: 5 });
      for (const sysMsg of recent.values()) {
        if (sysMsg.type === 6 && sysMsg.reference?.messageId === message.id) {
          await sysMsg.delete();
        }
      }
    } catch (_err) {}
  } catch (error) {
    if (error instanceof DiscordAPIError && error.code === 50013) {
      channel.send('❌ **Error**: Missing permission: Manage Messages (required to pin messages)');
      throw new Error('Missing permission: Manage Messages (required to pin messages)');
    }
    throw error;
  }
}
