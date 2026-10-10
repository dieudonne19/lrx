import { OnboardingScreen } from '@/components/lrx/screens';
import { router } from 'expo-router';

export default function OnboardingRoute() {
  return <OnboardingScreen onComplete={() => router.replace('/')} />;
}
