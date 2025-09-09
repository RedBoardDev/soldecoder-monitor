import type { TriggerData } from '../../domain/types/trigger.types';
import type { ClosedPosition } from '../../domain/value-objects/closed-position.vo';

export class ClosedMessageProcessingResult {
  constructor(
    public readonly messageId: string,
    public readonly channelId: string,
    public readonly success: boolean,
    public readonly shouldSendToGlobal: boolean,
    public readonly meetsThreshold: boolean,
    public readonly closedPosition?: ClosedPosition,
    public readonly reason?: string,
    public readonly triggerData?: TriggerData | null,
  ) {}

  static success(
    messageId: string,
    channelId: string,
    closedPosition: ClosedPosition,
    shouldSendToGlobal: boolean = false,
    meetsThreshold: boolean = true,
    triggerData: TriggerData | null = null,
  ): ClosedMessageProcessingResult {
    return new ClosedMessageProcessingResult(
      messageId,
      channelId,
      true,
      shouldSendToGlobal,
      meetsThreshold,
      closedPosition,
      undefined,
      triggerData,
    );
  }

  static failure(messageId: string, channelId: string, reason: string): ClosedMessageProcessingResult {
    return new ClosedMessageProcessingResult(messageId, channelId, false, false, false, undefined, reason, null);
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
