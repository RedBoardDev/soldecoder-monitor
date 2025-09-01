import { z } from 'zod';

/**
 * Discord configuration schema
 */
export const DiscordSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'Discord token is required'),
  // DISCORD_ADMIN_USER_ID: z.string().default(''),
});

/**
 * AWS configuration schema
 */
export const AWSSchema = z.object({
  AWS_REGION: z.string().min(1, 'AWS region is required'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS access key ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS secret access key is required'),
  DYNAMODB_CONFIG_TABLE_NAME: z.string().min(1, 'DynamoDB config table name is required'),
});

/**
 * Solana configuration schema
 */
export const SolanaSchema = z.object({
  SOLANA_RPC_ENDPOINT: z.string().url().default('https://rpc.ankr.com/solana'),
  // METEORA_PROGRAM_ID: z.string().min(1, 'Meteora program ID is required'),
});

/**
 * LpAgent configuration schema
 */
export const LpAgentSchema = z.object({
  LPAGENT_X_AUTH: z.string().min(1, 'LpAgent X-Auth is required'),
});

/**
 * Donation configuration schema
 */
export const DonationSchema = z.object({
  DONATE_SOLANA_ADDRESS: z.string().min(1, 'Donation Solana address is required'),
});

/**
 * Logging configuration schema
 */
export const LoggingSchema = z.object({
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

/**
 * Complete environment schema
 */
export const EnvironmentSchema = z.object({
  ...DiscordSchema.shape,
  ...AWSSchema.shape,
  ...SolanaSchema.shape,
  ...LpAgentSchema.shape,
  ...DonationSchema.shape,
  ...LoggingSchema.shape,
});

export type EnvironmentVariables = z.infer<typeof EnvironmentSchema>;
