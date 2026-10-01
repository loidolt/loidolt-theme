import type { LngLat } from './types.js';

export interface CoordinateFormat {
  /** `decimal` → `45.52345° N, 122.67621° W`; `dms` → `45° 31′ 24.4″ N, 122° 40′ 34.4″ W`. */
  format?: 'decimal' | 'dms';
  /** Decimal places for `decimal`, or for the seconds in `dms`. */
  precision?: number;
}

function dms(value: number, precision: number): string {
  const absolute = Math.abs(value);
  let degrees = Math.floor(absolute);
  let minutes = Math.floor((absolute - degrees) * 60);
  let seconds = Number(((absolute - degrees - minutes / 60) * 3600).toFixed(precision));
  // Rounding can carry: 59.96″ at one place is 60.0″, which is the next minute.
  if (seconds >= 60) [seconds, minutes] = [0, minutes + 1];
  if (minutes >= 60) [minutes, degrees] = [0, degrees + 1];
  return `${degrees}° ${minutes}′ ${seconds.toFixed(precision)}″`;
}

/**
 * A coordinate as people read it: latitude first, with hemispheres rather than signs.
 * `[-122.676, 45.523]` → `45.52300° N, 122.67600° W`.
 */
export function formatCoordinate(
  [lng, lat]: LngLat,
  { format = 'decimal', precision = format === 'dms' ? 1 : 5 }: CoordinateFormat = {}
): string {
  const part = (value: number, positive: string, negative: string) =>
    `${format === 'dms' ? dms(value, precision) : `${Math.abs(value).toFixed(precision)}°`} ${value >= 0 ? positive : negative}`;
  return `${part(lat, 'N', 'S')}, ${part(lng, 'E', 'W')}`;
}

export interface MeasureFormat {
  unit?: 'metric' | 'imperial';
  locale?: string | string[];
}

const number = (value: number, locale: MeasureFormat['locale'], digits: number) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);

/** `850` → `850 m`, `12400` → `12.4 km`; imperial gives feet and miles. */
export function formatDistance(
  meters: number,
  { unit = 'metric', locale }: MeasureFormat = {}
): string {
  if (unit === 'imperial') {
    const feet = meters * 3.28084;
    if (feet < 1000) return `${number(feet, locale, 0)} ft`;
    const miles = feet / 5280;
    return `${number(miles, locale, miles < 10 ? 1 : 0)} mi`;
  }
  if (meters < 1000) return `${number(meters, locale, 0)} m`;
  const km = meters / 1000;
  return `${number(km, locale, km < 10 ? 1 : 0)} km`;
}

/** `5000` → `5,000 m²`, `2.5e6` → `2.5 km²`; imperial gives acres and square miles. */
export function formatArea(
  squareMeters: number,
  { unit = 'metric', locale }: MeasureFormat = {}
): string {
  if (unit === 'imperial') {
    const acres = squareMeters / 4046.8564224;
    if (acres < 640) return `${number(acres, locale, acres < 10 ? 2 : 1)} ac`;
    return `${number(acres / 640, locale, 1)} mi²`;
  }
  if (squareMeters < 1e6) return `${number(squareMeters, locale, 0)} m²`;
  return `${number(squareMeters / 1e6, locale, 1)} km²`;
}
