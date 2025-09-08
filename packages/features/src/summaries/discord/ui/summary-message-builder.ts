import path from 'node:path';
import { AttachmentBuilder, type EmbedBuilder } from 'discord.js';
import { formatPeriodForDisplay } from '../../core/application/helpers/period-formatter.helper';
import { mapSummaryToDiscordUI, mapSummaryToImageData } from '../../core/application/mappers/summary-discord.mapper';
import type { SummaryType } from '../../core/domain/types/summary.types';
import type { SummaryData } from '../../core/domain/types/summary-data.types';
import { createSummaryEmbed } from './summary.embed';
import { buildSummaryImage } from './summary-image-generation';

const ASSET_PATH = path.resolve(__dirname, '../../assets/summary_card');

export async function buildSummaryMessage(
  summaryData: SummaryData,
  summaryType: SummaryType,
): Promise<{ embed: EmbedBuilder; attachment: AttachmentBuilder }> {
  const period = formatPeriodForDisplay(summaryType);

  const uiData = mapSummaryToDiscordUI(summaryData, period);
  const imageData = mapSummaryToImageData(summaryData, period);

  const backgroundImagePath = path.join(ASSET_PATH, 'test1.png');

  const imageBuffer = await buildSummaryImage(imageData, backgroundImagePath);
  const fileName = `summary-${summaryType}.png`;

  const attachment = new AttachmentBuilder(imageBuffer, { name: fileName });

  const embed = createSummaryEmbed(uiData, summaryType);
  embed.setImage(`attachment://${fileName}`);

  return { embed, attachment };
}
