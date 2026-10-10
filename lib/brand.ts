// Raw colors for the places that cannot use a class (shadows, gradients, SVG, text shadows).
// Anything that changes with the light/dark theme comes from the CSS tokens in global.css instead
// (useCSSVariable); brand.test.ts checks that these constants match those tokens.

export const PRIMARY = '#7C5CFF';
export const PRIMARY_HI = '#9A82FF';
export const PRIMARY_GRADIENT: [string, string] = [PRIMARY_HI, PRIMARY];

// The brand violet with an opacity, for glows and soft gradients.
export function primaryAlpha(alpha: number) {
  return `rgba(124, 92, 255, ${alpha})`;
}

export type CoverColors = [string, string];

export const COVERS: Record<'violet' | 'rose' | 'green', CoverColors> = {
  violet: [PRIMARY, '#3B2BFF'],
  rose: [PRIMARY, '#F5536D'],
  green: ['#3FD17A', '#0A7F55'],
};

// useCSSVariable can return a number or nothing (before the theme is ready): keep a usable color.
export function cssColor(value: string | number | undefined, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}
