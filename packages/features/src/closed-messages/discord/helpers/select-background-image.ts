import path from 'node:path';

const ASSET_PATH = path.resolve(__dirname, '../../assets/pnl_card');

// Liste des images disponibles
const PROFIT_IMAGES = [
  'profit-0.jpeg',
  'profit-1.jpeg',
  'profit-2.jpeg',
  'profit-3.jpeg',
  'profit-4.jpeg',
  'profit-6.jpeg',
  'profit-7.jpeg',
  'profit-10.jpeg',
  'profit-11.jpeg',
];

const LOSS_IMAGES = ['loss-0.jpeg', 'loss-1.jpeg', 'loss-2.jpeg', 'loss-3.jpeg', 'loss-4.jpeg'];

function getRandomImage(images: string[]): string {
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
}

export function selectBackgroundPNLCard(pct: number): string {
  const isProfit = pct > 0;
  const folder = isProfit ? 'profit' : 'loss';
  const images = isProfit ? PROFIT_IMAGES : LOSS_IMAGES;

  const selectedImage = getRandomImage(images);
  return path.join(ASSET_PATH, folder, selectedImage);
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
