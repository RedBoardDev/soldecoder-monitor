import { SolanaAdapter } from '@shared/infrastructure/solana.adapter';
import { z } from 'zod';
import {
  type ClosedMessageData,
  ClosedMessageDataSchema,
  type MetlexLink,
} from '../../domain/types/closed-message.types';

function extractMetlexLinks(content: string): MetlexLink[] {
  const regex = /https?:\/\/metlex\.io\/pnl2\/([A-Za-z0-9-]+)/g;
  const links: MetlexLink[] = [];
  let match: RegExpExecArray | null;

  match = regex.exec(content);
  while (match !== null) {
    links.push({ url: match[0], hash: match[1] });
    match = regex.exec(content);
  }

  return links;
}

function extractWalletPrefix(content: string): string | null {
  const walletMatch = content.match(/\(([A-Za-z0-9]+)\.\.\.[A-Za-z0-9]+\)/);
  return walletMatch ? walletMatch[1] : null;
}

async function parseClosedMessage(
  content: string,
): Promise<z.SafeParseReturnType<ClosedMessageData, ClosedMessageData>> {
  try {
    const links = extractMetlexLinks(content);
    if (links.length === 0) {
      return {
        success: false,
        error: z.ZodError.create([
          {
            code: z.ZodIssueCode.custom,
            message: 'No Metlex PnL links found in closed message',
            path: [],
          },
        ]),
      };
    }

    const walletPrefix = extractWalletPrefix(content);
    if (!walletPrefix) {
      return {
        success: false,
        error: z.ZodError.create([
          {
            code: z.ZodIssueCode.custom,
            message: 'No wallet prefix found in "(xxx…yyy)" format',
            path: [],
          },
        ]),
      };
    }

    // Get position addresses from signatures using SolanaAdapter
    const solanaAdapter = SolanaAdapter.getInstance();
    const positionAddresses: string[] = [];
    for (const link of links) {
      try {
        const positionAddress = await solanaAdapter.getMainPosition(link.hash);
        positionAddresses.push(positionAddress);
      } catch (error) {
        return {
          success: false,
          error: z.ZodError.create([
            {
              code: z.ZodIssueCode.custom,
              message: `Failed to get position address for hash ${link.hash}: ${error instanceof Error ? error.message : String(error)}`,
              path: [],
            },
          ]),
        };
      }
    }

    const parsedData = {
      walletPrefix,
      positionHashes: links.map((l) => l.hash),
      positionAddresses,
      links,
    };

    return ClosedMessageDataSchema.safeParse(parsedData);
  } catch (error) {
    return {
      success: false,
      error: z.ZodError.create([
        {
          code: z.ZodIssueCode.custom,
          message: `Failed to parse closed message: ${error instanceof Error ? error.message : String(error)}`,
          path: [],
        },
      ]),
    };
  }
}

export async function parseClosedMessageSafe(content: string): Promise<ClosedMessageData | null> {
  const result = await parseClosedMessage(content);
  return result.success ? result.data : null;
}
