import { z } from 'zod';

// Summary Type Enum
export const SummaryTypeSchema = z.enum(['weekly', 'monthly']);
export type SummaryType = z.infer<typeof SummaryTypeSchema>;

// Summary Context for processing
export const SummaryContextSchema = z.object({
  type: SummaryTypeSchema,
  guildId: z.string(),
  executedAt: z.date(),
});

export type SummaryContext = z.infer<typeof SummaryContextSchema>;

// Summary Configuration (can be extended later)
export const SummaryConfigSchema = z.object({
  enabled: z.boolean().default(true),
  type: SummaryTypeSchema,
  timezone: z.string().default('UTC'),
});

export type SummaryConfig = z.infer<typeof SummaryConfigSchema>;

// Summary Processing Result
export const SummaryResultSchema = z.object({
  success: z.boolean(),
  guildId: z.string(),
  type: SummaryTypeSchema,
  processedAt: z.date(),
  messageCount: z.number().optional(),
  errorMessage: z.string().optional(),
});

export type SummaryResult = z.infer<typeof SummaryResultSchema>;
