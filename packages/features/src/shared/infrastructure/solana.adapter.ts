import { time } from '@shared/domain';
import {
  Connection,
  type ParsedInstruction,
  type ParsedTransactionWithMeta,
  type PartiallyDecodedInstruction,
  PublicKey,
} from '@solana/web3.js';
import { config } from '@soldecoder-monitor/config-env';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import { RateLimiterService } from './rate-limiter.service';

const logger = createFeatureLogger('solana-adapter');

type SolanaInstruction = ParsedInstruction | PartiallyDecodedInstruction;

const RELEVANT_INSTRUCTIONS = ['OpenPosition', 'RemoveLiquidityByRange2', 'ClosePositionIfEmpty'];

/**
 * Solana Web3 adapter - Shared infrastructure implementation
 * Single instance to avoid RPC rate limits
 * Based on test/solanaweb3.service.ts with added rate limiting
 */
export class SolanaAdapter {
  private static instance: SolanaAdapter;
  private readonly connection: Connection;
  private readonly programPublicKey: PublicKey;
  private readonly rateLimiter: RateLimiterService;

  private constructor(connection?: Connection, programId?: string) {
    this.connection = connection ?? new Connection(config.solana.rpcEndpoint, 'finalized');
    this.programPublicKey = programId ? new PublicKey(programId) : new PublicKey(config.solana.programId);

    // Rate limiter for Helius free tier (conservative limits)
    // Free tier: ~10 RPS, ~600 RPM based on standard Solana RPC limits
    this.rateLimiter = new RateLimiterService(
      {
        name: 'solana-rpc',
        maxRequests: 10, // 10 requests per second
        windowMs: time.seconds(1),
        maxQueueSize: 100, // Allow queuing up to 100 requests
        taskTimeout: time.seconds(30), // 30s timeout per request
        fifo: true,
      },
      logger,
    );
  }

  public static getInstance(): SolanaAdapter {
    if (!SolanaAdapter.instance) {
      SolanaAdapter.instance = new SolanaAdapter();
    }
    return SolanaAdapter.instance;
  }

  /**
   * Gets the wallet address (signer) from a transaction signature
   * Rate limited to respect Helius free tier limits
   */
  async getTransactionSigner(txSignature: string): Promise<string> {
    return this.rateLimiter.enqueue(
      async () => {
        try {
          const tx = await this.fetchParsedTransaction(txSignature);

          if (tx.meta?.err) {
            throw new Error(`Transaction ${txSignature} failed: ${JSON.stringify(tx.meta.err)}`);
          }

          if (!tx.transaction.message.accountKeys || tx.transaction.message.accountKeys.length === 0) {
            throw new Error(`No account keys found in transaction ${txSignature}`);
          }

          const signer = tx.transaction.message.accountKeys[0];
          if (!signer?.pubkey) {
            throw new Error(`Invalid signer found in transaction ${txSignature}`);
          }

          return signer.pubkey.toString();
        } catch (error) {
          logger.error('Failed to get transaction signer', error as Error, { txSignature });
          throw error;
        }
      },
      {
        taskId: `get-signer-${txSignature}`,
        timeout: time.seconds(20),
      },
    );
  }

  /**
   * Gets the main position address from a transaction signature
   * Rate limited to respect Helius free tier limits
   */
  async getMainPosition(txSignature: string): Promise<string> {
    return this.rateLimiter.enqueue(
      async () => {
        try {
          const tx = await this.fetchParsedTransaction(txSignature);

          if (tx.meta?.err) {
            throw new Error(`Transaction ${txSignature} failed: ${JSON.stringify(tx.meta.err)}`);
          }

          const allInstrs = this.collectAllInstructions(tx);
          const meteoraInstrs = this.filterByProgram(allInstrs);
          const typed = this.typeInstructions(meteoraInstrs, tx.meta?.logMessages ?? []);
          const chosen = this.selectInstruction(typed);

          return this.extractFirstAccount(chosen.instr);
        } catch (error) {
          logger.error('Failed to get main position', error as Error, { txSignature });
          throw error;
        }
      },
      {
        taskId: `get-position-${txSignature}`,
        timeout: time.seconds(20),
      },
    );
  }

  /**
   * Gets rate limiter statistics
   */
  getStats() {
    return this.rateLimiter.getStats();
  }

  /**
   * Stops the rate limiter (for graceful shutdown)
   */
  async stop(): Promise<void> {
    await this.rateLimiter.stop();
  }

  private async fetchParsedTransaction(txSignature: string): Promise<ParsedTransactionWithMeta> {
    const tx = await this.connection.getParsedTransaction(txSignature, {
      commitment: 'finalized',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      throw new Error(`Transaction ${txSignature} not found`);
    }

    return tx;
  }

  private collectAllInstructions(tx: ParsedTransactionWithMeta): SolanaInstruction[] {
    const instructions: SolanaInstruction[] = [];

    // Add main instructions
    if (tx.transaction?.message?.instructions) {
      instructions.push(...tx.transaction.message.instructions);
    }

    // Add inner instructions
    if (tx.meta?.innerInstructions) {
      for (const innerInstr of tx.meta.innerInstructions) {
        instructions.push(...innerInstr.instructions);
      }
    }

    return instructions;
  }

  private filterByProgram(instructions: SolanaInstruction[]): SolanaInstruction[] {
    return instructions.filter((instr) => {
      const programId = 'programId' in instr ? instr.programId : null;
      return programId?.equals(this.programPublicKey) ?? false;
    });
  }

  private typeInstructions(
    instructions: SolanaInstruction[],
    logMessages: string[],
  ): Array<{ instr: SolanaInstruction; type: string }> {
    return instructions.map((instr) => ({
      instr,
      type: this.getInstructionType(logMessages),
    }));
  }

  private getInstructionType(logMessages: string[]): string {
    // Simple heuristic: look for instruction type in logs
    for (const relevantType of RELEVANT_INSTRUCTIONS) {
      if (logMessages.some((log) => log.includes(relevantType))) {
        return relevantType;
      }
    }
    return 'Unknown';
  }

  private selectInstruction(typedInstructions: Array<{ instr: SolanaInstruction; type: string }>): {
    instr: SolanaInstruction;
    type: string;
  } {
    // Prefer ClosePositionIfEmpty, then RemoveLiquidityByRange2, then others
    const priorities = ['ClosePositionIfEmpty', 'RemoveLiquidityByRange2', 'OpenPosition'];

    for (const priority of priorities) {
      const found = typedInstructions.find((ti) => ti.type === priority);
      if (found) return found;
    }

    // Fallback to first instruction
    if (typedInstructions.length > 0) {
      return typedInstructions[0];
    }

    throw new Error('No valid instructions found');
  }

  private extractFirstAccount(instr: SolanaInstruction): string {
    if ('accounts' in instr && instr.accounts && instr.accounts.length > 0) {
      return instr.accounts[0].toString();
    }

    throw new Error('No accounts found in instruction');
  }
}
