import { time } from '@shared/domain';
import {
  SessionAlreadyExistsError,
  SessionExpiredError,
  SessionKey,
  SessionNotFoundError,
  SessionOwnershipError,
  type SetupSession,
  type SetupSessionData,
  SetupStep,
} from '../../domain';

export class SetupSessionService {
  private static instance: SetupSessionService;
  private sessions: Map<string, SetupSession> = new Map();
  private readonly SESSION_TIMEOUT_MS = time.minutes(10);
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.cleanupInterval = setInterval(() => this.cleanupExpiredSessions(), time.minutes(30));
  }

  static getInstance(): SetupSessionService {
    if (!SetupSessionService.instance) {
      SetupSessionService.instance = new SetupSessionService();
    }
    return SetupSessionService.instance;
  }

  createSession(guildId: string, userId: string): SetupSession {
    const sessionKey = SessionKey.create(guildId, userId);

    const existingSession = this.sessions.get(sessionKey.value);
    if (existingSession && !this.isExpired(existingSession)) {
      throw new SessionAlreadyExistsError(guildId, userId);
    }

    const session: SetupSession = {
      guildId,
      userId,
      currentStep: SetupStep.CHANNEL_SELECT,
      startedAt: Date.now(),
      data: {
        positionDisplayEnabled: true,
        forward: true,
        summaryPreferences: {
          weeklySummary: false,
          monthlySummary: false,
        },
      },
    };

    this.sessions.set(sessionKey.value, session);
    return session;
  }

  getSession(guildId: string, userId: string): SetupSession {
    const sessionKey = SessionKey.create(guildId, userId);
    const session = this.sessions.get(sessionKey.value);

    if (!session) {
      throw new SessionNotFoundError(guildId, userId);
    }

    if (this.isExpired(session)) {
      this.deleteSession(guildId, userId);
      throw new SessionExpiredError(guildId, userId);
    }

    return session;
  }

  updateSession(guildId: string, userId: string, updates: Partial<SetupSession>): SetupSession {
    const session = this.getSession(guildId, userId);

    const updatedSession: SetupSession = {
      ...session,
      ...updates,
      data: {
        ...session.data,
        ...(updates.data || {}),
      },
    };

    const sessionKey = SessionKey.create(guildId, userId);
    this.sessions.set(sessionKey.value, updatedSession);
    return updatedSession;
  }

  updateStep(guildId: string, userId: string, step: SetupStep): SetupSession {
    return this.updateSession(guildId, userId, { currentStep: step });
  }

  updateData(guildId: string, userId: string, data: Partial<SetupSessionData>): SetupSession {
    const session = this.getSession(guildId, userId);
    return this.updateSession(guildId, userId, {
      data: { ...session.data, ...data },
    });
  }

  setLastMessageInfo(guildId: string, userId: string, messageId: string, channelId: string): void {
    const _session = this.getSession(guildId, userId);
    this.updateSession(guildId, userId, {
      lastMessageId: messageId,
      lastChannelId: channelId,
    });
  }

  deleteSession(guildId: string, userId: string): void {
    const sessionKey = SessionKey.create(guildId, userId);
    this.sessions.delete(sessionKey.value);
  }

  validateOwnership(session: SetupSession, userId: string): void {
    if (session.userId !== userId) {
      throw new SessionOwnershipError(session.userId, userId);
    }
  }

  canNavigateToStep(session: SetupSession, targetStep: SetupStep): boolean {
    switch (targetStep) {
      case SetupStep.CHANNEL_SELECT:
        return true;
      case SetupStep.WALLET_CONFIG:
        return !!session.data.globalChannelId;
      case SetupStep.FEATURE_TOGGLES:
        return !!session.data.globalChannelId;
      case SetupStep.SUMMARY_CONFIRM:
        return !!session.data.globalChannelId;
      case SetupStep.COMPLETION_GUIDE:
        return this.isSessionComplete(session);
      default:
        return false;
    }
  }

  isSessionComplete(session: SetupSession): boolean {
    return !!session.data.globalChannelId;
  }

  getNextRequiredField(session: SetupSession): string | null {
    if (!session.data.globalChannelId) return 'Global Channel';
    return null;
  }

  private isExpired(session: SetupSession): boolean {
    return Date.now() - session.startedAt > this.SESSION_TIMEOUT_MS;
  }

  private cleanupExpiredSessions(): void {
    const expiredKeys: string[] = [];

    for (const [key, session] of this.sessions.entries()) {
      if (this.isExpired(session)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.sessions.delete(key);
    }
  }

  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
  }
}
