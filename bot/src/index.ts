import { config, validateEnvironment } from '@soldecoder-monitor/config-env';
import { type LogLevel, logger, setLogLevel } from '@soldecoder-monitor/logger';
import { Bot } from './core/bot';

/**
 * Setup shutdown handlers
 */
function setupShutdownHandlers(bot: Bot): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, initiating graceful shutdown...`);

    try {
      await bot.stop();
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection:', reason);
    process.exit(1);
  });
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  logger.info('🎯 Discord Bot Feature System v1.0.0');
  logger.info('📦 Initializing bot...');

  // Validate environment variables first
  try {
    validateEnvironment();
    setLogLevel(config.logging.level as LogLevel);
    logger.info('✅ Environment configuration loaded successfully');
  } catch (error) {
    logger.error('❌ Failed to validate environment configuration:', error);
    process.exit(1);
  }

  // Create bot instance
  const bot = new Bot();

  // Setup shutdown handlers
  setupShutdownHandlers(bot);

  // Load example features
  logger.info('📦 Loading features...');

  try {
    // // Import and register Ping Feature
    // const pingFeature = new PingFeature();
    // await bot.registerFeature(pingFeature);

    // // Import and register Test Reaction Feature
    // const testReactionFeature = new TestReactionFeature();
    // await bot.registerFeature(testReactionFeature);

    // // Import and register Scheduler Test Feature
    // const schedulerTestFeature = new SchedulerTestFeature();
    // await bot.registerFeature(schedulerTestFeature);

    logger.info('✅ All features loaded successfully');
  } catch (error) {
    logger.error('❌ Failed to load features:', error);
    throw error;
  }

  // Start the bot
  await bot.start();

  logger.info('🚀 Bot is now running!');
  logger.info('💡 Add features to extend functionality');
}

// Start the bot
main().catch((error) => {
  logger.error('❌ Bot startup failed:', error);
  process.exit(1);
});
