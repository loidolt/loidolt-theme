/**
 * WCAG 2.x contrast arithmetic, shared by the token tests and by applications that need to pick
 * or validate a colour at runtime (a user-chosen swatch, a generated label). Pure functions over
 * hex strings, so they run anywhere — build scripts, servers, and the browser.
 *
 * @see https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */

export type ContrastLevel = 'AA' | 'AAA';
export type TextSize = 'normal' | 'large';

export interface ContrastValidation {
  ratio: number;
  /** `ratio` to two decimals, e.g. `'4.52:1'`. */
  ratioString: string;
  passesAANormal: boolean;
  passesAALarge: boolean;
  passesAAANormal: boolean;
  passesAAALarge: boolean;
}

/** Minimum ratio per level and text size. Large text is 18.66px bold or 24px regular and up. */
export const contrastRequirements = {
  AA: { normal: 4.5, large: 3 },
  AAA: { normal: 7, large: 4.5 },
} as const satisfies Record<ContrastLevel, Record<TextSize, number>>;

const channels = (hex: string, caller: string): [number, number, number] => {
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(hex.trim());
  if (!match) throw new RangeError(`${caller}: invalid hex colour ${JSON.stringify(hex)}`);
  const digits =
    match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join('') : match[1];
  return [0, 2, 4].map((index) => parseInt(digits.slice(index, index + 2), 16)) as [
    number,
    number,
    number,
  ];
};

const luminanceOf = (hex: string, caller: string) => {
  const [r, g, b] = channels(hex, caller)
    .map((channel) => channel / 255)
    // 0.04045 is the sRGB specification's threshold; the 0.03928 in older WCAG text is a typo
    // the working group has since corrected. The difference never changes a pass/fail result.
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Relative luminance, from 0 (black) to 1 (white). Accepts `#rgb` and `#rrggbb`. */
export function getLuminance(hex: string): number {
  return luminanceOf(hex, 'getLuminance');
}

/** Contrast ratio between two colours, from 1 to 21. Order does not matter. */
export function getContrastRatio(foreground: string, background: string): number {
  const [high, low] = [
    luminanceOf(foreground, 'getContrastRatio'),
    luminanceOf(background, 'getContrastRatio'),
  ].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

/** Whether a pair clears the WCAG threshold for the given level and text size. */
export function meetsContrast(
  foreground: string,
  background: string,
  { level = 'AA', size = 'normal' }: { level?: ContrastLevel; size?: TextSize } = {}
): boolean {
  return getContrastRatio(foreground, background) >= contrastRequirements[level][size];
}

/** Every threshold at once, for reporting. */
export function validateContrast(foreground: string, background: string): ContrastValidation {
  const ratio = getContrastRatio(foreground, background);
  return {
    ratio,
    ratioString: `${ratio.toFixed(2)}:1`,
    passesAANormal: ratio >= contrastRequirements.AA.normal,
    passesAALarge: ratio >= contrastRequirements.AA.large,
    passesAAANormal: ratio >= contrastRequirements.AAA.normal,
    passesAAALarge: ratio >= contrastRequirements.AAA.large,
  };
}

/**
 * Whichever of two inks reads better on `background` — by measured ratio, not a luminance
 * cut-off, so it stays right for any pair you pass. Defaults to the theme's own deep ink and
 * panel, rather than pure black and white.
 */
export function getContrastTextColor(
  background: string,
  { dark = '#20231d', light = '#f5f2e9' }: { dark?: string; light?: string } = {}
): string {
  return getContrastRatio(dark, background) >= getContrastRatio(light, background) ? dark : light;
}
