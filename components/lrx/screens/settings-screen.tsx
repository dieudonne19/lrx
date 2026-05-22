import { LrxMark, Screen, ScreenBody } from '@/components/lrx';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { DefaultSpeed, SettingsPreferences } from '@/lib/lrx-ui-types';
import { Stack } from 'expo-router';
import {
  ArrowLeft,
  Gauge,
  Moon,
  ShieldAlert,
  SlidersHorizontal,
  ScrollText,
  Smartphone,
  Sun,
  Vibrate,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

export function SettingsScreen({
  preferences,
  onBack,
  onChange,
}: {
  preferences: SettingsPreferences;
  onBack: () => void;
  onChange: (preferences: SettingsPreferences) => void;
}) {
  function update(next: Partial<SettingsPreferences>) {
    onChange({ ...preferences, ...next });
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen>
        <ScreenBody>
          <View className="flex-row items-center gap-2 px-3 pb-2 pt-3">
            <Button variant="ghost" size="icon" onPress={onBack} className="rounded-full">
              <Icon as={ArrowLeft} className="size-5 text-foreground" />
            </Button>
            <View className="min-w-0 flex-1">
              <Text className="text-lg font-semibold text-foreground">Settings</Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">Workspace et preferences studio</Text>
            </View>
            <View className="size-10 items-center justify-center rounded-full border border-border bg-card">
              <Icon as={SlidersHorizontal} className="size-5 text-primary" />
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="px-5 pb-10 pt-3" showsVerticalScrollIndicator={false}>
            <View className="mb-6 rounded-[24px] border border-primary/25 bg-primary/10 p-5">
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-[2px] text-primary">LRX Studio</Text>
                  <Text className="mt-3 text-[30px] font-semibold leading-9 text-foreground">Sync rapide, controle propre.</Text>
                  <Text className="mt-3 text-sm leading-5 text-muted-foreground">
                    Ces reglages preparent l'experience editor: vitesse, feedback tactile, auto-scroll et securite export.
                  </Text>
                </View>
                <LrxMark />
              </View>
              <View className="mt-5 flex-row gap-2">
                <SettingsStat value={`${preferences.defaultSpeed}x`} label="speed" />
                <SettingsStat value={preferences.autoScroll ? 'ON' : 'OFF'} label="scroll" />
                <SettingsStat value={preferences.haptics ? 'ON' : 'OFF'} label="haptics" />
              </View>
            </View>

            <View className="mb-6">
              <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">Theme</Text>
              <View className="flex-row gap-2">
                <ThemeOption
                  label="System"
                  icon={Smartphone}
                  selected={preferences.theme === 'system'}
                  onPress={() => update({ theme: 'system' })}
                />
                <ThemeOption
                  label="Dark"
                  icon={Moon}
                  selected={preferences.theme === 'dark'}
                  onPress={() => update({ theme: 'dark' })}
                />
                <ThemeOption
                  label="Light"
                  icon={Sun}
                  selected={preferences.theme === 'light'}
                  onPress={() => update({ theme: 'light' })}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">Edition</Text>
              <View className="gap-3">
                <SettingsToggle
                  icon={Vibrate}
                  title="Feedback tactile"
                  description="Vibration courte sur Tap Time, undo et navigation de lignes."
                  enabled={preferences.haptics}
                  onPress={() => update({ haptics: !preferences.haptics })}
                />
                <SettingsToggle
                  icon={ScrollText}
                  title="Auto-scroll lyrics"
                  description="Garde la ligne active visible pendant la lecture et le tapping."
                  enabled={preferences.autoScroll}
                  onPress={() => update({ autoScroll: !preferences.autoScroll })}
                />
                <SettingsToggle
                  icon={ShieldAlert}
                  title="Confirmer export incomplet"
                  description="Avertit avant de partager un .lrc avec des lignes non synchronisees."
                  enabled={preferences.confirmUnsyncedExport}
                  onPress={() => update({ confirmUnsyncedExport: !preferences.confirmUnsyncedExport })}
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="mb-3 text-xs font-semibold uppercase tracking-[1.8px] text-muted-foreground">Vitesse par defaut</Text>
              <View className="rounded-2xl border border-border bg-card p-2">
                <View className="flex-row gap-2">
                  {([0.5, 1, 1.5] as const).map((speed) => (
                    <SpeedOption
                      key={speed}
                      speed={speed}
                      selected={preferences.defaultSpeed === speed}
                      onPress={() => update({ defaultSpeed: speed })}
                    />
                  ))}
                </View>
                <View className="mt-4 flex-row items-center gap-2 px-2 pb-1">
                  <Icon as={Gauge} className="size-4 text-muted-foreground" />
                  <Text className="flex-1 text-xs leading-4 text-muted-foreground">
                    Appliquee aux nouveaux projets; l'editeur garde ensuite sa vitesse de session.
                  </Text>
                </View>
              </View>
            </View>

            <View className="rounded-2xl border border-border bg-card px-4 py-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-semibold text-foreground">Workspace</Text>
                  <Text className="mt-1 text-xs text-muted-foreground">Local prototype - stockage reel a venir</Text>
                </View>
                <Text className="font-mono text-xs text-primary">v0.1</Text>
              </View>
            </View>
          </ScrollView>
        </ScreenBody>
      </Screen>
    </>
  );
}

function SettingsStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-primary/20 bg-background/50 px-3 py-3">
      <Text className="font-mono text-base font-semibold text-foreground">{value}</Text>
      <Text className="mt-1 text-[10px] uppercase tracking-[1.5px] text-muted-foreground">{label}</Text>
    </View>
  );
}

function ThemeOption({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-24 flex-1 items-center justify-center gap-2 rounded-2xl border ${
        selected ? 'border-primary bg-primary' : 'border-border bg-card'
      }`}>
      <Icon as={icon} className={`size-5 ${selected ? 'text-primary-foreground' : 'text-foreground'}`} />
      <Text className={`text-sm font-semibold ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>{label}</Text>
    </Pressable>
  );
}

function SpeedOption({
  speed,
  selected,
  onPress,
}: {
  speed: DefaultSpeed;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-12 flex-1 items-center justify-center rounded-xl ${
        selected ? 'bg-foreground' : 'bg-background'
      }`}>
      <Text className={`font-mono text-sm font-semibold ${selected ? 'text-background' : 'text-muted-foreground'}`}>{speed}x</Text>
    </Pressable>
  );
}

function SettingsToggle({
  icon,
  title,
  description,
  enabled,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="size-11 items-center justify-center rounded-2xl bg-background">
        <Icon as={icon} className={`size-5 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="mt-1 text-xs leading-4 text-muted-foreground">{description}</Text>
      </View>
      <View className={`h-8 w-14 justify-center rounded-full px-1 ${enabled ? 'items-end bg-primary' : 'items-start bg-input'}`}>
        <View className="size-6 rounded-full bg-white" />
      </View>
    </Pressable>
  );
}
