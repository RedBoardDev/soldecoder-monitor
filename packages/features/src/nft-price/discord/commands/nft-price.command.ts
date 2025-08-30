import type { INftDataService } from '@shared';
import type { ChatInputCommandInteraction } from 'discord.js';
import { buildNftPriceEmbed, buildNftPriceErrorEmbed } from '../ui/nft-price.embed';

export class NftPriceCommandHandler {
  constructor(private readonly nftDataService: INftDataService) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const nftData = await this.nftDataService.getNftData('sol-decoder');

      if (nftData) {
        const cacheInfo = this.nftDataService.getCacheInfo('sol-decoder');
        const lastUpdated = cacheInfo?.lastUpdated || new Date().toISOString();
        const embed = buildNftPriceEmbed(nftData, lastUpdated);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const errorEmbed = buildNftPriceErrorEmbed('sol-decoder');
        await interaction.editReply({ embeds: [errorEmbed] });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : undefined;
      const errorEmbed = buildNftPriceErrorEmbed('sol-decoder', errorMessage);
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
}
