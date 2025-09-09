import path from 'node:path';
import { type CanvasRenderingContext2D, createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import type { SummaryImageData } from '../../core/domain/types/summary-ui.types';

GlobalFonts.registerFromPath(path.resolve(__dirname, '../../assets/fonts/VarelaRound-Regular.ttf'), 'Varela Round');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ValueFormat {
  sign: string;
  color: string;
}

interface TextStyle {
  font: string;
  fillStyle: string;
  glowColor?: string;
  glowBlur?: number;
}

interface Position {
  x: number;
  y: number;
}

interface LayoutConfig {
  width: number;
  height: number;
  margin: number;
  lineGap: number;
}

interface TextElement {
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
  period: {
    label: {
      font: 'bold 67px "Varela Round"',
      fillStyle: '#ffd700',
      glowColor: '#ffd700',
      glowBlur: 15,
    },
    value: {
      font: 'bold 67px "Varela Round"',
      fillStyle: '#f8f8f8',
      glowColor: '#ffd700',
      glowBlur: 10,
    },
  },
  metrics: {
    label: {
      font: 'bold 67px "Varela Round"',
      fillStyle: '#ffd700',
      glowColor: '#ffd700',
      glowBlur: 15,
    },
    value: {
      font: 'bold 67px "Varela Round"',
      fillStyle: '#f8f8f8',
      glowColor: '#ffd700',
      glowBlur: 10,
    },
    pnlValue: {
      font: 'bold 77px "Varela Round"',
      glowBlur: 25,
    },
  },
  winRate: {
    label: {
      font: 'bold 67px "Varela Round"',
      fillStyle: '#ffd700',
      glowColor: '#ffd700',
      glowBlur: 15,
    },
    value: {
      font: 'bold 67px "Varela Round"',
      fillStyle: '#f8f8f8',
      glowColor: '#ffd700',
      glowBlur: 10,
    },
  },
  roi: {
    label: {
      font: 'bold 67px "Varela Round"',
      fillStyle: '#ffd700',
      glowColor: '#ffd700',
      glowBlur: 15,
    },
    value: {
      font: 'bold 67px "Varela Round"',
      glowBlur: 20,
    },
  },
};

// ============================================================================
// CANVAS UTILITIES
// ============================================================================

class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
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

  drawTextLeftAligned(text: string, x: number, y: number, style: TextStyle): void {
    this.applyStyle(style);
    this.ctx.textAlign = 'left';
    this.ctx.fillText(text, x, y);
  }
}

// ============================================================================
// FORMATTERS
// ============================================================================

function formatDisplayValue(value: number): ValueFormat {
  if (value > 0) return { sign: '+', color: '#66ff66' };
  if (value < 0) return { sign: '-', color: '#ff7878' };
  return { sign: '', color: '#ffd700' };
}

function formatWinRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatROI(roi: number): { text: string; color: string } {
  const fmt = formatDisplayValue(roi);
  return {
    text: `${fmt.sign}${Math.abs(roi).toFixed(1)}%`,
    color: fmt.color,
  };
}

// ============================================================================
// COMPONENT BUILDER
// ============================================================================

class SummaryCardBuilder {
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
    return this.layout.height / 2;
  }

  drawPeriod(period: string): void {
    // Troisième ligne alignée à droite, centrée verticalement
    const y = this.getCenterY() + this.layout.lineGap;

    this.renderer.drawTextRightAligned([{ text: period, style: STYLES.period.value }], this.getRightX(), y);
  }

  drawWinRate(rate: number): void {
    // Première ligne centrée verticalement
    const y = this.getCenterY() - this.layout.lineGap;
    const winRateText = formatWinRate(rate);

    const elements: TextElement[] = [
      { text: 'Win Rate: ', style: STYLES.winRate.label },
      { text: winRateText, style: STYLES.winRate.value },
    ];

    this.renderer.drawTextRightAligned(elements, this.getRightX(), y);
  }

  drawROI(roi: number): void {
    // Deuxième ligne centrée verticalement
    const y = this.getCenterY();
    const roiFmt = formatROI(roi);

    const elements: TextElement[] = [
      { text: 'ROI: ', style: STYLES.roi.label },
      {
        text: roiFmt.text,
        style: { ...STYLES.roi.value, fillStyle: roiFmt.color, glowColor: roiFmt.color },
      },
    ];

    this.renderer.drawTextRightAligned(elements, this.getRightX(), y);
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export async function buildSummaryImage(
  summaryData: SummaryImageData,
  backgroundImagePath: string, // Chemin vers ton image de fond avec le guerrier
  layoutConfig: LayoutConfig = DEFAULT_LAYOUT,
): Promise<Buffer> {
  const { period, winRate, roi } = summaryData;

  // Create canvas
  const canvas = createCanvas(layoutConfig.width, layoutConfig.height);
  const ctx = canvas.getContext('2d');

  // Draw background image
  const bg = await loadImage(backgroundImagePath);
  ctx.drawImage(bg, 0, 0, layoutConfig.width, layoutConfig.height);

  // Initialize renderer and builder
  const renderer = new CanvasRenderer(ctx);
  const builder = new SummaryCardBuilder(renderer, layoutConfig);

  // Draw all components
  builder.drawWinRate(winRate);
  builder.drawROI(roi);
  builder.drawPeriod(period);

  return canvas.encode('png');
}
