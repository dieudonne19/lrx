import { Screen, ScreenBody } from '@/components/lrx';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DEFAULT_TAP_OFFSET_MS } from '@/lib/lrx-store';
import type { DefaultSpeed, SettingsPreferences, ThemePreference } from '@/lib/lrx-ui-types';
import { Stack } from 'expo-router';
import {
  ArrowLeft,
  Gauge,
  Minus,
  Plus,
  Timer,
  Moon,
  ScrollText,
  ShieldAlert,
  Smartphone,
  Sun,
  Vibrate,
  type LucideIcon,
} from 'lucide-react-native';
import type * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

const THEMES: { id: ThemePreference; label: string; icon: LucideIcon }[] = [
  { id: 'system', label: 'Système', icon: Smartphone },
  { id: 'dark', label: 'Sombre', icon: Moon },
  { id: 'light', label: 'Clair', icon: Sun },
];

const SPEEDS: DefaultSpeed[] = [0.5, 1, 1.5];
const OFFSET_STEP_MS = 10;
const MAX_OFFSET_MS = 300;

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
          <View className="flex-row items-center justify-between px-3 pb-2 pt-3">
            <Button variant="ghost" size="icon" accessibilityLabel="Retour" onPress={onBack} className="size-12 rounded-full">
              <Icon as={ArrowLeft} className="size-5 text-foreground" />
            </Button>
            <Text className="text-sm font-semibold text-foreground">Réglages</Text>
            <View className="size-12" />
          </View>

          <ScrollView className="flex-1" contentContainerClassName="pb-6" showsVerticalScrollIndicator={false}>
            <View className="px-5 pb-[18px] pt-3.5">
              <Text className="text-[28px] font-semibold leading-8 tracking-[-0.7px] text-foreground">Réglages</Text>
              <Text className="mt-2 text-xs leading-4 text-muted-foreground">
                Comportement de l’éditeur, export, apparence.
              </Text>
            </View>

            <SectionTitle>Apparence</SectionTitle>
            <SettingsRow icon={Moon} label="Thème" />
            <Segmented
              label="Thème"
              options={THEMES.map((theme) => ({ id: theme.id, label: theme.label, icon: theme.icon }))}
              value={preferences.theme}
              onChange={(theme) => update({ theme })}
            />

            <SectionTitle>Édition</SectionTitle>
            <SettingsRow
              icon={Vibrate}
              label="Vibration au tap"
              description="Vibration courte sur TAP TIME."
              toggle={{ value: preferences.haptics, onChange: (haptics) => update({ haptics }) }}
            />
            <SettingsRow
              icon={ScrollText}
              label="Défilement automatique"
              description="Garde la ligne active visible."
              toggle={{ value: preferences.autoScroll, onChange: (autoScroll) => update({ autoScroll }) }}
            />
            <SettingsRow
              icon={Timer}
              label="Décalage TAP TIME"
              description="Retiré du timestamp pour compenser ta réaction et la latence audio."
              trailing={
                <Stepper
                  label="Décalage TAP TIME"
                  value={preferences.tapOffsetMs ?? DEFAULT_TAP_OFFSET_MS}
                  unit="ms"
                  step={OFFSET_STEP_MS}
                  min={0}
                  max={MAX_OFFSET_MS}
                  onChange={(tapOffsetMs) => update({ tapOffsetMs })}
                />
              }
            />
            <SettingsRow icon={Gauge} label="Vitesse par défaut" description="Appliquée à l’ouverture de l’éditeur." />
            <Segmented
              label="Vitesse par défaut"
              mono
              options={SPEEDS.map((speed) => ({ id: speed, label: `${speed}×` }))}
              value={preferences.defaultSpeed}
              onChange={(defaultSpeed) => update({ defaultSpeed })}
            />

            <SectionTitle>Export</SectionTitle>
            <SettingsRow
              icon={ShieldAlert}
              label="Confirmer un export incomplet"
              description="Avertit si des lignes n’ont pas de timestamp."
              toggle={{
                value: preferences.confirmUnsyncedExport,
                onChange: (confirmUnsyncedExport) => update({ confirmUnsyncedExport }),
              }}
            />

            <Text className="px-5 pb-2 pt-6 text-center font-mono text-[11px] text-subtle">LRX v0.1</Text>
          </ScrollView>
        </ScreenBody>
      </Screen>
    </>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="px-5 pb-2 pt-3.5 text-[11px] font-semibold uppercase tracking-[1.32px] text-muted-foreground">
      {children}
    </Text>
  );
}

function SettingsRow({
  icon,
  label,
  description,
  toggle,
  trailing,
}: {
  icon: LucideIcon;
  label: string;
  description?: string;
  toggle?: { value: boolean; onChange: (value: boolean) => void };
  trailing?: React.ReactNode;
}) {
  const content = (
    <>
      <View className="size-8 items-center justify-center rounded-lg border border-border bg-card">
        <Icon as={icon} className="size-4 text-secondary-foreground" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-sm text-foreground">{label}</Text>
        {description ? <Text className="mt-0.5 text-xs leading-4 text-muted-foreground">{description}</Text> : null}
      </View>
      {toggle ? <Switch value={toggle.value} /> : null}
      {trailing}
    </>
  );

  if (!toggle) return <View className="min-h-14 flex-row items-center gap-3.5 px-5 py-3.5">{content}</View>;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: toggle.value }}
      onPress={() => toggle.onChange(!toggle.value)}
      className="min-h-14 flex-row items-center gap-3.5 px-5 py-3.5 active:bg-card">
      {content}
    </Pressable>
  );
}

function Switch({ value }: { value: boolean }) {
  return (
    <View className={`h-6 w-11 justify-center rounded-full px-0.5 ${value ? 'items-end bg-primary' : 'items-start bg-input'}`}>
      <View className="size-5 rounded-full bg-white" />
    </View>
  );
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  mono,
}: {
  label: string;
  options: { id: T; label: string; icon?: LucideIcon }[];
  value: T;
  onChange: (value: T) => void;
  mono?: boolean;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="mx-5 mb-1 flex-row gap-1 rounded-xl border border-border bg-card p-1">
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={String(option.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.id)}
            className={`h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg ${selected ? 'bg-foreground' : ''}`}>
            {option.icon ? (
              <Icon as={option.icon} className={`size-4 ${selected ? 'text-background' : 'text-muted-foreground'}`} />
            ) : null}
            <Text
              className={`text-[13px] font-medium ${mono ? 'font-mono' : ''} ${selected ? 'text-background' : 'text-secondary-foreground'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Stepper({
  label,
  value,
  unit,
  step,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  step: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <View className="flex-row items-center">
      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel={`Diminuer : ${label}`}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - step))}
        className="size-11 rounded-full">
        <Icon as={Minus} className="size-4 text-foreground" />
      </Button>
      <Text accessibilityLiveRegion="polite" className="w-14 text-center font-mono text-[13px] font-medium text-foreground">
        {value} {unit}
      </Text>
      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel={`Augmenter : ${label}`}
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + step))}
        className="size-11 rounded-full">
        <Icon as={Plus} className="size-4 text-foreground" />
      </Button>
    </View>
  );
}
