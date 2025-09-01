// Position Size feature public API

// Core - Application Layer
export { CalculatePositionSizesCommand } from './core/application/commands/calculate-position-sizes.command';
export { PositionSizeCalculationsResult } from './core/application/results/position-size-calculations.result';
export { CalculatePositionSizesUseCase } from './core/application/use-cases/calculate-position-sizes.use-case';

// Core - Domain Layer
export {
  MissingPositionConfigurationError,
  InvalidStoplossPercentError,
  InvalidCurrentSizeError,
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

// Core - Infrastructure
export { WalletInfoMockService } from './core/infrastructure/wallet-info-mock.service';

// Discord handlers
export { PositionSizeCommandHandler, type PositionSizeOptions } from './discord/commands/position-size.command';

// Feature
export { PositionSizeFeature } from './position-size.feature';

// UI components
export {
  buildPositionSizeRecommendationsEmbed,
  buildPositionSizeSettingsFallbackEmbed,
  type PositionSizeRecommendationsEmbedParams,
  type PositionSizeSettingsFallbackEmbedParams,
} from './ui/position-size-recommendations.embed';
