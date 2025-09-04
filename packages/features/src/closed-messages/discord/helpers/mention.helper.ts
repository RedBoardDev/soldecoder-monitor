import type { ChannelConfigEntity } from '@soldecoder-monitor/data';
import type { MentionData } from '../../core/domain/types/prepared-content.types';

/**
 * Prepares mention data based on channel configuration
 * Creates appropriate mention strings and allowed mentions configuration
 */
export function prepareMention(channelConfig: ChannelConfigEntity): MentionData {
  if (!channelConfig.tagId || channelConfig.tagType === null) {
    return { mention: null };
  }

  if (channelConfig.tagType === 'user') {
    return {
      mention: `<@${channelConfig.tagId}>`,
      allowedMentions: { users: [channelConfig.tagId] },
    };
  }

  if (channelConfig.tagType === 'role') {
    return {
      mention: `<@&${channelConfig.tagId}>`,
      allowedMentions: { roles: [channelConfig.tagId] },
    };
  }

  return { mention: null };
}
