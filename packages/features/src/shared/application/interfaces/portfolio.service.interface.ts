// import type { WalletInfo, WalletPosition } from '@schemas/lpagent.schema';

import type { WalletAddress } from 'shared/domain';

export interface IPortfolioService {
  /** Get SOL balance for the configured wallet */
  getSolBalance(wallet: WalletAddress): Promise<number>;

  /** Get all opening positions from Meteora */
  getPositions(wallet: WalletAddress): Promise<WalletPosition[]>;

  /** Calculate total net worth including SOL + positions value + fees */
  getTotalNetWorth(wallet: WalletAddress): Promise<number>;
}
