import { LinearGradient } from 'expo-linear-gradient';
import type { ViewProps } from 'react-native';
import { useCSSVariable } from 'uniwind';

// A gradient to a transparent version of the same color: 'transparent' tints the fade gray on some platforms.
function withAlpha(color: string, alpha: number) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return color;
  const value = parseInt(match[1], 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

type FadeProps = ViewProps & { direction: 'up' | 'down' };

// Fades the screen background in from the edge: 'up' is solid at the bottom, 'down' is solid at the top.
function Fade({ direction, style, ...props }: FadeProps) {
  const background = useCSSVariable('--color-background');
  const solid = typeof background === 'string' ? background : '#08090B';
  const clear = withAlpha(solid, 0);
  const colors: [string, string] = direction === 'up' ? [clear, solid] : [solid, clear];

  return <LinearGradient colors={colors} pointerEvents="none" style={style} {...props} />;
}

export { Fade };
