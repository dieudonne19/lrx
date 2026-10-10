import * as fs from 'fs';
import * as path from 'path';
import { COVERS, cssColor, PRIMARY, PRIMARY_GRADIENT, PRIMARY_HI, primaryAlpha } from '../brand';
import { THEME } from '../theme';

// global.css is the source of truth for the UI colors; these tests fail when the JS copies drift from it.
const css = fs.readFileSync(path.join(__dirname, '../../global.css'), 'utf8');

function tokens(mode: 'light' | 'dark') {
  const start = css.indexOf(`@variant ${mode} {`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...block.matchAll(/--color-([a-z-]+):\s*(#[0-9A-Fa-f]{6});/g)].map((match) => [match[1], match[2].toUpperCase()])
  );
}

describe.each(['light', 'dark'] as const)('navigation theme (%s)', (mode) => {
  const cssTokens = tokens(mode);

  it('reads the same tokens as the stylesheet', () => {
    for (const [name, value] of Object.entries(THEME[mode])) {
      expect({ name, value: value.toUpperCase() }).toEqual({ name, value: cssTokens[name] });
    }
  });
});

describe('brand colors', () => {
  it('match the dark theme tokens', () => {
    const dark = tokens('dark');
    expect(PRIMARY.toUpperCase()).toBe(dark.primary);
    expect(PRIMARY_HI.toUpperCase()).toBe(dark['primary-hi']);
  });

  it('builds the gradient from the two brand violets', () => {
    expect(PRIMARY_GRADIENT).toEqual([PRIMARY_HI, PRIMARY]);
  });

  it('writes the brand violet with an opacity', () => {
    const value = parseInt(PRIMARY.slice(1), 16);
    const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
    expect(primaryAlpha(0.5)).toBe(`rgba(${r}, ${g}, ${b}, 0.5)`);
  });

  it('starts the default cover from the brand violet', () => {
    expect(COVERS.violet[0]).toBe(PRIMARY);
  });
});

describe('cssColor', () => {
  it('keeps a color string and falls back otherwise', () => {
    expect(cssColor('#123456', '#000000')).toBe('#123456');
    expect(cssColor(undefined, '#000000')).toBe('#000000');
    expect(cssColor(16, '#000000')).toBe('#000000');
  });
});
