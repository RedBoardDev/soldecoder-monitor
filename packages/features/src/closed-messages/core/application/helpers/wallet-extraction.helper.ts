import type { SolanaAdapter } from '@shared/infrastructure/solana.adapter';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ClosedMessageData } from '../../domain/types/closed-message.types';

const logger = createFeatureLogger('wallet-extraction-helper');

/**
 * Helper for extracting wallet address from closed message data
 *
 * Uses position hashes (Metlex transaction signatures) to get wallet address
 */
export async function extractWalletFromPositionHash(
  solanaAdapter: SolanaAdapter,
  messageData: ClosedMessageData,
  context: { messageId: string; channelId: string },
): Promise<string> {
  const firstPositionHash = messageData.positionHashes[0];

  try {
    const walletAddress = await solanaAdapter.getTransactionSigner(firstPositionHash);
    return walletAddress;
  } catch (error) {
    logger.error('Failed to extract wallet address from position hash', error as Error, {
      messageId: context.messageId,
      positionHash: firstPositionHash,
    });

    throw new Error(
      `Failed to get wallet address from position hash: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
