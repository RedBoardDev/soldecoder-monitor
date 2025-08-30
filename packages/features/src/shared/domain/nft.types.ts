import { z } from 'zod';

/**
 * NFT Links value object schema
 */
export const NftLinksSchema = z
  .object({
    homepage: z.string().url().optional(),
    twitter: z.string().url().optional(),
    discord: z.string().url().optional(),
  })
  .optional();

/**
 * NFT Floor Price value object schema
 */
export const NftFloorPriceSchema = z.object({
  native_currency: z.number(),
  usd: z.number(),
});

/**
 * NFT Floor Price Change value object schema
 */
export const NftFloorPriceChangeSchema = z.object({
  native_currency: z.number(),
});

/**
 * NFT Volume value object schema
 */
export const NftVolumeSchema = z.object({
  native_currency: z.number(),
});

/**
 * NFT Image value object schema
 */
export const NftImageSchema = z.object({
  small: z.string().url(),
  small_2x: z.string().url(),
});

/**
 * NFT Collection entity schema - Core domain model
 */
export const NftCollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: NftImageSchema,
  floor_price: NftFloorPriceSchema,
  floor_price_24h_percentage_change: NftFloorPriceChangeSchema,
  volume_24h: NftVolumeSchema,
  one_day_sales: z.number(),
  native_currency_symbol: z.string(),
  links: NftLinksSchema,
});

// Export domain types
export type NftLinks = z.infer<typeof NftLinksSchema>;
export type NftFloorPrice = z.infer<typeof NftFloorPriceSchema>;
export type NftFloorPriceChange = z.infer<typeof NftFloorPriceChangeSchema>;
export type NftVolume = z.infer<typeof NftVolumeSchema>;
export type NftImage = z.infer<typeof NftImageSchema>;
export type NftCollection = z.infer<typeof NftCollectionSchema>;

/**
 * Domain value objects for NFT business logic
 */
export class CollectionId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Collection ID cannot be empty');
    }
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: CollectionId): boolean {
    return this.value === other.value;
  }
}

export class FloorPrice {
  constructor(
    private readonly nativeCurrency: number,
    private readonly usd: number,
  ) {
    if (nativeCurrency < 0 || usd < 0) {
      throw new Error('Floor price cannot be negative');
    }
  }

  public getNativeCurrency(): number {
    return this.nativeCurrency;
  }

  public getUsd(): number {
    return this.usd;
  }

  public isSignificant(threshold: number = 0.001): boolean {
    return this.nativeCurrency >= threshold;
  }
}
