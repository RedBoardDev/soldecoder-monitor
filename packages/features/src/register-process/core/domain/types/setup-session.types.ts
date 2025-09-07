export interface SetupSessionData {
  globalChannelId?: string;
  walletAddress?: string;
  stopLossPercent?: number;
  positionDisplayEnabled?: boolean;
  forward?: boolean;
}

export interface SetupSession {
  guildId: string;
  userId: string;
  currentStep: number;
  startedAt: number;
  lastMessageId?: string;
  lastChannelId?: string;
  data: SetupSessionData;
}

export enum SetupStep {
  CHANNEL_SELECT = 1,
  WALLET_CONFIG = 2,
  FEATURE_TOGGLES = 3,
  SUMMARY_CONFIRM = 4,
  COMPLETION_GUIDE = 5,
}

export class SessionKey {
  constructor(public readonly value: string) {}

  static create(guildId: string, userId: string): SessionKey {
    return new SessionKey(`${guildId}:${userId}`);
  }
}
