import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export function buildThresholdModal(channelId: string, currentThreshold: number | null): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(`settings-channels:threshold:submit:${channelId}`)
    .setTitle('Set Alert Threshold Percentage');

  const thresholdInput = new TextInputBuilder()
    .setCustomId('threshold_value')
    .setLabel('Threshold (±%)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter threshold percentage (e.g., 0.1 for 0.1%)')
    .setMinLength(1)
    .setMaxLength(6)
    .setRequired(true);

  // Set current value if exists
  if (currentThreshold !== null && currentThreshold !== undefined) {
    thresholdInput.setValue(currentThreshold.toString());
  }

  const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(thresholdInput);
  modal.addComponents(actionRow);

  return modal;
}

export interface ThresholdValidationResult {
  isValid: boolean;
  value?: number;
  error?: string;
}

export function validateThreshold(input: string): ThresholdValidationResult {
  const trimmed = input.trim();

  const num = Number.parseFloat(trimmed);
  if (Number.isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (num < 0 || num > 100) {
    return { isValid: false, error: 'Threshold must be between 0 and 100%' };
  }

  // Round to 2 decimal places
  const rounded = Math.round(num * 100) / 100;

  return { isValid: true, value: rounded };
}
