import { z } from 'zod';

// Summary Type Enum
export const SummaryTypeSchema = z.enum(['weekly', 'monthly']);
export type SummaryType = z.infer<typeof SummaryTypeSchema>;
