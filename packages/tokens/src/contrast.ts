import type { semanticDefs } from './tokens.js';

/** A full set of colour roles as concrete `#rrggbb` values. */
export type ColorRoles = { readonly [K in keyof typeof semanticDefs]: string };

export interface ContrastCheck {
  /** What the pair is, e.g. `muted text on surface`. */
  name: string;
  foreground: string;
  background: string;
  ratio: number;
  /** 4.5 for text (WCAG 1.4.3), 3 for control boundaries and focus rings (WCAG 1.4.11). */
  required: number;
  pass: boolean;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Relative luminance per WCAG 2.1 §1.4.3. Takes `#rrggbb`. */
export function luminance(hex: string): number {
  if (!HEX.test(hex)) throw new TypeError(`Expected a #rrggbb colour, got ${JSON.stringify(hex)}`);
  const [r, g, b] = [1, 3, 5]
    .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two `#rrggbb` colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

/**
 * Every pairing the stylesheets actually draw, with the ratio WCAG AA asks of it.
 *
 * Small utility text (`--loidolt-font-size-xs`) is well under 18.66px, so every text pair needs
 * the full 4.5:1 rather than the large-text allowance. Decorative hairlines (`border`,
 * `border-soft`) are deliberately lighter and exempt; `border-control` is not, because it is the
 * only thing identifying an input.
 */
export function contrastPairs(
  t: ColorRoles
): Array<[name: string, fg: string, bg: string, required: number]> {
  return [
    ['accent text on background', t.textAccent, t.background, 4.5],
    ['accent text on surface', t.textAccent, t.surface, 4.5],
    ['accent text on surface-alt', t.textAccent, t.surfaceAlt, 4.5],
    ['muted text on background', t.textMuted, t.background, 4.5],
    ['muted text on surface', t.textMuted, t.surface, 4.5],
    // The recessed fill a default badge sits on.
    ['muted text on the sunken surface', t.textMuted, t.surfaceSunken, 4.5],
    ['body text on background', t.text, t.background, 4.5],
    ['body text on surface', t.text, t.surface, 4.5],
    ['inverse text on the inverse surface', t.textInverse, t.surfaceInverse, 4.5],
    ['on-accent over accent', t.onAccent, t.accent, 4.5],
    ['on-accent over accent hover', t.onAccent, t.accentHover, 4.5],
    ['on-danger over danger', t.onDanger, t.danger, 4.5],
    ['on-danger over danger hover', t.onDanger, t.dangerHover, 4.5],
    ['on-success over success', t.onSuccess, t.success, 4.5],
    ['on-warning over warning', t.onWarning, t.warning, 4.5],
    ['on-info over info', t.onInfo, t.info, 4.5],
    ['danger text on surface', t.textDanger, t.surface, 4.5],
    ['danger text on surface-alt', t.textDanger, t.surfaceAlt, 4.5],
    ['success text on surface', t.textSuccess, t.surface, 4.5],
    ['warning text on surface', t.textWarning, t.surface, 4.5],
    ['info text on surface', t.textInfo, t.surface, 4.5],
    ['control border on the input surface', t.borderControl, t.surfaceInput, 3],
    ['control border on background', t.borderControl, t.background, 3],
    ['control border on surface', t.borderControl, t.surface, 3],
    ['control border on surface-alt', t.borderControl, t.surfaceAlt, 3],
    ['focus ring on background', t.focusRing, t.background, 3],
    ['focus ring on surface', t.focusRing, t.surface, 3],
  ];
}

/**
 * Checks a colour role set against WCAG AA. Run it in a test over your own preset's
 * `resolved.light` and `resolved.dark`:
 *
 * ```ts
 * expect(auditContrast(myPreset.resolved.dark).filter((check) => !check.pass)).toEqual([]);
 * ```
 */
export function auditContrast(colors: ColorRoles): ContrastCheck[] {
  return contrastPairs(colors).map(([name, foreground, background, required]) => {
    const ratio = contrastRatio(foreground, background);
    return { name, foreground, background, ratio, required, pass: ratio >= required };
  });
}
