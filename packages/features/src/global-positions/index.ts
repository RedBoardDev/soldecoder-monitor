// Global Positions feature public API

// Core - Application Layer
export { GetGlobalPositionsCommand } from './core/application/commands/get-global-positions.command';
export { parsePositionStatusMessage } from './core/application/helpers/position-parser.helper';
export { GlobalPositionsResult } from './core/application/results/global-positions.result';
export { GetGlobalPositionsUseCase } from './core/application/use-cases/get-global-positions.use-case';

// Core - Domain Layer
export {
  ChannelFetchError,
  InvalidWalletAddressError,
  MessageParseError,
  NoConfiguredChannelsError,
} from './core/domain/global-positions.errors';
// Types
export {
  type GlobalPositionsEmbedParams,
  type GlobalPositionsOptions,
  globalPositionsOptionsSchema,
  type PositionStatusData,
  PositionStatusSchema,
} from './core/domain/types/global-positions.types';
export { PositionStatus } from './core/domain/value-objects/position-status.vo';
export { PositionSummary } from './core/domain/value-objects/position-summary.vo';

// Discord handlers
export { GlobalPositionsCommandHandler } from './discord/commands/global-positions.command';

// UI components
export { buildGlobalPositionsEmbed } from './discord/ui/global-positions.embed';

// Feature
export { GlobalPositionsFeature } from './global-positions.feature';
