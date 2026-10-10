import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_500Medium, GeistMono_600SemiBold } from '@expo-google-fonts/geist-mono';

export const FONT_ASSETS = {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
};

// React Native does not synthesize weights for custom fonts, so each weight maps to its own family.
export function resolveFontFamily(className?: string) {
  const classes = className ?? '';
  const mono = /(^|\s)font-mono(\s|$)/.test(classes);
  const bold = /(^|\s)font-(bold|extrabold|black)(\s|$)/.test(classes);
  const semibold = /(^|\s)font-semibold(\s|$)/.test(classes);
  const medium = /(^|\s)font-medium(\s|$)/.test(classes);

  if (mono) return semibold || bold ? 'GeistMono_600SemiBold' : medium ? 'GeistMono_500Medium' : 'GeistMono_400Regular';
  if (bold) return 'Geist_700Bold';
  if (semibold) return 'Geist_600SemiBold';
  if (medium) return 'Geist_500Medium';
  return 'Geist_400Regular';
}
