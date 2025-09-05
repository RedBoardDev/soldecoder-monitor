import path from 'node:path';
import { createCanvas, GlobalFonts, loadImage, type CanvasRenderingContext2D } from '@napi-rs/canvas';
import type { ClosedPosition } from 'closed-messages/core';
import type { TriggerData } from '../../core/domain/types/trigger.types';
import { formatValue, selectBackgroundPNLCard } from '../helpers/select-background-image';

GlobalFonts.registerFromPath(path.resolve(__dirname, '../../assets/fonts/VarelaRound-Regular.ttf'), 'Varela Round');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ValueFormat {
  sign: string;
  color: string;
}

export interface TextStyle {
  font: string;
  fillStyle: string;
  glowColor?: string;
  glowBlur?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface LayoutConfig {
  width: number;
  height: number;
  margin: number;
  lineGap: number;
}

export interface TextElement {
  text: string;
  style: TextStyle;
  position?: Position;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_LAYOUT: LayoutConfig = {
  width: 1536,
  height: 1024,
  margin: 50,
  lineGap: 100,
};

const STYLES = {
  pair: {
    token: {
      font: 'bold 72px "Varela Round"',
      fillStyle: '#f8f8f8',
      glowColor: '#ffd700',
      glowBlur: 10,
    },
    separator: {
      font: 'bold 72px "Varela Round"',
      fillStyle: '#ffd700',
      glowColor: '#f8f8f8',
      glowBlur: 20,
    },
  },
  profit: {
    main: {
      font: 'bold 72px "Varela Round"',
      glowBlur: 30,
    },
    secondary: {
      font: 'bold 72px "Varela Round"',
      fillStyle: '#f8f8f8',
      glowColor: '#ffd700',
      glowBlur: 10,
    },
  },
  time: {
    number: {
      font: 'bold 48px "Varela Round"',
      fillStyle: '#f8f8f8',
      glowColor: '#ffff00',
      glowBlur: 10,
    },
    unit: {
      font: 'bold 48px "Varela Round"',
      fillStyle: '#ffd700',
      glowColor: '#ffd700',
      glowBlur: 20,
    },
  },
  metrics: {
    label: {
      font: 'bold 48px "Varela Round"',
      fillStyle: '#ffd700',
      glowColor: '#ffd700',
      glowBlur: 10,
    },
    value: {
      font: 'bold 48px "Varela Round"',
      fillStyle: '#f8f8f8',
      glowColor: '#ffd700',
      glowBlur: 10,
    },
    pnlValue: {
      font: 'bold 48px "Varela Round"',
      glowBlur: 20,
    },
  },
};

// ============================================================================
// CANVAS UTILITIES
// ============================================================================

class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private layout: LayoutConfig;

  constructor(ctx: CanvasRenderingContext2D, layout: LayoutConfig = DEFAULT_LAYOUT) {
    this.ctx = ctx;
    this.layout = layout;
    this.ctx.textBaseline = 'middle';
  }

  setGlow(color: string, blur: number): void {
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = blur;
  }

  clearGlow(): void {
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }

  applyStyle(style: TextStyle): void {
    this.ctx.font = style.font;
    this.ctx.fillStyle = style.fillStyle;
    if (style.glowColor && style.glowBlur) {
      this.setGlow(style.glowColor, style.glowBlur);
    }
  }

  measureText(text: string, style: TextStyle): number {
    const prevFont = this.ctx.font;
    this.ctx.font = style.font;
    const width = this.ctx.measureText(text).width;
    this.ctx.font = prevFont;
    return width;
  }

  drawText(text: string, x: number, y: number, style: TextStyle): void {
    this.applyStyle(style);
    this.ctx.textAlign = 'left';
    this.ctx.fillText(text, x, y);
  }

  drawTextGroup(elements: TextElement[], startX: number, y: number): void {
    let currentX = startX;
    for (const element of elements) {
      this.drawText(element.text, currentX, y, element.style);
      currentX += this.measureText(element.text, element.style);
    }
  }

  drawTextRightAligned(elements: TextElement[], endX: number, y: number): void {
    const totalWidth = elements.reduce((sum, el) => sum + this.measureText(el.text, el.style), 0);
    this.drawTextGroup(elements, endX - totalWidth, y);
  }
}

// ============================================================================
// FORMATTERS
// ============================================================================

export function formatDisplayValue(value: number): ValueFormat {
  if (value > 0) return { sign: '+', color: '#66ff66' };
  if (value < 0) return { sign: '-', color: '#ff7878' };
  return { sign: '', color: '#ffd700' };
}

function formatDuration(hours: number): { num1: string; unit1: string; num2: string; unit2: string } {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return {
    num1: `${h}`,
    unit1: 'h',
    num2: `${m.toString().padStart(2, '0')}`,
    unit2: 'mn',
  };
}

// ============================================================================
// COMPONENT BUILDERS
// ============================================================================

class PositionCardBuilder {
  private renderer: CanvasRenderer;
  private layout: LayoutConfig;

