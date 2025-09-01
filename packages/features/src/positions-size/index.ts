// Position Size feature public API

// Core - Application Layer
export { CalculatePositionSizesCommand } from './core/application/commands/calculate-position-sizes.command';
export { PositionSizeCalculationsResult } from './core/application/results/position-size-calculations.result';
export { CalculatePositionSizesUseCase } from './core/application/use-cases/calculate-position-sizes.use-case';

// Core - Domain Layer
export {
  InvalidCurrentSizeError,
  InvalidStoplossPercentError,
  MissingPositionConfigurationError,
  PositionCalculationError,
  WalletInfoServiceError,
} from './core/domain/position-size.errors';
export {
  calculateAllPositionRecommendations,
  computeRecommendedSize,
} from './core/domain/services/position-size-calculator.service';
export { NetWorth } from './core/domain/value-objects/net-worth.vo';
export { PositionCount } from './core/domain/value-objects/position-count.vo';
export { PositionSizeItem } from './core/domain/value-objects/position-size-item.vo';
export { StopLossPercent } from './core/domain/value-objects/stop-loss-percent.vo';

// Discord handlers
export { PositionSizeCommandHandler, type PositionSizeOptions } from './discord/commands/position-size.command';
// UI components
export {
  buildPositionSizeRecommendationsEmbed,
  buildPositionSizeSettingsFallbackEmbed,
  type PositionSizeRecommendationsEmbedParams,
  type PositionSizeSettingsFallbackEmbedParams,
} from './discord/ui/position-size-recommendations.embed';
// Feature
export { PositionSizeFeature } from './position-size.feature';
