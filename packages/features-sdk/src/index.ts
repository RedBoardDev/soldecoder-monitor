// Core exports
export { Feature } from './core/feature-base';
export { createFeatureContext } from './core/feature-context';
export { FeatureLoader, type LoaderOptions } from './core/feature-loader';
export { FeatureManager, type FeatureManagerOptions } from './core/feature-manager';

// Decorator exports
export {
  Autocomplete,
  MessageCommand,
  SlashCommand,
  UserCommand,
} from './decorators/commands.decorator';
export { On, Once } from './decorators/events.decorator';
export { Feature as FeatureDecorator } from './decorators/feature.decorator';
export {
  Ephemeral,
  GuildOnly,
  RateLimit,
  RequirePermissions,
  UseGuards,
} from './decorators/guards.decorator';
export {
  ButtonHandler,
  ModalHandler,
  SelectHandler,
} from './decorators/interactions.decorator';
export { metadataRegistry } from './decorators/metadata-registry';
export { Cron, Interval } from './decorators/schedulers.decorator';

// Documentation exports
export type { DocumentationOptions } from './documentation/documentation.types';
export { HelpGenerator } from './documentation/help.generator';

// Guard exports
export { GuildOnlyGuard } from './guards/builtin/guild-only.guard';
export { PermissionGuard } from './guards/builtin/permission.guard';
export { RateLimitGuard } from './guards/builtin/rate-limit.guard';
export { GuardExecutor } from './guards/guard.executor';
export type { Guard } from './guards/guard.interface';

// Handler exports (if needed for extension)
export { type AnyInteraction, BaseInteractionHandler } from './handlers/base-interaction.handler';
export { CommandHandler } from './handlers/command.handler';
export { EventDispatcher } from './handlers/event.dispatcher';
export { InteractionRouter } from './handlers/interaction.router';
export { SchedulerService } from './handlers/scheduler.service';

// Type exports
export * from './types';

// Utils exports
export { CustomIdBuilder } from './utils/custom-id.builder';
export { ErrorHandler } from './utils/error-handler';
export { MetadataScanner } from './utils/metadata.scanner';
