export class CacheError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'CacheError';
  }
}

export class CacheSerializationError extends CacheError {
  constructor(message: string) {
    super(message, 'CACHE_SERIALIZATION_ERROR');
  }
}
