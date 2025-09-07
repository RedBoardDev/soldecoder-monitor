import type { ThresholdType } from '@soldecoder-monitor/data';

/**
 * Channel configuration update payload
 */
export interface ChannelConfigUpdates {
  image?: boolean;
  pin?: boolean;
  tagType?: 'user' | 'role' | null;
  tagId?: string | null;
  threshold?: ThresholdType;
}

/**
 * Command for updating a specific channel configuration
 */
export class UpdateChannelConfigCommand {
  constructor(
    public readonly channelId: string,
    public readonly updates: ChannelConfigUpdates,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.channelId || this.channelId.trim().length === 0) {
      throw new Error('Channel ID is required and cannot be empty');
    }

    if (!this.updates || Object.keys(this.updates).length === 0) {
      throw new Error('At least one update field is required');
    }
  }
}
