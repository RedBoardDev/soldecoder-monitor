// Errors
export {
  ChannelAlreadyConfiguredError,
  ChannelConfigNotFoundError,
  InvalidChannelConfigurationError,
  NoChannelsConfiguredError,
} from './errors/settings-channels.errors';

// Types
export {
  type AddChannelRequest,
  addChannelRequestSchema,
  type ChannelInfo,
  type ChannelSettingsOverview,
  channelInfoSchema,
  channelSettingsOverviewSchema,
  type GuildChannelsList,
  guildChannelsListSchema,
  type RemoveChannelRequest,
  removeChannelRequestSchema,
} from './types/settings-channels.types';

// Value Objects
export { ChannelSettings } from './value-objects/channel-settings.vo';
export { ThresholdVO } from './value-objects/threshold.vo';
