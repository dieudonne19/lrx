import { OnboardingScreen } from '@/components/lrx/screens';
import { useLrxStore } from '@/lib/lrx-store';
import { router } from 'expo-router';

export default function OnboardingRoute() {
  const completeOnboarding = useLrxStore((state) => state.completeOnboarding);

  return (
    <OnboardingScreen
      onComplete={() => {
        completeOnboarding();
        router.replace('/');
      }}
    />
  );
}
