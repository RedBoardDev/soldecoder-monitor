import type { ClosedPosition } from '../../domain/value-objects/closed-position.vo';

export class ClosedMessageProcessingResult {
  constructor(
    public readonly messageId: string,
    public readonly channelId: string,
    public readonly success: boolean,
    public readonly shouldSendToGlobal: boolean,
    public readonly closedPosition?: ClosedPosition,
    public readonly reason?: string,
  ) {}

  static success(
    messageId: string,
    channelId: string,
    closedPosition: ClosedPosition,
    shouldSendToGlobal: boolean = false,
  ): ClosedMessageProcessingResult {
    return new ClosedMessageProcessingResult(messageId, channelId, true, shouldSendToGlobal, closedPosition);
  }

  static failure(messageId: string, channelId: string, reason: string): ClosedMessageProcessingResult {
    return new ClosedMessageProcessingResult(messageId, channelId, false, false, undefined, reason);
  }

  get isSuccess(): boolean {
    return this.success;
  }

  get isFailure(): boolean {
    return !this.success;
  }

  public getFailureReason(): string | undefined {
    return this.isFailure ? this.reason : undefined;
  }

  public getClosedPosition(): ClosedPosition | undefined {
    return this.isSuccess ? this.closedPosition : undefined;
  }

  public shouldTriggerGlobalMessage(): boolean {
    return this.success && (this.shouldSendToGlobal ?? false);
  }
}
