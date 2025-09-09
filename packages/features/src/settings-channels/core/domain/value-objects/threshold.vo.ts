import type { ThresholdType } from '@soldecoder-monitor/data';

export class ThresholdVO {
  constructor(public readonly value: ThresholdType) {
    this.validate();
  }

  private validate(): void {
    if (typeof this.value === 'number' && (this.value < 0 || this.value > 100)) {
      throw new Error('Numeric threshold must be between 0 and 100');
    }
  }

  get isNumeric(): boolean {
    return typeof this.value === 'number';
  }

  get isTriggerBased(): boolean {
    return typeof this.value === 'string';
  }

  public isDisabled(): boolean {
    return this.value === null;
  }

  public getEmoji(): string {
    if (this.value === null) {
      return '❌';
    }

    if (typeof this.value === 'number') {
      return '📊';
    }

    switch (this.value) {
      case 'TP':
        return '🎯';
      case 'SL':
        return '🛑';
      case 'TP/SL':
        return '🎯🛑';
      default:
        return '❓';
    }
  }

  public getDisplayText(): string {
    if (this.value === null) {
      return 'Not set';
    }

    if (typeof this.value === 'number') {
      return `±${this.value}%`;
    }

    switch (this.value) {
      case 'TP':
        return 'Take Profit only';
      case 'SL':
        return 'Stop Loss only';
      case 'TP/SL':
        return 'TP & SL only';
      default:
        return 'Unknown';
    }
  }

  public getDescription(): string {
    if (this.value === null) {
      return 'No threshold configured - all position changes trigger alerts';
    }

    if (typeof this.value === 'number') {
      return `Alerts trigger when position changes by ±${this.value}% or more`;
    }

    switch (this.value) {
      case 'TP':
        return 'Alerts only trigger for Take Profit messages';
      case 'SL':
        return 'Alerts only trigger for Stop Loss messages';
      case 'TP/SL':
        return 'Alerts only trigger for Take Profit and Stop Loss messages';
      default:
        return 'Unknown threshold configuration';
    }
  }

  static fromString(input: string): { success: true; threshold: ThresholdVO } | { success: false; error: string } {
    const trimmed = input.trim().toUpperCase();

    if (trimmed === 'TP') {
      return { success: true, threshold: new ThresholdVO('TP') };
    }
    if (trimmed === 'SL') {
      return { success: true, threshold: new ThresholdVO('SL') };
    }
    if (trimmed === 'TP/SL' || trimmed === 'TPSL') {
      return { success: true, threshold: new ThresholdVO('TP/SL') };
    }
    if (trimmed === 'NULL' || trimmed === 'NONE' || trimmed === '') {
      return { success: true, threshold: new ThresholdVO(null) };
    }

    const num = Number.parseFloat(trimmed);
    if (Number.isNaN(num)) {
      return {
        success: false,
        error: 'Please enter a valid number or one of: TP, SL, TP/SL, NONE',
      };
    }

    if (num < 0 || num > 100) {
      return {
        success: false,
        error: 'Numeric threshold must be between 0 and 100%',
      };
    }

    const rounded = Math.round(num * 100) / 100;
    return { success: true, threshold: new ThresholdVO(rounded) };
  }

  static none(): ThresholdVO {
    return new ThresholdVO(null);
  }

  static numeric(value: number): ThresholdVO {
    return new ThresholdVO(value);
  }

  static takeProfit(): ThresholdVO {
    return new ThresholdVO('TP');
  }

  static stopLoss(): ThresholdVO {
    return new ThresholdVO('SL');
  }

  static takeProfitAndStopLoss(): ThresholdVO {
    return new ThresholdVO('TP/SL');
  }
}
