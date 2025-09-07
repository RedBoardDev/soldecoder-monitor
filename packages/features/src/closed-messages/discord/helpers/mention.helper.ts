import type { ChannelConfigEntity } from '@soldecoder-monitor/data';
import type { MentionData } from '../../core/domain/types/prepared-content.types';

/**
 * Prepares mention data based on channel configuration and threshold validation
 * Creates appropriate mention strings and allowed mentions configuration
 */
export function prepareMention(
  channelConfig: ChannelConfigEntity,
  meetsThreshold: boolean,
): MentionData {
  if (!meetsThreshold) {
    return { mention: null };
  }

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
