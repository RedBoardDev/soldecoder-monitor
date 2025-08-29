import 'reflect-metadata'; // IMPORTANT: Must be first import

import { logger } from '@soldecoder-monitor/logger';
import { BotService } from './bot.service';

/**
 * Main entry point for the Discord Bot
 */
async function main(): Promise<void> {
  logger.info('🎯 Discord Bot Starting...');

  const botService = new BotService();

  // Setup signal handlers for graceful shutdown
  botService.setupSignalHandlers();

  // Initialize and start the bot
  const result = await botService.initialize();

  if (!result.success) {
    logger.error('❌ Bot initialization failed');
    if (result.errors) {
      result.errors.forEach((error) => {
        logger.error(error);
      });
    }
    process.exit(1);
  }

  if (result.errors && result.errors.length > 0) {
    logger.warn('⚠️ Bot started with some warnings:');
    result.errors.forEach((error) => {
      logger.warn(error);
    });
  }
}

// Start the application
main().catch((error) => {
  logger.error('💥 Unhandled error:', error);
  process.exit(1);
});
