import { CoinGeckoAdapter, time } from '@shared';
import {
  Ephemeral,
  Feature,
  type FeatureContext,
  FeatureDecorator,
  RateLimit,
  SlashCommand,
} from '@soldecoder-monitor/features-sdk';
import type { ChatInputCommandInteraction } from 'discord.js';
import { NftPriceCommandHandler } from './discord/commands/nft-price.command';

@FeatureDecorator({
  name: 'nft-price',
  version: '1.0.0',
  description: 'NFT price tracking for Sol Decoder collection',
  category: 'General',
})
export class NftPriceFeature extends Feature {
  private nftPriceHandler!: NftPriceCommandHandler;

  get metadata() {
    return {
      name: 'nft-price',
      version: '1.0.0',
      description: 'NFT price tracking for Sol Decoder collection',
      category: 'General',
    };
  }

  async onLoad(context: FeatureContext): Promise<void> {
    this.setContext(context);

    const coinGeckoAdapter = CoinGeckoAdapter.getInstance();
    this.nftPriceHandler = new NftPriceCommandHandler(coinGeckoAdapter);

    context.logger.info('NFT price feature loaded successfully');
  }

  @SlashCommand({
    name: 'nft-price',
    description: 'Get current market data for Sol Decoder NFT collection',
    docs: {
      category: 'General',
      description: 'Shows real-time market data for Sol Decoder NFT collection',
      usage: '/nft-price',
      examples: ['/nft-price'],
      guildOnly: false,
    },
  })
  @Ephemeral()
  @RateLimit({
    max: 2,
    window: time.minutes(1),
    scope: 'user',
    message: '⏱️ Please wait {timeRemaining} before checking NFT prices again.',
  })
  async handleNftPrice(interaction: ChatInputCommandInteraction): Promise<void> {
    return this.nftPriceHandler.execute(interaction);
  }
}