  constructor(renderer: CanvasRenderer, layout: LayoutConfig) {
    this.renderer = renderer;
    this.layout = layout;
  }

  private getRightX(): number {
    return this.layout.width - this.layout.margin;
  }

  private getCenterY(): number {
    // Position centrale pour les éléments principaux
    return this.layout.height / 2 - this.layout.lineGap;
  }

  private getBottomY(): number {
    return this.layout.height - this.layout.margin - this.layout.lineGap;
  }

  drawTokenPair(token0: string, token1: string): void {
    const y = this.getCenterY();
    const elements: TextElement[] = [
      { text: token0, style: STYLES.pair.token },
      { text: '/', style: STYLES.pair.separator },
      { text: token1, style: { ...STYLES.pair.token, glowBlur: 20 } },
    ];
    this.renderer.drawTextRightAligned(elements, this.getRightX(), y);
  }

  drawProfit(pnlUSD: number, pnlSOL: number): void {
    const y = this.getCenterY() + this.layout.lineGap;
    const usdFmt = formatDisplayValue(pnlUSD);
    const solFmt = formatDisplayValue(pnlSOL);

    const profitUsdText = `${usdFmt.sign}${Math.abs(pnlUSD).toFixed(2)}`;
    const profitSolText = pnlSOL !== 0 ? ` (${solFmt.sign}${Math.abs(pnlSOL).toFixed(2)} SOL)` : '';

    const elements: TextElement[] = [
      {
        text: profitUsdText,
        style: { ...STYLES.profit.main, fillStyle: usdFmt.color, glowColor: usdFmt.color },
      },
    ];

    if (profitSolText) {
      elements.push({ text: profitSolText, style: STYLES.profit.secondary });
    }

    this.renderer.drawTextRightAligned(elements, this.getRightX(), y);
  }

  drawElapsedTime(hours: number): void {
    const y = this.getCenterY() + this.layout.lineGap * 2;
    const time = formatDuration(hours);

    const elements: TextElement[] = [
      { text: time.num1, style: STYLES.time.number },
      { text: time.unit1, style: STYLES.time.unit },
      { text: time.num2, style: STYLES.time.number },
      { text: time.unit2, style: STYLES.time.unit },
    ];

    this.renderer.drawTextRightAligned(elements, this.getRightX(), y);
  }

  drawPNL(pnlPercentage: number): void {
    const y = this.getBottomY() + this.layout.lineGap * 0.2;
    const pctFmt = formatDisplayValue(pnlPercentage);
    const pnlValueText = `${pctFmt.sign}${Math.abs(pnlPercentage).toFixed(2)}%`;

    const elements: TextElement[] = [
      { text: 'PNL: ', style: STYLES.metrics.label },
      {
        text: pnlValueText,
        style: { ...STYLES.metrics.pnlValue, fillStyle: pctFmt.color, glowColor: pctFmt.color },
      },
    ];

    this.renderer.drawTextRightAligned(elements, this.getRightX(), y);
  }

  drawTVL(tvlSOL: number, tvlUSD: number): void {
    const y = this.getBottomY() + this.layout.lineGap;
    const tvlText = `${tvlSOL.toFixed(2)} SOL ($${tvlUSD.toFixed(0)})`;

    const elements: TextElement[] = [
      { text: 'TVL: ', style: STYLES.metrics.label },
      { text: tvlText, style: STYLES.metrics.value },
    ];

    this.renderer.drawTextRightAligned(elements, this.getRightX(), y);
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function buildPositionImage(
  closedPosition: ClosedPosition,
  triggerData?: TriggerData,
  layoutConfig: LayoutConfig = DEFAULT_LAYOUT,
): Promise<Buffer> {
  const {
    tokenName0,
    tokenName1,
    pnlPercentageSol: pnlPercentage,
    netResult,
    positionTVL,
    durationHours,
  } = closedPosition;

  // Create canvas
  const canvas = createCanvas(layoutConfig.width, layoutConfig.height);
  const ctx = canvas.getContext('2d');

  // Draw background
  const bg = await loadImage(selectBackgroundPNLCard(pnlPercentage, triggerData?.type));
  ctx.drawImage(bg, 0, 0, layoutConfig.width, layoutConfig.height);

  // Initialize renderer and builder
  const renderer = new CanvasRenderer(ctx, layoutConfig);
  const builder = new PositionCardBuilder(renderer, layoutConfig);

  // Draw all components
  builder.drawTokenPair(tokenName0, tokenName1);
  builder.drawProfit(netResult.usd, netResult.sol);
  builder.drawElapsedTime(durationHours);
  builder.drawPNL(pnlPercentage);
  builder.drawTVL(positionTVL.sol, positionTVL.usd);

  return canvas.encode('png');
}