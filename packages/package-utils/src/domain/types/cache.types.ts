export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStats {
  totalKeys: number;
  expiredKeys: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  oldestEntryAge?: number;
}
