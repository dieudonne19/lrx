import { SettingsScreen } from '@/components/lrx/screens';
import { goBackOrHome } from '@/lib/navigation';
import { useLrxStore } from '@/lib/lrx-store';

export default function SettingsRoute() {
  const settings = useLrxStore((state) => state.settings);
  const updateSettings = useLrxStore((state) => state.updateSettings);

  return <SettingsScreen preferences={settings} onBack={goBackOrHome} onChange={updateSettings} />;
}
