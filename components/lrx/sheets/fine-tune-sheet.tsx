import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatTime } from '@/lib/lrx-editor-utils';
import type { LyricLineData } from '@/lib/lrx-ui-types';
import { Minus, Plus, Save, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { Sheet, SheetHeader } from './sheet';

export function FineTuneSheet({
  line,
  index,
  time,
  duration,
  onClose,
  onSave,
}: {
  line?: LyricLineData;
  index: number;
  time: number;
  duration: number;
  onClose: () => void;
  onSave: (time: number) => void;
}) {
  const [draftTime, setDraftTime] = React.useState(time);
  const progress = Math.max(0, Math.min(1, draftTime / duration));

  function nudge(delta: number) {
    setDraftTime((current) => Math.max(0, Math.min(duration, current + delta)));
  }

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="Ajuster le timing" subtitle="Règle le timestamp de la ligne active avec précision." onClose={onClose} />

      <View className="rounded-2xl border border-border bg-card px-4 py-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-mono text-xs text-muted-foreground">LIGNE {String(index + 1).padStart(2, '0')}</Text>
          <Text className="font-mono text-xs text-primary">{line?.t == null ? 'nouveau timestamp' : 'timestamp existant'}</Text>
        </View>
        <Text className="text-xl font-semibold leading-7 text-foreground">{line?.text || 'Aucune ligne active'}</Text>
      </View>

      <View className="mt-5 items-center rounded-3xl border border-primary/25 bg-primary/10 px-5 py-6">
        <Text className="font-mono text-[42px] font-semibold leading-[48px] text-foreground">{formatTime(draftTime)}</Text>
        <Text className="mt-1 font-mono text-xs text-muted-foreground">
          {draftTime >= time ? '+' : '-'}
          {Math.abs(draftTime - time).toFixed(2)}s vs current
        </Text>
      </View>

      <View className="mt-5">
        <FineTuneTrack progress={progress} duration={duration} onChange={setDraftTime} />
      </View>

      <View className="mt-5 flex-row gap-2">
        <NudgeButton label="-0.25" icon={Minus} onPress={() => nudge(-0.25)} />
        <NudgeButton label="-0.05" icon={Minus} onPress={() => nudge(-0.05)} />
        <NudgeButton label="+0.05" icon={Plus} onPress={() => nudge(0.05)} />
        <NudgeButton label="+0.25" icon={Plus} onPress={() => nudge(0.25)} />
      </View>

      <View className="mt-5 flex-row gap-2">
        <Button variant="outline" onPress={onClose} className="h-14 flex-1 rounded-2xl bg-card">
          <Text>Annuler</Text>
        </Button>
        <Button onPress={() => onSave(draftTime)} disabled={!line?.text} className="h-14 flex-1 rounded-2xl">
          <Icon as={Save} className="size-5 text-primary-foreground" />
          <Text>Appliquer</Text>
        </Button>
      </View>
    </Sheet>
  );
}

function FineTuneTrack({
  progress,
  duration,
  onChange,
}: {
  progress: number;
  duration: number;
  onChange: (time: number) => void;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(280, windowWidth - 40);
  const x = Math.max(0, Math.min(width, progress * width));

  return (
    <Pressable
      onPress={(event) => onChange(Math.max(0, Math.min(duration, (event.nativeEvent.locationX / width) * duration)))}
      className="h-12 justify-center">
      <View className="h-2 overflow-hidden rounded-full bg-input">
        <View className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>
      <View className="absolute top-3 size-6 rounded-full border-4 border-background bg-primary" style={{ left: x - 12 }} />
    </Pressable>
  );
}

function NudgeButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
}) {
  return (
    <Button variant="outline" onPress={onPress} className="h-12 flex-1 rounded-xl bg-card px-0">
      <Icon as={icon} className="size-4 text-foreground" />
      <Text className="font-mono text-xs">{label}</Text>
    </Button>
  );
}
