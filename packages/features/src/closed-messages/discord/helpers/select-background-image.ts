import path from 'node:path';

const ASSET_PATH = path.resolve(__dirname, '../../assets/');

enum Background {
  Default = 'background_default.png',
  Happy = 'background_happy.png',
  Sad = 'background_sad.png',
  Trump = 'background_trump.png',
  summary = 'background_summary.png',
}

function getBackgroundPath(fileName: string): string {
  return path.join(ASSET_PATH, fileName);
}

function shouldUseTrumpBackground(): boolean {
  const TRUMP_CHANCE = 0.1;
  return Math.random() < TRUMP_CHANCE;
}

export function selectBackgroundPNLCard(pct: number, triggerType?: 'take_profit' | 'stop_loss'): string {
  // Force specific backgrounds for triggered events
  if (triggerType === 'take_profit') {
    return getBackgroundPath(Background.Happy);
  }

  if (triggerType === 'stop_loss') {
    return getBackgroundPath(Background.Sad);
  }

  if (pct === 0) {
    return getBackgroundPath(Background.Default);
  }

  const isGain = pct > 0;
  if (isGain && shouldUseTrumpBackground()) {
    return getBackgroundPath(Background.Trump);
  }

  if (pct < 0) {
    return getBackgroundPath(Background.Sad);
  }

  return getBackgroundPath(Background.Default);
}

export function selectBackgroundSummary(): string {
  return getBackgroundPath(Background.summary);
}

export interface ValueFormat {
  /** "+" | "-" | "" */
  sign: string;
  /** hex color code */
  color: string;
}

export function formatValue(value: number): ValueFormat {
  if (value > 0) return { sign: '+', color: '#66ff66' };
  if (value < 0) return { sign: '-', color: '#ff6666' };
  return { sign: '', color: '#ffd700' };
}
