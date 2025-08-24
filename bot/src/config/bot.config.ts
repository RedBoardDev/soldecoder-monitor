import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const BotConfigSchema = z.object({
  // Discord
  DISCORD_TOKEN: z.string().min(1, 'Discord token is required'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Plugins
  PLUGINS_DIR: z.string().default('./plugins'),
  AUTO_LOAD_PLUGINS: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
});

const configParse = BotConfigSchema.safeParse(process.env);

if (!configParse.success) {
  console.error('❌ Invalid configuration:', configParse.error.format());
  process.exit(1);
}

export const config = {
  discord: {
    token: configParse.data.DISCORD_TOKEN,
  },
  environment: configParse.data.NODE_ENV,
  logging: {
    level: configParse.data.LOG_LEVEL,
  },
  plugins: {
    directory: configParse.data.PLUGINS_DIR,
    autoLoad: configParse.data.AUTO_LOAD_PLUGINS,
  },
} as const;

export type BotConfig = typeof config;
