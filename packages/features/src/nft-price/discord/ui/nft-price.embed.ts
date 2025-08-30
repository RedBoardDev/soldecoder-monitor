import type { NftCollection } from '@shared';
import { EmbedBuilder } from 'discord.js';

/**
 * Builds successful NFT price embed with market data
 */
export const buildNftPriceEmbed = (nftData: NftCollection, lastUpdated: string): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setTitle(`📊 ${nftData.name}`)
    .setColor(0x5865f2)
    .setThumbnail(nftData.image.small_2x)
    .setTimestamp(new Date(lastUpdated));

  // Floor Price Section
  const floorPrice = nftData.floor_price.native_currency;
  const floorPriceUsd = nftData.floor_price.usd;
  const currency = nftData.native_currency_symbol.toUpperCase();

  embed.addFields({
    name: '💰 Floor Price',
    value: [`**${formatPrice(floorPrice)} ${currency}**`, `($${formatUsdPrice(floorPriceUsd)} USD)`].join('\n'),
    inline: true,
  });

  // Market Stats Section
  const volume24h = nftData.volume_24h.native_currency;
  const sales24h = nftData.one_day_sales;
  const change24h = nftData.floor_price_24h_percentage_change.native_currency;
  const change24hFormatted = formatPercentageChange(change24h);

  embed.addFields({
    name: '📈 Market Stats',
    value: [
      `**Volume 24h:** ${formatPrice(volume24h)} ${currency}`,
      `**Sales 24h:** ${sales24h}`,
      `**24h Change:** ${change24hFormatted}`,
    ].join('\n'),
    inline: true,
  });

  // Links Section (if available)
  if (nftData.links) {
    const links = buildLinksArray(nftData.links);
    if (links.length > 0) {
      embed.addFields({
        name: '🔗 Links',
        value: links.join(' • '),
        inline: false,
      });
    }
  }

  // Footer with update time
  const updateTime = formatUpdateTime(lastUpdated);
  embed.setFooter({
    text: `Data from CoinGecko • Last updated: ${updateTime} UTC`,
  });

  return embed;
};

/**
 * Builds error embed when NFT data cannot be retrieved
 */
export const buildNftPriceErrorEmbed = (collectionId: string, errorMessage?: string): EmbedBuilder => {
  return new EmbedBuilder()
    .setTitle('❌ NFT Data Unavailable')
    .setDescription(`Could not fetch NFT data for collection "${collectionId}".`)
    .addFields({
      name: '🔍 Possible Causes',
      value: [
        '• Collection ID not found on CoinGecko',
        '• API temporarily unavailable',
        '• Network connection issues',
        errorMessage ? `• ${errorMessage}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      inline: false,
    })
    .setColor(0xff0000)
    .setTimestamp()
    .setFooter({ text: 'Try again in a few moments' });
};

// HELPERS FUNCTIONS

const formatPrice = (price: number): string => {
  if (price >= 1) {
    return price.toFixed(2);
  }
  return price.toFixed(4);
};

const formatUsdPrice = (price: number): string => {
  return price.toFixed(2);
};

const formatPercentageChange = (change: number): string => {
  const formatted = Math.abs(change).toFixed(2);
  if (change >= 0) {
    return `+${formatted}% 📈`;
  }
  return `-${formatted}% 📉`;
};

const buildLinksArray = (links: NonNullable<NftCollection['links']>): string[] => {
  const linkArray: string[] = [];

  if (links.homepage) {
    linkArray.push(`[Website](${links.homepage})`);
  }
  if (links.twitter) {
    linkArray.push(`[Twitter](${links.twitter})`);
  }
  if (links.discord) {
    linkArray.push(`[Discord](${links.discord})`);
  }

  return linkArray;
};

const formatUpdateTime = (lastUpdated: string): string => {
  return new Date(lastUpdated).toLocaleString('en-US', {
    timeZone: 'UTC',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
