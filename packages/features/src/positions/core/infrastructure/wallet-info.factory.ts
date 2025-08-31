import type { IWalletInfoService } from '../../../shared/application';
import { WalletInfoMockService } from './implementations/wallet-info-mock.service';

/**
 * Configuration for wallet info service
 */
export interface WalletInfoConfig {
  mode: 'mock' | 'production';
  // Add future config options here
}

/**
 * Create a wallet info service based on configuration
 * Provides a clean way to switch between mock and production implementations
 */
export function createWalletInfoService(config: WalletInfoConfig): IWalletInfoService {
  switch (config.mode) {
    case 'mock':
      return new WalletInfoMockService();
    case 'production':
      // TODO: Implement production wallet info service
      throw new Error('Production wallet info service not yet implemented');
    default:
      throw new Error(`Unknown wallet info service mode: ${config.mode}`);
  }
}

/**
 * Create default mock service for development
 */
export function createMockWalletInfoService(): IWalletInfoService {
  return new WalletInfoMockService();
}
