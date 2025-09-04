import type { TriggerData } from './trigger.types';

/**
 * Prepared content for Discord message sending
 */
export interface PreparedContent {
  /** Main content body without hidden mentions */
  contentBody: string;
  /** Full content with hidden mentions for channel posting */
  content: string;
  /** Optional image files to attach */
  files?: Array<{ attachment: Buffer; name: string }>;
  /** Detected trigger data if any */
  triggerData: TriggerData | null;
}

/**
 * Mention data for Discord message posting
 */
export interface MentionData {
  /** Mention string or null */
  mention: string | null;
  /** Discord allowed mentions configuration */
  allowedMentions?: { users?: string[]; roles?: string[] };
}
