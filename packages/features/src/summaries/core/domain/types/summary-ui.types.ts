import { z } from 'zod';

export const SummaryUIDataSchema = z.object({
  period: z.string(),
  totalPnlUSD: z.number(),
  totalPnlSOL: z.number(),
  winRate: z.number(),
  totalFeesSOL: z.number(),
  nativeWinRate: z.number(),
  totalPools: z.number(),
  roi: z.number(),
});

export type SummaryUIData = z.infer<typeof SummaryUIDataSchema>;

export const SummaryEmbedConfigSchema = z.object({
  title: z.string(),
  color: z.number(),
  thumbnail: z.string().optional(),
  footer: z.string(),
});

export type SummaryEmbedConfig = z.infer<typeof SummaryEmbedConfigSchema>;

export const SummaryImageDataSchema = z.object({
  period: z.string(),
  totalPnlUSD: z.number(),
  totalPnlSOL: z.number(),
  winRate: z.number(),
  roi: z.number(),
});

export type SummaryImageData = z.infer<typeof SummaryImageDataSchema>;
