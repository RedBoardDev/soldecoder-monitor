/**
 * Alternative object-based API for better readability
 */
export const time = {
  ms: (value: number) => value,
  seconds: (value: number) => value * 1000,
  minutes: (value: number) => value * 60 * 1000,
  hours: (value: number) => value * 60 * 60 * 1000,
  days: (value: number) => value * 24 * 60 * 60 * 1000,
  weeks: (value: number) => value * 7 * 24 * 60 * 60 * 1000,
} as const;
