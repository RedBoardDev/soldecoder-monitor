import path from 'node:path';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import type { ClosedPosition } from 'closed-messages/core';
import type { TriggerData } from '../../core/domain/types/trigger.types';
import { formatValue, selectBackgroundPNLCard } from '../helpers/select-background-image';

GlobalFonts.registerFromPath(path.resolve(__dirname, '../../assets/fonts/VarelaRound-Regular.ttf'), 'Varela Round');

/**
 * Value formatting for display
 */
export interface ValueFormat {
  sign: string;
  color: string;
}

export function formatDisplayValue(value: number): ValueFormat {
  if (value > 0) return { sign: '+', color: '#66ff66' };
  if (value < 0) return { sign: '-', color: '#ff6666' };
  return { sign: '', color: '#ffd700' };
}

/**
 * Generates position image (placeholder implementation)
 */
export async function buildPositionImage(closedPosition: ClosedPosition, triggerData?: TriggerData): Promise<Buffer> {
  const {
    tokenName0,
    tokenName1,
    pnlPercentageSol: pnlPercentage,
    netResult,
    positionTVL,
    durationHours,
  } = closedPosition;

  // PnL numbers
  const pnlUSD = netResult.usd;
  const pnlSOL = netResult.sol;

  // TVL numbers
  const tvlUSD = positionTVL.usd;
  const tvlSOL = positionTVL.sol;

  // Duration (convert back to hours for display)
  const elapsedHours = durationHours;

  // formatValue shared
  const usdFmt: ValueFormat = formatValue(pnlUSD);
  const solFmt: ValueFormat = formatValue(pnlSOL);
  const pctFmt: ValueFormat = formatValue(pnlPercentage);

  // elapsed time formatting
  const h = Math.floor(elapsedHours);
  const m = Math.round((elapsedHours - h) * 60);
  const elapsedNum1 = `${h}`;
  const elapsedUnit1 = 'h';
  const elapsedNum2 = `${m.toString().padStart(2, '0')}`;
  const elapsedUnit2 = 'mn';

  // texts
  const profitUsdText = `${usdFmt.sign}$${Math.abs(pnlUSD).toFixed(2)}`;
  const profitSolText = pnlSOL !== 0 ? ` (${solFmt.sign}${Math.abs(pnlSOL).toFixed(2)} SOL)` : '';

  // canvas
  const width = 1536;
  const height = 1024;
  const margin = 50;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // background
  const bg = await loadImage(selectBackgroundPNLCard(pnlPercentage, triggerData?.type));
  ctx.drawImage(bg, 0, 0, width, height);

  const x = width - margin;
  const lineGap = 100;
  const topY = margin + lineGap;

  ctx.textBaseline = 'middle';
  function setGlow(color: string, blur: number) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
  }

  // 1) Pair with colored slash
  ctx.font = 'bold 72px "Varela Round"';
  const wLeft = ctx.measureText(tokenName0).width;
  const wSlash = ctx.measureText('/').width;
  const wRight = ctx.measureText(tokenName1).width;
  const fullW = wLeft + wSlash + wRight;
  const startX = x - fullW;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f8f8f8';
  setGlow('#ffd700', 10);
  ctx.fillText(tokenName0, startX, topY);

  ctx.fillStyle = '#ffd700';
  setGlow('#f8f8f8', 20);
  ctx.fillText('/', startX + wLeft, topY);

  ctx.fillStyle = '#f8f8f8';
  setGlow('#ffd700', 20);
  ctx.fillText(tokenName1, startX + wLeft + wSlash, topY);

  // 2) Profit line
  ctx.font = 'bold 72px "Varela Round"';
  ctx.textAlign = 'left';

  const wUsd = ctx.measureText(profitUsdText).width;
  setGlow(usdFmt.color, 30);
  ctx.fillStyle = usdFmt.color;
  ctx.fillText(profitUsdText, x - (wUsd + ctx.measureText(profitSolText).width), topY + lineGap);

  ctx.fillStyle = '#f8f8f8';
  setGlow('#ffd700', 10);
  ctx.fillText(profitSolText, x - ctx.measureText(profitSolText).width, topY + lineGap);

  // 3) Elapsed time
  ctx.font = 'bold 48px "Varela Round"';
  const w1 = ctx.measureText(elapsedNum1).width;
  const u1 = ctx.measureText(elapsedUnit1).width;
  const w2 = ctx.measureText(elapsedNum2).width;
  const u2 = ctx.measureText(elapsedUnit2).width;
  const fullWTime = w1 + u1 + w2 + u2;
  const startXTime = x - fullWTime;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f8f8f8';
  setGlow('#ffff00', 10);
  ctx.fillText(elapsedNum1, startXTime, topY + lineGap * 2);

  setGlow('#ffd700', 20);
  ctx.fillStyle = '#ffd700';
  ctx.fillText(elapsedUnit1, startXTime + w1, topY + lineGap * 2);

  ctx.fillStyle = '#f8f8f8';
  setGlow('#ffd700', 10);
  ctx.fillText(elapsedNum2, startXTime + w1 + u1, topY + lineGap * 2);

  ctx.fillStyle = '#ffd700';
  setGlow('#ffd700', 20);
  ctx.fillText(elapsedUnit2, startXTime + w1 + u1 + w2, topY + lineGap * 2);

  // 4) Bottom metrics
  const bottomY = height - margin - lineGap;
  ctx.font = 'bold 48px "Varela Round"';

  // PNL label + value
  const pnlLabel = 'PNL: ';
  const pnlValueText = `${pctFmt.sign}${Math.abs(pnlPercentage).toFixed(2)}%`;
  const pnlFull = pnlLabel + pnlValueText;
  const wPnlFull = ctx.measureText(pnlFull).width;
  const wPnlLbl = ctx.measureText(pnlLabel).width;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd700';
  setGlow('#ffd700', 10);
  ctx.fillText(pnlLabel, x - wPnlFull, bottomY + lineGap * 0.2);

  ctx.fillStyle = pctFmt.color;
  setGlow(pctFmt.color, 20);
  ctx.fillText(pnlValueText, x - wPnlFull + wPnlLbl, bottomY + lineGap * 0.2);

  // TVL
  const tvlText = `${tvlSOL.toFixed(2)} SOL ($${tvlUSD.toFixed(0)})`;
  const wTvl = ctx.measureText(tvlText).width;
  const wLbl = ctx.measureText('TVL: ').width;
  const startXtv = x - (wLbl + wTvl);

  ctx.textAlign = 'left';
  setGlow('#ffd700', 20);
  ctx.fillStyle = '#ffd700';
  ctx.fillText('TVL: ', startXtv, bottomY + lineGap);

  ctx.fillStyle = '#f8f8f8';
  setGlow('#ffd700', 10);
  ctx.fillText(tvlText, startXtv + wLbl, bottomY + lineGap);

  return canvas.encode('png');
}
