import * as Haptics from 'expo-haptics';

export function tapFeedback(enabled: boolean) {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
